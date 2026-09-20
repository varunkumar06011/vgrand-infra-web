'use client';

import React from 'react';
import { Columns2, Sparkles } from 'lucide-react';
import type { SceneVariant, TourUIStrings, VariantGroup } from '@/data/tours';

/**
 * Furnished/Empty · Day/Evening pill toggles + compare entry + badges.
 * Renders only for groups the current scene actually has — a scene with
 * no variants renders nothing (Phase-2 behaviour).
 *
 * Variant images are fetched lazily: onPrefetch fires on hover/focus,
 * onActivate on tap — the parent decides when bytes hit the wire.
 */

interface Props {
  variants: SceneVariant[];
  /** currently displayed variant id, null = base photo */
  activeId: string | null;
  /** resolved ui + per-variant labels (i18n) */
  ui: TourUIStrings;
  variantLabels?: Record<string, string>;
  /** true while the before/after slider is open */
  comparing: boolean;
  onPrefetch: (v: SceneVariant) => void;
  onActivate: (v: SceneVariant | null) => void;
  onCompare: () => void;
}

const baseLabel = (ui: TourUIStrings, g: VariantGroup) =>
  g === 'furnishing' ? ui.variantBaseFurnishing : ui.variantBaseLighting;

export default function VariantBar({
  variants,
  activeId,
  ui,
  variantLabels,
  comparing,
  onPrefetch,
  onActivate,
  onCompare,
}: Props) {
  if (!variants.length) return null;

  const groups: VariantGroup[] = [];
  variants.forEach((v) => {
    if (!groups.includes(v.group)) groups.push(v.group);
  });

  const active = variants.find((v) => v.id === activeId) ?? null;
  const label = (v: SceneVariant) => variantLabels?.[v.id] ?? v.label;

  return (
    <div
      data-lenis-prevent
      className="flex flex-col items-center gap-1.5 pointer-events-auto"
    >
      <div className="flex items-center gap-1.5">
        {groups.map((g) => {
          const v = variants.find((x) => x.group === g)!;
          const on = active?.id === v.id;
          return (
            <div
              key={g}
              role="group"
              aria-label={g}
              className="flex items-center rounded-full bg-black/50 backdrop-blur-md border border-white/15 p-0.5 shadow-lg"
            >
              <button
                onClick={() => onActivate(null)}
                aria-pressed={!on}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  !on ? 'bg-white text-[#1a1a1a]' : 'text-white/85 hover:bg-white/15'
                }`}
              >
                {baseLabel(ui, g)}
              </button>
              <button
                onClick={() => onActivate(v)}
                onPointerEnter={() => onPrefetch(v)}
                onFocus={() => onPrefetch(v)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-colors cursor-pointer ${
                  on ? 'bg-white text-[#1a1a1a]' : 'text-white/85 hover:bg-white/15'
                }`}
              >
                {label(v)}
              </button>
            </div>
          );
        })}

        <button
          onClick={onCompare}
          aria-pressed={comparing}
          aria-label={comparing ? ui.exitCompare : ui.compare}
          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold tracking-wide border backdrop-blur-md shadow-lg transition-colors cursor-pointer ${
            comparing
              ? 'bg-[#C0392B] border-[#C0392B] text-white'
              : 'bg-black/50 border-white/15 text-white/85 hover:bg-black/65'
          }`}
        >
          <Columns2 size={13} />
          <span className="hidden sm:inline">{ui.compare}</span>
        </button>
      </div>

      {/* variant caption — says what you're looking at */}
      {active && !comparing && (
        <span className="rounded-full bg-black/50 backdrop-blur-sm border border-white/10 px-3 py-1 text-[10px] font-medium text-white/80">
          {variantLabels?.[active.id] ?? active.label}
          {active.kind === 'real' && active.caption ? ` · ${active.caption}` : ''}
        </span>
      )}

      {/* staged badge — fixed wording, cannot be removed or restyled away */}
      {active?.kind === 'staged' && (
        <span
          role="note"
          className="flex items-center gap-1.5 rounded-md bg-[#1a1a1a]/90 border border-amber-300/40 px-3 py-1.5 text-[10px] font-semibold text-amber-200 max-w-[300px] text-center leading-snug"
        >
          <Sparkles size={11} className="shrink-0" />
          {ui.stagedBadge}
        </span>
      )}
    </div>
  );
}
