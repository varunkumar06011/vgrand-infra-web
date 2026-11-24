'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { X, Layers, Play, Hand, BedDouble, Sofa, CookingPot, Droplet, Flame, UtensilsCrossed, PaintBucket, Fence } from 'lucide-react';
import {
  gatewayFlats, gatewayText, GATEWAY_PX_PER_FT, GATEWAY_CEILING_FT,
  type GatewayFlat, type GatewayFloor, type GatewayLang, type GatewayRoomKey,
} from '@/data/gatewayFlats';

const RED = '#C0392B';
const H = GATEWAY_CEILING_FT, DOOR_H = 7, EYE = 5.3, R = 0.7; // feet — the scene is built in feet
const LANG_KEY = 'gw-lang';

const ROOM_ICON: Record<GatewayRoomKey, React.ComponentType<{ size?: number }>> = {
  living: Sofa, livdin: Sofa, dining: UtensilsCrossed, puja: Flame, kitchen: CookingPot, service: PaintBucket,
  passage: Sofa, master: BedDouble, bed: BedDouble, tbed: Droplet, tmaster: Droplet, balcony: Fence,
};

type Room = { key: GatewayRoomKey; dim: string; x1: number; z1: number; x2: number; z2: number };
type Mode = 'walk' | 'doll';
type Engine = {
  setFlat: (id: GatewayFlat['id']) => void;
  setMode: (m: Mode) => void;
  setLang: (l: GatewayLang) => void;
  startTour: () => void;
  stopTour: () => void;
  pickRoom: (key: GatewayRoomKey) => void;
  pad: Record<'f' | 'b' | 'l' | 'r', boolean>;
};

