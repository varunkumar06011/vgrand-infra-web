'use client';

import React from 'react';

/** Small compass: fixed rose, needle rotated to the bearing (0=N). */
export default function CompassNeedle({ heading }: { heading: number }) {
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
