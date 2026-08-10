import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    if (error) {
      console.error('Supabase Error:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Brochure Download Lead Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save lead' },
      { status: 500 }
    );
  }
}
