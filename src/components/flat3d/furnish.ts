import * as THREE from 'three';
import type { Kit } from './kit';
import { FT, roomById, type PlanDef } from './plans';
import { CUT, H, sidePanels, type Side } from './shell';
import { ART_GRID } from './textures';

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

/* ------------------------------------------------------------------ small things */

function books(k: Kit, x: number, y: number, z: number, ry = 0.2) {
  k.box('decorB', 0.27, 0.032, 0.2, x, y, z, { ry });
  k.box('paper', 0.24, 0.028, 0.18, x, y + 0.032, z, { ry: ry + 0.15 });
  k.box('decorA', 0.2, 0.024, 0.15, x, y + 0.06, z, { ry: ry - 0.2 });
}

function vase(k: Kit, x: number, y: number, z: number, h = 0.26, slot = 'decorB') {
  k.cyl(slot, 0.03, 0.06, h, x, y, z, { seg: 14 });
  for (let i = 0; i < 4; i++) {
    const a = i * 1.7 + x * 3, lean = 0.22 + (i % 2) * 0.12;
    k.cyl('wood2', 0.004, 0.005, 0.42, x + Math.sin(a) * 0.05, y + h - 0.04, z + Math.cos(a) * 0.05, { seg: 5, rz: Math.sin(a) * lean, rx: Math.cos(a) * lean });
    k.ball(i % 2 ? 'leaf2' : 'leaf', 0.05, 0.035, 0.05, x + Math.sin(a) * 0.15, y + h + 0.32, z + Math.cos(a) * 0.15, { seg: 6 });
  }
}

function bowl(k: Kit, x: number, y: number, z: number) {
  k.cyl('ceramic', 0.14, 0.08, 0.07, x, y, z, { seg: 18 });
  k.ball('fruit', 0.04, 0.04, 0.04, x - 0.04, y + 0.085, z + 0.02, { seg: 8 });
  k.ball('fruit2', 0.042, 0.042, 0.042, x + 0.045, y + 0.085, z - 0.01, { seg: 8 });
  k.ball('fruit', 0.038, 0.038, 0.038, x, y + 0.1, z - 0.045, { seg: 8 });
  k.ball('leaf2', 0.04, 0.045, 0.04, x + 0.01, y + 0.09, z + 0.055, { seg: 8 });
}

function smallPlant(k: Kit, x: number, y: number, z: number, s = 1) {
  k.cyl('pot', 0.07 * s, 0.055 * s, 0.1 * s, x, y, z, { seg: 12 });
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4;
    k.ball(i % 2 ? 'leaf' : 'leaf2', 0.03 * s, 0.008 * s, 0.1 * s, x + Math.sin(a) * 0.06 * s, y + (0.15 + (i % 3) * 0.035) * s, z + Math.cos(a) * 0.06 * s, { seg: 6, ry: a, rx: -0.5 + (i % 3) * 0.25 });
  }
}

/** a tall indoor plant in a floor pot (centred) */
function plant(k: Kit, x: number, z: number, h = 1.5) {
  k.cyl('pot', 0.2, 0.15, 0.38, x, 0, z, { seg: 18 });
  k.cyl('soil', 0.185, 0.185, 0.02, x, 0.365, z, { seg: 14 });
  k.cyl('wood2', 0.016, 0.026, h * 0.62, x, 0.38, z, { seg: 6 });
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = i * 2.4, t = i / n;
    const reach = 0.16 + 0.2 * (1 - t * 0.6), y = 0.38 + h * (0.3 + 0.62 * t);
    k.ball(i % 3 ? 'leaf' : 'leaf2', 0.085, 0.012, 0.21, x + Math.sin(a) * reach, y, z + Math.cos(a) * reach, { seg: 6, ry: a, rx: 0.25 + (1 - t) * 0.55 });
  }
  k.foot(0.42, 0.42, x, z, 0.3, 0.2);
}

