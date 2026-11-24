import * as THREE from 'three';
import type { Kit, SoftOpts } from './kit';
import { FT, roomById, type PlanDef } from './plans';
import { CUT, H, sidePanels, type Side } from './shell';
import { ART_GRID, rng } from './textures';
import * as IN from './indian';

/**
 * Furniture is modelled from simple primitives, in metres. Pieces that stand against a wall
 * are built "wall-origin": local z = 0 is the wall face and +z comes out into the room, so a
 * layout only has to say which wall and where along it. Free-standing pieces are centred.
 *
 * Facing (which way local +z points on the plan sheet): D down · R right · U up · L left.
 */
const D = 0, R = Math.PI / 2, U = Math.PI, L = -Math.PI / 2;
/** clearance behind anything that sits in front of a curtain */
const OFF = 0.14;

/* soft shapes: stuffed pillows taper to a seam, box cushions keep a crisp but rounded edge */
const PILLOW: SoftOpts = { side: 2.4, corner: 0.09, puff: 0.014, pinch: 0.35, step: 0.05 };
const CUSHION: SoftOpts = { side: 5, corner: 0.055, puff: 0.008, step: 0.06 };
const FRAME: SoftOpts = { side: 9, corner: 0.04, step: 0.12 };

/**
 * A soft piece standing on its edge and leaning back towards local -z by `lean` radians,
 * centred at (x, y, z): pillows against a headboard, sofa back cushions, chair backs.
 */
function upright(k: Kit, slot: string, w: number, tall: number, thick: number, x: number, y: number, z: number, lean: number, ry: number, o: SoftOpts) {
  k.soft(slot, w, thick, tall, x, y, z, { ...o, rx: -(Math.PI / 2 + lean), ry });
}

/** cloth hung over a horizontal bar running along local x, `hang` metres each side */
function overBar(k: Kit, slot: string, width: number, hang: number, x: number, barY: number, z: number) {
  const bend = 0.02;
  k.soft(slot, hang * 2, 0.012, width, x, barY + bend, z, { ry: Math.PI / 2, side: 4, corner: 0.015, rumple: 0.003, step: 0.05, drape: { hw: 0, bend } });
}

/* ------------------------------------------------------------------ small things */

function books(k: Kit, x: number, y: number, z: number, ry = 0.2) {
  k.box('decorB', 0.27, 0.032, 0.2, x, y, z, { ry });
  k.box('paper', 0.24, 0.028, 0.18, x, y + 0.032, z, { ry: ry + 0.15 });
  k.box('decorA', 0.2, 0.024, 0.15, x, y + 0.06, z, { ry: ry - 0.2 });
}

/* ------------------------------------------------------------------ plants
 * Every leaf grows from the end of a stalk, and every stalk from a stem, branch or the soil,
 * so nothing floats. Each plant draws its own random numbers from where it stands: they all
 * differ, but look the same on every visit.
 */
type V3 = [number, number, number];
const seedOf = (x: number, z: number) => (Math.abs(Math.round(x * 7919 + z * 104729)) % 2147483646) + 1;
const along = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/**
 * A heading from p that reaches `reach` metres without touching a wall: the one asked for, else
 * its mirror images (a plant in a corner grows its leaves into the room). null = no room at all.
 */
function clearYaw(k: Kit, p: V3, a: number, reach: number, margin = 0.04): number | null {
  for (const c of [a, -a, Math.PI - a, a + Math.PI]) {
    if ([0.35, 0.7, 1].every((f) => !k.nearWall(p[0] + Math.sin(c) * reach * f, p[2] + Math.cos(c) * reach * f, margin))) return c;
  }
  return null;
}

/** eucalyptus stems arranged in a vase */
function vase(k: Kit, x: number, y: number, z: number, h = 0.26, slot = 'decorB') {
  k.cyl(slot, 0.03, 0.06, h, x, y, z, { seg: 18 });
  k.cyl(slot, 0.034, 0.03, 0.018, x, y + h - 0.004, z, { seg: 18 });
  const r = rng(seedOf(x + y, z));
  const mouth = y + h;
  for (let i = 0; i < 5; i++) {
    const lean = 0.18 + r() * 0.24, L = 0.3 + r() * 0.14;
    const a0 = i * 1.257 + r() * 0.5;
    const a = clearYaw(k, [x, mouth, z], a0, L * 0.6 + 0.06);
    if (a === null) continue;
    const p0: V3 = [x + Math.sin(a) * 0.012, mouth - 0.03, z + Math.cos(a) * 0.012];
    const p1: V3 = [p0[0] + Math.sin(a) * Math.sin(lean) * L * 0.55, p0[1] + Math.cos(lean) * L * 0.55, p0[2] + Math.cos(a) * Math.sin(lean) * L * 0.55];
    const p2: V3 = [p1[0] + Math.sin(a) * Math.sin(lean * 2) * L * 0.45, p1[1] + Math.cos(lean * 2) * L * 0.45, p1[2] + Math.cos(a) * Math.sin(lean * 2) * L * 0.45];
    k.rod('wood2', ...p0, ...p1, 0.0035, 0.003, 5);
    k.rod('wood2', ...p1, ...p2, 0.003, 0.002, 5);
    const slotL = i % 2 ? 'leaf2' : 'leaf';
    // round eucalyptus leaves in pairs up the stem, larger towards the base
    for (let j = 0; j < 7; j++) {
      const t = 0.22 + j * 0.11, p = t < 0.55 ? along(p0, p1, t / 0.55) : along(p1, p2, (t - 0.55) / 0.45);
      const size = 0.072 - j * 0.004;
      const ly = clearYaw(k, p, a + (j % 2 ? 1.5 : -1.5) + (r() - 0.5) * 0.5, size + 0.01, 0.03);
      if (ly !== null) k.leaf(slotL, ...p, size, size * 0.85, ly, 0.15 + r() * 0.3, { droop: 0.9, fold: 0.12 });
    }
    k.leaf(slotL, ...p2, 0.05, 0.042, a, 0.6, { droop: 0.6, fold: 0.12 });
  }
}

function bowl(k: Kit, x: number, y: number, z: number) {
  k.cyl('ceramic', 0.14, 0.08, 0.07, x, y, z, { seg: 18 });
  k.ball('fruit', 0.04, 0.04, 0.04, x - 0.04, y + 0.085, z + 0.02, { seg: 10 });
  k.ball('fruit2', 0.042, 0.042, 0.042, x + 0.045, y + 0.085, z - 0.01, { seg: 10 });
  k.ball('fruit', 0.038, 0.038, 0.038, x, y + 0.1, z - 0.045, { seg: 10 });
  // a sprig of leaves still on the fruit's stalk
  k.rod('wood2', x - 0.04, y + 0.122, z + 0.02, x - 0.035, y + 0.14, z + 0.025, 0.002);
  k.leaf('leaf2', x - 0.035, y + 0.14, z + 0.025, 0.06, 0.03, 0.8, 0.2, { droop: 0.9 });
  k.leaf('leaf', x - 0.035, y + 0.14, z + 0.025, 0.055, 0.028, -1.9, 0.3, { droop: 0.9 });
}

/** a heart-leaf plant in a small pot: every leaf on its own stalk rising out of the soil */
function smallPlant(k: Kit, x: number, y: number, z: number, s = 1) {
  k.cyl('pot', 0.07 * s, 0.055 * s, 0.1 * s, x, y, z, { seg: 16 });
  k.cyl('soil', 0.064 * s, 0.064 * s, 0.008, x, y + 0.088 * s, z, { seg: 12 });
  const r = rng(seedOf(x + y * 3, z));
  const sy = y + 0.094 * s;
  for (let i = 0; i < 8; i++) {
    const rise = 0.06 + r() * 0.11, out = 0.025 + r() * 0.05;
    const a = clearYaw(k, [x, sy, z], i * 2.4 + r() * 0.4, (out + 0.1) * s, 0.03);
    if (a === null) continue;
    const tx = x + Math.sin(a) * out * s, ty = sy + rise * s, tz = z + Math.cos(a) * out * s;
    k.rod('leaf2', x + Math.sin(a) * 0.008 * s, sy, z + Math.cos(a) * 0.008 * s, tx, ty, tz, 0.003 * s, 0.002 * s, 4);
    k.leaf(i % 3 ? 'leaf' : 'leaf2', tx, ty, tz, (0.085 + r() * 0.03) * s, (0.055 + r() * 0.015) * s, a, 0.5 + r() * 0.35, { droop: 1.5, fold: 0.25, shape: 'heart' });
  }
}

