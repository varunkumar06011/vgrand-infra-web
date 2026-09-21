'use client';

/* eslint-disable @next/next/no-img-element -- the viewer needs raw <img>
   pixels for pan/zoom transforms; assets are pre-optimized WebP */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { TourScene } from '@/data/tours';

/**
 * Lightweight flat-photo renderer (no WebGL).
 *
 * Fit rules:
 * - never distort the photo;
 * - default view crops at most ~35% of the photo;
 * - if filling the viewer would crop more than that (e.g. a portrait
 *   photo in a wide desktop viewer, or a landscape photo on a tall
 *   phone), the photo is shown over a blurred, darkened copy of itself
 *   instead of empty bars.
 *
 * Gestures: drag to pan, pinch / wheel to zoom (1x–2.5x), double click
 * or double tap to toggle zoom. Panning is clamped to the overflowing
 * axis plus a small overscan pad also used for tilt parallax.
 */

const MAX_CROP = 0.35;
const MAX_CROP_NARROW = 0.2; // tighter fit on portrait/phone viewers
const OVERSCAN = 26; // px of extra pan slack, used for tilt parallax
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

export interface PhotoView {
  /** zoom factor relative to the fitted base scale */
  z: number;
  /** pan offset in px relative to a centred photo */
  tx: number;
  ty: number;
}

interface PhotoStageProps {
  scene: TourScene;
  /** resolved alt text (display strings live in the i18n maps) */
  alt: string;
  /** external tilt parallax, -1..1 on each axis */
  tilt: { x: number; y: number };
  /** hotspots/arrows laid over the photo, % coords — they track pan/zoom */
  children?: React.ReactNode;
  /** dev helper: report Shift+click positions as % of the photo */
  onShiftClick?: (x: number, y: number) => void;
  /** parent receives a zoom function: zoomAt(center, factor) */
  zoomApi?: React.MutableRefObject<((factor: number) => void) | null>;
  /**
   * Phase 3 variants — parent only passes variantSrc once the user has
   * asked for it (hover/tap/compare), so nothing is fetched at scene load.
   * variantOn crossfades the layer; comparePos != null clips it for the
   * before/after slider instead.
   */
  variantSrc?: string | null;
  variantOn?: boolean;
  comparePos?: number | null;
  /** compare mode freezes pan/zoom so the split stays meaningful */
  gesturesDisabled?: boolean;
  /**
   * Walk-through transition: while true, the view animates a zoom into
   * the centre of the photo before the parent swaps the scene — reads as
   * flying into the frame, Google-Maps style.
   */
  transiting?: boolean;
  /** any pan/zoom gesture — the guided tour uses it to pause auto-advance */
  onUserInteract?: () => void;
}