/* ---------- procedural floor textures ---------- */
function makeTextures() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const shade = (hex: string, v: number) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (x: number) => Math.max(0, Math.min(255, Math.round(x * (1 + v))));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };
  const tex = (draw: (g: CanvasRenderingContext2D, s: number) => void) => {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    draw(c.getContext('2d')!, 512);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    return t;
  };
  const tiles = (n: number, base: string, grout: string, jitter: number) => (g: CanvasRenderingContext2D, s: number) => {
    g.fillStyle = grout; g.fillRect(0, 0, s, s);
    const w = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = shade(base, (rnd() - 0.5) * jitter);
      g.fillRect(i * w + 1.5, j * w + 1.5, w - 3, w - 3);
      for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.035})`; g.fillRect(i * w + rnd() * w, j * w + rnd() * w, rnd() * 18, 1.5); }
    }
  };
  const out: Record<GatewayFloor, { t: THREE.Texture; size: number }> = {
    tile: { t: tex(tiles(4, '#d9d6d0', '#b9b4ab', 0.05)), size: 8 }, // 24"×24" vitrified
    ktile: { t: tex(tiles(4, '#c9c6bf', '#a39d93', 0.06)), size: 6 },
    wet: { t: tex(tiles(8, '#a7aeb3', '#868c90', 0.08)), size: 4 },
    balc: { t: tex(tiles(4, '#b88a6b', '#8f6a52', 0.08)), size: 4 },
    marble: { t: tex((g, s) => {
      g.fillStyle = '#efece7'; g.fillRect(0, 0, s, s); g.strokeStyle = 'rgba(120,110,100,0.25)';
      for (let i = 0; i < 14; i++) { g.lineWidth = rnd() * 2 + 0.5; g.beginPath(); let x = rnd() * s, y = 0; g.moveTo(x, y); while (y < s) { x += (rnd() - 0.5) * 40; y += 20; g.lineTo(x, y); } g.stroke(); }
    }), size: 4 },
    wood: { t: tex((g, s) => {
      const rows = 8, h = s / rows;
      for (let r = 0; r < rows; r++) {
        let x = -rnd() * s;
        while (x < s) {
          const len = s * (0.5 + rnd() * 0.6);
          g.fillStyle = shade('#a07850', (rnd() - 0.5) * 0.16); g.fillRect(x, r * h, len, h);
          for (let k = 0; k < 16; k++) {
            g.strokeStyle = `rgba(60,35,15,${0.05 + rnd() * 0.08})`; g.lineWidth = 1; g.beginPath();
            const yy = r * h + rnd() * h; g.moveTo(x, yy);
            g.bezierCurveTo(x + len * 0.3, yy + (rnd() - 0.5) * 6, x + len * 0.6, yy + (rnd() - 0.5) * 6, x + len, yy); g.stroke();
          }
          g.fillStyle = 'rgba(40,22,10,0.45)'; g.fillRect(x, r * h, 2, h);
          x += len;
        }
        g.fillStyle = 'rgba(40,22,10,0.4)'; g.fillRect(0, r * h, s, 2);
      }
    }), size: 6 },
  };
  return out;
}
const FLOOR_COLORS: Record<GatewayFloor, string> = { tile: '#d6d2cb', ktile: '#c4c0b8', wet: '#a6adb2', balc: '#b88a6b', marble: '#ece8e1', wood: '#b38a62' };

/**
 * Full-screen 3D walkthrough of the V Grand Gateway flats, built in three.js straight from the
 * floor plan (no model file). Two ways to use it, picked from the bottom bar:
 *  - "Show me": plays every room in turn, standing in a corner so the whole room is on screen.
 *  - "I'll look myself": arrow buttons / WASD to walk, drag to look, tap a room to jump there.
 * English and Telugu text; "Top view" shows the whole flat as a cut-away.
 */
export default function GatewayViewer({ onClose }: { onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);

  const [flatId, setFlatId] = useState<GatewayFlat['id']>('900');
  const [lang, setLangState] = useState<GatewayLang>(() => {
    try { return localStorage.getItem(LANG_KEY) === 'te' ? 'te' : 'en'; } catch { return 'en'; }
  });
  const [mode, setModeState] = useState<Mode>('walk');
  const [tour, setTour] = useState<{ i: number; n: number } | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [intro, setIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const T = gatewayText[lang];
  const flat = gatewayFlats.find((f) => f.id === flatId)!;

  // engine → React, through refs so the effect below runs once
  const cb = useRef({ setRoom, setTour, setModeState });

  useEffect(() => {
    const mount = mountRef.current, mini = miniRef.current, fadeEl = fadeRef.current;
    if (!mount || !mini || !fadeEl) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !coarse, powerPreference: 'high-performance' });
    } catch {
      queueMicrotask(() => setError('Your browser could not start 3D graphics. Please try another browser or device.'));
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, coarse ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none;cursor:grab';
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xc9d6e0);
    scene.fog = new THREE.Fog(0xc9d6e0, 80, 260);
    const camera = new THREE.PerspectiveCamera(78, 1, 0.1, 600);
    scene.add(new THREE.HemisphereLight(0xf2f5f8, 0x7a7066, 1.5));
    const sun = new THREE.DirectionalLight(0xfff3e2, 1.6); sun.position.set(-40, 70, 25); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xdfe8f2, 0.5); fill.position.set(30, 40, -30); scene.add(fill);

    const TEX = makeTextures();
    const mats = {
      wall: new THREE.MeshStandardMaterial({ color: 0xf1efea, roughness: 0.92 }),
      sill: new THREE.MeshStandardMaterial({ color: 0x3f3a36, roughness: 0.4 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.5, metalness: 0.3 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xbfd8e6, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
      door: new THREE.MeshStandardMaterial({ color: 0x7b5434, roughness: 0.6 }),
      handle: new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.3, metalness: 0.8 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0xfafafa, emissive: 0x8a8884, roughness: 1, side: THREE.DoubleSide }),
      ground: new THREE.MeshStandardMaterial({ color: 0x8e918f, roughness: 1 }),
    };
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), mats.ground);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; scene.add(ground);

    const orbit = new OrbitControls(camera, canvas);
    orbit.enableDamping = true; orbit.maxPolarAngle = 1.32; orbit.minDistance = 12; orbit.maxDistance = 110; orbit.enabled = false;

    /* ---------- per-flat state ---------- */
    let F: GatewayFlat = gatewayFlats[0];
    let X = (v: number) => v, Z = (v: number) => v;
    let root: THREE.Group | null = null, structure = new THREE.Group(), labels = new THREE.Group();
    let ceiling: THREE.Mesh | null = null;
    let floorMeshes: THREE.Mesh[] = [], roomLights: THREE.PointLight[] = [];
    let colliders: number[][] = [], miniRects: [number, number, number, number, string][] = [];
    let miniGlass: number[][] = [], miniDoors: number[][] = [];
    let rooms: Room[] = [];
    let mode: Mode = 'walk';
    let lang: GatewayLang = 'en';
    try { lang = localStorage.getItem(LANG_KEY) === 'te' ? 'te' : 'en'; } catch { /* storage blocked */ }

    const addBox = (x1: number, z1: number, x2: number, z2: number, y0: number, y1: number, mat: THREE.Material, collide: boolean, kind: string | null) => {
      const w = Math.abs(x2 - x1), d = Math.abs(z2 - z1), h = y1 - y0;
      if (w < 0.01 || d < 0.01 || h <= 0) return;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set((x1 + x2) / 2, y0 + h / 2, (z1 + z2) / 2);
      structure.add(m);
      const r = [Math.min(x1, x2), Math.min(z1, z2), Math.max(x1, x2), Math.max(z1, z2)];
      if (collide) colliders.push(r);
      if (kind) miniRects.push([r[0], r[1], r[2], r[3], kind]);
    };
    const windowPane = (r: number[], horiz: boolean, y0: number, y1: number, off = 0) => {
      const [x1, z1, x2, z2] = r;
      const cx = (x1 + x2) / 2 + (horiz ? 0 : off), cz = (z1 + z2) / 2 + (horiz ? off : 0);
      const len = horiz ? Math.abs(x2 - x1) : Math.abs(z2 - z1), h = y1 - y0;
      const pane = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.04, h, horiz ? 0.04 : len), mats.glass);
      pane.position.set(cx, y0 + h / 2, cz); structure.add(pane);
      const bar = (bx: number, by: number, bz: number, sx: number, sy: number, sz: number) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mats.frame); m.position.set(bx, by, bz); structure.add(m);
      };
      const k = 0.12;
      if (horiz) {
        bar(cx, y0 + k / 2, cz, len, k, k); bar(cx, y1 - k / 2, cz, len, k, k);
        bar(cx - len / 2 + k / 2, y0 + h / 2, cz, k, h, k); bar(cx + len / 2 - k / 2, y0 + h / 2, cz, k, h, k);
        if (len > 3 && !off) bar(cx, y0 + h / 2, cz, k * 0.7, h, k);
      } else {
        bar(cx, y0 + k / 2, cz, k, k, len); bar(cx, y1 - k / 2, cz, k, k, len);
        bar(cx, y0 + h / 2, cz - len / 2 + k / 2, k, h, k); bar(cx, y0 + h / 2, cz + len / 2 - k / 2, k, h, k);
        if (len > 3 && !off) bar(cx, y0 + h / 2, cz, k, h, k * 0.7);
      }
      miniGlass.push(r);
    };
    const disposeGroup = (g: THREE.Object3D) => g.traverse((o) => {
      const m = o as THREE.Mesh | THREE.Sprite;
      if ((m as THREE.Mesh).geometry) (m as THREE.Mesh).geometry.dispose();
      const mat = m.material as THREE.Material & { map?: THREE.Texture | null };
      if (mat && !Object.values(mats).includes(mat as THREE.MeshStandardMaterial)) { mat.map?.dispose(); mat.dispose(); }
    });

    const makeLabel = (name: string, dim: string, x: number, z: number) => {
      const c = document.createElement('canvas'); c.width = 560; c.height = 160;
      const g = c.getContext('2d')!;
      g.fillStyle = 'rgba(28,24,22,0.88)'; g.beginPath(); g.roundRect(6, 6, 548, 148, 24); g.fill();
      g.fillStyle = '#ffffff'; g.textAlign = 'center';
      const family = '"Noto Sans Telugu", Montserrat, system-ui, sans-serif';
      let fs = 50; g.font = `700 ${fs}px ${family}`;
      while (g.measureText(name).width > 520 && fs > 24) { fs -= 2; g.font = `700 ${fs}px ${family}`; }
      g.fillText(name, 280, dim ? 76 : 96);
      if (dim) { g.fillStyle = '#f0a99f'; g.font = '500 36px ui-monospace, Consolas, monospace'; g.fillText(dim, 280, 128); }
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
      s.scale.set(7.6, 2.17, 1); s.position.set(x, 7.5, z); s.renderOrder = 10;
      return s;
    };
    const buildLabels = () => {
      while (labels.children.length) disposeGroup(labels.children.pop()!);
      for (const r of rooms) if (r.key !== 'passage') {
        labels.add(makeLabel(gatewayText[lang].rooms[r.key], r.dim, (r.x1 + r.x2) / 2, (r.z1 + r.z2) / 2));
      }
      labels.visible = mode === 'doll';
    };

    const build = (f: GatewayFlat) => {
      F = f;
      X = (v) => (v - F.ox) / GATEWAY_PX_PER_FT; Z = (v) => (v - F.oy) / GATEWAY_PX_PER_FT;
      if (root) { scene.remove(root); disposeGroup(root); }
      root = new THREE.Group(); structure = new THREE.Group(); labels = new THREE.Group();
      root.add(structure, labels); scene.add(root);
      colliders = []; miniRects = []; miniGlass = []; miniDoors = []; floorMeshes = []; roomLights = [];

      for (const [x1, y1, x2, y2, gaps = [], o = {}] of F.walls) {
        const h0 = o.h0 ?? 0, h1 = o.h1 ?? H;
        const horiz = (x2 - x1) >= (y2 - y1);
        const A0 = horiz ? x1 : y1, A1 = horiz ? x2 : y2;
        const rect = (a: number, b: number) => (horiz ? [X(a), Z(y1), X(b), Z(y2)] : [X(x1), Z(a), X(x2), Z(b)]);
        const seg = (a: number, b: number, y0: number, yt: number, mat: THREE.Material, collide: boolean, kind: string | null) => {
          if (b - a < 0.5) return;
          const r = rect(a, b); addBox(r[0], r[1], r[2], r[3], y0, yt, mat, collide, kind);
        };
        const wallKind = h0 >= 6 ? null : h1 < 5 ? 'parapet' : 'wall';
        let c = A0;
        for (const [g0, g1, kind] of [...gaps].sort((p, q) => p[0] - q[0])) {
          seg(c, g0, h0, h1, mats.wall, h0 < 4, wallKind);
          if (kind === 'door') {
            seg(g0, g1, DOOR_H, h1, mats.wall, false, null);
          } else if (kind === 'win' || kind === 'vent') {
            const s = kind === 'win' ? 3 : 5;
            seg(g0, g1, 0, s - 0.08, mats.wall, true, 'sill');
            seg(g0, g1, s - 0.08, s, mats.sill, false, null);
            seg(g0, g1, DOOR_H, h1, mats.wall, false, null);
            windowPane(rect(g0, g1), horiz, s, DOOR_H);
          } else {
            // sliding balcony door: two stacked glass panels over 42% of the opening, the rest open
            seg(g0, g1, DOOR_H, h1, mats.wall, false, null);
            const r = rect(g0, g0 + (g1 - g0) * 0.42);
            windowPane(r, horiz, 0.15, DOOR_H, -0.08);
            windowPane(r, horiz, 0.15, DOOR_H, 0.08);
            colliders.push([Math.min(r[0], r[2]), Math.min(r[1], r[3]), Math.max(r[0], r[2]), Math.max(r[1], r[3])]);
          }
          c = g1;
        }
        seg(c, A1, h0, h1, mats.wall, h0 < 4, wallKind);
      }

      for (const [hx, hy, ex, ey] of F.doors) {
        const ax = X(hx), az = Z(hy), bx = X(ex), bz = Z(ey);
        const len = Math.hypot(bx - ax, bz - az);
        const g = new THREE.Group();
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(len, DOOR_H - 0.1, 0.12), mats.door);
        leaf.position.set(len / 2, (DOOR_H - 0.1) / 2, 0);
        const knob = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.3), mats.handle);
        knob.position.set(len - 0.3, 3.4, 0);
        g.add(leaf, knob); g.position.set(ax, 0, az); g.rotation.y = -Math.atan2(bz - az, bx - ax);
        structure.add(g); miniDoors.push([ax, az, bx, bz]);
      }

      F.floors.forEach(([x1, y1, x2, y2, kind], i) => {
        const w = X(x2) - X(x1), d = Z(y2) - Z(y1);
        const t = TEX[kind].t.clone(); t.needsUpdate = true;
        t.repeat.set(w / TEX[kind].size, d / TEX[kind].size);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: kind === 'wood' ? 0.55 : 0.35 }));
        m.rotation.x = -Math.PI / 2;
        m.position.set((X(x1) + X(x2)) / 2, 0.002 * (i + 1), (Z(y1) + Z(y2)) / 2);
        root!.add(m); floorMeshes.push(m);
      });

      const [ox1, oy1, ox2, oy2] = F.outline;
      const cw = X(ox2) - X(ox1), cd = Z(oy2) - Z(oy1);
      ceiling = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.4, cd), mats.ceiling);
      ceiling.position.set(cw / 2 + X(ox1), H + 0.2, cd / 2 + Z(oy1));
      root.add(ceiling);

      rooms = F.rooms.map(([key, dim, x1, y1, x2, y2]) => ({ key, dim, x1: X(x1), z1: Z(y1), x2: X(x2), z2: Z(y2) }));
      for (const r of rooms) {
        const area = (r.x2 - r.x1) * (r.z2 - r.z1);
        if (area > 10 && r.key !== 'balcony' && r.key !== 'passage') {
          const l = new THREE.PointLight(0xfff1df, area > 40 ? 14 : 7, 0, 1.6);
          l.position.set((r.x1 + r.x2) / 2, H - 1, (r.z1 + r.z2) / 2);
          root.add(l); roomLights.push(l);
        }
      }
      buildLabels();
      sizeMini();
    };

    /* ---------- movement ---------- */
    const pos = new THREE.Vector2();
    let yaw = 0, pitch = -0.05;
    const keys: Record<string, boolean> = {};
    const pad = { f: false, b: false, l: false, r: false };
    let focusRoom: Room | null = null;

    const blocked = (x: number, z: number) => {
      const [ox1, oy1, ox2, oy2] = F.outline;
      if (x < X(ox1) - 12 || x > X(ox2) + 12 || z < Z(oy1) - 12 || z > Z(oy2) + 12) return true;
      for (const c of colliders) if (x > c[0] - R && x < c[2] + R && z > c[1] - R && z < c[3] + R) return true;
      return false;
    };
    const placeAt = (x: number, z: number) => {
      focusRoom = null;
      if (!blocked(x, z)) { pos.set(x, z); return true; }
      for (let rad = 0.3; rad < 4; rad += 0.3) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
        const nx = x + Math.cos(a) * rad, nz = z + Math.sin(a) * rad;
        if (!blocked(nx, nz)) { pos.set(nx, nz); return true; }
      }
      return false;
    };
    const roomAt = (x: number, z: number) =>
      [...rooms].sort((a, b) => (a.x2 - a.x1) * (a.z2 - a.z1) - (b.x2 - b.x1) * (b.z2 - b.z1))
        .find((r) => x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) ?? null;
    const setFov = (f: number) => { camera.fov = camera.aspect < 1 ? Math.min(110, f + 12) : f; camera.updateProjectionMatrix(); };

    // Stand inside, in the corner farthest from the room's door, and look at the opposite corner,
    // so the whole room fits on screen. The puja room is an open niche: look straight into it.
    const goRoom = (r: Room) => {
      if (mode !== 'walk') setMode('walk');
      const cx = (r.x1 + r.x2) / 2, cz = (r.z1 + r.z2) / 2;
      const big = Math.max(r.x2 - r.x1, r.z2 - r.z1);
      if (r.key === 'puja') {
        placeAt(cx, r.z2 + 6.5); yaw = 0; pitch = -0.3; setFov(78);
        focusRoom = r; return;
      }
      let door: [number, number] = [cx, cz], best = Infinity;
      for (const [ax, az] of miniDoors) {
        if (ax < r.x1 - 1 || ax > r.x2 + 1 || az < r.z1 - 1 || az > r.z2 + 1) continue;
        const dd = Math.hypot(ax - cx, az - cz);
        if (dd < best) { best = dd; door = [ax, az]; }
      }
      const ins = 0.95;
      const corners = [[r.x1 + ins, r.z1 + ins], [r.x2 - ins, r.z1 + ins], [r.x1 + ins, r.z2 - ins], [r.x2 - ins, r.z2 - ins]]
        .filter(([x, z]) => !blocked(x, z) && roomAt(x, z) === r)
        .sort((a, b) => Math.hypot(b[0] - door[0], b[1] - door[1]) - Math.hypot(a[0] - door[0], a[1] - door[1]));
      if (corners.length) pos.set(corners[0][0], corners[0][1]); else placeAt(cx, cz);
      const tx = r.x1 + r.x2 - pos.x, tz = r.z1 + r.z2 - pos.y;
      yaw = Math.atan2(-(tx - pos.x), -(tz - pos.y));
      pitch = big < 9 ? -0.34 : big < 15 ? -0.24 : -0.16;
      setFov(big < 9 ? 100 : big < 15 ? 90 : 80);
      focusRoom = r;
    };

    /* ---------- show me (guided tour) ---------- */
    let tour: { list: Room[]; i: number; t: number; base: number | null } | null = null;
    let fading = false;
    const fadeTo = (fn: () => void) => {
      if (reduced) { fn(); return; }
      fading = true; fadeEl.style.opacity = '1';
      setTimeout(() => { fn(); fadeEl.style.opacity = '0'; setTimeout(() => { fading = false; }, 350); }, 360);
    };
    const tourStep = () => {
      if (!tour) return;
      const r = tour.list[tour.i];
      tour.base = null;
      cb.current.setTour({ i: tour.i, n: tour.list.length });
      fadeTo(() => { if (!tour) return; goRoom(r); tour.base = yaw; tour.t = 0; });
    };
    const startTour = () => {
      if (mode !== 'walk') setMode('walk');
      tour = { list: F.tour.map((k) => rooms.find((r) => r.key === k)!).filter(Boolean), i: 0, t: 0, base: null };
      tourStep();
    };
    const stopTour = () => {
      if (!tour) return;
      tour = null;
      cb.current.setTour(null);
    };

    /* ---------- views ---------- */
    function setMode(m: Mode) {
      mode = m;
      if (m === 'doll') stopTour();
      structure.scale.y = m === 'doll' ? 0.55 : 1;
      if (ceiling) ceiling.visible = m !== 'doll';
      labels.visible = m === 'doll';
      roomLights.forEach((l) => (l.visible = m === 'walk'));
      orbit.enabled = m === 'doll';
      if (m === 'doll') {
        const [ox1, oy1, ox2, oy2] = F.outline;
        const cx = (X(ox1) + X(ox2)) / 2, cz = (Z(oy1) + Z(oy2)) / 2;
        camera.fov = 45; camera.updateProjectionMatrix();
        orbit.target.set(cx, 0, cz);
        const narrow = camera.aspect < 1;
        camera.position.set(cx - 4, narrow ? 70 : 48, cz + (narrow ? 52 : 40));
        orbit.update();
      } else setFov(78);
      cb.current.setModeState(m);
    }

    /* ---------- input ---------- */
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { onClose(); return; }
      if ((e.target as HTMLElement)?.closest?.('button') && (e.code === 'Space' || e.code === 'Enter')) return;
      keys[e.code] = true;
      if (mode === 'walk' && e.code.startsWith('Arrow')) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const onBlur = () => { for (const k in keys) keys[k] = false; pad.f = pad.b = pad.l = pad.r = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    const look = { id: -1, x: 0, y: 0 };
    const onDown = (e: PointerEvent) => {
      stopTour();
      if (mode !== 'walk' || look.id !== -1) return;
      look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY;
      canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== look.id) return;
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
      yaw -= (e.clientX - look.x) * k;
      pitch = Math.max(-1.2, Math.min(1.2, pitch - (e.clientY - look.y) * k));
      look.x = e.clientX; look.y = e.clientY;
    };
    const onUp = (e: PointerEvent) => { if (e.pointerId === look.id) { look.id = -1; canvas.style.cursor = 'grab'; } };
    const ray = new THREE.Raycaster();
    const onDbl = (e: MouseEvent) => {
      if (mode !== 'doll') return;
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = ray.intersectObjects(floorMeshes)[0];
      if (hit && placeAt(hit.point.x, hit.point.z)) { pitch = -0.05; setMode('walk'); }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('dblclick', onDbl);

    /* ---------- map ---------- */
    const mg = mini.getContext('2d')!;
    let mScale = 1, mOff = [0, 0];
    const mPad = 8;
    function sizeMini() {
      const [ox1, oy1, ox2, oy2] = F.outline;
      const w = X(ox2) - X(ox1), d = Z(oy2) - Z(oy1);
      const cssW = mini!.getBoundingClientRect().width || 200;
      mScale = (cssW - mPad * 2) / w;
      const cssH = d * mScale + mPad * 2;
      mini!.style.height = `${cssH}px`;
      const dpr = Math.min(window.devicePixelRatio, 2);
      mini!.width = cssW * dpr; mini!.height = cssH * dpr;
      mg.setTransform(dpr, 0, 0, dpr, 0, 0);
      mOff = [X(ox1), Z(oy1)];
    }
    const drawMini = () => {
      if (!mini.offsetParent) return;
      mg.save(); mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, mini.width, mini.height); mg.restore();
      const tx = (x: number) => mPad + (x - mOff[0]) * mScale, tz = (z: number) => mPad + (z - mOff[1]) * mScale;
      for (const [x1, y1, x2, y2, k] of F.floors) { mg.fillStyle = FLOOR_COLORS[k]; mg.fillRect(tx(X(x1)), tz(Z(y1)), (X(x2) - X(x1)) * mScale, (Z(y2) - Z(y1)) * mScale); }
      for (const [x1, z1, x2, z2, k] of miniRects) {
        mg.fillStyle = k === 'sill' ? '#7f8a94' : k === 'parapet' ? '#6c6560' : '#262b31';
        mg.fillRect(tx(x1), tz(z1), Math.max(1, (x2 - x1) * mScale), Math.max(1, (z2 - z1) * mScale));
      }
      mg.strokeStyle = '#4f9fd1'; mg.lineWidth = 1.5;
      for (const [x1, z1, x2, z2] of miniGlass) {
        mg.beginPath();
        if (Math.abs(x2 - x1) > Math.abs(z2 - z1)) { const zm = tz((z1 + z2) / 2); mg.moveTo(tx(x1), zm); mg.lineTo(tx(x2), zm); }
        else { const xm = tx((x1 + x2) / 2); mg.moveTo(xm, tz(z1)); mg.lineTo(xm, tz(z2)); }
        mg.stroke();
      }
      mg.strokeStyle = '#c98a3c';
      for (const [ax, az, bx, bz] of miniDoors) { mg.beginPath(); mg.moveTo(tx(ax), tz(az)); mg.lineTo(tx(bx), tz(bz)); mg.stroke(); }
      if (mode !== 'walk') return;
      const px = tx(pos.x), pz = tz(pos.y), a = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
      const grad = mg.createRadialGradient(px, pz, 0, px, pz, 34);
      grad.addColorStop(0, 'rgba(217,138,79,0.6)'); grad.addColorStop(1, 'rgba(217,138,79,0)');
      mg.fillStyle = grad; mg.beginPath(); mg.moveTo(px, pz); mg.arc(px, pz, 34, a - 0.55, a + 0.55); mg.closePath(); mg.fill();
      mg.fillStyle = '#d0762f'; mg.strokeStyle = '#fff'; mg.lineWidth = 2;
      mg.beginPath(); mg.arc(px, pz, 5, 0, Math.PI * 2); mg.fill(); mg.stroke();
    };
    const onMini = (e: MouseEvent) => {
      const r = mini.getBoundingClientRect();
      const x = (e.clientX - r.left - mPad) / mScale + mOff[0], z = (e.clientY - r.top - mPad) / mScale + mOff[1];
      stopTour();
      if (placeAt(x, z)) { pitch = -0.05; if (mode !== 'walk') setMode('walk'); }
    };
    mini.addEventListener('click', onMini);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth, h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      sizeMini();
    };

    /* ---------- engine API for the React UI ---------- */
    const selectFlat = (id: GatewayFlat['id']) => {
      stopTour();
      build(gatewayFlats.find((f) => f.id === id)!);
      const [sx, sy, sYaw] = F.spawn;
      pos.set(X(sx), Z(sy)); yaw = sYaw; pitch = -0.05; focusRoom = null;
      setMode(mode);
    };
    engineRef.current = {
      setFlat: selectFlat,
      setMode,
      setLang: (l) => { lang = l; buildLabels(); },
      startTour,
      stopTour,
      pickRoom: (key) => {
        const r = rooms.find((x) => x.key === key);
        if (!r) return;
        if (tour) { tour.i = Math.max(0, tour.list.indexOf(r)); tourStep(); }
        else fadeTo(() => goRoom(r));
      },
      pad,
    };

    selectFlat('900');
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    document.fonts?.ready.then(() => { if (root) buildLabels(); });

    /* ---------- loop ---------- */
    const clock = new THREE.Clock();
    let hidden = document.hidden;
    const onVis = () => { hidden = document.hidden; clock.getDelta(); };
    document.addEventListener('visibilitychange', onVis);
    let lastRoom: Room | null | undefined;

    renderer.setAnimationLoop(() => {
      if (hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (mode === 'doll') orbit.update();
      else {
        let f = 0, s = 0, turn = 0;
        if (keys.KeyW || keys.ArrowUp || pad.f) f += 1;
        if (keys.KeyS || keys.ArrowDown || pad.b) f -= 1;
        if (keys.KeyA) s -= 1;
        if (keys.KeyD) s += 1;
        if (keys.ArrowLeft || keys.KeyQ || pad.l) turn += 1;
        if (keys.ArrowRight || keys.KeyE || pad.r) turn -= 1;
        if (f || s || turn) stopTour();
        if (f || s) focusRoom = null;
        yaw += turn * 1.6 * dt;
        if (tour && !fading && tour.base != null) {
          tour.t += dt; yaw = tour.base + Math.sin(tour.t * 0.8) * 0.3;
          if (tour.t > 5.5) {
            tour.i++;
            if (tour.i >= tour.list.length) stopTour(); else tourStep();
          }
        }
        const mag = Math.hypot(f, s);
        if (mag > 0.01) {
          if (mag > 1) { f /= mag; s /= mag; }
          const sp = (keys.ShiftLeft || keys.ShiftRight ? 11 : 5.5) * dt;
          const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
          const dx = (fx * f + rx * s) * sp, dz = (fz * f + rz * s) * sp;
          if (!blocked(pos.x + dx, pos.y)) pos.x += dx;
          if (!blocked(pos.x, pos.y + dz)) pos.y += dz;
        }
        camera.position.set(pos.x, EYE, pos.y);
        camera.rotation.set(pitch, yaw, 0, 'YXZ');
      }
      const here = mode === 'walk' ? (focusRoom || roomAt(pos.x, pos.y)) : null;
      if (here !== lastRoom) { lastRoom = here; cb.current.setRoom(here); }
      drawMini();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      orbit.dispose();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
      mini.removeEventListener('click', onMini);
      if (root) disposeGroup(root);
      Object.values(TEX).forEach(({ t }) => t.dispose());
      Object.values(mats).forEach((m) => m.dispose());
      ground.geometry.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      engineRef.current = null;
    };
  }, [onClose]);

  /* ---------- UI handlers ---------- */
  const pickFlat = (id: GatewayFlat['id']) => { setFlatId(id); engineRef.current?.setFlat(id); };
  const toggleLang = () => {
    const l: GatewayLang = lang === 'en' ? 'te' : 'en';
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch { /* storage blocked */ }
    engineRef.current?.setLang(l);
  };
  const startShow = useCallback(() => { setIntro(false); engineRef.current?.startTour(); }, []);
  const padHandlers = (k: 'f' | 'b' | 'l' | 'r') => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault(); engineRef.current?.stopTour();
      if (engineRef.current) engineRef.current.pad[k] = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    },
    onPointerUp: () => { if (engineRef.current) engineRef.current.pad[k] = false; },
    onPointerCancel: () => { if (engineRef.current) engineRef.current.pad[k] = false; },
    onLostPointerCapture: () => { if (engineRef.current) engineRef.current.pad[k] = false; },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  const font = lang === 'te' ? 'var(--font-telugu), "Noto Sans Telugu", sans-serif' : 'var(--font-heading), Montserrat, sans-serif';
  const panel: React.CSSProperties = { background: 'rgba(255,255,255,.95)', border: '1px solid #e8d5d5', borderRadius: 14, boxShadow: '0 6px 22px rgba(20,10,10,.16)' };
  const btn: React.CSSProperties = { ...panel, minHeight: 48, padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, color: '#1a1a1a', cursor: 'pointer', fontFamily: font };
  const chip = (on: boolean): React.CSSProperties => ({
    flex: 'none', display: 'grid', justifyItems: 'center', alignContent: 'center', gap: 4, minWidth: 92, maxWidth: 124, height: 70,
    padding: '6px 10px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 600, lineHeight: 1.15, textAlign: 'center', fontFamily: font,
    border: `1px solid ${on ? RED : '#e8d5d5'}`, background: on ? '#fbeceb' : '#fff', color: on ? RED : '#1a1a1a',
  });
  const choice = (on: boolean): React.CSSProperties => ({ ...chip(on), height: 62, border: 'none', background: on ? RED : 'transparent', color: on ? '#fff' : '#1a1a1a' });
  const padBtn: React.CSSProperties = { ...panel, width: 56, height: 56, fontSize: 22, display: 'grid', placeItems: 'center', cursor: 'pointer', touchAction: 'none', userSelect: 'none', color: '#1a1a1a' };
  const roomKey = room && room.key !== 'passage' ? room.key : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="3D walkthrough of the V Grand Gateway flats"
      lang={lang}
      data-lenis-prevent
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#f3ece1', overscrollBehavior: 'none', fontFamily: font, color: '#1a1a1a' }}
    >
      <div ref={mountRef} style={{ position: 'absolute', inset: 0 }} />
      <div ref={fadeRef} style={{ position: 'absolute', inset: 0, background: '#0d1014', opacity: 0, pointerEvents: 'none', transition: 'opacity .35s ease', zIndex: 3 }} />

      {/* top row: flat type · language · view · help · close */}
      <div style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', left: 'max(12px, env(safe-area-inset-left))', right: 'max(12px, env(safe-area-inset-right))', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', zIndex: 5 }}>
        <div role="group" aria-label="Flat" style={{ ...panel, display: 'flex', padding: 4, gap: 4 }}>
          {gatewayFlats.map((f) => (
            <button key={f.id} type="button" aria-pressed={f.id === flatId} onClick={() => pickFlat(f.id)}
              style={{ border: 0, borderRadius: 10, padding: '7px 12px', cursor: 'pointer', display: 'grid', textAlign: 'left', gap: 1, fontFamily: font, background: f.id === flatId ? RED : 'transparent', color: f.id === flatId ? '#fff' : '#1a1a1a' }}>
              <b style={{ fontSize: 16 }}>{f.areaLabel}</b>
              <small style={{ fontSize: 11.5, opacity: 0.85 }}>{T.flat[f.id]}</small>
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button type="button" onClick={toggleLang} lang={lang === 'en' ? 'te' : 'en'} style={btn}>{T.langSwitch}</button>
          <button type="button" onClick={() => engineRef.current?.setMode(mode === 'walk' ? 'doll' : 'walk')} aria-label={mode === 'walk' ? T.top : T.walk} style={btn}>
            <Layers size={20} /><span className="hidden md:inline">{mode === 'walk' ? T.top : T.walk}</span>
          </button>
          <button type="button" onClick={() => setIntro(true)} aria-label={T.help} style={{ ...btn, width: 48, padding: 0, justifyContent: 'center', fontSize: 20 }}>?</button>
          <button type="button" onClick={onClose} aria-label={T.close} style={{ ...btn, width: 48, padding: 0, justifyContent: 'center', background: 'rgba(20,20,20,.72)', color: '#fff', border: 'none' }}><X size={22} /></button>
        </div>
      </div>

      {/* where am I */}
      <div className="top-[132px] md:top-[78px]" style={{ ...panel, position: 'absolute', left: '50%', transform: 'translateX(-50%)', padding: '10px 22px 11px', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 4 }}>
        <b style={{ display: 'block', fontSize: 21 }}>{mode === 'doll' ? T.whole : room ? T.rooms[room.key] : T.outside}</b>
        <span style={{ fontSize: 13, color: '#6b5b5b', fontFamily: 'ui-monospace, Consolas, monospace' }}>{mode === 'doll' ? `${flat.areaLabel} · 2BHK` : room?.dim ?? ''}</span>
      </div>

      {/* arrow pad — only in "I'll look myself" */}
      {mode === 'walk' && !tour && (
        <div aria-label="Walk buttons" style={{ position: 'absolute', left: 'max(12px, env(safe-area-inset-left))', bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 100px)', display: 'grid', gridTemplateColumns: 'repeat(3, 56px)', gridTemplateRows: 'repeat(2, 56px)', gap: 6, zIndex: 4 }}>
          <button type="button" aria-label="Walk forward" style={{ ...padBtn, gridColumn: 2, gridRow: 1 }} {...padHandlers('f')}>▲</button>
          <button type="button" aria-label="Turn left" style={{ ...padBtn, gridColumn: 1, gridRow: 2 }} {...padHandlers('l')}>◀</button>
          <button type="button" aria-label="Walk back" style={{ ...padBtn, gridColumn: 2, gridRow: 2 }} {...padHandlers('b')}>▼</button>
          <button type="button" aria-label="Turn right" style={{ ...padBtn, gridColumn: 3, gridRow: 2 }} {...padHandlers('r')}>▶</button>
        </div>
      )}

      {/* map (hidden on phones) */}
      <div className="hidden md:grid" style={{ ...panel, position: 'absolute', right: 'max(12px, env(safe-area-inset-right))', bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 100px)', padding: 8, gap: 6, zIndex: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b5b5b', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#d0762f', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.2)' }} />{T.map}
        </span>
        <canvas ref={miniRef} aria-label="Map. Click to go there." style={{ display: 'block', width: 200, borderRadius: 8, cursor: 'pointer' }} />
      </div>

      {/* tour progress */}
      {tour && (
        <div style={{ ...panel, position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(max(12px, env(safe-area-inset-bottom)) + 102px)', padding: '10px 16px', display: 'flex', gap: 12, fontWeight: 600, fontSize: 15, zIndex: 4, whiteSpace: 'nowrap' }}>
          <span>{T.touring}</span><span style={{ color: '#6b5b5b', fontFamily: 'ui-monospace, Consolas, monospace', fontWeight: 500 }}>{tour.i + 1} / {tour.n}</span>
        </div>
      )}

      {/* bottom bar: Show me / I'll look myself, then the rooms */}
      <nav aria-label="Rooms" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4, display: 'flex', gap: 8, overflowX: 'auto', padding: '10px max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))', background: 'linear-gradient(to top, rgba(255,255,255,.95) 65%, transparent)' }}>
        <div role="group" style={{ flex: 'none', display: 'flex', gap: 4, padding: 4, borderRadius: 15, background: '#f6ecea', border: '1px solid #e8d5d5', marginRight: 6 }}>
          <button type="button" aria-pressed={!!tour} onClick={() => { if (!tour) startShow(); }} style={choice(!!tour)}><Play size={24} fill="currentColor" /><span>{T.showMe}</span></button>
          <button type="button" aria-pressed={!tour} onClick={() => engineRef.current?.stopTour()} style={choice(!tour)}><Hand size={24} /><span>{T.myself}</span></button>
        </div>
        {flat.tour.map((k) => {
          const Icon = ROOM_ICON[k];
          return (
            <button key={k} type="button" onClick={() => engineRef.current?.pickRoom(k)} aria-current={roomKey === k ? 'location' : undefined} style={chip(roomKey === k)}>
              <Icon size={24} /><span>{T.rooms[k]}</span>
            </button>
          );
        })}
      </nav>

      {/* how to use */}
      {intro && !error && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setIntro(false); }} style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(10,8,8,.45)' }}>
          <div role="dialog" aria-modal="true" aria-labelledby="gw-intro-title" style={{ ...panel, maxWidth: 440, width: '100%', padding: '22px 22px 20px', display: 'grid', gap: 16 }}>
            <h2 id="gw-intro-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: font }}>{T.introTitle}</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
              {[[<Hand key="h" size={22} />, T.step1], [<span key="a" style={{ fontSize: 20 }}>▲</span>, T.step2], [<BedDouble key="b" size={22} />, T.step3]].map(([icon, text], i) => (
                <li key={i} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12, alignItems: 'center', fontSize: 16, lineHeight: 1.4 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: '#f6ecea', color: RED, display: 'grid', placeItems: 'center' }}>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'grid', gap: 8 }}>
              <button type="button" onClick={startShow} autoFocus style={{ minHeight: 54, borderRadius: 12, border: 'none', background: RED, color: '#fff', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: font }}>{T.showMe}</button>
              <button type="button" onClick={() => setIntro(false)} style={{ minHeight: 54, borderRadius: 12, border: '1px solid #e8d5d5', background: '#f6ecea', color: '#1a1a1a', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: font }}>{T.myself}</button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'grid', placeItems: 'center', color: '#3a2f25', textAlign: 'center', padding: 24, background: '#f3ece1' }}>
          <div>
            <p style={{ marginBottom: 16 }}>{error}</p>
            <button type="button" onClick={onClose} style={{ background: RED, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
