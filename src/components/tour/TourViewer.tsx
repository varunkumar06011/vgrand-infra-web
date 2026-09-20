'use client';

/* eslint-disable @next/next/no-img-element -- tour imagery is pre-optimized
   WebP served same-origin; plain <img> gives precise transform control */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Map as MapIcon,
  Smartphone, RotateCcw, Info, ArrowRight, LayoutGrid, CalendarCheck, HelpCircle,
  Building2,
} from 'lucide-react';
import type { TourConfig, TourHotspot, TourLang, TourText, SceneVariant } from '@/data/tours';
import PhotoStage from './PhotoStage';
import FloorplanMinimap from './FloorplanMinimap';
import CompassNeedle from './CompassNeedle';
import VariantBar from './VariantBar';
import CompareHandle from './CompareHandle';
import FloorViewsPanel from './FloorViewsPanel';
import { LangSwitch, ModeChooser, CaptionPanel, GuidedBar } from './GuidedUI';
import {
  textFor, sceneText, hotspotText, linkLabel, fmt, audioUrl, captionDurationMs,
  facingToHeading, availableLangs,
} from './tourText';
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
  lang: TourLang;
  /** resolved display text (lazy language maps are loaded by the caller) */
  text: TourText;
  onLangChange: (l: TourLang) => void;
}

const glassBtn =
  'flex items-center justify-center w-11 h-11 rounded-full text-white transition-colors ' +
  'bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 cursor-pointer';

type TourMode = 'choose' | 'guided' | 'explore';

/**
 * A stage-anchored button (walk pill / spec dot). Its anchor point lives in
 * photo coordinates and can sit under a cropped edge — this measures the
 * rendered rect every layout and slides the control back inside the viewport
 * so it is never clipped or unreachable on narrow screens.
 */
function StageAnchor({
  x,
  y,
  ...buttonProps
}: React.ComponentProps<'button'> & { x: number; y: number }) {
  const ref = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // reset to the pure anchor position, measure, then nudge back inside —
    // resetting first keeps the measurement honest (no accumulating offsets)
    el.style.transform = 'translate(-50%, -50%)';
    const r = el.getBoundingClientRect();
    // clear the floating chrome: side arrows column + top/bottom bars
    const ix = window.innerWidth >= 768 ? 64 : 52;
    const iy = 100;
    const dx =
      r.left < ix ? ix - r.left
      : r.right > window.innerWidth - ix ? window.innerWidth - ix - r.right
      : 0;
    const dy =
      r.top < iy ? iy - r.top
      : r.bottom > window.innerHeight - iy ? window.innerHeight - iy - r.bottom
      : 0;
    if (dx || dy) {
      el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  });
  return (
    <button
      ref={ref}
      {...buttonProps}
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );
}

