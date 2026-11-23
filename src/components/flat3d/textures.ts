import * as THREE from 'three';

/**
 * Every surface in the flat is painted in code onto a canvas — no image files are downloaded.
 * Generators are deterministic (seeded), so the home looks the same on every visit.
 */

export type Rng = () => number;
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const css = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: RGB, k: number): RGB => (k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k));

function canvas(w: number, h = w): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function finish(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

/** fine per-pixel grain, so nothing reads as flat computer colour */
function grain(g: CanvasRenderingContext2D, w: number, h: number, r: Rng, amt: number) {
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amt;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  g.putImageData(img, 0, 0);
}

/* ------------------------------------------------------------------ noise */

/** tileable smooth value-noise fbm: n × n samples spanning exactly one repeat, values 0..1 */
function field(n: number, cells: number, oct: number, seed: number): Float32Array {
  const r = rng(seed);
  const out = new Float32Array(n * n);
  let amp = 1, tot = 0;
  for (let o = 0; o < oct; o++) {
    const c = cells << o;
    const lat = new Float32Array(c * c);
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    for (let j = 0; j < n; j++) {
      const fy = (j / n) * c, y0 = fy | 0, y1 = (y0 + 1) % c, ty = fy - y0, sy = ty * ty * (3 - 2 * ty);
      for (let i = 0; i < n; i++) {
        const fx = (i / n) * c, x0 = fx | 0, x1 = (x0 + 1) % c, tx = fx - x0, sx = tx * tx * (3 - 2 * tx);
        const a = lat[y0 * c + x0] + (lat[y0 * c + x1] - lat[y0 * c + x0]) * sx;
        const b = lat[y1 * c + x0] + (lat[y1 * c + x1] - lat[y1 * c + x0]) * sx;
        out[j * n + i] += (a + (b - a) * sy) * amp;
      }
    }
    tot += amp; amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}

/** bilinear lookup into a field; u, v are measured in repeats and wrap */
function at(f: Float32Array, n: number, u: number, v: number) {
  const fx = (u - Math.floor(u)) * n, fy = (v - Math.floor(v)) * n;
  const x0 = (fx | 0) % n, y0 = (fy | 0) % n, x1 = (x0 + 1) % n, y1 = (y0 + 1) % n, tx = fx - (fx | 0), ty = fy - (fy | 0);
  const a = f[y0 * n + x0] + (f[y0 * n + x1] - f[y0 * n + x0]) * tx;
  const b = f[y1 * n + x0] + (f[y1 * n + x1] - f[y1 * n + x0]) * tx;
  return a + (b - a) * ty;
}

/** 1 at the centre line of a vein, falling off sharply: |sin| folded and raised to a power */
const band = (s: number, k: number) => Math.pow(1 - Math.abs(Math.sin(s * Math.PI)), k);

type Marble = { base: RGB; light: RGB; main: RGB; second: RGB; vein: number; cloud: number };
/** one pixel of marble: cloudy body, a dominant warped vein family and fine cross veins */
function marblePx(m: Marble, cl: number, s1: number, s2: number, fn: number, tone: number, out: number[]) {
  const k = (cl - 0.5) * 2 * m.cloud * 2.2;
  const lt = Math.max(0, k), dk = Math.max(0, -k) * 0.35;
  let R = m.base[0] + (m.light[0] - m.base[0]) * lt, G = m.base[1] + (m.light[1] - m.base[1]) * lt, B = m.base[2] + (m.light[2] - m.base[2]) * lt;
  const f = (1 - dk) * (1 + tone);
  R *= f; G *= f; B *= f;
  // a sharp vein core inside a soft halo, as minerals bleed into the stone around a vein
  const m1 = Math.min(1, (band(s1, 18) + band(s1, 3) * 0.28) * (0.3 + cl) * m.vein * 1.5);
  const m2 = Math.min(1, band(s2, 70) * m.vein * 1.1 + band(s1 * 3 + fn * 2, 120) * m.vein * 0.18);
  R += (m.main[0] - R) * m1; G += (m.main[1] - G) * m1; B += (m.main[2] - B) * m1;
  R += (m.second[0] - R) * m2; G += (m.second[1] - G) * m2; B += (m.second[2] - B) * m2;
  const sp = (fn - 0.5) * 9;
  out[0] = R + sp; out[1] = G + sp; out[2] = B + sp;
}

const marbleOf = (o: { base: string; veins: string[]; vein: number }, cloud: number): Marble => {
  const base = hex(o.base), vs = o.veins.map(hex);
  return { base, light: vs[2] ?? shade(base, 0.3), main: vs[0], second: vs[1] ?? vs[0], vein: o.vein, cloud };
};

/** polished stone / vitrified tile: n × n different tiles so the veining never visibly repeats */
export function tileTex(o: { size: number; n: number; base: string; veins: string[]; grout: string; vein: number; cloud: number; seed: number; groutW?: number }) {
  const S = o.size;
  const [c, g] = canvas(S);
  const r = rng(o.seed);
  const m = marbleOf(o, o.cloud);
  const N = 256, cloud = field(N, 3, 5, o.seed + 1), warp = field(N, 2, 5, o.seed + 2), fine = field(N, 6, 4, o.seed + 3);
  const cell = S / o.n;
  // every tile is cut from a different part of the slab, with its own vein direction
  const tiles = Array.from({ length: o.n * o.n }, () => {
    const a = 0.5 + (r() - 0.5) * 1.4;
    return { ca: Math.cos(a), sa: Math.sin(a), f: 0.55 + r() * 0.8, ph: r() * 4, ou: r(), ov: r(), tone: (r() - 0.5) * 0.05 };
  });
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S), d = img.data, px = [0, 0, 0];
  for (let y = 0; y < S; y++) {
    const ty = Math.min(o.n - 1, (y / cell) | 0), v = y / cell;
    for (let x = 0; x < S; x++) {
      const t = tiles[ty * o.n + Math.min(o.n - 1, (x / cell) | 0)], u = x / cell;
      const su = u * 0.5 + t.ou, sv = v * 0.5 + t.ov;
      const cl = at(cloud, N, su, sv), wp = at(warp, N, su * 0.7, sv * 0.7), fn = at(fine, N, su * 1.3, sv * 1.3);
      const s1 = (u * t.ca + v * t.sa) * t.f + wp * 2.2 + t.ph;
      const s2 = (v * t.ca - u * t.sa) * t.f * 2.7 + fn * 3.5 + t.ph * 3;
      marblePx(m, cl, s1, s2, fn, t.tone, px);
      const i = (y * S + x) * 4;
      d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const gw = o.groutW ?? Math.max(1.5, S / 420);
  g.strokeStyle = o.grout; g.lineWidth = gw;
  for (let i = 0; i <= o.n; i++) {
    g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, o.size); g.stroke();
    g.beginPath(); g.moveTo(0, i * cell); g.lineTo(o.size, i * cell); g.stroke();
  }
  // a hairline of light on the tile edge sells the bevel
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1;
  for (let i = 0; i < o.n; i++) {
    g.beginPath(); g.moveTo(i * cell + gw, 0); g.lineTo(i * cell + gw, o.size); g.stroke();
    g.beginPath(); g.moveTo(0, i * cell + gw); g.lineTo(o.size, i * cell + gw); g.stroke();
  }
  return finish(c);
}

/** a single uninterrupted slab — counters and vanity tops */
export function slabTex(o: { size: number; base: string; veins: string[]; vein: number; seed: number }) {
  const S = o.size;
  const [c, g] = canvas(S);
  const r = rng(o.seed);
  const m = marbleOf(o, 0.14);
  const N = 256, cloud = field(N, 3, 5, o.seed + 1), warp = field(N, 2, 5, o.seed + 2), fine = field(N, 6, 4, o.seed + 3);
  // whole-number vein directions keep the slab seamless where it repeats
  const k1 = 1 + ((r() * 2) | 0), k2 = 1 + ((r() * 2) | 0), ph = r() * 4;
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S), d = img.data, px = [0, 0, 0];
  for (let y = 0; y < S; y++) {
    const v = y / S;
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const cl = at(cloud, N, u, v), wp = at(warp, N, u, v), fn = at(fine, N, u * 2, v * 2);
      marblePx(m, cl, u * k1 + v * k2 + wp * 1.6 + ph, v * 3 - u * 2 + fn * 3, fn, 0, px);
      const i = (y * S + x) * 4;
      d[i] = px[0]; d[i + 1] = px[1]; d[i + 2] = px[2]; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return finish(c);
}

/** timber: boards run up the canvas (along V) */
export function woodTex(o: { size: number; cols: number; base: string; dark: string; variance: number; gap: number; joints: boolean; seed: number }) {
  const S = o.size;
  const [c, g] = canvas(S);
  const r = rng(o.seed);
  const base = hex(o.base), dark = hex(o.dark);
  const N = 256, wob = field(N, 2, 4, o.seed + 7), fib = field(N, 24, 2, o.seed + 8), mot = field(N, 3, 3, o.seed + 9);
  const bw = S / o.cols, wide = o.cols < 4;
  /*
   * Each board is a flat-sawn slice through a tapering log, `h` rings from the pith. Ring k
   * meets the board where sqrt(h² + dx²) + taper·v = k, which draws nested cathedral arches all
   * opening the same way. A whole number of rings of taper per repeat keeps the texture seamless.
   */
  const board = () => {
    const tone = shade(mix(base, dark, r() * o.variance), (r() - 0.5) * o.variance * 0.5);
    const taper = (r() < 0.5 ? -1 : 1) * (2 + ((r() * 3) | 0));
    return { h: 0.8 + r() * 2.5, taper, rings: wide ? 9 + r() * 7 : 4 + r() * 4, off: r() * 10, tone, late: mix(tone, dark, 0.5 + r() * 0.25) };
  };
  const cols = Array.from({ length: o.cols }, () => ({ cut: o.joints ? (r() * S) | 0 : S, a: board(), b: board() }));
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  const img = g.getImageData(0, 0, S, S), d = img.data;
  for (let y = 0; y < S; y++) {
    const v = y / S;
    for (let x = 0; x < S; x++) {
      const ci = Math.min(o.cols - 1, (x / bw) | 0), col = cols[ci], b = y < col.cut ? col.a : col.b;
      const u = x / S, xf = (x - ci * bw) / bw - 0.5;
      const hh = b.h + (at(wob, N, u, v) - 0.5) * 0.8;
      const dx = xf * b.rings;
      const dist = Math.sqrt(hh * hh + dx * dx) + b.taper * v + (at(wob, N, u * 2, v * 2) - 0.5) * 0.5 + b.off;
      const ring = dist - Math.floor(dist);
      // pale earlywood darkens into a latewood band that ends at a crisp ring boundary
      const lw = ring < 0.55 ? 0 : ring > 0.92 ? (1 - ring) / 0.08 : (ring - 0.55) / 0.37;
      const t = lw * lw * 0.85;
      // long open pores run with the grain; a broad mottle keeps the board from looking printed
      const f = 1 + (at(fib, N, u * 8, v) - 0.5) * 0.24 + (at(mot, N, u, v) - 0.5) * 0.12;
      const i = (y * S + x) * 4;
      d[i] = (b.tone[0] + (b.late[0] - b.tone[0]) * t) * f;
      d[i + 1] = (b.tone[1] + (b.late[1] - b.tone[1]) * t) * f;
      d[i + 2] = (b.tone[2] + (b.late[2] - b.tone[2]) * t) * f;
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < o.cols; i++) {
    const x = i * bw;
    if (o.joints) {
      // the board also changes where the texture wraps, so that edge gets a joint too
      g.fillStyle = css(shade(dark, -0.35), 0.7);
      g.fillRect(x, cols[i].cut - 0.75, bw, 1.5); g.fillRect(x, 0, bw, 0.75); g.fillRect(x, S - 0.75, bw, 0.75);
    }
    if (o.gap > 0) { g.fillStyle = css(shade(dark, -0.45), 0.85); g.fillRect(x - o.gap / 2, 0, o.gap, S); }
  }
  return finish(c);
}

export type Weave = 'plain' | 'linen' | 'boucle' | 'velvet' | 'knit' | 'terry';

/** loops of yarn scattered over the cloth (boucle, terry towelling); wraps at the edges */
function loops(g: CanvasRenderingContext2D, S: number, base: RGB, r: Rng, n: number, rad: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * S, y = r() * S, rr = rad * (0.6 + r() * 0.8), lt = r() < 0.5;
    g.strokeStyle = css(shade(base, lt ? 0.08 + r() * 0.14 : -0.08 - r() * 0.18), 0.85);
    g.lineWidth = rr * (0.45 + r() * 0.3);
    const a0 = r() * 6.28, a1 = a0 + 3.4 + r() * 2.4;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (x + ox < -rr * 2 || x + ox > S + rr * 2 || y + oy < -rr * 2 || y + oy > S + rr * 2) continue;
      g.beginPath(); g.arc(x + ox, y + oy, rr, a0, a1); g.stroke();
    }
  }
}

/** chunky stockinette: columns of V-shaped stitches */
function knit(g: CanvasRenderingContext2D, S: number, base: RGB, r: Rng) {
  const cols = 16, rows = 20, w = S / cols, h = S / rows;
  g.fillStyle = css(shade(base, -0.4)); g.fillRect(0, 0, S, S);
  for (let j = -1; j <= rows; j++) for (let i = 0; i < cols; i++) {
    const cx = (i + 0.5) * w, cy = (j + 0.5) * h, tone = shade(base, (r() - 0.5) * 0.08);
    for (const side of [-1, 1]) {
      const ex = cx + side * w * 0.22;
      const gr = g.createRadialGradient(ex, cy - h * 0.15, 0, ex, cy, h * 0.75);
      gr.addColorStop(0, css(shade(tone, 0.16))); gr.addColorStop(0.6, css(tone)); gr.addColorStop(1, css(shade(tone, -0.32)));
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(ex, cy, w * 0.26, h * 0.68, side * 0.5, 0, Math.PI * 2); g.fill();
    }
  }
}

/** woven, knitted or piled cloth — upholstery, bedding, curtains, throws and towels */
export function fabricTex(o: { size: number; base: string; contrast: number; scale: number; seed: number; weave?: Weave }) {
  const S = o.size, k = o.contrast, weave = o.weave ?? 'plain';
  const [c, g] = canvas(S);
  const r = rng(o.seed);
  const base = hex(o.base);
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  if (weave === 'knit') knit(g, S, base, r);
  else if (weave === 'boucle') loops(g, S, base, r, (S * S) / 10, S / 90);
  else if (weave === 'terry') loops(g, S, base, r, (S * S) / 6, S / 140);
  const N = 128, mot = field(N, 2, 4, o.seed + 1), crush = field(N, 2, 3, o.seed + 2);
  // a whole number of thread pairs keeps the weave seamless
  const pairs = Math.max(2, Math.round(S / (2 * o.scale))), s = S / (2 * pairs), nt = pairs * 2;
  // every thread is spun a little unevenly: a tone of its own plus slubs along its length
  const KN = 12, tone = new Float32Array(nt * 2), slub = new Float32Array(nt * 2 * KN);
  for (let i = 0; i < tone.length; i++) tone[i] = r();
  for (let i = 0; i < slub.length; i++) slub[i] = r() < (weave === 'linen' ? 0.22 : 0.08) ? r() : 0.5;
  const slubAt = (id: number, t: number) => {
    const f = t * KN, a = f | 0, w = f - a, ss = w * w * (3 - 2 * w);
    return slub[id * KN + (a % KN)] * (1 - ss) + slub[id * KN + ((a + 1) % KN)] * ss;
  };
  const woven = weave === 'plain' || weave === 'linen';
  const img = g.getImageData(0, 0, S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    let dv = (at(mot, N, u, v) - 0.5) * k * 1.2;
    if (woven) {
      const tx = x / s, ty = y / s, ix = (tx | 0) % nt, iy = (ty | 0) % nt;
      const up = ((ix + iy) & 1) === 0;
      const prof = Math.sin((up ? tx - (tx | 0) : ty - (ty | 0)) * Math.PI);
      const id = up ? ix : nt + iy;
      dv += (prof - 0.65) * k * 1.4 + (tone[id] - 0.5) * k * 0.9 + (slubAt(id, up ? v : u) - 0.5) * k * (weave === 'linen' ? 3 : 1.2);
    } else if (weave === 'velvet') {
      // a dense pile: fine fibre speckle and broad crushed bands that catch the light differently
      dv += (r() - 0.5) * k * 0.7 + (at(crush, N, u, v) - 0.5) * k * 2.2;
    } else dv += (r() - 0.5) * k * 0.5;
    const i = (y * S + x) * 4;
    d[i] += dv; d[i + 1] += dv; d[i + 2] += dv;
  }
  g.putImageData(img, 0, 0);
  return finish(c);
}

/** hand-finished plaster: nearly flat, never perfectly flat */
export function plasterTex(o: { size: number; base: string; seed: number }) {
  const S = o.size;
  const [c, g] = canvas(S);
  const r = rng(o.seed);
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  const N = 128, broad = field(N, 2, 5, o.seed + 1), fine = field(N, 8, 3, o.seed + 2);
  const img = g.getImageData(0, 0, S, S), d = img.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S;
    const dv = (at(broad, N, u, v) - 0.5) * 16 + (at(fine, N, u, v) - 0.5) * 7 + (r() - 0.5) * 5;
    const i = (y * S + x) * 4;
    d[i] += dv; d[i + 1] += dv; d[i + 2] += dv;
  }
  g.putImageData(img, 0, 0);
  return finish(c);
}

