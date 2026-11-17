import * as THREE from 'three';
import type { Kit } from './kit';
import { CEIL, FT, roomAt, type Opening, type PlanDef, type RoomDef, type WallDef } from './plans';

/** ceiling height and the height the dollhouse view slices the walls at (metres) */
export const H = CEIL * FT;
export const CUT = 2.3;
const f = (v: number) => v * FT;

type Piece = { u0: number; u1: number; v0: number; v1: number };
export type Side = 'top' | 'bottom' | 'left' | 'right';

/** split a run of wall into the solid rectangles left around its openings (feet) */
function pieces(a: number, b: number, open: Opening[], top: number): Piece[] {
  const out: Piece[] = [];
  let cur = a;
  for (const o of [...open].sort((p, q) => p.a - q.a)) {
    if (o.a > cur) out.push({ u0: cur, u1: o.a, v0: 0, v1: top });
    const sill = o.sill ?? 0, head = o.head ?? top;
    if (sill > 0) out.push({ u0: o.a, u1: o.b, v0: 0, v1: sill });
    if (head < top) out.push({ u0: o.a, u1: o.b, v0: head, v1: top });
    cur = Math.max(cur, o.b);
  }
  if (b > cur) out.push({ u0: cur, u1: b, v0: 0, v1: top });
  return out;
}

/** a box on a wall line, split at the dollhouse cut so the top can be lifted off */
function slab(k: Kit, slot: string, o: 'h' | 'v', u0: number, u1: number, c: number, t: number, y0: number, y1: number) {
  const len = u1 - u0, mid = (u0 + u1) / 2;
  const put = (a: number, b: number) => {
    if (b - a < 1e-3) return;
    if (o === 'h') k.box(slot, len, b - a, t, mid, a, c); else k.box(slot, t, b - a, len, c, a, mid);
  };
  k.layer(false, () => put(y0, Math.min(y1, CUT)));
  k.layer(true, () => put(Math.max(y0, CUT), y1));
}

function buildWall(k: Kit, w: WallDef) {
  const kind = w.kind ?? 'wall';
  const t = f(w.t), c = f(w.c) + t / 2;
  const rect = (u0: number, u1: number): [number, number, number, number] =>
    w.o === 'h' ? [f(u0), f(w.c), f(u1), f(w.c + w.t)] : [f(w.c), f(u0), f(w.c + w.t), f(u1)];

  if (kind === 'parapet') {
    slab(k, 'wall', w.o, f(w.a), f(w.b), c, t, 0, 1.05);
    slab(k, 'slabEdge', w.o, f(w.a) - 0.02, f(w.b) + 0.02, c, t + 0.05, 1.05, 1.1);
    const r = rect(w.a, w.b);
    k.solids.push(r);
    k.ao.push({ x0: r[0], z0: r[1], x1: r[2], z1: r[3], dark: 0.4, soft: 0.25 });
    return;
  }
  if (kind === 'rail') {
    // frameless glass balustrade with a slim metal handrail
    slab(k, 'glass', w.o, f(w.a) + 0.03, f(w.b) - 0.03, c, 0.012, 0.08, 1.02);
    slab(k, 'metal', w.o, f(w.a), f(w.b), c, 0.05, 1.02, 1.06);
    slab(k, 'metal', w.o, f(w.a), f(w.b), c, 0.04, 0.03, 0.08);
    const n = Math.max(2, Math.round((w.b - w.a) / 4) + 1);
    for (let i = 0; i < n; i++) {
      const u = f(w.a) + 0.03 + ((f(w.b) - f(w.a) - 0.06) * i) / (n - 1);
      slab(k, 'metal', w.o, u - 0.02, u + 0.02, c, 0.04, 0.08, 1.02);
    }
    k.solids.push(rect(w.a, w.b));
    return;
  }

  for (const p of pieces(w.a, w.b, w.open ?? [], CEIL)) {
    slab(k, 'wall', w.o, f(p.u0), f(p.u1), c, t, f(p.v0), f(p.v1));
    if (p.v0 === 0) {
      const r = rect(p.u0, p.u1);
      k.solids.push(r);
      const full = p.v1 === CEIL;
      const q = { x0: r[0], z0: r[1], x1: r[2], z1: r[3], dark: full ? 0.5 : 0.35, soft: full ? 0.38 : 0.25 };
      k.ao.push(q);
      if (full) {
        k.aoWalls.push(q);
        slab(k, 'skirting', w.o, f(p.u0), f(p.u1), c, t + 0.026, 0, 0.085);
      }
    }
  }
}