export default function PhotoStage({ scene, alt, tilt, children, onShiftClick, zoomApi, variantSrc, variantOn, comparePos, gesturesDisabled, transiting, onUserInteract }: PhotoStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLImageElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [photo, setPhoto] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<PhotoView>({ z: 1, tx: 0, ty: 0 });
  // variant layer fades in only after its pixels are actually decoded
  const [variantReady, setVariantReady] = useState(false);

  // pointerId -> current position / gesture-start position
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ z: number; tx: number; ty: number; dist: number } | null>(null);
  const lastTap = useRef(0);
  const viewRef = useRef(view);
  viewRef.current = view;

  /* ---- container size ---- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* ---- orientation-aware source ----
     tall viewers get the portrait take of the scene when one exists —
     far less cropping than squeezing the landscape frame onto a phone */
  const activeSrc = scene.portraitSrc && box.h > box.w ? scene.portraitSrc : scene.src;

  /* ---- base fit ---- */
  // narrow/portrait viewers get a tighter crop so more of the room shows
  const maxCrop = box.w < 768 ? MAX_CROP_NARROW : MAX_CROP;
  const contain = photo.w && box.w ? Math.min(box.w / photo.w, box.h / photo.h) : 0;
  const cover = photo.w && box.w ? Math.max(box.w / photo.w, box.h / photo.h) : 0;
  // cover is allowed when it crops <= maxCrop, otherwise back off to
  // 1/(1-maxCrop) x contain and fill the gaps with a blurred copy
  const base = cover <= contain / (1 - maxCrop) ? cover : contain / (1 - maxCrop);
  const blurFill = cover > contain / (1 - maxCrop);

  const photoW = photo.w * base * view.z;
  const photoH = photo.h * base * view.z;

  const clampView = useCallback(
    (v: PhotoView): PhotoView => {
      const w = photo.w * base * v.z;
      const h = photo.h * base * v.z;
      const bx = Math.max(0, (w - box.w) / 2) + OVERSCAN;
      const by = Math.max(0, (h - box.h) / 2) + OVERSCAN;
      return {
        z: v.z,
        tx: Math.min(bx, Math.max(-bx, v.tx)),
        ty: Math.min(by, Math.max(-by, v.ty)),
      };
    },
    [photo.w, photo.h, base, box.w, box.h]
  );

  const apply = useCallback((v: PhotoView) => setView(clampView(v)), [clampView]);

  /* ---- reset to the scene's focus point on scene/compare change ----
     Only a scene (or compare-mode) change re-fits. A pure container
     resize — phone URL-bar collapse, rotation, split-screen — must NOT
     snap the user's zoom back to 1x, so in that case we just re-clamp
     the current view into the new bounds. */
  const fitKeyRef = useRef('');
  useEffect(() => {
    if (!photo.w || !box.w) return;
    const fitKey = `${scene.id}:${gesturesDisabled ? 1 : 0}`;
    if (fitKeyRef.current === fitKey) {
      apply(viewRef.current);
      return;
    }
    fitKeyRef.current = fitKey;
    apply({
      z: 1,
      tx: (0.5 - scene.focus.x / 100) * photo.w * base,
      ty: (0.5 - scene.focus.y / 100) * photo.h * base,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id, photo.w, photo.h, box.w, box.h, base, gesturesDisabled]);

  /* ---- zoom keeping a container-relative point fixed ---- */
  const zoomAt = useCallback(
    (cx: number, cy: number, zNext: number) => {
      const v = viewRef.current;
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zNext));
      const px = cx - box.w / 2;
      const py = cy - box.h / 2;
      const k = z / v.z;
      apply({ z, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k });
    },
    [box.w, box.h, apply]
  );

  /* ---- toolbar +/- buttons: animate the zoom like a map app ----
     Gestures (pinch/wheel/drag) stay instant via zoomAt; only the
     discrete button path gets the ~240ms ease so the zoom actually
     reads on screen instead of jumping. */
  const zoomRaf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(zoomRaf.current), []);
  useEffect(() => {
    if (!zoomApi) return;
    zoomApi.current = (f: number) => {
      cancelAnimationFrame(zoomRaf.current);
      const zTo = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, viewRef.current.z * f));
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        zoomAt(box.w / 2, box.h / 2, zTo);
        return;
      }
      const zFrom = viewRef.current.z;
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 240);
        const ease = 1 - Math.pow(1 - p, 3);
        zoomAt(box.w / 2, box.h / 2, zFrom + (zTo - zFrom) * ease);
        if (p < 1) zoomRaf.current = requestAnimationFrame(step);
      };
      zoomRaf.current = requestAnimationFrame(step);
    };
    return () => {
      zoomApi.current = null;
    };
  }, [zoomApi, zoomAt, box.w, box.h]);

  /* ---- walk-through zoom: dive into the centre of the photo just
     before the parent swaps scenes. transform transitions only while
     transiting, so gesture pans stay instant. ---- */
  useEffect(() => {
    if (!transiting || !photo.w || !box.w) return;
    apply({ z: 1.5, tx: 0, ty: 0 });
  }, [transiting, photo.w, box.w, apply]);

  /* ---- reset dimensions when the scene image changes ---- */
  useEffect(() => {
    setPhoto({ w: 0, h: 0 });
  }, [activeSrc]);

  /* ---- measure the scene photo ----
     onLoad alone is not enough: an img that completes before the
     listener attaches (cache, remount, fast-refresh, a mid-transition
     mount) never fires `load` again and would leave the stage black.
     Read `complete` directly and poll briefly as a safety net. */
  useEffect(() => {
    if (photo.w) return;
    const img = measureRef.current;
    if (!img) return;
    const read = () => {
      if (img.complete && img.naturalWidth > 0) {
        setPhoto({ w: img.naturalWidth, h: img.naturalHeight });
      }
    };
    read();
    img.addEventListener('load', read);
    const poll = window.setInterval(read, 120);
    const giveUp = window.setTimeout(() => window.clearInterval(poll), 5000);
    return () => {
      img.removeEventListener('load', read);
      window.clearInterval(poll);
      window.clearTimeout(giveUp);
    };
  }, [photo.w, activeSrc, box.w]);

  /* ---- variant layer reload flag ---- */
  useEffect(() => {
    setVariantReady(false);
  }, [variantSrc]);

  /* ---- gestures ---- */
  const handleDown = (e: React.PointerEvent) => {
    if (gesturesDisabled || transiting) return;
    onUserInteract?.();
    // a grab cancels any in-flight toolbar zoom animation
    cancelAnimationFrame(zoomRaf.current);
    // presses on in-photo controls (walk pills, spec dots) must stay clicks —
    // capturing the pointer would retarget pointerup/click to the stage
    if ((e.target as HTMLElement).closest('button, a')) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = { z: viewRef.current.z, tx: viewRef.current.tx, ty: viewRef.current.ty, dist: 0 };
    if (pointers.current.size === 2) {
      const [a, b] = [...start.current.values()];
      g.dist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    gesture.current = g;
  };

  const handleMove = (e: React.PointerEvent) => {
    if (gesturesDisabled || transiting) return;
    const g = gesture.current;
    if (!g || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const [a0, b0] = [...start.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const mid0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
      const rect = containerRef.current!.getBoundingClientRect();
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, g.z * (dist / (g.dist || 1))));
      const px = mid.x - rect.left - box.w / 2;
      const py = mid.y - rect.top - box.h / 2;
      // pan by midpoint delta, then zoom around the midpoint
      const pTx = g.tx + (mid.x - mid0.x);
      const pTy = g.ty + (mid.y - mid0.y);
      const k = z / g.z;
      apply({ z, tx: px - (px - pTx) * k, ty: py - (py - pTy) * k });
      return;
    }

    const s = start.current.get(e.pointerId)!;
    apply({ z: g.z, tx: g.tx + (e.clientX - s.x), ty: g.ty + (e.clientY - s.y) });
  };

  const handleUp = (e: React.PointerEvent) => {
    if (gesturesDisabled || transiting) return;
    if (!pointers.current.has(e.pointerId)) return; // press started on a control
    const wasPinch = pointers.current.size >= 2;
    pointers.current.delete(e.pointerId);
    start.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
      const now = Date.now();
      if (!wasPinch && now - lastTap.current < 320) {
        const rect = containerRef.current!.getBoundingClientRect();
        zoomAt(e.clientX - rect.left, e.clientY - rect.top, viewRef.current.z > 1.2 ? 1 : 1.9);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    } else if (pointers.current.size === 1) {
      // re-seed a single-pan gesture after a pinch ends
      const [id] = [...pointers.current.keys()];
      const p = pointers.current.get(id)!;
      start.current.set(id, { x: p.x, y: p.y });
      gesture.current = { z: viewRef.current.z, tx: viewRef.current.tx, ty: viewRef.current.ty, dist: 0 };
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (gesturesDisabled || transiting) return;
    onUserInteract?.();
    const rect = containerRef.current!.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, viewRef.current.z * Math.exp(-e.deltaY * 0.0016));
  };

  const finalTx = view.tx + tilt.x * OVERSCAN;
  const finalTy = view.ty + tilt.y * OVERSCAN;

  const handleClick = (e: React.MouseEvent) => {
    if (!e.shiftKey || !onShiftClick || !photo.w) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const lx = rect.left + box.w / 2 + finalTx - photoW / 2;
    const ly = rect.top + box.h / 2 + finalTy - photoH / 2;
    const x = ((e.clientX - lx) / photoW) * 100;
    const y = ((e.clientY - ly) / photoH) * 100;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      onShiftClick(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden select-none"
      style={{ touchAction: 'none', cursor: view.z > 1 ? 'grab' : 'default' }}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* blurred backdrop when the photo can't fill the frame */}
      {blurFill && photo.w > 0 && (
        <img
          src={activeSrc}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            position: 'absolute',
            inset: '-6%',
            width: '112%',
            height: '112%',
            maxWidth: 'none',
            objectFit: 'cover',
            filter: 'blur(42px) brightness(0.45) saturate(1.15)',
            transform: 'scale(1.02)',
          }}
        />
      )}

      {/* photo layer — hotspots live inside so they track pan/zoom */}
      {photo.w > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: photoW,
            height: photoH,
            transform: `translate3d(${finalTx - photoW / 2}px, ${finalTy - photoH / 2}px, 0)`,
            transition: transiting ? 'transform 460ms cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
          }}
        >
          {/* slow idle drift (Ken Burns) — keeps the still photo feeling
              like motion; hotspots ride along since they share the layer.
              Frozen while comparing variants so the split stays put. */}
          <div
            className={gesturesDisabled ? undefined : 'tour-drift'}
            style={{ position: 'absolute', inset: 0 }}
          >
            <img
              src={activeSrc}
              alt={alt}
              draggable={false}
              style={{ width: '100%', height: '100%', maxWidth: 'none', display: 'block' }}
            />
            {/* variant layer — same aspect ratio enforced by the pipeline,
                so it shares the base image's box exactly */}
            {variantSrc && (
              <img
                src={variantSrc}
                alt=""
                aria-hidden
                draggable={false}
                onLoad={() => setVariantReady(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  maxWidth: 'none',
                  display: 'block',
                  opacity: comparePos != null ? (variantReady ? 1 : 0) : variantOn && variantReady ? 1 : 0,
                  transition: 'opacity 250ms ease',
                  clipPath:
                    comparePos != null ? `inset(0 0 0 ${comparePos}%)` : undefined,
                }}
              />
            )}
            {children}
          </div>
        </div>
      ) : box.w > 0 ? (
        /* invisible pre-measure image — waits for the first box read so
           portrait phones don't fetch the landscape file first */
        <img
          ref={measureRef}
          src={activeSrc}
          alt=""
          aria-hidden
          draggable={false}
          onLoad={(e) =>
            setPhoto({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: 0 }}
        />
      ) : null}
    </div>
  );
}
