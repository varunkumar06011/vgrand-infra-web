/**
 * Data-driven virtual tour engine types.
 * One config per project slug lives in src/data/tours/<slug>.ts
 * and is registered in src/data/tours/index.ts.
 */

export type SceneKind = 'photo' | 'pano';

/** A clickable arrow hotspot on a scene, pointing at another scene. */
export interface TourLink {
  /** % position of the arrow on the photo (0-100). */
  x: number;
  y: number;
  /** target scene id, or 'end' to jump to the end card */
  to: string;
  label: string;
}

export type HotspotKind = 'spec' | 'note';

/** A tappable dot that opens an info card. */
export interface TourHotspot {
  x: number;
  y: number;
  kind: HotspotKind;
  title: string;
  body: string;
  /** disabled hotspots stay in config but never render */
  enabled: boolean;
}

/** A room drawn on the SVG floor-plan minimap. */
export interface PlanRoom {
  id: string;
  label: string;
  /** rect in viewBox units */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TourScene {
  id: string;
  /** position in the guided walk order */
  order: number;
  /** room name used in menu, WhatsApp text and lead note */
  room: string;
  /** short caption shown over the photo */
  title: string;
  kind: SceneKind;
  /** full-size image, same-origin path under /public */
  src: string;
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
  /** vastu-style zone label, e.g. "South-East" — neutral wording only */
  zone: string;
  enabled: boolean;
  alt: string;
}

export interface TourConfig {
  slug: string;
  projectName: string;
  flatLabel: string;
  /** e.g. "1,771 sq ft" */
  area: string;
  /** facing label e.g. "East facing" */
  facing: string;
  brochureUrl: string;
  poster: string;
  /** {room} is replaced with the current room name */
  whatsappMessage: string;
  disclaimer: string;
  /** minimap viewBox size and room shapes */
  plan: { viewBox: { w: number; h: number }; rooms: PlanRoom[] };
  scenes: TourScene[];
}
