import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Save Enquiry Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save enquiry' },
      { status: 500 }
    );
  }
}
