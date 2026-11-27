import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { insertWithSource, sourceFromRequest } from '@/lib/leadSource';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { rateLimit, rateLimitedResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 10, 60_000)) {
    return rateLimitedResponse();
  }

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

    // Optional mobile number, kept only when the visitor ticked "contact me" and typed it in.
    const phone =
      accepted_contact === true && typeof body.phone === 'string' && /^[6-9]\d{9}$/.test(body.phone) ? body.phone : null;
    const consent_text =
      accepted_contact === true && typeof body.consent_text === 'string' ? body.consent_text.slice(0, 500) : null;
    const src = sourceFromRequest(request);

    const { data, error } = await insertWithSource(
      supabase,
      'consent_logs',
      {
        accepted_terms,
        accepted_privacy,
        accepted_contact,
        ip_address,
        user_agent,
        page_url,
      },
      { phone, consent_text, utm_source: src.utm_source }
    );

    if (error) throw error;

    // A number given with consent is a lead: it shows up in Admin → Leads for the sales team.
    if (phone) {
      const lead = await insertWithSource(
        supabase,
        'leads',
        {
          name: 'Website visitor',
          phone,
          message: `Shared their number in the consent pop-up and agreed: "${consent_text ?? 'contact by call, SMS, WhatsApp and email'}"`,
          project: 'General',
          source: 'consent_popup',
          status: 'New',
        },
        src
      );
      if (lead.error) console.error('Consent Lead Error:', lead.error.message);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Consent Log Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to log consent.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('consent_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Consent Log Fetch Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch consent logs.' },
      { status: 500 }
    );
  }
}
