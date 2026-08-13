import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { uploadToStorage } from '@/lib/storage';
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();

    const formData = await request.formData();
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS || 'projects';

    // Extract metadata
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const location = formData.get('location') as string;
    const status = formData.get('status') as string;
    const description = formData.get('description') as string;
    const area = formData.get('area') as string;
    const handover = formData.get('handover') as string;
    const starting_price = formData.get('starting_price') as string;
    const rera = formData.get('rera') as string;
    
    // Parse JSON/Arrays
    const highlights = JSON.parse(formData.get('highlights') as string || '[]');
    const amenities = JSON.parse(formData.get('amenities') as string || '[]');
    const specs = JSON.parse(formData.get('specs') as string || '{}');

    // Auto-generate slug if missing
    const slug = (formData.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const images = formData.getAll('images') as (File | string)[];
    const brochure = formData.get('brochure') as File | string | null;

    // Separate uploaded files from existing URL strings
    const imageFiles = images.filter(img => img instanceof File) as File[];
    let imageUrls: string[] = [];
    images.filter(img => typeof img === 'string').forEach((str) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) imageUrls.push(...parsed);
        else imageUrls.push(str);
      } catch {
        imageUrls.push(str);
      }
    });

    // 1. Upload new Images to Supabase Storage
    if (imageFiles.length > 0) {
      const uploadedUrls = await Promise.all(
        imageFiles.map(async (img) => uploadToStorage(img, bucket, 'projects'))
      );
      imageUrls.push(...uploadedUrls);
    }

    // 2. Upload Brochure if new file provided, otherwise accept string URL
    let brochureUrl = '';
    if (brochure) {
      if (typeof brochure === 'string') {
        brochureUrl = brochure;
      } else {
        brochureUrl = await uploadToStorage(brochure, bucket, 'brochures');
      }
    }

    // 3. Save to Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name,
          slug,
          type,
          location,
          status,
          description,
          area,
          handover,
          starting_price,
          rera,
          highlights,
          amenities,
          specs,
          images: imageUrls,
          brochure_url: brochureUrl
        }
      ])
      .select();

    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Project Creation Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to create project. Please try again.' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const supabase = getAdminClient();

    const formData = await request.formData();
    
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_PROJECTS || 'projects';

    const idStr = formData.get('id') as string;
    if (!idStr) return NextResponse.json({ error: 'Project ID is required for update' }, { status: 400 });
    const id = isNaN(Number(idStr)) ? idStr : Number(idStr);

    // Extract metadata
    const updateData: any = {};
    
    if (formData.has('name')) updateData.name = formData.get('name');
    if (formData.has('type')) updateData.type = formData.get('type');
    if (formData.has('location')) updateData.location = formData.get('location');
    if (formData.has('status')) updateData.status = formData.get('status');
    if (formData.has('description')) updateData.description = formData.get('description');
    if (formData.has('area')) updateData.area = formData.get('area');
    if (formData.has('handover')) updateData.handover = formData.get('handover');
    if (formData.has('starting_price')) updateData.starting_price = formData.get('starting_price');
    if (formData.has('rera')) updateData.rera = formData.get('rera');
    
    if (formData.has('highlights')) updateData.highlights = JSON.parse(formData.get('highlights') as string);
    if (formData.has('amenities')) updateData.amenities = JSON.parse(formData.get('amenities') as string);
    if (formData.has('specs')) updateData.specs = JSON.parse(formData.get('specs') as string);

    // Handle slug
    if (formData.has('name')) {
      updateData.slug = formData.get('name')?.toString().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    // Handle Images - accept both File uploads and JSON string arrays of existing URLs
    const images = formData.getAll('images') as (File | string)[];
    const imageFiles = images.filter(img => img instanceof File) as File[];
    let existingUrls: string[] = [];

    images.filter(img => typeof img === 'string').forEach((str) => {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) existingUrls.push(...parsed);
        else existingUrls.push(str);
      } catch {
        existingUrls.push(str);
      }
    });

    if (imageFiles.length > 0 || existingUrls.length > 0) {
      const uploadedUrls = imageFiles.length > 0
        ? await Promise.all(imageFiles.map(async (img) => uploadToStorage(img, bucket, 'projects')))
        : [];
      updateData.images = [...existingUrls, ...uploadedUrls];
    }

    // Handle Brochure - ONLY if a new one is uploaded
    const brochure = formData.get('brochure');
    if (brochure && brochure instanceof File) {
      const brochureUrl = await uploadToStorage(brochure, bucket, 'brochures');
      updateData.brochure_url = brochureUrl;
    }

    // Update in Supabase
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/');

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Project Update Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update project. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Project Fetch Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch projects.' },
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
    const idStr = searchParams.get('id');

    if (!idStr) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const id = isNaN(Number(idStr)) ? idStr : Number(idStr);

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Project not found.' 
      }, { status: 404 });
    }

    revalidatePath('/projects');
    revalidatePath('/');

    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (error: any) {
    console.error('Project Deletion Error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Failed to delete project.' },
      { status: 500 }
    );
  }
}
