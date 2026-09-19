'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin; plain <img> gives precise transform control */

import React, { useRef, useSyncExternalStore } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { TourConfig, TourScene } from '@/data/tours';

/**
 * Scroll-walk: a tall sticky sequence where the flat's photos cross-fade
 * in walk order as the user scrolls — like walking through the flat —
 * ending with a CTA that opens the interactive tour.
 *
 * The sticky frame sits below the fixed 84px navbar. All imagery is
 * lazy-loaded and below the fold, so it cannot hurt LCP.
 */

function WalkLayer({
  progress,
  range,
  scene,
  index,
  reduced,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  scene: TourScene;
  index: number;
  reduced: boolean;
}) {
  const [s, e] = range;
  const fade = Math.min(0.35, (e - s) * 0.4);
  const opacity = useTransform(progress, [s, s + fade, e - fade, e], [0, 1, 1, 0]);
  const scale = useTransform(progress, [s, e], reduced ? [1, 1] : [1, 1.06]);
  const y = useTransform(progress, [s, e], reduced ? ['0%', '0%'] : ['2.5%', '-2.5%']);

  return (
    <motion.div className="absolute inset-0" style={{ opacity, scale, y }}>
      <img
        src={scene.src}
        alt={scene.alt}
        loading={index === 0 ? 'eager' : 'lazy'}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ maxWidth: 'none' }}
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/30" />
      <div className="absolute left-5 md:left-10 bottom-8 md:bottom-10">
        <p
          className="text-[10px] md:text-[11px] font-bold tracking-[0.24em] uppercase text-white/70"
          style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
        >
          {String(index + 1).padStart(2, '0')} — {scene.zone}
        </p>
        <p
          className="text-white font-bold text-xl md:text-3xl mt-1"
          style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
        >
          {scene.room}
        </p>
      </div>
    </motion.div>
  );
}

export default function TourScrollWalk({ tour, onStart }: { tour: TourConfig; onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );

  const scenes = tour.scenes.filter((s) => s.enabled && s.kind === 'photo');
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const segments = scenes.length + 1; // last segment = CTA
  const seg = 1 / segments;
  const ctaOpacity = useTransform(
    scrollYProgress,
    [1 - seg, 1 - seg / 2],
    [0, 1]
  );

  if (scenes.length === 0) return null;

  // reduced motion: a plain static teaser instead of the scroll sequence
  if (reduced) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-[#e8d5d5] mb-6">
        <img src={scenes[0].src} alt={scenes[0].alt} className="w-full aspect-[16/9] object-cover" />
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 to-transparent p-6">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-3 rounded-full font-semibold cursor-pointer border-none"
          >
            Explore the flat yourself <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative" style={{ height: `${segments * 62}vh` }} aria-hidden={false}>
      <div
        className="sticky overflow-hidden rounded-xl border border-[#e8d5d5]"
        style={{ top: 84, height: 'calc(100vh - 84px)' }}
      >
        {scenes.map((scene, i) => (
          <WalkLayer
            key={scene.id}
            progress={scrollYProgress}
            // the last photo stays up under the CTA card
            range={[i * seg, i === scenes.length - 1 ? 1 : (i + 1) * seg]}
            scene={scene}
            index={i}
            reduced={reduced}
          />
        ))}

        {/* CTA card over the final segment */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: ctaOpacity }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative text-center px-6">
            <p
              className="text-[11px] font-bold tracking-[0.24em] uppercase text-white/70 mb-3"
              style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
            >
              {tour.projectName} · {tour.flatLabel} · {tour.area}
            </p>
            <h3
              className="text-white font-bold text-2xl md:text-4xl mb-6"
              style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
            >
              Explore the flat yourself
            </h3>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 bg-[#C0392B] hover:bg-[#a93226] text-white px-8 py-4 rounded-full font-semibold text-base shadow-2xl transition-all hover:scale-105 cursor-pointer border-none"
            >
              Start the walkthrough <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* progress rail */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
          {scenes.map((s, i) => (
            <ScrollDot key={s.id} progress={scrollYProgress} at={i * seg + seg / 2} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScrollDot({ progress, at }: { progress: MotionValue<number>; at: number }) {
  const lo = Math.max(0, at - 0.05);
  const hi = Math.min(1, at + 0.05);
  const opacity = useTransform(progress, [lo, at, hi], [0.35, 1, 0.35]);
  const scale = useTransform(progress, [lo, at, hi], [1, 1.5, 1]);
  return (
    <motion.span
      style={{ opacity, scale }}
      className="block w-1.5 h-1.5 rounded-full bg-white"
    />
  );
}