/** which side of a wall opening is indoors: +1 (right / down), -1, or 0 when both are */
function indoorSide(plan: PlanDef, w: WallDef, op: Opening): { side: 1 | -1 | 0; room: RoomDef | null } {
  const mid = (op.a + op.b) / 2;
  const at = (d: number) => (w.o === 'h' ? roomAt(plan, mid, d) : roomAt(plan, d, mid));
  const lo = at(w.c - 0.7), hi = at(w.c + w.t + 0.7);
  const out = (r: RoomDef | null) => !r || r.kind === 'balcony' || r.kind === 'service';
  if (out(lo) && !out(hi)) return { side: 1, room: hi };
  if (out(hi) && !out(lo)) return { side: -1, room: lo };
  return { side: 0, room: null };
}

/** pleated cloth hanging in the local x–y plane, top edge at height `top` */
function drape(k: Kit, slot: string, w: number, top: number, bottom: number, x: number, z: number, folds: number, depth: number) {
  const h = top - bottom;
  const g = new THREE.PlaneGeometry(w, h, Math.max(4, folds * 6), 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    pos.setZ(i, Math.sin((px / w + 0.5) * folds * Math.PI * 2) * depth);
    uv.setXY(i, px * 1.4, pos.getY(i));
  }
  g.computeVertexNormals();
  k.raw(slot, g, x, bottom + h / 2, z, { keep: true });
}

function glazedLeaf(k: Kit, len: number, h: number, y0: number, z: number) {
  const s = 0.065;
  k.box('upvc', s, h, 0.045, s / 2, y0, z);
  k.box('upvc', s, h, 0.045, len - s / 2, y0, z);
  k.box('upvc', len - 2 * s, s, 0.045, len / 2, y0, z);
  k.box('upvc', len - 2 * s, s, 0.045, len / 2, y0 + h - s, z);
  k.box('glass', len - 2 * s, h - 2 * s, 0.008, len / 2, y0 + s, z);
}

