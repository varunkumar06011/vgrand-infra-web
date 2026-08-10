import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await request.json();

    const { accepted_terms, accepted_privacy, accepted_contact } = body;

    if (accepted_terms === undefined || accepted_privacy === undefined || accepted_contact === undefined) {
      return NextResponse.json(
        { success: false, error: 'All consent fields are required' },
        { status: 400 }
      );
    }

    const ip_address =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const user_agent = request.headers.get('user-agent') || null;

    const page_url = request.headers.get('referer') || null;

    const { data, error } = await supabase
      .from('consent_logs')
      .insert([
        {
          accepted_terms,
          accepted_privacy,
          accepted_contact,
          ip_address,
          user_agent,
          page_url,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Consent Log Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to log consent' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Consent Log Fetch Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch consent logs' },
      { status: 500 }
    );
  }
}
