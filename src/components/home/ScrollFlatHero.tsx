'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'framer-motion';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import { SITE_WHATSAPP_NUMBER } from '@/lib/site';
import type { FlatTourChapter, FlatTourConfig } from '@/data/flatTours';

// three.js + model are only fetched on the client, after first paint
const FlatScene = dynamic(() => import('./FlatScene'), { ssr: false });

const NAVBAR_H = 84;

function ChapterBlock({ progress, chapter, last, first, children }: {
  progress: MotionValue<number>; chapter: FlatTourChapter; last: boolean; first: boolean; children: React.ReactNode;
}) {
  const [a, b] = chapter.range;
  const fade = Math.min(0.03, (b - a) / 3);
  // function-form transforms keep these on the JS main thread; the keyframe form is promoted to a
  // scroll-linked CSS animation whose timeline disagrees with the sticky container
  const level = (p: number) => {
    if (p < a) return first ? 1 : 0;
    if (p < a + fade) return first ? 1 : (p - a) / fade;
    if (last || p < b - fade) return 1;
    return p < b ? (b - p) / fade : 0;
  };
  const opacity = useTransform(progress, level);
  const y = useTransform(progress, (p) => {
    if (p < a + fade) return first ? 0 : 28 * (1 - level(p));
    if (last || p < b - fade) return 0;
    return -28 * (1 - level(p));
  });
  const pe = useTransform(progress, (p) => (p > a + 0.01 && (last || p < b - 0.01) ? 'auto' : 'none'));
  const align = chapter.align === 'left' ? 'items-start text-left' : chapter.align === 'right' ? 'items-end text-right' : 'items-center text-center';
  return (
    <motion.div
      style={{ opacity, y, pointerEvents: pe }}
      className={`absolute inset-0 flex flex-col justify-end md:justify-center ${align} px-6 md:px-[8vw] pb-[16vh] md:pb-0`}
    >
      {children}
    </motion.div>
  );
}

const eyebrow = "text-[11px] md:text-xs tracking-[4px] uppercase font-bold text-white mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] before:content-[''] before:inline-block before:w-8 before:h-[2px] before:bg-[#C0392B] before:align-middle before:mr-3";
const headline = 'font-heading font-extrabold text-white leading-[1.02] tracking-tight text-[clamp(34px,5.4vw,76px)] max-w-[14ch] drop-shadow-[0_4px_30px_rgba(0,0,0,0.65)]';
const sub = 'mt-5 text-white/90 text-[15px] md:text-lg leading-relaxed max-w-[44ch] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]';

/**
 * Scroll-pinned 3D intro for a project page. `fallback` is rendered instead when the
 * device can't (or shouldn't) run it: reduced motion, data-saver, low memory, no WebGL.
 */
export default function ScrollFlatHero({ tour, projectName, fallback }: {
  tour: FlatTourConfig; projectName: string; fallback: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [status, setStatus] = useState<'checking' | 'loading' | 'ready' | 'fallback'>('checking');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    queueMicrotask(() => setStatus(reduced || saveData || (mem !== undefined && mem < 3) ? 'fallback' : 'loading'));
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: [`start ${NAVBAR_H}px`, 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => { progressRef.current = v; });

  const hintOpacity = useTransform(scrollYProgress, (p) => Math.max(0, 1 - p / 0.03));
  const railScale = useTransform(scrollYProgress, (p) => p);

  if (status === 'fallback') return <>{fallback}</>;

  const lastIdx = tour.chapters.length - 1;

  return (
    <section
      ref={sectionRef}
      style={{ height: `${tour.scrollVh}vh` }}
      className="relative bg-[radial-gradient(ellipse_at_50%_40%,#3a1612_0%,#120d0d_70%)]"
      aria-label={`3D tour of the ${projectName} flat`}
    >
      <div className="sticky overflow-hidden w-full" style={{ top: NAVBAR_H, height: `calc(100svh - ${NAVBAR_H}px)` }}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('${tour.poster}')`, opacity: status === 'ready' ? 0 : 0.35 }}
        />
        {status !== 'checking' && (
          <div className={`absolute inset-0 transition-opacity duration-1000 ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}>
            <FlatScene
              url={tour.modelUrl}
              camPath={tour.camPath}
              lookPath={tour.lookPath}
              shiftKeys={tour.shiftKeys}
              progressRef={progressRef}
              onReady={() => setStatus('ready')}
              onError={() => setStatus('fallback')}
            />
          </div>
        )}

        {/* readability: soft vignette + a gentle darkening, text also carries its own shadow */}
        <div className="absolute inset-0 pointer-events-none bg-black/10" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.28)_100%)]" />

        {tour.chapters.map((c, i) => (
          <ChapterBlock key={i} progress={scrollYProgress} chapter={c} first={i === 0} last={i === lastIdx}>
            <p className={eyebrow}>{c.eyebrow}</p>
            {i === 0 ? (
              <h1 className={headline}>
                {c.title}
                <span className="sr-only"> {projectName} — V Grand Infra, Ongole</span>
              </h1>
            ) : (
              <h2 className={headline}>{c.title}</h2>
            )}
            <p className={sub}>{c.text}</p>
            {i === lastIdx && (
              <div className="mt-8 flex flex-wrap gap-4 justify-center">
                <a
                  href={tour.ctaHref}
                  className="bg-[#C0392B] hover:bg-[#a93226] text-white py-4 px-9 rounded-md font-bold text-[15px] no-underline transition-colors"
                >
                  {tour.ctaLabel}
                </a>
                <WhatsAppButton variant="pill" phoneNumber={SITE_WHATSAPP_NUMBER} showText={true} />
              </div>
            )}
          </ChapterBlock>
        ))}

        {status === 'loading' && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/70 text-xs tracking-[3px] uppercase">
            Loading 3D flat…
          </div>
        )}

        <motion.div style={{ opacity: hintOpacity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-white/80 text-[10px] tracking-[4px] uppercase drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">Scroll</span>
          <span className="block w-px h-10 bg-gradient-to-b from-white/80 to-transparent animate-pulse" />
        </motion.div>

        <div className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 h-40 w-px bg-white/20 overflow-hidden">
          <motion.div style={{ scaleY: railScale }} className="origin-top h-full w-full bg-[#C0392B]" />
        </div>
      </div>
    </section>
  );
}
