import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json([]);
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Materials GET Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch materials.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();
    const body = await request.json();

    const { name, category, current_qty, total_qty, unit } = body;

    if (!name || !category || current_qty == null || total_qty == null || !unit) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('materials')
      .insert([{ name, category, current_qty, total_qty, unit }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Materials POST Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to add material.' },
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
    const { id, current_qty, total_qty } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (current_qty != null) updateData.current_qty = current_qty;
    if (total_qty != null) updateData.total_qty = total_qty;

    const { data, error } = await supabase
      .from('materials')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Materials PATCH Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update material.' },
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
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Materials DELETE Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to delete material.' },
      { status: 500 }
    );
  }
}