/** ceramic wall / floor tile laid on a grid, optionally brick-bonded */
export function gridTex(o: { size: number; cols: number; rows: number; base: string; grout: string; variance: number; bond?: boolean; seed: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base);
  const cw = o.size / o.cols, ch = o.size / o.rows;
  g.fillStyle = o.grout; g.fillRect(0, 0, o.size, o.size);
  const gw = Math.max(1.5, o.size / 300);
  for (let j = 0; j < o.rows; j++) for (let i = -1; i < o.cols; i++) {
    const off = o.bond && j % 2 ? cw / 2 : 0;
    const x = i * cw + off, y = j * ch;
    const tone = shade(base, (r() - 0.5) * o.variance);
    const gr = g.createLinearGradient(x, y, x + cw, y + ch);
    gr.addColorStop(0, css(shade(tone, 0.06))); gr.addColorStop(1, css(shade(tone, -0.04)));
    g.fillStyle = gr;
    g.fillRect(x + gw / 2, y + gw / 2, cw - gw, ch - gw);
  }
  grain(g, o.size, o.size, r, 4);
  return finish(c);
}

/* ------------------------------------------------------------------ rugs */

export type RugKind = 'persian' | 'geo' | 'berber';
export function rugTex(o: { kind: RugKind; pal: string[]; seed: number; size: number; aspect: number }) {
  const w = o.size, h = Math.round(o.size / o.aspect);
  const [c, g] = canvas(w, h);
  const r = rng(o.seed);
  const p = o.pal.map(hex);
  g.fillStyle = o.pal[0]; g.fillRect(0, 0, w, h);
  if (o.kind === 'persian') {
    // a wide main border between two guard stripes
    const edge = w * 0.085;
    g.fillStyle = css(p[2]); g.fillRect(w * 0.02, w * 0.02, w - w * 0.04, h - w * 0.04);
    g.fillStyle = css(p[0]); g.fillRect(edge, edge, w - 2 * edge, h - 2 * edge);
    g.lineWidth = w * 0.005;
    for (const [b, col] of [[0.02, p[1]], [0.03, p[3]], [0.074, p[3]], [0.085, p[1]]] as [number, RGB][]) {
      g.strokeStyle = css(col, 0.85);
      g.strokeRect(w * b, w * b, w - 2 * w * b, h - 2 * w * b);
    }
    // small alternating motifs running round the border
    const m = w * 0.052, stepB = w * 0.03;
    for (let x = m * 1.7, i = 0; x < w - m * 1.2; x += stepB, i++) {
      g.fillStyle = css(i % 2 ? p[1] : p[3], 0.9);
      diamond(g, x, m, w * 0.009); diamond(g, x, h - m, w * 0.009);
    }
    for (let y = m * 1.7, i = 0; y < h - m * 1.2; y += stepB, i++) {
      g.fillStyle = css(i % 2 ? p[1] : p[3], 0.9);
      diamond(g, m, y, w * 0.009); diamond(g, w - m, y, w * 0.009);
    }
    // fine all-over lattice in the field
    g.save();
    g.beginPath(); g.rect(edge, edge, w - 2 * edge, h - 2 * edge); g.clip();
    const st = w * 0.042;
    for (let y = 0; y < h + st; y += st) for (let x = ((y / st) | 0) % 2 ? st / 2 : 0; x < w + st; x += st) {
      g.fillStyle = css(p[(r() * 3 + 1) | 0], 0.3);
      diamond(g, x, y, st * 0.2);
    }
    // a modest central medallion with two pendants
    const cx = w / 2, cy = h / 2;
    for (const [s, col, a] of [[0.15, p[2], 0.9], [0.125, p[1], 0.9], [0.095, p[3], 0.85], [0.06, p[0], 1], [0.03, p[1], 0.9]] as [number, RGB, number][]) {
      g.fillStyle = css(col, a);
      diamond(g, cx, cy, w * s * 1.25, w * s);
    }
    for (const sx of [-1, 1]) {
      g.fillStyle = css(p[2], 0.85); diamond(g, cx + sx * w * 0.25, cy, w * 0.035, w * 0.028);
      g.fillStyle = css(p[1], 0.85); diamond(g, cx + sx * w * 0.25, cy, w * 0.018, w * 0.014);
    }
    g.restore();
    // hand-dyed wool is never one flat colour: faint bands of tone, then a soft overall fade
    for (let y = 0; y < h; y += 3 + r() * 9) {
      g.fillStyle = r() < 0.5 ? `rgba(255,244,222,${r() * 0.07})` : `rgba(30,16,8,${r() * 0.07})`;
      g.fillRect(0, y, w, 2 + r() * 8);
    }
    g.fillStyle = 'rgba(226,212,188,0.16)'; g.fillRect(0, 0, w, h);
  } else if (o.kind === 'geo') {
    // broad overlapping planes and a few fine lines
    for (let i = 0; i < 6; i++) {
      g.fillStyle = css(p[1 + (i % (p.length - 1))], 0.55 + r() * 0.35);
      g.beginPath();
      const x = r() * w, y = r() * h;
      g.moveTo(x, y); g.lineTo(x + (r() - 0.3) * w * 0.7, y + (r() - 0.5) * h * 0.4);
      g.lineTo(x + (r() - 0.3) * w * 0.7, y + (r() + 0.2) * h * 0.6); g.lineTo(x - r() * w * 0.2, y + r() * h * 0.5);
      g.closePath(); g.fill();
    }
    g.strokeStyle = css(p[p.length - 1], 0.9); g.lineWidth = w * 0.006;
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(r() * w, 0); g.lineTo(r() * w, h); g.stroke();
    }
  } else {
    // berber: cream field, loose diamond lattice, striped ends
    g.strokeStyle = css(p[1], 0.85); g.lineWidth = w * 0.008;
    const st = w * 0.2;
    for (let x = -h; x < w + h; x += st) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke();
      g.beginPath(); g.moveTo(x + h, 0); g.lineTo(x, h); g.stroke();
    }
    g.fillStyle = css(p[2] ?? p[1], 0.9);
    [0.035, 0.07].forEach((f) => { g.fillRect(w * f, 0, w * 0.014, h); g.fillRect(w * (1 - f) - w * 0.014, 0, w * 0.014, h); });
  }
  grain(g, w, h, r, 20);
  const t = finish(c, false);
  return t;
}

