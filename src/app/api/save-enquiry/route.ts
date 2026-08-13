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

    const { name, phone, interested_flat, source } = body;

    // Validation
    if (!name || !phone || !interested_flat) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (name.length > 200 || phone.length > 20 || interested_flat.length > 200) {
      return NextResponse.json(
        { success: false, error: 'Input too long.' },
        { status: 400 }
      );
    }

    // Phone validation (10 digits)
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
          phone,
          interested_flat,
          source: source || 'enquire_now',
          status: 'new'
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Save Enquiry Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to save enquiry. Please try again.' },
      { status: 500 }
    );
  }
}
