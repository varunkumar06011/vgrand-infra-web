import type { ShiftKey, Vec } from '@/components/home/FlatScene';

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
 * Coordinates for the Elite Homes flat (x 0..9.4, z 0..14.4):
 *   living A(0-5, 0-3.8)  kitchen B(5.2-8, 0-3.8)  dining C(3.6-8, 3.8-7.5)
 *   bedroom 1 (0-3.4, 4-7.5)  bedroom 2 (0-3.4, 9.4-13.3)  master (5-9.4, 9.4-13.7)
 *   doors: bed1 z≈4.6 @x=3.5 · bed2 z≈10.1 @x=3.5 · master z≈10.1 @x=4.9
 */
export type FlatTourConfig = {
  modelUrl: string;
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

const flatTours: Record<string, FlatTourConfig> = {
  'elite-homes': {
    modelUrl: '/models/flat-premium.glb',
    poster: '/images/ban a.png',
    scrollVh: 4500,
    camPath: [
      [4.0, 1.6, 1.0],
      [3.3, 1.6, 1.8],
      [4.5, 1.6, 3.5],
      [6.5, 1.6, 3.3],
      [4.6, 1.6, 4.5],
      [3.4, 1.6, 4.55],
      [2.9, 1.6, 4.6],
      [4.0, 1.6, 5.0],
      [4.2, 1.6, 8.0],
      [3.9, 1.6, 10.06],
      [3.0, 1.6, 10.1],
      [4.4, 1.6, 10.1],
      [6.0, 1.6, 10.2],
      [4.4, 1.6, 8.4],
      [4.2, 1.65, 5.0],
      [4.1, 1.65, 4.0],
    ],
    lookPath: [
      [1.0, 1.0, 2.7],
      [0.8, 1.0, 3.2],
      [7.0, 1.1, 3.2],
      [7.0, 1.0, 0.5],
      [2.2, 1.2, 4.7],
      [1.2, 1.0, 5.0],
      [0.9, 0.9, 5.5],
      [4.2, 1.3, 9.0],
      [4.2, 1.3, 11.0],
      [1.0, 0.9, 10.6],
      [0.9, 0.9, 11.0],
      [8.0, 1.0, 11.2],
      [8.3, 1.0, 11.4],
      [4.5, 1.3, 5.0],
      [5.8, 1.2, 6.0],
      [6.4, 1.2, 6.4],
    ],
    chapters: [
      { range: [0, 0.1], align: 'left', eyebrow: 'V Grand Infra · Koppolu, Ongole', title: 'Step inside Elite Homes.', text: 'Start in the living room — then scroll to walk every room of the flat.' },
      { range: [0.12, 0.24], align: 'right', eyebrow: '01 — Kitchen', title: 'Open to the living space.', text: 'The kitchen sits right beside the living and dining areas.' },
      { range: [0.3, 0.42], align: 'left', eyebrow: '02 — Bedroom', title: 'Room to rest.', text: 'Step through the door into the first bedroom.' },
      { range: [0.56, 0.68], align: 'right', eyebrow: '03 — Second bedroom', title: 'Down the passage.', text: 'The passage leads to the second bedroom and the master suite.' },
      { range: [0.74, 0.86], align: 'left', eyebrow: '04 — Master bedroom', title: 'The master suite.', text: 'A larger bedroom with its own attached bath.' },
      { range: [0.93, 1], align: 'center', eyebrow: '05 — Dining', title: 'Come see it in person.', text: 'Book a site visit and walk through Elite Homes for real.' },
    ],
    ctaLabel: 'Take the full walkthrough',
    ctaHref: '#walkthrough',
  },
};

export function getFlatTour(slug: string): FlatTourConfig | null {
  return flatTours[slug] ?? null;
}