/** a fiddle-leaf fig in a floor pot (centred): a wandering trunk, two side branches, leaves on stalks */
function plant(k: Kit, x: number, z: number, h = 1.5) {
  k.cyl('pot', 0.2, 0.15, 0.38, x, 0, z, { seg: 24 });
  k.cyl('pot', 0.212, 0.212, 0.035, x, 0.35, z, { seg: 24 });
  k.cyl('soil', 0.188, 0.188, 0.02, x, 0.365, z, { seg: 18 });
  const r = rng(seedOf(x, z));
  const top = 0.38 + h * 0.9, pts: V3[] = [];
  let px = x, pz = z;
  for (let i = 0; i <= 4; i++) {
    pts.push([px, 0.37 + (top - 0.37) * (i / 4), pz]);
    px += (r() - 0.5) * 0.07; pz += (r() - 0.5) * 0.07;
  }
  for (let i = 0; i < 4; i++) k.rod('wood2', ...pts[i], ...pts[i + 1], 0.024 - i * 0.004, 0.02 - i * 0.004, 7);
  const on = (t: number): V3 => { const f = Math.min(3.999, t * 4), i = f | 0; return along(pts[i], pts[i + 1], f - i); };
  const leafAt = (p: V3, a0: number, size: number, pitch: number, i: number) => {
    const a = clearYaw(k, p, a0, 0.045 + size, 0.03 + size * 0.31);
    if (a === null) return;
    // a short stalk, then the blade from its tip
    const q: V3 = [p[0] + Math.sin(a) * 0.045, p[1] + 0.025, p[2] + Math.cos(a) * 0.045];
    k.rod('leaf2', ...p, ...q, 0.004, 0.003, 4);
    k.leaf(i % 3 ? 'leaf' : 'leaf2', ...q, size, size * 0.7, a, pitch, { droop: 1.0, fold: 0.16, shape: 'fiddle' });
  };
  for (let i = 0; i < 18; i++) {
    const t = 0.25 + (0.75 * i) / 18;
    leafAt(on(t), i * 2.4 + r() * 0.3, 0.34 - 0.1 * t, 0.7 - 0.4 * (1 - t), i);
  }
  leafAt(pts[4], r() * 6.28, 0.2, 1.15, 1);
  for (const [t, len] of [[0.42, 0.34], [0.58, 0.3], [0.74, 0.26]]) {
    const b0 = on(t), a = clearYaw(k, b0, r() * 6.28, len * 0.85 + 0.25);
    if (a === null) continue;
    const b1: V3 = [b0[0] + Math.sin(a) * len * 0.85, b0[1] + len * 0.55, b0[2] + Math.cos(a) * len * 0.85];
    k.rod('wood2', ...b0, ...b1, 0.011, 0.006, 6);
    for (const [u, side] of [[0.35, 1], [0.6, -1], [0.82, 1], [1, 0]]) leafAt(along(b0, b1, u), a + side * 1.1, 0.27, 0.45, Math.round(u * 10));
  }
  k.foot(0.42, 0.42, x, z, 0.3, 0.2);
}

/** a long trough of arching grasses, each blade rooted in the soil */
function planter(k: Kit, len: number) {
  k.box('pot', len, 0.38, 0.3, 0, 0, 0, { r: 0.015 });
  k.box('soil', len - 0.05, 0.02, 0.25, 0, 0.37, 0);
  const r = rng(seedOf(len * 13, len));
  const n = Math.max(2, Math.round(len / 0.26));
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + (len * (i + 0.5)) / n, cz = (r() - 0.5) * 0.08;
    for (let j = 0; j < 7; j++) {
      const lean = r(), len = 0.36 + r() * 0.2;
      const a = clearYaw(k, [cx, 0.385, cz], j * 2.4 + r() * 0.5, len * 0.75, 0.04);
      if (a === null) continue;
      k.leaf(j % 2 ? 'leaf' : 'leaf2', cx + Math.sin(a) * 0.02, 0.385, cz + Math.cos(a) * 0.02, len, 0.035 + r() * 0.015, a, 1.2 - lean * 0.45, { droop: 1.4 + lean, fold: 0.35, shape: 'lance', rows: 5 });
    }
  }
  k.foot(len, 0.32, 0, 0, 0.3, 0.16);
}

function tableLamp(k: Kit, x: number, y: number, z: number) {
  k.cyl('metal', 0.065, 0.07, 0.015, x, y, z, { seg: 14 });
  k.cyl('pot', 0.045, 0.07, 0.2, x, y + 0.015, z, { seg: 14 });
  k.cyl('metal', 0.008, 0.008, 0.1, x, y + 0.215, z, { seg: 6 });
  k.cyl('shade', 0.105, 0.15, 0.2, x, y + 0.29, z, { seg: 20, open: true });
  k.ball('bulb', 0.035, 0.045, 0.035, x, y + 0.37, z, { seg: 8 });
  k.light('lamp', x, y + 0.42, z, 4.6);
  k.halo(x, y + 0.38, z);
  k.glow(x, 0.009, z, 1.25, true, 0.55);
}

function floorLamp(k: Kit, x: number, z: number) {
  k.cyl('metal', 0.15, 0.16, 0.02, x, 0, z, { seg: 18 });
  k.cyl('metal', 0.011, 0.011, 1.42, x, 0.02, z, { seg: 6 });
  k.cyl('shade', 0.16, 0.22, 0.27, x, 1.38, z, { seg: 22, open: true });
  k.ball('bulb', 0.04, 0.05, 0.04, x, 1.5, z, { seg: 8 });
  k.light('lamp', x, 1.58, z, 6.5);
  k.halo(x, 1.5, z);
  k.glow(x, 0.009, z, 1.6, true, 0.6);
  k.foot(0.34, 0.34, x, z, 0.22, 0.14);
}

/** framed painting hung on the wall behind local z = 0, centred at height y */
function art(k: Kit, w: number, h: number, idx: number, x = 0, y = 1.5) {
  k.box('artFrame', w + 0.05, h + 0.05, 0.028, x, y - h / 2 - 0.025, 0.014);
  const cell = 1 / ART_GRID, n = ((idx % 16) + 16) % 16;
  const cx = n % ART_GRID, cy = (n / ART_GRID) | 0;
  const asp = w / h, cw = (asp >= 1 ? 1 : asp) * 0.94, ch = (asp >= 1 ? 1 / asp : 1) * 0.94;
  k.wallQuad('art', w, h, x, y, 0.0292, {
    uv: [(cx + (1 - cw) / 2) * cell, 1 - (cy + (1 + ch) / 2) * cell, (cx + (1 + cw) / 2) * cell, 1 - (cy + (1 - ch) / 2) * cell],
  });
}

function rug(k: Kit, slot: string, w: number, d: number) {
  k.box(slot, w, 0.012, d, 0, 0.005, 0, { keep: true });
}

/* ------------------------------------------------------------------ living */

/** a scatter cushion resting at height y, leaning back */
function cushion(k: Kit, slot: string, x: number, y: number, z: number, ry = 0) {
  upright(k, slot, 0.46, 0.46, 0.15, x, y + 0.21, z, 0.32, ry, PILLOW);
}

/** wall-origin; armL / armR are the ends at local -x / +x */
function sofa(k: Kit, len: number, armL: boolean, armR: boolean, flip = false) {
  const dp = 0.94, aw = 0.17;
  for (const sx of [-1, 1]) for (const sz of [0.09, dp - 0.09]) k.cyl('wood2', 0.028, 0.019, 0.08, sx * (len / 2 - 0.09), 0, OFF + sz, { seg: 10 });
  // upholstered frame, back and rolled arms
  k.soft('fabric', len, 0.22, dp, 0, 0.18, OFF + dp / 2, FRAME);
  k.soft('fabric', len, 0.5, 0.2, 0, 0.52, OFF + 0.1, { side: 6, corner: 0.07, step: 0.09 });
  for (const [on, sx] of [[armL, -1], [armR, 1]] as const) {
    if (on) k.soft('fabric', aw, 0.44, dp, sx * (len / 2 - aw / 2), 0.42, OFF + dp / 2, { side: 3.2, corner: 0.075, puff: 0.01, step: 0.05 });
  }
  const x0 = -len / 2 + (armL ? aw : 0), inner = len - (armL ? aw : 0) - (armR ? aw : 0);
  const n = Math.max(1, Math.round(inner / 0.8)), sw = inner / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + sw * (i + 0.5);
    // seat cushions with a slight sat-in dip, plump back cushions leaning on the frame
    k.soft('fabric', sw - 0.014, 0.17, dp - 0.21, cx, 0.355, OFF + 0.2 + (dp - 0.21) / 2, { ...CUSHION, sag: 0.014, seed: i * 3.1 });
    upright(k, 'fabric', sw - 0.03, 0.44, 0.19, cx, 0.64, OFF + 0.3, 0.14, 0, { side: 3, corner: 0.09, puff: 0.02, pinch: 0.15, step: 0.05 });
  }
  const a = flip ? 'cushionB' : 'cushionA', b = flip ? 'cushionA' : 'cushionB';
  cushion(k, a, x0 + 0.26, 0.45, OFF + 0.4, 0.25);
  if (inner > 1.5) cushion(k, b, x0 + inner - 0.26, 0.45, OFF + 0.4, -0.25);
  if (inner > 2.2) cushion(k, b, x0 + 0.62, 0.44, OFF + 0.42, 0.1);
  k.foot(len, dp + OFF, 0, (dp + OFF) / 2, 0.36, 0.22);
}

