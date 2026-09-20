'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Captions, CaptionsOff, Square, Footprints,
} from 'lucide-react';
import type { TourLang, TourUIStrings } from '@/data/tours';
import { LANG_LABELS, fmt } from './tourText';

/* ---------------------------------------------------------------- */
/* Language switch — compact EN | తెలుగు segmented control            */
/* ---------------------------------------------------------------- */

export function LangSwitch({
  langs,
  lang,
  onChange,
}: {
  langs: TourLang[];
  lang: TourLang;
  onChange: (l: TourLang) => void;
}) {
  if (langs.length < 2) return null;
  return (
    <div
      role="group"
      aria-label="Tour language"
      data-lenis-prevent
      className="flex items-center rounded-full bg-black/50 backdrop-blur-md border border-white/15 p-0.5 shadow-lg"
    >
      {langs.map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-colors cursor-pointer ${
            lang === l ? 'bg-white text-[#1a1a1a]' : 'text-white/80 hover:bg-white/15'
          }`}
          style={
            l === 'te'
              ? { fontFamily: "var(--font-telugu), 'Noto Sans Telugu', sans-serif" }
              : undefined
          }
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Mode chooser — shown once when the viewer opens                    */
/* ---------------------------------------------------------------- */

export function ModeChooser({
  ui,
  lang,
  onGuided,
  onExplore,
}: {
  ui: TourUIStrings;
  lang: TourLang;
  onGuided: () => void;
  onExplore: () => void;
}) {
  const firstRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/45"
      data-lenis-prevent
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-2xl bg-[#141416]/95 backdrop-blur-md border border-white/15 shadow-2xl p-6 text-center"
      >
        <p
          className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#FFB4AB]"
          style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
        >
          {ui.dialogLabel}
        </p>
        <h3
          className="text-white font-bold text-lg mt-1.5 leading-snug"
          style={{
            fontFamily:
              lang === 'te'
                ? "var(--font-telugu), 'Noto Sans Telugu', sans-serif"
                : "var(--font-heading), 'Montserrat', sans-serif",
          }}
        >
          {ui.chooserTitle}
        </h3>
        <p
          className="text-[13px] text-white/65 mt-1.5"
          style={{ lineHeight: lang === 'te' ? 1.8 : 1.6 }}
        >
          {ui.chooserSub}
        </p>
        <div className="mt-5 space-y-2.5">
          <button
            ref={firstRef}
            onClick={onGuided}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-[#C0392B] hover:bg-[#a93226] text-white px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer border-none"
          >
            <Play size={16} /> {ui.guidedTour}
          </button>
          <button
            onClick={onExplore}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-3.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
          >
            <Footprints size={16} /> {ui.explore}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/* Caption — aria-live region for narration text                      */
/* ---------------------------------------------------------------- */

export function CaptionPanel({
  ui,
  lang,
  room,
  text,
}: {
  ui: TourUIStrings;
  lang: TourLang;
  room: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="absolute z-[26] left-1/2 -translate-x-1/2 bottom-28 md:bottom-32 w-[calc(100%-32px)] max-w-md rounded-xl bg-[#141416]/95 backdrop-blur-md border border-white/15 shadow-2xl px-4 py-3 pointer-events-none"
      data-lenis-prevent
    >
      <p
        className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#FFB4AB]"
        style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}
      >
        {ui.guidedTag} · {room}
      </p>
      {/* live region — announced as the narration changes */}
      <p
        aria-live="polite"
        className="text-white/90 text-[13px] mt-1"
        style={{ lineHeight: lang === 'te' ? 1.8 : 1.55 }}
      >
        {text}
      </p>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */
/* Guided control bar — replaces the normal bottom bar while guided   */
/* ---------------------------------------------------------------- */

const gBtn =
  'flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full text-white transition-colors ' +
  'bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/15 cursor-pointer';

export function GuidedBar({
  ui,
  playing,
  muted,
  ccOn,
  hasAudio,
  index,
  total,
  progress,
  onPlayPause,
  onPrev,
  onNext,
  onMute,
  onCc,
  onStop,
}: {
  ui: TourUIStrings;
  playing: boolean;
  muted: boolean;
  ccOn: boolean;
  hasAudio: boolean;
  index: number;
  total: number;
  /** 0..1 progress through the whole guided walk */
  progress: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onMute: () => void;
  onCc: () => void;
  onStop: () => void;
}) {
  return (
    <div
      data-lenis-prevent
      className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 md:px-5 pb-3 pt-8"
    >
      {/* overall progress */}
      <div
        className="h-1 rounded-full bg-white/15 overflow-hidden mb-2.5 mx-0.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label={ui.guidedTag}
      >
        <div
          className="h-full bg-[#C0392B] transition-[width] duration-300"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button onClick={onPrev} disabled={index === 0} className={`${gBtn} disabled:opacity-30`} aria-label={ui.prevScene}>
          <SkipBack size={15} />
        </button>
        <button
          onClick={onPlayPause}
          className={`${gBtn} !w-11 !h-11 md:!w-12 md:!h-12 ${playing ? '!bg-[#C0392B]/85' : ''}`}
          aria-label={playing ? ui.pause : ui.play}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <button onClick={onNext} className={gBtn} aria-label={ui.nextScene}>
          <SkipForward size={15} />
        </button>

        <span className="text-[11px] font-semibold text-white/80 tabular-nums whitespace-nowrap px-1.5">
          {fmt(ui.sceneOf, { a: index + 1, b: total })}
        </span>

        <div className="flex-1" />

        <button
          onClick={onMute}
          className={gBtn}
          aria-label={muted ? ui.unmute : ui.mute}
          aria-pressed={muted}
          disabled={!hasAudio}
          style={!hasAudio ? { opacity: 0.35 } : undefined}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
        <button
          onClick={onCc}
          className={`${gBtn} ${ccOn ? '!bg-[#C0392B]/80' : ''}`}
          aria-label={ccOn ? ui.captionsOn : ui.captionsOff}
          aria-pressed={ccOn}
        >
          {ccOn ? <Captions size={15} /> : <CaptionsOff size={15} />}
        </button>
        <button
          onClick={onStop}
          className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] md:text-[11px] font-semibold px-3 py-2.5 cursor-pointer transition-colors"
        >
          <Square size={10} /> {ui.stopExplore}
        </button>
      </div>
    </div>
  );
}
