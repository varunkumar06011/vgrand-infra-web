import type {
  TourConfig,
  TourLang,
  TourText,
  TourSceneText,
  TourHotspot,
} from '@/data/tours';

/**
 * Tour text/language helpers — single place that knows how a TourConfig
 * resolves to display strings for a given language.
 */

export const TOUR_LANGS: TourLang[] = ['en', 'te'];
export const LANG_LABELS: Record<TourLang, string> = { en: 'EN', te: 'తెలుగు' };

const STORAGE_KEY = 'eliteTourLang';

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_PREVIEW = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';

/**
 * Language maps that are lazy-loaded per tour — functions can't live on
 * the serialized TourConfig prop, so the registry lives here in client
 * code. Keeps ~11 KB of Telugu out of the initial bundle.
 */
const LAZY_TEXT: Record<string, Partial<Record<TourLang, () => Promise<TourText>>>> = {
  'elite-homes': {
    te: () => import('@/data/tours/elite-homes.i18n.te').then((m) => m.eliteHomesTe as TourText),
  },
};

/** does this tour have te strings at all (inline or lazily loadable)? */
function hasTe(tour: TourConfig): boolean {
  return !!tour.i18n.te || !!LAZY_TEXT[tour.slug]?.te;
}

/** Telugu stays hidden in production until the strings are reviewed. */
export function teAvailable(tour: TourConfig): boolean {
  return hasTe(tour) && (!IS_PROD || IS_PREVIEW || tour.telugu?.reviewed === true);
}

export function availableLangs(tour: TourConfig): TourLang[] {
  return TOUR_LANGS.filter((l) => l === 'en' || (l === 'te' && teAvailable(tour)));
}

/**
 * Load a language map — resolves inline i18n entries instantly and
 * dynamic-imports lazily registered ones. Null when unavailable.
 */
export async function loadTourText(tour: TourConfig, lang: TourLang): Promise<TourText | null> {
  if (lang === 'en') return tour.i18n.en;
  const inline = lang === 'te' ? tour.i18n.te : undefined;
  if (inline) return inline;
  const loader = LAZY_TEXT[tour.slug]?.[lang];
  return loader ? loader() : null;
}

/** Resolve display text for a language, silently falling back to English. */
export function textFor(tour: TourConfig, lang: TourLang): TourText {
  const m = lang === 'te' ? tour.i18n.te : undefined;
  if (m && (lang !== 'te' || teAvailable(tour))) return m;
  return tour.i18n.en;
}

export function readStoredLang(tour: TourConfig): TourLang {
  try {
    const l = window.localStorage.getItem(STORAGE_KEY);
    if (l === 'te' && teAvailable(tour)) return 'te';
    if (l === 'en') return 'en';
  } catch {
    /* private mode */
  }
  return 'en';
}

export function storeLang(lang: TourLang): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode */
  }
}

export function sceneText(text: TourText, sceneId: string): TourSceneText | undefined {
  return text.scenes[sceneId];
}

export function hotspotText(
  text: TourText,
  sceneId: string,
  h: TourHotspot
): { title: string; body: string } {
  return (
    text.scenes[sceneId]?.hotspots?.[h.key] ?? {
      title: h.kind === 'spec' ? text.ui.specTag : text.ui.fitoutTag,
      body: '',
    }
  );
}

export function linkLabel(text: TourText, sceneId: string, to: string): string {
  return (
    text.scenes[sceneId]?.links?.[to] ??
    (to === 'end' ? text.ui.finishTour : text.scenes[to]?.room ?? to)
  );
}

/** "{a} of {b}" style template fill. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Cardinal facing string -> compass bearing (0=N clockwise). */
export function facingToHeading(facing: string): number {
  const f = facing.trim().toLowerCase().replace(/[\s_-]/g, '');
  const map: Record<string, number> = {
    n: 0, north: 0,
    nne: 22.5, ne: 45, northeast: 45,
    ene: 67.5, e: 90, east: 90,
    ese: 112.5, se: 135, southeast: 135,
    sse: 157.5, s: 180, south: 180,
    ssw: 202.5, sw: 225, southwest: 225,
    wsw: 247.5, w: 270, west: 270,
    wnw: 292.5, nw: 315, northwest: 315,
    nnw: 337.5,
  };
  return map[f] ?? 270;
}

/** "YYYY-MM" -> "September 2026" (localized). */
export function capturedMonthYear(capturedOn: string, lang: TourLang): string {
  const [y, m] = capturedOn.split('-').map((n) => parseInt(n, 10));
  if (!y || !m) return capturedOn;
  try {
    return new Intl.DateTimeFormat(lang === 'te' ? 'te-IN' : 'en-IN', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(y, m - 1, 1));
  } catch {
    return capturedOn;
  }
}

/**
 * Narration audio URL for a scene, or null when the config doesn't list
 * a file for this language — the player only ever fetches listed scenes.
 * Files live next to the scene images under audio/<lang>/<sceneId>.mp3.
 */
export function audioUrl(tour: TourConfig, lang: TourLang, sceneId: string): string | null {
  if (!tour.guided?.audio?.[lang]?.includes(sceneId)) return null;
  const base = tour.scenes[0]?.src ?? '';
  const dir = base.slice(0, base.lastIndexOf('/'));
  return `${dir}/audio/${lang}/${sceneId}.mp3`;
}

/** Fallback dwell time for a scene with no audio: max(4s, words / 2.5). */
export function captionDurationMs(narration: string): number {
  const words = narration.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(4000, Math.round((words / 2.5) * 1000));
}