function coffeeTable(k: Kit, w: number, d: number) {
  k.box('counter', w, 0.035, d, 0, 0.365, 0, { r: 0.012 });
  k.box('wood', w - 0.14, 0.03, d - 0.14, 0, 0.13, 0, { sw: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box('metal', 0.024, 0.365, 0.024, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05));
  books(k, -w * 0.3, 0.4, 0.03, 0.3);
  // a brass urli of floating flowers and diyas in the middle of the table
  IN.urli(k, w * 0.12, 0.4, 0, Math.min(0.2, d * 0.36));
  // on the lower shelf: small enough to stay under the tabletop (0.365 m)
  smallPlant(k, w * 0.2, 0.16, 0.02, 0.55);
  k.foot(w, d, 0, 0, 0.34, 0.2);
}

function sideTable(k: Kit, x: number, z: number, lamp = true) {
  k.cyl('wood', 0.24, 0.24, 0.03, x, 0.5, z, { seg: 22 });
  k.cyl('metal', 0.014, 0.014, 0.5, x, 0, z, { seg: 6 });
  k.cyl('metal', 0.15, 0.16, 0.014, x, 0, z, { seg: 18 });
  if (lamp) tableLamp(k, x, 0.53, z);
  k.foot(0.48, 0.48, x, z, 0.24, 0.16);
}

/** wall-origin feature wall: slatted panel, floating console, TV */
function tvUnit(k: Kit, w: number, idx = 0) {
  const pw = w + 0.7;
  k.box('panel', pw, 2.24, 0.03, 0, 0, 0.015);
  k.box('cove', pw, 0.012, 0.014, 0, 2.245, 0.03);
  k.box('wood', w, 0.34, 0.4, 0, 0.2, 0.23, { r: 0.008, sw: true });
  for (let i = 1; i < 3; i++) k.box('black', 0.005, 0.3, 0.004, -w / 2 + (w * i) / 3, 0.22, 0.432);
  k.box('black', 1.3, 0.76, 0.035, 0, 0.94, 0.05, { r: 0.008 });
  k.box('screen', 1.26, 0.72, 0.006, 0, 0.96, 0.068);
  k.box('black', 0.8, 0.055, 0.09, 0, 0.54, 0.3, { r: 0.02 });
  smallPlant(k, -w / 2 + 0.18, 0.54, 0.24);
  vase(k, w / 2 - 0.18, 0.54, 0.24, 0.22, idx % 2 ? 'decorA' : 'decorB');
  books(k, w / 2 - 0.46, 0.54, 0.24, -0.1);
  k.foot(w, 0.44, 0, 0.22, 0.32, 0.2);
  k.glow(0, 0.009, 0.5, 1.3, true, 0.35);
}

/** wall-origin slim hall table with a round mirror above */
function entryConsole(k: Kit, w: number) {
  k.box('wood', w, 0.04, 0.34, 0, 0.8, 0.19, { r: 0.01, sw: true });
  for (const sx of [-1, 1]) {
    k.box('metal', 0.022, 0.8, 0.022, sx * (w / 2 - 0.04), 0, 0.05);
    k.box('metal', 0.022, 0.8, 0.022, sx * (w / 2 - 0.04), 0, 0.33);
  }
  k.box('metal', w - 0.08, 0.018, 0.018, 0, 0.16, 0.33);
  k.cyl('metal', 0.38, 0.38, 0.02, 0, 1.5, 0.012, { seg: 36, rx: Math.PI / 2 });
  k.cyl('mirror', 0.355, 0.355, 0.006, 0, 1.5, 0.025, { seg: 36, rx: Math.PI / 2 });
  vase(k, -w / 2 + 0.2, 0.84, 0.19, 0.3);
  k.cyl('metal', 0.13, 0.13, 0.012, w / 2 - 0.3, 0.84, 0.19, { seg: 18 });
  k.box('paper', 0.12, 0.02, 0.09, w / 2 - 0.3, 0.852, 0.19, { ry: 0.3 });
  tableLamp(k, w / 2 - 0.14, 0.84, 0.19);
  k.foot(w, 0.38, 0, 0.19, 0.24, 0.16);
}

/* ------------------------------------------------------------------ dining */

/** centred; the sitter faces local +z */
function chair(k: Kit) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood2', 0.018, 0.013, 0.43, sx * 0.19, 0, sz * 0.19, { seg: 8 });
  k.soft('fabric2', 0.47, 0.075, 0.46, 0, 0.458, 0, { side: 5, corner: 0.06, puff: 0.008, step: 0.07 });
  upright(k, 'fabric2', 0.45, 0.42, 0.06, 0, 0.71, -0.2, 0.1, 0, { side: 4, corner: 0.07, puff: 0.006, step: 0.07 });
  k.foot(0.48, 0.5, 0, 0, 0.26, 0.14);
}

