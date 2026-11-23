import type { Kit } from './kit';
import { CUT, H } from './shell';
import { rng } from './textures';

/**
 * The things that make it an Andhra home rather than a showroom: the split AC and the ceiling
 * fan, grills on the windows, a carved teak main door with a toran and a rangoli at the
 * threshold, a black-granite kitchen with a gas stove, a pressure cooker and the steel dabbas,
 * the RO purifier on the wall, the bucket and mug in the bathroom, an oonjal on the balcony and
 * the tulsi kota beside it.
 *
 * Same conventions as furnish.ts: metres; "wall-origin" pieces have local z = 0 on the wall face
 * with +z pointing into the room.
 */

/* ------------------------------------------------------------------ fittings */

/** wall-origin split AC indoor unit, top edge at height `top` */
export function splitAC(k: Kit, w = 0.98, top = 2.62) {
  k.layer(true, () => {
    const y = top - 0.3;
    k.box('acBody', w, 0.3, 0.21, 0, y, 0.105, { r: 0.03 });
    // the front panel stands a hair proud, the air outlet is a dark slot with a louvre in it
    k.box('acBody', w - 0.02, 0.2, 0.01, 0, y + 0.085, 0.212, { r: 0.004 });
    k.box('black', w - 0.12, 0.045, 0.06, 0, y + 0.012, 0.17);
    k.box('acBody', w - 0.14, 0.01, 0.07, 0, y + 0.03, 0.176, { rx: 0.4 });
    k.box('acLed', 0.05, 0.008, 0.004, w / 2 - 0.12, y + 0.07, 0.218);
    // the refrigerant pipe running down to the outdoor unit
    k.box('acBody', 0.05, 0.05, 0.05, -w / 2 - 0.05, y + 0.08, 0.04);
  });
}

/** wall-origin modular switch plate (8-module), centre at height y */
export function switchboard(k: Kit, x = 0, y = 1.22, modules = 6) {
  const w = 0.04 * modules + 0.04;
  k.box('white', w, 0.12, 0.012, x, y - 0.06, 0.006, { r: 0.004 });
  for (let i = 0; i < modules; i++) {
    const sx = x - (0.04 * modules) / 2 + 0.02 + i * 0.04;
    k.box('white', 0.03, 0.05, 0.008, sx, y - 0.01, 0.016, { r: 0.002 });
    k.box(i === modules - 1 ? 'acLed' : 'black', 0.004, 0.004, 0.002, sx, y + 0.026, 0.02);
  }
}

/** a mild-steel window grill on the outer face of an opening (local frame of the opening) */
export function windowGrill(k: Kit, wd: number, sill: number, head: number, z: number) {
  const h = head - sill - 0.04, n = Math.max(3, Math.round(wd / 0.115));
  for (let i = 1; i < n; i++) k.box('grill', 0.012, h, 0.012, -wd / 2 + (wd * i) / n, sill + 0.02, z);
  for (const y of [sill + 0.02, sill + h * 0.5, sill + h + 0.008]) k.box('grill', wd - 0.04, 0.02, 0.006, 0, y, z);
  // a small decorative band of arcs across the middle rail
  for (let i = 0; i < n; i += 2) k.cyl('grill', 0.045, 0.045, 0.006, -wd / 2 + (wd * (i + 0.5)) / n, sill + h * 0.5 - 0.02, z, { seg: 10, rx: Math.PI / 2, open: true });
}

/* ------------------------------------------------------------------ doors */

/**
 * The main door leaf (built along +x from the hinge, `len` wide, `lh` tall): solid teak with
 * raised panels framed in mouldings, rows of brass studs, a long brass pull, a brass knocker
 * and a peephole — on both faces.
 */