function buildOpening(k: Kit, plan: PlanDef, w: WallDef, op: Opening) {
  const wd = f(op.b - op.a), t = f(w.t);
  const mid = f((op.a + op.b) / 2), c = f(w.c) + t / 2;
  const sill = f(op.sill ?? 0), head = f(op.head ?? CEIL);
  // local frame: x along the wall, z across it. On a vertical wall local +z points LEFT, so flip.
  const nz = w.o === 'h' ? 1 : -1;
  const place = (fn: () => void) => (w.o === 'h' ? k.at(mid, c, 0, fn) : k.at(c, mid, -Math.PI / 2, fn));
  const inside = indoorSide(plan, w, op);

  place(() => {
    if (op.kind === 'main' || op.kind === 'door' || op.kind === 'bath' || op.kind === 'gdoor') {
      const frame = op.kind === 'gdoor' ? 'upvc' : 'frame';
      const fd = t + 0.03;
      k.box(frame, 0.05, head, fd, -wd / 2 + 0.025, 0, 0);
      k.box(frame, 0.05, head, fd, wd / 2 - 0.025, 0, 0);
      k.box(frame, wd - 0.1, 0.05, fd, 0, head - 0.05, 0);
      const len = wd - 0.11;
      const hingeA = op.hinge !== 'b';
      const s = (op.swing ?? 1) * nz;
      const ang = ((op.angle ?? 90) * Math.PI) / 180;
      const dx = (hingeA ? 1 : -1) * Math.cos(ang), dz = s * Math.sin(ang);
      const hx = (hingeA ? -1 : 1) * (wd / 2 - 0.055), hz = s * (t / 2 + 0.02);
      const lh = head - 0.065;
      k.at(hx, hz, Math.atan2(-dz, dx), () => {
        if (op.kind === 'gdoor') {
          glazedLeaf(k, len, lh, 0.01, 0);
          k.box('metal', 0.02, 0.14, 0.07, len - 0.06, 0.98, 0);
        } else {
          const slot = op.kind === 'main' ? 'doorMain' : 'doorLeaf';
          k.box(slot, len, lh, 0.042, len / 2, 0.01, 0);
          if (op.kind === 'main') {
            // a tall pull handle and a slim inlay, both faces
            for (const zz of [-0.045, 0.045]) k.box('metal', 0.03, 0.7, 0.03, len - 0.14, 0.75, zz);
            k.box('metal', 0.012, lh - 0.3, 0.046, len * 0.3, 0.16, 0);
          } else {
            for (const zz of [-0.04, 0.04]) {
              k.box('metal', 0.05, 0.05, 0.02, len - 0.08, 0.98, zz);
              k.box('metal', 0.13, 0.02, 0.02, len - 0.13, 1.0, zz * 1.5);
            }
          }
        }
      });
      return;
    }

    if (op.kind === 'slider') {
      k.box('upvc', 0.05, head, 0.12, -wd / 2 + 0.025, 0, 0);
      k.box('upvc', 0.05, head, 0.12, wd / 2 - 0.025, 0, 0);
      k.box('upvc', wd - 0.1, 0.05, 0.12, 0, head - 0.05, 0);
      k.box('upvc', wd - 0.1, 0.018, 0.12, 0, 0, 0);
      const pw = (wd - 0.1) / 3, ph = head - 0.07;
      const x0 = -wd / 2 + 0.05;
      const openFirst = op.openAt !== 'b';
      // two panels closed on the inner track, the third slid across behind the middle one
      const fixed = openFirst ? [1, 2] : [0, 1];
      for (const i of fixed) k.at(x0 + i * pw, -0.025, 0, () => glazedLeaf(k, pw, ph, 0.018, 0));
      k.at(x0 + pw, 0.025, 0, () => glazedLeaf(k, pw, ph, 0.018, 0));
    } else if (op.kind === 'window' || op.kind === 'vent') {
      const h = head - sill, fr = 0.05;
      k.box('upvc', fr, h, 0.08, -wd / 2 + fr / 2, sill, 0);
      k.box('upvc', fr, h, 0.08, wd / 2 - fr / 2, sill, 0);
      k.box('upvc', wd - 2 * fr, fr, 0.08, 0, sill, 0);
      k.box('upvc', wd - 2 * fr, fr, 0.08, 0, head - fr, 0);
      const panes = op.kind === 'vent' ? 1 : wd > 1.25 ? (wd > 1.9 ? 3 : 2) : 1;
      for (let i = 1; i < panes; i++) k.box('upvc', 0.045, h - 2 * fr, 0.06, -wd / 2 + (wd * i) / panes, sill + fr, 0);
      k.box('glass', wd - 2 * fr, h - 2 * fr, 0.008, 0, sill + fr, 0);
      if (op.kind === 'vent') for (let i = 1; i < 4; i++) k.box('upvc', wd - 2 * fr, 0.012, 0.05, 0, sill + (h * i) / 4, 0, { rx: 0.5 });
      // stone sill board on the room side
      if (inside.side) k.box('counter', wd + 0.08, 0.03, 0.1, 0, sill - 0.03, inside.side * nz * (t / 2 + 0.03));
    }

    if (op.kind === 'arch') return;

    // daylight spilling in, and soft furnishings on the room side
    const s = inside.side * nz;
    if (!inside.side || !inside.room) return;
    const area = wd * (head - sill);
    k.light('window', 0, Math.min(1.7, (sill + head) / 2 + 0.1), s * (t / 2 + 0.5), Math.min(4.2, 0.9 + area * 0.75), 0xffffff);
    const kind = inside.room.kind;
    const soft = kind === 'living' || kind === 'dining' || kind === 'bed' || kind === 'master';
    if (!soft) return;
    const top = 2.27, z = s * (t / 2 + 0.09);
    k.box('metal', wd + 0.62, 0.022, 0.022, 0, top, z);
    k.box('metal', 0.04, 0.04, 0.04, -wd / 2 - 0.31, top - 0.009, z);
    k.box('metal', 0.04, 0.04, 0.04, wd / 2 + 0.31, top - 0.009, z);
    const stack = Math.min(0.42, wd * 0.2 + 0.12);
    drape(k, 'curtain', stack, top - 0.01, 0.03, -wd / 2 - 0.3 + stack / 2, z, 4, 0.035);
    drape(k, 'curtain', stack, top - 0.01, 0.03, wd / 2 + 0.3 - stack / 2, z, 4, 0.035);
    if (op.kind === 'window') drape(k, 'sheer', wd + 0.1, top - 0.012, 0.03, 0, z - s * 0.035, Math.max(3, Math.round(wd * 3)), 0.018);
  });
}

