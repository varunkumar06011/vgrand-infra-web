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

function blotches(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng, cols: RGB[], n: number, alpha: number) {
  for (let i = 0; i < n; i++) {
    const cx = x + r() * w, cy = y + r() * h, rad = (0.15 + r() * 0.45) * Math.max(w, h);
    const col = cols[(r() * cols.length) | 0];
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    gr.addColorStop(0, css(col, alpha * (0.5 + r() * 0.5)));
    gr.addColorStop(1, css(col, 0));
    g.fillStyle = gr;
    g.fillRect(x, y, w, h);
  }
}

function veins(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: Rng, cols: RGB[], n: number, strength: number) {
  for (let i = 0; i < n; i++) {
    const col = cols[(r() * cols.length) | 0];
    let px = x + r() * w, py = y + r() * h;
    let ang = r() * Math.PI * 2;
    const steps = 14 + ((r() * 18) | 0);
    const step = Math.max(w, h) / 14;
    g.beginPath();
    g.moveTo(px, py);
    for (let s = 0; s < steps; s++) {
      ang += (r() - 0.5) * 0.9;
      px += Math.cos(ang) * step; py += Math.sin(ang) * step;
      g.lineTo(px, py);
    }
    const a = strength * (0.25 + r() * 0.75);
    g.strokeStyle = css(col, a);
    g.shadowColor = css(col, a);
    g.shadowBlur = 2 + r() * 10;
    g.lineWidth = 0.6 + r() * 2.2;
    g.lineJoin = 'round';
    g.stroke();
  }
  g.shadowBlur = 0;
}

/** polished stone / vitrified tile: n × n different tiles so the veining never visibly repeats */
export function tileTex(o: { size: number; n: number; base: string; veins: string[]; grout: string; vein: number; cloud: number; seed: number; groutW?: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base), vs = o.veins.map(hex);
  const cell = o.size / o.n;
  for (let j = 0; j < o.n; j++) for (let i = 0; i < o.n; i++) {
    const x = i * cell, y = j * cell;
    g.save();
    g.beginPath(); g.rect(x, y, cell, cell); g.clip();
    g.fillStyle = css(shade(base, (r() - 0.5) * 0.05));
    g.fillRect(x, y, cell, cell);
    blotches(g, x, y, cell, cell, r, [shade(base, 0.22), shade(base, -0.08), ...vs], 7, o.cloud);
    veins(g, x, y, cell, cell, r, vs, 5, o.vein);
    g.restore();
  }
  grain(g, o.size, o.size, r, 5);
  const gw = o.groutW ?? Math.max(1.5, o.size / 420);
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
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base), vs = o.veins.map(hex);
  g.fillStyle = o.base; g.fillRect(0, 0, o.size, o.size);
  blotches(g, 0, 0, o.size, o.size, r, [shade(base, 0.2), shade(base, -0.06)], 10, 0.2);
  veins(g, 0, 0, o.size, o.size, r, vs, 9, o.vein);
  grain(g, o.size, o.size, r, 6);
  return finish(c);
}

/** timber: boards run up the canvas (along V) */
export function woodTex(o: { size: number; cols: number; base: string; dark: string; variance: number; gap: number; joints: boolean; seed: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base), dark = hex(o.dark);
  const bw = o.size / o.cols;
  for (let i = 0; i < o.cols; i++) {
    const x = i * bw;
    const segs = o.joints ? 2 : 1;
    const cut = o.joints ? r() * o.size : 0;
    for (let s = 0; s < segs; s++) {
      const tone = shade(mix(base, dark, r() * o.variance), (r() - 0.5) * o.variance * 0.5);
      const y0 = s === 0 ? 0 : cut, y1 = s === 0 ? (o.joints ? cut : o.size) : o.size;
      g.fillStyle = css(tone);
      g.fillRect(x, y0, bw, y1 - y0);
      g.save();
      g.beginPath(); g.rect(x, y0, bw, y1 - y0); g.clip();
      // long grain lines with a slow wander
      const lines = Math.round(bw / 2.2);
      for (let k = 0; k < lines; k++) {
        const gx = x + r() * bw;
        const wob = 1 + r() * 4, ph = r() * 6.28, f = (1 + r() * 2) * (6.28 / o.size);
        g.beginPath();
        for (let y = y0; y <= y1; y += 8) {
          const xx = gx + Math.sin(y * f + ph) * wob;
          if (y === y0) g.moveTo(xx, y); else g.lineTo(xx, y);
        }
        g.strokeStyle = css(r() < 0.75 ? dark : shade(base, 0.25), 0.05 + r() * 0.16);
        g.lineWidth = 0.5 + r() * 1.3;
        g.stroke();
      }
      if (r() < 0.3) {
        const kx = x + bw * (0.25 + r() * 0.5), ky = y0 + r() * (y1 - y0), kr = 2 + r() * bw * 0.1;
        const gr = g.createRadialGradient(kx, ky, 0, kx, ky, kr * 3);
        gr.addColorStop(0, css(dark, 0.55)); gr.addColorStop(1, css(dark, 0));
        g.fillStyle = gr; g.fillRect(kx - kr * 3, ky - kr * 3, kr * 6, kr * 6);
      }
      g.restore();
    }
    if (o.joints) { g.fillStyle = css(shade(dark, -0.35), 0.7); g.fillRect(x, cut - 0.75, bw, 1.5); }
    if (o.gap > 0) { g.fillStyle = css(shade(dark, -0.45), 0.85); g.fillRect(x - o.gap / 2, 0, o.gap, o.size); }
  }
  grain(g, o.size, o.size, r, 7);
  return finish(c);
}