function diamond(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry = rx) {
  g.beginPath(); g.moveTo(x, y - ry); g.lineTo(x + rx, y); g.lineTo(x, y + ry); g.lineTo(x - rx, y); g.closePath(); g.fill();
}

/* ------------------------------------------------------------------ art */

export const ART_GRID = 4;
export type ArtKind = 'warm' | 'graphic' | 'line';

/** a painting's colours: a light ground, a dark ink and the accents in between */
type Pal = { bg: RGB; ink: RGB; c: RGB[] };
type Gen = (g: CanvasRenderingContext2D, s: number, r: Rng, p: Pal) => void;
const lum = (c: RGB) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const acc = (p: Pal, i: number) => p.c[((i % p.c.length) + p.c.length) % p.c.length];

function vgrad(g: CanvasRenderingContext2D, s: number, top: RGB, bot: RGB, y0 = 0, y1 = s) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, css(top)); gr.addColorStop(1, css(bot));
  g.fillStyle = gr; g.fillRect(0, y0, s, y1 - y0);
}

/** a filled skyline from x = 0 to s around height y: rolling hills, or jagged peaks */
function ridge(g: CanvasRenderingContext2D, s: number, y: number, amp: number, freq: number, r: Rng, col: RGB, jag = false) {
  const ph = r() * 6.28, ph2 = r() * 6.28;
  g.fillStyle = css(col);
  g.beginPath(); g.moveTo(0, s);
  for (let i = 0; i <= 32; i++) {
    const t = i / 32, x = t * s;
    const base = jag ? (Math.abs(((t * freq * 2 + ph) % 2) - 1) - 0.5) * 2 : Math.sin(t * freq * 6.28 + ph);
    g.lineTo(x, y + base * amp + Math.sin(t * freq * 17 + ph2) * amp * 0.18);
  }
  g.lineTo(s, s); g.closePath(); g.fill();
}

