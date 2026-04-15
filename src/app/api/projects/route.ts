import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabaseAdmin';
import { v2 as cloudinary } from 'cloudinary';

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

    // 3. Save to Supabase
    const { data, error } = await supabase
      .from('projects')
      .insert([
        { 
          name, 
          type, 
          location, 
          status, 
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
