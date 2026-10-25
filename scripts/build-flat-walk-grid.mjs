// Builds the walkable grid for the 3D flat walkthrough from a Blender-exported GLB.
// Usage: node scripts/build-flat-walk-grid.mjs <model.glb> <out.json>
// Walls and balcony glass are rasterised from their vertical faces so thin walls
// and openings stay accurate; furniture uses its footprint box. Ceilings, floors
// and door leaves are ignored so doorways stay open.
import fs from 'node:fs';

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error('usage: node scripts/build-flat-walk-grid.mjs <model.glb> <out.json>');
  process.exit(1);
}

const CELL = 0.1;
const GRID = { x0: -0.4, z0: -14.0, x1: 9.6, z1: 0.4 };
const FLOOR = { x0: 0, z0: -13.6, x1: 9.2, z1: 0 };
const BAND = { y0: 0.15, y1: 1.75 };
const SPAWN = { x: 0.85, z: -0.5, lookX: 1.3, lookZ: -1 };

const buf = fs.readFileSync(src);
const jl = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jl).toString('utf8'));
const bin = buf.subarray(20 + jl + 8);

const N = json.nodes.length;
const parent = new Array(N).fill(-1);
json.nodes.forEach((n, i) => (n.children || []).forEach((c) => (parent[c] = i)));

