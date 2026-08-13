import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';
import { rateLimit, rateLimitedResponse } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!rateLimit(request, 5, 60_000)) {
    return rateLimitedResponse();
  }

  try {
    const supabase = getAdminClient();
    const body = await request.json();

    const { name, email, phone, message, project, source } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 200 || email?.length > 200 || phone?.length > 20 || message?.length > 5000) {
      return NextResponse.json({ success: false, error: 'Input too long.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          message,
          project: project || 'Elite Homes',
          source: source || 'Web Form',
          status: 'New'
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Lead Submission Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to submit lead. Please try again.' },
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
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Lead Fetch Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch leads.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'ID and status are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ status: status.toLowerCase() })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Lead Update Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update lead.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (error: any) {
    console.error('Lead Deletion Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead.' },
      { status: 500 }
    );
  }
}