/** an organic closed shape around (cx, cy) */
function blob(g: CanvasRenderingContext2D, cx: number, cy: number, rad: number, r: Rng, n = 7) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = rad * (0.65 + r() * 0.6);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  g.beginPath();
  const mid = (i: number) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  const m0 = mid(n - 1);
  g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(i); g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  g.closePath(); g.fill();
}

function disc(g: CanvasRenderingContext2D, x: number, y: number, rad: number) {
  g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
}

const GENS: Gen[] = [
  // 0 · rolling landscape under a low sun
  (g, s, r, p) => {
    vgrad(g, s, shade(p.bg, 0.15), mix(p.bg, acc(p, 1), 0.35));
    g.fillStyle = css(shade(acc(p, 1), 0.2), 0.9); disc(g, s * (0.25 + r() * 0.5), s * (0.24 + r() * 0.1), s * 0.07);
    for (let b = 0; b < 4; b++) ridge(g, s, s * (0.48 + b * 0.11), s * (0.035 + r() * 0.03), 1 + r() * 1.5, r, shade(mix(acc(p, b), p.ink, b * 0.18), -b * 0.06));
  },
  // 1 · colour field: soft-edged stacked blocks
  (g, s, r, p) => {
    g.fillStyle = css(shade(acc(p, 2), -0.15)); g.fillRect(0, 0, s, s);
    const cut = s * (0.45 + r() * 0.12);
    g.fillStyle = css(acc(p, 0), 0.92); g.fillRect(s * 0.1, s * 0.08, s * 0.8, cut - s * 0.12);
    g.fillStyle = css(acc(p, 1), 0.9); g.fillRect(s * 0.1, cut, s * 0.8, s * 0.84 - cut);
    g.fillStyle = css(shade(p.bg, 0.1), 0.18); g.fillRect(s * 0.1, cut - s * 0.015, s * 0.8, s * 0.012);
  },
  // 2 · three arches, one in shadow
  (g, s, r, p) => {
    g.fillStyle = css(p.bg); g.fillRect(0, 0, s, s);
    const w = s * 0.22, gap = (s - w * 3) / 4, top = s * 0.3, bot = s * 0.82;
    for (let i = 0; i < 3; i++) {
      const x = gap + i * (w + gap);
      g.fillStyle = css(i === 1 ? shade(acc(p, 1), -0.25) : acc(p, i * 2));
      g.beginPath(); g.moveTo(x, bot); g.lineTo(x, top + w / 2); g.arc(x + w / 2, top + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, bot); g.closePath(); g.fill();
    }
    g.fillStyle = css(shade(acc(p, 3), -0.1)); g.fillRect(0, bot, s, s - bot);
  },
  // 3 · still life: a vase with branches on a ledge
  (g, s, r, p) => {
    vgrad(g, s, shade(p.bg, 0.05), shade(p.bg, -0.08));
    g.fillStyle = css(shade(acc(p, 3), -0.1)); g.fillRect(0, s * 0.74, s, s * 0.26);
    const cx = s * (0.4 + r() * 0.2), vb = s * 0.74, vh = s * 0.26, vw = s * 0.09;
    g.strokeStyle = css(shade(p.ink, -0.1), 0.9); g.lineWidth = s * 0.006; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const ex = cx + (r() - 0.5) * s * 0.55, ey = s * (0.1 + r() * 0.22);
      g.beginPath(); g.moveTo(cx, vb - vh + s * 0.01); g.quadraticCurveTo(cx + (ex - cx) * 0.2, ey + s * 0.2, ex, ey); g.stroke();
      g.fillStyle = css(acc(p, i), 0.85);
      for (let j = 0; j < 4; j++) {
        const t = 0.45 + j * 0.17, lx = cx + (ex - cx) * t, ly = vb - vh + (ey - (vb - vh)) * t;
        g.beginPath(); g.ellipse(lx + s * 0.02, ly, s * 0.022, s * 0.01, r() * 3, 0, Math.PI * 2); g.fill();
      }
    }
    g.fillStyle = css(acc(p, 1));
    g.beginPath(); g.moveTo(cx - vw * 0.35, vb - vh);
    g.bezierCurveTo(cx - vw * 0.3, vb - vh * 0.6, cx - vw * 1.3, vb - vh * 0.5, cx - vw * 0.8, vb);
    g.lineTo(cx + vw * 0.8, vb);
    g.bezierCurveTo(cx + vw * 1.3, vb - vh * 0.5, cx + vw * 0.3, vb - vh * 0.6, cx + vw * 0.35, vb - vh);
    g.closePath(); g.fill();
  },
  // 4 · mountains in layers of mist
  (g, s, r, p) => {
    vgrad(g, s, shade(acc(p, 2), 0.45), shade(p.bg, 0.1));
    for (let b = 0; b < 4; b++) {
      ridge(g, s, s * (0.35 + b * 0.14), s * (0.09 - b * 0.012), 1.2 + r() * 1.2, r, mix(shade(acc(p, 2), 0.3), p.ink, 0.2 + b * 0.22), true);
      g.fillStyle = css(shade(p.bg, 0.2), 0.22); g.fillRect(0, s * (0.42 + b * 0.14), s, s * 0.06);
    }
  },
  // 5 · seascape: horizon, clouds and a path of light on the water
  (g, s, r, p) => {
    const hz = s * (0.48 + r() * 0.12);
    vgrad(g, s, shade(acc(p, 2), 0.35), shade(p.bg, 0.15), 0, hz);
    vgrad(g, s, mix(acc(p, 2), p.ink, 0.25), shade(acc(p, 2), -0.3), hz, s);
    g.fillStyle = 'rgba(255,255,255,0.45)';
    for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(s * r(), s * (0.12 + r() * 0.25), s * (0.1 + r() * 0.12), s * 0.025, 0, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = css(shade(p.bg, 0.3), 0.7); g.lineWidth = s * 0.008;
    const sx = s * (0.3 + r() * 0.4);
    // broken glints on the water, widening and scattering towards the viewer
    for (let i = 0; i < 14; i++) { const y = hz + s * 0.015 + Math.pow(i / 14, 1.4) * (s - hz) * 0.9, w = s * (0.02 + r() * 0.07) * (0.5 + i / 14), cx = sx + (r() - 0.5) * s * (0.03 + i * 0.006); g.lineWidth = s * (0.004 + r() * 0.006); g.beginPath(); g.moveTo(cx - w / 2, y); g.lineTo(cx + w / 2, y); g.stroke(); }
  },
  // 6 · paper cut-outs
  (g, s, r, p) => {
    g.fillStyle = css(shade(p.bg, 0.05)); g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6; i++) { g.fillStyle = css(acc(p, i), 0.92); blob(g, s * (0.15 + r() * 0.7), s * (0.15 + r() * 0.7), s * (0.08 + r() * 0.12), r); }
  },
  // 7 · a Bauhaus grid of circles and quarter circles
  (g, s, r, p) => {
    g.fillStyle = css(p.bg); g.fillRect(0, 0, s, s);
    const n = 3, c = s / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = i * c, y = j * c, t = r();
      if (t < 0.3) { g.fillStyle = css(acc(p, i + j)); g.fillRect(x, y, c, c); }
      g.fillStyle = css(t < 0.3 ? p.bg : acc(p, i + j * 2 + 1));
      const k = (r() * 4) | 0, ox = k & 1 ? x + c : x, oy = k & 2 ? y + c : y;
      if (r() < 0.5) { g.beginPath(); g.moveTo(ox, oy); g.arc(ox, oy, c, (k * Math.PI) / 2, (k * Math.PI) / 2 + Math.PI / 2); g.closePath(); g.fill(); }
      else disc(g, x + c / 2, y + c / 2, c * 0.36);
    }
  },
  // 8 · gestural brush strokes
  (g, s, r, p) => {
    g.fillStyle = css(shade(p.bg, 0.08)); g.fillRect(0, 0, s, s);
    g.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = css(acc(p, i), 0.85); g.lineWidth = s * (0.05 + r() * 0.07);
      g.beginPath(); g.moveTo(s * r(), s * (0.15 + r() * 0.7));
      g.bezierCurveTo(s * r(), s * r(), s * r(), s * r(), s * r(), s * (0.15 + r() * 0.7)); g.stroke();
    }
    g.strokeStyle = css(p.ink, 0.9); g.lineWidth = s * 0.006;
    g.beginPath(); g.moveTo(s * 0.1, s * (0.3 + r() * 0.4)); g.quadraticCurveTo(s * 0.5, s * r(), s * 0.9, s * (0.3 + r() * 0.4)); g.stroke();
  },
  // 9 · desert dunes, lit from one side
  (g, s, r, p) => {
    vgrad(g, s, shade(acc(p, 0), 0.4), shade(acc(p, 0), 0.15), 0, s * 0.4);
    for (let i = 0; i < 5; i++) {
      const y = s * (0.32 + i * 0.13), x0 = s * r();
      g.fillStyle = css(shade(acc(p, 1), 0.15 - i * 0.07));
      g.beginPath(); g.moveTo(0, y + s * 0.05); g.quadraticCurveTo(x0, y - s * 0.12, s, y + s * 0.03); g.lineTo(s, s); g.lineTo(0, s); g.closePath(); g.fill();
      g.fillStyle = css(shade(acc(p, 1), -0.22 - i * 0.05), 0.55);
      g.beginPath(); g.moveTo(x0, y - s * 0.035); g.quadraticCurveTo(x0 + s * 0.2, y, s, y + s * 0.03); g.lineTo(s, y + s * 0.09); g.quadraticCurveTo(x0 + s * 0.25, y + s * 0.05, x0, y - s * 0.035); g.fill();
    }
  },
  // 10 · a lone tree on a hill
  (g, s, r, p) => {
    vgrad(g, s, shade(p.bg, 0.2), mix(p.bg, acc(p, 0), 0.4));
    g.fillStyle = css(shade(acc(p, 2), -0.1)); g.beginPath(); g.ellipse(s * 0.5, s * 1.05, s * 0.75, s * 0.33, 0, 0, Math.PI * 2); g.fill();
    const tx = s * (0.35 + r() * 0.3), ty = s * 0.74;
    g.fillStyle = css(shade(p.ink, -0.2)); g.fillRect(tx - s * 0.012, ty - s * 0.2, s * 0.024, s * 0.2);
    for (let i = 0; i < 7; i++) { g.fillStyle = css(shade(acc(p, 2), -0.25 - r() * 0.15)); disc(g, tx + (r() - 0.5) * s * 0.2, ty - s * (0.23 + r() * 0.13), s * (0.06 + r() * 0.04)); }
  },
  // 11 · moonrise over still water
  (g, s, r, p) => {
    vgrad(g, s, shade(p.ink, -0.35), mix(p.ink, acc(p, 2), 0.5));
    const mx = s * (0.3 + r() * 0.4), my = s * (0.3 + r() * 0.12);
    g.fillStyle = css(shade(p.bg, 0.15)); disc(g, mx, my, s * 0.11);
    ridge(g, s, s * 0.66, s * 0.03, 1.3, r, shade(p.ink, -0.45));
    g.fillStyle = css(shade(p.ink, -0.25)); g.fillRect(0, s * 0.7, s, s * 0.3);
    g.strokeStyle = css(shade(p.bg, 0.1), 0.5); g.lineWidth = s * 0.006;
    for (let i = 0; i < 10; i++) { const y = s * (0.72 + Math.pow(i / 10, 1.3) * 0.26), w = s * (0.02 + r() * 0.08), cx = mx + (r() - 0.5) * s * (0.02 + i * 0.008); g.lineWidth = s * (0.003 + r() * 0.005); g.beginPath(); g.moveTo(cx - w / 2, y); g.lineTo(cx + w / 2, y); g.stroke(); }
  },
  // 12 · a botanical study in ink over a soft wash
  (g, s, r, p) => {
    g.fillStyle = css(shade(p.bg, 0.4)); g.fillRect(0, 0, s, s);
    g.fillStyle = css(acc(p, 1), 0.55); g.beginPath(); g.ellipse(s * (0.4 + r() * 0.2), s * 0.5, s * 0.24, s * 0.3, r() * 3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = css(shade(p.ink, -0.45), 0.85); g.lineWidth = s * 0.007; g.lineCap = 'round';
    const bx = s * 0.5, by = s * 0.88;
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + s * 0.06, s * 0.5, bx - s * 0.02, s * 0.14); g.stroke();
    for (let l = 0; l < 8; l++) {
      const ty = s * (0.78 - l * 0.08), side = l % 2 ? 1 : -1, len = s * (0.12 + r() * 0.1);
      g.beginPath(); g.moveTo(bx + s * 0.01, ty);
      g.quadraticCurveTo(bx + side * len * 0.6, ty - len * 0.7, bx + side * len, ty - len * 0.25);
      g.quadraticCurveTo(bx + side * len * 0.5, ty + len * 0.1, bx + s * 0.01, ty); g.stroke();
    }
  },
  // 13 · woven stripes, like a textile hanging
  (g, s, r, p) => {
    let x = 0, i = 0;
    while (x < s) { const w = s * (0.02 + r() * 0.1); g.fillStyle = css(i % 3 === 2 ? p.bg : acc(p, i)); g.fillRect(x, 0, w + 1, s); x += w; i++; }
    g.fillStyle = css(p.ink, 0.12);
    for (let y = 0; y < s; y += 3) g.fillRect(0, y, s, 1);
  },
  // 14 · contour lines, like a survey map
  (g, s, r, p) => {
    g.fillStyle = css(shade(p.bg, 0.1)); g.fillRect(0, 0, s, s);
    for (let c = 0; c < 2; c++) {
      const cx = s * (0.25 + r() * 0.5), cy = s * (0.25 + r() * 0.5);
      g.strokeStyle = css(acc(p, c), 0.8); g.lineWidth = s * 0.005;
      const rr = rng((r() * 1e6) | 0);
      for (let k = 1; k < 11; k++) {
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
          const a = (i / 40) * Math.PI * 2, rad = k * s * 0.045 * (1 + Math.sin(a * 3 + c) * 0.12 + Math.sin(a * 5 + k * 0.3) * 0.06 + (rr() - 0.5) * 0.02);
          const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
    }
  },
  // 15 · one bold form and a fine line
  (g, s, r, p) => {
    g.fillStyle = css(shade(p.bg, 0.06)); g.fillRect(0, 0, s, s);
    const cx = s * (0.35 + r() * 0.3), cy = s * (0.42 + r() * 0.15), rad = s * (0.2 + r() * 0.08);
    g.fillStyle = css(acc(p, 0));
    g.beginPath(); g.arc(cx, cy, rad, Math.PI, 0); g.closePath(); g.fill();
    g.fillStyle = css(acc(p, 1)); g.beginPath(); g.arc(cx, cy + s * 0.02, rad, 0, Math.PI); g.closePath(); g.fill();
    g.strokeStyle = css(p.ink); g.lineWidth = s * 0.005;
    g.beginPath(); g.moveTo(s * 0.12, s * 0.86); g.lineTo(s * 0.88, s * 0.86); g.stroke();
    g.fillStyle = css(p.ink); disc(g, s * (0.15 + r() * 0.7), s * 0.18, s * 0.018);
  },
];

