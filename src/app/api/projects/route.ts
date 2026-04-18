import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { uploadToStorage } from '@/lib/storage';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    
    // Validate Environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Critical: Supabase environment variables are missing on the server.' 
      }, { status: 500 });
    }

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

    const images = formData.getAll('images') as File[];
    const brochure = formData.get('brochure') as File | null;

    // 1. Upload Images to Supabase Storage
    const imageUrls = await Promise.all(
      images.map(async (img) => {
        return uploadToStorage(img, bucket, 'projects');
      })
    );

    // 2. Upload Brochure if exists
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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Project Creation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


export async function PUT(request: NextRequest) {
  try {
    const supabase = getAdminClient();

    // Validate Environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Critical: Supabase environment variables are missing on the server.' 
      }, { status: 500 });
    }

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

    // Handle Images - ONLY if new ones are uploaded
    const images = formData.getAll('images') as (File | string)[];
    const imageFiles = images.filter(img => img instanceof File) as File[];
    
    if (imageFiles.length > 0) {
      const imageUrls = await Promise.all(
        imageFiles.map(async (img) => {
          return uploadToStorage(img, bucket, 'projects');
        })
      );
      updateData.images = imageUrls;
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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Project Update Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const logFile = 'scratch/api_logs.txt';
  const timestamp = new Date().toISOString();
  
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      fs.appendFileSync(logFile, `[${timestamp}] DELETE ERROR: Missing env vars\n`);
      return NextResponse.json({ 
        error: 'Critical: Supabase environment variables are missing on the server.' 
      }, { status: 500 });
    }

    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');

    fs.appendFileSync(logFile, `[${timestamp}] DELETE REQUEST: id=${idStr}\n`);

    if (!idStr) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const id = isNaN(Number(idStr)) ? idStr : Number(idStr);

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      fs.appendFileSync(logFile, `[${timestamp}] DELETE DB ERROR: ${error.message}\n`);
      throw error;
    }

    if (!data || data.length === 0) {
      fs.appendFileSync(logFile, `[${timestamp}] DELETE NOT FOUND: id=${id}\n`);
      return NextResponse.json({ 
        success: false, 
        error: `No project found with ID: ${id}.` 
      }, { status: 404 });
    }

    fs.appendFileSync(logFile, `[${timestamp}] DELETE SUCCESS: id=${id}\n`);
    return NextResponse.json({ success: true, deleted: data[0] });
  } catch (error: any) {
    fs.appendFileSync(logFile, `[${timestamp}] DELETE EXCEPTION: ${error.message}\n`);
    console.error('Project Deletion Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
