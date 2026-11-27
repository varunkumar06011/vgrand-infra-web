import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { sourceFromRequest } from '@/lib/leadSource';

export const dynamic = 'force-dynamic';

/*
 * Click / event tracking for the public site (ClickTracker → lib/visitor.ts → here).
 *
 * Uses its own limiter on purpose: lib/rateLimit keeps ONE counter per IP for every route,
 * so counting clicks there would use up a visitor's allowance and block their contact form.
 */
const hits = new Map<string, { n: number; reset: number }>();
function allowed(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return true;
  }
  return ++h.n <= 120; // 120 events a minute per visitor is plenty for real clicking
}

const EVENT = /^[a-z0-9_]{2,40}$/;
const clip = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (!allowed(ip)) return new NextResponse(null, { status: 204 });

  try {
    const body = await request.json();
    const event = typeof body?.event === 'string' ? body.event : '';
    if (!EVENT.test(event)) return NextResponse.json({ success: false }, { status: 400 });

    const ua = request.headers.get('user-agent') || '';
    const src = sourceFromRequest(request);

    const { error } = await getAdminClient()
      .from('site_events')
      .insert([
        {
          event_type: event,
          label: clip(body.label, 120),
          href: clip(body.href, 300),
          page_path: clip(body.page, 200),
          session_id: clip(body.session, 64),
          device: /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
          utm_source: src.utm_source,
          utm_medium: src.utm_medium,
          utm_campaign: src.utm_campaign,
          referrer: src.referrer,
          landing_page: src.landing_page,
        },
      ]);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // tracking must never bother the visitor
    console.error('Track Error:', error instanceof Error ? error.message : (error as { message?: string })?.message);
    return new NextResponse(null, { status: 204 });
  }
}

/** Admin: counts of each event type and of visitor sources over the last N days (default 30). */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const days = Math.min(Math.max(Number(request.nextUrl.searchParams.get('days')) || 30, 1), 365);
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const { data, error } = await getAdminClient()
    .from('site_events')
    .select('event_type, utm_source, label')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);

  if (error) {
    console.error('Track Fetch Error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch events.' }, { status: 500 });
  }

  const count = (key: 'event_type' | 'utm_source') => {
    const m = new Map<string, number>();
    for (const r of data ?? []) {
      const k = (r[key] as string | null) || 'direct';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));
  };

  return NextResponse.json({ days, total: data?.length ?? 0, byEvent: count('event_type'), bySource: count('utm_source') });
}