function planter(k: Kit, len: number) {
  k.box('pot', len, 0.38, 0.3, 0, 0, 0, { r: 0.015 });
  k.box('soil', len - 0.05, 0.02, 0.25, 0, 0.37, 0);
  const n = Math.max(2, Math.round(len / 0.26));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (len * (i + 0.5)) / n;
    k.ball(i % 2 ? 'leaf' : 'leaf2', 0.15, 0.16 + (i % 3) * 0.04, 0.15, x, 0.5 + (i % 2) * 0.05, (i % 2 ? 0.03 : -0.03), { seg: 7 });
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

function cushion(k: Kit, slot: string, x: number, y: number, z: number, ry = 0) {
  k.box(slot, 0.44, 0.44, 0.13, x, y, z, { r: 0.06, rx: -0.32, ry });
}

/** wall-origin; armL / armR are the ends at local -x / +x */
function sofa(k: Kit, len: number, armL: boolean, armR: boolean, flip = false) {
  const dp = 0.94, aw = 0.17;
  for (const sx of [-1, 1]) for (const sz of [0.09, dp - 0.09]) k.box('wood2', 0.06, 0.07, 0.06, sx * (len / 2 - 0.09), 0, OFF + sz);
  k.box('fabric', len, 0.2, dp, 0, 0.07, OFF + dp / 2, { r: 0.03 });
  k.box('fabric', len, 0.5, 0.2, 0, 0.27, OFF + 0.1, { r: 0.05 });
  if (armL) k.box('fabric', aw, 0.36, dp, -len / 2 + aw / 2, 0.27, OFF + dp / 2, { r: 0.05 });
  if (armR) k.box('fabric', aw, 0.36, dp, len / 2 - aw / 2, 0.27, OFF + dp / 2, { r: 0.05 });
  const x0 = -len / 2 + (armL ? aw : 0), inner = len - (armL ? aw : 0) - (armR ? aw : 0);
  const n = Math.max(1, Math.round(inner / 0.8)), sw = inner / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + sw * (i + 0.5);
    k.box('fabric', sw - 0.014, 0.17, dp - 0.21, cx, 0.27, OFF + 0.2 + (dp - 0.21) / 2, { r: 0.045 });
    k.box('fabric', sw - 0.03, 0.4, 0.17, cx, 0.44, OFF + 0.275, { r: 0.06, rx: -0.14 });
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
  books(k, -w * 0.24, 0.4, 0.03, 0.3);
  k.cyl('metal', 0.15, 0.15, 0.012, w * 0.2, 0.4, -0.02, { seg: 20 });
  k.cyl('ceramic', 0.035, 0.03, 0.07, w * 0.16, 0.412, 0.02, { seg: 12 });
  k.cyl('ceramic', 0.035, 0.03, 0.07, w * 0.26, 0.412, -0.06, { seg: 12 });
  smallPlant(k, w * 0.2, 0.16, 0.02, 0.8);
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
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood2', 0.018, 0.013, 0.43, sx * 0.19, 0, sz * 0.19, { seg: 6 });
  k.box('fabric2', 0.47, 0.07, 0.46, 0, 0.42, 0, { r: 0.03 });
  k.box('fabric2', 0.45, 0.42, 0.06, 0, 0.5, -0.2, { r: 0.028, rx: -0.1 });
  k.foot(0.48, 0.5, 0, 0, 0.26, 0.14);
}

function diningSet(k: Kit, w = 1.68, d = 0.95) {
  k.box('wood', w, 0.045, d, 0, 0.7, 0, { r: 0.015, sw: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood', 0.04, 0.024, 0.7, sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.12), { seg: 8 });
  k.box('linen', w * 0.86, 0.004, 0.3, 0, 0.746, 0);
  const top = 0.75;
  const seat = (x: number, z: number, ry: number) => {
    k.at(x, z, ry, () => {
      chair(k);
      // a place setting in front of each chair
      k.cyl('ceramic', 0.135, 0.1, 0.014, 0, top, 0.53, { seg: 20 });
      k.cyl('ceramic', 0.085, 0.07, 0.012, 0, top + 0.014, 0.53, { seg: 16 });
      k.cyl('glass', 0.034, 0.027, 0.11, 0.17, top, 0.6, { seg: 10 });
      k.box('cushionB', 0.05, 0.008, 0.17, -0.19, top, 0.53);
    });
  };
  for (const sx of [-1, 1]) {
    seat(sx * w * 0.24, d / 2 + 0.17, U);
    seat(sx * w * 0.24, -d / 2 - 0.17, D);
    seat(sx * (w / 2 + 0.17), 0, sx > 0 ? L : R);
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

/** wall-origin; head against the wall */
function bed(k: Kit, w: number, len = 2.0, wing = 0) {
  const hw = w + 0.14 + wing * 2, hh = 1.2;
  const n = Math.max(3, Math.round(hw / 0.34));
  k.box('wood2', hw, 0.18, 0.07, 0, 0, 0.035);
  for (let i = 0; i < n; i++) k.box('fabric2', hw / n - 0.012, hh - 0.18, 0.09, -hw / 2 + (hw / n) * (i + 0.5), 0.18, 0.05, { r: 0.035 });
  const z0 = 0.1;
  for (const sx of [-1, 1]) for (const sz of [0.12, len - 0.1]) k.box('wood2', 0.07, 0.1, 0.07, sx * (w / 2 - 0.06), 0, z0 + sz);
  k.box('wood', w + 0.08, 0.2, len + 0.05, 0, 0.1, z0 + len / 2, { r: 0.012 });
  k.box('linen', w, 0.24, len, 0, 0.3, z0 + len / 2, { r: 0.06 });
  k.box('duvet', w + 0.07, 0.11, len * 0.7, 0, 0.5, z0 + len * 0.65 + 0.02, { r: 0.05 });
  k.box('linen', w + 0.075, 0.04, 0.26, 0, 0.6, z0 + len * 0.31, { r: 0.018 });
  const pw = w / 2 - 0.09;
  for (const sx of [-1, 1]) {
    k.box('linen', pw, 0.42, 0.16, (sx * w) / 4, 0.55, z0 + 0.14, { r: 0.07, rx: -0.38 });
    k.box('duvet', pw - 0.06, 0.36, 0.15, (sx * w) / 4, 0.54, z0 + 0.31, { r: 0.065, rx: -0.45 });
  }
  k.box('cushionA', 0.52, 0.28, 0.13, 0, 0.56, z0 + 0.47, { r: 0.055, rx: -0.55 });
  if (w > 1.7) for (const sx of [-1, 1]) k.box('cushionB', 0.38, 0.34, 0.12, sx * 0.44, 0.55, z0 + 0.42, { r: 0.05, rx: -0.5, ry: sx * 0.12 });
  k.box('throw', w + 0.1, 0.03, 0.52, 0, 0.61, z0 + len - 0.4, { r: 0.012 });
  k.foot(w + 0.1, len + 0.14, 0, (len + 0.14) / 2, 0.44, 0.3);
}

function nightstand(k: Kit, lamp = true) {
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
  k.box('fabric2', w, 0.1, 0.42, 0, 0.36, 0, { r: 0.04 });
  for (const sx of [-1, 1]) {
    k.box('metal', 0.022, 0.36, 0.022, sx * (w / 2 - 0.05), 0, -0.17);
    k.box('metal', 0.022, 0.36, 0.022, sx * (w / 2 - 0.05), 0, 0.17);
    k.box('metal', 0.022, 0.022, 0.34, sx * (w / 2 - 0.05), 0.08, 0);
  }
  k.foot(w, 0.44, 0, 0, 0.28, 0.16);
}

function armchair(k: Kit) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.cyl('wood2', 0.02, 0.014, 0.2, sx * 0.28, 0, sz * 0.28, { seg: 6 });
  k.box('fabric2', 0.72, 0.2, 0.72, 0, 0.2, 0, { r: 0.05 });
  k.box('fabric2', 0.72, 0.5, 0.16, 0, 0.36, -0.28, { r: 0.06, rx: -0.14 });
  for (const sx of [-1, 1]) k.box('fabric2', 0.13, 0.22, 0.62, sx * 0.3, 0.38, 0.04, { r: 0.05 });
  cushion(k, 'cushionA', 0, 0.4, -0.12);
  k.foot(0.76, 0.78, 0, 0, 0.3, 0.18);
}

/* ------------------------------------------------------------------ kitchen */

type RunOpts = { sink?: number; hob?: number; win?: [number, number]; props?: boolean };

/** wall-origin base cabinets with a stone top; sink / hob positions are local x */
function counterRun(k: Kit, len: number, o: RunOpts = {}) {
  const dp = 0.6, hgt = 0.86, th = 0.04, td = dp + 0.02;
  k.box('black', len, 0.1, dp - 0.07, 0, 0, dp / 2 - 0.035);
  k.box('cabinet', len, hgt - 0.1, dp - 0.02, 0, 0.1, (dp - 0.02) / 2);
  const n = Math.max(1, Math.round(len / 0.55));
  for (let i = 1; i < n; i++) k.box('black', 0.004, hgt - 0.12, 0.004, -len / 2 + (len * i) / n, 0.11, dp - 0.018);
  for (let i = 0; i < n; i++) k.box('metal', 0.16, 0.012, 0.018, -len / 2 + (len * (i + 0.5)) / n, hgt - 0.1, dp - 0.01);

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

  const top = hgt + th;
  if (o.hob !== undefined) {
    const hx = o.hob;
    k.box('screen', 0.6, 0.008, 0.5, hx, top, dp / 2 + 0.01);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      k.cyl('steel', 0.062, 0.062, 0.012, hx + sx * 0.15, top + 0.008, dp / 2 + 0.01 + sz * 0.12, { seg: 14 });
      k.cyl('black', 0.045, 0.045, 0.016, hx + sx * 0.15, top + 0.008, dp / 2 + 0.01 + sz * 0.12, { seg: 12 });
    }
    k.box('steel', 0.6, 0.07, 0.48, hx, 1.52, 0.24, { r: 0.006 });
    k.box('steel', 0.26, CUT - 1.6, 0.24, hx, 1.59, 0.13);
    k.box('cove', 0.4, 0.006, 0.05, hx, 1.514, 0.3);
    // a pot on the hob
    k.cyl('steel', 0.1, 0.1, 0.11, hx - 0.15, top + 0.024, dp / 2 - 0.11, { seg: 16 });
    k.cyl('steel', 0.105, 0.105, 0.01, hx - 0.15, top + 0.134, dp / 2 - 0.11, { seg: 16 });
  }

  // splashback, cut around the window when there is one
  const sb = (x0: number, x1: number, y0: number, y1: number) => { if (x1 - x0 > 0.02) k.box('backsplash', x1 - x0, y1 - y0, 0.012, (x0 + x1) / 2, y0, 0.006); };
  if (o.win) {
    sb(-len / 2, o.win[0], top, 1.5); sb(o.win[1], len / 2, top, 1.5); sb(o.win[0], o.win[1], top, 1.03);
  } else sb(-len / 2, len / 2, top, 1.5);

  if (o.props !== false) {
    const free = (x: number) => (o.sink === undefined || Math.abs(x - o.sink) > 0.42) && (o.hob === undefined || Math.abs(x - o.hob) > 0.42);
    const spots = [-len / 2 + 0.22, -len / 2 + 0.62, len / 2 - 0.22, len / 2 - 0.62, 0].filter(free);
    const put = [
      (x: number) => bowl(k, x, top, 0.34),
      (x: number) => { for (let i = 0; i < 3; i++) { k.cyl('glass', 0.042, 0.042, 0.13 + i * 0.03, x - 0.1 + i * 0.1, top, 0.13, { seg: 10 }); k.cyl('wood', 0.045, 0.045, 0.015, x - 0.1 + i * 0.1, top + 0.13 + i * 0.03, 0.13, { seg: 10 }); } },
      (x: number) => { k.cyl('steel', 0.07, 0.085, 0.17, x, top, 0.2, { seg: 14 }); k.cyl('black', 0.025, 0.03, 0.03, x, top + 0.17, 0.2, { seg: 8 }); },
      (x: number) => { k.box('wood', 0.3, 0.02, 0.2, x, top, 0.3, { ry: 0.15 }); smallPlant(k, x + 0.02, top, 0.12, 0.75); },
    ];
    spots.slice(0, put.length).forEach((x, i) => put[i](x));
  }
  k.foot(len, td, 0, td / 2, 0.44, 0.26);
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

function fridge(k: Kit) {
  k.box('steel', 0.7, 1.82, 0.66, 0, 0.02, 0.34, { r: 0.018 });
  k.box('black', 0.7, 0.006, 0.004, 0, 0.74, 0.672);
  k.box('black', 0.006, 1.06, 0.004, 0, 0.76, 0.672);
  for (const sx of [-1, 1]) k.box('chrome', 0.016, 0.5, 0.022, sx * 0.05, 0.98, 0.685);
  k.box('chrome', 0.3, 0.016, 0.022, 0, 0.62, 0.685);
  k.foot(0.7, 0.7, 0, 0.35, 0.42, 0.22);
}

/** wall-origin puja mandir */
function mandir(k: Kit, w: number) {
  const dp = 0.42;
  k.box('wood', w, 0.7, dp, 0, 0, dp / 2, { r: 0.006 });
  k.box('black', 0.004, 0.62, 0.004, 0, 0.04, dp + 0.002);
  for (const sx of [-1, 1]) k.cyl('metal', 0.014, 0.014, 0.02, sx * 0.07, 0.4, dp + 0.012, { seg: 8, rx: Math.PI / 2 });
  k.box('counter', w + 0.03, 0.03, dp + 0.03, 0, 0.7, dp / 2);
  k.box('wood2', w, 0.92, 0.02, 0, 0.73, 0.012);
  k.box('cove', w * 0.52, 0.56, 0.006, 0, 0.86, 0.025);
  for (const sx of [-1, 1]) {
    k.cyl('wood', 0.03, 0.036, 0.86, sx * (w / 2 - 0.05), 0.73, dp - 0.06, { seg: 10 });
    k.cyl('metal', 0.04, 0.03, 0.03, sx * (w / 2 - 0.05), 1.59, dp - 0.06, { seg: 10 });
  }
  k.box('wood', w + 0.08, 0.05, dp + 0.05, 0, 1.62, dp / 2);
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
  k.ball('leaf2', 0.05, 0.04, 0.05, 0, 0.9, dp * 0.42, { seg: 6 });
  k.cyl('metal', 0.11, 0.11, 0.01, 0, 0.73, dp * 0.78, { seg: 18 });
  for (let i = 0; i < 9; i++) k.ball(i % 2 ? 'fruit' : 'decorA', 0.018, 0.018, 0.018, -w * 0.34 + (w * 0.68 * i) / 8, 1.58 - Math.sin((i / 8) * Math.PI) * 0.07, dp - 0.04, { seg: 6 });
  k.light('always', 0, 1.15, dp + 0.2, 1.7, 0xffb469);
  k.foot(w, dp + 0.03, 0, dp / 2, 0.34, 0.2);
}

/* ------------------------------------------------------------------ bathrooms */

function wc(k: Kit) {
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
  k.box('counter', w + 0.02, 0.03, 0.48, 0, 0.8, 0.24);
  k.cyl('ceramic', 0.2, 0.15, 0.12, 0, 0.83, 0.25, { seg: 22 });
  k.cyl('chrome', 0.013, 0.013, 0.24, 0, 0.83, 0.05, { seg: 8 });
  k.box('chrome', 0.02, 0.02, 0.16, 0, 1.06, 0.12);
  const mw = Math.min(w - 0.06, 0.9);
  k.box('metal', mw + 0.03, 0.83, 0.02, 0, 1.07, 0.01);
  k.wallQuad('mirror', mw, 0.8, 0, 1.485, 0.0215);
  k.box('cove', mw * 0.8, 0.03, 0.04, 0, 1.95, 0.03);
  k.light('lamp', 0, 1.85, 0.4, 4.6, 0xffe9d0);
  k.halo(0, 1.96, 0.06);
  k.cyl('decorA', 0.022, 0.026, 0.13, w / 2 - 0.12, 0.83, 0.16, { seg: 8 });
  k.cyl('decorB', 0.02, 0.024, 0.1, w / 2 - 0.19, 0.83, 0.2, { seg: 8 });
  k.box('towel', 0.22, 0.07, 0.16, -w / 2 + 0.16, 0.83, 0.26, { r: 0.02 });
  k.foot(w, 0.5, 0, 0.25, 0.28, 0.16);
}

function shower(k: Kit) {
  k.box('chrome', 0.12, 0.12, 0.03, 0, 0.98, 0.015, { r: 0.008 });
  k.cyl('chrome', 0.011, 0.011, 1.06, 0, 1.04, 0.035, { seg: 8 });
  k.box('chrome', 0.02, 0.02, 0.36, 0, 2.08, 0.2);
  k.cyl('chrome', 0.11, 0.11, 0.014, 0, 2.05, 0.38, { seg: 18 });
  k.box('counter', 0.34, 0.02, 0.1, 0.34, 1.12, 0.05);
  k.cyl('decorA', 0.024, 0.024, 0.15, 0.27, 1.14, 0.05, { seg: 8 });
  k.cyl('white', 0.026, 0.026, 0.13, 0.36, 1.14, 0.05, { seg: 8 });
}

/** centred; glass runs along local x */
function glassScreen(k: Kit, len: number) {
  k.box('glass', len, 1.98, 0.01, 0, 0.03, 0);
  k.box('chrome', len, 0.022, 0.022, 0, 2.01, 0);
  k.box('chrome', len, 0.03, 0.022, 0, 0, 0);
  k.solid(len, 0.05);
}

function towelRail(k: Kit) {
  k.box('chrome', 0.62, 0.016, 0.016, 0, 1.16, 0.06);
  for (const sx of [-1, 1]) k.box('chrome', 0.016, 0.016, 0.06, sx * 0.3, 1.16, 0.03);
  k.box('towel', 0.42, 0.52, 0.03, -0.04, 0.66, 0.065, { r: 0.012 });
}

/* ------------------------------------------------------------------ outdoors */

function loungeChair(k: Kit) {
  for (const sx of [-1, 1]) {
    k.box('wood2', 0.04, 0.4, 0.62, sx * 0.3, 0, 0);
    k.box('wood2', 0.04, 0.04, 0.62, sx * 0.3, 0.52, 0);
  }
  k.box('wood2', 0.6, 0.04, 0.6, 0, 0.26, 0);
  k.box('fabric', 0.54, 0.1, 0.54, 0, 0.3, 0.01, { r: 0.04 });
  k.box('fabric', 0.54, 0.42, 0.1, 0, 0.4, -0.25, { r: 0.04, rx: -0.2 });
  k.foot(0.66, 0.66, 0, 0, 0.3, 0.16);
}

function bistroTable(k: Kit) {
  k.cyl('counter', 0.26, 0.26, 0.025, 0, 0.52, 0, { seg: 22 });
  k.cyl('metal', 0.015, 0.015, 0.52, 0, 0, 0, { seg: 6 });
  k.cyl('metal', 0.17, 0.18, 0.014, 0, 0, 0, { seg: 18 });
  smallPlant(k, 0.02, 0.545, 0.02, 0.85);
  k.cyl('ceramic', 0.036, 0.03, 0.07, -0.1, 0.545, -0.06, { seg: 10 });
  k.foot(0.5, 0.5, 0, 0, 0.26, 0.16);
}

function washer(k: Kit) {
  k.box('white', 0.6, 0.85, 0.58, 0, 0, 0.3, { r: 0.02 });
  k.cyl('chrome', 0.19, 0.19, 0.02, 0, 0.44, 0.59, { seg: 26, rx: Math.PI / 2 });
  k.cyl('screen', 0.16, 0.16, 0.024, 0, 0.44, 0.594, { seg: 24, rx: Math.PI / 2 });
  k.box('black', 0.5, 0.07, 0.006, 0, 0.74, 0.583);
  k.box('towel', 0.3, 0.1, 0.24, 0.1, 0.85, 0.3, { r: 0.02 });
  k.foot(0.6, 0.6, 0, 0.3, 0.4, 0.2);
}

function utilitySink(k: Kit) {
  k.box('steel', 0.52, 0.24, 0.42, 0, 0.62, 0.22, { r: 0.012 });
  for (const sx of [-1, 1]) for (const sz of [0.04, 0.4]) k.box('steel', 0.03, 0.62, 0.03, sx * 0.23, 0, sz);
  k.cyl('chrome', 0.012, 0.012, 0.2, 0, 0.86, 0.04, { seg: 8 });
  k.box('chrome', 0.02, 0.02, 0.14, 0, 1.05, 0.1);
  k.foot(0.52, 0.44, 0, 0.22, 0.32, 0.16);
}

function dryingRack(k: Kit) {
  for (const sx of [-1, 1]) {
    k.box('chrome', 0.02, 0.95, 0.02, sx * 0.5, 0, 0.1, { rx: 0.22 });
    k.box('chrome', 0.02, 0.95, 0.02, sx * 0.5, 0, 0.48, { rx: -0.22 });
  }
  for (let i = 0; i < 4; i++) k.box('chrome', 1.02, 0.012, 0.012, 0, 0.9, 0.14 + i * 0.1);
  k.box('towel', 0.4, 0.42, 0.02, -0.2, 0.5, 0.24, { r: 0.008 });
  k.box('cushionA', 0.32, 0.34, 0.02, 0.26, 0.58, 0.34, { r: 0.008 });
  k.foot(1.04, 0.56, 0, 0.29, 0.22, 0.16);
}

/* ------------------------------------------------------------------ layouts */

export function furnish(k: Kit, plan: PlanDef) {
  const P = (x: number, y: number, ry: number, fn: () => void) => k.at(x * FT, y * FT, ry, fn);
  const room = (id: string) => roomById(plan, id)!;
  const accent = (id: string, side: Side, slot = 'wallAccent', v1 = 7.5) => sidePanels(k, plan, room(id), side, slot, 0, v1);

  if (plan.id === 'east') {
    /* living — L-sofa along the north and west walls, TV on the kitchen wall, as drawn */
    P(0, 7.85, R, () => sofa(k, 8.5 * FT, false, true));
    P(5.45, 12.417, U, () => sofa(k, 4.7 * FT, true, false, true));
    P(6.2, 7.5, R, () => rug(k, 'rugA', 2.75, 2.15));
    P(5.95, 7.1, R, () => coffeeTable(k, 1.1, 0.6));
    P(16.75, 5.9, L, () => tvUnit(k, 1.9));
    P(11.6, 0, D, () => entryConsole(k, 1.15));
    sideTable(k, 1.5 * FT, 2.5 * FT);
    floorLamp(k, 9 * FT, 11.4 * FT);
    plant(k, 15.5 * FT, 1.3 * FT, 1.65);
    P(4.9, 12.417, U, () => { art(k, 1.3, 0.85, 0, 0, 1.62); });
    P(14.4, 0, D, () => art(k, 0.6, 0.8, 3, 0, 1.55));

    /* kitchen — L counter: sink under the east window, hob beside it */
    P(21.792, 0, D, () => {
      counterRun(k, 9.25 * FT, { sink: -0.607, hob: 0.72, win: [-1.064, -0.15] });
      upperRun(k, -0.06, 9.25 * FT / 2, 0.72);
    });
    P(17.167, 4.9, R, () => { counterRun(k, 5.8 * FT); upperRun(k, -2.9 * FT, 2.9 * FT); });
    P(17.167, 8.9, R, () => fridge(k));
    P(18.33, 10, D, () => mandir(k, 0.7));

    /* service balcony */
    P(27.95, -0.42, D, () => washer(k));
    P(29.6, -0.42, D, () => utilitySink(k));
    P(30.5, 4.2, L, () => dryingRack(k));
    P(29.2, 11.7, D, () => planter(k, 0.8));

    /* dining */
    P(20.2, 17.9, D, () => { rug(k, 'rugC', 2.9, 2.2); diningSet(k); });
    P(21.2, 23.833, U, () => { sideboard(k, 2.0); art(k, 1.5, 0.8, 1, 0, 1.6); });
    plant(k, 25.5 * FT, 23 * FT, 1.5);
    P(11.667, 20.2, R, () => { art(k, 0.55, 0.75, 4, -0.36, 1.5); art(k, 0.55, 0.75, 5, 0.36, 1.5); });

    /* balcony */
    P(28.3, 19.3, R, () => loungeChair(k));
    P(28.3, 22.2, R, () => loungeChair(k));
    P(28.7, 20.75, D, () => bistroTable(k));
    P(28.9, 13.5, D, () => planter(k, 0.9));

    /* bedroom 1 */
    accent('bed1', 'top');
    P(4.7, 12.833, D, () => { bed(k, 1.53); art(k, 1.1, 0.6, 2, 0, 1.78); });
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
    P(4.7, 29.667, D, () => { bed(k, 1.53); art(k, 0.5, 0.65, 6, -0.34, 1.8); art(k, 0.5, 0.65, 7, 0.34, 1.8); });
    P(1.15, 29.667, D, () => nightstand(k));
    P(7.475, 41, U, () => wardrobe(k, 7.55 * FT, 2));
    P(11.25, 36.2, L, () => dresser(k, 1.0));
    P(4.7, 35.2, D, () => rug(k, 'rugB', 2.35, 1.6));

    /* bedroom balcony */
    P(6.4, 43.55, D, () => planter(k, 1.1));
    P(9.7, 43.55, D, () => planter(k, 0.7));
    P(8.2, 42.6, L, () => loungeChair(k));

    /* passage */
    P(13.667, 28.6, R, () => rug(k, 'rugR', 2.5, 0.78));
    P(15.667, 26.75, L, () => art(k, 0.7, 0.95, 8, 0, 1.55));
    P(11.667, 26.75, R, () => art(k, 0.7, 0.95, 9, 0, 1.55));

    /* common bathroom */
    P(11.667, 40.2, R, () => wc(k));
    P(15.667, 37.2, L, () => vanity(k, 0.6));
    P(15.667, 34.75, L, () => shower(k));

    /* master bathroom */
    P(20.2, 27.92, R, () => glassScreen(k, 2.65 * FT));
    P(16.083, 26.75, R, () => shower(k));
    P(24, 24.25, D, () => vanity(k, 1.15));
    P(30.083, 26.75, L, () => wc(k));
    P(26.6, 29.25, U, () => towelRail(k));

    /* master bedroom — bed on the south wall, window seat between wardrobes on the west wall */
    accent('master', 'right', 'panel');
    P(30.083, 36.3, L, () => { bed(k, 1.83, 2.0, 0.55); art(k, 1.5, 0.55, 10, 0, 1.85); });
    P(30.083, 32.3, L, () => nightstand(k));
    P(30.083, 40.3, L, () => nightstand(k));
    P(25.1, 36.3, R, () => rug(k, 'rugB', 2.9, 2.1));
    P(22.75, 36.3, L, () => bench(k, 1.4));
    P(16.083, 37.3, R, () => tvUnit(k, 1.5, 1));
    P(18.64, 43.667, U, () => wardrobe(k, 5.1 * FT, 1));
    P(28.34, 43.667, U, () => wardrobe(k, 3.45 * FT));
    P(23.9, 43.667, U, () => {
      k.box('wood', 5.3 * FT, 0.4, 0.52, 0, 0, 0.27, { sw: true });
      k.box('fabric2', 5.3 * FT - 0.04, 0.09, 0.5, 0, 0.4, 0.27, { r: 0.035 });
      cushion(k, 'cushionA', -0.55, 0.5, 0.2, 0.2);
      cushion(k, 'cushionB', 0.55, 0.5, 0.2, -0.2);
      k.foot(5.3 * FT, 0.54, 0, 0.27, 0.36, 0.22);
    });
    P(26.9, 30.75, D, () => k.at(0, 0, -0.5, () => armchair(k)));
    floorLamp(k, 29.3 * FT, 30.3 * FT);

    /* corridor outside the front door */
    P(5.95, -1.75, D, () => k.box('fabric2', 0.85, 0.014, 0.5, 0, 0.002, 0));
    plant(k, 9.6 * FT, -1.6 * FT, 1.3);
  } else {
    /* living — L-sofa in the north-east corner, TV on the master-bedroom wall, as drawn */
    P(0, 35.9, R, () => sofa(k, 8 * FT, true, false));
    P(5.45, 31.667, D, () => sofa(k, 4.7 * FT, false, true, true));
    P(6.2, 36.9, R, () => rug(k, 'rugA', 2.75, 2.15));
    P(5.95, 37.1, R, () => coffeeTable(k, 1.1, 0.6));
    P(15.583, 36.8, L, () => tvUnit(k, 1.9));
    P(8.2, 43.667, U, () => entryConsole(k, 1.15));
    sideTable(k, 8.9 * FT, 32.7 * FT);
    plant(k, 14.3 * FT, 42.4 * FT, 1.65);
    P(5.2, 31.667, D, () => art(k, 1.3, 0.85, 0, 0, 1.62));
    P(12.3, 43.667, U, () => art(k, 0.6, 0.8, 3, 0, 1.55));

    /* dining */
    P(6.4, 9.2, D, () => { rug(k, 'rugC', 2.9, 2.2); diningSet(k); });
    P(5.8, 14.417, U, () => { sideboard(k, 2.0); art(k, 1.5, 0.8, 1, 0, 1.6); });
    plant(k, 1 * FT, 12.9 * FT, 1.5);

    /* puja alcove */
    P(13.625, 0, D, () => mandir(k, 0.95));
    accent('puja', 'top', 'panel', 10);

    /* kitchen — two parallel counters */
    P(21.167, 0, D, () => {
      counterRun(k, 10.333 * FT, { sink: -0.447, hob: 0.75, win: [-0.904, 0.01] });
      upperRun(k, 0.1, 10.333 * FT / 2, 0.75);
      upperRun(k, -10.333 * FT / 2, -1.0);
    });
    P(24.07, 7.5, U, () => { counterRun(k, 4.53 * FT); upperRun(k, -2.26 * FT, 2.26 * FT); });
    P(20.65, 7.5, U, () => fridge(k));

    /* service balcony */
    P(27.95, -0.42, D, () => washer(k));
    P(29.5, -0.42, D, () => utilitySink(k));
    P(28.65, 7.5, U, () => dryingRack(k));

    /* east balcony */
    P(1.3, 1.5, R, () => loungeChair(k));
    P(5.3, 1.5, L, () => loungeChair(k));
    P(3.3, 1.3, D, () => bistroTable(k));
    P(10.2, 0.45, D, () => planter(k, 0.6));

    /* bedroom 3 — desk under the south window, wardrobe beside it */
    accent('bed3', 'top');
    P(22.4, 7.917, D, () => { bed(k, 1.53); art(k, 1.1, 0.6, 2, 0, 1.78); });
    P(18.9, 7.917, D, () => nightstand(k));
    P(25.9, 7.917, D, () => nightstand(k, false));
    P(30, 10.1, L, () => desk(k, 1.05));
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
    P(5, 14.833, D, () => { bed(k, 1.53); art(k, 0.5, 0.65, 6, -0.34, 1.8); art(k, 0.5, 0.65, 7, 0.34, 1.8); });
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
    P(30, 35.3, L, () => { bed(k, 1.83, 2.0, 0.1); art(k, 1.5, 0.55, 10, 0, 1.85); });
    P(30, 31.3, L, () => nightstand(k));
    P(30, 39.3, L, () => nightstand(k));
    P(25.1, 35.3, R, () => rug(k, 'rugB', 2.9, 2.1));
    P(22.75, 35.3, L, () => bench(k, 1.4));
    P(16, 35.8, R, () => tvUnit(k, 1.5, 1));
    P(23, 43.667, U, () => wardrobe(k, 14 * FT, 3));

    /* corridor outside the front door */
    P(2.45, 45.45, D, () => k.box('fabric2', 0.85, 0.014, 0.5, 0, 0.002, 0));
    plant(k, 7.6 * FT, 45.6 * FT, 1.3);
  }
}