/** the visible wall surface on one side of a room, as rectangles (feet) */
export function sidePieces(plan: PlanDef, room: RoomDef, side: Side): Piece[] {
  const [x0, y0, x1, y1] = room.r;
  const horiz = side === 'top' || side === 'bottom';
  const r0 = horiz ? x0 : y0, r1 = horiz ? x1 : y1;
  const target = side === 'top' ? y0 : side === 'bottom' ? y1 : side === 'left' ? x0 : x1;
  const out: Piece[] = [];
  for (const w of plan.walls) {
    if ((w.kind ?? 'wall') !== 'wall' || (w.o === 'h') !== horiz) continue;
    const face = side === 'top' || side === 'left' ? w.c + w.t : w.c;
    if (Math.abs(face - target) > 0.08) continue;
    const a = Math.max(w.a, r0), b = Math.min(w.b, r1);
    if (b - a < 0.05) continue;
    const ops = (w.open ?? []).filter((o) => o.b > a && o.a < b).map((o) => ({ ...o, a: Math.max(o.a, a), b: Math.min(o.b, b) }));
    out.push(...pieces(a, b, ops, CEIL));
  }
  return out;
}

/** clad one side of a room in a finish (tile, accent paint, timber) between two heights (feet) */
export function sidePanels(k: Kit, plan: PlanDef, room: RoomDef, side: Side, slot: string, v0 = 0, v1 = CEIL, range?: [number, number]) {
  const [x0, y0, x1, y1] = room.r;
  const th = 0.012;
  for (const p of sidePieces(plan, room, side)) {
    const a = Math.max(p.v0, v0), b = Math.min(p.v1, v1);
    const u0 = range ? Math.max(p.u0, range[0]) : p.u0, u1 = range ? Math.min(p.u1, range[1]) : p.u1;
    if (b - a < 0.02 || u1 - u0 < 0.02) continue;
    if (side === 'top') slab(k, slot, 'h', f(u0), f(u1), f(y0) + th / 2, th, f(a), f(b));
    else if (side === 'bottom') slab(k, slot, 'h', f(u0), f(u1), f(y1) - th / 2, th, f(a), f(b));
    else if (side === 'left') slab(k, slot, 'v', f(u0), f(u1), f(x0) + th / 2, th, f(a), f(b));
    else slab(k, slot, 'v', f(u0), f(u1), f(x1) - th / 2, th, f(a), f(b));
  }
}

const FLOOR_SLOT = { main: 'floorMain', master: 'floorMaster', bath: 'floorBath', deck: 'floorDeck' } as const;

function ceilingLights(k: Kit, room: RoomDef) {
  const [x0, y0, x1, y1] = room.r;
  const w = f(x1 - x0), d = f(y1 - y0), cx = f((x0 + x1) / 2), cz = f((y0 + y1) / 2);
  const outdoor = room.kind === 'balcony' || room.kind === 'service';
  const nx = Math.max(1, Math.round(w / 1.7)), nz = Math.max(1, Math.round(d / 1.7));
  k.layer(true, () => {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = cx - w / 2 + (w * (i + 0.5)) / nx, z = cz - d / 2 + (d * (j + 0.5)) / nz;
      k.cyl('white', 0.06, 0.06, 0.012, x, H - 0.012, z, { seg: 14 });
      k.cyl('downlight', 0.045, 0.045, 0.006, x, H - 0.017, z, { seg: 12 });
    }
    const big = room.kind === 'living' || room.kind === 'dining' || room.kind === 'master';
    if (big) {
      // a dropped border with a concealed strip of light — the "tray" ceiling
      const m = 0.42, bw = 0.34, drop = 0.11;
      const iw = w - 2 * m, id = d - 2 * m;
      for (const s of [-1, 1]) {
        k.box('ceiling', iw, drop, bw, cx, H - drop, cz + (s * (id - bw)) / 2);
        k.box('ceiling', bw, drop, id - 2 * bw, cx + (s * (iw - bw)) / 2, H - drop, cz);
        k.box('cove', iw - 2 * bw, 0.018, 0.02, cx, H - 0.03, cz + s * (id / 2 - bw - 0.012));
        k.box('cove', 0.02, 0.018, id - 2 * bw, cx + s * (iw / 2 - bw - 0.012), H - 0.03, cz);
      }
    }
  });
  const area = w * d;
  k.light('ceiling', cx, H - 0.35, cz, outdoor ? 2.2 : Math.min(15, 3.5 + area * 0.62), 0xffdcb0);
  k.glow(cx, 0.008, cz, Math.min(w, d) * 0.62 + 0.3, true, outdoor ? 0.5 : 0.85);
}