export function mainDoorLeaf(k: Kit, len: number, lh: number) {
  const t = 0.05;
  k.box('doorMain', len, lh, t, len / 2, 0.01, 0, { r: 0.004 });
  const rows = [[0.16, 0.62], [0.86, 0.5], [1.44, 0.5], [2.0, lh - 2.1]] as const;
  const cols = 2, m = 0.1, pw = (len - m * (cols + 1)) / cols;
  for (const face of [-1, 1]) {
    const z = face * (t / 2);
    for (const [y0, ph] of rows) for (let c = 0; c < cols; c++) {
      const px = m + pw / 2 + c * (pw + m);
      // the raised field, with a bevelled moulding round it
      k.box('teak', pw - 0.05, ph - 0.05, 0.016, px, y0 + 0.025, z + face * 0.008, { r: 0.006 });
      for (const sy of [y0, y0 + ph - 0.014]) k.box('doorMain', pw, 0.014, 0.012, px, sy, z + face * 0.006);
      for (const sx of [-1, 1]) k.box('doorMain', 0.014, ph, 0.012, px + sx * (pw / 2 - 0.007), y0, z + face * 0.006);
      // a brass stud at each corner of each panel
      for (const sx of [-1, 1]) for (const sy of [0.04, ph - 0.04]) k.ball('brass', 0.011, 0.011, 0.007, px + sx * (pw / 2 + 0.03), y0 + sy, z + face * 0.002, { seg: 8 });
    }
    // brass pull and lock plate on the latch side
    k.box('brass', 0.024, 0.62, 0.024, len - 0.1, 0.78, z + face * 0.045, { r: 0.008 });
    for (const yy of [0.82, 1.36]) k.box('brass', 0.024, 0.024, 0.04, len - 0.1, yy, z + face * 0.022);
    k.box('brass', 0.06, 0.2, 0.006, len - 0.1, 0.62, z + face * 0.004, { r: 0.004 });
    // peephole and a knocker on the outer face only
    k.cyl('brass', 0.012, 0.012, 0.01, len / 2, 1.55, z + face * 0.004, { seg: 12, rx: Math.PI / 2 });
  }
  k.cyl('brass', 0.05, 0.05, 0.012, len / 2, 1.3, -t / 2 - 0.006, { seg: 18, rx: Math.PI / 2, open: true });
}

/** a flush bedroom / bathroom door leaf: laminate with two shallow grooves, a lever handle and a tower bolt */
export function flushDoorLeaf(k: Kit, len: number, lh: number, bath: boolean) {
  const t = 0.038;
  k.box('doorLeaf', len, lh, t, len / 2, 0.01, 0, { r: 0.003 });
  for (const face of [-1, 1]) {
    const z = face * (t / 2 + 0.0005);
    for (const y of [lh * 0.3, lh * 0.7]) k.box('black', len - 0.12, 0.004, 0.002, len / 2, y, z);
    // lever handle on a long plate
    k.box('chrome', 0.04, 0.2, 0.006, len - 0.08, 0.93, z + face * 0.003, { r: 0.004 });
    k.box('chrome', 0.13, 0.016, 0.018, len - 0.12, 1.0, z + face * 0.018, { r: 0.006 });
    k.box('chrome', 0.016, 0.016, 0.03, len - 0.08, 1.0, z + face * 0.009);
  }
  // tower bolt high on the inside face
  k.box('chrome', 0.03, 0.14, 0.012, len - 0.06, lh - 0.25, -t / 2 - 0.006);
  if (bath) {
    // a frosted louvre panel low in the leaf for ventilation
    for (let i = 0; i < 5; i++) k.box('doorLeaf', len - 0.2, 0.012, t + 0.004, len / 2, 0.12 + i * 0.045, 0, { rx: 0.5 });
  }
}

/** door casing round an opening on one wall face (opening local frame; z = the wall face) */
export function architrave(k: Kit, wd: number, head: number, z: number, face: 1 | -1) {
  const w = 0.07, t = 0.016;
  k.box('frame', w, head + w, t, -wd / 2 - w / 2 + 0.03, 0, z + face * t / 2);
  k.box('frame', w, head + w, t, wd / 2 + w / 2 - 0.03, 0, z + face * t / 2);
  k.box('frame', wd + 2 * w - 0.06, w, t, 0, head, z + face * t / 2);
}

/** toran: a garland of mango leaves and marigolds strung across the top of the main door (wall-origin) */
export function toran(k: Kit, w: number, y: number) {
  const n = Math.round(w / 0.07);
  k.cyl('rope', 0.004, 0.004, w, 0, y - w / 2, 0.03, { seg: 4, rz: Math.PI / 2 });
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (w * i) / n;
    if (i % 2 === 0) k.leaf('leaf2', x, y - 0.005, 0.032, 0.11, 0.035, 0, -1.45, { droop: 0.2, fold: 0.2, shape: 'lance', rows: 4 });
    else k.ball('marigold', 0.022, 0.022, 0.022, x, y - 0.03, 0.035, { seg: 8 });
  }
  // strings of marigold hanging down at both ends
  for (const sx of [-1, 1]) for (let j = 0; j < 7; j++) k.ball(j % 2 ? 'marigold' : 'rose', 0.02, 0.02, 0.02, sx * (w / 2 - 0.02), y - 0.05 - j * 0.042, 0.035, { seg: 8 });
}

