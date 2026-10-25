import type { ShiftKey, Vec } from '@/components/home/FlatScene';

export type FlatTourChapter = {
  /** scroll-progress window (0..1) in which this text is on screen */
  range: [number, number];
  align: 'left' | 'center' | 'right';
  eyebrow: string;
  title: string;
  text: string;
};

/** A colour scheme of one flat. Each colour is its own GLB, so switching loads that model. */
export type FlatTourColour = {
  id: string;
  label: string;
  modelUrl: string;
};

/** One facing of a flat (East, West, ...). Its path and chapters are tuned to its own layout. */
export type FlatTourVariant = {
  id: string;
  /** facing switch label */
  label: string;
  modelUrl: string;
  /** optional colour switch; when set, it replaces `modelUrl` */
  colours?: FlatTourColour[];
  /** overrides the GLB's light scale; for models that don't ship one in their scene extras */
  lightScale?: number;
  camPath: Vec[];
  lookPath: Vec[];
  shiftKeys?: ShiftKey[];
  chapters: FlatTourChapter[];
};

/**
 * Scroll-driven 3D flat intro shown at the top of a project page.
 * Keyframes are in model metres and are spread evenly over scroll progress.
 * The first variant is shown by default.
 */
export type FlatTourConfig = {
  /** shown until the 3D scene is ready */
  poster: string;
  scrollVh: number;
  variants: FlatTourVariant[];
  ctaLabel: string;
  ctaHref: string;
};

/*
 * Elite Homes east-facing flat coordinates (x 0..9.4, z 0..14.4):
 *   living A(0-5, 0-3.8)  kitchen B(5.2-8, 0-3.8)  dining C(3.6-8, 3.8-7.5)
 *   bedroom 1 (0-3.4, 4-7.5)  bedroom 2 (0-3.4, 9.4-13.3)  master (5-9.4, 9.4-13.7)
 *   doors: bed1 z≈4.6 @x=3.5 · bed2 z≈10.1 @x=3.5 · master z≈10.1 @x=4.9
 */

/*
 * West-facing flat (blue/earth GLBs share one layout, x -0.5..8.6, z -14..-0.5 in model metres).
 * Path = the designer's walkthrough route, simplified to its corners so it stays inside the rooms.
 * Chapters are placed by the waypoint index where the camera is in each room (42 waypoints).
 */
const WEST_BLUE = '/models/west-facing-blue.glb';
const WEST_EARTH = '/models/west-facing-earth.glb';