/** which composition fills each of the sixteen cells — a different order per style */
const ORDER: Record<ArtKind, number[]> = {
  warm: [0, 3, 1, 9, 2, 5, 10, 8, 4, 11, 6, 15, 12, 13, 7, 14],
  graphic: [7, 15, 6, 1, 13, 14, 8, 2, 11, 9, 3, 0, 5, 4, 10, 12],
  line: [12, 0, 14, 6, 15, 10, 4, 1, 2, 3, 9, 5, 8, 11, 13, 7],
};

/**
 * Sixteen different paintings in one texture, so all the art in the home is a single draw
 * call. Each cell is a different composition; `artFinish` then gives them a surface.
 */
export function artAtlas(kind: ArtKind, pal: string[], seed: number, size: number) {
  const [c, g] = canvas(size);
  const cell = size / ART_GRID;
  const cols = pal.map(hex).sort((a, b) => lum(b) - lum(a));
  const p: Pal = { bg: cols[0], ink: cols[cols.length - 1], c: cols.slice(1, -1).length ? cols.slice(1, -1) : cols };
  for (let n = 0; n < ART_GRID * ART_GRID; n++) {
    const r = rng(seed + n * 977);
    const x = (n % ART_GRID) * cell, y = ((n / ART_GRID) | 0) * cell;
    // rotate the accents so neighbouring paintings lead with different colours
    const pn: Pal = { ...p, c: p.c.map((_, i) => p.c[(i + n) % p.c.length]) };
    g.save();
    g.beginPath(); g.rect(x, y, cell, cell); g.clip();
    g.translate(x, y);
    g.globalAlpha = 1; g.lineCap = 'butt';
    GENS[ORDER[kind][n]](g, cell, r, pn);
    g.restore();
  }
  const img = g.getImageData(0, 0, size, size);
  artFinish(img.data, size, kind, seed);
  g.putImageData(img, 0, 0);
  return finish(c, false);
}