/** rangoli on the floor, centred */
export function rangoli(k: Kit, d = 0.85) {
  k.flat('rangoli', d, d, 0, 0.004, 0, { keep: true });
}

/** wall-origin open shoe rack with a few pairs of chappals */
export function chappalStand(k: Kit, w = 0.75) {
  const d = 0.3;
  for (const y of [0, 0.24, 0.48]) k.box('wood2', w, 0.02, d, 0, y + 0.04, d / 2, { sw: true });
  for (const sx of [-1, 1]) k.box('wood2', 0.02, 0.54, d, sx * (w / 2 - 0.01), 0.04, d / 2);
  const r = rng(91);
  for (let i = 0; i < 5; i++) {
    const y = i < 3 ? 0.06 : 0.3, x = -w / 2 + 0.14 + (i % 3) * 0.24;
    const col = ['black', 'decorA', 'wood', 'cushionB', 'black'][i];
    for (const s of [-1, 1]) k.box(col, 0.09, 0.02, 0.24, x + s * 0.05, y, d / 2, { ry: (r() - 0.5) * 0.3, r: 0.008 });
  }
  k.foot(w, d, 0, d / 2, 0.22, 0.12);
}

/** a brass nameplate beside the door, wall-origin */
export function nameplate(k: Kit, y = 1.45) {
  k.box('brass', 0.32, 0.12, 0.008, 0, y - 0.06, 0.004, { r: 0.004 });
  k.box('black', 0.26, 0.012, 0.002, 0, y + 0.012, 0.009);
  k.box('black', 0.18, 0.008, 0.002, 0, y - 0.022, 0.009);
}

/* ------------------------------------------------------------------ kitchen */

/** a three-burner glass-top gas stove with brass burners and cast pan supports, sitting on the counter */
export function gasStove(k: Kit, x: number, top: number, z: number) {
  k.box('screen', 0.74, 0.03, 0.4, x, top, z, { r: 0.012 });
  for (const [bx, big] of [[-0.24, false], [0, true], [0.24, false]] as const) {
    const rr = big ? 0.06 : 0.048;
    k.cyl('brass', rr, rr + 0.01, 0.018, x + bx, top + 0.03, z - 0.02, { seg: 18 });
    k.cyl('black', rr * 0.5, rr * 0.55, 0.012, x + bx, top + 0.048, z - 0.02, { seg: 14 });
    for (let a = 0; a < 4; a++) k.box('black', 0.012, 0.022, rr * 1.9, x + bx, top + 0.03, z - 0.02, { ry: (a * Math.PI) / 4 });
    k.cyl('black', 0.016, 0.016, 0.025, x + bx, top + 0.006, z + 0.18, { seg: 10, rx: Math.PI / 2 });
  }
}

/** a pressure cooker with its black handle and whistle */
export function pressureCooker(k: Kit, x: number, y: number, z: number, ry = 0) {
  k.at(x, z, ry, () => {
    k.cyl('vessel', 0.1, 0.095, 0.15, 0, y, 0, { seg: 20 });
    k.cyl('vessel', 0.095, 0.1, 0.02, 0, y + 0.15, 0, { seg: 20 });
    k.cyl('black', 0.012, 0.016, 0.04, 0, y + 0.17, 0, { seg: 8 });
    k.box('black', 0.025, 0.025, 0.2, 0, y + 0.16, 0.18, { r: 0.008 });
    k.box('black', 0.025, 0.02, 0.06, 0, y + 0.12, -0.12, { r: 0.006 });
  });
}

/** an iron kadai with two loop handles */
export function kadai(k: Kit, x: number, y: number, z: number) {
  k.cyl('black', 0.15, 0.08, 0.07, x, y, z, { seg: 20, open: true });
  k.cyl('black', 0.08, 0.08, 0.004, x, y, z, { seg: 16 });
  for (const s of [-1, 1]) k.cyl('black', 0.03, 0.03, 0.01, x + s * 0.16, y + 0.06, z, { seg: 10, rx: Math.PI / 2, open: true });
}

