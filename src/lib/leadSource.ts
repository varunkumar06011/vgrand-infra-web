import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const SOURCE_COOKIE = 'vg_src'; // same name as lib/visitor.ts (client)

export type SourceFields = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer: string | null;
  landing_page: string | null;
};

const clip = (v: unknown, n: number): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);

/** Where this visitor first came from, read from the cookie set by ClickTracker. */
export function sourceFromRequest(request: NextRequest): SourceFields {
  const empty: SourceFields = { utm_source: null, utm_medium: null, utm_campaign: null, referrer: null, landing_page: null };
  const raw = request.cookies.get(SOURCE_COOKIE)?.value;
  if (!raw) return empty;
  try {
    const s = JSON.parse(decodeURIComponent(raw));
    return {
      utm_source: clip(s.s, 60),
      utm_medium: clip(s.m, 60),
      utm_campaign: clip(s.c, 100),
      referrer: clip(s.r, 120),
      landing_page: clip(s.l, 120),
    };
  } catch {
    return empty;
  }
}

/** Postgres "undefined column" — the migration in supabase_lead_tracking.sql hasn't been run yet. */
const missingColumn = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === '42703' || e.code === 'PGRST204' || /column .* does not exist|Could not find the .* column/i.test(e.message || ''));

/**
 * Insert into `table` with the visitor-source columns added. If the database doesn't have those
 * columns yet, insert again without them, so no lead is ever lost because of tracking.
 */
export async function insertWithSource<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  row: T,
  extra: Record<string, unknown>,
) {
  const first = await supabase.from(table).insert([{ ...row, ...extra }]).select();
  if (!missingColumn(first.error)) return first;
  console.warn(`[${table}] tracking columns missing; run supabase_lead_tracking.sql. Saving without them.`);
  return supabase.from(table).insert([row]).select();
}
