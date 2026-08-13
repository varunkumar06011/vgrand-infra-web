import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { rateLimit, rateLimitedResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 30, 60_000)) {
    return rateLimitedResponse();
  }

  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const { page_path, session_id } = body;

    const { error } = await supabase
      .from('site_visits')
      .insert([
        { 
          page_path: page_path || '/',
          session_id: session_id 
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Visit Track Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to track visit.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  const supabase = getAdminClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('site_visits')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  if (error) {
    console.error('Visit Count Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch visit count.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ total_visits_today: count });
}
