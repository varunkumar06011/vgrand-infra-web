'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

type SceneMeta = {
  ceilingHeight?: number;
  baked?: number;
  lightScale?: number;
  spawn?: { x: number; z: number; lookX: number; lookZ: number };
};

type Props = {
  url: string;
  /** camera positions / look targets in model metres, evenly spread over scroll progress */
  camPath: Vec[];
  lookPath: Vec[];
  /** fraction of viewport width the scene is pushed right (+) / left (-) at a progress, desktop only */
  shiftKeys?: ShiftKey[];
  /** 0..1 scroll progress through the hero, written by the parent */
  progressRef: React.MutableRefObject<number>;
  /** follow the scroll exactly, with no easing (reduced-motion users) */
  instant?: boolean;
  onReady: () => void;
  onError: () => void;
};


export type Vec = [number, number, number];
export type ShiftKey = [number, number];

const shiftAt = (keys: ShiftKey[], t: number) => {
  if (!keys.length) return 0;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      const u = (t - t0) / (t1 - t0 || 1);
      return v0 + (v1 - v0) * (u * u * (3 - 2 * u));
    }
  }
  return keys[keys.length - 1][1];
};

const MAX_RATE = 0.035;

export default function FlatScene({ url, camPath, lookPath, shiftKeys = [], progressRef, instant = false, onReady, onError }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onError();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%;outline:none';
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.05, 120);
    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x8a7f72, 1.15);
    scene.add(hemi);

    let vw = 1, vh = 1;
    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      vw = w; vh = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = camera.aspect < 1 ? 70 : 48;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const camCurve = new THREE.CatmullRomCurve3(camPath.map((v) => new THREE.Vector3(...v)), false, 'catmullrom', 0.4);
    const lookCurve = new THREE.CatmullRomCurve3(lookPath.map((v) => new THREE.Vector3(...v)), false, 'catmullrom', 0.4);
    const ceilings: THREE.Object3D[] = [];
    let ceilingH = 3.05;
    let disposed = false;
    let loaded = false;

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const root = gltf.scene;
        const ex = (root.userData || {}) as SceneMeta;
        ceilingH = ex.ceilingHeight || ceilingH;
        if (ex.baked) {
          renderer.toneMapping = THREE.LinearToneMapping; // lighting is baked into the atlas
          hemi.intensity = 0.9;
        }
        const k = ex.lightScale || 0.008;
        const aniso = Math.min(renderer.capabilities.getMaxAnisotropy(), coarse ? 4 : 8);
        root.traverse((obj) => {
          const o = obj as THREE.PointLight & THREE.Mesh & { isLight?: boolean };
          if (o.name === 'Ceilings') ceilings.push(o);
          if (o.isLight) {
            o.intensity *= k; o.distance = 0; o.decay = 2; o.castShadow = false;
          }
          if (o.isMesh) {
            const m = o.material as THREE.MeshStandardMaterial;
            if (m.transparent) { m.depthWrite = false; m.side = THREE.DoubleSide; }
            if (m.map) m.map.anisotropy = aniso;
            // same black-lift as the walkthrough so dark baked regions keep detail
            if (ex.baked && m.emissiveMap && !m.userData.lifted) {
              m.userData.lifted = true;
              m.onBeforeCompile = (sh) => {
                sh.fragmentShader = sh.fragmentShader.replace(
                  '#include <emissivemap_fragment>',
                  `#include <emissivemap_fragment>
                  totalEmissiveRadiance = totalEmissiveRadiance + vec3(0.08, 0.07, 0.062) * (vec3(1.0) - clamp(totalEmissiveRadiance, 0.0, 1.0));`
                );
              };
              m.needsUpdate = true;
            }
          }
        });
        scene.add(root);
        loaded = true;
        onReady();
      },
      undefined,
      () => { if (!disposed) onError(); }
    );

    // ---- loop: ease toward the scroll target so wheel notches feel like a dolly ----
    let smooth = progressRef.current;
    let raf = 0;
    let last = performance.now();
    let hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);
    const camPos = new THREE.Vector3();
    const lookPos = new THREE.Vector3();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (hidden || !loaded) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // ease toward the scroll target, but never faster than MAX_RATE of the tour per second,
      // so a hard flick or scrollbar drag can't whip the camera through the rooms
      const step = (progressRef.current - smooth) * (1 - Math.exp(-dt * (instant ? 6 : 3)));
      const cap = MAX_RATE * dt;
      smooth += Math.max(-cap, Math.min(cap, step));
      const t = Math.min(1, Math.max(0, smooth));
      camCurve.getPoint(t, camPos);
      lookCurve.getPoint(t, lookPos);
      camera.position.copy(camPos);
      camera.lookAt(lookPos);
      // desktop: slide the flat to the empty side of each text chapter
      const shift = vw > vh ? shiftAt(shiftKeys, t) : 0;
      camera.setViewOffset(vw, vh, -shift * vw, 0, vw, vh);
      // roof is hidden for the cut-away aerial, back on once the camera is inside
      const inside = camPos.y < ceilingH - 0.15;
      for (const c of ceilings) c.visible = inside;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        if (m.isMesh) {
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            const s = mat as THREE.MeshStandardMaterial;
            s.map?.dispose(); s.emissiveMap?.dispose(); mat.dispose();
          });
        }
      });
      renderer.dispose();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
