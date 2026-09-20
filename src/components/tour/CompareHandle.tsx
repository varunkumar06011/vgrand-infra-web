'use client';

import React, { useCallback, useRef } from 'react';
import { MoveHorizontal } from 'lucide-react';

/**
 * Before/after split handle for the compare slider.
 * Rendered as a sibling of PhotoStage inside the stage container —
 * the split position is viewport-relative and intentionally does NOT
 * track pan/zoom (gestures are disabled on the stage while comparing).
 *
 * Accessibility: role="slider" + arrow keys on the grip, and the whole
 * strip is a pointer-capture drag target with touch-action:none so it
 * never starts a photo pan or a Lenis scroll.
 */

interface Props {
  /** split position, % of stage width (0-100) */
  pos: number;
  onChange: (pos: number) => void;
  label: string;
  /** chip text over the base (left) and variant (right) halves */
  beforeLabel: string;
  afterLabel: string;
}

const clamp = (p: number) => Math.min(96, Math.max(4, p));

export default function CompareHandle({ pos, onChange, label, beforeLabel, afterLabel }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const posFromClientX = useCallback(
    (clientX: number) => {
      const parent = stripRef.current?.offsetParent as HTMLElement | null;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      onChange(clamp(((clientX - rect.left) / rect.width) * 100));
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    posFromClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.stopPropagation();
    posFromClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    dragging.current = false;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // stopPropagation keeps the viewer's ←/→ scene nav out of this control
    const step = e.shiftKey ? 10 : 2;
    let next: number | null = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = pos - step;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = pos + step;
    else if (e.key === 'Home') next = 4;
    else if (e.key === 'End') next = 96;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    onChange(clamp(next));
  };

  return (
    <>
      {/* side labels — track the split */}
      <span className="absolute top-3 left-3 z-10 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 z-10 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80 pointer-events-none">
        {afterLabel}
      </span>

      {/* draggable strip */}
      <div
        ref={stripRef}
        data-lenis-prevent
        className="absolute inset-y-0 z-10 cursor-ew-resize"
        style={{ left: `${pos}%`, width: 44, marginLeft: -22, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* the split line */}
        <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)]" />
        {/* grip */}
        <div
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pos)}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white text-[#1a1a1a] shadow-xl border border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B] cursor-ew-resize"
        >
          <MoveHorizontal size={18} />
        </div>
      </div>
    </>
  );
}
