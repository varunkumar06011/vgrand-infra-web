import * as THREE from 'three';
import type { Quality, Rect } from './kit';
import type { Post } from './post';
import { FT, roomAt, roomById, roomText, sqft, type Lang, type PlanDef, type PlanId, type RoomDef } from './plans';
import { CUT, H } from './shell';
import type { StyleId } from './styles';
import { FlatWorld, preloadWorld, TIME_MAX, TIME_MIN } from './world';

export type Mode = 'walk' | 'doll';
export type RoomInfo = { id: string; name: string; dims: string; sqft: number | null; point: string };
export type TourState = { status: 'idle' | 'running' | 'paused' | 'done'; step: number; total: number; stop: RoomInfo | null };

export type EngineEvents = {
  progress?: (p: number) => void;
  ready?: () => void;
  error?: (message: string) => void;
  mode?: (m: Mode) => void;
  room?: (r: RoomInfo | null) => void;
  tour?: (t: TourState) => void;
  lock?: (locked: boolean) => void;
  /** the compare slider closed by itself (after a sweep), leaving this version on screen */
  compare?: (c: { on: boolean; furnished: boolean }) => void;
};

const EYE = 1.6;
const RADIUS = 0.2;
const WALK = 1.5, RUN = 3.1;
const TOUR_SPEED = 1.0;
const DWELL = 5.2;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number };
type Stop = { x: number; z: number; lookX: number; lookZ: number; info: RoomInfo };
type Leg = { curve: THREE.CatmullRomCurve3; len: number };

/** the GPU's name, where the browser will say (lower case, '' if it will not) */
function gpuName(): string {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name.toLowerCase();
  } catch { return ''; }
}

/**
 * Sort the device into one of four tiers from what the browser reports (GPU, memory, cores,
 * touch, data saver) — the adaptive governor in the render loop then steps down further if the
 * frame rate still sags. `?flatq=0..3` in the address forces a tier for testing.
 */
export function pickTier(): Quality['tier'] {
  const forced = new URLSearchParams(window.location.search).get('flatq');
  if (forced && /^[0-3]$/.test(forced)) return +forced as Quality['tier'];
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const mem = nav.deviceMemory ?? (coarse ? 4 : 8);
  const cores = nav.hardwareConcurrency ?? 4;
  const gpu = gpuName();
  let tier: Quality['tier'];
  if (gpu === 'none' || /swiftshader|llvmpipe|software|basic render|microsoft basic/.test(gpu)) tier = 0;
  else if (!coarse) {
    if (/rtx|gtx|radeon (rx|pro|vii)|apple m\d|apple gpu|arc\(?tm\)? a|quadro|nvidia/.test(gpu)) tier = 3;
    else if (/iris|uhd|radeon|vega|intel|mali|adreno/.test(gpu)) tier = 2;
    else tier = mem >= 8 && cores >= 8 ? 3 : 2;
  } else {
    if (/apple/.test(gpu)) tier = cores >= 6 ? 2 : 1;
    else if (/adreno[^\d]*(7\d\d|6[5-9]\d)|mali-g(7[1-9]\d|6[1-9]\d|7[6-9])|immortalis|xclipse/.test(gpu)) tier = mem >= 6 ? 2 : 1;
    else if (/adreno[^\d]*(6\d\d|5[4-9]\d)|mali-g(5\d|7[0-5]|[6-9]\d)|powervr/.test(gpu)) tier = mem >= 3 ? 1 : 0;
    else tier = mem >= 6 && cores >= 8 ? 1 : 0;
  }
  if (nav.connection?.saveData) tier = Math.min(tier, 1) as Quality['tier'];
  if (mem <= 2) tier = 0;
  return tier;
}

export function pickQuality(tier: Quality['tier'] = pickTier()): Quality {
  const hi = tier >= 2;
  return {
    tier, hi,
    bump: tier >= 1,
    mirror: tier >= 2,
    shadow: tier >= 2 ? 2048 : 1024,
    lights: [3, 4, 5, 7][tier],
    post: tier >= 2,
    ao: tier >= 2,
    area: tier >= 2,
    animate: tier >= 1,
    town: [0.3, 0.55, 0.85, 1][tier],
  };
}

/** device pixel ratio ceiling and pixel budget per tier */
const DPR_MAX = [1.25, 1.6, 1.75, 2];
const PIXELS = [1.0e6, 1.6e6, 2.4e6, 3.6e6];

export function roomInfo(r: RoomDef, lang: Lang = 'en'): RoomInfo {
  const t = roomText(r, lang);
  return { id: r.id, name: t.name, dims: r.dims, sqft: sqft(r.r), point: t.point };
}

/** the tour's first stop, outside the front door */
function welcomeInfo(plan: PlanDef, lang: Lang, title?: string): RoomInfo {
  const te = lang === 'te';
  return {
    id: 'entry',
    name: te ? 'స్వాగతం' : title ?? 'Welcome',
    dims: `${te && plan.te ? plan.te.label : plan.label} · ${plan.bhk ?? '3 BHK'}`,
    sqft: null,
    point: te
      ? 'మెయిన్ డోర్ నుండి లోపలికి రండి — ప్రతి గదీ ఫ్లోర్ ప్లాన్ ప్రకారం సరిగ్గా అదే కొలతలో ఉంది.'
      : 'Come in through the front door — every room is to scale with the floor plan.',
  };
}

/**
 * Owns the canvas: renders the world, walks the camera (keyboard, mouse, touch), flies between
 * the first-person and dollhouse views, and runs the guided tour. React only talks to it
 * through the public methods and the event callbacks.
 */
