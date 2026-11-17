import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ALL_STYLES, SLOT_FLAGS, matSpec, type MatSpec, type StyleId, type TexSpec } from './styles';
import * as TX from './textures';

export type Quality = {
  /** laptop / desktop class device */
  hi: boolean;
  /** surface relief on fabric, timber and grout */
  bump: boolean;
  /** real-time reflections in the polished floor */
  mirror: boolean;
  shadow: number;
  lights: number;
};

export type Rect = [number, number, number, number];

/* ------------------------------------------------------------------ materials */

/** emissive strength of each glowing slot when the lights are fully on */
const GLOW: Record<string, [number, number]> = {
  // [daytime, night]
  bulb: [0.15, 3.2], shade: [0.02, 1.25], downlight: [0.05, 2.4], cove: [0.03, 1.9], diya: [0.9, 2.6],
};

export class Mats {
  style: StyleId;
  private mats = new Map<string, THREE.MeshStandardMaterial>();
  private tex = new Map<string, THREE.Texture>();
  private white: THREE.DataTexture;
  /** shared by every reflective floor material */
  readonly mirror = { tex: { value: null as THREE.Texture | null }, matrix: { value: new THREE.Matrix4() }, on: { value: 0 } };
  private refl = new Map<string, { value: number }>();

  constructor(style: StyleId, private q: Quality) {
    this.style = style;
    this.white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
    this.white.colorSpace = THREE.SRGBColorSpace;
    this.white.needsUpdate = true;
    this.mirror.tex.value = this.white;
  }

  private texture(spec: TexSpec, size: number | undefined): THREE.Texture {
    const key = JSON.stringify([spec, size ?? 0]);
    let t = this.tex.get(key);
    if (t) return t;
    const hi = this.q.hi;
    switch (spec.gen) {
      case 'tile': t = TX.tileTex({ ...spec, size: hi ? 1024 : 512 }); break;
      case 'slab': t = TX.slabTex({ ...spec, size: hi ? 512 : 256 }); break;
      case 'wood': t = TX.woodTex({ ...spec, size: spec.cols >= 6 ? (hi ? 1024 : 512) : hi ? 512 : 256 }); break;
      case 'fabric': t = TX.fabricTex({ ...spec, size: hi ? 256 : 128 }); break;
      case 'plaster': t = TX.plasterTex({ ...spec, size: 256 }); break;
      case 'grid': t = TX.gridTex({ ...spec, size: hi ? 512 : 256 }); break;
      case 'rug': t = TX.rugTex({ ...spec, size: hi ? 768 : 512 }); break;
      case 'art': t = TX.artAtlas(spec.kind, spec.pal, spec.seed, hi ? 1024 : 512); break;
    }
    if (size) t.repeat.set(1 / size, 1 / size);
    if (!this.q.hi) t.anisotropy = 4;
    this.tex.set(key, t);
    return t;
  }

  /** paint a style's textures ahead of time so the first switch to it is instant */
  warm(style: StyleId) {
    for (const slot of this.mats.keys()) {
      const s = matSpec(slot, style);
      if (s.tex) this.texture(s.tex, s.size);
    }
  }

