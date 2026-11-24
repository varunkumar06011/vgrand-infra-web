'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Move3d, Play } from 'lucide-react';
import PlanSvg from '@/components/flat3d/PlanSvg';
import type { PlanId } from '@/components/flat3d/plans';

// three.js + the whole walkthrough only load when the visitor gets near this block
const FlatExperience = dynamic(() => import('@/components/flat3d/FlatExperience'), { ssr: false });

const PLANS: PlanId[] = ['g900', 'g970'];
const FEATURES = ['Furnished rooms', 'Tap a room to go there', 'English & తెలుగు', 'Furnished vs empty', 'Morning to night', '900 & 970 sq.ft'];

/** "Step inside" card for V Grand Gateway — opens the shared flat3d walkthrough on the two 2 BHK plans. */
export default function GatewayWalkthrough() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // warm the viewer chunk when the block nears the viewport
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          import('@/components/flat3d/FlatExperience');
          io.disconnect();
        }
      },
      { rootMargin: '600px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // lock page scroll while the walkthrough is open, and let the page's own 3D intro stand down
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.dispatchEvent(new CustomEvent('flat3d:open', { detail: true }));
    return () => {
      document.body.style.overflow = prev;
      window.dispatchEvent(new CustomEvent('flat3d:open', { detail: false }));
    };
  }, [open]);

  // /projects/v-grand-gateway?tour=open — launched from the "View Flat" card button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') !== 'open') return;
    wrapRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    queueMicrotask(() => setOpen(true));
    params.delete('tour');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={wrapRef}>
      <h2 className="font-heading text-forest">Step inside the 2 BHK</h2>
      <p className="mt-4 !text-[17px] !leading-[1.8]">
        Walk through the furnished 900 sq.ft and 970 sq.ft flats in 3D, on your phone or laptop. Both are built to scale from the
        architect&apos;s floor plan — let us show you every room, or tap a room and look around yourself. Available in English and{' '}
        <span lang="te" style={{ fontFamily: 'var(--font-telugu), sans-serif' }}>తెలుగు</span>.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open the 3D walkthrough of the 2 BHK flats"
        className="group relative mt-8 block w-full overflow-hidden rounded-xl bg-forest text-left"
      >
        <span aria-hidden className="dither-bg-dark absolute inset-0 opacity-70" />
        <span className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 md:p-9">
          <span aria-hidden className="flex shrink-0 items-end justify-center gap-4 sm:gap-5">
            {PLANS.map((id, i) => (
              <PlanSvg
                key={id}
                plan={id}
                className={`h-[104px] w-[136px] transition-transform duration-700 ease-out group-hover:-translate-y-1 md:h-[124px] md:w-[164px] ${i ? 'delay-75' : ''}`}
              />
            ))}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-meadow-400">
              <Move3d size={15} /> 3D walkthrough
            </span>
            <span className="mt-3 block font-heading text-[clamp(22px,3vw,30px)] leading-tight text-white">Walk every room before you visit.</span>
            <span className="mt-4 flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <span key={f} className="rounded-md border border-white/20 px-2.5 py-1 text-[12px] text-white/85">{f}</span>
              ))}
            </span>
            <span className="mt-6 inline-flex items-center gap-2 rounded-lg bg-meadow-600 px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-meadow-500">
              <Play size={16} /> Enter the 3D home
            </span>
          </span>
        </span>
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <FlatExperience onClose={close} projectName="V Grand Gateway" plans={PLANS} telugu roomBar />,
        document.body,
      )}
    </div>
  );
}