export class FlatEngine {
  world!: FlatWorld;
  mode: Mode = 'doll';
  readonly camera = new THREE.PerspectiveCamera(40, 1, 0.06, 1100);
  private renderer!: THREE.WebGLRenderer;
  private canvas!: HTMLCanvasElement;
  private fade: HTMLCanvasElement;
  private fadeT = 1;
  private fadeDur = 0.6;
  private snap: (() => void) | null = null;
  private labels: { el: HTMLButtonElement; room: RoomDef }[] = [];
  private ro: ResizeObserver | null = null;
  private raf = 0;
  private last = 0;
  private hot = 4;
  private disposed = false;
  private started = false;
  private w = 1; private h = 1; private dpr = 1; private maxDpr = 2;
  private slow = 0; private frames = 0; private mirrorOn = true;
  private post: Post | null = null;

  // furnished / bare-shell compare: left of the divider is the bare shell, right is furnished
  private comparing = false;
  private furnishedView = true;
  private splitCur = 0; private splitTarget = 0;
  private splitDone: (() => void) | null = null;
  private divider: HTMLElement | null = null;

  // first-person state
  private pos = new THREE.Vector2(2, 2);
  private yaw = 0; private pitch = 0;
  private vel = { f: 0, s: 0 };
  private keys: Record<string, boolean> = {};
  private stick = { x: 0, y: 0 };
  private room: RoomDef | null = null;
  private roomClock = 0;

  // dollhouse state
  private az = 0; private pol = 0.72; private zoom = 1; private fit = 20;
  private spin = true;
  /** how far the picture is slid sideways to sit beside the welcome text (fraction of width) */
  private shift = 0;

  // camera flight between poses
  private flight: { from: Pose; to: Pose; t: number; dur: number; up: boolean; done: () => void } | null = null;

  // pointers
  private ptrs = new Map<number, { x: number; y: number; sx: number; sy: number; type: string }>();
  private pinch = 0;
  private locked = false;
  private timeTarget: number;

  // tour
  private stops: Stop[] = [];
  private legs: Leg[] = [];
  private tour: { status: TourState['status']; i: number; phase: 'dwell' | 'turn' | 'walk'; s: number; t: number; strayed: boolean } =
    { status: 'idle', i: 0, phase: 'dwell', s: 0, t: 0, strayed: false };

  constructor(
    private mount: HTMLElement,
    private labelLayer: HTMLElement,
    private opts: { plan: PlanId; style: StyleId; time: number; quality: Quality; reducedMotion: boolean; lang?: Lang },
    private ev: EngineEvents,
  ) {
    this.fade = document.createElement('canvas');
    this.fade.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;display:none';
    this.timeTarget = opts.time;
    this.spin = !opts.reducedMotion;
    this.camera.rotation.order = 'YXZ';
    // layer 1 holds the floor and its overlays, which the reflection camera must not see
    this.camera.layers.enable(1);
  }

  get plan(): PlanDef { return this.world.plan; }