  get(slot: string): THREE.MeshStandardMaterial {
    let m = this.mats.get(slot);
    if (m) return m;
    const f = SLOT_FLAGS[slot] ?? {};
    const any = (pick: (s: MatSpec) => unknown) => ALL_STYLES.some((st) => !!pick(matSpec(slot, st)));
    m = new THREE.MeshStandardMaterial();
    m.name = slot;
    m.userData.usesMap = any((s) => s.tex);
    m.userData.usesBump = this.q.bump && any((s) => s.tex && s.bump);
    if (f.double) m.side = THREE.DoubleSide;
    if (f.kind === 'glass' || f.kind === 'sheer') { m.transparent = true; m.depthWrite = false; m.side = THREE.DoubleSide; }
    if (f.kind === 'floor') {
      const refl = { value: 0 };
      this.refl.set(slot, refl);
      const mir = this.mirror;
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uReflTex = mir.tex;
        sh.uniforms.uReflMatrix = mir.matrix;
        sh.uniforms.uReflOn = mir.on;
        sh.uniforms.uRefl = refl;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nuniform mat4 uReflMatrix;\nvarying vec4 vReflUv;')
          .replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = uReflMatrix * modelMatrix * vec4( transformed, 1.0 );');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform sampler2D uReflTex;\nuniform float uReflOn;\nuniform float uRefl;\nvarying vec4 vReflUv;')
          .replace(
            '#include <opaque_fragment>',
            `{
              vec2 ruv = vReflUv.xy / max( vReflUv.w, 0.0001 );
              vec3 rcol = texture2D( uReflTex, ruv, 1.6 ).rgb * 0.6 + texture2D( uReflTex, ruv, 3.2 ).rgb * 0.4;
              float fres = 0.05 + 0.95 * pow( 1.0 - clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 ), 3.0 );
              outgoingLight += rcol * fres * uRefl * uReflOn;
            }
            #include <opaque_fragment>`,
          );
      };
      m.customProgramCacheKey = () => 'flat-floor';
    }
    this.mats.set(slot, m);
    this.skin(slot, m, this.style);
    return m;
  }

  private skin(slot: string, m: THREE.MeshStandardMaterial, style: StyleId) {
    const s = matSpec(slot, style);
    const f = SLOT_FLAGS[slot] ?? {};
    m.color.set(s.tex ? s.c ?? '#ffffff' : s.c ?? '#ffffff');
    m.roughness = s.r ?? 0.7;
    m.metalness = s.m ?? 0;
    m.envMapIntensity = s.env ?? 1;
    if (m.userData.usesMap) m.map = s.tex ? this.texture(s.tex, s.size) : this.white;
    if (m.userData.usesBump) {
      m.bumpMap = s.tex && s.bump ? this.texture(s.tex, s.size) : this.white;
      m.bumpScale = s.tex && s.bump ? s.bump : 0;
    }
    if (f.kind === 'glass' || f.kind === 'sheer') m.opacity = s.opacity ?? 0.3;
    if (f.kind === 'emit') m.emissive.set(s.e ?? '#ffd9a0');
    const refl = this.refl.get(slot);
    if (refl) refl.value = s.refl ?? 0;
  }

  apply(style: StyleId) {
    this.style = style;
    for (const [slot, m] of this.mats) this.skin(slot, m, style);
  }

  /** 0 = broad daylight, 1 = night with every lamp on */
  setLamp(f: number) {
    for (const [slot, m] of this.mats) {
      const g = GLOW[slot];
      if (g) m.emissiveIntensity = g[0] + (g[1] - g[0]) * f;
    }
  }

  dispose() {
    for (const t of this.tex.values()) t.dispose();
    for (const m of this.mats.values()) m.dispose();
    this.white.dispose();
  }
}

/* ------------------------------------------------------------------ geometry kit */

export type AddOpts = {
  rx?: number; ry?: number; rz?: number;
  /** corner radius → rounded box */
  r?: number;
  /** swap u/v so timber grain runs the other way */
  sw?: boolean;
  /** keep the primitive's own 0..1 UVs (rugs, art, round things) */
  keep?: boolean;
  seg?: number;
};

export type Fixture = {
  x: number; y: number; z: number;
  /** window = daylight spill · ceiling / lamp = come on at dusk · always = lit day and night */
  kind: 'window' | 'ceiling' | 'lamp' | 'always';
  power: number;
  color: number;
};

export type GlowSpot = { x: number; y: number; z: number; r: number; up: boolean; k: number };

type Batch = { slot: string; upper: boolean; style: StyleId | null; geos: THREE.BufferGeometry[] };

export type BuiltGroup = { group: THREE.Group; upper: boolean; style: StyleId | null };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _v = new THREE.Vector3();

/**
 * Collects thousands of small primitives and merges them into one mesh per material, so the
 * whole furnished home draws in a few dozen calls. Also records the 2D footprints used for
 * collision and for the baked contact shadows.
 */