export function buildShell(k: Kit, plan: PlanDef) {
  // structure slab: polished floor on top, bare ceiling over
  for (const s of plan.slabs) {
    const w = f(s[2] - s[0]), d = f(s[3] - s[1]), cx = f((s[0] + s[2]) / 2), cz = f((s[1] + s[3]) / 2);
    k.flat('floorMain', w, d, cx, 0, cz);
    k.box('slabEdge', w, 0.22, d, cx, -0.222, cz);
    k.layer(true, () => k.box('ceiling', w, 0.14, d, cx, H, cz));
  }
  for (const room of plan.rooms) {
    if (room.floor !== 'main') {
      const [x0, y0, x1, y1] = room.r;
      k.flat(FLOOR_SLOT[room.floor], f(x1 - x0), f(y1 - y0), f((x0 + x1) / 2), 0.003, f((y0 + y1) / 2));
    }
    ceilingLights(k, room);
    if (room.kind === 'bath') for (const side of ['top', 'bottom', 'left', 'right'] as Side[]) sidePanels(k, plan, room, side, 'bathWall');
  }
  for (const w of plan.walls) {
    buildWall(k, w);
    for (const op of w.open ?? []) buildOpening(k, plan, w, op);
  }

  // the stretch of common corridor outside the front door
  const [ex0, ey0, ex1, ey1] = plan.entry.r;
  const ew = f(ex1 - ex0), ed = f(ey1 - ey0), ecx = f((ex0 + ex1) / 2), ecz = f((ey0 + ey1) / 2);
  const wt = 0.15;
  k.flat('floorHall', ew, ed, ecx, 0.001, ecz);
  k.box('slabEdge', ew + 2 * wt, 0.22, ed + wt, ecx, -0.222, ecz);
  const far = plan.entry.side === 'top' ? f(ey0) - wt / 2 : f(ey1) + wt / 2;
  slab(k, 'hallWall', 'h', f(ex0) - wt, f(ex1) + wt, far, wt, 0, H);
  slab(k, 'hallWall', 'v', f(ey0), f(ey1), f(ex0) - wt / 2, wt, 0, H);
  slab(k, 'hallWall', 'v', f(ey0), f(ey1), f(ex1) + wt / 2, wt, 0, H);
  k.solids.push([f(ex0) - wt, far - wt / 2, f(ex1) + wt, far + wt / 2], [f(ex0) - wt, f(ey0), f(ex0), f(ey1)], [f(ex1), f(ey0), f(ex1) + wt, f(ey1)]);
  k.layer(true, () => {
    k.box('ceiling', ew + 2 * wt, 0.14, ed + wt, ecx, H, ecz);
    for (const s of [-1, 1]) {
      k.cyl('white', 0.07, 0.07, 0.012, ecx + s * ew * 0.25, H - 0.012, ecz, { seg: 14 });
      k.cyl('downlight', 0.055, 0.055, 0.006, ecx + s * ew * 0.25, H - 0.017, ecz, { seg: 12 });
    }
  });
  k.light('always', ecx, H - 0.4, ecz, 7, 0xffe2bd);
  // everything solid so far is structure; furniture can ask the kit where the walls are
  k.walls = k.solids.length;
}
