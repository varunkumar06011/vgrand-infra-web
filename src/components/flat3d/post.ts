import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import type { Quality } from './kit';

/** after tone mapping: a touch of contrast and warmth, and a soft vignette like a real lens */
const GradeShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, uVignette: { value: 0.22 }, uAspect: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVignette; uniform float uAspect; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      // gentle S-curve around mid grey
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.18);
      // lift the blacks a hair so shadows read as soft light, not crushed
      col = col * 0.985 + 0.012;
      vec2 d = (vUv - 0.5) * vec2(uAspect, 1.0);
      float v = smoothstep(0.95, 0.25, length(d));
      col *= mix(1.0 - uVignette, 1.0, v);
      gl_FragColor = vec4(col, c.a);
    }`,
};

/** two finished frames, side by side at the divider */
const SplitShader = {
  uniforms: { tA: { value: null as THREE.Texture | null }, tB: { value: null as THREE.Texture | null }, uSplit: { value: 0.5 }, uPx: { value: 0.001 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tA; uniform sampler2D tB; uniform float uSplit; uniform float uPx; varying vec2 vUv;
    void main(){
      float m = smoothstep(uSplit - uPx, uSplit + uPx, vUv.x);
      gl_FragColor = mix(texture2D(tA, vUv), texture2D(tB, vUv), m);
    }`,
};

/**
 * The finishing chain for capable devices: scene → ambient occlusion (GTAO) → bloom on lamps,
 * flames and bright windows → filmic tone mapping → grade. For the compare view it renders each
 * version of the home to its own frame and joins them at the divider.
 */
export class Post {
  readonly composer: EffectComposer;
  private render: RenderPass;
  private gtao: GTAOPass | null = null;
  private bloom: UnrealBloomPass | null = null;
  private grade: ShaderPass;
  private hold: THREE.WebGLRenderTarget;
  private copy: FullScreenQuad;
  private split: FullScreenQuad;
  private splitMat: THREE.ShaderMaterial;
  private w = 1; private h = 1;
  /** quality steps the adaptive governor can drop: 2 = AO + bloom, 1 = bloom only, 0 = grade only */
  level: number;

  constructor(private renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private camera: THREE.PerspectiveCamera, q: Quality) {
    const samples = q.tier >= 3 ? 4 : q.tier >= 2 ? 2 : 0;
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples });
    this.composer = new EffectComposer(renderer, rt);
    this.render = new RenderPass(scene, camera);
    this.composer.addPass(this.render);
    if (q.ao) {
      this.gtao = new GTAOPass(scene, camera, 1, 1);
      this.gtao.output = GTAOPass.OUTPUT.Default;
      this.gtao.blendIntensity = 0.85;
      this.gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.6, thickness: 1.2, scale: 1.1, samples: q.tier >= 3 ? 16 : 10, distanceFallOff: 1, screenSpaceRadius: false });
      this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: q.tier >= 3 ? 16 : 8 });
      // glass, overlays, glows and the sky must not darken what is behind them
      const scn = scene;
      const cache = new Map<THREE.Object3D, boolean>();
      this.gtao.overrideVisibility = () => {
        scn.traverse((o) => {
          cache.set(o, o.visible);
          const m = (o as THREE.Mesh).material as THREE.Material | undefined;
          if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || o.userData.noAO || (m && !Array.isArray(m) && m.transparent)) o.visible = false;
        });
      };
      this.gtao.restoreVisibility = () => { scn.traverse((o) => { const v = cache.get(o); if (v !== undefined) o.visible = v; }); cache.clear(); };
      this.composer.addPass(this.gtao);
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), q.tier >= 3 ? 0.24 : 0.2, 0.45, 3.5);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.level = this.gtao ? 2 : 1;

    this.hold = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    this.copy = new FullScreenQuad(new THREE.MeshBasicMaterial({ toneMapped: false }));
    this.splitMat = new THREE.ShaderMaterial({ ...SplitShader, uniforms: THREE.UniformsUtils.clone(SplitShader.uniforms), depthTest: false, depthWrite: false });
    this.split = new FullScreenQuad(this.splitMat);
    void this.camera;
  }

  setSize(w: number, h: number, dpr: number) {
    this.w = Math.round(w * dpr); this.h = Math.round(h * dpr);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    // ambient occlusion is soft by nature: half resolution is indistinguishable and four times cheaper
    if (this.gtao) this.gtao.setSize(Math.round(this.w * 0.5), Math.round(this.h * 0.5));
    this.bloom?.setSize(Math.round(this.w * 0.5), Math.round(this.h * 0.5));
    this.hold.setSize(this.w, this.h);
    this.grade.uniforms.uAspect.value = w / Math.max(1, h);
    this.splitMat.uniforms.uPx.value = 1 / Math.max(1, this.w);
  }

  /** drop one step of work (returns false when there is nothing left to drop) */
  degrade(): boolean {
    if (this.level >= 2 && this.gtao) { this.gtao.enabled = false; this.level = 1; return true; }
    if (this.level >= 1 && this.bloom) { this.bloom.enabled = false; this.level = 0; return true; }
    return false;
  }

  /** render one finished frame to the screen */
  frame() {
    this.composer.renderToScreen = true;
    this.composer.render();
  }

  /** first half of a compare frame: render and keep it */
  keep() {
    this.composer.renderToScreen = false;
    this.composer.render();
    (this.copy.material as THREE.MeshBasicMaterial).map = this.composer.readBuffer.texture;
    this.renderer.setRenderTarget(this.hold);
    this.copy.render(this.renderer);
    this.renderer.setRenderTarget(null);
  }

  /** second half: render the other version and join the two at `split` (0..1 across the screen) */
  join(split: number) {
    this.composer.renderToScreen = false;
    this.composer.render();
    this.splitMat.uniforms.tA.value = this.hold.texture;
    this.splitMat.uniforms.tB.value = this.composer.readBuffer.texture;
    this.splitMat.uniforms.uSplit.value = split;
    this.renderer.setRenderTarget(null);
    this.split.render(this.renderer);
  }

  dispose() {
    this.composer.dispose();
    this.gtao?.dispose();
    this.bloom?.dispose();
    this.hold.dispose();
    this.copy.dispose();
    (this.copy.material as THREE.Material).dispose();
    this.split.dispose();
    this.splitMat.dispose();
    void this.scene; void this.render;
  }
}
