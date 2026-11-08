import { cache } from 'react';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { projects as staticProjects } from '@/data/projects';

/**
 * Loads one project for a detail page. Supabase is the source of truth; if the row is missing
 * (e.g. a newly added project not yet inserted) or the DB is unreachable, falls back to the
 * built-in data in src/data/projects.ts. Returns a normalised shape, or null if unknown.
 */
export const getProject = cache(async (slug: string) => {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('projects').select('*').eq('slug', slug).single();
    if (data && !error) {
      return {
        ...data,
        image: data.images?.[0] || '/images/ban a.png',
        startingPrice: data.starting_price || 'Contact for details',
        brochure: data.brochure_url || '',
        highlights: data.highlights || [],
        amenities: data.amenities || [],
        specs: data.specs || {},
        fromDb: true as const,
      };
    }
  } catch (err) {
    console.error(`getProject(${slug}): Supabase unavailable, trying static data`, err);
  }

  const s = staticProjects.find((p) => p.slug === slug);
  if (!s) return null;
  return {
    ...s,
    id: undefined as number | string | undefined,
    images: [s.image],
    brochure: s.brochure || '',
    fromDb: false as const,
  };
});