function diningSet(k: Kit, w = 1.68, d = 0.95) {
  k.box('wood', w, 0.045, d, 0, 0.7, 0, { r: 0.015, sw: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood', 0.04, 0.024, 0.7, sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.12), { seg: 8 });
  k.box('linen', w * 0.86, 0.004, 0.3, 0, 0.746, 0);
  const top = 0.75;
  // end seats keep their glass tucked in, clear of the place settings along the sides
  const seat = (x: number, z: number, ry: number, gx = 0.1, gz = 0.52) => {
    k.at(x, z, ry, () => {
      chair(k);
      // a place setting in front of each chair, 0.37 m out: clear of its neighbours and the candles
      IN.thali(k, top);
      void gx; void gz;
    });
  };
  for (const sx of [-1, 1]) {
    seat(sx * w * 0.24, d / 2 + 0.17, U);
    seat(sx * w * 0.24, -d / 2 - 0.17, D);
    seat(sx * (w / 2 + 0.17), 0, sx > 0 ? L : R, 0.12, 0.5);
  }
  vase(k, 0, top, 0, 0.24, 'decorB');
  for (const sx of [-1, 1]) {
    k.cyl('metal', 0.03, 0.04, 0.02, sx * 0.3, top, 0, { seg: 10 });
    k.cyl('paper', 0.012, 0.012, 0.2, sx * 0.3, top + 0.02, 0, { seg: 8 });
  }
  k.foot(w, d, 0, 0, 0.44, 0.32);

  // one light fitting per style, hung over the centre of the table
  const cord = (x: number, y0: number) => {
    k.cyl('metal', 0.003, 0.003, CUT - y0, x, y0, 0, { seg: 4 });
    k.layer(true, () => k.cyl('metal', 0.003, 0.003, H - CUT, x, CUT, 0, { seg: 4 }));
  };
  k.forStyle('lux', () => {
    const ring = new THREE.TorusGeometry(0.46, 0.022, 8, 44); ring.rotateX(Math.PI / 2);
    const strip = new THREE.TorusGeometry(0.455, 0.012, 6, 44); strip.rotateX(Math.PI / 2);
    k.raw('metal', ring, 0, 1.72, 0, { keep: true });
    k.raw('cove', strip, 0, 1.704, 0, { keep: true });
    for (const a of [0, 2.094, 4.188]) cord(Math.cos(a) * 0.46, 1.72);
  });
  k.forStyle('modern', () => {
    k.box('metal', 1.3, 0.05, 0.05, 0, 1.7, 0);
    k.box('cove', 1.24, 0.008, 0.03, 0, 1.693, 0);
    for (const sx of [-1, 1]) cord(sx * 0.55, 1.75);
  });
  k.forStyle('scandi', () => {
    for (const x of [-0.5, 0, 0.5]) {
      k.cyl('lacquer', 0.02, 0.17, 0.15, x, 1.62, 0, { seg: 20, open: true });
      k.ball('bulb', 0.04, 0.05, 0.04, x, 1.64, 0, { seg: 8 });
      cord(x, 1.77);
    }
  });
  k.light('lamp', 0, 1.58, 0, 9.5);
  k.halo(0, 1.68, 0);
  k.glow(0, top + 0.012, 0, 0.95, true, 0.5);
  k.glow(0, 0.009, 0, 2.1, true, 0.6);
}

/** wall-origin sideboard / crockery unit */
function sideboard(k: Kit, w: number, lamp = true) {
  const h = 0.78, dp = 0.44;
  for (const sx of [-1, 1]) for (const sz of [0.06, dp - 0.05]) k.box('metal', 0.03, 0.13, 0.03, sx * (w / 2 - 0.08), 0, sz);
  k.box('wood', w, h - 0.13, dp, 0, 0.13, dp / 2 + 0.005, { r: 0.008, sw: true });
  const n = Math.max(2, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) k.box('black', 0.004, h - 0.19, 0.004, -w / 2 + (w * i) / n, 0.16, dp + 0.006);
  for (let i = 0; i < n; i++) k.box('metal', 0.012, 0.12, 0.016, -w / 2 + (w * (i + 0.5)) / n + (i % 2 ? -0.2 : 0.2) * (w / n), 0.5, dp + 0.012);
  if (lamp) tableLamp(k, -w / 2 + 0.24, h, dp / 2);
  vase(k, w / 2 - 0.24, h, dp / 2, 0.3, 'decorA');
  books(k, w / 2 - 0.62, h, dp / 2, 0.1);
  bowl(k, 0, h, dp / 2);
  k.foot(w, dp + 0.02, 0, dp / 2, 0.34, 0.22);
}

/* ------------------------------------------------------------------ bedrooms */

/**
 * wall-origin; head against the wall. An upholstered bed: channel-tufted headboard with round
 * tops, a padded base, a plump mattress, and bedding that drapes over the sides and foot.
 */
function bed(k: Kit, w: number, len = 2.0, wing = 0) {
  // without wings the headboard stops short of the bedside tables; with wings it runs behind them
  const hw = w + 0.1 + wing * 2;
  // headboard: pill-shaped channels standing proud of a timber back
  const n = Math.max(3, Math.round(hw / 0.3)), cw = hw / n, bot = 0.12, ch = 1.2 - bot;
  k.box('wood2', hw, 0.9, 0.045, 0, 0.06, 0.0225, { r: 0.012 });
  for (let i = 0; i < n; i++) {
    k.soft('fabric2', cw - 0.012, 0.11, ch, -hw / 2 + cw * (i + 0.5), bot + ch / 2, 0.105, { rx: -Math.PI / 2, corner: cw / 2 - 0.007, side: 3.4, puff: 0.012, step: 0.06 });
  }
  const z0 = 0.1, zc = z0 + len / 2;
  for (const sx of [-1, 1]) for (const sz of [0.14, len - 0.1]) k.cyl('wood2', 0.03, 0.022, 0.08, sx * (w / 2 - 0.08), 0, z0 + sz, { seg: 10 });
  k.soft('fabric2', w + 0.1, 0.26, len + 0.06, 0, 0.21, zc + 0.01, { corner: 0.07, side: 9, step: 0.1 });
  k.soft('linen', w, 0.22, len - 0.02, 0, 0.44, zc, { corner: 0.09, side: 7, puff: 0.012, step: 0.14 });
  const T = 0.555;

  // duvet: lies on the mattress and falls over both sides and the foot, corners hanging in cones
  const hang = 0.27, dz0 = z0 + 0.66, dz1 = z0 + len + hang, dc = (dz0 + dz1) / 2;
  k.soft('duvet', w + hang * 2, 0.07, dz1 - dz0, 0, T + 0.035, dc, {
    corner: 0.05, side: 3, puff: 0.02, rumple: 0.006, step: 0.075,
    drape: { hw: w / 2, end: z0 + len - dc, bend: 0.05 },
  });
  // the top sheet turned back over the duvet
  k.soft('linen', w + hang * 2 + 0.02, 0.03, 0.3, 0, T + 0.097, dz0 + 0.13, { corner: 0.03, side: 4, rumple: 0.003, step: 0.06, drape: { hw: w / 2, bend: 0.125 } });

  // two rows of pillows leaning on the headboard, then cushions in front
  const pw = w / 2 - 0.09;
  for (const sx of [-1, 1]) {
    upright(k, 'linen', pw, 0.5, 0.17, (sx * w) / 4, T + 0.2, z0 + 0.21, 0.38, 0, { ...PILLOW, seed: sx * 2.7 });
    upright(k, 'duvet', pw - 0.06, 0.44, 0.15, (sx * w) / 4, T + 0.165, z0 + 0.37, 0.5, 0, { ...PILLOW, seed: sx * 4.1 });
  }
  upright(k, 'cushionA', 0.52, 0.3, 0.14, 0, T + 0.13, z0 + 0.52, 0.55, 0, { ...PILLOW, corner: 0.07 });
  if (w > 1.7) for (const sx of [-1, 1]) upright(k, 'cushionB', 0.4, 0.4, 0.13, sx * 0.44, T + 0.17, z0 + 0.5, 0.5, sx * 0.12, PILLOW);

  // a knitted throw across the foot, falling over both sides
  k.soft('throw', w + 0.62, 0.028, 0.55, 0, T + 0.094, z0 + len - 0.42, { corner: 0.03, side: 4, rumple: 0.008, step: 0.065, drape: { hw: w / 2, bend: 0.13 } });
  // you walk up to the frame; the bedding that falls past it only darkens the floor
  k.solid(w + 0.1, len + 0.14, 0, (len + 0.14) / 2);
  k.shadow(w + 0.22, len + 0.24, 0, (len + 0.24) / 2, 0.44, 0.3);
}

/** wall-origin; `off` brings it forward, clear of a headboard that runs behind it */
function nightstand(k: Kit, lamp = true, off = 0) {
  k.at(0, off, 0, () => nightstandBody(k, lamp));
}

function nightstandBody(k: Kit, lamp: boolean) {
  for (const sx of [-1, 1]) for (const sz of [0.06, 0.38]) k.box('metal', 0.022, 0.12, 0.022, sx * 0.2, 0, sz);
  k.box('wood', 0.5, 0.34, 0.42, 0, 0.12, 0.22, { r: 0.008, sw: true });
  k.box('black', 0.46, 0.004, 0.004, 0, 0.29, 0.432);
  k.box('metal', 0.1, 0.012, 0.016, 0, 0.36, 0.438);
  k.box('metal', 0.1, 0.012, 0.016, 0, 0.2, 0.438);
  if (lamp) tableLamp(k, 0, 0.46, 0.2);
  else books(k, 0, 0.46, 0.22, 0.2);
  k.foot(0.5, 0.44, 0, 0.22, 0.3, 0.16);
}

/** wall-origin fitted wardrobe, 2.2 m tall */
function wardrobe(k: Kit, w: number, mirrorAt = -1) {
  const h = 2.2, dp = 0.58;
  k.box('black', w - 0.02, 0.08, dp - 0.06, 0, 0, dp / 2 - 0.02);
  k.box('lacquer', w, h - 0.08, dp, 0, 0.08, dp / 2);
  const n = Math.max(2, Math.round(w / 0.52)), pw = w / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + pw * (i + 0.5);
    k.box(i === mirrorAt ? 'mirror' : 'wood', pw - 0.006, h - 0.1, 0.02, x, 0.09, dp + 0.01);
    k.box('metal', 0.012, 0.9, 0.022, x + (i % 2 ? -1 : 1) * (pw / 2 - 0.045), 0.75, dp + 0.031);
  }
  // the loft above, right up to the ceiling — every Indian bedroom has one
  k.box('lacquer', w, CUT - h, dp, 0, h, dp / 2);
  k.layer(true, () => {
    k.box('lacquer', w, H - CUT - 0.01, dp, 0, CUT, dp / 2);
    for (let i = 1; i < n; i++) k.box('black', 0.004, H - h - 0.06, 0.004, -w / 2 + pw * i, h + 0.03, dp + 0.002);
    k.box('black', w, 0.004, 0.004, 0, h + 0.005, dp + 0.002);
    for (let i = 0; i < n; i++) k.box('metal', 0.1, 0.012, 0.016, -w / 2 + pw * (i + 0.5), h + 0.12, dp + 0.01);
  });
  k.foot(w, dp + 0.03, 0, (dp + 0.03) / 2, 0.42, 0.26);
}

/** wall-origin writing desk with a chair pulled up to it */
function desk(k: Kit, w = 1.15) {
  const dp = 0.55;
  k.box('wood', w, 0.035, dp, 0, 0.72, OFF + dp / 2, { r: 0.01, sw: true });
  for (const sx of [-1, 1]) for (const sz of [0.05, dp - 0.05]) k.box('metal', 0.024, 0.72, 0.024, sx * (w / 2 - 0.04), 0, OFF + sz);
  k.box('wood', 0.36, 0.2, dp - 0.08, w / 2 - 0.22, 0.52, OFF + dp / 2);
  k.box('steel', 0.32, 0.012, 0.22, -0.08, 0.757, OFF + 0.3);
  k.box('screen', 0.32, 0.21, 0.01, -0.08, 0.765, OFF + 0.19, { rx: -0.25 });
  books(k, w / 2 - 0.2, 0.757, OFF + 0.22, 0.1);
  smallPlant(k, -w / 2 + 0.14, 0.757, OFF + 0.16, 0.9);
  k.at(-0.05, OFF + dp + 0.2, U, () => chair(k));
  k.foot(w, dp + OFF, 0, (dp + OFF) / 2, 0.3, 0.2);
}

/** wall-origin dresser with a mirror */
function dresser(k: Kit, w = 1.2) {
  const dp = 0.4, h = 0.78;
  for (const sx of [-1, 1]) for (const sz of [0.05, dp - 0.05]) k.box('metal', 0.022, 0.14, 0.022, sx * (w / 2 - 0.05), 0, sz);
  k.box('wood', w, h - 0.14, dp, 0, 0.14, dp / 2 + 0.004, { r: 0.008, sw: true });
  for (let i = 1; i < 3; i++) k.box('black', w - 0.04, 0.004, 0.004, 0, 0.14 + ((h - 0.14) * i) / 3, dp + 0.006);
  for (let i = 0; i < 3; i++) k.box('metal', 0.14, 0.012, 0.016, 0, 0.24 + ((h - 0.14) * i) / 3, dp + 0.012);
  k.box('artFrame', 0.62, 0.92, 0.02, 0, 0.98, 0.01);
  k.wallQuad('mirror', 0.58, 0.88, 0, 1.44, 0.0215);
  vase(k, -w / 2 + 0.2, h, dp / 2, 0.22, 'decorA');
  k.cyl('metal', 0.1, 0.1, 0.012, w / 2 - 0.26, h, dp / 2, { seg: 16 });
  k.foot(w, dp + 0.02, 0, dp / 2, 0.3, 0.2);
}

function bench(k: Kit, w = 1.3) {
  k.soft('fabric2', w, 0.11, 0.42, 0, 0.415, 0, { side: 5, corner: 0.06, puff: 0.01, step: 0.07 });
  for (const sx of [-1, 1]) {
    k.box('metal', 0.022, 0.36, 0.022, sx * (w / 2 - 0.05), 0, -0.17);
    k.box('metal', 0.022, 0.36, 0.022, sx * (w / 2 - 0.05), 0, 0.17);
    k.box('metal', 0.022, 0.022, 0.34, sx * (w / 2 - 0.05), 0.08, 0);
  }
  k.foot(w, 0.44, 0, 0, 0.28, 0.16);
}

function armchair(k: Kit) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood2', 0.02, 0.014, 0.2, sx * 0.28, 0, sz * 0.28, { seg: 8 });
  k.soft('fabric2', 0.72, 0.2, 0.72, 0, 0.3, 0, { ...FRAME, corner: 0.09 });
  upright(k, 'fabric2', 0.72, 0.52, 0.16, 0, 0.62, -0.28, 0.14, 0, { side: 4, corner: 0.11, puff: 0.012, step: 0.06 });
  for (const sx of [-1, 1]) k.soft('fabric2', 0.13, 0.26, 0.62, sx * 0.3, 0.49, 0.04, { side: 3, corner: 0.06, puff: 0.008, step: 0.05 });
  k.soft('fabric2', 0.47, 0.1, 0.56, 0, 0.45, 0.06, { ...CUSHION, sag: 0.01 });
  cushion(k, 'cushionA', 0, 0.48, -0.12);
  k.foot(0.76, 0.78, 0, 0, 0.3, 0.18);
}