  async init() {
    const q = this.opts.quality;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: !q.post, powerPreference: 'high-performance', alpha: false, stencil: false });
    } catch {
      this.ev.error?.('Your browser could not start 3D graphics. Please try another browser or device.');
      return;
    }
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = q.post ? 0.78 : 0.92;
    r.shadowMap.enabled = true;
    r.shadowMap.type = q.hi ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    this.maxDpr = DPR_MAX[q.tier];
    this.canvas = r.domElement;
    this.canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;cursor:grab';
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      // disposing the viewer loses the context on purpose; only a real loss is worth reporting
      if (!this.disposed) this.ev.error?.('The 3D view was interrupted by the device. Close and reopen it to continue.');
    });
    this.mount.appendChild(this.canvas);
    this.mount.appendChild(this.fade);
    this.ev.progress?.(0.12);
    await frame();
    if (this.disposed) return;

    await preloadWorld(q);
    if (this.disposed) return;
    this.world = new FlatWorld(r, q, this.opts.style, this.opts.time);
    this.world.animate = q.animate && !this.opts.reducedMotion;
    this.ev.progress?.(0.3);
    await frame();
    if (this.disposed) return;
    this.world.build(this.opts.plan);
    this.ev.progress?.(0.82);
    await frame();
    if (this.disposed) return;

    this.afterBuild();
    if (q.post) {
      try {
        const { Post } = await import('./post');
        if (this.disposed) return;
        this.post = new Post(r, this.world.scene, this.camera, q);
      } catch { this.post = null; }
    }
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.mount);
    this.bind();
    // start above the home, roof off, turning slowly
    this.mode = 'doll';
    this.world.setUpper(false);
    this.applyDoll();
    this.camera.near = 0.6;
    this.camera.updateProjectionMatrix();
    this.camera.layers.enableAll();
    r.compile(this.world.scene, this.camera);
    this.world.update(1, this.world.centre);
    this.ev.progress?.(1);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
    await frame();
    if (this.disposed) return;
    this.ev.ready?.();
    this.idleWarm();
  }

  private idleWarm() {
    const step = () => {
      if (this.disposed) return;
      if (this.world.warmNext()) setTimeout(step, 600);
    };
    setTimeout(step, 2500);
  }

  /** everything that depends on which plan is loaded */
  private afterBuild() {
    const plan = this.plan;
    const [sx, sy, lx, ly] = plan.spawn;
    this.pos.set(sx * FT, sy * FT);
    this.yaw = Math.atan2(-(lx - sx), -(ly - sy));
    this.pitch = -0.04;
    this.room = null;

    // tour path: a smooth curve through the waypoints between each pair of stops
    this.stops = []; this.legs = [];
    let run: THREE.Vector3[] = [];
    for (const n of plan.tour) {
      const p = new THREE.Vector3(n.p[0] * FT, 0, n.p[1] * FT);
      run.push(p);
      if (!n.stop) continue;
      this.stops.push({ x: p.x, z: p.z, lookX: n.stop.look[0] * FT, lookZ: n.stop.look[1] * FT, info: this.stopInfo(n.stop) });
      if (run.length > 1) {
        const curve = new THREE.CatmullRomCurve3(run, false, 'centripetal');
        curve.arcLengthDivisions = Math.max(60, run.length * 30);
        this.legs.push({ curve, len: curve.getLength() });
      }
      run = [p.clone()];
    }

    this.buildLabels();
    this.az = this.defaultAz();
    this.zoom = 1;
    this.refit();
  }

  private get lang(): Lang { return this.opts.lang ?? 'en'; }

  private stopInfo(stop: NonNullable<PlanDef['tour'][number]['stop']>): RoomInfo {
    const def = roomById(this.plan, stop.room);
    if (!def) return welcomeInfo(this.plan, this.lang, stop.title);
    const info = roomInfo(def, this.lang);
    return this.lang === 'en' && stop.title ? { ...info, name: stop.title } : info;
  }

  /** dollhouse labels: tap one to step into that room */
  private buildLabels() {
    this.labelLayer.replaceChildren();
    this.labels = [];
    for (const room of this.plan.rooms) {
      if (room.quiet) continue;
      const name = roomText(room, this.lang).name;
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'flat3d-label';
      el.innerHTML = `<b></b><span></span>`;
      (el.firstChild as HTMLElement).textContent = name;
      (el.lastChild as HTMLElement).textContent = room.dims;
      el.setAttribute('aria-label', this.lang === 'te' ? `${name} లోపలికి వెళ్ళండి` : `Step into the ${name}`);
      el.addEventListener('click', () => this.enterRoom(room.id));
      this.labelLayer.appendChild(el);
      this.labels.push({ el, room });
    }
    this.hot = 4;
  }

  /** switch the room names, tour cards and labels between English and Telugu */
  setLang(lang: Lang) {
    if (lang === this.lang) return;
    this.opts.lang = lang;
    if (!this.world) return;
    let i = 0;
    for (const n of this.plan.tour) if (n.stop) this.stops[i++].info = this.stopInfo(n.stop);
    this.buildLabels();
    if (this.room) this.ev.room?.(roomInfo(this.room, lang));
    if (this.tour.status !== 'idle') this.emitTour();
  }

  /* ---------------------------------------------------------------- sizing */

  private defaultAz() { return this.w > this.h * 1.15 ? -Math.PI / 2 : 0; }

  private resize() {
    const w = this.mount.clientWidth || window.innerWidth, h = this.mount.clientHeight || window.innerHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    // cap the pixel count so a 4K screen does not quadruple the work
    const budget = PIXELS[this.opts.quality.tier];
    const cap = Math.sqrt(budget / (w * h));
    this.dpr = Math.max(0.75, Math.min(window.devicePixelRatio || 1, this.maxDpr, cap));
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.world?.setSize(w * this.dpr, h * this.dpr);
    this.post?.setSize(w, h, this.dpr);
    this.camera.aspect = w / h;
    if (this.shift > 0) this.camera.setViewOffset(w, h, -this.shift * w, 0, w, h);
    if (!this.flight) this.camera.fov = this.fovFor(this.mode);
    this.camera.updateProjectionMatrix();
    this.fade.width = Math.round(w * Math.min(this.dpr, 1.25)); this.fade.height = Math.round(h * Math.min(this.dpr, 1.25));
    if (this.world) { this.refit(); if (this.mode === 'doll' && !this.flight) this.applyDoll(); }
    this.hot = 4;
  }

  private fovFor(mode: Mode) {
    const portrait = this.w < this.h;
    return mode === 'walk' ? (portrait ? 84 : 68) : portrait ? 46 : 36;
  }

  /* ---------------------------------------------------------------- dollhouse camera */

  private dollPos(out: THREE.Vector3, dist = this.fit * this.zoom * (1 + this.shift * 1.4)) {
    const c = this.world.centre, sp = Math.sin(this.pol);
    return out.set(c.x + dist * sp * Math.sin(this.az), 0.6 + dist * Math.cos(this.pol), c.z + dist * sp * Math.cos(this.az));
  }

  /** the distance at which the whole flat just fills the screen from the current angle */
  private refit() {
    const b = this.world.bounds, c = this.world.centre;
    const cam = new THREE.PerspectiveCamera(this.fovFor('doll'), this.w / this.h, 0.5, 500);
    const v = new THREE.Vector3();
    const tight = this.w < 700 ? 0.9 : 0.8;
    let lo = 6, hi = 90;
    for (let i = 0; i < 18; i++) {
      const d = (lo + hi) / 2;
      const sp = Math.sin(this.pol);
      cam.position.set(c.x + d * sp * Math.sin(this.az), 0.6 + d * Math.cos(this.pol), c.z + d * sp * Math.cos(this.az));
      cam.lookAt(c.x, 0.6, c.z);
      cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let out = false;
      for (const x of [b[0], b[2]]) for (const z of [b[1], b[3]]) for (const y of [0, CUT]) {
        v.set(x, y, z).project(cam);
        if (Math.abs(v.x) > tight || v.y > tight * 0.92 || v.y < -tight * 0.8) out = true;
      }
      if (out) lo = d; else hi = d;
    }
    this.fit = hi;
  }

  private applyDoll() {
    const c = this.world.centre;
    this.dollPos(this.camera.position);
    this.camera.lookAt(c.x, 0.6, c.z);
  }

  private dollPose(): Pose {
    const c = this.world.centre;
    const pos = this.dollPos(new THREE.Vector3());
    const m = new THREE.Matrix4().lookAt(pos, new THREE.Vector3(c.x, 0.6, c.z), new THREE.Vector3(0, 1, 0));
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m), fov: this.fovFor('doll') };
  }

  private walkPose(): Pose {
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    return { pos: new THREE.Vector3(this.pos.x, EYE, this.pos.y), quat, fov: this.fovFor('walk') };
  }

  /* ---------------------------------------------------------------- mode changes */

  /** dissolve from the current frame to whatever `change` produces */
  private crossfade(change: () => void, dur = 0.65) {
    this.snap = change;
    this.fadeDur = dur;
    this.hot = 4;
  }

  setMode(mode: Mode, then?: () => void) {
    if (this.flight) return;
    if (mode === this.mode) { then?.(); return; }
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    const from: Pose = { pos: this.camera.position.clone(), quat: this.camera.quaternion.clone(), fov: this.camera.fov };
    if (mode === 'doll') {
      this.az = this.defaultAz(); this.zoom = 1; this.pol = 0.72;
      this.refit();
      this.flight = { from, to: this.dollPose(), t: 0, dur: 2.4, up: true, done: () => { this.spin = !this.opts.reducedMotion; then?.(); } };
    } else {
      this.flight = { from, to: this.walkPose(), t: 0, dur: 2.2, up: false, done: () => { this.camera.rotation.set(this.pitch, this.yaw, 0); then?.(); } };
    }
    this.mode = mode;
    this.vel.f = this.vel.s = 0;
    this.ev.mode?.(mode);
    this.syncLabels();
    this.canvas.style.cursor = 'grab';
    this.hot = 4;
  }

  /** drop into a room from the dollhouse (or jump there while walking) */
  enterRoom(id: string) {
    const room = roomById(this.plan, id);
    if (!room || this.flight) return;
    this.stopTour();
    const [x, y, lx, ly] = room.view;
    const place = () => {
      this.pos.set(x * FT, y * FT);
      this.yaw = Math.atan2(-(lx - x), -(ly - y));
      this.pitch = -0.05;
    };
    if (this.mode === 'doll') { place(); this.setMode('walk'); }
    else this.crossfade(place);
  }

  setStyle(style: StyleId) {
    if (style === this.world.mats.style) return;
    this.crossfade(() => this.world.setStyle(style), 0.9);
  }

  setPlan(id: PlanId) {
    if (id === this.plan.id || this.flight) return;
    this.stopTour();
    this.crossfade(() => {
      this.world.build(id);
      this.afterBuild();
      this.world.setUpper(this.mode !== 'doll');
      if (this.mode === 'doll') this.applyDoll();
      this.syncLabels();
    }, 0.9);
  }

  setTime(t: number) { this.timeTarget = clamp(t, TIME_MIN, TIME_MAX); this.hot = 4; }

  /* ---------------------------------------------------------------- furnished / bare shell */

  /** the element that marks the divider; the engine slides it to wherever the split is */
  setDivider(el: HTMLElement | null) { this.divider = el; this.placeDivider(); }

  /** open or close the compare slider. Closing keeps whichever version fills more of the screen. */
  setCompare(on: boolean) {
    if (on === this.comparing && !this.splitDone) return;
    if (on) {
      this.splitDone = null;
      this.comparing = true;
      this.world.comparing = true;
      // the other version sweeps in from its own side and stops half way
      this.splitCur = this.furnishedView ? 0 : 1;
      this.splitTarget = 0.5;
    } else {
      const bare = this.splitTarget > 0.5 || (this.splitTarget === 0.5 && this.splitCur > 0.5);
      this.sweepTo(bare ? 1 : 0, () => this.endCompare(!bare));
    }
    this.hot = 4;
  }

  /** where the divider sits, 0 (all furnished) .. 1 (all bare shell) */
  setSplit(v: number, animate = false) {
    if (!this.comparing) return;
    this.splitDone = null;
    this.splitTarget = clamp(v, 0, 1);
    if (!animate) this.splitCur = this.splitTarget;
    this.hot = 4;
  }

  /** switch the whole view between furnished and bare, as a wipe across the screen */
  setFurnished(v: boolean) {
    if (this.comparing) { this.sweepTo(v ? 0 : 1, () => this.endCompare(v)); return; }
    if (v === this.furnishedView) return;
    this.comparing = true;
    this.world.comparing = true;
    this.splitCur = v ? 1 : 0;
    this.sweepTo(v ? 0 : 1, () => this.endCompare(v));
  }

  get furnished() { return this.furnishedView; }

  private sweepTo(v: number, done: () => void) {
    this.splitTarget = v;
    this.splitDone = done;
    this.hot = 4;
  }

  private endCompare(furnished: boolean) {
    this.comparing = false;
    this.furnishedView = furnished;
    this.world.comparing = false;
    this.world.setFurnished(furnished);
    this.splitCur = this.splitTarget = furnished ? 0 : 1;
    this.splitDone = null;
    this.placeDivider();
    this.ev.compare?.({ on: false, furnished });
    this.hot = 4;
  }

  private placeDivider() {
    const el = this.divider;
    if (!el) return;
    const show = this.comparing;
    el.style.opacity = show ? '1' : '0';
    el.style.transform = `translateX(${(this.splitCur * this.w).toFixed(1)}px)`;
  }

  /** the welcome screen has been dismissed: controls are live from here */
  begin() { this.started = true; this.spin = false; this.syncLabels(); this.hot = 4; }

  /* ---------------------------------------------------------------- tour */

  private emitTour() {
    const t = this.tour;
    const showing = t.status !== 'idle' && (t.phase === 'dwell' || t.status === 'done');
    this.ev.tour?.({ status: t.status, step: t.i, total: this.stops.length, stop: showing ? this.stops[t.i]?.info ?? null : null });
  }

  private placeAtStop(i: number) {
    const s = this.stops[i];
    this.pos.set(s.x, s.z);
    this.yaw = Math.atan2(-(s.lookX - s.x), -(s.lookZ - s.z));
    this.pitch = -0.05;
    this.vel.f = this.vel.s = 0;
  }

  startTour() {
    if (!this.stops.length || this.flight) return;
    this.started = true; this.spin = false;
    if (this.tour.status !== 'idle') { this.tour.status = 'idle'; this.emitTour(); }
    const go = () => {
      this.tour = { status: 'running', i: 0, phase: 'dwell', s: 0, t: 0, strayed: false };
      this.emitTour();
      this.hot = 4;
    };
    if (this.mode === 'doll') { this.placeAtStop(0); this.setMode('walk', go); }
    else this.crossfade(() => { this.placeAtStop(0); go(); });
  }

  pauseTour() {
    if (this.tour.status !== 'running') return;
    this.tour.status = 'paused';
    this.emitTour();
  }

  resumeTour() {
    const t = this.tour;
    if (t.status !== 'paused') return;
    if (t.strayed) {
      // the visitor wandered off the path: rejoin at the stop we were heading for
      const i = t.phase === 'dwell' ? t.i : Math.min(t.i + 1, this.stops.length - 1);
      this.crossfade(() => { this.placeAtStop(i); this.tour = { status: 'running', i, phase: 'dwell', s: 0, t: 0, strayed: false }; this.emitTour(); });
    } else { t.status = 'running'; this.emitTour(); }
    this.hot = 4;
  }

  nextStop() {
    const t = this.tour;
    if (t.status === 'idle' || t.status === 'done' || this.flight) return;
    const i = t.i + 1;
    if (i >= this.stops.length) { this.finishTour(); return; }
    this.crossfade(() => { this.placeAtStop(i); this.tour = { status: 'running', i, phase: 'dwell', s: 0, t: 0, strayed: false }; this.emitTour(); });
  }

  stopTour() {
    if (this.tour.status === 'idle') return;
    this.tour.status = 'idle';
    this.emitTour();
  }

  /** the last room is done: rise to the dollhouse, then show the closing card */
  private finishTour() {
    const t = this.tour;
    t.i = this.stops.length - 1;
    const done = () => {
      if (this.tour !== t || t.status === 'idle') return;
      t.status = 'done';
      this.emitTour();
    };
    if (this.mode === 'doll') { done(); return; }
    // 'turn' hides the room card while the camera lifts away
    t.status = 'running'; t.phase = 'turn';
    this.emitTour();
    this.setMode('doll', done);
  }

  private stray() {
    if (this.tour.status === 'running') { this.tour.strayed = true; this.pauseTour(); }
    else if (this.tour.status === 'paused') this.tour.strayed = true;
  }

  private stepTour(dt: number) {
    const t = this.tour;
    if (t.status !== 'running' || this.flight || this.mode !== 'walk') return;
    this.hot = 2;
    const stop = this.stops[t.i];
    const turn = (target: number, rate: number) => { this.yaw += wrap(target - this.yaw) * (1 - Math.exp(-dt * rate)); };
    t.t += dt;
    if (t.phase === 'dwell') {
      const look = Math.atan2(-(stop.lookX - this.pos.x), -(stop.lookZ - this.pos.y));
      const pan = this.opts.reducedMotion ? 0 : Math.sin(t.t * 0.62) * 0.2;
      turn(look + pan, 2.2);
      this.pitch += (-0.06 - this.pitch) * (1 - Math.exp(-dt * 2));
      if (t.t > (t.i === 0 ? 3.6 : DWELL)) {
        if (t.i >= this.stops.length - 1) { this.finishTour(); return; }
        t.phase = 'turn'; t.t = 0; t.s = 0;
        this.emitTour();
      }
      return;
    }
    const leg = this.legs[t.i];
    const at = (s: number) => leg.curve.getPointAt(clamp(s / leg.len, 0, 1));
    const heading = (s: number) => {
      const a = at(s), b = at(Math.min(leg.len, s + 0.75));
      return Math.atan2(-(b.x - a.x), -(b.z - a.z));
    };
    if (t.phase === 'turn') {
      const target = heading(0);
      turn(target, 4.2);
      if (Math.abs(wrap(target - this.yaw)) < 0.14 || t.t > 1.7) { t.phase = 'walk'; t.t = 0; }
      return;
    }
    // walk: ease away from one stop and into the next
    const left = leg.len - t.s;
    const v = TOUR_SPEED * clamp(Math.min((t.s + 0.25) / 0.9, (left + 0.15) / 1.1), 0.22, 1);
    t.s = Math.min(leg.len, t.s + v * dt);
    const p = at(t.s);
    this.pos.set(p.x, p.z);
    const next = this.stops[t.i + 1];
    const settle = clamp(1 - (leg.len - t.s) / 1.5, 0, 1);
    const look = Math.atan2(-(next.lookX - p.x), -(next.lookZ - p.z));
    const head = heading(t.s);
    turn(head + wrap(look - head) * settle * settle, 3.4);
    this.pitch += (-0.05 - this.pitch) * (1 - Math.exp(-dt * 2));
    if (t.s >= leg.len - 1e-3) {
      t.i += 1; t.phase = 'dwell'; t.t = 0; t.s = 0;
      this.emitTour();
    }
  }

  /* ---------------------------------------------------------------- input */

  setStick(x: number, y: number) {
    this.stick.x = x; this.stick.y = y;
    if (x || y) { this.stray(); this.hot = 4; }
  }

  private onKey = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const down = e.type === 'keydown';
    if (!this.started) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
      this.keys[e.code] = down;
      if (e.code.startsWith('Arrow')) e.preventDefault();
      if (down && !e.code.startsWith('Shift')) this.stray();
      this.hot = 4;
    }
  };

  private onBlur = () => { this.keys = {}; };

  private look(dx: number, dy: number, k: number) {
    if (this.mode === 'walk') {
      this.yaw -= dx * k;
      this.pitch = clamp(this.pitch - dy * k, -1.25, 1.25);
      this.stray();
    } else {
      this.az -= dx * k * 1.2;
      this.pol = clamp(this.pol - dy * k * 0.9, 0.16, 1.22);
      this.spin = false;
    }
    this.hot = 4;
  }

  private onDown = (e: PointerEvent) => {
    if (!this.started || this.flight) return;
    this.canvas.setPointerCapture?.(e.pointerId);
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, type: e.pointerType });
    if (this.ptrs.size === 2) {
      const [a, b] = [...this.ptrs.values()];
      this.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
    this.canvas.style.cursor = 'grabbing';
  };

  private onMove = (e: PointerEvent) => {
    if (this.locked) return;
    const p = this.ptrs.get(e.pointerId);
    if (!p || this.flight) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (this.ptrs.size === 2 && this.mode === 'doll') {
      const [a, b] = [...this.ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch > 0) this.zoom = clamp(this.zoom * (this.pinch / Math.max(d, 1)), 0.45, 1.5);
      this.pinch = d; this.spin = false; this.hot = 4;
      return;
    }
    if (this.ptrs.size > 1) return;
    this.look(dx, dy, p.type === 'mouse' ? 0.0042 : 0.0058);
  };

  private onUp = (e: PointerEvent) => {
    const p = this.ptrs.get(e.pointerId);
    this.ptrs.delete(e.pointerId);
    this.pinch = 0;
    this.canvas.style.cursor = this.locked ? 'none' : 'grab';
    if (!p || this.flight || e.type === 'pointercancel') return;
    const tap = Math.hypot(e.clientX - p.sx, e.clientY - p.sy) < 6;
    if (!tap) return;
    if (this.mode === 'doll') this.tapFloor(e.clientX, e.clientY);
    else if (p.type === 'mouse' && this.tour.status !== 'running') {
      const req = this.canvas.requestPointerLock?.() as unknown as Promise<void> | undefined;
      req?.catch?.(() => undefined);
    }
  };

  private onLockMove = (e: MouseEvent) => {
    if (!this.locked) return;
    this.look(e.movementX, e.movementY, 0.0021);
  };

  private onLockChange = () => {
    this.locked = document.pointerLockElement === this.canvas;
    this.canvas.style.cursor = this.locked ? 'none' : 'grab';
    this.ev.lock?.(this.locked);
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!this.started || this.mode !== 'doll' || this.flight) return;
    this.zoom = clamp(this.zoom * Math.exp(e.deltaY * 0.0011), 0.45, 1.5);
    this.spin = false; this.hot = 4;
  };

  /** in the dollhouse: tap a room to step inside it */
  private tapFloor(cx: number, cy: number) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return;
    const room = roomAt(this.plan, hit.x / FT, hit.z / FT);
    if (room) this.enterRoom(room.id);
  }

  private onVis = () => { this.last = performance.now(); this.hot = 4; };

  private bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', this.onDown);
    c.addEventListener('pointermove', this.onMove);
    c.addEventListener('pointerup', this.onUp);
    c.addEventListener('pointercancel', this.onUp);
    c.addEventListener('wheel', this.onWheel, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('mousemove', this.onLockMove);
    document.addEventListener('pointerlockchange', this.onLockChange);
    document.addEventListener('visibilitychange', this.onVis);
  }

  /* ---------------------------------------------------------------- walking */

  private blocked(x: number, z: number, solids: Rect[]) {
    const r2 = RADIUS * RADIUS;
    for (const s of solids) {
      const dx = x < s[0] ? s[0] - x : x > s[2] ? x - s[2] : 0;
      if (dx >= RADIUS) continue;
      const dz = z < s[1] ? s[1] - z : z > s[3] ? z - s[3] : 0;
      if (dx * dx + dz * dz < r2) return true;
    }
    return false;
  }

  private stepWalk(dt: number) {
    const k = this.keys;
    const tourOn = this.tour.status === 'running';
    let f = 0, s = 0;
    if (!tourOn) {
      f = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - this.stick.y;
      s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + this.stick.x;
      if (k.ArrowLeft) { this.yaw += 1.7 * dt; this.hot = 2; }
      if (k.ArrowRight) { this.yaw -= 1.7 * dt; this.hot = 2; }
    }
    const m = Math.hypot(f, s);
    if (m > 1) { f /= m; s /= m; }
    const a = 1 - Math.exp(-12 * dt);
    this.vel.f += (f - this.vel.f) * a;
    this.vel.s += (s - this.vel.s) * a;
    if (Math.abs(this.vel.f) < 0.004 && Math.abs(this.vel.s) < 0.004) { this.vel.f = this.vel.s = 0; return; }
    this.hot = 2;
    const speed = k.ShiftLeft || k.ShiftRight ? RUN : WALK;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    const dx = (fx * this.vel.f + rx * this.vel.s) * speed * dt, dz = (fz * this.vel.f + rz * this.vel.s) * speed * dt;
    const solids = this.world.solids;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.05));
    let x = this.pos.x, z = this.pos.y;
    const stuck = this.blocked(x, z, solids);
    for (let i = 0; i < steps; i++) {
      const sx = dx / steps, sz = dz / steps;
      if (stuck || !this.blocked(x + sx, z + sz, solids)) { x += sx; z += sz; }
      else if (!this.blocked(x + sx, z, solids)) x += sx;
      else if (!this.blocked(x, z + sz, solids)) z += sz;
    }
    this.pos.set(x, z);
  }

  private trackRoom(dt: number) {
    this.roomClock += dt;
    if (this.roomClock < 0.25) return;
    this.roomClock = 0;
    const room = this.mode === 'walk' && !this.flight ? roomAt(this.plan, this.pos.x / FT, this.pos.y / FT) : null;
    if (room === this.room) return;
    this.room = room;
    this.ev.room?.(room ? roomInfo(room, this.lang) : null);
  }

  /* ---------------------------------------------------------------- frame */

  private syncLabels() {
    const show = this.mode === 'doll' && !this.flight && this.started;
    this.labelLayer.style.opacity = show ? '1' : '0';
    this.labelLayer.style.pointerEvents = show ? 'auto' : 'none';
  }

  private placeLabels() {
    if (this.mode !== 'doll' || this.flight) return;
    const v = new THREE.Vector3();
    for (const { el, room } of this.labels) {
      const [x0, y0, x1, y1] = room.r;
      v.set(((x0 + x1) / 2) * FT, 0.4, ((y0 + y1) / 2) * FT).project(this.camera);
      el.style.transform = `translate(-50%,-50%) translate(${((v.x * 0.5 + 0.5) * this.w).toFixed(1)}px,${((-v.y * 0.5 + 0.5) * this.h).toFixed(1)}px)`;
    }
  }

  private tick = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.tick);
    if (document.hidden) { this.last = now; return; }
    const rawMs = now - this.last;
    const dt = Math.min(0.05, rawMs / 1000);
    this.last = now;
    const world = this.world, cam = this.camera;

    // on a wide screen the model sits to the right of the welcome text, then slides to centre
    const wantShift = !this.started && this.w > this.h * 1.15 ? 0.2 : 0;
    if (Math.abs(wantShift - this.shift) > 1e-4) {
      this.shift += (wantShift - this.shift) * (1 - Math.exp(-dt * 3));
      if (Math.abs(wantShift - this.shift) < 1e-3) this.shift = wantShift;
      if (this.shift > 0) cam.setViewOffset(this.w, this.h, -this.shift * this.w, 0, this.w, this.h); else cam.clearViewOffset();
      this.hot = Math.max(this.hot, 2);
    }

    // time of day glides to wherever the slider was dropped
    if (Math.abs(this.timeTarget - world.time) > 1e-3) {
      const d = this.timeTarget - world.time;
      world.setTime(Math.abs(d) < 0.01 ? this.timeTarget : world.time + d * (1 - Math.exp(-dt * 6)));
      this.hot = 2;
    }

    if (this.flight) {
      const fl = this.flight;
      fl.t = Math.min(1, fl.t + dt / fl.dur);
      const e = ease(fl.t);
      // leave through the ceiling first on the way up; arrive over the spot first on the way down
      const ey = fl.up ? 1 - Math.pow(1 - e, 1.8) : Math.pow(e, 1.8);
      const exz = fl.up ? Math.pow(e, 1.5) : 1 - Math.pow(1 - e, 1.5);
      cam.position.set(
        fl.from.pos.x + (fl.to.pos.x - fl.from.pos.x) * exz,
        fl.from.pos.y + (fl.to.pos.y - fl.from.pos.y) * ey,
        fl.from.pos.z + (fl.to.pos.z - fl.from.pos.z) * exz,
      );
      cam.quaternion.slerpQuaternions(fl.from.quat, fl.to.quat, fl.up ? Math.pow(e, 0.8) : Math.pow(e, 1.3));
      cam.fov = fl.from.fov + (fl.to.fov - fl.from.fov) * e;
      const near = cam.position.y > H + 1.5 ? 0.6 : 0.06;
      if (near !== cam.near) cam.near = near;
      cam.updateProjectionMatrix();
      const wantUpper = cam.position.y < H - 0.28;
      if (wantUpper !== world.upperVisible && !this.snap) this.crossfade(() => world.setUpper(wantUpper), 0.55);
      if (fl.t >= 1) {
        this.flight = null;
        if (this.mode === 'walk' && !world.upperVisible) world.setUpper(true);
        if (this.mode === 'doll' && world.upperVisible) world.setUpper(false);
        fl.done();
        this.syncLabels();
      }
      this.hot = 3;
    } else if (this.mode === 'walk') {
      this.stepTour(dt);
      this.stepWalk(dt);
      cam.position.set(this.pos.x, EYE, this.pos.y);
      cam.rotation.set(this.pitch, this.yaw, 0);
    } else {
      if (this.spin) { this.az += dt * 0.07; this.hot = 2; }
      this.applyDoll();
    }
    this.trackRoom(dt);
    world.update(dt, this.mode === 'walk' ? cam.position : world.centre);

    // the compare divider glides to where it was dropped
    if (this.comparing) {
      const d = this.splitTarget - this.splitCur;
      if (Math.abs(d) > 1e-4) {
        const rate = this.splitDone ? 5.5 : 9;
        this.splitCur = Math.abs(d) < 0.002 ? this.splitTarget : this.splitCur + d * (1 - Math.exp(-dt * rate));
        this.hot = Math.max(this.hot, 2);
      } else if (this.splitDone) this.splitDone();
      this.placeDivider();
    }

    if (this.fadeT < 1) {
      this.fadeT = Math.min(1, this.fadeT + dt / this.fadeDur);
      this.fade.style.opacity = String(1 - ease(this.fadeT));
      if (this.fadeT >= 1) this.fade.style.display = 'none';
      this.hot = Math.max(this.hot, 1);
    }

    if (world.dirty) { this.hot = Math.max(this.hot, 2); world.dirty = false; }
    if (this.hot <= 0 && !this.snap) return;
    this.hot--;

    const t0 = performance.now();
    cam.updateMatrixWorld();
    this.renderFrame();
    this.placeLabels();

    if (this.snap) {
      // freeze this frame on top, make the change underneath, then dissolve
      const g = this.fade.getContext('2d');
      if (g) {
        g.drawImage(this.canvas, 0, 0, this.fade.width, this.fade.height);
        this.fade.style.display = 'block';
        this.fade.style.opacity = '1';
        this.fadeT = 0;
      }
      const change = this.snap;
      this.snap = null;
      change();
      this.hot = 4;
      return;
    }

    // if the device is struggling, shed work: reflections first, then resolution
    const cost = performance.now() - t0;
    this.frames++;
    if (this.frames > 20 && rawMs < 250) this.slow = this.slow * 0.94 + (rawMs > 34 || cost > 26 ? 1 : 0) * 0.06;
    if (this.slow > 0.65 && this.frames > 90) {
      this.slow = 0; this.frames = 30;
      // shed work in the order you would least notice: AO, bloom, reflections, resolution, motion
      if (this.post && this.post.degrade()) { /* stepped down the post chain */ }
      else if (this.mirrorOn && this.world.q.mirror) this.mirrorOn = false;
      else if (this.maxDpr > 0.8) { this.maxDpr = Math.max(0.8, this.dpr * 0.82); this.resize(); }
      else this.world.animate = false;
    }
  };

  /** one finished frame: the furnished home, the bare shell, or both either side of the divider */
  renderFrame() {
    const world = this.world, cam = this.camera, r = this.renderer;
    const mirror = this.mirrorOn && this.mode === 'walk' && !this.flight;
    const s = this.splitCur;
    const both = this.comparing && s > 0.001 && s < 0.999;
    if (!both) {
      const furn = this.comparing ? s < 0.5 : this.furnishedView;
      world.setPass(furn, cam);
      world.prepare(cam, mirror);
      if (this.post) this.post.frame(); else r.render(world.scene, cam);
      return;
    }
    if (this.post) {
      world.setPass(false, cam); world.prepare(cam, mirror); this.post.keep();
      world.setPass(true, cam); world.prepare(cam, mirror); this.post.join(s);
      return;
    }
    // no post chain: draw each version straight to the screen inside its own half
    const x = Math.round(s * this.w);
    r.setScissorTest(true);
    r.setScissor(0, 0, x, this.h);
    world.setPass(false, cam); world.prepare(cam, mirror); r.render(world.scene, cam);
    r.setScissor(x, 0, this.w - x, this.h);
    world.setPass(true, cam); world.prepare(cam, mirror); r.render(world.scene, cam);
    r.setScissorTest(false);
  }

  /* ---------------------------------------------------------------- checks (used to verify the model against the plan) */

  /** clear width and depth of every room, measured between the built walls, in feet */
  measure() {
    const walls = this.world.wallSolids;
    const hit = (x: number, z: number, dx: number, dz: number) => {
      for (let d = 0; d < 12; d += 0.01) {
        const px = x + dx * d, pz = z + dz * d;
        for (const s of walls) if (px >= s[0] && px <= s[2] && pz >= s[1] && pz <= s[3]) return d;
      }
      return Infinity;
    };
    return this.plan.rooms.map((room) => {
      const [x0, y0, x1, y1] = room.r;
      // probe just inside two opposite corners, above furniture is irrelevant: walls only matter at the edges
      const probe = (fx: number, fz: number, dx: number, dz: number) => hit((x0 + (x1 - x0) * fx) * FT, (y0 + (y1 - y0) * fz) * FT, dx, dz);
      const widths = [0.04, 0.5, 0.96].map((fz) => probe(0.5, fz, -1, 0) + probe(0.5, fz, 1, 0));
      const depths = [0.04, 0.5, 0.96].map((fx) => probe(fx, 0.5, 0, -1) + probe(fx, 0.5, 0, 1));
      return { id: room.id, dims: room.dims, planW: +(x1 - x0).toFixed(2), planD: +(y1 - y0).toFixed(2), builtW: widths.map((v) => +(v / FT).toFixed(2)), builtD: depths.map((v) => +(v / FT).toFixed(2)) };
    });
  }

  /** every point on the tour path that would clip a wall or a piece of furniture */
  tourClashes() {
    const out: { leg: number; ft: [number, number] }[] = [];
    this.legs.forEach((leg, i) => {
      for (let s = 0; s <= leg.len; s += 0.08) {
        const p = leg.curve.getPointAt(s / leg.len);
        if (this.blocked(p.x, p.z, this.world.solids)) out.push({ leg: i, ft: [+(p.x / FT).toFixed(1), +(p.z / FT).toFixed(1)] });
      }
    });
    return out;
  }

  stats() {
    const i = this.renderer.info;
    return { tier: this.world.q.tier, post: this.post?.level ?? -1, tris: this.world.tris, calls: i.render.calls, frameTris: i.render.triangles, dpr: this.dpr, mirror: this.mirrorOn && this.world.q.mirror, textures: i.memory.textures, geometries: i.memory.geometries };
  }

  /** development only: put the camera anywhere (feet) */
  debugView(x: number, y: number, lx: number, ly: number, pitch = -0.05) {
    this.started = true;
    this.pos.set(x * FT, y * FT);
    this.yaw = Math.atan2(-(lx - x), -(ly - y));
    this.pitch = pitch;
    if (this.mode !== 'walk') { this.mode = 'walk'; this.world.setUpper(true); this.camera.fov = this.fovFor('walk'); this.camera.near = 0.06; this.camera.updateProjectionMatrix(); this.ev.mode?.('walk'); this.syncLabels(); }
    this.hot = 6;
  }

  /** development only: straight-down plan view for comparing against the brochure */
  debugTop() {
    this.started = true; this.spin = false;
    this.mode = 'doll'; this.world.setUpper(false);
    this.az = 0; this.pol = 0.0001; this.zoom = 1;
    this.camera.fov = this.fovFor('doll'); this.camera.near = 0.6; this.camera.updateProjectionMatrix();
    this.refit(); this.ev.mode?.('doll'); this.syncLabels();
    this.hot = 6;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('mousemove', this.onLockMove);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    document.removeEventListener('visibilitychange', this.onVis);
    if (this.canvas && document.pointerLockElement === this.canvas) document.exitPointerLock();
    this.post?.dispose();
    this.world?.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    this.canvas?.remove();
    this.fade.remove();
    this.labelLayer.replaceChildren();
  }
}