export default function TourViewer({ tour, initialIndex = 0, onClose, lang, text, onLangChange }: Props) {
  const scenes = useMemo(() => tour.scenes.filter((s) => s.enabled), [tour]);
  const [index, setIndex] = useState(Math.min(initialIndex, scenes.length - 1));
  const isEnd = index >= scenes.length;
  const scene = scenes[Math.min(index, scenes.length - 1)];

  /* ---------- language + resolved text ---------- */
  const ui = text.ui;
  const langs = useMemo(() => availableLangs(tour), [tour]);
  const stxt = useCallback(
    (id: string) => sceneText(text, id) ?? sceneText(tour.i18n.en, id)!,
    [text, tour]
  );
  const sText = scene ? stxt(scene.id) : undefined;
  const bodyFont =
    lang === 'te'
      ? "var(--font-telugu), 'Noto Sans Telugu', sans-serif"
      : "var(--font-body), 'Inter', sans-serif";
  const headFont =
    lang === 'te'
      ? "var(--font-telugu), 'Noto Sans Telugu', sans-serif"
      : "var(--font-heading), 'Montserrat', sans-serif";
  const bodyLine = lang === 'te' ? 1.75 : undefined; // Telugu needs >= 1.7

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
  // guide auto-starts the first time the viewer opens each session
  const [guideStep, setGuideStep] = useState<number | null>(() => {
    try {
      return sessionStorage.getItem('eliteTourGuideSeen') ? null : 0;
    } catch {
      return 0;
    }
  });

  /* ---------- Phase 3 state ---------- */
  const [mode, setMode] = useState<TourMode>('choose');
  const [guidedPlaying, setGuidedPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ccOn, setCcOn] = useState(true);
  const [sceneProgress, setSceneProgress] = useState(0);

  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [comparePos, setComparePos] = useState<number | null>(null);
  const [floorOpen, setFloorOpen] = useState(false);

  /** scene ids the visitor has seen, in visit order (memory only) */
  const [viewedIds, setViewedIds] = useState<string[]>(() => {
    const s = scenes[Math.min(initialIndex, scenes.length - 1)];
    return s ? [s.id] : [];
  });

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const tiltRaf = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomApi = useRef<((factor: number) => void) | null>(null);
  // walk-through transition — while true, PhotoStage zooms into the
  // centre of the photo before the next scene mounts
  const [transiting, setTransiting] = useState(false);
  const transitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* guided engine refs */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedRef = useRef<string | null>(null);
  const sceneStartRef = useRef(0);
  const sceneDurRef = useRef(0);
  const mutedRef = useRef(muted);
  const advanceRef = useRef<() => void>(() => {});
  const indexRef = useRef(index);
  const playingRef = useRef(false);
  const failAudioRef = useRef<() => void>(() => {});

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

  const markGuideSeen = () => {
    try {
      sessionStorage.setItem('eliteTourGuideSeen', '1');
    } catch {
      /* private mode */
    }
  };
  const skipGuide = useCallback(() => {
    markGuideSeen();
    setGuideStep(null);
  }, []);
  const advanceGuide = () => {
    if (guideStep === null) return;
    const nextStep = guideStep + 1;
    if (nextStep >= ui.guideSteps.length) {
      markGuideSeen();
      setGuideStep(null);
      return;
    }
    if (nextStep === 3) setMapOpen(true); // the minimap step needs the plan visible
    setGuideStep(nextStep);
  };

  const goTo = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(scenes.length, i));
      setIndex(target);
      const t = scenes[Math.min(target, scenes.length - 1)];
      if (t) setViewedIds((ids) => (ids.includes(t.id) ? ids : [...ids, t.id]));
      setHotspot(null);
      setActiveVariant(null);
      setComparePos(null);
      setFloorOpen(false);
      if (guideStep !== null) {
        if (target >= scenes.length) skipGuide();
        else if (guideStep <= 1) setGuideStep(2);
      }
    },
    [scenes, guideStep, skipGuide]
  );

  /* ================= guided tour engine ================= */

  const pauseGuided = useCallback(() => {
    setGuidedPlaying((p) => (mode === 'guided' && p ? false : p));
  }, [mode]);

  /**
   * Zoom-in → swap → zoom-out hop (Google-Maps style): unless
   * reduced-motion is set, the current photo dives to centre for ~430ms,
   * then the next scene mounts zoomed and settles back.
   */
  const hopTo = useCallback(
    (i: number) => {
      if (reducedMotion) {
        goTo(i);
        return;
      }
      if (transitTimer.current) clearTimeout(transitTimer.current);
      setTransiting(true);
      transitTimer.current = setTimeout(() => {
        setTransiting(false);
        goTo(i);
      }, 430);
    },
    [goTo, reducedMotion]
  );

  /** every user-initiated navigation pauses auto-advance */
  const userGoTo = useCallback(
    (i: number) => {
      pauseGuided();
      hopTo(i);
    },
    [pauseGuided, hopTo]
  );

  const next = useCallback(() => userGoTo(index + 1), [userGoTo, index]);
  const prev = useCallback(() => userGoTo(index - 1), [userGoTo, index]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const armTimer = useCallback(
    (i: number) => {
      stopTimer();
      const s = scenes[i];
      if (!s) return;
      const dur = captionDurationMs(stxt(s.id).narration);
      sceneStartRef.current = performance.now();
      sceneDurRef.current = dur;
      timerRef.current = setTimeout(() => advanceRef.current(), dur);
    },
    [scenes, stxt, stopTimer]
  );

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = 'auto';
      a.addEventListener('ended', () => advanceRef.current());
      // missing/corrupt file mid-play → silent caption fallback
      a.addEventListener('error', () => failAudioRef.current());
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  /**
   * Arm a scene: play its narration file if one is configured for the
   * current language, otherwise fall back to a caption dwell timer.
   * Audio errors/blocking fall back silently — captions always show.
   */
  const armScene = useCallback(
    (i: number) => {
      const s = scenes[i];
      if (!s) return;
      armedRef.current = `${s.id}:${lang}`;
      stopTimer();
      const url = audioUrl(tour, lang, s.id);
      const a = audioRef.current;
      if (url && a) {
        try {
          if (!a.src.endsWith(url)) a.src = url;
          a.muted = mutedRef.current;
          a.currentTime = 0;
          sceneStartRef.current = performance.now();
          sceneDurRef.current = NaN; // progress follows the audio clock
          const p = a.play();
          if (p) p.catch(() => armTimer(i));
          // warm only the NEXT scene's file — never bulk-fetch
          const nxt = scenes[i + 1];
          const nu = nxt ? audioUrl(tour, lang, nxt.id) : null;
          if (nu) {
            const pre = new Audio();
            pre.preload = 'auto';
            pre.src = nu;
          }
        } catch {
          armTimer(i);
        }
      } else {
        armTimer(i);
      }
    },
    [scenes, lang, tour, armTimer, stopTimer]
  );

  // keep the latest advance() reachable from audio 'ended' / timers
  useEffect(() => {
    indexRef.current = index;
    playingRef.current = mode === 'guided' && guidedPlaying && !isEnd;
    advanceRef.current = () => {
      if (index + 1 < scenes.length) hopTo(index + 1);
      else {
        setGuidedPlaying(false);
        hopTo(scenes.length);
      }
    };
    failAudioRef.current = () => {
      if (playingRef.current) armTimer(indexRef.current);
    };
  });

  const startGuided = () => {
    ensureAudio(); // created inside the click — keeps autoplay unlocked
    armedRef.current = null;
    setMode('guided');
    setGuidedPlaying(true);
    armScene(Math.min(index, scenes.length - 1)); // gesture context: play() is allowed here
  };

  const stopGuided = useCallback(() => {
    setMode('explore');
    setGuidedPlaying(false);
  }, []);

  /* drive the engine */
  useEffect(() => {
    if (mode !== 'guided' || !guidedPlaying || isEnd) {
      if (audioRef.current) audioRef.current.pause();
      stopTimer();
      if (!guidedPlaying || mode !== 'guided') armedRef.current = null;
      return;
    }
    const key = `${scene.id}:${lang}`;
    if (armedRef.current !== key) armScene(index);
  }, [mode, guidedPlaying, isEnd, index, lang, scene, armScene, stopTimer]);

  /* mute follows the toggle */
  useEffect(() => {
    mutedRef.current = muted;
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  /* per-scene progress (audio clock or timer clock) */
  useEffect(() => {
    if (mode !== 'guided' || !guidedPlaying || isEnd) return;
    const t = setInterval(() => {
      const a = audioRef.current;
      let p = 0;
      if (a && a.src && !a.paused && isFinite(a.duration) && a.duration > 0) {
        p = a.currentTime / a.duration;
      } else if (sceneDurRef.current > 0) {
        p = Math.min(1, (performance.now() - sceneStartRef.current) / sceneDurRef.current);
      }
      setSceneProgress(p);
    }, 250);
    return () => clearInterval(t);
  }, [mode, guidedPlaying, isEnd]);

  /* teardown on unmount */
  useEffect(
    () => () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      stopTimer();
      if (transitTimer.current) clearTimeout(transitTimer.current);
    },
    [stopTimer]
  );

  /* ================= viewed rooms (Feature 4, memory only) ================= */
  const roomsViewed = useCallback(
    (forLang: TourLang) => {
      const t = forLang === lang ? text : textFor(tour, forLang);
      const names: string[] = [];
      viewedIds.forEach((id) => {
        const r = t.scenes[id]?.room;
        if (r && !names.includes(r)) names.push(r);
      });
      return names;
    },
    [tour, viewedIds, lang, text]
  );

  const waMessage = (room: string) => {
    const base = fmt(ui.whatsappMessage, { room });
    const names = roomsViewed(lang);
    return names.length ? `${base}\n\n${ui.roomsViewed}: ${names.join(', ')}` : base;
  };
  // lead note keeps English room names — stable CRM values
  const leadNote = (room: string) => {
    const names = roomsViewed('en');
    const suffix = names.length ? ` | Rooms viewed: ${names.join(', ')}` : '';
    return `${tour.projectName} - Virtual Tour - ${room}${suffix}`;
  };

  /* ================= variants ================= */
  const sceneVariants = useMemo(
    () => (scene && scene.kind === 'photo' ? scene.variants ?? [] : []),
    [scene]
  );
  const activeV = sceneVariants.find((v) => v.id === activeVariant) ?? null;

  const warmVariant = useCallback((v: SceneVariant) => {
    const im = new window.Image();
    im.src = v.src; // hover/focus prefetch — activates instantly on tap
  }, []);

  const activateVariant = (v: SceneVariant | null) => {
    if (v) warmVariant(v);
    setActiveVariant(v ? v.id : null);
  };

  const openCompare = () => {
    if (comparePos !== null) {
      setComparePos(null);
      return;
    }
    const v = activeV ?? sceneVariants[0];
    if (!v) return;
    warmVariant(v);
    setActiveVariant(v.id);
    setComparePos(50);
    pauseGuided();
  };

  /* ================= floor views ================= */
  const fv = tour.floorViews;
  const fvOn = !!fv && fv.verified && fv.floors.length >= 2;
  const fvHostId = useMemo(() => {
    if (!fvOn) return null;
    const ids = new Set(scenes.map((s) => s.id));
    if (ids.has('balcony-view')) return 'balcony-view';
    if (ids.has('bedroom-3-balcony')) return 'bedroom-3-balcony';
    return null;
  }, [fvOn, scenes]);
  const fvHeading = fv ? facingToHeading(fv.facing) : 270;
  const fvDirLabel = fv ? ui.facingNames?.[fv.facing] ?? fv.facing : '';

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
        if (s.portraitSrc) {
          const p = new window.Image();
          p.src = s.portraitSrc;
        }
      }
    });
  }, [index, scenes]);

  /* ---------- keyboard ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (enquireOpen) return;
      if (e.key === 'Escape') {
        if (comparePos !== null) setComparePos(null);
        else if (floorOpen) setFloorOpen(false);
        else if (mode === 'choose') setMode('explore');
        else if (guideStep !== null) skipGuide();
        else onClose();
      }
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === '+' || e.key === '=') zoomApi.current?.(1.25);
      else if (e.key === '-') zoomApi.current?.(1 / 1.25);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, enquireOpen, guideStep, skipGuide, comparePos, floorOpen, mode]);

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

  const zoomBy = (f: number) => {
    pauseGuided();
    zoomApi.current?.(f);
  };

  // highlight ring for whichever control the guide is pointing at
  const guideHl = (step: number) =>
    guideStep === step ? 'ring-2 ring-[#FFB4AB] ring-offset-2 ring-offset-black/40' : '';

  const transition = reducedMotion
    ? { duration: 0.25 }
    : { duration: 0.7, ease: [0.32, 0.72, 0, 1] as const };

  const comparing = comparePos !== null;
  const showCaption =
    mode === 'guided' && !isEnd && !!sText && (ccOn || !audioUrl(tour, lang, scene.id));

  const langSwitch = <LangSwitch langs={langs} lang={lang} onChange={onLangChange} />;

  return (
    <div
      ref={rootRef}
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={`${ui.dialogLabel} — ${tour.projectName}`}
      className="fixed inset-0 z-[1500] bg-[#0b0b0d] text-white overflow-hidden"
      style={{ fontFamily: bodyFont }}
      onPointerMove={parallaxMove}
    >
      {/* ======================= stage ======================= */}
      <AnimatePresence initial={false}>
        <motion.div
          key={scene.id}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 1.28 }}
          animate={{ opacity: isEnd ? 0.35 : 1, scale: 1 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 1.12 }}
          transition={transition}
        >
          {scene.kind === 'pano' ? (
            <div className="absolute inset-0" onPointerDown={pauseGuided}>
              <PanoStage scene={scene} gyro={tiltOn} />
            </div>
          ) : (
            <PhotoStage
              scene={scene}
              alt={sText?.alt ?? ''}
              tilt={tilt}
              onShiftClick={shiftClick}
              zoomApi={zoomApi}
              variantSrc={activeV?.src ?? null}
              variantOn={!!activeV}
              comparePos={comparePos}
              gesturesDisabled={comparing}
              transiting={transiting}
              onUserInteract={pauseGuided}
            >
              {/* walk arrows */}
              {scene.links
                .filter((l) => l.to === 'end' || scenes.some((s) => s.id === l.to))
                .map((l, i) => (
                  <StageAnchor
                    key={i}
                    x={l.x}
                    y={l.y}
                    onClick={(e) => {
                      e.stopPropagation();
                      userGoTo(l.to === 'end' ? scenes.length : scenes.findIndex((s) => s.id === l.to));
                    }}
                    aria-label={fmt(ui.goToRoom, { label: linkLabel(text, scene.id, l.to) })}
                    className="absolute group cursor-pointer"
                  >
                    <span className={`flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/25 pl-2.5 pr-1.5 py-1.5 text-white text-[11px] font-semibold tracking-wide shadow-lg animate-[tourFloat_2.6s_ease-in-out_infinite] ${guideHl(0)}`}>
                      {linkLabel(text, scene.id, l.to)}
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#C0392B]">
                        <ArrowRight size={13} />
                      </span>
                    </span>
                  </StageAnchor>
                ))}

              {/* spec / note hotspots */}
              {scene.specHotspots
                .filter((hspot) => hspot.enabled)
                .map((hspot, i) => (
                  <StageAnchor
                    key={hspot.key ?? i}
                    x={hspot.x}
                    y={hspot.y}
                    onClick={(e) => {
                      e.stopPropagation();
                      setHotspot(hspot);
                      if (guideStep === 2) {
                        setGuideStep(3);
                        setMapOpen(true);
                      }
                    }}
                    aria-label={`${hspot.kind === 'spec' ? ui.specTag : ui.fitoutTag}: ${hotspotText(text, scene.id, hspot).title}`}
                    className="absolute cursor-pointer"
                  >
                    <span
                      className={`relative flex items-center justify-center w-7 h-7 rounded-full border backdrop-blur-sm shadow-md ${
                        hspot.kind === 'spec'
                          ? 'bg-[#C0392B]/85 border-white/40'
                          : 'bg-black/55 border-white/30'
                      } ${guideHl(2)}`}
                    >
                      <span className="absolute inset-0 rounded-full bg-white/25 animate-ping [animation-duration:2.4s]" />
                      <Info size={13} className="relative text-white" />
                    </span>
                  </StageAnchor>
                ))}
            </PhotoStage>
          )}

          {/* before/after handle — sibling of the stage, viewport-fixed split */}
          {comparing && activeV && (
            <CompareHandle
              pos={comparePos}
              onChange={setComparePos}
              label={ui.compareSlider}
              beforeLabel={
                activeV.group === 'furnishing'
                  ? ui.variantBaseFurnishing
                  : ui.variantBaseLighting
              }
              afterLabel={sText?.variants?.[activeV.id] ?? activeV.label}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* ======================= top bar ======================= */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent px-3 md:px-5 pt-3 pb-8 flex items-start justify-between gap-2 pointer-events-none">
        <div className="min-w-0 pt-1 flex-1">
          <p
            className="hidden sm:block text-[10px] tracking-[0.22em] uppercase text-white/60 font-bold truncate"
            style={{ fontFamily: headFont }}
          >
            {tour.projectName} · {text.meta.flatLabel}
          </p>
          <h3
            className="text-white font-bold text-base md:text-xl leading-snug truncate"
            style={{ fontFamily: headFont }}
          >
            {isEnd ? ui.endHeading : sText?.title}
          </h3>
          {/* vastu zone chip — neutral wording */}
          <span className="inline-flex items-center gap-1.5 mt-1 rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/85 whitespace-nowrap">
            <CompassNeedle heading={isEnd ? 90 : scene.heading} />
            <span className="md:hidden">{isEnd ? ui.exit : sText?.zone}</span>
            <span className="hidden md:inline">
              {isEnd ? ui.exit : `${sText?.room} — ${sText?.zone}`}
            </span>
          </span>
        </div>

        {/* controls — desktop row */}
        <div className={`hidden md:flex items-center gap-2 shrink-0 rounded-full pointer-events-auto ${guideHl(4)}`}>
          {langSwitch}
          <button onClick={() => zoomBy(1 / 1.3)} className={glassBtn} aria-label={ui.zoomOut}>
            <ZoomOut size={18} />
          </button>
          <button onClick={() => zoomBy(1.3)} className={glassBtn} aria-label={ui.zoomIn}>
            <ZoomIn size={18} />
          </button>
          {tiltSupported && (
            <button
              onClick={enableTilt}
              className={`${glassBtn} ${tiltOn ? '!bg-[#C0392B]/80' : ''}`}
              aria-label={tiltOn ? ui.gyroOn : ui.gyroOff}
              aria-pressed={tiltOn}
            >
              <Smartphone size={18} />
            </button>
          )}
          <button
            onClick={() => setGuideStep(0)}
            className={`${glassBtn} ${guideStep !== null ? '!bg-[#C0392B]/80' : ''}`}
            aria-label={ui.replayGuide}
            aria-pressed={guideStep !== null}
          >
            <HelpCircle size={18} />
          </button>
          <button
            onClick={() => setMapOpen((m) => !m)}
            className={`${glassBtn} ${mapOpen ? '!bg-[#C0392B]/80' : ''}`}
            aria-label={ui.floorPlan}
            aria-pressed={mapOpen}
          >
            <MapIcon size={18} />
          </button>
          {fsSupported && (
            <button onClick={toggleFullscreen} className={glassBtn} aria-label={ui.fullscreen}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          <button onClick={onClose} className={glassBtn} aria-label={ui.close}>
            <X size={20} />
          </button>
        </div>

        {/* mobile: language switch + close */}
        <div className="md:hidden flex items-center gap-2 shrink-0 pointer-events-auto">
          {langSwitch}
          <button onClick={onClose} className={glassBtn} aria-label={ui.close}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* variant pills + compare — top centre, only for scenes that have them */}
      {!isEnd && sceneVariants.length > 0 && (
        <div className="absolute top-16 md:top-[72px] left-1/2 -translate-x-1/2 z-20">
          <VariantBar
            variants={sceneVariants}
            activeId={activeVariant}
            ui={ui}
            variantLabels={sText?.variants}
            comparing={comparing}
            onPrefetch={warmVariant}
            onActivate={activateVariant}
            onCompare={openCompare}
          />
        </div>
      )}

      {/* mobile: floating vertical toolbar (zoom / tilt / guide / map / fullscreen) */}
      <div className={`md:hidden absolute right-2.5 top-[104px] z-20 flex flex-col gap-1.5 rounded-full ${guideHl(4)}`}>
        <button onClick={() => zoomBy(1.3)} className={glassBtn} aria-label={ui.zoomIn}>
          <ZoomIn size={18} />
        </button>
        <button onClick={() => zoomBy(1 / 1.3)} className={glassBtn} aria-label={ui.zoomOut}>
          <ZoomOut size={18} />
        </button>
        {tiltSupported && (
          <button
            onClick={enableTilt}
            className={`${glassBtn} ${tiltOn ? '!bg-[#C0392B]/80' : ''}`}
            aria-label={tiltOn ? ui.gyroOn : ui.gyroOff}
            aria-pressed={tiltOn}
          >
            <Smartphone size={18} />
          </button>
        )}
        <button
          onClick={() => setGuideStep(0)}
          className={`${glassBtn} ${guideStep !== null ? '!bg-[#C0392B]/80' : ''}`}
          aria-label={ui.replayGuide}
          aria-pressed={guideStep !== null}
        >
          <HelpCircle size={18} />
        </button>
        <button
          onClick={() => setMapOpen((m) => !m)}
          className={`${glassBtn} ${mapOpen ? '!bg-[#C0392B]/80' : ''}`}
          aria-label={ui.floorPlan}
          aria-pressed={mapOpen}
        >
          <MapIcon size={18} />
        </button>
        {fsSupported && (
          <button onClick={toggleFullscreen} className={glassBtn} aria-label={ui.fullscreen}>
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        )}
      </div>

      {/* ======================= side arrows ======================= */}
      {!isEnd && !comparing && index > 0 && (
        <button
          onClick={prev}
          aria-label={fmt(ui.previous, { room: stxt(scenes[index - 1].id).room })}
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white cursor-pointer ${guideHl(1)}`}
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {!isEnd && !comparing && (
        <button
          onClick={next}
          aria-label={index + 1 < scenes.length ? fmt(ui.next, { room: stxt(scenes[index + 1].id).room }) : ui.finishTour}
          className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 text-white cursor-pointer ${guideHl(1)}`}
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* ======================= floor-view host card ======================= */}
      {!isEnd && fvHostId === scene.id && !floorOpen && (
        <button
          onClick={() => setFloorOpen(true)}
          data-lenis-prevent
          className="absolute left-3 md:left-5 bottom-24 md:bottom-24 z-20 flex flex-col gap-1 rounded-xl bg-black/55 backdrop-blur-md border border-white/15 px-3.5 py-3 text-left shadow-2xl cursor-pointer hover:bg-black/70 transition-colors max-w-[190px]"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-white">
            <Building2 size={14} className="text-[#FFB4AB]" />
            {ui.floorViews}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] text-white/65">
            <CompassNeedle heading={fvHeading} />
            {fmt(ui.facingChip, { dir: fvDirLabel })}
          </span>
        </button>
      )}

      {/* ======================= minimap ======================= */}
      <AnimatePresence>
        {mapOpen && !isEnd && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`absolute z-20 right-2.5 bottom-24 md:right-5 md:bottom-24 w-[92px] md:w-[168px] rounded-xl overflow-hidden bg-black/55 backdrop-blur-md border border-white/15 shadow-2xl ${guideHl(3)}`}
          >
            <FloorplanMinimap
              tour={tour}
              scenes={scenes}
              current={index}
              planLabels={text.plan}
              sceneNames={Object.fromEntries(scenes.map((s) => [s.id, stxt(s.id).room]))}
              floorViewArrow={fvHostId ? { sceneId: fvHostId, heading: fvHeading } : null}
              onJump={(i) => {
                userGoTo(i);
                if (guideStep === 3) setGuideStep(4);
              }}
            />
            <p className="text-center text-[9px] tracking-[0.18em] uppercase text-white/50 pb-1.5 -mt-1">
              {ui.planCaption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= guided steps ======================= */}
      <AnimatePresence>
        {guideStep !== null && mode === 'explore' && !hotspot && !menuOpen && !isEnd && (
          <motion.div
            key="guide"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            role="status"
            className="absolute z-[28] left-1/2 -translate-x-1/2 bottom-28 w-[calc(100%-32px)] max-w-sm rounded-xl bg-[#141416]/95 backdrop-blur-md border border-white/15 shadow-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FFB4AB]"
                style={{ fontFamily: headFont }}
              >
                {ui.guideTag} · {fmt(ui.sceneOf, { a: guideStep + 1, b: ui.guideSteps.length })}
              </p>
              <button
                onClick={skipGuide}
                className="text-[11px] font-semibold text-white/50 hover:text-white cursor-pointer"
                aria-label={ui.guideSkip}
              >
                {ui.guideSkip}
              </button>
            </div>
            <p className="text-[13px] text-white/90 mt-1.5" style={{ lineHeight: bodyLine ?? 1.6 }}>
              {ui.guideSteps[guideStep]}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {ui.guideSteps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 rounded-full transition-all ${
                      i === guideStep ? 'w-4 bg-[#C0392B]' : 'w-1.5 bg-white/25'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={advanceGuide}
                className="rounded-full bg-[#C0392B] hover:bg-[#a93226] text-white text-[11px] font-bold px-4 py-2 cursor-pointer"
              >
                {guideStep === ui.guideSteps.length - 1 ? ui.guideDone : ui.guideNext}
              </button>
            </div>
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
                  style={{ fontFamily: headFont }}
                >
                  {hotspot.kind === 'spec' ? ui.specTag : ui.fitoutTag}
                </p>
                <h4
                  className="font-bold text-[15px] mt-0.5"
                  style={{ fontFamily: headFont, color: '#1a1a1a' }}
                >
                  {hotspotText(text, scene.id, hotspot).title}
                </h4>
                <p className="text-[13px] mt-1" style={{ color: '#444', lineHeight: bodyLine ?? 1.6 }}>
                  {hotspotText(text, scene.id, hotspot).body}
                </p>
              </div>
              <button
                onClick={() => setHotspot(null)}
                aria-label={ui.closeCard}
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
              data-lenis-prevent
            >
              <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-4" />
              <p className="text-[11px] tracking-[0.2em] uppercase text-white/50 font-bold mb-3 px-1">
                {ui.roomsTitle}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {scenes.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      userGoTo(i);
                      setMenuOpen(false);
                    }}
                    className={`relative rounded-lg overflow-hidden text-left border cursor-pointer ${
                      i === index ? 'border-[#C0392B] ring-1 ring-[#C0392B]' : 'border-white/10'
                    }`}
                  >
                    <img
                      src={s.thumb}
                      alt={stxt(s.id).alt}
                      className="w-full aspect-[4/3] object-cover"
                      loading="lazy"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 pt-5 pb-1.5 text-[11px] font-semibold text-white">
                      {stxt(s.id).room}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-white/45 mt-4 px-1" style={{ lineHeight: bodyLine ?? 1.6 }}>
                {text.meta.disclaimer}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================= mode chooser ======================= */}
      <AnimatePresence>
        {mode === 'choose' && !isEnd && (
          <ModeChooser
            ui={ui}
            lang={lang}
            onGuided={startGuided}
            onExplore={() => setMode('explore')}
          />
        )}
      </AnimatePresence>

      {/* ======================= guided caption ======================= */}
      <AnimatePresence>
        {showCaption && sText && (
          <CaptionPanel ui={ui} lang={lang} room={sText.room} text={sText.narration} />
        )}
      </AnimatePresence>

      {/* ======================= floor views panel ======================= */}
      <AnimatePresence>
        {floorOpen && fv && fvOn && (
          <FloorViewsPanel config={fv} ui={ui} lang={lang} onClose={() => setFloorOpen(false)} />
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
                style={{ fontFamily: headFont }}
              >
                {tour.projectName} · {text.meta.area}
              </p>
              <h3
                className="text-2xl font-bold mt-1"
                style={{ fontFamily: headFont, color: '#1a1a1a' }}
              >
                {ui.endTitle}
              </h3>
              <p className="text-sm mt-2" style={{ color: '#444', lineHeight: bodyLine ?? 1.6 }}>
                {ui.endSubtitle}
              </p>
              <p className="text-[11px] mt-3" style={{ color: '#888', lineHeight: bodyLine ?? 1.6 }}>
                {text.meta.disclaimer}
              </p>

              <div className="mt-5 space-y-3">
                <WhatsAppButton
                  variant="inline"
                  phoneNumber={SITE_WHATSAPP_NUMBER}
                  message={waMessage('sample flat')}
                  leadProject={tour.projectName}
                  leadNote={leadNote('End of tour')}
                  title={ui.chatWhatsApp}
                  showText={false}
                />
                <button
                  onClick={() => setEnquireOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#C0392B] hover:bg-[#a93226] text-white px-6 py-3 rounded-xl font-semibold transition-all cursor-pointer border-none text-sm"
                >
                  <CalendarCheck size={18} /> {ui.bookVisit}
                </button>
                <div className="[&>button]:!w-full [&>button]:!rounded-xl">
                  <BrochureDownload brochureUrl={tour.brochureUrl} projectName={tour.projectName} />
                </div>
                <button
                  onClick={() => userGoTo(0)}
                  className="w-full inline-flex items-center justify-center gap-2 text-[#C0392B] px-6 py-2.5 rounded-xl font-semibold hover:bg-[#fff5f5] transition-colors cursor-pointer border-none text-sm"
                >
                  <RotateCcw size={16} /> {ui.restartTour}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================= bottom bar ======================= */}
      {!isEnd && mode === 'guided' && scene && (
        <GuidedBar
          ui={ui}
          playing={guidedPlaying}
          muted={muted}
          ccOn={ccOn}
          hasAudio={!!audioUrl(tour, lang, scene.id)}
          index={index}
          total={scenes.length}
          progress={(index + sceneProgress) / scenes.length}
          onPlayPause={() => setGuidedPlaying((p) => !p)}
          onPrev={() => hopTo(index - 1)}
          onNext={() => hopTo(index + 1)}
          onMute={() => setMuted((m) => !m)}
          onCc={() => setCcOn((c) => !c)}
          onStop={stopGuided}
        />
      )}

      {!isEnd && mode !== 'guided' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/75 to-transparent px-3 md:px-5 pb-3 pt-10 pointer-events-none">
          <p className="text-center text-[10px] text-white/45 mb-2 leading-snug px-2">
            {text.meta.disclaimer}
          </p>
          <div className="flex items-center gap-3 pointer-events-auto">
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
            <div className={`hidden md:flex flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-full [mask-image:linear-gradient(to_right,black_92%,transparent)] ${guideHl(4)}`}>
              {scenes.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => userGoTo(i)}
                  aria-current={i === index}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide border transition-colors cursor-pointer ${
                    i === index
                      ? 'bg-[#C0392B] border-[#C0392B] text-white'
                      : 'bg-white/10 border-white/15 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {stxt(s.id).room}
                </button>
              ))}
            </div>

            {/* mobile: rooms sheet trigger */}
            <button
              onClick={() => setMenuOpen(true)}
              className={`${glassBtn} md:hidden !w-auto px-3.5 gap-1.5 text-[11px] font-semibold ${guideHl(4)}`}
              aria-label={ui.openRoomList}
            >
              <LayoutGrid size={15} /> {ui.roomsTitle}
            </button>

            <div className="flex-1 md:hidden" />

            <WhatsAppButton
              variant="pill"
              phoneNumber={SITE_WHATSAPP_NUMBER}
              message={waMessage(sText?.room ?? '')}
              leadProject={tour.projectName}
              leadNote={leadNote(sText?.room ?? '')}
              title={ui.chatWhatsApp}
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
