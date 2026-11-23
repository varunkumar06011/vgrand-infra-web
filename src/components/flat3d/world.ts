import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Kit, LAYER, Mats, type BuiltGroup, type Fixture, type Quality, type Rect } from './kit';
import { Town } from './outdoor';
import { FT, PLANS, planBounds, type PlanDef, type PlanId } from './plans';
import { buildShell, H } from './shell';
import { furnish } from './furnish';
import { ALL_STYLES, type StyleId } from './styles';
import { aoTex, glowTex } from './textures';

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
    this.cam.layers.set(LAYER.shell);
  }

  setSize(w: number, h: number) {
    const s = Math.min(0.5, 880 / Math.max(w, 1));
    this.rt.setSize(Math.max(64, Math.round(w * s)), Math.max(64, Math.round(h * s)));
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, matrix: THREE.Matrix4, furnished = true) {
    const cam = this.cam;
    cam.layers.set(LAYER.shell);
    if (furnished) cam.layers.enable(LAYER.furn);
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
uniform float uTime; uniform vec3 uCloudLit; uniform vec3 uCloudShade;
varying vec3 vDir;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; } return v; }
void main(){
  vec3 d = normalize(vDir);
  vec3 col = mix(uHor, uTop, pow(clamp(d.y, 0.0, 1.0), 0.5));
  col = mix(col, uGround, smoothstep(0.0, -0.3, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  col += uSunCol * (pow(s, 1400.0) * 14.0 + pow(s, 64.0) * 0.22 + pow(s, 6.0) * 0.08);
  // fair-weather cumulus over the coast, drifting slowly inland
  if (d.y > 0.0) {
    vec2 uv = d.xz / (d.y + 0.08) * 0.9 + vec2(uTime * 0.0035, uTime * 0.0012);
    float c = fbm(uv * 1.6);
    float m = smoothstep(0.5, 0.78, c) * smoothstep(0.0, 0.14, d.y);
    float lit = 0.55 + 0.45 * smoothstep(0.35, 0.85, fbm(uv * 1.6 + uSunDir.xz * 0.12));
    vec3 cc = mix(uCloudShade, uCloudLit, lit) + uSunCol * pow(s, 8.0) * 0.4;
    col = mix(col, cc, m * 0.92);
  }
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

/** ceiling fan: hub, motor bowl and three blades, built round the origin with the blades in y = 0 */
function fanGeos(): { blades: THREE.BufferGeometry; body: THREE.BufferGeometry } {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const b = new THREE.BoxGeometry(0.56, 0.012, 0.12, 4, 1, 1);
    // a slight taper and twist down the blade
    const p = b.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), t = (x + 0.28) / 0.56;
      p.setZ(j, p.getZ(j) * (1 + 0.35 * t));
      p.setY(j, p.getY(j) + p.getZ(j) * 0.18);
    }
    b.translate(0.42, 0, 0);
    b.rotateY((i / 3) * Math.PI * 2);
    parts.push(b);
  }
  const body: THREE.BufferGeometry[] = [];
  const bowl = new THREE.CylinderGeometry(0.11, 0.08, 0.09, 20); bowl.translate(0, 0.02, 0); body.push(bowl);
  const cap = new THREE.CylinderGeometry(0.05, 0.11, 0.03, 20); cap.translate(0, 0.08, 0); body.push(cap);
  const rod = new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8); rod.translate(0, 0.27, 0); body.push(rod);
  const canopy = new THREE.CylinderGeometry(0.045, 0.06, 0.06, 16); canopy.translate(0, 0.45, 0); body.push(canopy);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.BoxGeometry(0.16, 0.014, 0.03); arm.translate(0.16, 0, 0); arm.rotateY((i / 3) * Math.PI * 2); body.push(arm);
  }
  const merge = (gs: THREE.BufferGeometry[]) => {
    const g = mergeGeometries(gs.map((x) => x.index ? x.toNonIndexed() : x), false)!;
    gs.forEach((x) => x.dispose());
    g.computeVertexNormals();
    return g;
  };
  return { blades: merge(parts), body: merge(body) };
}

