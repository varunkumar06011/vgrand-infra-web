'use client';

import React from 'react';
import type { TourConfig, TourScene } from '@/data/tours';

/**
 * SVG floor-plan minimap — clean redraw of the 3 BHK East plan.
 * Plan orientation: top edge = East (entry side), right = South,
 * bottom = West, left = North.
 *
 * bearing θ (0=N, clockwise) -> plan vector (-cosθ, -sinθ)
 *   θ=90 (E) -> up,  θ=0 (N) -> left,  θ=180 (S) -> right,  θ=270 (W) -> down
 */

const CONE_HALF = (26 * Math.PI) / 180;
const CONE_R = 16;

function planDir(headingDeg: number) {
  const t = (headingDeg * Math.PI) / 180;
  return { x: -Math.cos(t), y: -Math.sin(t) };
}

interface Props {
  tour: TourConfig;
  scenes: TourScene[];
  current: number;
  onJump: (index: number) => void;
  /** plan-room labels resolved for the active language */
  planLabels: Record<string, string>;
  /** scene id -> room name (dot aria-labels) */
  sceneNames: Record<string, string>;
  /** Phase 3 — view-direction arrow on the floor-view host scene's dot */
  floorViewArrow?: { sceneId: string; heading: number } | null;
}

export default function FloorplanMinimap({ tour, scenes, current, onJump, planLabels, sceneNames, floorViewArrow }: Props) {
  const { w, h } = tour.plan.viewBox;
  const scene = scenes[current];
  const arrowScene = floorViewArrow
    ? scenes.find((s) => s.id === floorViewArrow.sceneId)
    : undefined;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-auto block"
      role="img"
      aria-label="Floor plan — tap a room to jump to it"
    >
      {/* flat outline */}
      <rect
        x={4}
        y={2}
        width={w - 8}
        height={h - 4}
        rx={2}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={0.8}
      />
      {/* entry marker on the east (top) edge */}
      <path
        d={`M ${w * 0.27} 2 l 3 -0 l -1.5 3 z`}
        fill="#C0392B"
      />
      <text x={w * 0.27 + 4} y={4.5} fontSize={3.4} fill="rgba(255,255,255,0.55)" fontFamily="inherit">
        ENTRY · EAST
      </text>

      {tour.plan.rooms.map((r) => (
        <g key={r.id}>
          <rect
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={0.5}
          />
          <text
            x={r.x + r.w / 2}
            y={r.y + r.h / 2 + 1.2}
            textAnchor="middle"
            fontSize={3.1}
            fill="rgba(255,255,255,0.45)"
            fontFamily="inherit"
            letterSpacing={0.4}
          >
            {planLabels[r.id] ?? r.id}
          </text>
        </g>
      ))}

      {/* radar cone for the current scene's camera bearing */}
      {scene && (
        <path
          d={(() => {
            const d = planDir(scene.heading);
            const a = Math.atan2(d.y, d.x);
            const p1 = a - CONE_HALF;
            const p2 = a + CONE_HALF;
            return [
              `M ${scene.minimap.x} ${scene.minimap.y}`,
              `L ${scene.minimap.x + Math.cos(p1) * CONE_R} ${scene.minimap.y + Math.sin(p1) * CONE_R}`,
              `A ${CONE_R} ${CONE_R} 0 0 1 ${scene.minimap.x + Math.cos(p2) * CONE_R} ${scene.minimap.y + Math.sin(p2) * CONE_R}`,
              'Z',
            ].join(' ');
          })()}
          fill="rgba(192,57,43,0.35)"
        />
      )}

      {/* view-direction arrow on the floor-view host scene's dot */}
      {arrowScene && floorViewArrow && (
        <g pointerEvents="none">
          {(() => {
            const d = planDir(floorViewArrow.heading);
            const sx = arrowScene.minimap.x;
            const sy = arrowScene.minimap.y;
            const ex = sx + d.x * 9.5;
            const ey = sy + d.y * 9.5;
            const bx = sx + d.x * 6;
            const by = sy + d.y * 6;
            const px = -d.y;
            const py = d.x;
            return (
              <>
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#C0392B" strokeWidth={1.3} strokeLinecap="round" />
                <path
                  d={`M ${ex} ${ey} L ${bx + px * 2.1} ${by + py * 2.1} L ${bx - px * 2.1} ${by - py * 2.1} Z`}
                  fill="#C0392B"
                />
              </>
            );
          })()}
        </g>
      )}

      {/* scene dots */}
      {scenes.map((s, i) => {
        const active = i === current;
        return (
          <g
            key={s.id}
            onClick={() => onJump(i)}
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label={`Go to ${sceneNames[s.id] ?? s.id}`}
          >
            {/* generous tap target */}
            <circle cx={s.minimap.x} cy={s.minimap.y} r={7} fill="transparent" />
            {active && (
              <circle cx={s.minimap.x} cy={s.minimap.y} r={4.6} fill="rgba(192,57,43,0.35)">
                <animate attributeName="r" values="3.4;5.4;3.4" dur="1.8s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={s.minimap.x}
              cy={s.minimap.y}
              r={2.1}
              fill={active ? '#C0392B' : 'rgba(255,255,255,0.85)'}
              stroke={active ? '#fff' : 'rgba(0,0,0,0.35)'}
              strokeWidth={0.7}
            />
          </g>
        );
      })}

      {/* mini compass — N on the left edge of this plan */}
      <g transform={`translate(${w - 7} ${h - 8})`}>
        <circle r={4.4} fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.3)" strokeWidth={0.4} />
        <path d="M -2.6 0 L 0 0 M 0 0 L 0 0" stroke="none" />
        <path d="M 0 0 L -2.7 1.1 L -2.7 -1.1 Z" fill="#C0392B" transform="rotate(0)" />
        <text x={-5.4} y={1.1} fontSize={3} fill="#fff" textAnchor="middle" fontFamily="inherit">
          N
        </text>
      </g>
    </svg>
  );
}
