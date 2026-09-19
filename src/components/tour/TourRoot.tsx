'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin from /public/tour */

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play } from 'lucide-react';
import type { TourConfig } from '@/data/tours';
import TourScrollWalk from './TourScrollWalk';

// next/dynamic with ssr:false must live inside a Client Component —
// the heavy viewer (and, for pano scenes, three.js) never ships in the
// initial page bundle.
const TourViewer = dynamic(() => import('./TourViewer'), { ssr: false });

export default function TourRoot({ tour }: { tour: TourConfig }) {
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const scenes = tour.scenes.filter((s) => s.enabled);

  // warm the viewer chunk when the block nears the viewport so opening
  // feels instant, without loading it for users who never scroll here
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          import('./TourViewer');
          io.disconnect();
        }
      },
      { rootMargin: '700px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openAt = (i: number) => {
    setStartAt(i);
    setOpen(true);
  };

  return (
    <div ref={wrapRef}>
      {/* poster card — reserves its aspect ratio, no layout shift */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-[#e8d5d5] shadow-lg group cursor-pointer"
        style={{ aspectRatio: '16 / 9' }}
        onClick={() => openAt(0)}
        role="button"
        tabIndex={0}
        aria-label="Start the 3 BHK virtual walkthrough"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openAt(0);
          }
        }}
      >
        <img
          src={tour.poster}
          alt="Living room of the Elite Homes 3 BHK sample flat — start the virtual tour"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          style={{ maxWidth: 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="absolute top-4 left-4 flex gap-2">
          {[tour.flatLabel, tour.area, tour.facing].map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-[11px] font-semibold px-3 py-1 tracking-wide"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-3 rounded-full bg-[#C0392B] hover:bg-[#a93226] text-white pl-5 pr-6 py-3.5 font-semibold shadow-2xl transition-transform group-hover:scale-105">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Play size={15} className="ml-0.5" />
            </span>
            Start the walkthrough
          </span>
        </div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/70 px-4">
          Walk room to room with photos, a live floor plan and spec hotspots.
        </p>
      </div>

      {/* scroll-walk hero */}
      <div className="mt-8">
        <TourScrollWalk tour={tour} onStart={() => openAt(0)} />
      </div>

      {/* room list — real crawlable markup, each thumb opens that scene */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-8">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => openAt(i)}
            className="group relative rounded-lg overflow-hidden border border-[#e8d5d5] text-left cursor-pointer bg-white"
            aria-label={`Open the tour at ${s.room}`}
          >
            <img
              src={s.thumb}
              alt={s.alt}
              loading="lazy"
              className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ maxWidth: 'none' }}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pt-6 pb-2">
              <span className="block text-white text-[12px] font-semibold leading-tight">
                {s.room}
              </span>
              <span className="block text-white/60 text-[10px]">{s.zone}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] mt-4 leading-relaxed" style={{ color: '#888' }}>
        {tour.disclaimer}
      </p>

      {open && (
        <TourViewer tour={tour} initialIndex={startAt} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