export class FlatWorld {
  readonly scene = new THREE.Scene();
  readonly mats: Mats;
  plan!: PlanDef;
  /** metres: [x0, z0, x1, z1] of the whole flat, and its centre */
  bounds: Rect = [0, 0, 1, 1];
  readonly centre = new THREE.Vector3();
  /** structure: walls, railings, built-in counters */
  shellSolids: Rect[] = [];
  /** furniture: walk straight through it in the bare-shell view */
  furnSolids: Rect[] = [];
  /** just the walls and railings — used to measure rooms against the plan */
  wallSolids: Rect[] = [];
  tris = 0;
  time: number;
  sunState: SunState = { el: 30, dayF: 1, lampF: 0 };
  upperVisible = true;
  /** whole view furnished (false = the bare shell the builder hands over) */
  furnished = true;
  /** both versions are on screen at once (compare slider) */
  comparing = false;
  /** true when something changed that needs a new frame */
  dirty = true;
  /** fans turn and clouds drift */
  animate: boolean;

  private groups: BuiltGroup[] = [];
  private planRoot = new THREE.Group();
  private fixtures: Fixture[] = [];
  private pool: { light: THREE.PointLight; fx: Fixture | null; level: number }[] = [];
  private areas: { light: THREE.RectAreaLight; fx: Fixture | null; level: number }[] = [];
  /** the sun as the furnished home sees it, and as the bare shell does — one is lit per pass */
  private sun = new THREE.DirectionalLight(0xffffff, 3);
  private sunBare = new THREE.DirectionalLight(0xffffff, 3);
  private hemi = new THREE.HemisphereLight(0xffffff, 0xb9a48a, 0.5);
  private sky: THREE.Mesh;
  private skyU: Record<string, { value: THREE.Color | THREE.Vector3 | number }>;
  private towns = new Map<PlanId, Town>();
  private town: Town | null = null;
  private mirror: FloorMirror | null = null;
  private glowMat: THREE.MeshBasicMaterial;
  private haloMat: THREE.PointsMaterial;
  private glowTexture = glowTex();
  private aoMats: THREE.MeshBasicMaterial[] = [];
  private env: THREE.Texture;
  private sunDir = new THREE.Vector3(0.3, 0.8, 0.2);
  private shadowDirty = { furn: true, bare: true };
  private fog = new THREE.Fog(0xcfe2f5, 80, 950);
  private fanGeo = fanGeos();
  private fanMeshes: THREE.InstancedMesh[] = [];
  private fanList: { x: number; y: number; z: number; phase: number }[] = [];
  private fanAngle = 0;
  private passFurn = true;

