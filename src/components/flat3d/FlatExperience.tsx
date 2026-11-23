'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, CalendarCheck, Footprints, Maximize, Minimize, Moon, Pause, Play, RotateCcw, SkipForward, Sun, Volume2, VolumeX, X } from 'lucide-react';
import WhatsAppButton from '@/components/whatsapp/WhatsAppButton';
import { SITE_NAME, SITE_PROJECT_AREA, SITE_WHATSAPP_NUMBER } from '@/lib/site';
import { Ambient } from './audio';
import { FlatEngine, pickQuality, type Mode, type RoomInfo, type TourState } from './engine';
import PlanSvg from './PlanSvg';
import { PLANS, type PlanId } from './plans';
import { STYLE_LIST, type StyleId } from './styles';
import { TIME_MAX, TIME_MIN, timeLabel } from './world';

const CSS = `
.flat3d-label{position:absolute;left:0;top:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:5px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.24);background:rgba(20,48,28,.8);color:#fff;font:600 12px/1.25 var(--font-body),Inter,sans-serif;white-space:nowrap;cursor:pointer;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);transition:background .2s;will-change:transform}
.flat3d-label:hover,.flat3d-label:focus-visible{background:#3b7122}
.flat3d-label span{font-weight:400;font-size:10.5px;opacity:.82;font-variant-numeric:tabular-nums}
@media (max-width:640px){.flat3d-label{padding:3px 7px;font-size:10.5px}.flat3d-label span{font-size:9.5px}}
.flat3d-range{-webkit-appearance:none;appearance:none;width:100%;height:30px;background:transparent;cursor:pointer;touch-action:none;margin:0}
.flat3d-range:focus-visible{outline:2px solid #fff;outline-offset:2px;border-radius:99px}
.flat3d-range::-webkit-slider-runnable-track{height:6px;border-radius:99px;background:linear-gradient(90deg,#f39a63 0%,#ffe6b8 9%,#bfe0ff 24%,#d4ebff 55%,#ffd68f 72%,#ff8748 82%,#4b4f88 90%,#0c1230 100%)}
.flat3d-range::-moz-range-track{height:6px;border-radius:99px;background:linear-gradient(90deg,#f39a63 0%,#ffe6b8 9%,#bfe0ff 24%,#d4ebff 55%,#ffd68f 72%,#ff8748 82%,#4b4f88 90%,#0c1230 100%)}
.flat3d-range::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-8px;border-radius:50%;background:#fff;border:3px solid #3b7122;box-shadow:0 2px 8px rgba(0,0,0,.45)}
.flat3d-range::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #3b7122;box-shadow:0 2px 8px rgba(0,0,0,.45)}
@keyframes flat3d-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.flat3d-in{animation:flat3d-in .45s cubic-bezier(.22,1,.36,1) both}
@media (prefers-reduced-motion:reduce){.flat3d-in{animation:none}}
`;

const panel = 'border border-white/15 bg-forest/80 text-white shadow-lift backdrop-blur-md';
const iconBtn = 'grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/15 bg-forest/80 text-white backdrop-blur-md transition-colors hover:bg-forest-700';
const seg = (on: boolean) =>
  `rounded-md px-3 py-2 text-[13px] font-semibold transition-colors ${on ? 'bg-cream text-forest' : 'text-white/80 hover:bg-white/10 hover:text-white'}`;

const STICK = 46;

