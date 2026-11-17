import React from 'react';
import { PLANS, planBounds, type PlanId } from './plans';

/**
 * A small line drawing of a flat, generated from the same plan data the 3D model is built
 * from — so the thumbnail can never disagree with the walkthrough.
 */
export default function PlanSvg({ plan, className, tone = 'dark' }: { plan: PlanId; className?: string; tone?: 'dark' | 'light' }) {
  const p = PLANS[plan];
  const [x0, y0, x1, y1] = planBounds(p);
  const pad = 1.6;
  const dark = tone === 'dark';
  const wall = dark ? '#f6f3e8' : '#14301c';
  const fill: Record<string, string> = dark
    ? { main: 'rgba(246,243,232,0.10)', master: 'rgba(246,243,232,0.2)', bath: 'rgba(106,168,62,0.30)', deck: 'rgba(106,168,62,0.55)' }
    : { main: 'rgba(20,48,28,0.05)', master: 'rgba(20,48,28,0.12)', bath: 'rgba(74,138,42,0.22)', deck: 'rgba(74,138,42,0.42)' };
  const glass = dark ? '#9cc7ea' : '#2f6fdc';

  const walls: React.ReactNode[] = [];
  p.walls.forEach((w, i) => {
    const rail = (w.kind ?? 'wall') !== 'wall';
    const seg = (a: number, b: number, key: string, colour = wall, thin = false) => {
      const t = thin ? w.t * 0.34 : w.t, c = thin ? w.c + w.t * 0.33 : w.c;
      walls.push(w.o === 'h'
        ? <rect key={key} x={a} y={c} width={b - a} height={t} fill={colour} opacity={rail ? 0.55 : 1} />
        : <rect key={key} x={c} y={a} width={t} height={b - a} fill={colour} opacity={rail ? 0.55 : 1} />);
    };
    let cur = w.a;
    [...(w.open ?? [])].sort((a, b) => a.a - b.a).forEach((o, j) => {
      if (o.a > cur) seg(cur, o.a, `${i}-${j}`);
      if (o.kind === 'window' || o.kind === 'vent' || o.kind === 'slider') seg(o.a, o.b, `${i}-${j}g`, glass, true);
      cur = o.b;
    });
    if (w.b > cur) seg(cur, w.b, `${i}-end`);
  });

  const main = p.walls.flatMap((w) => (w.open ?? []).filter((o) => o.kind === 'main').map((o) => ({ w, o })))[0];
  const ax = main ? (main.o.a + main.o.b) / 2 : 0;
  const top = p.entry.side === 'top';
  const ay = top ? y0 - 0.5 : y1 + 0.5;

  return (
    <svg className={className} viewBox={`${x0 - pad} ${y0 - pad - 1.4} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad + 2.8}`} role="img" aria-label={`${p.label} floor plan`}>
      {p.rooms.map((r) => (
        <rect key={r.id} x={r.r[0]} y={r.r[1]} width={r.r[2] - r.r[0]} height={r.r[3] - r.r[1]} fill={fill[r.floor]} />
      ))}
      {walls}
      {main && (
        <path
          d={top ? `M ${ax - 1.3} ${ay - 2} L ${ax + 1.3} ${ay - 2} L ${ax} ${ay} Z` : `M ${ax - 1.3} ${ay + 2} L ${ax + 1.3} ${ay + 2} L ${ax} ${ay} Z`}
          fill="#6aa83e"
        />
      )}
    </svg>
  );
}
