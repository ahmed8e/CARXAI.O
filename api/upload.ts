// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import busboy from 'busboy';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'crypto';
import { logger } from './utils/logger';
import { assertRateLimit } from './utils/rate-limit';

export const config = {
  api: {
    bodyParser: false, // Disables Vercel's default body parser so busboy can handle the stream
  },
};

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth processing
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn({ event: 'upload_unauthorized_missing_header' });
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  // Use Service Role Key because we are securely uploading into a private user folder 
  // bypassing client-side RLS which simplifies bucket setup.
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error({ event: 'upload_config_error', details: 'Missing Supabase vars' });
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    logger.warn({ event: 'upload_unauthorized_invalid_token' });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Rate Limiting
  const identifier = user.id;
  const rateLimitStatus = await assertRateLimit(identifier, 'upload', 5, '1 m');
  
  if (!rateLimitStatus.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
  }

  // Multipart parsing
  return new Promise((resolve) => {
    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
    } catch (err) {
      logger.error({ event: 'upload_busboy_init_fail' }, err);
      return res.status(400).json({ error: 'Invalid content type' });
    }

    let fileBuffer: Buffer | null = null;
    let fileTooLarge = false;

    bb.on('file', (name, file, info) => {
      const chunks: Buffer[] = [];
      file.on('data', (data) => {
        chunks.push(data);
      });
      file.on('limit', () => {
        fileTooLarge = true;
      });
      file.on('end', () => {
        if (!fileTooLarge) {
            fileBuffer = Buffer.concat(chunks);
        }
      });
    });

    bb.on('close', async () => {
      if (fileTooLarge) {
        logger.warn({ event: 'upload_rejected_size', userId: user.id });
        return resolve(res.status(413).json({ error: 'File size exceeds 5MB limit' }));
      }

      if (!fileBuffer) {
        logger.warn({ event: 'upload_rejected_no_file', userId: user.id });
        return resolve(res.status(400).json({ error: 'No file uploaded' }));
      }

      // Check Magic Mime Type Server-side (Ignores extension spoofing)
      let fileType;
      try {
        fileType = await fileTypeFromBuffer(fileBuffer);
      } catch (e) {
        logger.error({ event: 'upload_filetype_check_failed', userId: user.id }, e);
        return resolve(res.status(500).json({ error: 'Internal server error checking file' }));
      }

      if (!fileType || !ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        logger.warn({ 
            event: 'upload_rejected_invalid_mime', 
            userId: user.id, 
            detectedType: fileType?.mime || 'unknown' 
        });
        return resolve(res.status(415).json({ error: 'Unsupported file type. Only JPG, PNG, and WebP are allowed' }));
      }

      const ext = fileType.ext === 'jpg' ? 'jpeg' : fileType.ext;
      const fileId = uuidv4();
      const uploadType = req.query.type || 'report';
      const bucketName = uploadType === 'avatar' ? 'avatars' : 'user_uploads';
      const filePath = `${user.id}/${fileId}.${ext}`;

      // Upload to specified bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, fileBuffer, {
          contentType: fileType.mime,
          upsert: false
        });

      if (uploadError) {
        logger.error({ event: 'upload_storage_failure', userId: user.id, bucket: bucketName }, uploadError);
        return resolve(res.status(500).json({ error: 'Failed to upload to secure storage' }));
      }

      // Generate a signed URL for AI processing or user profile (valid for 1 hour for avatars, 15m for reports)
      const expiry = uploadType === 'avatar' ? 60 * 60 * 24 : 60 * 15; // 24h for avatar, 15m for report
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiry);

      if (signedError || !signedData?.signedUrl) {
        logger.error({ event: 'upload_signed_url_failure', userId: user.id }, signedError);
        return resolve(res.status(500).json({ error: 'Failed to generate access URL' }));
      }

      logger.info({ event: 'upload_success', userId: user.id, path: filePath, type: uploadType });
      return resolve(res.status(200).json({ url: signedData.signedUrl }));
    });

    req.pipe(bb);
  });
}
