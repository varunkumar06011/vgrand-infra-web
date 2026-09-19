'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin; plain <img> gives precise transform control */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Map as MapIcon,
  Smartphone, RotateCcw, Info, ArrowRight, LayoutGrid, CalendarCheck,
} from 'lucide-react';
import type { TourConfig, TourHotspot } from '@/data/tours';
import PhotoStage from './PhotoStage';
import FloorplanMinimap from './FloorplanMinimap';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import EnquireModal from '@/components/EnquireModal';
import BrochureDownload from '@/components/BrochureDownload';
import { SITE_WHATSAPP_NUMBER } from '@/lib/site';

// Only ever loaded when a kind:'pano' scene is entered — keeps three.js
// out of the bundle while all scenes are flat photos.
const PanoStage = dynamic(() => import('./PanoStage'), { ssr: false });

const IS_DEV = process.env.NODE_ENV === 'development';

interface Props {
  tour: TourConfig;
  initialIndex?: number;
  onClose: () => void;
}

const glassBtn =
  'flex items-center justify-center w-11 h-11 rounded-full text-white transition-colors ' +
  'bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 cursor-pointer';

export default function TourViewer({ tour, initialIndex = 0, onClose }: Props) {
  const scenes = useMemo(() => tour.scenes.filter((s) => s.enabled), [tour]);
  const [index, setIndex] = useState(Math.min(initialIndex, scenes.length - 1));
  const isEnd = index >= scenes.length;
  const scene = scenes[Math.min(index, scenes.length - 1)];

  const [menuOpen, setMenuOpen] = useState(false);
  // this component is client-only (ssr:false) so lazy window reads are safe
  const [mapOpen, setMapOpen] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const [hotspot, setHotspot] = useState<TourHotspot | null>(null);
  const [tiltOn, setTiltOn] = useState(false);
  const [tiltSupported] = useState(
    () => 'DeviceOrientationEvent' in window && window.matchMedia('(pointer: coarse)').matches
  );
  const [toast, setToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsSupported] = useState(() => !!document.documentElement.requestFullscreen);
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltRaf = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomApi = useRef<((factor: number) => void) | null>(null);

  /** rAF-throttled tilt update so orientation events don't flood renders */
  const pushTilt = useCallback((x: number, y: number) => {
    if (tiltRaf.current) return;
    tiltRaf.current = requestAnimationFrame(() => {
      tiltRaf.current = 0;
      setTilt({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    });
  }, []);

  const goTo = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(scenes.length, i)));
      setHotspot(null);
    },
    [scenes.length]
  );
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  /* ---------- lock page scroll while the overlay is open ---------- */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (tiltRaf.current) cancelAnimationFrame(tiltRaf.current);
    };
  }, []);

  /* ---------- preload neighbours ---------- */
  useEffect(() => {
    [index - 1, index + 1].forEach((i) => {
      const s = scenes[i];
      if (s && s.kind === 'photo') {
        const img = new window.Image();
        img.src = s.src;
      }
    });
  }, [index, scenes]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (enquireOpen) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === '+' || e.key === '=') zoomApi.current?.(1.25);
      else if (e.key === '-') zoomApi.current?.(1 / 1.25);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, enquireOpen]);

  /* ---------- fullscreen (real API where supported, iOS just uses the overlay) ---------- */
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  /* ---------- tilt / gyroscope ---------- */
  useEffect(() => {
    if (!tiltOn) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      const g = e.gamma ?? 0; // left/right
      const b = e.beta ?? 0; // forward/back
      pushTilt(g / 40, (b - 45) / 40);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [tiltOn, pushTilt]);

  const enableTilt = async () => {
    try {
      const DOE = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DOE?.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res !== 'granted') return;
      }
      setTiltOn((t) => !t);
    } catch {
      setTiltOn((t) => !t);
    }
  };

  /* ---------- subtle mouse parallax on fine pointers ---------- */
  const parallaxMove = (e: React.PointerEvent) => {
    if (tiltOn || reducedMotion || e.pointerType !== 'mouse') return;
    const el = rootRef.current;
    if (!el) return;
    pushTilt((e.clientX / el.clientWidth - 0.5) * -0.9, (e.clientY / el.clientHeight - 0.5) * -0.9);
  };

  /* ---------- dev helper: Shift+click copies % coords ---------- */
  const shiftClick = IS_DEV
    ? (x: number, y: number) => {
        const txt = `{ x: ${x}, y: ${y} }`;
        navigator.clipboard?.writeText(txt).catch(() => {});
        console.info(`[tour] ${scene.id} hotspot ${txt}`);
        setToast(`Copied ${txt}`);
        window.setTimeout(() => setToast(null), 1400);
      }
    : undefined;

  const waMessage = (room: string) => tour.whatsappMessage.replace('{room}', room);
  const leadNote = (room: string) => `${tour.projectName} - Virtual Tour - ${room}`;

  const zoomBy = (f: number) => zoomApi.current?.(f);

  const transition = reducedMotion
    ? { duration: 0.25 }
    : { duration: 0.55, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <div
      ref={rootRef}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={`Virtual tour — ${tour.projectName}`}
      className="fixed inset-0 z-[1500] bg-[#0b0b0d] text-white overflow-hidden"
      style={{ fontFamily: "var(--font-body), 'Inter', sans-serif" }}
      onPointerMove={parallaxMove}
    >
      {/* ======================= stage ======================= */}
      <AnimatePresence initial={false}>
        <motion.div
          key={scene.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.06 }}
          animate={{ opacity: isEnd ? 0.35 : 1, scale: 1 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.045 }}
          transition={transition}
        >
          {scene.kind === 'pano' ? (
            <PanoStage scene={scene} gyro={tiltOn} />
          ) : (
            <PhotoStage scene={scene} tilt={tilt} onShiftClick={shiftClick} zoomApi={zoomApi}>
              {/* walk arrows */}
              {scene.links
                .filter((l) => l.to === 'end' || scenes.some((s) => s.id === l.to))
                .map((l, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(l.to === 'end' ? scenes.length : scenes.findIndex((s) => s.id === l.to));
                    }}
                    aria-label={`Go to ${l.label}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                    style={{ left: `${l.x}%`, top: `${l.y}%` }}
                  >
                    <span className="flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/25 pl-2.5 pr-1.5 py-1.5 text-white text-[11px] font-semibold tracking-wide shadow-lg animate-[tourFloat_2.6s_ease-in-out_infinite]">
                      {l.label}
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C0392B]">
                        <ArrowRight size={13} />
                      </span>
                    </span>
                  </button>
                ))}

              {/* spec / note hotspots */}
              {scene.specHotspots
                .filter((hspot) => hspot.enabled)
                .map((hspot, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHotspot(hspot);
                    }}
                    aria-label={`${hspot.kind === 'spec' ? 'Specification' : 'Note'}: ${hspot.title}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ left: `${hspot.x}%`, top: `${hspot.y}%` }}
                  >
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border backdrop-blur-sm shadow-md ${
                        hspot.kind === 'spec'
                          ? 'bg-[#C0392B]/85 border-white/40'
                          : 'bg-black/55 border-white/30'
                      }`}
                    >
                      <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:2.4s]" />
                      <Info size={13} className="relative text-white" />
                    </span>
                  </button>
                ))}
            </PhotoStage>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ======================= top bar ======================= */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-3 md:px-5 pt-3 pb-8 flex items-start justify-between gap-2">
        <div className="min-w-0 pt-1">
          <p
            className="text-[10px] tracking-[0.22em] uppercase text-white/60 font-bold truncate"
            style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
          >
            {tour.projectName} · {tour.flatLabel}
          </p>
          <h3
            className="text-white font-bold text-base md:text-xl leading-snug truncate"
            style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
          >
            {isEnd ? 'Walkthrough complete' : scene.title}
          </h3>
          {/* vastu zone chip — neutral wording */}
          <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/85">
            <CompassNeedle heading={isEnd ? 90 : scene.heading} />
            {isEnd ? 'Exit' : `${scene.room} — ${scene.zone}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button onClick={() => zoomBy(1 / 1.3)} className={glassBtn} aria-label="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button onClick={() => zoomBy(1.3)} className={glassBtn} aria-label="Zoom in">
            <ZoomIn size={18} />
          </button>
          {tiltSupported && (
            <button
              onClick={enableTilt}
              className={`${glassBtn} ${tiltOn ? '!bg-[#C0392B]/80' : ''}`}
              aria-label={tiltOn ? 'Disable gyroscope look-around' : 'Enable gyroscope look-around'}
              aria-pressed={tiltOn}
            >
              <Smartphone size={18} />
            </button>
          )}
          <button
            onClick={() => setMapOpen((m) => !m)}
            className={`${glassBtn} ${mapOpen ? '!bg-[#C0392B]/80' : ''}`}
            aria-label="Toggle floor plan"
            aria-pressed={mapOpen}
          >
            <MapIcon size={18} />
          </button>
          {fsSupported && (
            <button onClick={toggleFullscreen} className={glassBtn} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          <button onClick={onClose} className={glassBtn} aria-label="Close tour">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ======================= side arrows ======================= */}
      {!isEnd && index > 0 && (
        <button
          onClick={prev}
          aria-label={`Previous: ${scenes[index - 1].room}`}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {!isEnd && (
        <button
          onClick={next}
          aria-label={index + 1 < scenes.length ? `Next: ${scenes[index + 1].room}` : 'Finish tour'}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* ======================= minimap ======================= */}
      <AnimatePresence>
        {mapOpen && !isEnd && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="absolute z-20 right-3 bottom-24 md:right-5 md:bottom-24 w-[104px] md:w-[168px] rounded-xl overflow-hidden bg-black/55 backdrop-blur-md border border-white/15 shadow-2xl"
          >
            <FloorplanMinimap tour={tour} scenes={scenes} current={index} onJump={goTo} />
            <p className="text-center text-[9px] tracking-[0.18em] uppercase text-white/50 pb-1.5 -mt-1">
              East-facing plan
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= hotspot card ======================= */}
      <AnimatePresence>
        {hotspot && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="absolute z-30 left-1/2 -translate-x-1/2 bottom-28 md:bottom-28 w-[calc(100%-32px)] max-w-sm rounded-xl bg-white text-[#1a1a1a] shadow-2xl border border-[#e8d5d5]"
          >
            <div className="flex items-start justify-between gap-3 p-4">
              <div>
                <p
                  className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C0392B]"
                  style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
                >
                  {hotspot.kind === 'spec' ? 'Specification' : 'Sample fit-out'}
                </p>
                <h4
                  className="font-bold text-[15px] mt-0.5"
                  style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif", color: '#1a1a1a' }}
                >
                  {hotspot.title}
                </h4>
                <p className="text-[13px] leading-relaxed mt-1" style={{ color: '#444' }}>
                  {hotspot.body}
                </p>
              </div>
              <button
                onClick={() => setHotspot(null)}
                aria-label="Close"
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= rooms bottom sheet ======================= */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-black/50"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
              className="absolute z-30 left-0 right-0 bottom-0 rounded-t-2xl bg-[#141416] border-t border-white/15 p-4 pb-6 max-h-[60vh] overflow-y-auto"
            >
              <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-4" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/50 font-bold mb-3 px-1">
                Rooms
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {scenes.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      goTo(i);
                      setMenuOpen(false);
                    }}
                    className={`relative rounded-lg overflow-hidden text-left border cursor-pointer ${
                      i === index ? 'border-[#C0392B] ring-1 ring-[#C0392B]' : 'border-white/10'
                    }`}
                  >
                    <img
                      src={s.thumb}
                      alt={s.alt}
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-5 pb-1.5 text-[11px] font-semibold text-white">
                      {s.room}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/45 mt-4 px-1 leading-relaxed">{tour.disclaimer}</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================= end card ======================= */}
      <AnimatePresence>
        {isEnd && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-white text-[#1a1a1a] shadow-2xl border border-[#e8d5d5] p-6 md:p-8 text-center">
              <p
                className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#C0392B]"
                style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
              >
                {tour.projectName} · {tour.area}
              </p>
              <h3
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif", color: '#1a1a1a' }}
              >
                You&rsquo;ve seen the whole flat
              </h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: '#444' }}>
                Like what you saw? Book a free site visit or get the full brochure.
              </p>
              <p className="text-[11px] mt-3 leading-relaxed" style={{ color: '#888' }}>
                {tour.disclaimer}
              </p>

              <div className="mt-5 space-y-3">
                <WhatsAppButton
                  variant="inline"
                  phoneNumber={SITE_WHATSAPP_NUMBER}
                  message={waMessage('sample flat')}
                  leadProject={tour.projectName}
                  leadNote={leadNote('End of tour')}
                  title="Chat on WhatsApp"
                  showText={false}
                />
                <button
                  onClick={() => setEnquireOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer border-none text-sm"
                >
                  <CalendarCheck size={18} /> Book a site visit
                </button>
                <div className="[&>button]:!w-full [&>button]:!rounded-xl">
                  <BrochureDownload brochureUrl={tour.brochureUrl} projectName={tour.projectName} />
                </div>
                <button
                  onClick={() => goTo(0)}
                  className="w-full inline-flex items-center justify-center gap-2 text-[#C0392B] px-6 py-2.5 rounded-xl font-semibold hover:bg-[#fff5f5] transition-colors cursor-pointer border-none text-sm"
                >
                  <RotateCcw size={16} /> Restart tour
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= bottom bar ======================= */}
      {!isEnd && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/75 to-transparent px-3 md:px-5 pb-3 pt-10">
          <p className="text-center text-[10px] text-white/45 mb-2 leading-snug px-2">
            {tour.disclaimer}
          </p>
          <div className="flex items-center gap-3">
            {/* progress */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold text-white/80 tabular-nums whitespace-nowrap">
                {index + 1} / {scenes.length}
              </span>
              <div className="w-14 md:w-24 h-1 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-[#C0392B] transition-all duration-500"
                  style={{ width: `${((index + 1) / scenes.length) * 100}%` }}
                />
              </div>
            </div>

            {/* room chips — desktop */}
            <div className="hidden md:flex flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goTo(i)}
                  aria-current={i === index}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide border transition-colors cursor-pointer ${
                    i === index
                      ? 'bg-[#C0392B] border-[#C0392B] text-white'
                      : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {s.room}
                </button>
              ))}
            </div>

            {/* mobile: rooms sheet trigger */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`${glassBtn} md:hidden !w-auto px-3.5 gap-1.5 text-[11px] font-semibold`}
              aria-label="Open room list"
            >
              <LayoutGrid size={15} /> Rooms
            </button>

            <div className="flex-1 md:hidden" />

            <WhatsAppButton
              variant="pill"
              phoneNumber={SITE_WHATSAPP_NUMBER}
              message={waMessage(scene.room)}
              leadProject={tour.projectName}
              leadNote={leadNote(scene.room)}
              title="WhatsApp"
              showText={true}
            />
          </div>
        </div>
      )}

      {/* toast (dev helper feedback) */}
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 rounded-full bg-white text-[#1a1a1a] text-xs font-semibold px-4 py-2 shadow-xl">
          {toast}
        </div>
      )}

      <EnquireModal isOpen={enquireOpen} onClose={() => setEnquireOpen(false)} />

      <style jsx>{`
        @keyframes tourFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

/** Small compass: fixed rose, needle rotated to the camera bearing (0=N). */
function CompassNeedle({ heading }: { heading: number }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden className="shrink-0">
      <circle cx={8} cy={8} r={7} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <text x={8} y={4.4} textAnchor="middle" fontSize={3.6} fill="rgba(255,255,255,0.7)">
        N
      </text>
      <g transform={`rotate(${heading} 8 8)`}>
        <path d="M 8 4.6 L 9.1 8 L 8 11.4 L 6.9 8 Z" fill="#C0392B" />
        <circle cx={8} cy={8} r={0.9} fill="#fff" />
      </g>
    </svg>
  );
}
