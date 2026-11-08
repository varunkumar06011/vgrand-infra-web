import { projects as staticProjects } from '@/data/projects';

/** Display order on the site. Anything not listed sorts after, in its original order. */
const PRIORITY = ['elite-homes', 'tripura', 'v-grand-healthcare', 'v-grand-gateway'];

/**
 * Normalises Supabase rows to the card shape and appends any project that exists in
 * src/data/projects.ts but has not been inserted into the DB yet (e.g. a newly added project).
 */
export function mergeProjects(dbProjects: any[] | null | undefined) {
  const fromDb = (dbProjects ?? []).map((p: any) => ({
    ...p,
    image: p.images?.[0] || p.image || '/images/ban a.png',
    startingPrice: p.starting_price || p.startingPrice || 'Contact for details',
    description: p.description || 'Premium residential project by V Grand Infra.',
  }));

  const have = new Set(fromDb.map((p: any) => p.slug));
  const missing = staticProjects
    .filter((p) => !have.has(p.slug) && (PRIORITY.includes(p.slug) || fromDb.length === 0))
    .map((p) => ({ ...p }));

  const rank = (slug: string) => {
    const i = PRIORITY.indexOf(slug);
    return i === -1 ? 99 : i;
  };

  return [...fromDb, ...missing].sort((a: any, b: any) => rank(a.slug) - rank(b.slug));
}