/**
 * The surface of the work: oil paintings get dragged brushwork and canvas weave, prints get a
 * fine paper grain. Works on raw RGBA so it runs the same wherever the pixels came from.
 */
export function artFinish(d: Uint8ClampedArray, size: number, kind: ArtKind, seed: number) {
  const r = rng(seed + 5);
  if (kind === 'warm') {
    const src = new Uint8ClampedArray(d);
    const N = 128, dir = field(N, 6, 3, seed + 11), bristle = field(N, 16, 2, seed + 12);
    const L = Math.max(1, size / 700);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      // the local stroke direction: a slight drag of paint along it, and bristle marks running with it
      const a = at(dir, N, x / size, y / size) * Math.PI * 4;
      const ca = Math.cos(a), sa = Math.sin(a);
      let R = 0, G = 0, B = 0;
      for (let k = -1; k <= 1; k++) {
        const sx = Math.min(size - 1, Math.max(0, Math.round(x + ca * L * k))), sy = Math.min(size - 1, Math.max(0, Math.round(y + sa * L * k)));
        const j = (sy * size + sx) * 4;
        R += src[j]; G += src[j + 1]; B += src[j + 2];
      }
      const q = (x * ca + y * sa) / size, p = (y * ca - x * sa) / size;
      const br = 1 + (at(bristle, N, q * 3, p * 40) - 0.5) * 0.16;
      const i = (y * size + x) * 4;
      // canvas weave, then the faint warm cast of old varnish
      const weave = ((x % 3) === 0 ? -4 : 2) + ((y % 3) === 0 ? -4 : 2) + (r() - 0.5) * 6;
      d[i] = (R / 3) * br + weave + 3; d[i + 1] = (G / 3) * br + weave + 1; d[i + 2] = (B / 3) * br + weave - 3;
    }
  } else {
    const amt = kind === 'graphic' ? 7 : 10;
    for (let i = 0; i < d.length; i += 4) {
      const n = (r() - 0.5) * amt;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
  }
}

