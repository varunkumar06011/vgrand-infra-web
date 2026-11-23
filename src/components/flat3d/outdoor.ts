import * as THREE from 'three';
import type { Quality, Rect } from './kit';
import { rng, type Rng } from './textures';

/**
 * The view from the windows: Koppolu on the edge of Ongole as it looks from a fourth-floor flat —
 * flat-roofed two- and three-storey houses in pastel paint with black water tanks on the roof,
 * coconut palms and neem trees between them, the project's sister towers, an overhead water
 * tank, a cell tower and a temple gopuram on the skyline, all under the coastal Andhra sky.
 *
 * Everything is generated here: buildings merge into one mesh, trees are instanced, so the whole
 * town costs a handful of draw calls.
 */

/** ground level, metres below the flat's floor */
export const GROUND = -10.4;
const FLOOR = 3.05;

type V3 = [number, number, number];

/* ------------------------------------------------------------------ geometry builder */

/** accumulates coloured, textured triangles; boxes take their UVs from the facade texture */
class Geo {
  pos: number[] = []; nor: number[] = []; uv: number[] = []; col: number[] = []; idx: number[] = [];
  private n = 0;

  private quad(p: V3[], nrm: V3, uvs: [number, number][], c: THREE.Color) {
    for (let i = 0; i < 4; i++) {
      this.pos.push(...p[i]); this.nor.push(...nrm); this.uv.push(...uvs[i]); this.col.push(c.r, c.g, c.b);
    }
    const n = this.n;
    this.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    this.n += 4;
  }

  /**
   * Box with its base centre at (x, y, z), turned `a` about vertical. `facade` maps the sides to the
   * window grid (one cell = 3 m × one storey); otherwise every face samples a plain patch of wall.
   * `u0` slides the grid sideways so neighbouring houses light different windows at night.
   */
  box(w: number, h: number, d: number, x: number, y: number, z: number, a: number, c: THREE.Color, facade = false, u0 = 0, top?: THREE.Color) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const P = (lx: number, ly: number, lz: number): V3 => [x + lx * ca + lz * sa, y + ly, z - lx * sa + lz * ca];
    const N = (lx: number, ly: number, lz: number): V3 => [lx * ca + lz * sa, ly, -lx * sa + lz * ca];
    const hw = w / 2, hd = d / 2;
    const plain: [number, number][] = [[PLAIN_U, PLAIN_V], [PLAIN_U, PLAIN_V], [PLAIN_U, PLAIN_V], [PLAIN_U, PLAIN_V]];
    const side = (len: number, off: number): [number, number][] => facade
      ? [[u0 + off / FAC_W, (y - GROUND) / FAC_H], [u0 + (off + len) / FAC_W, (y - GROUND) / FAC_H], [u0 + (off + len) / FAC_W, (y - GROUND + h) / FAC_H], [u0 + off / FAC_W, (y - GROUND + h) / FAC_H]]
      : plain;
    // +z, -z, +x, -x, top, bottom (counter-clockwise from outside)
    this.quad([P(-hw, 0, hd), P(hw, 0, hd), P(hw, h, hd), P(-hw, h, hd)], N(0, 0, 1), side(w, 0), c);
    this.quad([P(hw, 0, -hd), P(-hw, 0, -hd), P(-hw, h, -hd), P(hw, h, -hd)], N(0, 0, -1), side(w, w * 0.37), c);
    this.quad([P(hw, 0, hd), P(hw, 0, -hd), P(hw, h, -hd), P(hw, h, hd)], N(1, 0, 0), side(d, 1.3), c);
    this.quad([P(-hw, 0, -hd), P(-hw, 0, hd), P(-hw, h, hd), P(-hw, h, -hd)], N(-1, 0, 0), side(d, 2.1), c);
    this.quad([P(-hw, h, hd), P(hw, h, hd), P(hw, h, -hd), P(-hw, h, -hd)], [0, 1, 0], plain, top ?? c);
    this.quad([P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)], [0, -1, 0], plain, c);
  }

  /** upright cylinder (tanks, poles, columns) */
  cyl(r0: number, r1: number, h: number, x: number, y: number, z: number, c: THREE.Color, seg = 10, cap = true) {
    const plain: [number, number] = [PLAIN_U, PLAIN_V];
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const sl = (r0 - r1) / h;
      const n0: V3 = [c0, sl, s0], n1: V3 = [c1, sl, s1];
      const st = this.n;
      for (const [p, nn] of [[[x + c0 * r0, y, z + s0 * r0], n0], [[x + c1 * r0, y, z + s1 * r0], n1], [[x + c1 * r1, y + h, z + s1 * r1], n1], [[x + c0 * r1, y + h, z + s0 * r1], n0]] as [V3, V3][]) {
        this.pos.push(...p); this.nor.push(...nn); this.uv.push(...plain); this.col.push(c.r, c.g, c.b);
      }
      this.idx.push(st, st + 2, st + 1, st, st + 3, st + 2);
      this.n += 4;
      if (cap && r1 > 0) {
        const t = this.n;
        for (const p of [[x, y + h, z], [x + c0 * r1, y + h, z + s0 * r1], [x + c1 * r1, y + h, z + s1 * r1]] as V3[]) {
          this.pos.push(...p); this.nor.push(0, 1, 0); this.uv.push(...plain); this.col.push(c.r, c.g, c.b);
        }
        this.idx.push(t, t + 2, t + 1);
        this.n += 3;
      }
    }
  }

  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    return g;
  }
}

