import 'dotenv/config';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const BUCKET_NAME = 'valuations';

/**
 * Uploads a file buffer directly to Supabase Storage and returns its public URL
 */
export const uploadToSupabase = async (fileBuffer, originalName, mimeType, folder = 'general') => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials not configured in .env file.');
  }

  // 1. Determine clean extension
  let fileExt = 'jpg';
  if (originalName && originalName.includes('.')) {
    const rawExt = path.extname(originalName).replace('.', '').toLowerCase().trim();
    if (rawExt && rawExt.length <= 5) {
      fileExt = rawExt;
    }
  } else if (mimeType && mimeType.includes('/')) {
    fileExt = mimeType.split('/')[1].split(';')[0].toLowerCase().trim();
  }

  // Normalize common types
  if (fileExt === 'jpeg') fileExt = 'jpg';

  // 2. Generate a flat, clean filename (avoid subfolder slashes that trigger "Invalid path")
  const prefix = String(folder).replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'img';
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const cleanFileName = `${prefix}-${timestamp}-${randomSuffix}.${fileExt}`;

  // 3. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(cleanFileName, fileBuffer, {
      contentType: mimeType || 'image/jpeg',
      upsert: true
    });

  if (error) {
    console.error('Supabase raw error details:', error);
    throw new Error(`Supabase Storage upload error: ${error.message}`);
  }

  // 4. Retrieve permanent public URL
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(cleanFileName);

  return publicUrlData.publicUrl;
};