function localMatrix(n) {
  if (n.matrix) return n.matrix.slice();
  const [x, y, z, w] = n.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = n.scale || [1, 1, 1];
  const [tx, ty, tz] = n.translation || [0, 0, 0];
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return [
    (1 - 2 * (yy + zz)) * sx, 2 * (xy + wz) * sx, 2 * (xz - wy) * sx, 0,
    2 * (xy - wz) * sy, (1 - 2 * (xx + zz)) * sy, 2 * (yz + wx) * sy, 0,
    2 * (xz + wy) * sz, 2 * (yz - wx) * sz, (1 - 2 * (xx + yy)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

function mul(a, b) {
  const r = new Array(16).fill(0);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    r[i * 4 + j] = s;
  }
  return r;
}

const worldCache = new Array(N);
function world(i) {
  if (worldCache[i]) return worldCache[i];
  const l = localMatrix(json.nodes[i]);
  worldCache[i] = parent[i] >= 0 ? mul(world(parent[i]), l) : l;
  return worldCache[i];
}

const apply = (M, x, y, z) => [
  M[0] * x + M[4] * y + M[8] * z + M[12],
  M[1] * x + M[5] * y + M[9] * z + M[13],
  M[2] * x + M[6] * y + M[10] * z + M[14],
];

function readAccessor(idx) {
  const a = json.accessors[idx];
  const bv = json.bufferViews[a.bufferView];
  const comps = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const size = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
  const stride = bv.byteStride || comps * size;
  const base = (bv.byteOffset || 0) + (a.byteOffset || 0);
  const outArr = new Array(a.count);
  for (let k = 0; k < a.count; k++) {
    const o = base + k * stride;
    if (a.componentType === 5126) outArr[k] = [0, 1, 2].map((c) => bin.readFloatLE(o + c * 4));
    else if (a.componentType === 5125) outArr[k] = bin.readUInt32LE(o);
    else if (a.componentType === 5123) outArr[k] = bin.readUInt16LE(o);
    else outArr[k] = bin.readUInt8(o);
  }
  return outArr;
}

const cols = Math.round((GRID.x1 - GRID.x0) / CELL);
const rows = Math.round((GRID.z1 - GRID.z0) / CELL);
const blocked = new Uint8Array(cols * rows);
const mark = (x, z) => {
  const ix = Math.floor((x - GRID.x0) / CELL), iz = Math.floor((z - GRID.z0) / CELL);
  if (ix >= 0 && iz >= 0 && ix < cols && iz < rows) blocked[iz * cols + ix] = 1;
};

// every triangle that reaches body height is sampled across its area, so thin walls
// (zero-area when seen from above) and the real outline of L-shaped furniture both land
// on the grid; a bounding box would close off the open corners of a sofa
const SAMPLE = 0.04;
const markTriangle = (a, b, c) => {
  const n = Math.max(1, Math.ceil(Math.max(
    Math.hypot(b[0] - a[0], b[2] - a[2]),
    Math.hypot(c[0] - a[0], c[2] - a[2]),
    Math.hypot(c[0] - b[0], c[2] - b[2]),
  ) / SAMPLE));
  for (let i = 0; i <= n; i++) {
    for (let j = 0; i + j <= n; j++) {
      const u = i / n, v = j / n;
      mark(a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v, a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v);
    }
  }
};

const stats = { meshes: 0, skipped: 0 };
json.nodes.forEach((n, i) => {
  if (n.mesh === undefined || !n.name) return;
  if (/^(Ceilings|Floors|Cam_|Walkthrough)/.test(n.name) || /door leaf/i.test(n.name)) { stats.skipped++; return; }
  stats.meshes++;
  const M = world(i);
  for (const prim of json.meshes[n.mesh].primitives) {
    const pos = readAccessor(prim.attributes.POSITION).map((p) => apply(M, p[0], p[1], p[2]));
    const idx = prim.indices !== undefined ? readAccessor(prim.indices) : pos.map((_, k) => k);
    for (let t = 0; t + 2 < idx.length; t += 3) {
      const tri = [pos[idx[t]], pos[idx[t + 1]], pos[idx[t + 2]]];
      const tyMin = Math.min(...tri.map((p) => p[1])), tyMax = Math.max(...tri.map((p) => p[1]));
      if (tyMax < BAND.y0 || tyMin > BAND.y1) continue;
      markTriangle(tri[0], tri[1], tri[2]);
    }
  }
});

// walkable = inside the flat's floor and not blocked
const walk = new Uint8Array(cols * rows);
for (let iz = 0; iz < rows; iz++) for (let ix = 0; ix < cols; ix++) {
  const x = GRID.x0 + (ix + 0.5) * CELL, z = GRID.z0 + (iz + 0.5) * CELL;
  const inside = x > FLOOR.x0 && x < FLOOR.x1 && z > FLOOR.z0 && z < FLOOR.z1;
  walk[iz * cols + ix] = inside && !blocked[iz * cols + ix] ? 1 : 0;
}

// packed bits, row-major, base64
const bytes = new Uint8Array(Math.ceil(walk.length / 8));
walk.forEach((v, k) => { if (v) bytes[k >> 3] |= 1 << (k & 7); });
const data = Buffer.from(bytes).toString('base64');

// flood fill from the spawn to report which parts of the flat are reachable
const si = Math.floor((SPAWN.z - GRID.z0) / CELL) * cols + Math.floor((SPAWN.x - GRID.x0) / CELL);
const seen = new Uint8Array(walk.length);
const queue = [si];
seen[si] = 1;
while (queue.length) {
  const k = queue.pop();
  const ix = k % cols, iz = (k - ix) / cols;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx2 = ix + dx, nz2 = iz + dz;
    if (nx2 < 0 || nz2 < 0 || nx2 >= cols || nz2 >= rows) continue;
    const nk = nz2 * cols + nx2;
    if (walk[nk] && !seen[nk]) { seen[nk] = 1; queue.push(nk); }
  }
}
const walkable = walk.reduce((s, v) => s + v, 0);
const reachable = seen.reduce((s, v) => s + v, 0);

// ascii preview at 0.2 m: '.' reachable from spawn, '-' walkable but cut off, '#' blocked
let preview = '';
for (let iz = 0; iz < rows; iz += 2) {
  let line = '';
  for (let ix = 0; ix < cols; ix += 2) {
    const k = iz * cols + ix;
    line += seen[k] ? '.' : walk[k] ? '-' : '#';
  }
  preview += line + '\n';
}

fs.writeFileSync(out, JSON.stringify({ cell: CELL, x0: GRID.x0, z0: GRID.z0, cols, rows, data, spawn: SPAWN }));
console.log(JSON.stringify({ ...stats, cols, rows, walkableCells: walkable, reachableCells: reachable, bytes: data.length }));
console.log(preview);
