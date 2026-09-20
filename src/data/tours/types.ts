/**
 * Data-driven virtual tour engine types.
 * One config per project slug lives in src/data/tours/<slug>.ts
 * and is registered in src/data/tours/index.ts.
 *
 * Display strings are NOT stored on scenes/links/hotspots — they live in
 * the per-language TourText maps (TourConfig.i18n). Config objects carry
 * only structure: geometry, targets and stable keys.
 */

export type SceneKind = 'photo' | 'pano';

/** UI language. 'te' strings are drafts until tour.telugu.reviewed = true. */
export type TourLang = 'en' | 'te';

/** A clickable arrow hotspot on a scene, pointing at another scene. */
export interface TourLink {
  /** % position of the arrow on the photo (0-100). */
  x: number;
  y: number;
  /** target scene id, or 'end' to jump to the end card */
  to: string;
}

export type HotspotKind = 'spec' | 'note';

/** A tappable dot that opens an info card. */
export interface TourHotspot {
  /** stable key — card text lives in i18n: text.scenes[sceneId].hotspots[key] */
  key: string;
  x: number;
  y: number;
  kind: HotspotKind;
  /** disabled hotspots stay in config but never render */
  enabled: boolean;
}

/** A room drawn on the SVG floor-plan minimap. Label lives in i18n.plan[id]. */
export interface PlanRoom {
  id: string;
  /** rect in viewBox units */
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ------------------------------------------------------------------ */
/* Phase 3 — scene variants (furnished/empty, day/evening)             */
/* ------------------------------------------------------------------ */

export type VariantGroup = 'furnishing' | 'lighting';

interface VariantBase {
  id: string;
  group: VariantGroup;
  /** label for the non-base state ("Furnished", "Evening") */
  label: string;
  /** same-origin image, same aspect ratio as the scene's base photo */
  src: string;
}

/**
 * A variant is either a REAL photo or a STAGED illustration.
 * 'staged' requires `stagedReason` so a staged image can never be
 * declared without acknowledging it, and the viewer always renders the
 * fixed staging badge for kind:'staged' (it is not configurable).
 */
export type SceneVariant =
  | (VariantBase & {
      kind: 'real';
      /** caption shown while displayed, e.g. "Evening lighting" */
      caption: string;
    })
  | (VariantBase & {
      kind: 'staged';
      /** why this is an illustration (AI render, mood mock, …) — required */
      stagedReason: string;
      caption?: string;
    });

export interface TourScene {
  id: string;
  /** position in the guided walk order */
  order: number;
  kind: SceneKind;
  /** full-size image, same-origin path under /public */
  src: string;
  /**
   * Portrait-oriented take of the same view — shown when the viewer is
   * taller than it is wide (phones in portrait). Falls back to `src`.
   */
  portraitSrc?: string;
  /** small thumbnail for menus/SEO list */
  thumb: string;
  /** initial focal point, % of photo (0-100) */
  focus: { x: number; y: number };
  /**
   * Compass bearing (degrees, 0=N clockwise) the camera faces.
   * Drives the minimap radar cone. For kind 'pano' this is the
   * north offset applied to the viewer.
   */
  heading: number;
  links: TourLink[];
  specHotspots: TourHotspot[];
  /** dot position on the minimap, viewBox units */
  minimap: { x: number; y: number };
  enabled: boolean;
  /** alternate renderings — absent/empty = no toggle, Phase-2 behaviour */
  variants?: SceneVariant[];
}

/* ------------------------------------------------------------------ */
/* Phase 3 — "view from your floor"                                    */
/* ------------------------------------------------------------------ */

export interface FloorViewEntry {
  /** actual floor number (e.g. 1–5) — never hardcode a count */
  floor: number;
  /** display label, e.g. "Floor 3" (translatable via ui.floorLabels) */
  label: string;
  src: string;
  alt: string;
}

export interface FloorViewsConfig {
  /** master gate — nothing renders until the photos are owner-verified */
  verified: boolean;
  /** compass direction the balcony faces, e.g. "West" */
  facing: string;
  /** "YYYY-MM" — month the photos were captured */
  capturedOn: string;
  floors: FloorViewEntry[];
}

/* ------------------------------------------------------------------ */
/* Phase 3 — guided tour / i18n                                        */
/* ------------------------------------------------------------------ */

export interface GuidedConfig {
  /**
   * Scene ids that have a narration file on disk, per language
   * (tour-source/audio/<lang>/<sceneId>.mp3 → public/.../audio/<lang>/).
   * The player only ever fetches listed scenes — missing audio = captions.
   */
  audio: Partial<Record<TourLang, string[]>>;
}

export interface TourSceneText {
  /** room name — menu, WhatsApp text, lead note, progress */
  room: string;
  /** short caption shown over the photo */
  title: string;
  /** vastu-style zone label, e.g. "South-East" — neutral wording only */
  zone: string;
  alt: string;
  /** guided-tour narration / caption, ~20–35 words, facts only */
  narration: string;
  /** walk-arrow labels keyed by target scene id ('end' = finish link) */
  links?: Record<string, string>;
  /** hotspot card text keyed by TourHotspot.key */
  hotspots?: Record<string, { title: string; body: string }>;
  /** translated variant labels keyed by variant id */
  variants?: Record<string, string>;
}

export interface TourUIStrings {
  dialogLabel: string;    // "Virtual tour" — project name is appended
  close: string;
  previous: string;       // "Previous: {room}"
  next: string;           // "Next: {room}"
  finishTour: string;
  goToRoom: string;       // "Go to {label}"
  zoomIn: string;
  zoomOut: string;
  gyroOn: string;
  gyroOff: string;
  floorPlan: string;
  fullscreen: string;
  replayGuide: string;
  openRoomList: string;
  roomsTitle: string;
  specTag: string;
  fitoutTag: string;
  closeCard: string;
  exit: string;
  planCaption: string;
  endHeading: string;     // top-bar heading on the end card
  endTitle: string;
  endSubtitle: string;
  chatWhatsApp: string;
  bookVisit: string;
  restartTour: string;
  guideTag: string;
  guideSkip: string;
  guideNext: string;
  guideDone: string;
  guideSteps: string[];
  chooserTitle: string;
  chooserSub: string;
  guidedTour: string;
  explore: string;
  play: string;
  pause: string;
  prevScene: string;
  nextScene: string;
  mute: string;
  unmute: string;
  captionsOn: string;
  captionsOff: string;
  stopExplore: string;
  guidedTag: string;
  sceneOf: string;        // "{a} of {b}"
  compare: string;
  compareSlider: string;  // slider aria-label
  exitCompare: string;
  variantBaseFurnishing: string;
  variantBaseLighting: string;
  stagedBadge: string;
  floorViews: string;
  facingChip: string;     // "{dir} facing"
  facingNames?: Record<string, string>; // "West" -> translated name
  capturedNote: string;   // "View captured {date}. Surroundings may change…"
  floorLabel: string;     // "Floor {n}"
  floorLabels?: Record<number, string>;
  floorAria: string;
  whatsappMessage: string; // {room} placeholder
  roomsViewed: string;    // "Rooms I viewed"
  posterCta: string;
  posterSub: string;
  posterAria: string;
  openAtRoom: string;     // "Open the tour at {room}"
}

export interface TourMetaText {
  flatLabel: string;
  area: string;
  facing: string;
  disclaimer: string;
}

export interface TourText {
  meta: TourMetaText;
  ui: TourUIStrings;
  /** minimap room labels keyed by PlanRoom.id */
  plan: Record<string, string>;
  scenes: Record<string, TourSceneText>;
}

/** Telugu text — every entry is a draft until a native speaker signs off. */
export type TeluguTourText = TourText & { needsNativeReview: true };

export interface TourConfig {
  slug: string;
  projectName: string;
  brochureUrl: string;
  poster: string;
  /** minimap viewBox size and room shapes */
  plan: { viewBox: { w: number; h: number }; rooms: PlanRoom[] };
  scenes: TourScene[];
  /** all display strings, keyed by language */
  i18n: {
    en: TourText;
    te?: TeluguTourText;
  };
  /** set true only after a native speaker approves the te strings */
  telugu?: { reviewed: boolean };
  guided?: GuidedConfig;
  floorViews?: FloorViewsConfig;
}