/** the masala dabba: a round steel tin, lid off, seven katoris of spice inside */
export function masalaDabba(k: Kit, x: number, y: number, z: number) {
  k.cyl('vessel', 0.105, 0.1, 0.06, x, y, z, { seg: 24 });
  const spice = ['marigold', 'fruit2', 'fruit', 'leaf2', 'paper', 'decorA', 'black'];
  for (let i = 0; i < 7; i++) {
    const a = (i / 6) * Math.PI * 2, rr = i === 6 ? 0 : 0.06;
    k.cyl(spice[i], 0.026, 0.026, 0.004, x + Math.cos(a) * rr, y + 0.056, z + Math.sin(a) * rr, { seg: 12 });
  }
  k.cyl('vessel', 0.105, 0.105, 0.012, x + 0.14, y, z + 0.06, { seg: 24 });
}

/** a row of steel storage dabbas */
export function dabbas(k: Kit, x: number, y: number, z: number, n = 4) {
  for (let i = 0; i < n; i++) {
    const h = 0.12 + (i % 3) * 0.04, rr = 0.05 + (i % 2) * 0.01;
    k.cyl('vessel', rr, rr, h, x + i * 0.13, y, z, { seg: 18 });
    k.cyl('vessel', rr + 0.004, rr + 0.004, 0.015, x + i * 0.13, y + h, z, { seg: 18 });
  }
}

/** wall-origin RO water purifier: a white cabinet with a blue panel and a chrome tap */
export function roPurifier(k: Kit, y = 1.12) {
  k.box('acBody', 0.3, 0.44, 0.26, 0, y, 0.13, { r: 0.03 });
  k.box('plastic', 0.24, 0.26, 0.01, 0, y + 0.12, 0.262, { r: 0.02 });
  k.box('acLed', 0.08, 0.012, 0.004, 0, y + 0.3, 0.268);
  k.box('chrome', 0.03, 0.03, 0.06, 0, y + 0.03, 0.29);
  k.cyl('chrome', 0.008, 0.006, 0.04, 0, y - 0.01, 0.31, { seg: 8 });
}

/** a red LPG cylinder standing on the floor (centred) */
export function lpgCylinder(k: Kit) {
  k.cyl('plasticR', 0.15, 0.15, 0.58, 0, 0.02, 0, { seg: 20 });
  k.ball('plasticR', 0.15, 0.08, 0.15, 0, 0.6, 0, { seg: 16 });
  k.cyl('plasticR', 0.14, 0.15, 0.03, 0, 0, 0, { seg: 20 });
  k.cyl('steel', 0.04, 0.05, 0.08, 0, 0.66, 0, { seg: 12, open: true });
  k.cyl('black', 0.015, 0.015, 0.05, 0, 0.7, 0, { seg: 8 });
  k.foot(0.32, 0.32, 0, 0, 0.3, 0.1);
}

/** steel plates standing in a wall rack (wall-origin) */
export function plateRack(k: Kit, w = 0.6, y = 1.25) {
  k.box('steel', w, 0.012, 0.22, 0, y, 0.11);
  for (const sx of [-1, 1]) k.box('steel', 0.012, 0.3, 0.22, sx * w / 2, y, 0.11);
  for (let i = 0; i < 7; i++) k.cyl('vessel', 0.14, 0.14, 0.008, -w / 2 + 0.08 + i * 0.07, y + 0.14, 0.12, { seg: 22, rz: Math.PI / 2 });
}

/* ------------------------------------------------------------------ bathroom */

/** a bucket and mug under a low tap (centred on the floor) */
export function bucketMug(k: Kit, slot = 'plastic') {
  k.cyl(slot, 0.17, 0.13, 0.34, 0, 0, 0, { seg: 22, open: true });
  k.cyl(slot, 0.13, 0.13, 0.006, 0, 0.003, 0, { seg: 20 });
  k.cyl('water', 0.162, 0.162, 0.004, 0, 0.27, 0, { seg: 22 });
  k.cyl(slot, 0.175, 0.175, 0.014, 0, 0.33, 0, { seg: 22, open: true });
  // mug resting on the rim
  k.cyl('plasticR', 0.05, 0.045, 0.11, 0.22, 0, 0.04, { seg: 14, open: true });
  k.cyl('plasticR', 0.045, 0.045, 0.004, 0.22, 0.002, 0.04, { seg: 12 });
  k.box('plasticR', 0.012, 0.07, 0.04, 0.28, 0.02, 0.04, { r: 0.005 });
  k.foot(0.4, 0.36, 0.05, 0, 0.22, 0.1);
}