/* ------------------------------------------------------------------ kitchen */

type RunOpts = { sink?: number; hob?: number; win?: [number, number]; props?: boolean };

/** wall-origin base cabinets with a stone top; sink / hob positions are local x */
function counterRun(k: Kit, len: number, o: RunOpts = {}) {
  const dp = 0.6, hgt = 0.86, th = 0.04, td = dp + 0.02;
  // modular cabinets under the platform are fit-out
  k.box('black', len, 0.1, dp - 0.07, 0, 0, dp / 2 - 0.035);
  k.box('cabinet', len, hgt - 0.1, dp - 0.02, 0, 0.1, (dp - 0.02) / 2);
  const n = Math.max(1, Math.round(len / 0.55));
  for (let i = 1; i < n; i++) k.box('black', 0.004, hgt - 0.12, 0.004, -len / 2 + (len * i) / n, 0.11, dp - 0.018);
  for (let i = 0; i < n; i++) k.box('metal', 0.16, 0.012, 0.018, -len / 2 + (len * (i + 0.5)) / n, hgt - 0.1, dp - 0.01);
  // the builder hands over the granite platform on brick piers, the sink, the tap and the dado tiles
  k.fit(false, () => counterShell(k, len, o));
  k.fit(false, () => k.foot(len, td, 0, td / 2, 0.44, 0.26));
  const top = hgt + th;
  if (o.hob !== undefined) {
    const hx = o.hob;
    IN.gasStove(k, hx, top, dp / 2 + 0.03);
    k.box('steel', 0.6, 0.07, 0.48, hx, 1.52, 0.24, { r: 0.006 });
    k.box('steel', 0.26, CUT - 1.6, 0.24, hx, 1.59, 0.13);
    k.box('cove', 0.4, 0.006, 0.05, hx, 1.514, 0.3);
    // dinner on: the cooker on one burner, the kadai on another
    IN.pressureCooker(k, hx - 0.24, top + 0.05, dp / 2 + 0.01, 0.4);
    IN.kadai(k, hx + 0.24, top + 0.05, dp / 2 + 0.01);
  }
  if (o.props !== false) {
    const free = (x: number) => (o.sink === undefined || Math.abs(x - o.sink) > 0.42) && (o.hob === undefined || Math.abs(x - o.hob) > 0.5);
    const spots = [-len / 2 + 0.22, -len / 2 + 0.62, len / 2 - 0.22, len / 2 - 0.62, 0].filter(free);
    const put = [
      (x: number) => IN.masalaDabba(k, x, top, 0.36),
      (x: number) => IN.dabbas(k, x - 0.18, top, 0.12, 3),
      (x: number) => bowl(k, x, top, 0.34),
      (x: number) => { k.box('wood', 0.3, 0.02, 0.2, x, top, 0.3, { ry: 0.15 }); smallPlant(k, x + 0.02, top, 0.12, 0.75); },
    ];
    spots.slice(0, put.length).forEach((x, i) => put[i](x));
  }
}

function counterShell(k: Kit, len: number, o: RunOpts) {
  const dp = 0.6, hgt = 0.86, th = 0.04, td = dp + 0.02;
  const piers = Math.max(2, Math.round(len / 1.1) + 1);
  for (let i = 0; i < piers; i++) k.box('wall', 0.1, hgt, dp - 0.05, -len / 2 + 0.05 + ((len - 0.1) * i) / (piers - 1), 0, (dp - 0.05) / 2);
  k.box('granite', len, 0.02, dp - 0.1, 0, 0.18, (dp - 0.1) / 2);

  if (o.sink !== undefined) {
    const sx = o.sink, sw = 0.54, sd = 0.4, sz = 0.31;
    const l = sx - sw / 2 + len / 2, r = len / 2 - (sx + sw / 2);
    k.box('counter', l, th, td, -len / 2 + l / 2, hgt, td / 2);
    k.box('counter', r, th, td, len / 2 - r / 2, hgt, td / 2);
    k.box('counter', sw, th, sz - sd / 2, sx, hgt, (sz - sd / 2) / 2);
    k.box('counter', sw, th, td - (sz + sd / 2), sx, hgt, (td + sz + sd / 2) / 2);
    k.box('steel', sw, 0.008, sd, sx, hgt - 0.17, sz);
    for (const s of [-1, 1]) {
      k.box('steel', 0.008, 0.2, sd, sx + s * (sw / 2 - 0.004), hgt - 0.17, sz);
      k.box('steel', sw, 0.2, 0.008, sx, hgt - 0.17, sz + s * (sd / 2 - 0.004));
    }
    k.cyl('chrome', 0.022, 0.026, 0.03, sx, hgt + th, 0.07, { seg: 12 });
    k.cyl('chrome', 0.012, 0.012, 0.27, sx, hgt + th + 0.03, 0.07, { seg: 8 });
    k.box('chrome', 0.022, 0.022, 0.2, sx, hgt + th + 0.29, 0.16);
    k.cyl('chrome', 0.011, 0.011, 0.05, sx, hgt + th + 0.25, 0.25, { seg: 8 });
  } else {
    k.box('counter', len, th, td, 0, hgt, td / 2);
  }
  // a bullnose front edge on the granite
  k.cyl('counter', 0.02, 0.02, len, 0, hgt + th / 2 - len / 2, td, { seg: 8, rz: Math.PI / 2 });
  const top = hgt + th;

  // splashback, cut around the window when there is one
  const sb = (x0: number, x1: number, y0: number, y1: number) => { if (x1 - x0 > 0.02) k.box('backsplash', x1 - x0, y1 - y0, 0.012, (x0 + x1) / 2, y0, 0.006); };
  if (o.win) {
    sb(-len / 2, o.win[0], top, 1.5); sb(o.win[1], len / 2, top, 1.5); sb(o.win[0], o.win[1], top, 1.03);
  } else sb(-len / 2, len / 2, top, 1.5);
}

/** wall-origin wall cabinets; `gap` leaves room for the chimney at that local x */
function upperRun(k: Kit, x0: number, x1: number, gap?: number) {
  const seg = (a: number, b: number) => {
    const len = b - a;
    if (len < 0.2) return;
    k.box('cabinetUp', len, 0.72, 0.34, (a + b) / 2, 1.5, 0.17);
    const n = Math.max(1, Math.round(len / 0.5));
    for (let i = 1; i < n; i++) k.box('black', 0.004, 0.7, 0.004, a + (len * i) / n, 1.51, 0.342);
    k.box('cove', len - 0.08, 0.008, 0.02, (a + b) / 2, 1.492, 0.27);
    k.light('lamp', (a + b) / 2, 1.4, 0.35, 2.4, 0xffe9cf);
  };
  if (gap === undefined) seg(x0, x1); else { seg(x0, gap - 0.32); seg(gap + 0.32, x1); }
}

/** wall-origin; w is the cabinet width */
function fridge(k: Kit, w = 0.7) {
  k.box('steel', w, 1.82, 0.66, 0, 0.02, 0.34, { r: 0.018 });
  k.box('black', w, 0.006, 0.004, 0, 0.74, 0.672);
  k.box('black', 0.006, 1.06, 0.004, 0, 0.76, 0.672);
  for (const sx of [-1, 1]) k.box('chrome', 0.016, 0.5, 0.022, sx * 0.05, 0.98, 0.685);
  k.box('chrome', 0.3, 0.016, 0.022, 0, 0.62, 0.685);
  k.foot(w, 0.7, 0, 0.35, 0.42, 0.22);
}