/** left-thumb joystick for phones and tablets */
function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = base.current, k = knob.current;
    if (!el || !k) return;
    let id = -1;
    const set = (dx: number, dy: number) => { k.style.transform = `translate(calc(-50% + ${dx * STICK}px), calc(-50% + ${dy * STICK}px))`; };
    const update = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      let dx = (e.clientX - (r.left + r.width / 2)) / STICK, dy = (e.clientY - (r.top + r.height / 2)) / STICK;
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      set(dx, dy);
      onMove(Math.abs(dx) < 0.1 ? 0 : dx, Math.abs(dy) < 0.1 ? 0 : dy);
    };
    const down = (e: PointerEvent) => { e.preventDefault(); if (id !== -1) return; id = e.pointerId; el.setPointerCapture(id); update(e); };
    const move = (e: PointerEvent) => { if (e.pointerId === id) update(e); };
    const up = (e: PointerEvent) => { if (e.pointerId !== id) return; id = -1; set(0, 0); onMove(0, 0); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      onMove(0, 0);
    };
  }, [onMove]);
  return (
    <div
      ref={base}
      aria-label="Walk joystick"
      className="absolute left-[max(18px,env(safe-area-inset-left))] h-[116px] w-[116px] touch-none select-none rounded-full border-2 border-white/80 bg-forest/40 backdrop-blur-sm"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 138px)' }}
    >
      <div ref={knob} className="pointer-events-none absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/95 shadow-lg" style={{ transform: 'translate(-50%,-50%)' }} />
    </div>
  );
}