/* ------------------------------------------------------------------ light helpers */

/** soft round falloff used for lamp pools and halos */
export function glowTex(size = 128) {
  const [c, g] = canvas(size);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.6, 'rgba(255,255,255,0.14)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return finish(c, false);
}

export type AoRect = { x0: number; z0: number; x1: number; z1: number; dark: number; soft: number };
/**
 * Contact shadows: every wall and furniture footprint is drawn dark and feathered onto one
 * texture that is multiplied over the whole floor (and, walls only, over the ceiling).
 */
export function aoTex(rects: AoRect[], bounds: [number, number, number, number], size: number) {
  const [bx0, bz0, bx1, bz1] = bounds;
  const sx = size / (bx1 - bx0), sz = size / (bz1 - bz0);
  const [c, g] = canvas(size);
  g.fillStyle = '#fff'; g.fillRect(0, 0, size, size);
  // shapes are drawn far off-canvas so only their feathered shadow lands on it
  const OFF = size * 3;
  for (const q of rects) {
    g.shadowColor = `rgba(18,12,6,${q.dark})`;
    g.shadowBlur = q.soft * (sx + sz) * 0.5;
    g.shadowOffsetX = OFF;
    g.fillStyle = '#000';
    g.fillRect((q.x0 - bx0) * sx - OFF, (q.z0 - bz0) * sz, (q.x1 - q.x0) * sx, (q.z1 - q.z0) * sz);
  }
  const t = finish(c, false);
  t.anisotropy = 1;
  return t;
}

/* ------------------------------------------------------------------ Indian surfaces */

/**
 * Black galaxy granite, quarried at Chimakurthi in Prakasam district — the stone Ongole is known
 * for. Near-black with fine bronze and silver flecks that catch the light.
 */
export function graniteTex(o: { size: number; base: string; flecks: string[]; seed: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const S = o.size;
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  // soft mottling in the body of the stone
  const N = 64, f = field(N, 8, 3, o.seed + 1);
  const img = g.getImageData(0, 0, S, S), d = img.data, b = hex(o.base);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = (at(f, N, x / S, y / S) - 0.5) * 26, i = (y * S + x) * 4;
    d[i] = b[0] + v; d[i + 1] = b[1] + v; d[i + 2] = b[2] + v * 1.1;
  }
  g.putImageData(img, 0, 0);
  const fl = o.flecks.map(hex);
  const n = (S * S) / 26;
  for (let i = 0; i < n; i++) {
    const col = fl[(r() * fl.length) | 0];
    const rad = r() < 0.92 ? 0.45 + r() * 0.9 : 1.2 + r() * 1.8;
    g.fillStyle = css(col, 0.45 + r() * 0.55);
    g.beginPath(); g.ellipse(r() * S, r() * S, rad, rad * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2); g.fill();
  }
  return finish(c);
}

/** hand block-printed cotton: small repeating buttis on a ground, with the slight misprint of a hand stamp */
export function printTex(o: { size: number; base: string; ink: string[]; seed: number; motif: 'butti' | 'jaal' }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const S = o.size, ink = o.ink.map(hex);
  g.fillStyle = o.base; g.fillRect(0, 0, S, S);
  const n = 6, st = S / n;
  const flower = (x: number, y: number, s: number, col: RGB, a: number) => {
    g.fillStyle = css(col, a);
    for (let k = 0; k < 6; k++) {
      const ang = (k / 6) * Math.PI * 2;
      g.beginPath(); g.ellipse(x + Math.cos(ang) * s * 0.55, y + Math.sin(ang) * s * 0.55, s * 0.42, s * 0.24, ang, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = css(ink[(ink.length - 1)], a); g.beginPath(); g.arc(x, y, s * 0.24, 0, Math.PI * 2); g.fill();
  };
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = (i + (j % 2 ? 0.5 : 0)) * st + (r() - 0.5) * 1.5, y = (j + 0.5) * st + (r() - 0.5) * 1.5;
    const a = 0.75 + r() * 0.2;
    if (o.motif === 'jaal') {
      g.strokeStyle = css(ink[1 % ink.length], 0.55); g.lineWidth = S / 260;
      g.beginPath(); g.moveTo(x - st / 2, y); g.quadraticCurveTo(x, y - st * 0.45, x + st / 2, y); g.quadraticCurveTo(x, y + st * 0.45, x - st / 2, y); g.stroke();
    }
    // a paisley-like leaf either side of each flower
    g.fillStyle = css(ink[1 % ink.length], a * 0.8);
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(x + sx * st * 0.2, y + st * 0.12, st * 0.09, st * 0.04, sx * 0.7, 0, Math.PI * 2); g.fill(); }
    flower(x, y, st * 0.17, ink[0], a);
  }
  // wrap the tile seamlessly by redrawing across the edge
  g.drawImage(c, S, 0); g.drawImage(c, 0, S);
  grain(g, S, S, r, 10);
  return finish(c);
}

/**
 * Kalamkari — the hand-painted cotton of Srikalahasti and Machilipatnam in Andhra: a tree of life
 * in madder red, indigo, mustard and black outline on unbleached cloth, inside patterned borders.
 */
