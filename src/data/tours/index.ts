import type { TourConfig } from './types';
import eliteHomesTour from './elite-homes';

const tours: Record<string, TourConfig> = {
  'elite-homes': eliteHomesTour,
};

export function getTour(slug: string): TourConfig | null {
  return tours[slug] ?? null;
}

/** V Grand Gateway has the flat3d walkthrough built straight from its floor plan, without a tour config */
export const GATEWAY_SLUG = 'v-grand-gateway';

/** does this project's page have a 3D flat walkthrough? */
export function hasWalkthrough(slug: string): boolean {
  return !!getTour(slug) || slug === GATEWAY_SLUG;
}

export type {
  TourConfig,
  TourScene,
  TourLink,
  TourHotspot,
  PlanRoom,
  TourLang,
  TourText,
  TourSceneText,
  TourUIStrings,
  SceneVariant,
  VariantGroup,
  FloorViewsConfig,
  FloorViewEntry,
  GuidedConfig,
} from './types';
