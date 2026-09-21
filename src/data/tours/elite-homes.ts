import type { TourConfig } from './types';
import { eliteHomesEn } from './elite-homes.i18n';

const IMG = '/tour/elite-3bhk';

/**
 * Elite Homes — sample 3 BHK flat walkthrough (East-facing plan, 1,771 sq ft).
 *
 * Plan orientation (from brochure): entry at TOP = East,
 * so top=E, right=S, bottom=W, left=N.
 *
 * `heading` values are best-guess camera bearings — verify on site and
 * fix with the Shift+click helper / by editing the numbers below.
 * specHotspots with enabled:false are disabled pending owner confirmation.
 *
 * Display strings (room names, titles, hotspot cards, UI labels, narration)
 * live in elite-homes.i18n.ts — this file carries structure only.
 */
const eliteHomesTour: TourConfig = {
  slug: 'elite-homes',
  projectName: 'Elite Homes',
  brochureUrl: '/brochures/elite-homes-brochure.pdf',
  poster: `${IMG}/hall.webp`,

  /* --------------------------------------------------------------
   * Phase 3 feature gates — everything is invisible until the
   * matching assets exist AND the flag says so.
   * --------------------------------------------------------------
   * Variants: add entries to a scene's `variants` after running
   *   tour-source/variants/<sceneId>.<variantId>.<ext> through
   *   `npm run tour:images`. kind:'staged' requires stagedReason and
   *   always renders the fixed "virtual staging" badge.
   * floorViews: real balcony photos per floor — shows only when
   *   verified:true AND >= 2 floors. facing is the balcony direction:
   *   the bedroom-3 balcony sits on the BOTTOM edge of this East plan
   *   = West (the dining balcony on the right edge would be South —
   *   confirm which balcony the photos are taken from).
   * guided.audio: list scene ids that have
   *   public/tour/elite-3bhk/audio/<lang>/<sceneId>.mp3 on disk.
   * telugu.reviewed: keeps the తెలుగు switch hidden in production
   *   until a native speaker approves the te strings (always visible
   *   in dev / preview builds).
   */

  telugu: { reviewed: false },

  guided: {
    audio: { en: [], te: [] },
  },

  floorViews: {
    verified: false,
    facing: 'West',
    capturedOn: '',
    floors: [],
  },

  // en only — the te map is lazy-loaded by tourText.ts when picked
  i18n: { en: eliteHomesEn },

  plan: {
    viewBox: { w: 100, h: 140 },
    rooms: [
      { id: 'living', x: 6, y: 4, w: 42, h: 46 },
      { id: 'kitchen', x: 60, y: 4, w: 20, h: 34 },
      { id: 'puja', x: 60, y: 38, w: 20, h: 12 },
      { id: 'service-balcony', x: 80, y: 4, w: 16, h: 22 },
      { id: 'bedroom-1', x: 6, y: 50, w: 24, h: 30 },
      { id: 'dining', x: 30, y: 50, w: 50, h: 30 },
      { id: 'balcony', x: 80, y: 40, w: 16, h: 30 },
      { id: 'toilet-1', x: 6, y: 80, w: 24, h: 15 },
      { id: 'toilet-2', x: 45, y: 80, w: 35, h: 15 },
      { id: 'bedroom-2', x: 6, y: 95, w: 32, h: 35 },
      { id: 'balcony-3ft', x: 6, y: 130, w: 14, h: 10 },
      { id: 'toilet-3', x: 38, y: 95, w: 14, h: 15 },
      { id: 'master', x: 52, y: 88, w: 44, h: 48 },
    ],
  },

  scenes: [
    {
      id: 'entrance',
      order: 1,
      kind: 'photo',
      src: `${IMG}/entrance.webp`,
      portraitSrc: `${IMG}/entrance-portrait.webp`,
      thumb: `${IMG}/entrance-thumb.webp`,
      focus: { x: 50, y: 45 },
      heading: 265,
      links: [{ x: 58, y: 52, to: 'hall' }],
      specHotspots: [
        { key: 'feature-wall', x: 47, y: 48, kind: 'note', enabled: true },
      ],
      minimap: { x: 33, y: 11 },
      enabled: true,
      variants: [],
    },
    {
      id: 'hall',
      order: 2,
      kind: 'photo',
      src: `${IMG}/hall.webp`,
      portraitSrc: `${IMG}/hall-portrait.webp`,
      thumb: `${IMG}/hall-thumb.webp`,
      focus: { x: 55, y: 48 },
      heading: 10,
      links: [{ x: 85, y: 55, to: 'dining' }],
      specHotspots: [
        { key: 'flooring', x: 50, y: 88, kind: 'spec', enabled: true },
        { key: 'tv-wall', x: 55, y: 50, kind: 'note', enabled: true },
        { key: 'ceiling', x: 38, y: 12, kind: 'note', enabled: true },
      ],
      minimap: { x: 24, y: 30 },
      enabled: true,
      variants: [],
    },
    {
      id: 'dining',
      order: 3,
      kind: 'photo',
      src: `${IMG}/dining.webp`,
      portraitSrc: `${IMG}/dining-portrait.webp`,
      thumb: `${IMG}/dining-thumb.webp`,
      focus: { x: 48, y: 50 },
      heading: 175,
      links: [
        { x: 20, y: 52, to: 'balcony-view' },
        { x: 87, y: 50, to: 'kitchen-a' },
      ],
      specHotspots: [
        { key: 'flooring', x: 45, y: 90, kind: 'spec', enabled: true },
        { key: 'sideboard', x: 45, y: 58, kind: 'note', enabled: true },
      ],
      minimap: { x: 55, y: 65 },
      enabled: true,
      variants: [],
    },
    {
      id: 'kitchen-a',
      order: 4,
      kind: 'photo',
      src: `${IMG}/kitchen-a.webp`,
      portraitSrc: `${IMG}/kitchen-a-portrait.webp`,
      thumb: `${IMG}/kitchen-a-thumb.webp`,
      focus: { x: 42, y: 50 },
      heading: 140,
      links: [
        { x: 35, y: 60, to: 'kitchen-b' },
        { x: 82, y: 55, to: 'dining' },
      ],
      specHotspots: [
        { key: 'flooring', x: 50, y: 90, kind: 'spec', enabled: true },
        { key: 'kitchen-fitout', x: 35, y: 35, kind: 'note', enabled: true },
      ],
      minimap: { x: 66, y: 14 },
      enabled: true,
      variants: [],
    },
    {
      id: 'kitchen-b',
      order: 5,
      kind: 'photo',
      src: `${IMG}/kitchen-b.webp`,
      portraitSrc: `${IMG}/kitchen-b-portrait.webp`,
      thumb: `${IMG}/kitchen-b-thumb.webp`,
      focus: { x: 50, y: 50 },
      heading: 155,
      links: [{ x: 55, y: 72, to: 'kitchen-a' }],
      specHotspots: [
        // DISABLED pending owner confirmation: brochure says "full body
        // quartz stone top with steel sink" but the photos show a dark
        // stone that looks like granite, and the DB seed says granite.
        { key: 'platform', x: 52, y: 58, kind: 'spec', enabled: false },
        // DISABLED pending owner confirmation: brochure says glazed tile
        // dado up to 2' above the platform.
        { key: 'dado', x: 50, y: 34, kind: 'spec', enabled: false },
        { key: 'kitchen-fitout', x: 42, y: 30, kind: 'note', enabled: true },
      ],
      minimap: { x: 73, y: 28 },
      enabled: true,
      variants: [],
    },
    {
      id: 'bedroom-1',
      order: 6,
      kind: 'photo',
      src: `${IMG}/bedroom-1.webp`,
      portraitSrc: `${IMG}/bedroom-1-portrait.webp`,
      thumb: `${IMG}/bedroom-1-thumb.webp`,
      focus: { x: 50, y: 45 },
      heading: 40,
      links: [{ x: 52, y: 55, to: 'hall' }],
      specHotspots: [
        { key: 'flooring', x: 55, y: 88, kind: 'spec', enabled: true },
        { key: 'wardrobe', x: 28, y: 48, kind: 'note', enabled: true },
      ],
      minimap: { x: 18, y: 65 },
      enabled: true,
      variants: [],
    },
    {
      id: 'master-bedroom',
      order: 7,
      kind: 'photo',
      src: `${IMG}/master-bedroom.webp`,
      portraitSrc: `${IMG}/master-bedroom-portrait.webp`,
      thumb: `${IMG}/master-bedroom-thumb.webp`,
      focus: { x: 50, y: 45 },
      heading: 195,
      links: [],
      specHotspots: [
        { key: 'flooring', x: 58, y: 90, kind: 'spec', enabled: true },
        { key: 'windows', x: 66, y: 45, kind: 'spec', enabled: true },
        { key: 'wardrobe-niche', x: 36, y: 48, kind: 'note', enabled: true },
      ],
      minimap: { x: 74, y: 112 },
      enabled: true,
      variants: [],
    },
    {
      id: 'bedroom-3-balcony',
      order: 8,
      kind: 'photo',
      src: `${IMG}/bedroom-3-balcony.webp`,
      portraitSrc: `${IMG}/bedroom-3-balcony-portrait.webp`,
      thumb: `${IMG}/bedroom-3-balcony-thumb.webp`,
      focus: { x: 55, y: 45 },
      heading: 250,
      links: [{ x: 72, y: 55, to: 'balcony-view' }],
      specHotspots: [
        { key: 'flooring', x: 50, y: 90, kind: 'spec', enabled: true },
        { key: 'wardrobe', x: 26, y: 48, kind: 'note', enabled: true },
      ],
      minimap: { x: 20, y: 112 },
      enabled: true,
      variants: [],
    },
    {
      id: 'balcony-view',
      order: 9,
      kind: 'photo',
      src: `${IMG}/balcony-view.webp`,
      portraitSrc: `${IMG}/balcony-view-portrait.webp`,
      thumb: `${IMG}/balcony-view-thumb.webp`,
      focus: { x: 50, y: 50 },
      heading: 175,
      links: [{ x: 14, y: 60, to: 'dining' }],
      specHotspots: [],
      minimap: { x: 88, y: 55 },
      enabled: true,
      variants: [],
    },
    {
      id: 'puja',
      order: 10,
      kind: 'photo',
      src: `${IMG}/puja.webp`,
      portraitSrc: `${IMG}/puja-portrait.webp`,
      thumb: `${IMG}/puja-thumb.webp`,
      focus: { x: 55, y: 45 },
      heading: 85,
      links: [{ x: 50, y: 70, to: 'end' }],
      specHotspots: [
        { key: 'puja-unit', x: 45, y: 45, kind: 'note', enabled: true },
        { key: 'door', x: 78, y: 50, kind: 'spec', enabled: true },
        { key: 'windows', x: 15, y: 45, kind: 'spec', enabled: true },
      ],
      minimap: { x: 70, y: 44 },
      enabled: true,
      variants: [],
    },
  ],
};

export default eliteHomesTour;
