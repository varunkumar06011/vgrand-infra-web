import type { TourConfig } from './types';
import eliteHomesTour from './elite-homes';

const tours: Record<string, TourConfig> = {
  'elite-homes': eliteHomesTour,
};

export function getTour(slug: string): TourConfig | null {
  return tours[slug] ?? null;
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
