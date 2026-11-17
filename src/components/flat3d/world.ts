import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Kit, Mats, type BuiltGroup, type Fixture, type Quality, type Rect } from './kit';
import { FT, PLANS, planBounds, type PlanDef, type PlanId } from './plans';
import { buildShell, H } from './shell';
import { furnish } from './furnish';
import { ALL_STYLES, type StyleId } from './styles';
import { aoTex, glowTex, rng } from './textures';

/** the slider runs from early morning to late evening */
export const TIME_MIN = 6.5;
export const TIME_MAX = 21;
const RISE = 6, SET = 18.5;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

type Key = [number, string];
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
/** colour ramp keyed by sun elevation in degrees */
function ramp(keys: Key[], el: number, out: THREE.Color) {
  if (el <= keys[0][0]) return out.set(keys[0][1]);
  for (let i = 1; i < keys.length; i++) {
    if (el <= keys[i][0]) {
      const t = (el - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
      return out.copy(_c1.set(keys[i - 1][1])).lerp(_c2.set(keys[i][1]), t);
    }
  }
  return out.set(keys[keys.length - 1][1]);
}

const SUN_COL: Key[] = [[0, '#ff6a24'], [5, '#ff9a4d'], [13, '#ffc78f'], [28, '#ffecd4'], [60, '#fff9ee']];
const SKY_TOP: Key[] = [[-18, '#050816'], [-6, '#16234a'], [0, '#3a5590'], [8, '#4d7cc0'], [30, '#3b78d0']];
const SKY_HOR: Key[] = [[-18, '#0c1328'], [-7, '#3a3350'], [-2, '#d0694a'], [3, '#ffa869'], [12, '#ffd9b3'], [32, '#cfe2f5']];

export function timeLabel(t: number): { clock: string; phase: string } {
  const h = Math.floor(t), m = Math.round((t - h) * 60);
  const hh = m === 60 ? h + 1 : h, mm = m === 60 ? 0 : m;
  const clock = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
  const phase = t < 7.5 ? 'Sunrise' : t < 11 ? 'Morning' : t < 15 ? 'Midday' : t < 16.75 ? 'Afternoon' : t < 18.2 ? 'Golden hour' : t < 19.1 ? 'Sunset' : t < 19.8 ? 'Dusk' : 'Night';
  return { clock, phase };
}

/**
 * Renders the room behind the camera, mirrored in the floor plane, into a small blurred
 * texture that the polished-floor material adds on top of itself.
 */
class FloorMirror {
  rt: THREE.WebGLRenderTarget;
  private cam = new THREE.PerspectiveCamera();
  private p = new THREE.Vector3(); private t = new THREE.Vector3(); private up = new THREE.Vector3();
  private rot = new THREE.Matrix4();

  constructor(renderer: THREE.WebGLRenderer) {
    const float = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float'));
    this.rt = new THREE.WebGLRenderTarget(512, 288, {
      type: float ? THREE.HalfFloatType : THREE.UnsignedByteType,
      generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true,
    });
    this.cam.layers.set(0);
  }

  setSize(w: number, h: number) {
    const s = Math.min(0.5, 880 / Math.max(w, 1));
    this.rt.setSize(Math.max(64, Math.round(w * s)), Math.max(64, Math.round(h * s)));
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, matrix: THREE.Matrix4) {
    const cam = this.cam;
    this.p.setFromMatrixPosition(camera.matrixWorld);
    this.rot.extractRotation(camera.matrixWorld);
    this.t.set(0, 0, -1).applyMatrix4(this.rot).add(this.p);
    this.up.set(0, 1, 0).applyMatrix4(this.rot);
    // reflect position, target and up through y = 0
    cam.position.set(this.p.x, -this.p.y, this.p.z);
    cam.up.set(this.up.x, -this.up.y, this.up.z);
    cam.lookAt(this.t.x, -this.t.y, this.t.z);
    cam.near = camera.near; cam.far = camera.far;
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.setRenderTarget(prev);
  }

  dispose() { this.rt.dispose(); }
}

const SKY_VERT = `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FRAG = `
uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uGround; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uNight; uniform float uStudio;
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  vec3 col = mix(uHor, uTop, pow(clamp(d.y, 0.0, 1.0), 0.5));
  col = mix(col, uGround, smoothstep(0.0, -0.3, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSunCol * (pow(s, 1100.0) * 7.0 + pow(s, 48.0) * 0.32 + pow(s, 5.0) * 0.16);
  vec3 p = floor(d * 240.0);
  float n = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  col += vec3(step(0.9972, n)) * uNight * smoothstep(0.03, 0.35, d.y);
  // dollhouse view: a quiet studio backdrop instead of the sky
  col = mix(col, mix(vec3(0.028, 0.055, 0.036), vec3(0.085, 0.14, 0.1), smoothstep(-0.7, 0.55, d.y)), uStudio);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export type SunState = { el: number; dayF: number; lampF: number };

export class FlatWorld {
  readonly scene = new THREE.Scene();
  readonly mats: Mats;
  plan!: PlanDef;
  /** metres: [x0, z0, x1, z1] of the whole flat, and its centre */
  bounds: Rect = [0, 0, 1, 1];
  readonly centre = new THREE.Vector3();
  solids: Rect[] = [];
  /** just the walls and railings — used to measure rooms against the plan */
  wallSolids: Rect[] = [];
  tris = 0;
  time: number;
  sunState: SunState = { el: 30, dayF: 1, lampF: 0 };
  upperVisible = true;
  /** true when something changed that needs a new frame */
  dirty = true;

  private groups: BuiltGroup[] = [];
  private planRoot = new THREE.Group();
  private fixtures: Fixture[] = [];
  private pool: { light: THREE.PointLight; fx: Fixture | null; level: number }[] = [];
  private sun = new THREE.DirectionalLight(0xffffff, 3);
  private hemi = new THREE.HemisphereLight(0xffffff, 0xb9a48a, 0.5);
  private sky: THREE.Mesh;
  private skyU: Record<string, { value: THREE.Color | THREE.Vector3 | number }>;
  private land = new THREE.Group();
  private landMats: THREE.MeshLambertMaterial[] = [];
  private mirror: FloorMirror | null = null;
  private glowMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.PointsMaterial;
  private glowTexture = glowTex();
  private aoMats: THREE.MeshBasicMaterial[] = [];
  private env: THREE.Texture;
  private sunDir = new THREE.Vector3(0.3, 0.8, 0.2);
  private shadowDirty = true;
  private fog = new THREE.Fog(0xcfe2f5, 70, 340);

  constructor(private renderer: THREE.WebGLRenderer, readonly q: Quality, style: StyleId, time: number) {
    this.mats = new Mats(style, q);
    this.time = time;
    const scene = this.scene;
    scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, 0.04).texture;
    room.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
    pmrem.dispose();
    scene.environment = this.env;

    // sun (or moon): one shadow-casting light for the whole home
    const sun = this.sun;
    sun.castShadow = true;
    sun.shadow.mapSize.set(q.shadow, q.shadow);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.035;
    sun.shadow.radius = q.hi ? 2.6 : 1.5;
    scene.add(sun, sun.target, this.hemi);

    for (let i = 0; i < q.lights; i++) {
      const light = new THREE.PointLight(0xffd9a8, 0, 9.5, 2);
      scene.add(light);
      this.pool.push({ light, fx: null, level: 0 });
    }

    this.skyU = {
      uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uStudio: { value: 0 },
    };
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(420, 32, 20),
      new THREE.ShaderMaterial({ uniforms: this.skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }),
    );
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    scene.add(this.sky);

    this.glowMat = new THREE.MeshBasicMaterial({
      map: this.glowTexture, color: 0xffc78a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true, fog: false,
    });
    this.haloMat = new THREE.PointsMaterial({
      map: this.glowTexture, color: 0xffd9a6, size: 0.62, sizeAttenuation: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    });

    if (q.mirror) {
      this.mirror = new FloorMirror(renderer);
      this.mats.mirror.tex.value = this.mirror.rt.texture;
    }

    this.buildLand();
    scene.add(this.planRoot);
  }

  /** the view from the windows: meadow, trees and a few distant houses, as Koppolu is today */
  private buildLand() {
    const r = rng(77);
    const ground = new THREE.MeshLambertMaterial({ color: 0x4f6a36 });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(520, 40), ground);
    disc.rotation.x = -Math.PI / 2; disc.position.y = -10.4;
    this.land.add(disc);
    this.landMats.push(ground);

    const canopy = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const trunk = new THREE.MeshLambertMaterial({ color: 0x5a4532 });
    const house = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.landMats.push(canopy, trunk, house);
    const nT = this.q.hi ? 300 : 150, nH = this.q.hi ? 70 : 36;
    const tops = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), canopy, nT);
    const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.24, 1, 5), trunk, nT);
    const houses = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), house, nH);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    for (let i = 0; i < nT; i++) {
      const a = r() * Math.PI * 2, d = 20 + Math.pow(r(), 1.6) * 300;
      const h = 4 + r() * 5, w = 1.8 + r() * 2.2;
      p.set(Math.cos(a) * d, -10.4 + h * 0.5, Math.sin(a) * d);
      m.compose(p, q, s.set(0.9, h, 0.9)); stems.setMatrixAt(i, m);
      p.y = -10.4 + h + w * 0.35;
      m.compose(p, q, s.set(w, w * (0.8 + r() * 0.5), w)); tops.setMatrixAt(i, m);
      tops.setColorAt(i, col.setHSL(0.27 + r() * 0.08, 0.42 + r() * 0.2, 0.1 + r() * 0.1));
    }
    const palette = [0xe9dcc4, 0xd9c4a5, 0xf1ece2, 0xc9a583, 0xdfe3e6];
    for (let i = 0; i < nH; i++) {
      const a = r() * Math.PI * 2, d = 45 + r() * 260;
      const w = 6 + r() * 8, h = 3.2 + r() * (r() < 0.2 ? 12 : 4.5), dd = 6 + r() * 8;
      p.set(Math.cos(a) * d, -10.4 + h / 2, Math.sin(a) * d);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * Math.PI);
      m.compose(p, q, s.set(w, h, dd)); houses.setMatrixAt(i, m);
      houses.setColorAt(i, col.set(palette[(r() * palette.length) | 0]));
    }
    q.identity();
    for (const im of [tops, stems, houses]) { im.frustumCulled = false; this.land.add(im); }
    this.scene.add(this.land);
  }

  /** build (or rebuild) the home for one of the two plans */
  build(id: PlanId) {
    this.disposePlan();
    const plan = (this.plan = PLANS[id]);
    const kit = new Kit(this.q.hi ? 1 : 0.62);
    buildShell(kit, plan);
    this.wallSolids = kit.solids.slice();
    furnish(kit, plan);
    this.groups = kit.build(this.mats);
    this.tris = kit.tris;
    this.solids = kit.solids;
    this.fixtures = kit.fixtures;
    for (const g of this.groups) this.planRoot.add(g.group);

    const b = planBounds(plan);
    const e = plan.entry.r;
    const all: Rect = [Math.min(b[0], e[0]) * FT - 0.6, Math.min(b[1], e[1]) * FT - 0.6, Math.max(b[2], e[2]) * FT + 0.6, Math.max(b[3], e[3]) * FT + 0.6];
    this.bounds = [b[0] * FT, b[1] * FT, b[2] * FT, b[3] * FT];
    this.centre.set((this.bounds[0] + this.bounds[2]) / 2, 0, (this.bounds[1] + this.bounds[3]) / 2);
    this.land.position.set(this.centre.x, 0, this.centre.z);
    this.sky.position.copy(this.centre);

    // contact shadows painted over the floor, and wall shading under the ceiling
    const size = this.q.hi ? 1024 : 512;
    const overlay = (rects: typeof kit.ao, y: number, down: boolean, upper: boolean) => {
      const tex = aoTex(rects, all, size);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.MultiplyBlending, depthWrite: false, toneMapped: false, fog: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(all[2] - all[0], all[3] - all[1]), mat);
      mesh.rotation.x = down ? Math.PI / 2 : -Math.PI / 2;
      // the canvas' top row is the plan's low-z edge either way up
      if (down) mesh.scale.y = -1;
      mesh.position.set((all[0] + all[2]) / 2, y, (all[1] + all[3]) / 2);
      mesh.layers.set(1);
      mesh.renderOrder = 2;
      this.aoMats.push(mat);
      this.planRoot.add(mesh);
      if (upper) this.groups.push({ group: mesh as unknown as THREE.Group, upper: true, style: null });
    };
    overlay(kit.ao, 0.0065, false, false);
    overlay(kit.aoWalls, H - 0.004, true, true);

    // pools of lamplight, and a soft halo round every bulb
    if (kit.glows.length) {
      const geos = kit.glows.map((g) => {
        const geo = new THREE.PlaneGeometry(g.r * 2, g.r * 2);
        geo.rotateX(g.up ? -Math.PI / 2 : Math.PI / 2);
        geo.translate(g.x, g.y, g.z);
        const c = new Float32Array(12).fill(g.k);
        geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
        return geo;
      });
      const merged = mergeAll(geos);
      const mesh = new THREE.Mesh(merged, this.glowMat);
      mesh.layers.set(1); mesh.renderOrder = 3;
      this.planRoot.add(mesh);
    }
    if (kit.halos.length) {
      const pos = new Float32Array(kit.halos.length * 3);
      kit.halos.forEach((h, i) => pos.set([h.x, h.y, h.z], i * 3));
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, this.haloMat);
      pts.renderOrder = 6; pts.frustumCulled = false;
      this.planRoot.add(pts);
    }

    // fit the sun's shadow box to this flat
    const half = Math.hypot(all[2] - all[0], all[3] - all[1]) / 2 + 1;
    const cam = this.sun.shadow.camera;
    cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = 90;
    cam.updateProjectionMatrix();
    this.sun.target.position.set(this.centre.x, 0.8, this.centre.z);

    for (const p of this.pool) { p.fx = null; p.level = 0; p.light.intensity = 0; }
    this.applyVisibility();
    this.setTime(this.time, true);
    this.dirty = true;
  }

  private applyVisibility() {
    for (const g of this.groups) g.group.visible = (!g.upper || this.upperVisible) && (!g.style || g.style === this.mats.style);
    this.shadowDirty = true;
    this.dirty = true;
  }

  setStyle(style: StyleId) {
    this.mats.apply(style);
    this.applyVisibility();
  }

  /** paint the other styles' textures in the background, one per call */
  warmNext(): boolean {
    for (const s of ALL_STYLES) {
      if (s === this.mats.style || this.warmed.has(s)) continue;
      this.mats.warm(s);
      this.warmed.add(s);
      return true;
    }
    return false;
  }
  private warmed = new Set<StyleId>();

  /** the ceiling and the top of the walls lift off for the dollhouse view */
  setUpper(v: boolean) {
    if (this.upperVisible === v) return;
    this.upperVisible = v;
    this.land.visible = v;
    this.skyU.uStudio.value = v ? 0 : 1;
    this.applyVisibility();
  }

  setTime(t: number, force = false) {
    t = clamp(t, TIME_MIN, TIME_MAX);
    if (!force && Math.abs(t - this.time) < 1e-4) return;
    this.time = t;
    const frac = (t - RISE) / (SET - RISE);
    const el = frac >= 0 && frac <= 1 ? Math.sin(Math.PI * frac) * 60 : -Math.min((frac < 0 ? -frac : frac - 1) * (SET - RISE) * 12, 45);
    const dayF = smooth(-6, 12, el), lampF = 1 - smooth(-3, 9, el), night = 1 - smooth(-12, -2, el);
    this.sunState = { el, dayF, lampF };

    // east (−z) → south (+x) → west (+z), leaning south like the cool-season sun
    const a = Math.PI * clamp(frac, 0, 1);
    const e = (Math.max(el, 0.8) * Math.PI) / 180;
    const hx = Math.sin(a) + 0.42, hz = -Math.cos(a), hl = Math.hypot(hx, hz);
    const sunDir = this.sunDir.set((hx / hl) * Math.cos(e), Math.sin(e), (hz / hl) * Math.cos(e));
    const sunCol = ramp(SUN_COL, el, new THREE.Color());
    const T = this.tune;
    const sunI = smooth(-0.6, 9, el) * T.sun;
    const moonI = smooth(-3, -11, el) * T.moon;
    const sun = this.sun;
    if (el > -1.5) { sun.color.copy(sunCol); sun.intensity = sunI; sun.position.copy(sunDir); }
    else { sun.color.set(0x93a9de); sun.intensity = moonI; sun.position.set(0.42, 0.8, -0.44).normalize(); }
    sun.position.multiplyScalar(45).add(sun.target.position);

    ramp(SKY_TOP, el, this.skyU.uTop.value as THREE.Color);
    const hor = ramp(SKY_HOR, el, this.skyU.uHor.value as THREE.Color);
    (this.skyU.uGround.value as THREE.Color).copy(hor).multiplyScalar(0.55).lerp(_c1.set(0x51603d), 0.35 * dayF);
    (this.skyU.uSunDir.value as THREE.Vector3).copy(sunDir);
    (this.skyU.uSunCol.value as THREE.Color).copy(sunCol).multiplyScalar(smooth(-4, 3, el));
    this.skyU.uNight.value = night;
    this.fog.color.copy(hor);

    this.hemi.color.copy(hor).lerp(_c1.set(0xffffff), 0.45);
    this.hemi.groundColor.set(0xb9a48a).multiplyScalar(0.3 + 0.7 * dayF);
    this.hemi.intensity = T.hemiNight + T.hemi * dayF;
    this.scene.environmentIntensity = T.envNight + T.env * dayF;

    this.mats.setLamp(lampF);
    this.glowMat.opacity = lampF * T.glow;
    this.haloMat.opacity = 0.1 + lampF * 0.8;
    this.winCol.copy(hor).lerp(_c1.set(0xffffff), 0.55);
    this.shadowDirty = true;
    this.dirty = true;
  }
  private winCol = new THREE.Color();
  /** overall light balance — one place to grade the whole home */
  tune = { sun: 6, moon: 0.34, hemi: 0.26, hemiNight: 0.05, env: 0.22, envNight: 0.06, win: 1.6, ceil: 1.25, lamp: 1, glow: 0.34 };

  private level(fx: Fixture): number {
    const { dayF, lampF } = this.sunState;
    switch (fx.kind) {
      case 'window': return fx.power * dayF * this.tune.win;
      case 'ceiling': return fx.power * lampF * this.tune.ceil;
      case 'lamp': return fx.power * lampF * this.tune.lamp;
      default: return fx.power * (0.5 + 0.5 * lampF);
    }
  }

  /** hand the few real lights to whichever lamps and windows matter most near `focus` */
  update(dt: number, focus: THREE.Vector3) {
    const fxs = this.fixtures;
    const want: { fx: Fixture; score: number }[] = [];
    for (const fx of fxs) {
      const lv = this.level(fx);
      if (lv < 0.02) continue;
      const d2 = (fx.x - focus.x) ** 2 + (fx.z - focus.z) ** 2 + (fx.y - focus.y) ** 2 * 0.3;
      want.push({ fx, score: lv / (d2 + 2.5) });
    }
    want.sort((p, q) => q.score - p.score);
    const chosen = new Set(want.slice(0, this.pool.length).map((w) => w.fx));
    const held = new Set<Fixture>();
    for (const p of this.pool) if (p.fx && chosen.has(p.fx)) held.add(p.fx);
    const k = 1 - Math.exp(-dt * 5);
    let moving = false;
    for (const p of this.pool) {
      let target = 0;
      if (p.fx && chosen.has(p.fx)) target = 1;
      else if (p.level < 0.02) {
        // free: take the best fixture nobody holds yet
        p.fx = null;
        for (const w of want) {
          if (!chosen.has(w.fx)) break;
          if (!held.has(w.fx)) { p.fx = w.fx; held.add(w.fx); break; }
        }
        if (p.fx) { p.light.position.set(p.fx.x, p.fx.y, p.fx.z); target = 1; }
      }
      const next = p.level + (target - p.level) * k;
      if (Math.abs(next - p.level) > 1e-3) moving = true;
      p.level = Math.abs(target - next) < 1e-3 ? target : next;
      if (p.fx) {
        p.light.intensity = this.level(p.fx) * p.level;
        if (p.fx.kind === 'window') p.light.color.copy(this.winCol); else p.light.color.setHex(p.fx.color);
      } else p.light.intensity = 0;
    }
    if (moving) this.dirty = true;
  }

  setSize(w: number, h: number) { this.mirror?.setSize(w, h); }

  /** call right before the main render */
  prepare(camera: THREE.PerspectiveCamera, mirrorOn: boolean) {
    if (this.shadowDirty) { this.renderer.shadowMap.needsUpdate = true; this.shadowDirty = false; }
    const use = !!this.mirror && mirrorOn;
    this.mats.mirror.on.value = use ? 1 : 0;
    if (use) this.mirror!.render(this.renderer, this.scene, camera, this.mats.mirror.matrix.value);
  }

  private disposePlan() {
    this.planRoot.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    for (const m of this.aoMats) { m.map?.dispose(); m.dispose(); }
    this.aoMats = [];
    this.planRoot.clear();
    this.groups = [];
  }

  dispose() {
    this.disposePlan();
    this.mats.dispose();
    this.mirror?.dispose();
    this.env.dispose();
    this.glowTexture.dispose();
    this.glowMat.dispose(); this.haloMat.dispose();
    this.sun.shadow.map?.dispose();
    (this.sky.material as THREE.Material).dispose(); this.sky.geometry.dispose();
    this.land.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
    });
    for (const m of this.landMats) m.dispose();
  }
}

function mergeAll(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const n = geos.reduce((s, g) => s + g.attributes.position.count, 0);
  const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
  const idx: number[] = [];
  let o = 0;
  for (const g of geos) {
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    uv.set(g.attributes.uv.array as Float32Array, o * 2);
    col.set(g.attributes.color.array as Float32Array, o * 3);
    const gi = g.index!;
    for (let i = 0; i < gi.count; i++) idx.push(gi.getX(i) + o);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(idx);
  return out;
}
