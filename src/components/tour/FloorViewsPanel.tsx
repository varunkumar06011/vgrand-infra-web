'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin; plain <img> gives precise transition control */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import type { FloorViewsConfig, TourLang, TourUIStrings } from '@/data/tours';
import { capturedMonthYear, facingToHeading, fmt } from './tourText';
import CompassNeedle from './CompassNeedle';

/**
 * "View from your floor" — real balcony photos per floor.
 * The parent only renders this when floorViews.verified && floors >= 2.
 *
 * Layout: bottom sheet on phones, right-side panel on desktop.
 * The vertical slider is keyboard + touch accessible (role="slider",
 * aria-orientation="vertical") and never touches Lenis or the stage.
 */

interface Props {
  config: FloorViewsConfig;
  ui: TourUIStrings;
  lang: TourLang;
  onClose: () => void;
}

export default function FloorViewsPanel({ config, ui, lang, onClose }: Props) {
  const floors = useMemo(() => [...config.floors].sort((a, b) => a.floor - b.floor), [config.floors]);
  const n = floors.length;
  const [idx, setIdx] = useState(() => Math.floor(n / 2));
  // images mount lazily on first selection, then stay mounted so
  // switching floors is an opacity/parallax transition, not a fetch
  const [seen, setSeen] = useState<Set<number>>(() => new Set([Math.floor(n / 2)]));
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const dirLabel = ui.facingNames?.[config.facing] ?? config.facing;
  const floorName = (i: number) =>
    ui.floorLabels?.[floors[i].floor] ?? fmt(ui.floorLabel, { n: floors[i].floor });

  const pick = useCallback(
    (i: number) => {
      const c = Math.max(0, Math.min(n - 1, i));
      setIdx(c);
      setSeen((s) => (s.has(c) ? s : new Set(s).add(c)));
      // warm the neighbours for instant next steps (cached: cheap repeat)
      [c - 1, c + 1].forEach((j) => {
        if (j >= 0 && j < n) {
          const im = new window.Image();
          im.src = floors[j].src;
        }
      });
    },
    [n, floors]
  );

  /* ---- vertical slider ---- */
  const idxFromY = useCallback(
    (clientY: number) => {
      const r = trackRef.current?.getBoundingClientRect();
      if (!r || !r.height) return;
      const t = 1 - (clientY - r.top) / r.height; // bottom=0 → top=n-1
      pick(Math.round(t * (n - 1)));
    },
    [n, pick]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    idxFromY(e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.stopPropagation();
    idxFromY(e.clientY);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    let next: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = idx + 1;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = idx - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'PageUp') next = idx + 1;
    else if (e.key === 'PageDown') next = idx - 1;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    pick(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.25 }}
      data-lenis-prevent
      role="dialog"
      aria-label={ui.floorViews}
      className="absolute z-30 left-0 right-0 bottom-0 md:left-auto md:top-0 md:right-0 md:bottom-0 md:w-[340px] max-h-[82vh] md:max-h-none bg-[#141416]/95 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/15 shadow-2xl flex flex-col"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <p
          className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#FFB4AB]"
          style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
        >
          {ui.floorViews}
        </p>
        <button
          onClick={onClose}
          aria-label={ui.closeCard}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/60 cursor-pointer shrink-0"
        >
          <X size={16} />
        </button>
      </div>

      {/* photo + slider */}
      <div className="relative mx-4 rounded-xl overflow-hidden bg-black/40 border border-white/10 aspect-[4/3] shrink-0">
        {floors.map((f, i) =>
          seen.has(i) ? (
            <img
              key={f.floor}
              src={f.src}
              alt={i === idx ? f.alt : ''}
              aria-hidden={i !== idx}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                maxWidth: 'none',
                opacity: i === idx ? 1 : 0,
                transform: `translateY(${(i - idx) * 10}px) scale(1.04)`,
                transition: 'opacity 320ms ease, transform 480ms ease',
              }}
            />
          ) : null
        )}

        {/* facing chip */}
        <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/85 pointer-events-none">
          <CompassNeedle heading={facingToHeading(config.facing)} />
          {fmt(ui.facingChip, { dir: dirLabel })}
        </span>

        {/* vertical floor slider — top of the track is the top floor */}
        <div
          ref={trackRef}
          role="slider"
          tabIndex={0}
          aria-label={ui.floorAria}
          aria-orientation="vertical"
          aria-valuemin={1}
          aria-valuemax={n}
          aria-valuenow={idx + 1}
          aria-valuetext={floorName(idx)}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute right-2 inset-y-3 w-8 z-10 outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B] rounded-full"
          style={{ touchAction: 'none' }}
        >
          {/* track */}
          <div className="absolute right-3.5 inset-y-0 w-0.5 bg-white/30 rounded-full" />
          {floors.map((f, i) => {
            const top = (1 - i / (n - 1)) * 100;
            const isOn = i === idx;
            return (
              <div key={f.floor} className="absolute right-0 w-8 h-8" style={{ top: `calc(${top}% - 16px)` }}>
                <span
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full transition-all ${
                    isOn ? 'w-4 h-4 bg-[#C0392B] border-2 border-white shadow' : 'w-2 h-2 bg-white/70'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* stepper + label */}
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => pick(idx - 1)}
            disabled={idx === 0}
            aria-label={fmt(ui.floorLabel, { n: floors[Math.max(0, idx - 1)].floor })}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white cursor-pointer"
          >
            <ChevronDown size={15} />
          </button>
          <button
            onClick={() => pick(idx + 1)}
            disabled={idx === n - 1}
            aria-label={fmt(ui.floorLabel, { n: floors[Math.min(n - 1, idx + 1)].floor })}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white cursor-pointer"
          >
            <ChevronUp size={15} />
          </button>
        </div>
        <p className="text-right">
          <span
            className="block text-white font-bold text-sm leading-tight"
            style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
          >
            {floorName(idx)}
          </span>
          <span className="block text-white/50 text-[10px]">
            {fmt(ui.sceneOf, { a: idx + 1, b: n })}
          </span>
        </p>
      </div>

      {/* honesty note — always visible */}
      <p className="px-4 pt-2 pb-4 text-[10px] leading-relaxed text-white/50">
        {fmt(ui.capturedNote, { date: capturedMonthYear(config.capturedOn, lang) })}
      </p>
    </motion.div>
  );
}
