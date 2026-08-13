import { getAdminClient } from './supabaseAdmin';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export const uploadToStorage = async (
  file: File,
  bucket: string,
  folder: string = ''
): Promise<string> => {
  // Validate file type
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
    throw new Error(`File type "${fileExt}" is not allowed. Permitted: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`MIME type "${file.type}" is not allowed.`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the 20 MB limit.`);
  }

  const supabase = getAdminClient();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const buffer = await file.arrayBuffer();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrl;
};