  constructor(private renderer: THREE.WebGLRenderer, readonly q: Quality, style: StyleId, time: number) {
    this.mats = new Mats(style, q);
    this.time = time;
    this.animate = q.animate;
    const scene = this.scene;
    scene.fog = this.fog;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.env = pmrem.fromScene(room, 0.04).texture;
    room.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); (m.material as THREE.Material).dispose(); } });
    pmrem.dispose();
    scene.environment = this.env;

    // sun (or moon): one shadow-casting light for the whole home. Its twin sees only the shell.
    for (const sun of [this.sun, this.sunBare]) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(q.shadow, q.shadow);
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.03;
      sun.shadow.radius = q.hi ? 3 : 1.5;
      scene.add(sun, sun.target);
    }
    this.sun.shadow.camera.layers.enableAll();
    this.sunBare.shadow.camera.layers.set(LAYER.shell);
    this.sunBare.shadow.camera.layers.enable(LAYER.shellFlat);
    this.sunBare.visible = false;
    this.sunBare.target = this.sun.target;
    scene.add(this.hemi);

    for (let i = 0; i < q.lights; i++) {
      const light = new THREE.PointLight(0xffd9a8, 0, 9.5, 2);
      scene.add(light);
      this.pool.push({ light, fx: null, level: 0 });
    }
    if (q.area && areaReady) {
      for (let i = 0; i < (q.tier >= 3 ? 3 : 2); i++) {
        const light = new THREE.RectAreaLight(0xffffff, 0, 1, 1);
        scene.add(light);
        this.areas.push({ light, fx: null, level: 0 });
      }
    }

    this.skyU = {
      uTop: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGround: { value: new THREE.Color() },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uNight: { value: 0 }, uStudio: { value: 0 },
      uTime: { value: 0 }, uCloudLit: { value: new THREE.Color() }, uCloudShade: { value: new THREE.Color() },
    };
    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(420, 40, 24),
      new THREE.ShaderMaterial({ uniforms: this.skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false }),
    );
    this.sky.renderOrder = -10;
    this.sky.frustumCulled = false;
    this.sky.userData.noAO = true;
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
    scene.add(this.planRoot);
  }

  /** the furnished home, or just the shell — what the solid geometry is right now */
  get solids(): Rect[] {
    return this.furnished || this.comparing ? this.allSolids : this.shellSolids;
  }
  private allSolids: Rect[] = [];

  /** build (or rebuild) the home for one of the two plans */
  build(id: PlanId) {
    this.disposePlan();
    const plan = (this.plan = PLANS[id]);
    const kit = new Kit(this.q.hi ? 1 : this.q.tier === 1 ? 0.75 : 0.6);
    buildShell(kit, plan);
    this.wallSolids = kit.solids.slice();
    kit.fit(true, () => furnish(kit, plan));
    this.groups = kit.build(this.mats);
    this.tris = kit.tris;
    this.shellSolids = kit.solids;
    this.furnSolids = kit.furnSolids;
    this.allSolids = [...kit.solids, ...kit.furnSolids];
    this.fixtures = kit.fixtures;
    for (const g of this.groups) this.planRoot.add(g.group);

    const b = planBounds(plan);
    const e = plan.entry.r;
    const all: Rect = [Math.min(b[0], e[0]) * FT - 0.6, Math.min(b[1], e[1]) * FT - 0.6, Math.max(b[2], e[2]) * FT + 0.6, Math.max(b[3], e[3]) * FT + 0.6];
    this.bounds = [b[0] * FT, b[1] * FT, b[2] * FT, b[3] * FT];
    this.centre.set((this.bounds[0] + this.bounds[2]) / 2, 0, (this.bounds[1] + this.bounds[3]) / 2);
    this.sky.position.copy(this.centre);

    // the town outside, built once per plan (the tower below follows the floor plate)
    if (this.town) this.scene.remove(this.town.group);
    let town = this.towns.get(id);
    if (!town) {
      town = new Town(this.q, plan.slabs.map((s) => [s[0] * FT, s[1] * FT, s[2] * FT, s[3] * FT] as Rect));
      // the town is far beyond the reach of ambient occlusion; leaving it out of that pass saves its triangles twice
      town.group.traverse((o) => { o.userData.noAO = true; });
      this.towns.set(id, town);
    }
    this.town = town;
    town.group.visible = this.upperVisible;
    this.scene.add(town.group);

    // contact shadows painted over the floor, and wall shading under the ceiling
    const size = this.q.hi ? 1024 : 512;
    const overlay = (rects: typeof kit.ao, y: number, down: boolean, upper: boolean, layer: number) => {
      const tex = aoTex(rects, all, size);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.MultiplyBlending, depthWrite: false, toneMapped: false, fog: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(all[2] - all[0], all[3] - all[1]), mat);
      mesh.rotation.x = down ? Math.PI / 2 : -Math.PI / 2;
      // the canvas' top row is the plan's low-z edge either way up
      if (down) mesh.scale.y = -1;
      mesh.position.set((all[0] + all[2]) / 2, y, (all[1] + all[3]) / 2);
      mesh.layers.set(layer);
      mesh.renderOrder = 2;
      mesh.userData.noAO = true;
      this.aoMats.push(mat);
      this.planRoot.add(mesh);
      if (upper) this.groups.push({ group: mesh as unknown as THREE.Group, upper: true, style: null, furn: false });
    };
    overlay(kit.ao, 0.0065, false, false, LAYER.shellFlat);
    if (kit.aoFurn.length) overlay(kit.aoFurn, 0.007, false, false, LAYER.furnFlat);
    overlay(kit.aoWalls, H - 0.004, true, true, LAYER.shellFlat);

    // pools of lamplight, and a soft halo round every bulb
    for (const furn of [false, true]) {
      const glows = kit.glows.filter((g) => g.furn === furn);
      if (glows.length) {
        const geos = glows.map((g) => {
          const geo = new THREE.PlaneGeometry(g.r * 2, g.r * 2);
          geo.rotateX(g.up ? -Math.PI / 2 : Math.PI / 2);
          geo.translate(g.x, g.y, g.z);
          const c = new Float32Array(12).fill(g.k);
          geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
          return geo;
        });
        const mesh = new THREE.Mesh(mergeAll(geos), this.glowMat);
        mesh.layers.set(furn ? LAYER.furnFlat : LAYER.shellFlat); mesh.renderOrder = 3;
        mesh.userData.noAO = true;
        this.planRoot.add(mesh);
      }
      const halos = kit.halos.filter((h) => h.furn === furn);
      if (halos.length) {
        const pos = new Float32Array(halos.length * 3);
        halos.forEach((h, i) => pos.set([h.x, h.y, h.z], i * 3));
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, this.haloMat);
        pts.renderOrder = 6; pts.frustumCulled = false;
        pts.layers.set(furn ? LAYER.furn : LAYER.shell);
        this.planRoot.add(pts);
      }
    }

    // ceiling fans: instanced so they can turn without touching the merged home
    this.fanList = kit.fans.map((f) => ({ x: f.x, y: f.y, z: f.z, phase: f.phase }));
    if (this.fanList.length) {
      for (const [geo, slot] of [[this.fanGeo.blades, 'fanBlade'], [this.fanGeo.body, 'fanBody']] as const) {
        const im = new THREE.InstancedMesh(geo, this.mats.get(slot), this.fanList.length);
        im.layers.set(LAYER.furn);
        im.frustumCulled = false;
        im.castShadow = false; im.receiveShadow = true;
        this.fanMeshes.push(im);
        this.planRoot.add(im);
      }
      this.placeFans();
    }

    // fit the sun's shadow box to this flat
    const half = Math.hypot(all[2] - all[0], all[3] - all[1]) / 2 + 1;
    for (const sun of [this.sun, this.sunBare]) {
      const cam = sun.shadow.camera;
      cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 1; cam.far = 90;
      cam.updateProjectionMatrix();
    }
    this.sun.target.position.set(this.centre.x, 0.8, this.centre.z);

    for (const p of this.pool) { p.fx = null; p.level = 0; p.light.intensity = 0; }
    for (const p of this.areas) { p.fx = null; p.level = 0; p.light.intensity = 0; }
    this.applyVisibility();
    this.setTime(this.time, true);
    this.dirty = true;
  }

  private placeFans() {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    this.fanList.forEach((f, i) => {
      q.setFromAxisAngle(up, this.fanAngle + f.phase);
      m.compose(p.set(f.x, f.y, f.z), q, s);
      for (const im of this.fanMeshes) im.setMatrixAt(i, m);
    });
    for (const im of this.fanMeshes) im.instanceMatrix.needsUpdate = true;
  }

  private applyVisibility() {
    for (const g of this.groups) g.group.visible = (!g.upper || this.upperVisible) && (!g.style || g.style === this.mats.style);
    for (const im of this.fanMeshes) im.visible = this.upperVisible;
    this.shadowDirty.furn = this.shadowDirty.bare = true;
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
    if (this.town) this.town.group.visible = v;
    this.skyU.uStudio.value = v ? 0 : 1;
    this.applyVisibility();
  }

  /** furnished home or bare shell (outside the compare view) */
  setFurnished(v: boolean) {
    if (this.furnished === v) return;
    this.furnished = v;
    this.dirty = true;
  }

  /**
   * Point the camera (and the lights, shadows and reflection) at one version of the home.
   * Called before each render; the compare view renders twice, once per version.
   */
  setPass(furnished: boolean, camera: THREE.Camera) {
    this.passFurn = furnished;
    camera.layers.set(LAYER.shell);
    camera.layers.enable(LAYER.shellFlat);
    if (furnished) { camera.layers.enable(LAYER.furn); camera.layers.enable(LAYER.furnFlat); }
    this.sun.visible = furnished;
    this.sunBare.visible = !furnished;
    for (const p of this.pool) if (p.fx?.furn) p.light.intensity = furnished ? this.level(p.fx) * p.level : 0;
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
    for (const sun of [this.sun, this.sunBare]) {
      if (el > -1.5) { sun.color.copy(sunCol); sun.intensity = sunI; sun.position.copy(sunDir); }
      else { sun.color.set(0x93a9de); sun.intensity = moonI; sun.position.set(0.42, 0.8, -0.44).normalize(); }
      sun.position.multiplyScalar(45).add(this.sun.target.position);
    }

    ramp(SKY_TOP, el, this.skyU.uTop.value as THREE.Color);
    const hor = ramp(SKY_HOR, el, this.skyU.uHor.value as THREE.Color);
    (this.skyU.uGround.value as THREE.Color).copy(hor).multiplyScalar(0.55).lerp(_c1.set(0x51603d), 0.35 * dayF);
    (this.skyU.uSunDir.value as THREE.Vector3).copy(sunDir);
    (this.skyU.uSunCol.value as THREE.Color).copy(sunCol).multiplyScalar(smooth(-4, 3, el));
    this.skyU.uNight.value = night;
    // clouds: bright white by day, peach and rose at the ends of the day, slate at night
    const cl = this.skyU.uCloudLit.value as THREE.Color, cs = this.skyU.uCloudShade.value as THREE.Color;
    cl.copy(sunCol).lerp(_c1.set(0xffffff), smooth(4, 30, el)).multiplyScalar(0.25 + 1.15 * dayF);
    cs.copy(hor).lerp(_c1.set(0x9aa6b8), 0.5).multiplyScalar(0.18 + 0.72 * dayF);
    this.fog.color.copy(hor).lerp(_c1.set(0xd8e4ee), 0.3 * dayF);

    this.hemi.color.copy(hor).lerp(_c1.set(0xffffff), 0.45);
    this.hemi.groundColor.set(0xb9a48a).multiplyScalar(0.3 + 0.7 * dayF);
    this.hemi.intensity = T.hemiNight + T.hemi * dayF;
    this.scene.environmentIntensity = T.envNight + T.env * dayF;

    this.mats.setLamp(lampF);
    this.glowMat.opacity = lampF * T.glow;
    this.haloMat.opacity = 0.1 + lampF * 0.8;
    this.winCol.copy(hor).lerp(_c1.set(0xffffff), 0.55);
    this.town?.setLight(lampF, this.glowTexture);
    for (const ar of this.areas) ar.light.color.copy(this.winCol).lerp(sunCol, 0.25);
    this.shadowDirty.furn = this.shadowDirty.bare = true;
    this.dirty = true;
  }
  private winCol = new THREE.Color();
  /** overall light balance — one place to grade the whole home */
  tune = { sun: 6, moon: 0.34, hemi: 0.2, hemiNight: 0.05, env: 0.45, envNight: 0.08, win: 1.6, ceil: 1.25, lamp: 1, glow: 0.34, area: 1.5 };

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
    const allowFurn = this.furnished || this.comparing;
    const want: { fx: Fixture; score: number }[] = [];
    for (const fx of fxs) {
      if (fx.furn && !allowFurn) continue;
      const lv = this.level(fx);
      if (lv < 0.02) continue;
      const d2 = (fx.x - focus.x) ** 2 + (fx.z - focus.z) ** 2 + (fx.y - focus.y) ** 2 * 0.3;
      want.push({ fx, score: lv / (d2 + 2.5) });
    }
    want.sort((p, q) => q.score - p.score);
    let moving = this.assign(this.pool, want, dt, (p) => {
      p.light.position.set(p.fx!.x, p.fx!.y, p.fx!.z);
    }, (p, lv) => {
      p.light.intensity = (!this.passFurn && p.fx!.furn) ? 0 : lv;
      if (p.fx!.kind === 'window') p.light.color.copy(this.winCol); else p.light.color.setHex(p.fx!.color);
    });
    if (this.areas.length) {
      // soft daylight panels: only real windows, scored by how much sky they let in and how close they are
      const wins = want.filter((w) => w.fx.kind === 'window' && w.fx.w);
      moving = this.assign(this.areas, wins, dt, (p) => {
        const fx = p.fx!;
        p.light.width = fx.w!; p.light.height = fx.h!;
        p.light.position.set(fx.x, fx.y, fx.z);
        p.light.lookAt(fx.x + fx.nx!, fx.y, fx.z + fx.nz!);
      }, (p, lv) => { p.light.intensity = (lv / Math.max(0.3, p.fx!.power)) * this.tune.area * this.sunState.dayF; }) || moving;
    }
    if (this.animate && this.fanMeshes.length && this.upperVisible && (this.furnished || this.comparing)) {
      this.fanAngle = (this.fanAngle + dt * 5.2) % (Math.PI * 2);
      this.placeFans();
      moving = true;
    }
    if (this.animate && this.upperVisible) (this.skyU.uTime as { value: number }).value += dt;
    if (moving) this.dirty = true;
  }

  /** keep lights on the fixtures that still matter; free lights fade out, then move to the next best */
  private assign<P extends { fx: Fixture | null; level: number }>(pool: P[], want: { fx: Fixture; score: number }[], dt: number, place: (p: P) => void, set: (p: P, level: number) => void) {
    const chosen = new Set(want.slice(0, pool.length).map((w) => w.fx));
    const held = new Set<Fixture>();
    for (const p of pool) if (p.fx && chosen.has(p.fx)) held.add(p.fx);
    const k = 1 - Math.exp(-dt * 5);
    let moving = false;
    for (const p of pool) {
      let target = 0;
      if (p.fx && chosen.has(p.fx)) target = 1;
      else if (p.level < 0.02) {
        p.fx = null;
        for (const w of want) {
          if (!chosen.has(w.fx)) break;
          if (!held.has(w.fx)) { p.fx = w.fx; held.add(w.fx); break; }
        }
        if (p.fx) { place(p); target = 1; }
      }
      const next = p.level + (target - p.level) * k;
      if (Math.abs(next - p.level) > 1e-3) moving = true;
      p.level = Math.abs(target - next) < 1e-3 ? target : next;
      if (p.fx) set(p, this.level(p.fx) * p.level);
      else (p as unknown as { light: THREE.Light }).light.intensity = 0;
    }
    return moving;
  }

  setSize(w: number, h: number) { this.mirror?.setSize(w, h); }

  /** call right before each render (after setPass when comparing) */
  prepare(camera: THREE.PerspectiveCamera, mirrorOn: boolean) {
    const key = this.passFurn ? 'furn' : 'bare';
    if (this.shadowDirty[key]) { this.renderer.shadowMap.needsUpdate = true; this.shadowDirty[key] = false; }
    const use = !!this.mirror && mirrorOn;
    this.mats.mirror.on.value = use ? 1 : 0;
    if (use) this.mirror!.render(this.renderer, this.scene, camera, this.mats.mirror.matrix.value, this.passFurn);
  }

  private disposePlan() {
    this.planRoot.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry && m.geometry !== this.fanGeo.blades && m.geometry !== this.fanGeo.body) m.geometry.dispose();
    });
    for (const im of this.fanMeshes) im.dispose();
    this.fanMeshes = [];
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
    this.sunBare.shadow.map?.dispose();
    (this.sky.material as THREE.Material).dispose(); this.sky.geometry.dispose();
    for (const t of this.towns.values()) t.dispose();
    this.fanGeo.blades.dispose(); this.fanGeo.body.dispose();
  }
}

/** RectAreaLight needs its lookup tables loaded before any material compiles */
let areaReady = false;
export async function preloadWorld(q: Quality) {
  if (!q.area || areaReady) return;
  const { RectAreaLightUniformsLib } = await import('three/examples/jsm/lights/RectAreaLightUniformsLib.js');
  RectAreaLightUniformsLib.init();
  areaReady = true;
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