/** wall-origin puja mandir */
function mandir(k: Kit, w: number) {
  const dp = 0.42;
  k.box('wood', w, 0.7, dp, 0, 0, dp / 2, { r: 0.006 });
  k.box('black', 0.004, 0.62, 0.004, 0, 0.04, dp + 0.002);
  for (const sx of [-1, 1]) k.cyl('metal', 0.014, 0.014, 0.02, sx * 0.07, 0.4, dp + 0.012, { seg: 8, rx: Math.PI / 2 });
  k.box('counter', w + 0.03, 0.03, dp + 0.015, 0, 0.7, (dp + 0.015) / 2);
  k.box('wood2', w, 0.92, 0.02, 0, 0.73, 0.012);
  k.box('cove', w * 0.52, 0.56, 0.006, 0, 0.86, 0.025);
  for (const sx of [-1, 1]) {
    k.cyl('wood', 0.03, 0.036, 0.86, sx * (w / 2 - 0.05), 0.73, dp - 0.06, { seg: 10 });
    k.cyl('metal', 0.04, 0.03, 0.03, sx * (w / 2 - 0.05), 1.59, dp - 0.06, { seg: 10 });
  }
  // cornice overhangs at the front and sides, flush with the wall behind
  k.box('wood', w + 0.08, 0.05, dp + 0.025, 0, 1.62, (dp + 0.025) / 2);
  k.box('wood', w * 0.74, 0.07, dp * 0.8, 0, 1.67, dp / 2);
  k.box('wood', w * 0.44, 0.07, dp * 0.55, 0, 1.74, dp / 2);
  k.cyl('metal', 0.012, 0.04, 0.11, 0, 1.81, dp / 2, { seg: 10 });
  // brass lamps, a kalash and a line of marigolds
  for (const sx of [-1, 1]) {
    k.cyl('metal', 0.05, 0.035, 0.022, sx * w * 0.27, 0.73, dp * 0.6, { seg: 12 });
    k.cyl('metal', 0.014, 0.022, 0.1, sx * w * 0.27, 0.752, dp * 0.6, { seg: 8 });
    k.cyl('metal', 0.04, 0.02, 0.02, sx * w * 0.27, 0.852, dp * 0.6, { seg: 10 });
    k.ball('diya', 0.011, 0.024, 0.011, sx * w * 0.27, 0.895, dp * 0.6, { seg: 6 });
    k.halo(sx * w * 0.27, 0.9, dp * 0.6);
    k.cyl('metal', 0.002, 0.002, 0.12, sx * w * 0.2, 1.5, dp * 0.7, { seg: 4 });
    k.cyl('metal', 0.006, 0.03, 0.05, sx * w * 0.2, 1.45, dp * 0.7, { seg: 10 });
  }
  k.ball('metal', 0.06, 0.065, 0.06, 0, 0.8, dp * 0.42, { seg: 12 });
  k.cyl('metal', 0.03, 0.04, 0.03, 0, 0.855, dp * 0.42, { seg: 10 });
  // mango leaves fanned round the kalash mouth, a coconut resting on them
  for (let i = 0; i < 5; i++) k.leaf('leaf2', 0, 0.882, dp * 0.42, 0.085, 0.028, i * 1.2566, 0.45, { droop: 1.3, fold: 0.2, shape: 'lance' });
  k.ball('wood2', 0.036, 0.046, 0.036, 0, 0.925, dp * 0.42, { seg: 10 });
  k.cyl('metal', 0.11, 0.11, 0.01, 0, 0.73, dp * 0.78, { seg: 18 });
  for (let i = 0; i < 9; i++) k.ball(i % 2 ? 'fruit' : 'decorA', 0.018, 0.018, 0.018, -w * 0.34 + (w * 0.68 * i) / 8, 1.58 - Math.sin((i / 8) * Math.PI) * 0.07, dp - 0.04, { seg: 6 });
  k.light('always', 0, 1.15, dp + 0.2, 1.7, 0xffb469);
  k.foot(w, dp + 0.03, 0, dp / 2, 0.34, 0.2);
}

/* ------------------------------------------------------------------ bathrooms */

function wc(k: Kit) {
  k.fit(false, () => wcBody(k));
}

function wcBody(k: Kit) {
  k.at(0.36, 0, 0, () => IN.healthFaucet(k, 0.62));
  k.box('ceramic', 0.38, 0.4, 0.17, 0, 0.4, 0.085, { r: 0.03 });
  k.box('ceramic', 0.36, 0.4, 0.5, 0, 0, 0.42, { r: 0.1 });
  k.box('white', 0.37, 0.024, 0.45, 0, 0.4, 0.41, { r: 0.01 });
  k.box('chrome', 0.11, 0.05, 0.01, 0, 0.82, 0.09);
  k.box('chrome', 0.13, 0.11, 0.02, -0.36, 0.66, 0.01);
  k.cyl('white', 0.05, 0.05, 0.1, -0.36, 0.66, 0.07, { seg: 12, rz: Math.PI / 2 });
  k.foot(0.4, 0.68, 0, 0.34, 0.3, 0.14);
}

function vanity(k: Kit, w: number) {
  k.box('wood', w, 0.3, 0.46, 0, 0.5, 0.23, { sw: true });
  k.box('black', 0.004, 0.28, 0.004, 0, 0.51, 0.462);
  k.fit(false, () => {
    k.box('granite', w + 0.02, 0.03, 0.48, 0, 0.8, 0.24);
    k.cyl('ceramic', 0.2, 0.15, 0.12, 0, 0.83, 0.25, { seg: 22 });
    k.cyl('chrome', 0.013, 0.013, 0.24, 0, 0.83, 0.05, { seg: 8 });
    k.box('chrome', 0.02, 0.02, 0.16, 0, 1.06, 0.12);
    for (const sx of [-1, 1]) k.box('chrome', 0.03, 0.2, 0.4, sx * (w / 2 - 0.1), 0.6, 0.21);
    k.foot(w, 0.5, 0, 0.25, 0.28, 0.16);
  });
  const mw = Math.min(w - 0.06, 0.9);
  k.box('metal', mw + 0.03, 0.83, 0.02, 0, 1.07, 0.01);
  k.wallQuad('mirror', mw, 0.8, 0, 1.485, 0.0215);
  k.box('cove', mw * 0.8, 0.03, 0.04, 0, 1.95, 0.03);
  k.light('lamp', 0, 1.85, 0.4, 4.6, 0xffe9d0);
  k.halo(0, 1.96, 0.06);
  k.cyl('decorA', 0.022, 0.026, 0.13, w / 2 - 0.12, 0.83, 0.16, { seg: 8 });
  k.cyl('decorB', 0.02, 0.024, 0.1, w / 2 - 0.19, 0.83, 0.2, { seg: 8 });
  k.soft('towel', 0.22, 0.07, 0.16, -w / 2 + 0.16, 0.865, 0.26, { side: 3, corner: 0.035, puff: 0.005, step: 0.04 });
}

/** wall-origin shower bay; `geyserAt` is where the water heater hangs along the wall (null = no room for one) */
function shower(k: Kit, geyserAt: number | null = 0.45, bucket = true) {
  k.fit(false, () => {
    k.box('chrome', 0.12, 0.12, 0.03, 0, 0.98, 0.015, { r: 0.008 });
    k.cyl('chrome', 0.011, 0.011, 1.06, 0, 1.04, 0.035, { seg: 8 });
    k.box('chrome', 0.02, 0.02, 0.36, 0, 2.08, 0.2);
    k.cyl('chrome', 0.11, 0.11, 0.014, 0, 2.05, 0.38, { seg: 18 });
    IN.lowTap(k, 0.6);
    IN.floorDrain(k, 0.22, 0.45);
  });
  // the bucket and mug under the low tap, and the geyser up on the wall
  if (bucket) k.at(-0.05, 0.3, 0, () => IN.bucketMug(k));
  if (geyserAt !== null) k.at(geyserAt, 0, 0, () => IN.geyser(k, 1.82));
  k.box('counter', 0.34, 0.02, 0.1, 0.34, 1.12, 0.05);
  k.cyl('decorA', 0.024, 0.024, 0.15, 0.27, 1.14, 0.05, { seg: 8 });
  k.cyl('white', 0.026, 0.026, 0.13, 0.36, 1.14, 0.05, { seg: 8 });
}

/** centred; glass runs along local x */
function glassScreen(k: Kit, len: number) {
  k.fit(false, () => glassScreenBody(k, len));
}

function glassScreenBody(k: Kit, len: number) {
  k.box('glass', len, 1.98, 0.01, 0, 0.03, 0);
  k.box('chrome', len, 0.022, 0.022, 0, 2.01, 0);
  k.box('chrome', len, 0.03, 0.022, 0, 0, 0);
  k.solid(len, 0.05);
}

function towelRail(k: Kit) {
  k.fit(false, () => {
    k.box('chrome', 0.62, 0.016, 0.016, 0, 1.16, 0.06);
    for (const sx of [-1, 1]) k.box('chrome', 0.016, 0.016, 0.06, sx * 0.3, 1.16, 0.03);
  });
  overBar(k, 'towel', 0.42, 0.5, -0.04, 1.168, 0.06);
}

/* ------------------------------------------------------------------ outdoors */

