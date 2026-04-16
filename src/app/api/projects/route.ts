import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

export const dynamic = 'force-dynamic';

// Helper to init Cloudinary
const initCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

export async function POST(request: NextRequest) {
  try {
    initCloudinary();
    const supabase = getAdminClient();
    const formData = await request.formData();

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

    // 1. Upload Images to Cloudinary
    const imageUrls = await Promise.all(
      images.map(async (img) => {
        const buffer = Buffer.from(await img.arrayBuffer());
        return new Promise<string>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'vgrand/projects' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          ).end(buffer);
        });
      })
    );

    // 2. Upload Brochure if exists
    let brochureUrl = '';
    if (brochure) {
      if (typeof brochure === 'string') {
        brochureUrl = brochure;
      } else {
        const buffer = Buffer.from(await brochure.arrayBuffer());
        brochureUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'vgrand/brochures', resource_type: 'raw' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result!.secure_url);
            }
          ).end(buffer);
        });
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
