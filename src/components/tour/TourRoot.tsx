'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin from /public/tour */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Play } from 'lucide-react';
import type { TourConfig, TourLang, TourText } from '@/data/tours';
import { textFor, readStoredLang, storeLang, loadTourText, fmt } from './tourText';

// next/dynamic with ssr:false must live inside a Client Component —
// the heavy viewer (and, for pano scenes, three.js) never ships in the
// initial page bundle.
const TourViewer = dynamic(() => import('./TourViewer'), { ssr: false });

export default function TourRoot({ tour }: { tour: TourConfig }) {
  const [open, setOpen] = useState(false);
  const [startAt, setStartAt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  // SSR-safe: default 'en', then hydrate the stored choice in an effect
  const [lang, setLang] = useState<TourLang>('en');
  /** lazily imported language maps (te etc.) — en ships inline */
  const [extraText, setExtraText] = useState<Partial<Record<TourLang, TourText>>>({});

  const scenes = tour.scenes.filter((s) => s.enabled);

  useEffect(() => {
    const stored = readStoredLang(tour);
    setLang(stored);
    if (stored !== 'en') {
      loadTourText(tour, stored).then((t) => {
        if (t) setExtraText((m) => ({ ...m, [stored]: t }));
      });
    }
  }, [tour]);

  const changeLang = (l: TourLang) => {
    if (l !== 'en' && !extraText[l]) {
      loadTourText(tour, l).then((t) => {
        if (t) setExtraText((m) => ({ ...m, [l]: t }));
      });
    }
    setLang(l);
    storeLang(l);
  };

  const text = extraText[lang] ?? textFor(tour, lang);

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

  // /projects/<slug>?tour=open — launched from the "View Flat" card button:
  // scroll the block into view, open the viewer, then clean the param out.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') !== 'open') return;
    wrapRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    setOpen(true);
    params.delete('tour');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
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
        aria-label={text.ui.posterAria}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openAt(0);
          }
        }}
      >
        <img
          src={tour.poster}
          alt={text.ui.posterAria}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          style={{ maxWidth: 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="absolute top-4 left-4 flex gap-2">
          {[text.meta.flatLabel, text.meta.area, text.meta.facing].map((chip) => (
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
            {text.ui.posterCta}
          </span>
        </div>

        <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-white/70 px-4">
          {text.ui.posterSub}
        </p>
      </div>

      {/* room list — real crawlable markup, each thumb opens its own scene */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-8">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => openAt(i)}
            className="group relative rounded-lg overflow-hidden border border-[#e8d5d5] text-left cursor-pointer bg-white"
            aria-label={fmt(text.ui.openAtRoom, { room: text.scenes[s.id]?.room ?? s.id })}
          >
            <img
              src={s.thumb}
              alt={text.scenes[s.id]?.alt ?? ''}
              loading="lazy"
              className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ maxWidth: 'none' }}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pt-6 pb-2">
              <span className="block text-white text-[12px] font-semibold leading-tight">
                {text.scenes[s.id]?.room ?? s.id}
              </span>
              <span className="block text-white/60 text-[10px]">{text.scenes[s.id]?.zone}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="text-[11px] mt-4 leading-relaxed" style={{ color: '#888' }}>
        {text.meta.disclaimer}
      </p>

      {/* portal to body — escapes ancestor stacking contexts (opacity,
          transforms, isolation) so the fixed viewer + its z-index really
          sit above page chrome like the floating WhatsApp button */}
      {open &&
        createPortal(
          <TourViewer
            tour={tour}
            initialIndex={startAt}
            onClose={() => setOpen(false)}
            lang={lang}
            text={text}
            onLangChange={changeLang}
          />,
          document.body
        )}
    </div>
  );
}
