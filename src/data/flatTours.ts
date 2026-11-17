import type { ShiftKey, Vec } from '@/components/home/FlatScene';
import type { PlanId } from '@/components/flat3d/plans';

export type FlatTourChapter = {
  /** scroll-progress window (0..1) in which this text is on screen */
  range: [number, number];
  align: 'left' | 'center' | 'right';
  eyebrow: string;
  title: string;
  text: string;
};

/**
 * Scroll-driven 3D flat intro shown at the top of a project page.
 * Keyframes are in model metres and are spread evenly over scroll progress.
 *
 * Elite Homes is built in code from its floor plan (`plan`), so its keyframes are written in
 * plan FEET — x across and y down the East-facing sheet, origin at the living room's inside
 * corner — and converted here. See src/components/flat3d/plans.ts for the rooms.
 */
export type FlatTourConfig = {
  /** GLB model — only used when `plan` is not set */
  modelUrl: string;
  /** build the flat procedurally from this floor plan instead of loading a GLB */
  plan?: PlanId;
  /** shown until the 3D scene is ready */
  poster: string;
  scrollVh: number;
  camPath: Vec[];
  lookPath: Vec[];
  shiftKeys?: ShiftKey[];
  chapters: FlatTourChapter[];
  ctaLabel: string;
  ctaHref: string;
};

const FT = 0.3048;
const at = (x: number, y: number, h = 1.6): Vec => [+(x * FT).toFixed(3), h, +(y * FT).toFixed(3)];

/** [camera x, y, look x, y, look height] in feet — 23 keyframes, one every 1/22 of the scroll */
export const ELITE_KEYS: [number, number, number, number, number][] = [
  [9.0, 2.6, 3.5, 8.5, 1.0], //      0 living
  [10.8, 5.6, 3.0, 9.6, 1.0], //     1
  [13.6, 10.6, 19.0, 14.5, 1.1], //  2 towards the dining
  [17.6, 13.5, 21.5, 6.0, 1.1], //   3 turning to the kitchen
  [21.6, 12.2, 21.3, 2.0, 1.1], //   4
  [21.9, 9.2, 21.2, 0.5, 1.1], //    5 kitchen
  [21.4, 13.3, 14.0, 15.0, 1.2], //  6 back out
  [15.0, 13.6, 9.0, 15.5, 1.2], //   7
  [12.4, 14.9, 5.0, 16.5, 1.0], //   8 bedroom 1 door
  [9.4, 15.6, 3.5, 17.0, 0.9], //    9 bedroom 1
  [8.7, 18.2, 3.0, 15.5, 0.9], //   10
  [10.2, 15.2, 13.5, 20.0, 1.2], // 11 leaving
  [13.2, 16.5, 13.7, 26.0, 1.3], // 12 passage
  [13.7, 23.0, 13.7, 32.0, 1.3], // 13
  [13.5, 30.5, 9.0, 33.0, 1.1], //  14 towards bedroom 2
  [10.6, 32.2, 4.0, 33.5, 0.9], //  15 bedroom 2 doorway
  [13.4, 32.0, 18.0, 32.5, 1.2], // 16 turning to the master
  [17.6, 31.8, 26.0, 37.5, 1.0], // 17 master bedroom
  [19.6, 33.0, 26.5, 38.5, 1.0], // 18
  [15.2, 31.8, 13.7, 24.0, 1.3], // 19 back to the passage
  [13.7, 25.0, 15.5, 17.0, 1.3], // 20
  [14.4, 15.6, 20.5, 18.0, 1.2], // 21 dining
  [15.4, 14.9, 21.5, 18.4, 1.2], // 22
];

const flatTours: Record<string, FlatTourConfig> = {
  'elite-homes': {
    modelUrl: '/models/flat-premium.glb',
    plan: 'east',
    poster: '/images/ban a.png',
    scrollVh: 4500,
    camPath: ELITE_KEYS.map(([x, y]) => at(x, y)),
    lookPath: ELITE_KEYS.map(([, , lx, ly, h]) => at(lx, ly, h)),
    chapters: [
      { range: [0, 0.07], align: 'left', eyebrow: 'V Grand Infra · Koppolu, Ongole', title: 'Step inside Elite Homes.', text: 'Start in the living room — then scroll to walk every room of the flat.' },
      { range: [0.17, 0.25], align: 'right', eyebrow: '01 — Kitchen', title: 'Open to the living space.', text: 'The kitchen sits right beside the living and dining areas.' },
      { range: [0.375, 0.47], align: 'left', eyebrow: '02 — Bedroom', title: 'Room to rest.', text: 'Step through the door into the first bedroom.' },
      { range: [0.56, 0.695], align: 'right', eyebrow: '03 — Second bedroom', title: 'Down the passage.', text: 'The passage leads to the second bedroom and the master suite.' },
      { range: [0.755, 0.84], align: 'left', eyebrow: '04 — Master bedroom', title: 'The master suite.', text: 'A larger bedroom with its own attached bath.' },
      { range: [0.945, 1], align: 'center', eyebrow: '05 — Dining', title: 'Come see it in person.', text: 'Book a site visit and walk through Elite Homes for real.' },
    ],
    ctaLabel: 'Take the full walkthrough',
    ctaHref: '#walkthrough',
  },
};

export function getFlatTour(slug: string): FlatTourConfig | null {
  return flatTours[slug] ?? null;
}