export default function FlatExperience({ onClose, projectName = 'Elite Homes' }: { onClose: () => void; projectName?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FlatEngine | null>(null);
  const audioRef = useRef<Ambient | null>(null);
  const unlockedAt = useRef(0);

  // the viewer is client-only (loaded with ssr:false), so reading the device here is safe
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [plan, setPlan] = useState<PlanId>('east');
  const [style, setStyle] = useState<StyleId>('lux');
  const [time, setTime] = useState(16.4);
  const [mode, setMode] = useState<Mode>('doll');
  const [furnished, setFurnished] = useState(true);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [roomShown, setRoomShown] = useState(false);
  const [tour, setTour] = useState<TourState>({ status: 'idle', step: 0, total: 0, stop: null });
  const [muted, setMuted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hint, setHint] = useState(false);
  const [full, setFull] = useState(false);
  /** bumped to build a fresh 3D view after the device dropped the old one */
  const [epoch, setEpoch] = useState(0);

  const restart = () => {
    setError(null); setReady(false); setLive(false); setProgress(0);
    setPlan('east'); setStyle('lux'); setTime(16.4); setMode('doll'); setRoom(null); setFurnished(true);
    setTour({ status: 'idle', step: 0, total: 0, stop: null });
    setEpoch((e) => e + 1);
  };

  useEffect(() => {
    const mount = mountRef.current, labels = labelRef.current;
    if (!mount || !labels) return;
    const engine = new FlatEngine(
      mount,
      labels,
      { plan: 'east', style: 'lux', time: 16.4, quality: pickQuality(), reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches },
      {
        progress: setProgress,
        ready: () => setReady(true),
        error: setError,
        mode: setMode,
        room: (r) => { setRoom(r); setRoomShown(!!r); },
        tour: setTour,
        lock: (l) => { setLocked(l); if (!l) unlockedAt.current = performance.now(); },
      },
    );
    engineRef.current = engine;
    audioRef.current = new Ambient();
    if (process.env.NODE_ENV !== 'production') (window as unknown as { __flat?: FlatEngine }).__flat = engine;
    void engine.init();
    const onVis = () => audioRef.current?.setActive(!document.hidden);
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFs);
      engine.dispose();
      audioRef.current?.dispose();
      engineRef.current = null;
      audioRef.current = null;
    };
  }, [epoch]);

  // the room name fades away a few seconds after you walk in
  useEffect(() => {
    if (!roomShown) return;
    const t = setTimeout(() => setRoomShown(false), 4200);
    return () => clearTimeout(t);
  }, [roomShown, room]);

  useEffect(() => {
    if (!hint) return;
    const t = setTimeout(() => setHint(false), 9000);
    return () => clearTimeout(t);
  }, [hint, mode]);

  const toggleMute = useCallback(() => {
    setMuted((m) => { audioRef.current?.setMuted(!m); return !m; });
  }, []);

  const tourButton = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    if (tour.status === 'running') e.pauseTour();
    else if (tour.status === 'paused') e.resumeTour();
    else e.startTour();
  }, [tour.status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (document.pointerLockElement || performance.now() - unlockedAt.current < 900) return;
        onClose();
      } else if (!live) return;
      else if (e.code === 'KeyM') toggleMute();
      else if (e.code === 'Space') { e.preventDefault(); if (tour.status === 'running' || tour.status === 'paused') tourButton(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live, onClose, toggleMute, tourButton, tour.status]);

  const go = (guided: boolean) => {
    const e = engineRef.current;
    if (!e || !ready) return;
    audioRef.current?.start();
    setLive(true);
    setHint(!guided);
    if (guided) e.startTour();
    else { e.begin(); e.setMode('walk'); }
  };

  const choosePlan = (id: PlanId) => { setPlan(id); engineRef.current?.setPlan(id); };
  const chooseStyle = (id: StyleId) => { setStyle(id); engineRef.current?.setStyle(id); };
  const chooseTime = (t: number) => { setTime(t); engineRef.current?.setTime(t); };
  const toggleView = () => {
    const e = engineRef.current;
    if (!e) return;
    if (mode === 'walk') { e.stopTour(); e.setMode('doll'); } else e.setMode('walk');
    setHint(true);
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.().catch(() => undefined);
  };
  const stick = useCallback((x: number, y: number) => engineRef.current?.setStick(x, y), []);
  const toggleFurnished = () => { const next = !furnished; setFurnished(next); engineRef.current?.setFurnished(next); };

  const tl = timeLabel(time);
  const touring = tour.status === 'running' || tour.status === 'paused';
  const done = tour.status === 'done';
  const planDef = PLANS[plan];
  const other: PlanId = plan === 'east' ? 'west' : 'east';
  const hintText = mode === 'doll'
    ? (touch ? 'Drag to turn · pinch to zoom · tap a room to step inside' : 'Drag to turn · scroll to zoom · click a room to step inside')
    : touch ? 'Left stick to walk · drag anywhere to look around' : 'W A S D to walk · drag to look · click for mouse-look · Shift to walk faster';

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={`3D walkthrough of the ${projectName} 3 BHK flat`}
      data-lenis-prevent
      className="fixed inset-0 z-[10000] select-none overflow-hidden bg-[#0d1a11] font-body text-white"
      style={{ overscrollBehavior: 'none' }}
    >
      <style>{CSS}</style>
      <div ref={mountRef} className="absolute inset-0" />
      <div ref={labelRef} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500" />

      {/* ---------------- top bar ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 pt-[max(10px,env(safe-area-inset-top))] md:p-4">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          {live && (
            <>
              <div className={`${panel} hidden min-w-0 rounded-xl px-4 py-2 sm:block`}>
                <p className="!text-[10px] font-semibold uppercase !leading-tight tracking-[0.2em] !text-meadow-400">{SITE_NAME}</p>
                <p className="truncate font-heading !text-[16px] !leading-tight !text-white">{projectName} · 3 BHK</p>
              </div>
              <div className={`${panel} flex rounded-xl p-1`} role="group" aria-label="Which flat">
                {(['east', 'west'] as PlanId[]).map((id) => (
                  <button key={id} type="button" className={seg(plan === id)} aria-pressed={plan === id} onClick={() => choosePlan(id)}>
                    {id === 'east' ? 'East' : 'West'}<span className="hidden md:inline"> facing</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          {live && (
            <button type="button" className={iconBtn} onClick={toggleMute} aria-label={muted ? 'Turn music on' : 'Mute music'} aria-pressed={muted}>
              {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
            </button>
          )}
          {live && !touch && (
            <button type="button" className={iconBtn} onClick={toggleFull} aria-label={full ? 'Leave full screen' : 'Full screen'}>
              {full ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
          <button type="button" className={iconBtn} onClick={onClose} aria-label="Close the 3D walkthrough">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ---------------- welcome ---------------- */}
      {!live && !error && (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-forest via-forest/80 to-forest/10 md:items-center md:bg-gradient-to-r md:from-forest md:via-forest/85 md:to-transparent">
          <div className="flat3d-in max-h-full w-full overflow-y-auto px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-20 md:max-w-[560px] md:px-12 md:py-10">
            <p className="!text-[11px] font-semibold uppercase tracking-[0.22em] !text-meadow-400">{SITE_NAME} · {SITE_PROJECT_AREA}</p>
            <h1 className="mt-3 font-heading !text-[clamp(30px,5vw,50px)] !leading-[1.05] text-white">Walk through your {projectName} home.</h1>
            <p className="mt-4 max-w-[46ch] !text-[15px] !leading-relaxed !text-white/80 md:!text-[16px]">
              A 3D model of the 3 BHK, built to scale from the floor plan — every wall, door and window where the drawing puts it.
              Take the guided tour, or wander through on your own.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Choose a flat">
              {(['east', 'west'] as PlanId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={plan === id}
                  onClick={() => choosePlan(id)}
                  disabled={!ready}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-colors disabled:opacity-60 md:p-3 ${plan === id ? 'border-meadow-400 bg-white/10' : 'border-white/15 hover:border-white/40'}`}
                >
                  <PlanSvg plan={id} className="h-[68px] w-[48px] shrink-0 md:h-[84px] md:w-[58px]" />
                  <span className="min-w-0">
                    <span className="block font-heading text-[16px] leading-tight text-white md:text-[18px]">{PLANS[id].label}</span>
                    <span className="mt-0.5 hidden text-[12px] leading-snug text-white/65 sm:block">{PLANS[id].facing}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => go(true)} disabled={!ready} className="btn btn-primary min-h-[48px] w-full !px-5 disabled:cursor-wait disabled:opacity-70 sm:w-auto">
                <Play size={17} /> {ready ? 'Start the guided tour' : 'Preparing the home…'}
              </button>
              <button type="button" onClick={() => go(false)} disabled={!ready} className="btn min-h-[48px] w-full border border-white/35 !px-5 text-white hover:bg-white hover:text-forest disabled:opacity-50 sm:w-auto">
                <Footprints size={17} /> Explore on my own
              </button>
            </div>
            <div className="mt-4 h-[3px] w-full max-w-[420px] overflow-hidden rounded-full bg-white/15" aria-hidden={ready}>
              <div className="h-full rounded-full bg-meadow-400 transition-[width,opacity] duration-500" style={{ width: `${Math.max(6, progress * 100)}%`, opacity: ready ? 0 : 1 }} />
            </div>
            <p className="mt-3 max-w-[48ch] !text-[12.5px] !leading-relaxed !text-white/60">
              {touch ? 'Use the on-screen stick to walk and drag to look around.' : 'Walk with W A S D and look around with the mouse.'} Soft music plays once you start — mute it any time from the top corner.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- error ---------------- */}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-forest p-6 text-center">
          <div className="max-w-[420px]">
            <p className="!text-white">{error}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" onClick={restart} className="btn btn-primary">Reload the 3D view</button>
              <button type="button" onClick={onClose} className="btn border border-white/35 text-white hover:bg-white hover:text-forest">Close</button>
            </div>
          </div>
        </div>
      )}

      {live && !error && (
        <>
          {/* which room you are standing in */}
          {mode === 'walk' && room && roomShown && !touring && !done && (
            <div key={room.id} className={`${panel} flat3d-in pointer-events-none absolute left-1/2 top-[70px] -translate-x-1/2 rounded-full px-4 py-2 text-center md:top-[84px]`}>
              <span className="font-heading text-[15px]">{room.name}</span>
              <span className="ml-2 text-[12.5px] tabular-nums text-white/75">{room.dims}{room.sqft ? ` · ${room.sqft} sq ft` : ''}</span>
            </div>
          )}

          {/* guided tour card */}
          {touring && (
            <div className={`${panel} flat3d-in absolute inset-x-2.5 top-[66px] rounded-2xl p-3.5 max-md:landscape:left-auto max-md:landscape:w-[320px] md:inset-x-auto md:bottom-[104px] md:left-4 md:top-auto md:w-[360px] md:p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className="!text-[11px] font-semibold uppercase tracking-[0.2em] !text-meadow-400">
                  Guided tour · <span className="tabular-nums">{String(Math.min(tour.step + 1, tour.total)).padStart(2, '0')} / {String(tour.total).padStart(2, '0')}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={tourButton} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15" aria-label={tour.status === 'running' ? 'Pause the tour' : 'Resume the tour'}>
                    {tour.status === 'running' ? <Pause size={17} /> : <Play size={17} />}
                  </button>
                  <button type="button" onClick={() => engineRef.current?.nextStop()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15" aria-label="Skip to the next room">
                    <SkipForward size={17} />
                  </button>
                  <button type="button" onClick={() => engineRef.current?.stopTour()} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/15" aria-label="End the tour">
                    <X size={17} />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-meadow-400 transition-[width] duration-700" style={{ width: `${((tour.step + (tour.stop ? 1 : 0.5)) / Math.max(1, tour.total)) * 100}%` }} />
              </div>
              {tour.stop ? (
                <div key={tour.stop.id} className="flat3d-in mt-3" aria-live="polite">
                  <h2 className="font-heading !text-[22px] !leading-tight text-white md:!text-[26px]">{tour.stop.name}</h2>
                  <p className="mt-1 !text-[13px] tabular-nums !text-white/75">
                    {tour.stop.dims}{tour.stop.sqft ? ` · ${tour.stop.sqft} sq ft` : ''}
                  </p>
                  <p className="mt-2 !text-[14px] !leading-snug !text-white/90">{tour.stop.point}</p>
                </div>
              ) : (
                <p className="mt-2.5 !text-[13px] !text-white/70">{tour.status === 'paused' ? 'Paused — look around, then press play to carry on.' : tour.step >= tour.total - 1 ? 'Rising above the whole home…' : 'Walking to the next room…'}</p>
              )}
            </div>
          )}

          {/* end of tour */}
          {done && (
            <div className="absolute inset-0 grid place-items-end bg-gradient-to-t from-forest/85 via-forest/20 to-transparent p-3 pb-[150px] md:place-items-center md:bg-none md:p-6">
              <div className={`${panel} flat3d-in w-full max-w-[460px] rounded-2xl p-5 md:p-7`}>
                <p className="!text-[11px] font-semibold uppercase tracking-[0.2em] !text-meadow-400">{planDef.label} · 3 BHK</p>
                <h2 className="mt-2 font-heading !text-[26px] !leading-tight text-white md:!text-[32px]">That&rsquo;s the whole home.</h2>
                <p className="mt-2 !text-[14.5px] !leading-relaxed !text-white/80">
                  Every room you just walked is to scale with the plan. Come and stand in it for real — we&rsquo;ll show you the flat and the view from your floor.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <a href="/site-visit" className="btn btn-primary min-h-[46px] flex-1"><CalendarCheck size={16} /> Book a site visit</a>
                  <WhatsAppButton variant="pill" phoneNumber={SITE_WHATSAPP_NUMBER} projectName={projectName} title="WhatsApp us" leadNote="Finished the 3D walkthrough" />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-[13.5px] font-semibold">
                  <button type="button" className="inline-flex items-center gap-1.5 text-white/85 hover:text-white" onClick={() => engineRef.current?.startTour()}><RotateCcw size={14} /> Replay the tour</button>
                  <button type="button" className="inline-flex items-center gap-1.5 text-white/85 hover:text-white" onClick={() => { engineRef.current?.stopTour(); engineRef.current?.enterRoom('living'); }}><Footprints size={14} /> Walk it yourself</button>
                  <button type="button" className="inline-flex items-center gap-1.5 text-white/85 hover:text-white" onClick={() => { engineRef.current?.stopTour(); choosePlan(other); }}>See the {PLANS[other].label.toLowerCase()} flat <ArrowRight size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {/* how to move */}
          {hint && !touring && !done && (
            <div className={`${panel} flat3d-in pointer-events-none absolute left-1/2 max-w-[92vw] -translate-x-1/2 rounded-full px-4 py-2 text-center text-[12.5px] md:text-[13px] ${touch ? 'top-[118px]' : 'bottom-[104px]'}`}>
              {locked ? 'Mouse-look is on · press Esc to use the controls' : hintText}
            </div>
          )}
          {locked && !hint && (
            <div className={`${panel} pointer-events-none absolute bottom-[104px] left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-[12.5px]`}>Press Esc to use the controls</div>
          )}

          {touch && mode === 'walk' && !done && <Joystick onMove={stick} />}

          {/* ---------------- control dock ---------------- */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2 pb-[max(8px,env(safe-area-inset-bottom))] md:p-4">
            <div className={`${panel} pointer-events-auto mx-auto flex max-w-[1040px] flex-wrap items-center gap-2 rounded-2xl p-2 md:flex-nowrap md:gap-3 md:p-2.5`}>
              <div className="order-2 flex gap-2 md:order-1">
                <button type="button" onClick={tourButton} className="inline-flex h-11 items-center gap-2 rounded-lg bg-meadow-600 px-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-meadow-700 md:px-4">
                  {tour.status === 'running' ? <Pause size={16} /> : <Play size={16} />}
                  <span>{tour.status === 'running' ? 'Pause' : tour.status === 'paused' ? 'Resume' : <>Tour<span className="hidden lg:inline"> the home</span></>}</span>
                </button>
                <button type="button" onClick={toggleView} aria-pressed={mode === 'doll'} className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-3.5 text-[13.5px] font-semibold text-white transition-colors hover:bg-white/10 md:px-4">
                  {mode === 'walk' ? <Box size={16} /> : <Footprints size={16} />}
                  <span>{mode === 'walk' ? 'Dollhouse' : 'Walk inside'}</span>
                </button>
              </div>

              <div className="order-4 flex shrink-0 rounded-lg bg-black/20 p-1" role="group" aria-label="Furniture view">
                <button type="button" className={seg(furnished)} aria-pressed={furnished} onClick={() => furnished || toggleFurnished()}>Furnished</button>
                <button type="button" className={seg(!furnished)} aria-pressed={!furnished} onClick={() => !furnished || toggleFurnished()}>Empty</button>
              </div>

              <button
                type="button"
                onClick={() => chooseStyle(STYLE_LIST[(STYLE_LIST.findIndex((s) => s.id === style) + 1) % STYLE_LIST.length].id)}
                aria-label={`Interior style: ${STYLE_LIST.find((s) => s.id === style)?.name}. Tap to change.`}
                className="order-3 flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg bg-black/25 px-3 text-left sm:hidden"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase leading-none tracking-[0.14em] text-white/60">Style</span>
                  <span className="mt-1 block truncate text-[13px] font-semibold leading-none">{STYLE_LIST.find((s) => s.id === style)?.short}</span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-white/70" aria-hidden />
              </button>
              <div className="order-3 hidden flex-1 justify-end rounded-lg bg-black/20 p-1 sm:flex md:order-2 md:flex-none" role="group" aria-label="Interior style">
                {STYLE_LIST.map((s) => (
                  <button key={s.id} type="button" title={s.blurb} className={`${seg(style === s.id)} flex-1 !px-2.5 md:flex-none md:!px-3`} aria-pressed={style === s.id} onClick={() => chooseStyle(s.id)}>
                    <span className="lg:hidden">{s.short}</span><span className="hidden lg:inline">{s.name}</span>
                  </button>
                ))}
              </div>

              <label className="order-1 flex w-full min-w-0 items-center gap-2.5 px-1.5 md:order-3 md:w-auto md:flex-1">
                <Sun size={17} className="shrink-0 text-[#ffd68f]" aria-hidden />
                <input
                  type="range"
                  className="flat3d-range min-w-0 flex-1"
                  min={TIME_MIN}
                  max={TIME_MAX}
                  step={0.05}
                  value={time}
                  onChange={(e) => chooseTime(parseFloat(e.target.value))}
                  aria-label="Time of day"
                  aria-valuetext={`${tl.clock}, ${tl.phase}`}
                />
                <Moon size={16} className="shrink-0 text-[#b9c4ff]" aria-hidden />
                <span className="w-[92px] shrink-0 text-right leading-tight md:w-[104px]">
                  <span className="block text-[13px] font-semibold tabular-nums">{tl.clock}</span>
                  <span className="block text-[11px] text-white/65">{tl.phase}</span>
                </span>
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
