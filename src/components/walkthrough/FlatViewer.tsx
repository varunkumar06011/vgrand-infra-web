'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { X } from 'lucide-react';

type Rect = [number, number, number, number];

type WalkMeta = {
  walkable?: Rect[]; blockers?: Rect[]; playerRadius?: number; eyeHeight?: number;
  baked?: number; lightScale?: number;
  spawn?: { x: number; z: number; lookX: number; lookZ: number };
};

const RED = '#C0392B';
const STICK_R = 52; // joystick travel radius in px

/**
 * Full-screen first-person walkthrough of the sample flat.
 * Scene metadata (walkable area, furniture footprints, spawn, eye height) lives
 * in the GLB's scene extras, so re-exporting the model needs no code change.
 *  - Desktop: click to capture the mouse, WASD / arrows to walk, Shift to run.
 *  - Touch: left thumb joystick to walk, drag anywhere else to look.
 */
export default function FlatViewer({ url, onClose }: { url: string; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // viewer is client-only (ssr:false), so reading the device here is hydration-safe
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
  const [hintGone, setHintGone] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const stick = stickRef.current;
    const knob = knobRef.current;
    if (!mount || !stick || !knob) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !coarse,
        powerPreference: 'high-performance',
      });
    } catch {
      queueMicrotask(() => setError('Your browser could not start 3D graphics. Please try another browser or device.'));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none';
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbcd6ee);
    const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 80);
    camera.rotation.order = 'YXZ';
    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7f72, 1.15);
    scene.add(hemi);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // keep a comfortable field of view in portrait
      camera.fov = camera.aspect < 1 ? 82 : 72;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // ---- collision: 2D footprint test, slide along walls ----
    let WALK: Rect[] = [];
    let BLOCK: Rect[] = [];
    let RADIUS = 0.24;
    let EYE = 1.6;
    const inRect = (x: number, z: number, r: Rect) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];
    const free = (x: number, z: number) => {
      let ok = false;
      for (const r of WALK) if (inRect(x, z, r)) { ok = true; break; }
      if (!ok) return false;
      for (const b of BLOCK) if (inRect(x, z, b)) return false;
      return true;
    };
    const fits = (x: number, z: number) => {
      if (!free(x, z)) return false;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        if (!free(x + Math.cos(a) * RADIUS, z + Math.sin(a) * RADIUS)) return false;
      }
      return true;
    };
    const slide = (px: number, pz: number, dx: number, dz: number): [number, number] => {
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.05));
      let x = px, z = pz;
      for (let i = 0; i < steps; i++) {
        const sx = dx / steps, sz = dz / steps;
        if (fits(x + sx, z + sz)) { x += sx; z += sz; }
        else if (fits(x + sx, z)) x += sx;
        else if (fits(x, z + sz)) z += sz;
      }
      return [x, z];
    };

    // ---- state ----
    const pos = new THREE.Vector3(0, 1.6, 0);
    let yaw = 0, pitch = 0;
    const keys: Record<string, boolean> = {};
    const joy = { x: 0, y: 0, id: -1 };
    const vel = { f: 0, s: 0 };
    let loaded = false;
    let disposed = false;
    const lights: THREE.Light[] = [];

    // ---- load ----
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        const ex = (root.userData || {}) as WalkMeta;
        WALK = ex.walkable || [];
        BLOCK = ex.blockers || [];
        RADIUS = ex.playerRadius || RADIUS;
        EYE = ex.eyeHeight || EYE;
        if (ex.baked) {
          renderer.toneMapping = THREE.LinearToneMapping; // lighting is baked into the atlas
          hemi.intensity = 0.9;
        }
        const k = ex.lightScale || 0.008;
        const aniso = Math.min(renderer.capabilities.getMaxAnisotropy(), coarse ? 4 : 8);
        root.traverse((obj) => {
          const o = obj as THREE.PointLight & THREE.Mesh & { isLight?: boolean };
          if (o.isLight) {
            o.intensity *= k; o.distance = 0; o.decay = 2; o.castShadow = false;
            lights.push(o);
          }
          if (o.isMesh) {
            const m = o.material as THREE.MeshStandardMaterial;
            if (m.transparent) { m.depthWrite = false; m.side = THREE.DoubleSide; }
            if (m.map) m.map.anisotropy = aniso;
            // the baked atlas has near-pure-black regions (kitchen backsplash, hood, dark
            // panels) that read as holes; lift blacks to a warm charcoal so detail shows
            if (ex.baked && m.emissiveMap && !m.userData.lifted) {
              m.userData.lifted = true;
              m.onBeforeCompile = (sh) => {
                sh.fragmentShader = sh.fragmentShader.replace(
                  '#include <emissivemap_fragment>',
                  `#include <emissivemap_fragment>
                  totalEmissiveRadiance = totalEmissiveRadiance + vec3(0.05, 0.045, 0.04) * (vec3(1.0) - clamp(totalEmissiveRadiance, 0.0, 1.0));`
                );
              };
              m.needsUpdate = true;
            }
          }
        });
        scene.add(root);
        const s = ex.spawn || { x: 2, z: 0.5, lookX: 3, lookZ: 3 };
        pos.set(s.x, EYE, s.z);
        yaw = Math.atan2(-(s.lookX - s.x), -(s.lookZ - s.z));
        loaded = true;
        setReady(true);
      },
      (e) => { if (e.total) setProgress(Math.min(1, e.loaded / e.total)); },
      () => { if (!disposed) setError('Could not load the 3D model. Please check your connection and try again.'); }
    );

    // ---- desktop input ----
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && document.pointerLockElement !== canvas) { onClose(); return; }
      keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'KeyL') {
        const on = !(lights[0] && lights[0].visible);
        lights.forEach((l) => (l.visible = on));
      }
      setHintGone(true);
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw -= e.movementX * 0.0022;
      pitch = Math.max(-1.3, Math.min(1.3, pitch - e.movementY * 0.0022));
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);

    // ---- look: one-finger / mouse drag on the canvas (touch) or pointer lock (mouse) ----
    const look = { id: -1, x: 0, y: 0 };
    const onCanvasDown = (e: PointerEvent) => {
      setHintGone(true);
      if (e.pointerType === 'mouse') {
        if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
        return;
      }
      if (look.id !== -1) return;
      look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onCanvasMove = (e: PointerEvent) => {
      if (e.pointerId !== look.id) return;
      yaw -= (e.clientX - look.x) * 0.0055;
      pitch = Math.max(-1.3, Math.min(1.3, pitch - (e.clientY - look.y) * 0.0055));
      look.x = e.clientX; look.y = e.clientY;
    };
    const onCanvasUp = (e: PointerEvent) => { if (e.pointerId === look.id) look.id = -1; };
    canvas.addEventListener('pointerdown', onCanvasDown);
    canvas.addEventListener('pointermove', onCanvasMove);
    canvas.addEventListener('pointerup', onCanvasUp);
    canvas.addEventListener('pointercancel', onCanvasUp);

    // ---- joystick (its own element, so it never fights the look drag) ----
    const setKnob = (dx: number, dy: number) => {
      knob.style.transform = `translate(calc(-50% + ${dx * STICK_R}px), calc(-50% + ${dy * STICK_R}px))`;
    };
    const updateStick = (e: PointerEvent) => {
      const r = stick.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / STICK_R;
      let dy = (e.clientY - (r.top + r.height / 2)) / STICK_R;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      joy.x = Math.abs(dx) < 0.08 ? 0 : dx;
      joy.y = Math.abs(dy) < 0.08 ? 0 : dy;
      setKnob(dx, dy);
    };
    const onStickDown = (e: PointerEvent) => {
      e.preventDefault();
      setHintGone(true);
      if (joy.id !== -1) return;
      joy.id = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      updateStick(e);
    };
    const onStickMove = (e: PointerEvent) => { if (e.pointerId === joy.id) updateStick(e); };
    const onStickUp = (e: PointerEvent) => {
      if (e.pointerId !== joy.id) return;
      joy.id = -1; joy.x = joy.y = 0; setKnob(0, 0);
    };
    stick.addEventListener('pointerdown', onStickDown);
    stick.addEventListener('pointermove', onStickMove);
    stick.addEventListener('pointerup', onStickUp);
    stick.addEventListener('pointercancel', onStickUp);

    // ---- loop ----
    const clock = new THREE.Clock();
    let hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; clock.getDelta(); };
    document.addEventListener('visibilitychange', onVis);

    renderer.setAnimationLoop(() => {
      if (hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (loaded) {
        const run = keys.ShiftLeft || keys.ShiftRight;
        const speed = run ? 3.2 : 1.6;
        let f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y;
        let s = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0) + joy.x;
        if (keys.ArrowLeft) yaw += 1.6 * dt;
        if (keys.ArrowRight) yaw -= 1.6 * dt;
        const m = Math.hypot(f, s);
        if (m > 1) { f /= m; s /= m; }
        // ease toward the target so starts/stops feel smooth
        const a = 1 - Math.exp(-14 * dt);
        vel.f += (f - vel.f) * a;
        vel.s += (s - vel.s) * a;
        if (Math.abs(vel.f) > 0.01 || Math.abs(vel.s) > 0.01) {
          const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
          const [nx, nz] = slide(
            pos.x, pos.z,
            (fx * vel.f + rx * vel.s) * speed * dt,
            (fz * vel.f + rz * vel.s) * speed * dt
          );
          pos.x = nx; pos.z = nz;
        }
        camera.position.set(pos.x, EYE, pos.z);
        camera.rotation.set(pitch, yaw, 0);
      }
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVis);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      scene.traverse((obj) => {
        const o = obj as THREE.Mesh;
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [url, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="3D walkthrough of the sample flat"
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#f3ece1', overscrollBehavior: 'none' }}
    >
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />

      <button
        onClick={onClose}
        aria-label="Close 3D walkthrough"
        style={{
          position: 'absolute', top: 'max(14px, env(safe-area-inset-top))', right: 14,
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'rgba(20,20,20,.65)', color: '#fff', display: 'grid', placeItems: 'center',
        }}
      >
        <X size={22} />
      </button>

      {/* joystick */}
      <div
        ref={stickRef}
        aria-label="Walk joystick"
        style={{
          position: 'absolute', left: 'max(22px, env(safe-area-inset-left))',
          bottom: 'max(28px, env(safe-area-inset-bottom))', width: 124, height: 124, borderRadius: '50%',
          background: 'rgba(20,20,20,.35)', border: '2px solid rgba(255,255,255,.85)',
          boxShadow: '0 4px 18px rgba(0,0,0,.25)', backdropFilter: 'blur(3px)',
          touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
          display: touch && ready ? 'block' : 'none',
        }}
      >
        <div
          ref={knobRef}
          style={{
            position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, borderRadius: '50%',
            transform: 'translate(-50%, -50%)', background: 'rgba(255,255,255,.92)',
            boxShadow: '0 2px 8px rgba(0,0,0,.3)', pointerEvents: 'none',
          }}
        />
      </div>

      {/* hint */}
      {ready && !hintGone && (
        <div
          style={{
            position: 'absolute', left: '50%', bottom: touch ? 'auto' : 22, top: touch ? 'max(22px, env(safe-area-inset-top))' : 'auto',
            transform: 'translateX(-50%)', padding: '9px 16px', borderRadius: 999, maxWidth: '88vw',
            background: 'rgba(20,20,20,.7)', color: '#fff', fontSize: 13, textAlign: 'center', pointerEvents: 'none',
          }}
        >
          {touch ? 'Left stick to walk · drag to look around' : 'Click to look · WASD / arrows to walk · Shift to run'}
        </div>
      )}

      {/* loading / error */}
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#3a2f25', textAlign: 'center', padding: 24 }}>
          {error ? (
            <div>
              <p style={{ marginBottom: 16 }}>{error}</p>
              <button onClick={onClose} style={{ background: RED, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          ) : (
            <div style={{ width: 'min(260px, 70vw)' }}>
              <p style={{ letterSpacing: '.06em', fontSize: 14, marginBottom: 14 }}>Loading the flat…</p>
              <div style={{ height: 4, background: 'rgba(0,0,0,.12)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(6, progress * 100)}%`, background: RED, transition: 'width .2s' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