/** wall-origin wall mixer at bucket height, with its spout */
export function lowTap(k: Kit, y = 0.62) {
  k.cyl('chrome', 0.03, 0.03, 0.02, 0, y, 0.01, { seg: 14, rx: Math.PI / 2 });
  k.box('chrome', 0.022, 0.022, 0.12, 0, y - 0.01, 0.07, { r: 0.008 });
  k.box('chrome', 0.06, 0.012, 0.02, 0, y + 0.03, 0.03, { r: 0.004 });
}

/** wall-origin storage geyser, its base at height y */
export function geyser(k: Kit, y = 1.85) {
  k.cyl('acBody', 0.2, 0.2, 0.5, 0, y + 0.2 - 0.25, 0.21, { seg: 22, rz: Math.PI / 2 });
  k.box('acLed', 0.02, 0.02, 0.006, 0.12, y + 0.18, 0.41);
  for (const s of [-1, 1]) k.cyl('chrome', 0.012, 0.012, 0.3, s * 0.12, y - 0.3, 0.08, { seg: 8 });
}

/** a health faucet on its hook beside the WC (wall-origin) */
export function healthFaucet(k: Kit, y = 0.62) {
  k.box('chrome', 0.03, 0.05, 0.03, 0, y, 0.015, { r: 0.006 });
  k.box('chrome', 0.035, 0.09, 0.03, 0, y - 0.02, 0.05, { r: 0.012, rx: -0.3 });
  k.cyl('chrome', 0.006, 0.006, 0.4, 0.02, y - 0.42, 0.03, { seg: 6 });
}

/** a slotted steel floor drain */
export function floorDrain(k: Kit, x: number, z: number) {
  k.box('steel', 0.13, 0.004, 0.13, x, 0.003, z);
  for (let i = 0; i < 5; i++) k.box('black', 0.1, 0.0045, 0.008, x, 0.0032, z - 0.04 + i * 0.02);
}

/** a wall exhaust fan set into the ventilator (opening local frame) */
export function exhaustFan(k: Kit, y: number, z: number) {
  k.cyl('acBody', 0.12, 0.12, 0.04, 0, y, z, { seg: 20, rx: Math.PI / 2 });
  for (let i = 0; i < 5; i++) k.box('black', 0.008, 0.2, 0.004, -0.08 + i * 0.04, y - 0.1, z + 0.022);
}

/* ------------------------------------------------------------------ living & pooja */

/**
 * Oonjal — the South Indian wooden swing — hanging from the ceiling on brass chains. Centred,
 * the seat runs along local x.
 */
export function oonjal(k: Kit, w = 1.15, d = 0.5) {
  const y = 0.42;
  k.box('teak', w, 0.05, d, 0, y, 0, { r: 0.01, sw: true });
  // a low carved back rail and side rails
  k.box('teak', w, 0.04, 0.04, 0, y + 0.3, -d / 2 + 0.03, { r: 0.008 });
  for (let i = 0; i < 9; i++) k.cyl('teak', 0.012, 0.012, 0.25, -w / 2 + 0.07 + ((w - 0.14) * i) / 8, y + 0.05, -d / 2 + 0.03, { seg: 8 });
  for (const sx of [-1, 1]) k.box('teak', 0.04, 0.16, d - 0.06, sx * (w / 2 - 0.02), y + 0.05, 0.03, { r: 0.008 });
  k.soft('cushionA', w - 0.12, 0.06, d - 0.08, 0, y + 0.08, 0.03, { side: 5, corner: 0.05, puff: 0.006, step: 0.07 });
  k.soft('cushionB', 0.4, 0.12, 0.3, -w / 2 + 0.3, y + 0.24, -d / 2 + 0.12, { side: 2.6, corner: 0.08, puff: 0.012, rx: -1.2, step: 0.05 });
  // brass chains: a rod with a ring every few centimetres, split at the dollhouse cut
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2 - 0.05), z = sz * (d / 2 - 0.05);
    const chain = (y0: number, y1: number) => {
      k.cyl('brass', 0.005, 0.005, y1 - y0, x, y0, z, { seg: 5 });
      for (let yy = y0 + 0.04; yy < y1; yy += 0.12) k.cyl('brass', 0.012, 0.012, 0.035, x, yy, z, { seg: 8, open: true });
    };
    chain(y + 0.05, CUT - 0.001);
    k.layer(true, () => chain(CUT, H - 0.02));
  }
  // a pair of small bells on the front chains
  for (const sx of [-1, 1]) k.cyl('brass', 0.012, 0.025, 0.04, sx * (w / 2 - 0.05), y + 0.55, d / 2 - 0.05, { seg: 10 });
  k.foot(w, d, 0, 0, 0.18, 0.2);
}