/** woven cloth — sofas, bedding, curtains */
export function fabricTex(o: { size: number; base: string; contrast: number; scale: number; seed: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base);
  g.fillStyle = o.base; g.fillRect(0, 0, o.size, o.size);
  const img = g.getImageData(0, 0, o.size, o.size);
  const d = img.data, s = o.scale;
  for (let y = 0; y < o.size; y++) for (let x = 0; x < o.size; x++) {
    const warp = ((x / s) | 0) % 2, weft = ((y / s) | 0) % 2;
    const k = ((warp ^ weft ? 0.5 : -0.5) + (r() - 0.5) * 1.6) * o.contrast;
    const i = (y * o.size + x) * 4;
    d[i] = base[0] + k; d[i + 1] = base[1] + k; d[i + 2] = base[2] + k; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return finish(c);
}

/** hand-finished plaster: nearly flat, never perfectly flat */
export function plasterTex(o: { size: number; base: string; seed: number }) {
  const [c, g] = canvas(o.size);
  const r = rng(o.seed);
  const base = hex(o.base);
  g.fillStyle = o.base; g.fillRect(0, 0, o.size, o.size);
  blotches(g, 0, 0, o.size, o.size, r, [shade(base, 0.12), shade(base, -0.05)], 14, 0.1);
  grain(g, o.size, o.size, r, 6);
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
/** sixteen different paintings in one texture, so all the art in the home is a single draw call */
export function artAtlas(kind: ArtKind, pal: string[], seed: number, size: number) {
  const [c, g] = canvas(size);
  const cell = size / ART_GRID;
  const p = pal.map(hex);
  for (let n = 0; n < ART_GRID * ART_GRID; n++) {
    const r = rng(seed + n * 977);
    const x = (n % ART_GRID) * cell, y = ((n / ART_GRID) | 0) * cell;
    g.save();
    g.beginPath(); g.rect(x, y, cell, cell); g.clip();
    g.translate(x, y);
    if (kind === 'warm') {
      const gr = g.createLinearGradient(0, 0, 0, cell);
      gr.addColorStop(0, css(shade(p[0], 0.25))); gr.addColorStop(1, css(p[0]));
      g.fillStyle = gr; g.fillRect(0, 0, cell, cell);
      // layered landscape bands
      let hy = cell * (0.3 + r() * 0.2);
      for (let b = 0; b < 5; b++) {
        g.fillStyle = css(p[1 + ((b + n) % (p.length - 1))], 0.82);
        g.beginPath(); g.moveTo(0, cell);
        g.lineTo(0, hy);
        for (let xx = 0; xx <= cell; xx += cell / 8) g.lineTo(xx, hy + Math.sin(xx * 0.03 + r() * 6) * cell * 0.04 + (r() - 0.5) * cell * 0.03);
        g.lineTo(cell, cell); g.closePath(); g.fill();
        hy += cell * (0.08 + r() * 0.1);
      }
      g.strokeStyle = 'rgba(214,178,104,0.9)'; g.lineWidth = cell * 0.008;
      g.beginPath(); g.arc(cell * (0.3 + r() * 0.4), cell * (0.22 + r() * 0.1), cell * (0.08 + r() * 0.06), 0, Math.PI * 2); g.stroke();
    } else if (kind === 'graphic') {
      g.fillStyle = '#f2f1ee'; g.fillRect(0, 0, cell, cell);
      const shapes = 3 + ((r() * 3) | 0);
      for (let s = 0; s < shapes; s++) {
        g.fillStyle = css(p[(r() * p.length) | 0]);
        const cx = cell * (0.2 + r() * 0.6), cy = cell * (0.2 + r() * 0.6), rad = cell * (0.1 + r() * 0.22);
        const t = r();
        if (t < 0.4) { g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.fill(); }
        else if (t < 0.7) { g.beginPath(); g.arc(cx, cy, rad, Math.PI * r() * 2, Math.PI * (r() * 2 + 1)); g.fill(); }
        else g.fillRect(cx - rad, cy - rad * 0.3, rad * 2, rad * (0.4 + r()));
      }
      g.strokeStyle = '#111'; g.lineWidth = cell * 0.008;
      g.beginPath(); g.moveTo(cell * 0.12, cell * (0.2 + r() * 0.6)); g.lineTo(cell * 0.88, cell * (0.2 + r() * 0.6)); g.stroke();
    } else {
      g.fillStyle = '#f7f4ee'; g.fillRect(0, 0, cell, cell);
      // soft shape + a botanical line drawing
      g.fillStyle = css(p[(n % (p.length - 1)) + 1], 0.75);
      g.beginPath(); g.ellipse(cell * (0.4 + r() * 0.2), cell * (0.45 + r() * 0.15), cell * 0.22, cell * 0.28, r() * 3, 0, Math.PI * 2); g.fill();
      g.strokeStyle = 'rgba(40,44,42,0.85)'; g.lineWidth = cell * 0.007; g.lineCap = 'round';
      const bx = cell * 0.5, by = cell * 0.86;
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + cell * 0.06, cell * 0.5, bx - cell * 0.02, cell * 0.16); g.stroke();
      for (let l = 0; l < 7; l++) {
        const ty = cell * (0.76 - l * 0.085), side = l % 2 ? 1 : -1, len = cell * (0.12 + r() * 0.1);
        g.beginPath(); g.moveTo(bx + cell * 0.01, ty);
        g.quadraticCurveTo(bx + side * len * 0.6, ty - len * 0.7, bx + side * len, ty - len * 0.25);
        g.quadraticCurveTo(bx + side * len * 0.5, ty + len * 0.1, bx + cell * 0.01, ty);
        g.stroke();
      }
    }
    g.restore();
  }
  const r0 = rng(seed);
  grain(g, size, size, r0, 9);
  const t = finish(c, false);
  return t;
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