export function kalamkariTex(size: number, seed: number) {
  const W = size, Hh = Math.round(size * 0.66);
  const [c, g] = canvas(W, Hh);
  const r = rng(seed);
  const cloth: RGB = [233, 214, 178], red: RGB = [150, 46, 32], ind: RGB = [40, 52, 86], mus: RGB = [199, 146, 46], blk: RGB = [32, 22, 18], grn: RGB = [72, 96, 62];
  g.fillStyle = css(cloth); g.fillRect(0, 0, W, Hh);
  const B = W * 0.06;
  // borders: red band with a running vine, then a black rule
  g.fillStyle = css(red); g.fillRect(0, 0, W, B); g.fillRect(0, Hh - B, W, B); g.fillRect(0, 0, B, Hh); g.fillRect(W - B, 0, B, Hh);
  g.strokeStyle = css(mus); g.lineWidth = W / 300;
  for (let x = B * 0.5; x < W; x += B * 0.8) for (const y of [B / 2, Hh - B / 2]) { g.beginPath(); g.arc(x, y, B * 0.26, 0, Math.PI * 2); g.stroke(); g.fillStyle = css(cloth); g.beginPath(); g.arc(x, y, B * 0.1, 0, Math.PI * 2); g.fill(); }
  for (let y = B * 1.3; y < Hh - B; y += B * 0.8) for (const x of [B / 2, W - B / 2]) { g.beginPath(); g.arc(x, y, B * 0.26, 0, Math.PI * 2); g.stroke(); }
  g.strokeStyle = css(blk); g.lineWidth = W / 220; g.strokeRect(B, B, W - 2 * B, Hh - 2 * B);
  // trunk rising from a mound, branching into curling boughs
  const cx = W / 2, base = Hh - B * 1.6, top = B * 1.8;
  g.fillStyle = css(grn); g.beginPath(); g.ellipse(cx, base + B * 0.3, W * 0.16, B * 0.55, 0, Math.PI, 0); g.fill();
  const bough = (x0: number, y0: number, ang: number, len: number, w: number, depth: number) => {
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const mx = (x0 + x1) / 2 + Math.cos(ang + 1.57) * len * 0.18, my = (y0 + y1) / 2 + Math.sin(ang + 1.57) * len * 0.18;
    g.strokeStyle = css(blk); g.lineWidth = w + W / 400; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    g.strokeStyle = css(red); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
    if (depth <= 0) {
      // a lotus bloom or a paisley at the tip
      const s = len * 0.42;
      if (r() < 0.55) {
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + (k - 3) * 0.32;
          g.fillStyle = css(k % 2 ? red : mus); g.strokeStyle = css(blk); g.lineWidth = W / 600;
          g.beginPath(); g.ellipse(x1 + Math.cos(a) * s * 0.5, y1 + Math.sin(a) * s * 0.5, s * 0.5, s * 0.17, a, 0, Math.PI * 2); g.fill(); g.stroke();
        }
      } else {
        g.fillStyle = css(r() < 0.5 ? ind : grn); g.strokeStyle = css(blk); g.lineWidth = W / 600;
        g.beginPath(); g.ellipse(x1, y1, s * 0.5, s * 0.28, ang, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = css(mus); g.beginPath(); g.arc(x1, y1, s * 0.12, 0, Math.PI * 2); g.fill();
      }
      return;
    }
    const n = depth > 1 ? 2 : 3;
    for (let i = 0; i < n; i++) bough(x1, y1, ang + (i - (n - 1) / 2) * 0.75 + (r() - 0.5) * 0.3, len * 0.66, w * 0.62, depth - 1);
  };
  bough(cx, base, -Math.PI / 2, (base - top) * 0.42, W * 0.022, 3);
  // leaves scattered along the boughs
  for (let i = 0; i < 70; i++) {
    const x = cx + (r() - 0.5) * W * 0.62, y = top + r() * (base - top) * 0.75;
    g.fillStyle = css(r() < 0.5 ? grn : ind, 0.9); g.strokeStyle = css(blk); g.lineWidth = W / 900;
    g.beginPath(); g.ellipse(x, y, W * 0.012, W * 0.005, r() * 3, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  // two birds facing the tree
  for (const sx of [-1, 1]) {
    const bx = cx + sx * W * 0.25, by = base - B * 0.4;
    g.fillStyle = css(ind); g.strokeStyle = css(blk); g.lineWidth = W / 500;
    g.beginPath(); g.ellipse(bx, by, W * 0.04, W * 0.022, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(bx - sx * W * 0.038, by - W * 0.022, W * 0.013, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = css(mus); g.beginPath(); g.moveTo(bx - sx * W * 0.05, by - W * 0.024); g.lineTo(bx - sx * W * 0.065, by - W * 0.018); g.lineTo(bx - sx * W * 0.05, by - W * 0.016); g.fill();
    g.fillStyle = css(red); g.beginPath(); g.moveTo(bx + sx * W * 0.03, by); g.quadraticCurveTo(bx + sx * W * 0.08, by - W * 0.04, bx + sx * W * 0.09, by + W * 0.01); g.closePath(); g.fill(); g.stroke();
  }
  // vegetable-dyed cloth is never even
  const img = g.getImageData(0, 0, W, Hh), d = img.data;
  const N = 64, fl = field(N, 5, 3, seed + 3);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, v = (at(fl, N, x / W, y / Hh) - 0.5) * 22 + (r() - 0.5) * 12;
    d[i] += v; d[i + 1] += v * 0.9; d[i + 2] += v * 0.7;
  }
  g.putImageData(img, 0, 0);
  return finish(c, false);
}

/** a kolam / rangoli at the threshold: concentric petals in festival colours on a rice-flour outline */
export function rangoliTex(size: number, seed: number) {
  const [c, g] = canvas(size);
  const r = rng(seed);
  const C = size / 2;
  g.clearRect(0, 0, size, size);
  const cols = ['#e8452c', '#f6b21b', '#1f8f5f', '#d6337b', '#2b6cc4', '#ff7a1a'];
  const ring = (rad: number, n: number, len: number, wid: number, col: string, off = 0) => {
    g.fillStyle = col;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + off;
      g.beginPath(); g.ellipse(C + Math.cos(a) * rad, C + Math.sin(a) * rad, len, wid, a, 0, Math.PI * 2); g.fill();
    }
  };
  g.fillStyle = 'rgba(250,246,236,0.95)'; g.beginPath(); g.arc(C, C, C * 0.96, 0, Math.PI * 2); g.fill();
  g.fillStyle = cols[4]; g.beginPath(); g.arc(C, C, C * 0.9, 0, Math.PI * 2); g.fill();
  ring(C * 0.78, 16, C * 0.14, C * 0.07, cols[1]);
  ring(C * 0.78, 16, C * 0.07, C * 0.035, cols[0]);
  g.fillStyle = cols[2]; g.beginPath(); g.arc(C, C, C * 0.6, 0, Math.PI * 2); g.fill();
  ring(C * 0.45, 12, C * 0.15, C * 0.065, cols[3], 0.26);
  ring(C * 0.45, 12, C * 0.08, C * 0.03, cols[1], 0.26);
  g.fillStyle = cols[5]; g.beginPath(); g.arc(C, C, C * 0.25, 0, Math.PI * 2); g.fill();
  ring(C * 0.16, 8, C * 0.07, C * 0.03, cols[1]);
  g.fillStyle = cols[0]; g.beginPath(); g.arc(C, C, C * 0.07, 0, Math.PI * 2); g.fill();
  // the white rice-flour dots and outline of the kolam
  g.fillStyle = 'rgba(255,253,246,0.95)';
  for (const [rad, n] of [[0.9, 48], [0.6, 32], [0.25, 16]]) for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    g.beginPath(); g.arc(C + Math.cos(a) * C * rad, C + Math.sin(a) * C * rad, size / 220, 0, Math.PI * 2); g.fill();
  }
  // powder is grainy at the edges
  const img = g.getImageData(0, 0, size, size), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (r() - 0.5) * 40; d[i] += n; d[i + 1] += n; d[i + 2] += n;
    if (r() < 0.04) d[i + 3] = 0;
  }
  g.putImageData(img, 0, 0);
  return finish(c, false);
}