function loungeChair(k: Kit) {
  for (const sx of [-1, 1]) {
    k.box('wood2', 0.04, 0.4, 0.62, sx * 0.3, 0, 0);
    k.box('wood2', 0.04, 0.04, 0.62, sx * 0.3, 0.52, 0);
  }
  k.box('wood2', 0.6, 0.04, 0.6, 0, 0.26, 0);
  k.soft('fabric', 0.54, 0.1, 0.54, 0, 0.35, 0.01, { ...CUSHION, sag: 0.01 });
  upright(k, 'fabric', 0.54, 0.42, 0.1, 0, 0.6, -0.25, 0.2, 0, { side: 4, corner: 0.07, puff: 0.01, step: 0.06 });
  k.foot(0.66, 0.66, 0, 0, 0.3, 0.16);
}

function washer(k: Kit) {
  k.box('white', 0.58, 0.85, 0.58, 0, 0, 0.3, { r: 0.02 });
  k.cyl('chrome', 0.19, 0.19, 0.02, 0, 0.44, 0.59, { seg: 26, rx: Math.PI / 2 });
  k.cyl('screen', 0.16, 0.16, 0.024, 0, 0.44, 0.594, { seg: 24, rx: Math.PI / 2 });
  k.box('black', 0.5, 0.07, 0.006, 0, 0.74, 0.583);
  k.soft('towel', 0.3, 0.1, 0.24, 0.1, 0.9, 0.3, { side: 3, corner: 0.04, puff: 0.006, step: 0.04 });
  k.foot(0.6, 0.6, 0, 0.3, 0.4, 0.2);
}

function utilitySink(k: Kit) {
  k.box('steel', 0.5, 0.24, 0.42, 0, 0.62, 0.22, { r: 0.012 });
  for (const sx of [-1, 1]) for (const sz of [0.04, 0.4]) k.box('steel', 0.03, 0.62, 0.03, sx * 0.22, 0, sz);
  k.cyl('chrome', 0.012, 0.012, 0.2, 0, 0.86, 0.04, { seg: 8 });
  k.box('chrome', 0.02, 0.02, 0.14, 0, 1.05, 0.1);
  k.foot(0.52, 0.44, 0, 0.22, 0.32, 0.16);
}

/** wall-origin folding clothes airer, w metres wide */
function dryingRack(k: Kit, w = 1.04) {
  const lx = w / 2 - 0.02;
  for (const sx of [-1, 1]) {
    k.box('chrome', 0.02, 0.95, 0.02, sx * lx, 0, 0.1, { rx: 0.22 });
    k.box('chrome', 0.02, 0.95, 0.02, sx * lx, 0, 0.48, { rx: -0.22 });
  }
  for (let i = 0; i < 4; i++) k.box('chrome', w - 0.02, 0.012, 0.012, 0, 0.9, 0.14 + i * 0.1);
  overBar(k, 'towel', 0.4, 0.4, -w * 0.19, 0.906, 0.24);
  overBar(k, 'cushionA', 0.32, 0.3, w * 0.25, 0.906, 0.34);
  k.foot(w, 0.56, 0, 0.29, 0.22, 0.16);
}

/* ------------------------------------------------------------------ layouts */