/** a wide brass urli with water, floating flowers and three floating diyas */
export function urli(k: Kit, x: number, y: number, z: number, rr = 0.24) {
  k.cyl('brass', rr, rr * 0.55, 0.09, x, y, z, { seg: 28, open: true });
  k.cyl('brass', rr * 0.55, rr * 0.55, 0.004, x, y, z, { seg: 20 });
  k.cyl('brass', rr + 0.015, rr + 0.015, 0.012, x, y + 0.085, z, { seg: 28, open: true });
  k.cyl('water', rr - 0.01, rr - 0.01, 0.003, x, y + 0.07, z, { seg: 28 });
  const r = rng(Math.round(x * 100 + z * 37));
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * rr * 0.75;
    k.ball(i % 3 ? 'marigold' : 'rose', 0.026, 0.012, 0.026, x + Math.cos(a) * d, y + 0.078, z + Math.sin(a) * d, { seg: 8 });
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4, d = rr * 0.5;
    const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
    k.cyl('terracotta', 0.03, 0.018, 0.02, px, y + 0.072, pz, { seg: 12 });
    k.ball('flame', 0.006, 0.016, 0.006, px, y + 0.104, pz, { seg: 6 });
    k.halo(px, y + 0.11, pz);
  }
  k.light('always', x, y + 0.25, z, 0.8, 0xffa24a);
}

/** kuthuvilakku: a tall brass oil lamp with five wicks (centred on the floor or a surface) */
export function kuthuvilakku(k: Kit, x: number, y: number, z: number, s = 1) {
  k.cyl('brass', 0.11 * s, 0.13 * s, 0.03 * s, x, y, z, { seg: 22 });
  k.cyl('brass', 0.05 * s, 0.09 * s, 0.06 * s, x, y + 0.03 * s, z, { seg: 18 });
  k.cyl('brass', 0.014 * s, 0.018 * s, 0.4 * s, x, y + 0.09 * s, z, { seg: 10 });
  for (const yy of [0.2, 0.34]) k.ball('brass', 0.03 * s, 0.022 * s, 0.03 * s, x, y + yy * s, z, { seg: 12 });
  k.cyl('brass', 0.1 * s, 0.03 * s, 0.05 * s, x, y + 0.49 * s, z, { seg: 20 });
  k.cyl('brass', 0.012 * s, 0.012 * s, 0.12 * s, x, y + 0.54 * s, z, { seg: 8 });
  k.ball('brass', 0.03 * s, 0.045 * s, 0.03 * s, x, y + 0.69 * s, z, { seg: 12 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    k.ball('flame', 0.006 * s, 0.018 * s, 0.006 * s, x + Math.cos(a) * 0.085 * s, y + 0.555 * s, z + Math.sin(a) * 0.085 * s, { seg: 6 });
  }
  k.halo(x, y + 0.57 * s, z);
  k.light('always', x, y + 0.65 * s, z, 0.9, 0xffa24a);
  if (y < 0.01) k.foot(0.26 * s, 0.26 * s, x, z, 0.24, 0.08);
}

/** tulsi kota: the whitewashed pedestal for the holy basil, with painted bands and a lamp niche (centred) */
export function tulsiKota(k: Kit) {
  const w = 0.44, h = 0.72;
  k.box('whitewash', w + 0.08, 0.08, w + 0.08, 0, 0, 0, { r: 0.01 });
  k.box('whitewash', w, h - 0.16, w, 0, 0.08, 0, { r: 0.006 });
  k.box('whitewash', w + 0.06, 0.08, w + 0.06, 0, h - 0.08, 0, { r: 0.01 });
  for (const y of [0.16, h - 0.14]) for (const face of [0, 1, 2, 3]) {
    const a = (face * Math.PI) / 2;
    k.box(face % 2 ? 'marigold' : 'terracotta', w - 0.04, 0.03, 0.004, Math.sin(a) * (w / 2 + 0.002), y, Math.cos(a) * (w / 2 + 0.002), { ry: a });
  }
  // the niche on the front with a lamp in it
  k.box('black', 0.13, 0.15, 0.02, 0, 0.3, w / 2 - 0.008);
  k.cyl('terracotta', 0.025, 0.015, 0.015, 0, 0.31, w / 2 - 0.03, { seg: 10 });
  k.ball('flame', 0.005, 0.014, 0.005, 0, 0.338, w / 2 - 0.03, { seg: 6 });
  // the basil: woody stems rising out of the soil, small leaves in whorls
  k.box('soil', w - 0.08, 0.02, w - 0.08, 0, h - 0.02, 0);
  const r = rng(404);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + r() * 0.4, lean = 0.1 + r() * 0.18, L = 0.26 + r() * 0.14;
    const x0 = Math.cos(a) * 0.04, z0 = Math.sin(a) * 0.04, x1 = x0 + Math.cos(a) * Math.sin(lean) * L, z1 = z0 + Math.sin(a) * Math.sin(lean) * L, y1 = h + Math.cos(lean) * L;
    k.rod('wood2', x0, h, z0, x1, y1, z1, 0.005, 0.003, 5);
    for (let j = 0; j < 6; j++) {
      const t = 0.3 + j * 0.12, px = x0 + (x1 - x0) * t, py = h + (y1 - h) * t, pz = z0 + (z1 - z0) * t;
      for (let q = 0; q < 2; q++) k.leaf(j % 2 ? 'leaf' : 'leaf2', px, py, pz, 0.04, 0.022, a + (q ? 1.6 : -1.6) + j, 0.35, { droop: 0.7, fold: 0.2, rows: 3 });
    }
    // the purple flower spikes at the tips
    k.cyl('decorA', 0.004, 0.006, 0.05, x1, y1, z1, { seg: 5 });
  }
  k.foot(w + 0.1, w + 0.1, 0, 0, 0.3, 0.12);
}

