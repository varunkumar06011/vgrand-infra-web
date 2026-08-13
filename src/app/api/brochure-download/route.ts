import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { rateLimit, rateLimitedResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 5, 60_000)) {
    return rateLimitedResponse();
  }

  try {
    const supabase = getAdminClient();
    const body = await request.json();

    const { name, email, phone, project } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    if (name.length > 200 || email?.length > 200 || phone.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Input too long.' },
        { status: 400 }
      );
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: 'Phone number must be exactly 10 digits' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          interested_flat: project || 'General',
          source: 'brochure_download',
          status: 'new',
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Brochure Download Lead Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to save lead. Please try again.' },
      { status: 500 }
    );
  }
}