export class Kit {
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()];
  private batches = new Map<string, Batch>();
  /** true while building things that are removed for the dollhouse view (ceiling, wall tops) */
  upper = false;
  /** set while building pieces that only exist in one style */
  only: StyleId | null = null;
  /** world-space AABBs [x0, z0, x1, z1] in metres that block walking */
  solids: Rect[] = [];
  ao: TX.AoRect[] = [];
  aoWalls: TX.AoRect[] = [];
  fixtures: Fixture[] = [];
  glows: GlowSpot[] = [];
  halos: { x: number; y: number; z: number }[] = [];
  tris = 0;

  private get top() { return this.stack[this.stack.length - 1]; }

  /** build inside a local frame: origin (x, z) on the floor, rotated ry about vertical */
  at(x: number, z: number, ry: number, fn: () => void, y = 0) {
    _e.set(0, ry, 0);
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e), _s);
    this.stack.push(this.top.clone().multiply(_m));
    try { fn(); } finally { this.stack.pop(); }
  }

  layer(upper: boolean, fn: () => void) {
    const prev = this.upper; this.upper = upper;
    try { fn(); } finally { this.upper = prev; }
  }

  forStyle(style: StyleId, fn: () => void) {
    const prev = this.only; this.only = style;
    try { fn(); } finally { this.only = prev; }
  }

  private push(slot: string, g: THREE.BufferGeometry, x: number, y: number, z: number, o: AddOpts) {
    _e.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0, 'YXZ');
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e), _s);
    const world = this.top.clone().multiply(_m);
    if (!o.keep) worldUV(g, world.elements[12], world.elements[13], world.elements[14], !!o.sw);
    g.applyMatrix4(world);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    // rounded boxes arrive without an index; merging needs every piece to have one
    if (!g.index) {
      const n = g.attributes.position.count;
      const idx = new Uint32Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    const key = `${slot}|${this.upper ? 1 : 0}|${this.only ?? ''}`;
    let b = this.batches.get(key);
    if (!b) { b = { slot, upper: this.upper, style: this.only, geos: [] }; this.batches.set(key, b); }
    b.geos.push(g);
  }

  /** box with its base centre at (x, y, z) */
  box(slot: string, w: number, h: number, d: number, x = 0, y = 0, z = 0, o: AddOpts = {}) {
    if (w <= 1e-4 || h <= 1e-4 || d <= 1e-4) return;
    const r = o.r ? Math.min(o.r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3) : 0;
    const g = r > 2e-3 ? new RoundedBoxGeometry(w, h, d, o.seg ?? 2, r) : new THREE.BoxGeometry(w, h, d);
    this.push(slot, g, x, y + h / 2, z, o);
  }

  /** upright cylinder / cone with its base centre at (x, y, z) */
  cyl(slot: string, rTop: number, rBot: number, h: number, x = 0, y = 0, z = 0, o: AddOpts & { open?: boolean } = {}) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, o.seg ?? 16, 1, !!o.open);
    this.push(slot, g, x, y + h / 2, z, { ...o, keep: true });
  }

  /** ellipsoid centred at (x, y, z) */
  ball(slot: string, rx: number, ry: number, rz: number, x = 0, y = 0, z = 0, o: AddOpts = {}) {
    const seg = o.seg ?? 10;
    const g = new THREE.SphereGeometry(1, seg, Math.max(6, Math.round(seg * 0.7)));
    g.scale(rx, ry, rz);
    this.push(slot, g, x, y, z, { ...o, keep: true });
  }

  /** horizontal sheet facing up, centred at (x, y, z) */
  flat(slot: string, w: number, d: number, x = 0, y = 0, z = 0, o: AddOpts & { down?: boolean } = {}) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(o.down ? Math.PI / 2 : -Math.PI / 2);
    this.push(slot, g, x, y, z, o);
  }

  /** upright sheet facing local +z, centred at (x, y, z); uv is the full 0..1 or a sub-rect */
  wallQuad(slot: string, w: number, h: number, x = 0, y = 0, z = 0, o: AddOpts & { uv?: [number, number, number, number] } = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    if (o.uv) {
      const [u0, v0, u1, v1] = o.uv;
      const a = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) a.setXY(i, u0 + a.getX(i) * (u1 - u0), v0 + a.getY(i) * (v1 - v0));
    }
    this.push(slot, g, x, y, z, { ...o, keep: o.keep ?? true });
  }

  /** a geometry already in local metres */
  raw(slot: string, g: THREE.BufferGeometry, x = 0, y = 0, z = 0, o: AddOpts = {}) {
    this.push(slot, g, x, y, z, o);
  }

  private rect(w: number, d: number, x: number, z: number): Rect {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      _v.set(x + (sx * w) / 2, 0, z + (sz * d) / 2).applyMatrix4(this.top);
      x0 = Math.min(x0, _v.x); x1 = Math.max(x1, _v.x); z0 = Math.min(z0, _v.z); z1 = Math.max(z1, _v.z);
    }
    return [x0, z0, x1, z1];
  }

  /** something you cannot walk through; local rect centred at (x, z) */
  solid(w: number, d: number, x = 0, z = 0) { this.solids.push(this.rect(w, d, x, z)); }

  /** soft contact shadow on the floor under a piece */
  shadow(w: number, d: number, x = 0, z = 0, dark = 0.3, soft = 0.22) {
    const [x0, z0, x1, z1] = this.rect(w, d, x, z);
    this.ao.push({ x0, z0, x1, z1, dark, soft });
  }

  /** both of the above — most furniture */
  foot(w: number, d: number, x = 0, z = 0, dark = 0.3, soft = 0.22) { this.solid(w, d, x, z); this.shadow(w, d, x, z, dark, soft); }

  private point(x: number, y: number, z: number) { return _v.set(x, y, z).applyMatrix4(this.top).clone(); }

  light(kind: Fixture['kind'], x: number, y: number, z: number, power: number, color = 0xffd9a8) {
    const p = this.point(x, y, z);
    this.fixtures.push({ x: p.x, y: p.y, z: p.z, kind, power, color });
  }

  /** a painted pool of light on the floor (up) or ceiling (down) that appears at night */
  glow(x: number, y: number, z: number, r: number, up = true, k = 1) {
    const p = this.point(x, y, z);
    this.glows.push({ x: p.x, y: p.y, z: p.z, r, up, k });
  }

  halo(x: number, y: number, z: number) {
    const p = this.point(x, y, z);
    this.halos.push({ x: p.x, y: p.y, z: p.z });
  }

  /** merge everything; returns one group per (dollhouse layer × style) combination */
  build(mats: Mats): BuiltGroup[] {
    const groups = new Map<string, BuiltGroup>();
    for (const b of this.batches.values()) {
      const gk = `${b.upper ? 1 : 0}|${b.style ?? ''}`;
      let bg = groups.get(gk);
      if (!bg) {
        bg = { group: new THREE.Group(), upper: b.upper, style: b.style };
        bg.group.name = `flat:${gk}`;
        groups.set(gk, bg);
      }
      const merged = mergeGeometries(b.geos, false);
      for (const g of b.geos) g.dispose();
      if (!merged) continue;
      this.tris += (merged.index ? merged.index.count : merged.attributes.position.count) / 3;
      const f = SLOT_FLAGS[b.slot] ?? {};
      const mesh = new THREE.Mesh(merged, mats.get(b.slot));
      mesh.name = b.slot;
      mesh.castShadow = f.cast ?? true;
      mesh.receiveShadow = f.recv ?? true;
      if (f.hideInMirror) mesh.layers.set(1);
      if (f.kind === 'glass' || f.kind === 'sheer') mesh.renderOrder = 5;
      mesh.matrixAutoUpdate = false;
      bg.group.add(mesh);
    }
    this.batches.clear();
    return [...groups.values()];
  }
}

/**
 * Texture coordinates in metres, projected along each face's dominant axis. Unrotated pieces
 * (walls, floors) line up seamlessly with their neighbours because the piece's position is added.
 */
function worldUV(g: THREE.BufferGeometry, tx: number, ty: number, tz: number, swap: boolean) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    let u: number, v: number;
    if (ay >= ax && ay >= az) { u = pos.getX(i) + tx; v = pos.getZ(i) + tz; }
    else if (ax >= az) { u = pos.getZ(i) + tz; v = pos.getY(i) + ty; }
    else { u = pos.getX(i) + tx; v = pos.getY(i) + ty; }
    if (swap) uv.setXY(i, v, u); else uv.setXY(i, u, v);
  }
}