/* ------------------------------------------------------------------ painted textures */

/** the facade texture spans 4 window bays × 4 storeys */
const FAC_W = 12, FAC_H = 4 * FLOOR;
/** a patch of bare wall inside the first bay (between the window and the next) */
const PLAIN_U = 0.25 / FAC_W, PLAIN_V = 2.55 / FAC_H;

function paint(w: number, h: number, fn: (g: CanvasRenderingContext2D) => void, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  fn(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** wall, grilled windows under concrete sunshades, a slab line per storey; and which windows are lit at night */
function facadeTex(size: number, r: Rng): { map: THREE.CanvasTexture; lit: THREE.CanvasTexture } {
  const px = size / FAC_W, py = size / FAC_H;
  const cells: { x: number; y: number; w: number; h: number; door: boolean; lit: boolean; warm: boolean }[] = [];
  for (let f = 0; f < 4; f++) for (let b = 0; b < 4; b++) {
    const door = r() < 0.22;
    const ww = door ? 1.0 : 1.1 + r() * 0.5, wh = door ? 2.1 : 1.3;
    const x0 = b * 3 + 0.9 + (r() - 0.5) * 0.3, y0 = f * FLOOR + (door ? 0.05 : 0.9);
    cells.push({ x: x0, y: y0, w: ww, h: wh, door, lit: r() < 0.42, warm: r() < 0.8 });
  }
  const Y = (m: number) => size - m * py;
  const map = paint(size, size, (g) => {
    g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, size, size);
    // weathering: monsoon streaks under the sills and a faint grime gradient per storey
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(60,55,45,${0.02 + r() * 0.05})`;
      g.fillRect(r() * size, r() * size, 1 + r() * 3, 8 + r() * 40);
    }
    for (let f = 0; f < 4; f++) {
      // floor slab band
      g.fillStyle = 'rgba(0,0,0,0.13)'; g.fillRect(0, Y(f * FLOOR + 0.16), size, 0.16 * py);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, Y(f * FLOOR + 0.2), size, 0.04 * py);
    }
    for (const c of cells) {
      // the sunshade (chajja) and its shadow
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect((c.x - 0.25) * px, Y(c.y + c.h + 0.32), (c.w + 0.5) * px, 0.3 * py);
      g.fillStyle = '#d9d4ca'; g.fillRect((c.x - 0.3) * px, Y(c.y + c.h + 0.42), (c.w + 0.6) * px, 0.1 * py);
      // dark glass with a hint of sky reflection, then the grill
      const gr = g.createLinearGradient(0, Y(c.y + c.h), 0, Y(c.y));
      gr.addColorStop(0, c.door ? '#2b2c2e' : '#45505a'); gr.addColorStop(1, '#1d2024');
      g.fillStyle = gr; g.fillRect(c.x * px, Y(c.y + c.h), c.w * px, c.h * py);
      g.strokeStyle = c.door ? '#6b5a48' : '#e9e6df'; g.lineWidth = Math.max(1, px * 0.05);
      g.strokeRect(c.x * px, Y(c.y + c.h), c.w * px, c.h * py);
      g.strokeStyle = 'rgba(30,30,30,0.85)'; g.lineWidth = Math.max(1, px * 0.025);
      if (!c.door) for (let k = 1; k < 7; k++) { const xx = (c.x + (c.w * k) / 7) * px; g.beginPath(); g.moveTo(xx, Y(c.y + c.h)); g.lineTo(xx, Y(c.y)); g.stroke(); }
      if (c.door) {
        // a balcony door: the parapet of the balcony across its lower part
        g.fillStyle = '#e7e2d8'; g.fillRect((c.x - 0.4) * px, Y(c.y + 1.0), (c.w + 0.8) * px, 1.0 * py);
        g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect((c.x - 0.4) * px, Y(c.y + 1.05), (c.w + 0.8) * px, 0.08 * py);
      }
    }
  });
  const lit = paint(size, size, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, size, size);
    for (const c of cells) {
      if (!c.lit) continue;
      g.fillStyle = c.warm ? '#ffcf8a' : '#e6f1ff';
      g.fillRect(c.x * px, Y(c.y + c.h), c.w * px, c.h * py);
      if (c.door) { g.fillStyle = '#000'; g.fillRect((c.x - 0.4) * px, Y(c.y + 1.0), (c.w + 0.8) * px, 1.0 * py); }
    }
  });
  return { map, lit };
}

/** one coconut frond: a stiff midrib with long drooping leaflets either side */
function frondTex(r: Rng) {
  return paint(256, 64, (g) => {
    g.clearRect(0, 0, 256, 64);
    for (let i = 0; i < 70; i++) {
      const t = i / 70, x = 6 + t * 244;
      const len = 26 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 4;
      for (const s of [-1, 1]) {
        const tone = 60 + r() * 40;
        g.strokeStyle = `rgb(${tone * 0.55 | 0},${tone + 30 | 0},${tone * 0.35 | 0})`;
        g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(x, 32); g.quadraticCurveTo(x + 5, 32 + s * len * 0.6, x + 12 + r() * 4, 32 + s * len); g.stroke();
      }
    }
    g.strokeStyle = '#8a8a3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 32); g.lineTo(250, 32); g.stroke();
    // a solid white patch the trunk samples, so its vertex colours show through
    g.fillStyle = '#fff'; g.fillRect(248, 0, 8, 8);
  }, false);
}

/** a clump of small leaves for neem / tamarind canopies */
function leafTex(r: Rng) {
  return paint(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * 56;
      const x = 64 + Math.cos(a) * d, y = 64 + Math.sin(a) * d;
      const tone = 0.6 + r() * 0.5;
      g.fillStyle = `rgb(${(48 * tone) | 0},${(92 * tone) | 0},${(34 * tone) | 0})`;
      g.beginPath(); g.ellipse(x, y, 4 + r() * 3, 1.8 + r() * 1.2, r() * 3, 0, Math.PI * 2); g.fill();
    }
    // bark patch for the trunk and limbs
    g.fillStyle = '#5e5248'; g.fillRect(0, 120, 8, 8);
  }, false);
}

type Plot = { x: number; z: number; w: number; d: number; a: number; kind: 'house' | 'empty' | 'field' };

/** dry-season fields, red-earth plots, tar roads and the lanes between the houses */
function groundTex(size: number, span: number, plots: Plot[], roads: { x0: number; z0: number; x1: number; z1: number; w: number; tar: boolean }[], r: Rng) {
  const s = size / span, o = span / 2;
  return paint(size, size, (g) => {
    g.fillStyle = '#7b7f4a'; g.fillRect(0, 0, size, size);
    // fields and scrub patches far out
    for (let i = 0; i < 520; i++) {
      const x = r() * size, y = r() * size, w = 10 + r() * 60, h = 10 + r() * 60;
      const pal = ['#8a8c4f', '#6f8040', '#9a8a58', '#a2794f', '#5f7a3a', '#b79a66', '#7c6a48'];
      g.fillStyle = pal[(r() * pal.length) | 0]; g.globalAlpha = 0.45 + r() * 0.4;
      g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.2); g.fillRect(-w / 2, -h / 2, w, h); g.restore();
    }
    g.globalAlpha = 1;
    for (const p of plots) {
      g.save(); g.translate((p.x + o) * s, (p.z + o) * s); g.rotate(-p.a);
      g.fillStyle = p.kind === 'empty' ? '#a5603c' : p.kind === 'field' ? '#6d8a3c' : '#b9ab90';
      g.fillRect(-p.w * s / 2, -p.d * s / 2, p.w * s, p.d * s);
      g.restore();
    }
    for (const rd of roads) {
      g.strokeStyle = rd.tar ? '#3d3f42' : '#a89474'; g.lineWidth = rd.w * s; g.lineCap = 'butt';
      g.beginPath(); g.moveTo((rd.x0 + o) * s, (rd.z0 + o) * s); g.lineTo((rd.x1 + o) * s, (rd.z1 + o) * s); g.stroke();
      if (rd.tar) {
        g.strokeStyle = 'rgba(240,240,230,0.75)'; g.lineWidth = Math.max(1, 0.15 * s); g.setLineDash([3 * s, 4 * s]);
        g.beginPath(); g.moveTo((rd.x0 + o) * s, (rd.z0 + o) * s); g.lineTo((rd.x1 + o) * s, (rd.z1 + o) * s); g.stroke();
        g.setLineDash([]);
      }
    }
    const img = g.getImageData(0, 0, size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
    g.putImageData(img, 0, 0);
  }, false);
}

/** the project's own compound: paving, a driveway, lawn and the boundary wall's shadow */
function compoundTex(size: number, half: number, foot: Rect[], r: Rng) {
  const s = size / (half * 2);
  return paint(size, size, (g) => {
    g.fillStyle = '#8d8a80'; g.fillRect(0, 0, size, size);
    // interlocking paver texture
    for (let y = 0; y < size; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < size; x += 12) {
      g.fillStyle = `rgba(${150 + r() * 30 | 0},${140 + r() * 26 | 0},${126 + r() * 20 | 0},0.5)`; g.fillRect(x, y, 11, 5);
    }
    // lawns in front of each tower, a driveway down the middle
    g.fillStyle = '#5c8a3a';
    for (const [x0, z0, x1, z1] of [[-half * 0.8, -half * 0.8, -half * 0.25, half * 0.8], [half * 0.4, half * 0.35, half * 0.85, half * 0.85]]) g.fillRect((x0 + half) * s, (z0 + half) * s, (x1 - x0) * s, (z1 - z0) * s);
    const img = g.getImageData(0, 0, size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 1] > d[i] + 20) { const n = (r() - 0.5) * 50; d[i] += n * 0.5; d[i + 1] += n; } }
    g.putImageData(img, 0, 0);
    // soft shadow at the foot of every tower
    for (const [x0, z0, x1, z1] of foot) {
      g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 2.5 * s; g.fillStyle = 'rgba(40,38,34,0.9)';
      g.fillRect((x0 + half) * s, (z0 + half) * s, (x1 - x0) * s, (z1 - z0) * s);
    }
    g.shadowBlur = 0;
    // boundary wall shadow round the edge
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.2 * s; g.strokeRect(0.6 * s, 0.6 * s, size - 1.2 * s, size - 1.2 * s);
  }, false);
}

/* ------------------------------------------------------------------ trees */

/** a coconut palm, base at the origin, height h: a leaning, slightly curved ringed trunk and a crown of fronds */
function palmGeo(h: number, lean: number, r: Rng, lod = 1): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  let n = 0;
  const seg = 7, rows = 9;
  const spine = (t: number): V3 => [Math.sin(t * 1.4) * lean * h * 0.18 + t * lean * h * 0.12, t * h, 0];
  for (let i = 0; i <= rows; i++) {
    const t = i / rows, c = spine(t), rad = 0.2 - 0.07 * t;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pos.push(c[0] + Math.cos(a) * rad, c[1], c[2] + Math.sin(a) * rad);
      nor.push(Math.cos(a), 0.1, Math.sin(a));
      uv.push(0.985, 0.985);
      const ring = 0.85 + 0.15 * Math.sin(t * h * 9);
      col.push(0.42 * ring, 0.37 * ring, 0.31 * ring);
    }
  }
  for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  n = pos.length / 3;
  const top = spine(1);
  const fronds = lod >= 1 ? 13 : 9;
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + r() * 0.3;
    const L = 3.6 + r() * 1.2, up = 0.55 - (f % 3) * 0.45 - r() * 0.25, W = 1.25;
    const steps = lod >= 1 ? 8 : 5;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // arching midrib that droops towards the tip
      const along = t * L, rise = Math.sin(up) * along - 0.45 * along * along / L * (1.4 - up);
      const cx = top[0] + cy * along * Math.cos(up * 0.5), cz = top[2] + sy * along * Math.cos(up * 0.5), yy = top[1] + rise;
      const half = (W / 2) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05));
      // leaflets fold down in a shallow V
      for (const s of [-1, 0, 1]) {
        pos.push(cx - sy * half * s, yy - Math.abs(s) * half * 0.35, cz + cy * half * s);
        nor.push(0, 1, 0);
        uv.push(t, 0.5 + s * 0.5);
        col.push(1, 1, 1);
      }
    }
    for (let i = 0; i < steps; i++) {
      const a = n + i * 3;
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5);
    }
    n += (steps + 1) * 3;
    // a bunch of coconuts under the crown
    void f;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // frond normals point up and out, so the crown shades as one rounded mass
  const P = g.attributes.position, Nn = g.attributes.normal;
  const trunkVerts = (rows + 1) * (seg + 1);
  for (let i = trunkVerts; i < P.count; i++) {
    const dx = P.getX(i) - top[0], dy = P.getY(i) - top[1] + 0.8, dz = P.getZ(i) - top[2], l = Math.hypot(dx, dy, dz) || 1;
    Nn.setXYZ(i, dx / l, dy / l, dz / l);
  }
  return g;
}

/** a broadleaf shade tree (neem / tamarind): a short trunk, a few limbs, a canopy of leaf cards */
function broadleafGeo(h: number, spread: number, r: Rng, lod = 1): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  let n = 0;
  const limb = (a: V3, b: V3, r0: number, r1: number) => {
    const seg = 6;
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    const ax = new THREE.Vector3(dx, dy, dz).normalize(), t1 = new THREE.Vector3(0, 0, 1).cross(ax);
    if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0);
    t1.normalize(); const t2 = ax.clone().cross(t1);
    for (const [p, rad] of [[a, r0], [b, r1]] as [V3, number][]) for (let j = 0; j <= seg; j++) {
      const an = (j / seg) * Math.PI * 2, c = Math.cos(an), s = Math.sin(an);
      const nx = t1.x * c + t2.x * s, ny = t1.y * c + t2.y * s, nz = t1.z * c + t2.z * s;
      pos.push(p[0] + nx * rad, p[1] + ny * rad, p[2] + nz * rad); nor.push(nx, ny, nz); uv.push(0.02, 0.02); col.push(1, 1, 1);
    }
    for (let j = 0; j < seg; j++) idx.push(n + j, n + seg + 1 + j, n + j + 1, n + j + 1, n + seg + 1 + j, n + seg + 2 + j);
    n += (seg + 1) * 2;
    void len;
  };
  const tH = h * 0.38;
  limb([0, 0, 0], [0, tH, 0], 0.3, 0.22);
  const centres: V3[] = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r() * 0.6;
    const e: V3 = [Math.cos(a) * spread * 0.45, tH + h * (0.25 + r() * 0.2), Math.sin(a) * spread * 0.45];
    limb([0, tH * 0.9, 0], e, 0.15, 0.07);
    centres.push(e);
  }
  centres.push([0, h * 0.75, 0]);
  // leaf cards: crossed quads scattered through the crown, normals pointing out of the crown
  const cy = h * 0.68;
  const cards = lod >= 1 ? 46 : 30;
  for (let i = 0; i < cards; i++) {
    const c = centres[i % centres.length];
    const a = r() * Math.PI * 2, el = (r() - 0.3) * 1.2, d = r() * spread * 0.42;
    const px = c[0] + Math.cos(a) * Math.cos(el) * d, py = c[1] + Math.sin(el) * d * 0.7, pz = c[2] + Math.sin(a) * Math.cos(el) * d;
    const s = spread * (0.38 + r() * 0.22), rot = r() * Math.PI;
    for (let k = 0; k < 2; k++) {
      const ang = rot + k * Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang), tilt = (r() - 0.5) * 0.8;
      const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const [u, v] of corners) {
        const lx = u * s * 0.5, ly = v * s * 0.5;
        const x = px + ca * lx, y = py + ly * Math.cos(tilt), z = pz + sa * lx + ly * Math.sin(tilt);
        pos.push(x, y, z);
        const ox = x, oy = y - cy + h * 0.1, oz = z, l = Math.hypot(ox, oy, oz) || 1;
        nor.push(ox / l, oy / l, oz / l);
        uv.push((u + 1) / 2, (v + 1) / 2);
        const tone = 0.8 + r() * 0.35;
        col.push(tone, tone, tone);
      }
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
      n += 4;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

/* ------------------------------------------------------------------ the town */

const PASTEL = ['#f3ece0', '#efe1c6', '#f2d8cf', '#dfe8d2', '#d7e4ee', '#f0e2a8', '#e8d0e0', '#f5f1e8', '#cfe3df', '#f1c9a5', '#e9e9e4'];

export class Town {
  readonly group = new THREE.Group();
  private mats: THREE.Material[] = [];
  private texs: THREE.Texture[] = [];
  private geos: THREE.BufferGeometry[] = [];
  private bldMat!: THREE.MeshStandardMaterial;
  private lamps: THREE.PointsMaterial | null = null;

  /**
   * @param foot the flat's floor plate (metres, plan frame): the tower below it is built to match
   */
  constructor(private q: Quality, foot: Rect[]) {
    const r = rng(1103);
    const B = new Geo();
    const col = new THREE.Color();
    const tint = (h: string, k = 1) => col.set(h).multiplyScalar(k).clone();
    const dens = q.town;

    // the flat's bounds and centre in the plan frame
    let fx0 = Infinity, fz0 = Infinity, fx1 = -Infinity, fz1 = -Infinity;
    for (const s of foot) { fx0 = Math.min(fx0, s[0]); fz0 = Math.min(fz0, s[1]); fx1 = Math.max(fx1, s[2]); fz1 = Math.max(fz1, s[3]); }
    const cx = (fx0 + fx1) / 2, cz = (fz0 + fz1) / 2;
    const towerW = fx1 - fx0, towerD = fz1 - fz0;

    /* --- this tower, below the flat: three storeys and the stilt parking */
    const wallC = tint('#efe7da'), slabC = tint('#ddd6ca');
    for (const s of foot) {
      const w = s[2] - s[0], d = s[3] - s[1], x = (s[0] + s[2]) / 2, z = (s[1] + s[3]) / 2;
      B.box(w, -GROUND - 0.25 - FLOOR + 0.3, d, x, GROUND + FLOOR - 0.3, z, 0, wallC, true, 0.31);
      // stilt floor: columns and a dark void behind them
      B.box(w - 1.2, FLOOR - 0.3, d - 1.2, x, GROUND, z, 0, tint('#3a3a3a'));
      for (let ix = 0; ix <= Math.round(w / 4); ix++) for (const zz of [s[1] + 0.25, s[3] - 0.25]) B.box(0.45, FLOOR - 0.3, 0.45, s[0] + 0.25 + (w - 0.5) * (ix / Math.round(w / 4)), GROUND, zz, 0, slabC);
      for (let k = 1; k <= 3; k++) B.box(w + 0.3, 0.2, d + 0.3, x, GROUND + k * FLOOR - 0.2, z, 0, slabC);
    }

    /* --- the project compound: two sister towers, a boundary wall, a gate */
    const half = 46;
    const towers: [number, number][] = [[cx + towerW + 20, cz - 6], [cx + 6, cz - towerD - 22]];
    const towerFoot: Rect[] = foot.map((s) => [s[0] - cx, s[1] - cz, s[2] - cx, s[3] - cz]);
    for (const [tx, tz] of towers) {
      const floors = 6;
      const H = floors * FLOOR;
      B.box(towerW, H, towerD, tx, GROUND, tz, 0, tint('#efe7da'), true, r());
      // balconies with glass rails on the long face, slab edges, a lift-machine room and tanks on the roof
      for (let f = 1; f < floors; f++) {
        B.box(towerW + 0.25, 0.2, towerD + 0.25, tx, GROUND + f * FLOOR - 0.2, tz, 0, slabC);
        for (const s of [-1, 1]) B.box(3.6, 1.05, 1.3, tx + s * towerW * 0.25, GROUND + f * FLOOR, tz + towerD / 2 + 0.6, 0, tint('#d8d1c4'));
      }
      B.box(towerW + 0.2, 1.0, towerD + 0.2, tx, GROUND + H, tz, 0, tint('#e3dccf'), false, 0, tint('#bdb6aa'));
      B.box(4.2, 3.2, 5, tx - towerW * 0.2, GROUND + H, tz, 0, tint('#e9e2d6'));
      for (let i = 0; i < 4; i++) B.cyl(0.65, 0.62, 1.4, tx + 1 + (i % 2) * 1.6, GROUND + H + 3.2, tz - 1 + ((i / 2) | 0) * 1.6, tint('#1d1d1f'), 10);
      towerFoot.push([tx - towerW / 2 - cx, tz - towerD / 2 - cz, tx + towerW / 2 - cx, tz + towerD / 2 - cz]);
    }
    // boundary wall with a gate on the road side
    const wallH = 2.1, bw = tint('#e9dfcd');
    const wallTop = tint('#c9bea9');
    for (const s of [-1, 1]) B.box(half * 2, wallH, 0.23, cx, GROUND, cz + s * half, 0, bw, false, 0, wallTop);
    B.box(half * 2, wallH, 0.23, cx + half, GROUND, cz, Math.PI / 2, bw, false, 0, wallTop);
    // the road side has the gate near the east corner
    B.box(half * 2 - 8.1, wallH, 0.23, cx - half, GROUND, cz + 4.05, Math.PI / 2, bw, false, 0, wallTop);
    for (const s of [-1, 1]) B.box(0.6, 2.6, 0.6, cx - half, GROUND, cz - half + 4.5 + s * 3.6, 0, tint('#d6c8ad'));

    /* --- the town: lanes of plots off a tar road */
    const plots: Plot[] = [];
    const roads: { x0: number; z0: number; x1: number; z1: number; w: number; tar: boolean }[] = [];
    const roadX = cx - half - 8;
    roads.push({ x0: roadX, z0: cz - 700, x1: roadX, z1: cz + 700, w: 9, tar: true });
    roads.push({ x0: cx - 700, z0: cz - half - 30, x1: cx + 700, z1: cz - half - 30, w: 7, tar: true });
    const span = 300 * (0.6 + 0.4 * dens);
    const near = (x: number, z: number, m: number) => Math.abs(x - cx) < half + m && Math.abs(z - cz) < half + m;
    for (let lane = -span; lane <= span; lane += 34) {
      if (Math.abs(lane) < 6) continue;
      const lz = cz + lane;
      roads.push({ x0: cx - span - 40, z0: lz, x1: cx + span + 40, z1: lz, w: 5, tar: false });
      for (let px = cx - span; px < cx + span; px += 11 + r() * 3) {
        for (const side of [-1, 1]) {
          const w = 8 + r() * 4, d = 11 + r() * 4;
          const x = px + w / 2, z = lz + side * (2.5 + d / 2 + 0.5);
          if (near(x, z, 6) || Math.abs(x - roadX) < 10 || Math.abs(z - (cz - half - 30)) < 9) continue;
          const roll = r();
          const dist = Math.hypot(x - cx, z - cz);
          if (roll < 0.14 + dist / 2000) plots.push({ x, z, w, d, a: 0, kind: r() < 0.6 ? 'empty' : 'field' });
          else if (r() < dens * (dist < 120 ? 1 : 0.7)) plots.push({ x, z, w, d, a: 0, kind: 'house' });
        }
      }
    }
    for (const p of plots) {
      if (p.kind !== 'house') continue;
      const floors = r() < 0.5 ? 2 : r() < 0.7 ? 3 : r() < 0.6 ? 1 : 4;
      const H = floors * FLOOR;
      const paintC = tint(PASTEL[(r() * PASTEL.length) | 0], 0.95 + r() * 0.05);
      const bw2 = p.w - 1.2, bd = p.d - 2.5;
      const bz = p.z + (r() - 0.5) * 0.8;
      B.box(bw2, H, bd, p.x, GROUND, bz, p.a, paintC, true, r() * 4, tint('#b9b2a5'));
      // roof parapet, the stair room ("mumty") and the black water tank on top of it
      const ph = 0.9;
      for (const s of [-1, 1]) {
        B.box(bw2, ph, 0.15, p.x, GROUND + H, bz + s * (bd / 2 - 0.075), 0, paintC);
        B.box(0.15, ph, bd - 0.3, p.x + s * (bw2 / 2 - 0.075), GROUND + H, bz, 0, paintC);
      }
      const mx = p.x + (r() - 0.5) * (bw2 - 3.2), mz = bz + (r() - 0.5) * (bd - 3.2);
      B.box(2.8, 2.5, 3.0, mx, GROUND + H, mz, 0, paintC, false, 0, tint('#a9a297'));
      const tanks = r() < 0.7 ? 1 : 2;
      for (let t = 0; t < tanks; t++) B.cyl(0.62, 0.55, 1.25, mx + (t - (tanks - 1) / 2) * 1.35, GROUND + H + 2.5, mz, tint(r() < 0.85 ? '#1b1b1c' : '#2f5aa8'), 10);
      // first-floor balcony slab and rail facing the lane
      if (floors > 1 && r() < 0.7) {
        const face = r() < 0.5 ? -1 : 1;
        B.box(bw2 * 0.55, 0.15, 1.1, p.x, GROUND + FLOOR - 0.15, bz + face * (bd / 2 + 0.55), 0, tint('#d8d2c6'));
        B.box(bw2 * 0.55, 0.95, 0.08, p.x, GROUND + FLOOR, bz + face * (bd / 2 + 1.05), 0, paintC);
      }
      // compound wall and gate posts round the plot
      const wc = tint(PASTEL[(r() * PASTEL.length) | 0], 0.85);
      B.box(p.w, 1.3, 0.15, p.x, GROUND, p.z - p.d / 2, 0, wc);
      B.box(p.w, 1.3, 0.15, p.x, GROUND, p.z + p.d / 2, 0, wc);
    }

    /* --- landmarks: an overhead water tank, a cell tower, a temple gopuram, a taller block or two */
    const ohx = cx - 140, ohz = cz + 90;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; B.box(0.5, 16, 0.5, ohx + Math.cos(a) * 3.5, GROUND, ohz + Math.sin(a) * 3.5, 0, tint('#cfc6b4')); }
    B.cyl(5.2, 4.4, 5, ohx, GROUND + 16, ohz, tint('#ddd5c4'), 18);
    B.cyl(5.3, 0.8, 1.6, ohx, GROUND + 21, ohz, tint('#c9c0ad'), 18);
    const ctx = cx + 170, ctz = cz - 150;
    for (let i = 0; i < 9; i++) B.box(1.6 - i * 0.12, 4, 1.6 - i * 0.12, ctx, GROUND + i * 4, ctz, 0, tint(i % 2 ? '#d93a2b' : '#f1f1ee'));
    for (let i = 0; i < 3; i++) B.box(0.5, 1.4, 0.15, ctx + Math.cos(i * 2.1) * 1.2, GROUND + 33, ctz + Math.sin(i * 2.1) * 1.2, i * 2.1, tint('#e9e9e9'));
    // the gopuram: stacked, narrowing tiers on a stone base, kalasams on the crown
    const gx = cx - 260, gz = cz - 210;
    B.box(16, 7, 11, gx, GROUND, gz, 0.3, tint('#d8c9a6'));
    let gw = 14, gd = 9.4, gy = GROUND + 7;
    for (let t = 0; t < 7; t++) {
      B.box(gw, 3.1, gd, gx, gy, gz, 0.3, tint(t % 2 ? '#e6d5ad' : '#d4bf92'));
      B.box(gw + 0.5, 0.35, gd + 0.5, gx, gy + 3.1, gz, 0.3, tint('#c4a571'));
      gy += 3.45; gw *= 0.84; gd *= 0.8;
    }
    B.box(gw + 2, 2.4, gd * 0.6, gx, gy, gz, 0.3, tint('#e1cc9c'));
    for (let i = -2; i <= 2; i++) B.cyl(0.25, 0.06, 1.6, gx + Math.cos(0.3) * i * (gw + 1.5) / 5, gy + 2.4, gz - Math.sin(0.3) * i * (gw + 1.5) / 5, tint('#c99a3e'), 8);
    for (const [bx, bz2, fl] of [[cx + 120, cz + 160, 8], [cx - 200, cz - 60, 6], [cx + 230, cz + 40, 7]] as V3[]) {
      B.box(22, fl * FLOOR, 14, bx, GROUND, bz2, r() * 0.6, tint('#e7e1d6'), true, r());
      B.box(4, 2.6, 4, bx, GROUND + fl * FLOOR, bz2, 0, tint('#ddd6ca'));
    }

    /* --- cars in the compound and on the road */
    const carCols = ['#f4f4f2', '#b8bcc2', '#9a1c1c', '#1d2a44', '#3c3c3e', '#e8e8e6'];
    const car = (x: number, z: number, a: number) => {
      const c = tint(carCols[(r() * carCols.length) | 0]);
      B.box(1.75, 0.75, 4.1, x, GROUND + 0.25, z, a, c);
      B.box(1.55, 0.55, 2.2, x - Math.sin(a) * 0.2, GROUND + 1.0, z - Math.cos(a) * 0.2, a, tint('#22262b'), false, 0, c);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.22, 0.6, 0.6, x + Math.cos(a) * sx * 0.82 + Math.sin(a) * sz * 1.3, GROUND, z - Math.sin(a) * sx * 0.82 + Math.cos(a) * sz * 1.3, a, tint('#151515'));
    };
    for (let i = 0; i < 7; i++) car(cx - half + 6 + i * 2.8, cz - half + 14, 0);
    for (let i = 0; i < Math.round(8 * dens); i++) car(roadX + (r() < 0.5 ? -2 : 2), cz - 200 + r() * 400, r() < 0.5 ? 0 : Math.PI);

    /* --- electric poles along the road, wires between them */
    const wire: number[] = [];
    const poleC = tint('#bdb8ad');
    let prev: V3 | null = null;
    for (let z = cz - 280; z <= cz + 280; z += 32) {
      const x = roadX + 5.2;
      B.box(0.22, 8.5, 0.22, x, GROUND, z, 0, poleC);
      B.box(1.8, 0.12, 0.12, x, GROUND + 7.9, z, 0, tint('#5b5650'));
      if (prev) for (const o of [-0.8, 0, 0.8]) {
        const a: V3 = [prev[0] + o, GROUND + 7.95, prev[2]], b: V3 = [x + o, GROUND + 7.95, z];
        for (let k = 0; k < 6; k++) {
          const t0 = k / 6, t1 = (k + 1) / 6;
          const sag = (t: number) => -Math.sin(Math.PI * t) * 0.7;
          wire.push(a[0] + (b[0] - a[0]) * t0, a[1] + sag(t0), a[2] + (b[2] - a[2]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + sag(t1), a[2] + (b[2] - a[2]) * t1);
        }
      }
      prev = [x, 0, z];
    }

    /* --- materials and meshes */
    const fac = facadeTex(q.hi ? 1024 : 512, rng(77));
    this.texs.push(fac.map, fac.lit);
    this.bldMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: fac.map, emissiveMap: fac.lit, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.92, envMapIntensity: 0.4 });
    this.mats.push(this.bldMat);
    const bg = B.geometry();
    this.geos.push(bg);
    const bld = new THREE.Mesh(bg, this.bldMat);
    bld.matrixAutoUpdate = false; bld.frustumCulled = false;
    bld.receiveShadow = true;
    this.group.add(bld);

    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3));
    const wireMat = new THREE.LineBasicMaterial({ color: 0x2a2a2a, transparent: true, opacity: 0.7 });
    this.geos.push(wireGeo); this.mats.push(wireMat);
    this.group.add(new THREE.LineSegments(wireGeo, wireMat));

    // ground: the wide town, then the compound laid over it in finer detail
    const SPAN = 1400;
    const gt = groundTex(q.hi ? 2048 : 1024, SPAN, plots.map((p) => ({ ...p, x: p.x - cx, z: p.z - cz })), roads.map((rd) => ({ ...rd, x0: rd.x0 - cx, x1: rd.x1 - cx, z0: rd.z0 - cz, z1: rd.z1 - cz })), rng(5));
    const gm = new THREE.MeshLambertMaterial({ map: gt });
    const gg = new THREE.PlaneGeometry(SPAN, SPAN); gg.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(gg, gm);
    ground.position.set(cx, GROUND, cz);
    ground.receiveShadow = true;
    this.texs.push(gt); this.mats.push(gm); this.geos.push(gg);
    this.group.add(ground);
    const ct = compoundTex(q.hi ? 1024 : 512, half, towerFoot, rng(6));
    const cm = new THREE.MeshLambertMaterial({ map: ct });
    const cg = new THREE.PlaneGeometry(half * 2, half * 2); cg.rotateX(-Math.PI / 2);
    const comp = new THREE.Mesh(cg, cm);
    comp.position.set(cx, GROUND + 0.03, cz);
    comp.receiveShadow = true;
    this.texs.push(ct); this.mats.push(cm); this.geos.push(cg);
    this.group.add(comp);

    /* --- trees */
    const frond = frondTex(rng(8)), leaf = leafTex(rng(9));
    this.texs.push(frond, leaf);
    const palmMat = new THREE.MeshLambertMaterial({ map: frond, vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide });
    const leafMat = new THREE.MeshLambertMaterial({ map: leaf, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mats.push(palmMat, leafMat);
    const spots: { x: number; z: number; palm: boolean; s: number }[] = [];
    // palms line the compound driveway and the boundary; more scattered through the town
    for (let i = 0; i < 9; i++) spots.push({ x: cx - half + 3, z: cz - half + 10 + i * 9.5, palm: true, s: 1.1 });
    for (let i = 0; i < 6; i++) spots.push({ x: cx + half - 3, z: cz - half + 8 + i * 15, palm: i % 2 === 0, s: 1 });
    for (let i = 0; i < 5; i++) spots.push({ x: cx - 20 + i * 12, z: cz + half - 3, palm: i % 2 === 1, s: 1 });
    const nTrees = Math.round(520 * dens);
    for (let i = 0; i < nTrees; i++) {
      const a = r() * Math.PI * 2, d = 50 + Math.pow(r(), 1.3) * 420;
      const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (near(x, z, 2)) continue;
      spots.push({ x, z, palm: r() < 0.58, s: 0.85 + r() * 0.4 });
    }
    const variants = (make: (r: Rng) => THREE.BufferGeometry, mat: THREE.Material, list: typeof spots) => {
      const V = 3;
      for (let v = 0; v < V; v++) {
        const sub = list.filter((_, i) => i % V === v);
        if (!sub.length) continue;
        const geo = make(rng(300 + v * 17 + (mat === palmMat ? 0 : 50)));
        this.geos.push(geo);
        const im = new THREE.InstancedMesh(geo, mat, sub.length);
        const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), tc = new THREE.Color();
        sub.forEach((t, i) => {
          qq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI * 2);
          m.compose(p.set(t.x, GROUND, t.z), qq, sc.setScalar(t.s));
          im.setMatrixAt(i, m);
          const k = 0.78 + r() * 0.22;
          im.setColorAt(i, tc.setRGB(k * (0.92 + r() * 0.12), k, k * (0.85 + r() * 0.15)));
        });
        im.frustumCulled = false;
        this.group.add(im);
      }
    };
    const lod = q.tier >= 2 ? 1 : 0;
    variants((rr) => palmGeo(11 + rr() * 5, (rr() - 0.4) * 0.9, rr, lod), palmMat, spots.filter((s) => s.palm));
    variants((rr) => broadleafGeo(8 + rr() * 4, 7 + rr() * 3, rr, lod), leafMat, spots.filter((s) => !s.palm));

    // street lights: warm sodium points along the roads that come on at dusk
    const lampPos: number[] = [];
    for (let z = cz - 280; z <= cz + 280; z += 32) lampPos.push(roadX + 4.4, GROUND + 7.2, z);
    for (let x = cx - 300; x <= cx + 300; x += 36) lampPos.push(x, GROUND + 7.2, cz - half - 26);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(lampPos, 3));
    this.lamps = new THREE.PointsMaterial({ color: 0xffb35c, size: 6, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.geos.push(lg); this.mats.push(this.lamps);
    const pts = new THREE.Points(lg, this.lamps);
    pts.frustumCulled = false;
    this.group.add(pts);
  }

  /** windows and street lights come on as the light goes */
  setLight(lampF: number, glow?: THREE.Texture) {
    this.bldMat.emissiveIntensity = lampF * 1.3;
    if (this.lamps) {
      this.lamps.opacity = lampF * 0.9;
      if (glow && this.lamps.map !== glow) { this.lamps.map = glow; this.lamps.needsUpdate = true; }
    }
  }

  dispose() {
    for (const g of this.geos) g.dispose();
    for (const m of this.mats) m.dispose();
    for (const t of this.texs) t.dispose();
    this.group.clear();
  }
}