/** wall-origin Kalamkari hanging in a carved wooden frame, centred at height y */
export function kalamkari(k: Kit, w: number, y: number) {
  const h = w * 0.66;
  k.box('wood2', w + 0.08, h + 0.08, 0.03, 0, y - h / 2 - 0.04, 0.015, { r: 0.006 });
  k.box('brass', w + 0.02, 0.012, 0.006, 0, y + h / 2 + 0.002, 0.032);
  k.box('brass', w + 0.02, 0.012, 0.006, 0, y - h / 2 - 0.014, 0.032);
  k.wallQuad('kalamkari', w, h, 0, y, 0.0315);
}

/** wall-origin round wall clock */
export function wallClock(k: Kit, y = 2.0, rr = 0.17) {
  k.cyl('wood2', rr + 0.015, rr + 0.015, 0.035, 0, y, 0.0175, { seg: 32, rx: Math.PI / 2 });
  k.cyl('paper', rr, rr, 0.004, 0, y, 0.037, { seg: 32, rx: Math.PI / 2 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    k.box('black', 0.008, i % 3 ? 0.014 : 0.028, 0.002, Math.sin(a) * rr * 0.86, y + Math.cos(a) * rr * 0.86 - 0.007, 0.04, { rz: -a });
  }
  k.box('black', 0.01, rr * 0.55, 0.003, 0, y, 0.042, { rz: 2.1 });
  k.box('black', 0.007, rr * 0.8, 0.003, 0, y, 0.045, { rz: -0.6 });
}

/** a steel thali with two katoris and a steel tumbler, in front of a chair (place-setting origin) */
export function thali(k: Kit, top: number) {
  k.cyl('vessel', 0.15, 0.145, 0.012, 0, top, 0.37, { seg: 28 });
  k.cyl('vessel', 0.155, 0.155, 0.018, 0, top + 0.004, 0.37, { seg: 28, open: true });
  for (const [x, z] of [[-0.07, 0.3], [0.07, 0.3]]) k.cyl('vessel', 0.04, 0.03, 0.035, x, top + 0.012, z, { seg: 16 });
  k.cyl('vessel', 0.032, 0.027, 0.11, 0.18, top, 0.5, { seg: 14 });
}
