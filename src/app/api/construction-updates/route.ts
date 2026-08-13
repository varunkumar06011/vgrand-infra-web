import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { uploadToStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET /api/construction-updates?project_id=X
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('construction_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.message?.includes('column') && error.message?.includes('project_id')) {
        return NextResponse.json(
          { error: 'Database column construction_updates.project_id is missing. Run: ALTER TABLE construction_updates ADD COLUMN project_id BIGINT; ALTER TABLE construction_updates ADD CONSTRAINT construction_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[construction-updates] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/construction-updates  (multipart: project_id, label?, image file)
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const formData = await request.formData();

    const projectId = formData.get('project_id') as string;
    const label = (formData.get('label') as string) || '';
    const imageFile = formData.get('image') as File | null;

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }
    if (!imageFile) {
      return NextResponse.json({ error: 'image file is required' }, { status: 400 });
    }

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS || 'projects';
    const imageUrl = await uploadToStorage(imageFile, bucket, `construction-updates/project-${projectId}`);

    const { data, error } = await supabase
      .from('construction_updates')
      .insert([{ project_id: Number(projectId), image_url: imageUrl, label }])
      .select()
      .single();

    if (error) {
      if (error.message?.includes('column') && error.message?.includes('project_id')) {
        return NextResponse.json(
          { error: 'Database column construction_updates.project_id is missing. Run: ALTER TABLE construction_updates ADD COLUMN project_id BIGINT; ALTER TABLE construction_updates ADD CONSTRAINT construction_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;' },
          { status: 500 }
        );
      }
      throw error;
    }

    revalidatePath('/projects');
    revalidatePath('/');
    revalidatePath('/projects/[slug]', 'page');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[construction-updates] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/construction-updates?id=X
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('construction_updates')
      .delete()
      .eq('id', Number(idStr))
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: `No record found with id: ${idStr}` }, { status: 404 });
    }

    revalidatePath('/projects');
    revalidatePath('/');
    revalidatePath('/projects/[slug]', 'page');

    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (error: any) {
    console.error('[construction-updates] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
