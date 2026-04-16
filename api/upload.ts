import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import busboy from 'busboy';
import { fileTypeFromBuffer } from 'file-type';
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
  // Safe environment validation with fallback support
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Initial debug log (Boolean only - NEVER log actual secrets)
  logger.info({
    event: 'api_upload_received',
    hasAuth: !!req.headers.authorization,
    envStatus: {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    }
  });

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

  // Basic env validation - Return JSON error early
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error({ event: 'upload_env_missing', details: 'SUPABASE_URL or SERVICE_ROLE_KEY not found' });
    return res.status(500).json({ error: 'Storage configuration missing on server.', code: 'ENV_CONFIG_MISSING' });
  }

  // Auth processing
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please sign in again.' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token format.' });
  }

  let user = null;
  let supabase = null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Explicitly check for successful initialization
    if (!supabase || !supabase.auth) {
        throw new Error('Supabase client failed to initialize');
    }

    const { data, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !data?.user) {
      logger.warn({ event: 'upload_auth_failed', error: authError?.message || 'User not found' });
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    }
    user = data.user;
  } catch (err: any) {
    logger.error({ event: 'upload_supabase_init_failed', error: err.message });
    return res.status(500).json({ error: 'Failed to verify user session for upload.', details: err.message });
  }

  // Rate Limiting
  const identifier = user.id;
  const rateLimitStatus = await assertRateLimit(identifier, 'upload', 5, '1 m');
  
  if (!rateLimitStatus.success) {
    return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.', diagnosticCode: 'RATE_LIMIT_EXCEEDED' });
  }

  // PRE-FLIGHT BUCKET CHECK
  const uploadType = req.query.type || 'report';
  const bucketName = uploadType === 'avatar' ? 'avatars' : 'user_uploads';
  
  try {
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (bucketErr) throw bucketErr;
    if (!buckets.find(b => b.name === bucketName)) {
      logger.error({ event: 'upload_bucket_missing', bucket: bucketName });
      return res.status(500).json({ 
        error: `Storage bucket '${bucketName}' not found.`, 
        diagnosticCode: 'STORAGE_BUCKET_MISSING',
        details: 'Check Supabase dashboard storage settings.'
      });
    }
  } catch (err: any) {
    logger.error({ event: 'upload_bucket_check_failed', error: err.message });
    return res.status(500).json({ error: 'Failed to verify storage configuration.', diagnosticCode: 'BUCKET_VERIFICATION_FAILED', details: err.message });
  }

  // Multipart parsing
  return new Promise((resolve) => {
    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
    } catch (err) {
      logger.error({ event: 'upload_busboy_init_fail' }, err);
      return res.status(400).json({ error: 'Invalid content type', diagnosticCode: 'BUSBOY_INIT_FAILED' });
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
        return resolve(res.status(413).json({ error: 'File size exceeds 5MB limit', diagnosticCode: 'FILE_TOO_LARGE' }));
      }

      if (!fileBuffer) {
        logger.warn({ event: 'upload_rejected_no_file', userId: user.id });
        return resolve(res.status(400).json({ error: 'No file uploaded', diagnosticCode: 'NO_FILE_UPLOADED' }));
      }

      // Check Magic Mime Type Server-side (Ignores extension spoofing)
      let fileType;
      try {
        fileType = await fileTypeFromBuffer(fileBuffer);
      } catch (e: any) {
        logger.error({ event: 'upload_filetype_check_failed', userId: user.id }, e);
        return resolve(res.status(500).json({ error: 'Internal server error checking file', diagnosticCode: 'FILETYPE_CHECK_FAILED', details: e.message }));
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
      const fileId = crypto.randomUUID();
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
