import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const { page_path, session_id } = body;

    // Simple insertion into site_visits table
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
    console.error('Visit Track Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getAdminClient();
  
  // Get count for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count, error } = await supabase
    .from('site_visits')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ total_visits_today: count });
}