export function furnish(k: Kit, plan: PlanDef) {
  const P = (x: number, y: number, ry: number, fn: () => void) => k.at(x * FT, y * FT, ry, fn);
  const room = (id: string) => roomById(plan, id)!;
  const accent = (id: string, side: Side, slot = 'wallAccent', v1 = 7.5) => sidePanels(k, plan, room(id), side, slot, 0, v1);

  if (plan.id === 'east') {
    /* living — L-sofa along the north and west walls, TV on the kitchen wall, as drawn */
    P(0, 7.85, R, () => sofa(k, 8.5 * FT, false, true));
    P(5.92, 12.417, U, () => sofa(k, 4.7 * FT, true, false, true));
    P(6.2, 7.5, R, () => rug(k, 'rugA', 2.75, 2.15));
    P(5.95, 7.1, R, () => coffeeTable(k, 1.1, 0.6));
    P(16.75, 5.9, L, () => tvUnit(k, 1.9));
    P(11.6, 0, D, () => entryConsole(k, 1.15));
    sideTable(k, 1.5 * FT, 2.5 * FT);
    floorLamp(k, 9 * FT, 11.4 * FT);
    plant(k, 15.5 * FT, 1.3 * FT, 1.65);
    IN.kuthuvilakku(k, 14 * FT, 0, 0.9 * FT, 1.1);
    P(4.9, 12.417, U, () => IN.kalamkari(k, 1.45, 1.6));
    P(14.4, 0, D, () => art(k, 0.6, 0.8, 3, 0, 1.55));
    P(13.4, 0, D, () => IN.splitAC(k));

    /* kitchen — L counter: sink under the east window, hob beside it */
    P(21.792, 0, D, () => {
      counterRun(k, 9.25 * FT, { sink: -0.607, hob: 0.72, win: [-1.064, -0.15] });
      upperRun(k, -0.06, 9.25 * FT / 2, 0.72);
    });
    P(17.167, 4.9, R, () => { counterRun(k, 5.8 * FT); upperRun(k, -2.9 * FT, 2.9 * FT); });
    // a 66 cm fridge: the gap between the counter and the mandir is 67 cm
    P(17.167, 8.9, R, () => fridge(k, 0.66));
    P(18.5, 10, D, () => mandir(k, 0.7));
    P(21.792, 0, D, () => k.at(-1.24, 0, 0, () => IN.roPurifier(k)));

    /* service balcony */
    P(27.8, -0.42, D, () => washer(k));
    P(29.62, -0.42, D, () => k.fit(false, () => utilitySink(k)));
    P(30.5, 4.2, L, () => dryingRack(k));
    P(29.2, 11.7, D, () => planter(k, 0.8));
    P(27.6, 3.0, D, () => IN.lpgCylinder(k));

    /* dining */
    P(20.2, 17.9, D, () => { rug(k, 'rugC', 2.9, 2.2); diningSet(k); });
    P(21.2, 23.833, U, () => { sideboard(k, 2.0); art(k, 1.5, 0.8, 1, 0, 1.6); });
    plant(k, 25.5 * FT, 23 * FT, 1.5);
    P(11.667, 20.2, R, () => { art(k, 0.55, 0.75, 4, -0.36, 1.5); art(k, 0.55, 0.75, 5, 0.36, 1.5); IN.wallClock(k, 2.1); });

    /* balcony — the oonjal facing out over the town, the tulsi kota at the end */
    P(28.85, 20.3, R, () => IN.oonjal(k));
    P(29.4, 13.95, D, () => IN.tulsiKota(k));
    smallPlant(k, 30.1 * FT, 0, 23.2 * FT, 1.8);

    /* bedroom 1 */
    accent('bed1', 'top');
    P(4.7, 12.833, D, () => { bed(k, 1.53); art(k, 1.1, 0.6, 2, 0, 1.78); IN.splitAC(k); });
    P(1.15, 12.833, D, () => nightstand(k));
    P(1.6, 23.833, U, () => wardrobe(k, 3.2 * FT));
    P(8.575, 23.833, U, () => wardrobe(k, 5.35 * FT, 1));
    P(11.25, 19.2, L, () => dresser(k, 1.15));
    P(4.7, 18.3, D, () => rug(k, 'rugB', 2.35, 1.6));

    /* bathroom 1 */
    P(3, 25.57, R, () => glassScreen(k, 2.65 * FT));
    P(0, 27.4, R, () => shower(k));
    P(5.5, 29.25, U, () => vanity(k, 0.8));
    P(11.25, 26.75, L, () => wc(k));
    P(8.6, 24.25, D, () => towelRail(k));

    /* bedroom 2 */
    accent('bed2', 'top');
    P(4.7, 29.667, D, () => { bed(k, 1.53); art(k, 0.5, 0.65, 6, -0.34, 1.8); art(k, 0.5, 0.65, 7, 0.34, 1.8); IN.splitAC(k); });
    P(1.15, 29.667, D, () => nightstand(k));
    P(7.475, 41, U, () => wardrobe(k, 7.55 * FT, 2));
    P(11.25, 35.0, L, () => dresser(k, 0.75));
    P(4.7, 35.2, D, () => rug(k, 'rugB', 2.35, 1.6));

    /* bedroom balcony */
    P(9.6, 43.75, D, () => planter(k, 0.9));
    P(5.6, 42.83, L, () => loungeChair(k));

    /* passage */
    P(13.667, 28.6, R, () => rug(k, 'rugR', 2.5, 0.78));
    P(15.667, 26.75, L, () => art(k, 0.7, 0.95, 8, 0, 1.55));
    P(11.667, 26.75, R, () => art(k, 0.7, 0.95, 9, 0, 1.55));

    /* common bathroom */
    P(11.667, 40.2, R, () => wc(k));
    P(15.667, 37.4, L, () => vanity(k, 0.6));
    // only 4 ft wide: no room for a geyser or a bucket; the door is on the bedroom 2 wall (west)
    P(15.667, 34.75, L, () => shower(k, null, false));

    /* master bathroom */
    P(20.2, 27.92, R, () => glassScreen(k, 2.65 * FT));
    P(16.083, 26.75, R, () => shower(k));
    P(24, 24.25, D, () => vanity(k, 1.15));
    P(30.083, 26.75, L, () => wc(k));
    P(26.6, 29.25, U, () => towelRail(k));

    /* master bedroom — bed on the south wall, window seat between wardrobes on the west wall */
    accent('master', 'right', 'panel');
    P(30.083, 36.3, L, () => { bed(k, 1.83, 2.0, 0.55); art(k, 1.5, 0.55, 10, 0, 1.85); IN.splitAC(k); });
    P(30.083, 32.3, L, () => nightstand(k, true, 0.18));
    P(30.083, 40.3, L, () => nightstand(k, true, 0.18));
    P(25.1, 36.3, R, () => rug(k, 'rugB', 2.9, 2.1));
    P(21.9, 36.3, L, () => bench(k, 1.4));
    P(16.083, 37.3, R, () => tvUnit(k, 1.5, 1));
    P(18.64, 43.667, U, () => wardrobe(k, 5.1 * FT, 1));
    P(28.34, 43.667, U, () => wardrobe(k, 3.45 * FT));
    P(23.9, 43.667, U, () => {
      k.box('wood', 5.3 * FT, 0.4, 0.52, 0, 0, 0.27, { sw: true });
      k.soft('fabric2', 5.3 * FT - 0.04, 0.1, 0.5, 0, 0.45, 0.27, { ...CUSHION, sag: 0.008 });
      cushion(k, 'cushionA', -0.55, 0.5, 0.2, 0.2);
      cushion(k, 'cushionB', 0.55, 0.5, 0.2, -0.2);
      k.foot(5.3 * FT, 0.54, 0, 0.27, 0.36, 0.22);
    });
    P(26.35, 31.25, D, () => k.at(0, 0, -0.3, () => armchair(k)));
    floorLamp(k, 29.3 * FT, 30.5 * FT);

    /* corridor outside the front door: toran, nameplate, rangoli and the chappal stand */
    P(5.95, -1.75, D, () => k.box('fabric2', 0.85, 0.014, 0.5, 0, 0.002, 0));
    plant(k, 9.6 * FT, -1.6 * FT, 1.3);
    P(5.95, -0.75, U, () => IN.toran(k, 3.5 * FT, 2.2));
    P(8.6, -0.75, U, () => IN.nameplate(k));
    P(5.95, -4.2, D, () => IN.rangoli(k, 0.85));
    P(2.7, -0.75, U, () => IN.chappalStand(k));
  } else {
    /* living — L-sofa in the north-east corner, TV on the master-bedroom wall, as drawn */
    P(0, 35.9, R, () => sofa(k, 8 * FT, true, false));
    P(5.92, 31.667, D, () => sofa(k, 4.7 * FT, false, true, true));
    P(6.2, 36.9, R, () => rug(k, 'rugA', 2.75, 2.15));
    P(5.95, 37.1, R, () => coffeeTable(k, 1.1, 0.6));
    P(15.583, 36.8, L, () => tvUnit(k, 1.9));
    P(8.2, 43.667, U, () => entryConsole(k, 1.15));
    sideTable(k, 9.25 * FT, 32.7 * FT);
    plant(k, 14.3 * FT, 42.4 * FT, 1.65);
    IN.kuthuvilakku(k, 10.6 * FT, 0, 42.8 * FT, 1.1);
    P(5.2, 31.667, D, () => IN.kalamkari(k, 1.45, 1.6));
    P(12.3, 43.667, U, () => { art(k, 0.6, 0.8, 3, 0, 1.55); IN.splitAC(k); });

    /* dining */
    P(6.4, 9.2, D, () => { rug(k, 'rugC', 2.9, 2.2); diningSet(k); });
    P(5.8, 14.417, U, () => { sideboard(k, 2.0); art(k, 1.5, 0.8, 1, 0, 1.6); IN.wallClock(k, 2.25); });
    plant(k, 1 * FT, 12.9 * FT, 1.5);

    /* puja alcove */
    P(13.833, 0, D, () => mandir(k, 0.95));
    accent('puja', 'top', 'panel', 10);

    /* kitchen — two parallel counters */
    P(21.167, 0, D, () => {
      counterRun(k, 10.333 * FT, { sink: -0.447, hob: 0.75, win: [-0.904, 0.01] });
      upperRun(k, 0.1, 10.333 * FT / 2, 0.75);
      upperRun(k, -10.333 * FT / 2, -1.0);
    });
    P(24.07, 7.5, U, () => { counterRun(k, 4.53 * FT); upperRun(k, -2.26 * FT, 2.26 * FT); });
    P(20.65, 7.5, U, () => fridge(k));
    P(16, 1.75, R, () => IN.roPurifier(k, 1.0));

    /* service balcony */
    P(27.8, -0.42, D, () => washer(k));
    P(29.62, -0.42, D, () => k.fit(false, () => utilitySink(k)));
    P(29.8, 2.3, D, () => IN.lpgCylinder(k));
    // narrower here: it has to fit between the folded-back door and the far wall
    P(28.83, 7.5, U, () => dryingRack(k, 0.9));

    /* east balcony — sunrise from the oonjal */
    P(0.5, 1.3, R, () => loungeChair(k));
    P(4.0, 1.0, U, () => IN.oonjal(k));
    P(10.05, 0.45, D, () => IN.tulsiKota(k));

    /* bedroom 3 — desk under the south window, wardrobe beside it */
    accent('bed3', 'top');
    P(22.4, 7.917, D, () => { bed(k, 1.53); art(k, 1.1, 0.6, 2, 0, 1.78); IN.splitAC(k); });
    P(18.9, 7.917, D, () => nightstand(k));
    P(25.9, 7.917, D, () => nightstand(k, false));
    P(30, 10.6, L, () => desk(k, 1.05));
    P(30, 14.9, L, () => wardrobe(k, 4.8 * FT, 1));
    P(22.4, 13.5, D, () => rug(k, 'rugB', 2.35, 1.5));

    /* bathroom 3 */
    P(23.3, 19.12, R, () => glassScreen(k, 2.55 * FT));
    P(20, 20.4, R, () => shower(k));
    P(27.2, 22.833, U, () => vanity(k, 0.8));
    P(30, 20.3, L, () => wc(k));
    P(28.2, 17.833, D, () => towelRail(k));

    /* master bathroom */
    P(23.3, 26.97, R, () => glassScreen(k, 2.55 * FT));
    P(20, 25.7, R, () => shower(k));
    P(27.2, 23.25, D, () => vanity(k, 1.0));
    P(30, 25.75, L, () => wc(k));
    P(28.4, 28.25, U, () => towelRail(k));

    /* lobby */
    P(19.583, 23, L, () => { sideboard(k, 1.2, false); art(k, 0.8, 1.0, 8, 0, 1.6); });
    P(13.6, 23, R, () => rug(k, 'rugR', 2.6, 0.8));
    P(11.667, 24.6, R, () => art(k, 0.6, 0.8, 9, 0, 1.55));

    /* bedroom 2 */
    accent('bed2', 'top');
    P(5, 14.833, D, () => { bed(k, 1.53); art(k, 0.5, 0.65, 6, -0.34, 1.8); art(k, 0.5, 0.65, 7, 0.34, 1.8); IN.splitAC(k); });
    P(1.5, 14.833, D, () => nightstand(k));
    P(8.5, 14.833, D, () => nightstand(k, false));
    P(7.275, 26.333, U, () => wardrobe(k, 7.95 * FT, 2));
    P(5, 20.5, D, () => rug(k, 'rugB', 2.35, 1.6));

    /* bathroom 2 */
    P(4.3, 31.25, U, () => shower(k));
    P(6.05, 30.05, R, () => glassScreen(k, 2.4 * FT));
    P(7.8, 26.75, D, () => vanity(k, 0.8));
    P(11.25, 29, L, () => wc(k));

    /* master bedroom — bed on the south wall between two slim windows, wardrobe along the west wall */
    accent('master', 'right', 'panel');
    P(30, 35.3, L, () => { bed(k, 1.83, 2.0, 0.1); art(k, 1.5, 0.55, 10, 0, 1.85); IN.splitAC(k); });
    P(30, 31.3, L, () => nightstand(k, true, 0.18));
    P(30, 39.3, L, () => nightstand(k, true, 0.18));
    P(25.1, 35.3, R, () => rug(k, 'rugB', 2.9, 2.1));
    P(21.9, 35.3, L, () => bench(k, 1.4));
    P(16, 35.8, R, () => tvUnit(k, 1.5, 1));
    P(23, 43.667, U, () => wardrobe(k, 14 * FT, 3));

    /* corridor outside the front door */
    P(2.45, 45.45, D, () => k.box('fabric2', 0.85, 0.014, 0.5, 0, 0.002, 0));
    plant(k, 7.6 * FT, 45.6 * FT, 1.3);
    P(2.45, 44.417, D, () => IN.toran(k, 3.5 * FT, 2.2));
    P(4.8, 44.417, D, () => IN.nameplate(k));
    P(2.45, 47.7, D, () => IN.rangoli(k, 0.85));
    P(5.2, 44.417, D, () => IN.chappalStand(k));
  }
}