const flatTours: Record<string, FlatTourConfig> = {
  'elite-homes': {
    poster: '/images/ban a.png',
    scrollVh: 4500,
    ctaLabel: 'Take the full walkthrough',
    ctaHref: '#walkthrough',
    variants: [
      {
        id: 'east',
        label: 'East facing',
        modelUrl: '/models/flat-premium.glb',
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
      },
      {
        id: 'west',
        label: 'West facing',
        modelUrl: WEST_BLUE,
        colours: [
          { id: 'blue', label: 'Blue', modelUrl: WEST_BLUE },
          { id: 'earth', label: 'Earth', modelUrl: WEST_EARTH },
        ],
        lightScale: 0.005,
        camPath: [
          [0.85, 1.5, -0.5],
          [1.3, 1.5, -1],
          [3, 1.5, -1],
          [3.9, 1.5, -2.7],
          [4.4, 1.5, -5.2],
          [5.38, 1.5, -5.3],
          [5.5, 1.5, -4.2],
          [6.3, 1.5, -3.7],
          [6.2, 1.5, -1.2],
          [6.4, 1.5, -3.4],
          [7.35, 1.5, -4.3],
          [7.35, 1.5, -5.5],
          [7.32, 1.5, -4.3],
          [5.48, 1.5, -4.33],
          [4.5, 1.5, -5.5],
          [5.4, 1.5, -6.5],
          [4.3, 1.5, -7],
          [4.3, 1.5, -7.98],
          [5.5, 1.5, -8.5],
          [5.4, 1.5, -9.7],
          [7.35, 1.5, -8.8],
          [7.35, 1.5, -7.5],
          [7.35, 1.5, -8.78],
          [5.5, 1.5, -8.6],
          [4.3, 1.5, -7.4],
          [3, 1.5, -7.3],
          [1.03, 1.5, -6.01],
          [0.84, 1.5, -5.18],
          [1.8, 1.5, -4.7],
          [0.81, 1.5, -5.19],
          [0.8, 1.5, -5.88],
          [3, 1.5, -7.3],
          [4.3, 1.5, -8.8],
          [3.4, 1.5, -9.6],
          [3.3, 1.5, -11],
          [2.6, 1.5, -11.8],
          [0.7, 1.5, -12.8],
          [2.8, 1.5, -12.8],
          [3.3, 1.5, -12.2],
          [4.2, 1.5, -12],
          [7.4, 1.5, -12.7],
          [8.5, 1.5, -12.5],
        ],
        lookPath: [
          [2.32, 1.35, -2.14],
          [3.5, 1.35, -1],
          [4.03, 1.35, -2.94],
          [4.33, 1.35, -4.86],
          [6.59, 1.35, -5.42],
          [5.62, 1.35, -3.11],
          [7.37, 1.35, -3.03],
          [6.21, 1.35, -1.5],
          [6.4, 1.35, -3.39],
          [8, 1.35, -4.91],
          [7.35, 1.35, -6.5],
          [7.3, 1.35, -3.3],
          [5.12, 1.35, -4.33],
          [4.07, 1.35, -6.02],
          [5.97, 1.35, -7.14],
          [3.4, 1.35, -7.41],
          [4.3, 1.35, -9.2],
          [6.32, 1.35, -8.85],
          [5.32, 1.35, -10.69],
          [7.4, 1.35, -8.78],
          [7.35, 1.35, -6.6],
          [7.35, 1.35, -9.7],
          [5.16, 1.35, -8.57],
          [3.94, 1.35, -7.04],
          [2.11, 1.35, -7.23],
          [1.16, 1.35, -6.1],
          [0.53, 1.35, -3.87],
          [2.8, 1.35, -4.2],
          [-0.17, 1.35, -5.68],
          [0.77, 1.35, -7.39],
          [2.65, 1.35, -7.07],
          [4.44, 1.35, -8.96],
          [2.66, 1.35, -10.26],
          [3.24, 1.35, -11.79],
          [1.85, 1.35, -12.66],
          [0.65, 1.35, -12.82],
          [2.9, 1.35, -12.8],
          [4.21, 1.35, -11.11],
          [5.45, 1.35, -11.72],
          [6.35, 1.35, -12.47],
          [9.56, 1.35, -12.31],
          [10.66, 1.35, -12.11],
        ],
        chapters: [
          { range: [0, 0.07], align: 'left', eyebrow: 'V Grand Infra · West facing', title: 'Step inside the west-facing flat.', text: 'Enter through the front door into the living room — then scroll to walk every room.' },
          { range: [0.1, 0.26], align: 'right', eyebrow: '01 — Master bedroom', title: 'The master suite.', text: 'A spacious master bedroom with its own attached toilet, just off the living room.' },
          { range: [0.3, 0.4], align: 'left', eyebrow: '02 — Passage', title: 'Down the passage.', text: 'The passage leads to the bedrooms at the back of the flat.' },
          { range: [0.44, 0.56], align: 'right', eyebrow: '03 — Second bedroom', title: 'Room for the family.', text: 'The second bedroom has its own toilet close by.' },
          { range: [0.6, 0.72], align: 'left', eyebrow: '04 — Guest bedroom', title: 'A room for guests.', text: 'The guest bedroom has a toilet of its own, right next door.' },
          { range: [0.78, 0.86], align: 'right', eyebrow: '05 — Dining', title: 'Dine by the balcony.', text: 'The dining area sits right beside the balcony.' },
          { range: [0.88, 0.96], align: 'left', eyebrow: '06 — Kitchen & puja', title: 'Cook, then pray.', text: 'A kitchen with room for a fridge, and a puja room close by.' },
          { range: [0.96, 1], align: 'center', eyebrow: 'Next step', title: 'Come see it in person.', text: 'Book a site visit and walk through the west-facing flat for real.' },
        ],
      },
    ],
  },
};

export function getFlatTour(slug: string): FlatTourConfig | null {
  return flatTours[slug] ?? null;
}
