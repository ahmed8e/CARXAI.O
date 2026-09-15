import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import busboy from 'busboy';
import { logger } from '../server-handlers/utils/logger.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) return res.status(401).json({ error: 'Invalid token' });

  let user = null;
  let supabase = null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error: authError } = await supabase.auth.getUser(token);
    if (authError || !data?.user) return res.status(401).json({ error: 'Invalid session' });
    user = data.user;
  } catch (err: any) {
    return res.status(500).json({ error: 'Auth verification failed', details: err.message });
  }

  return new Promise((resolve) => {
    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
    } catch (err) {
      return resolve(res.status(400).json({ error: 'Invalid request' }));
    }

    let fileBuffer: Buffer | null = null;
    let fileInfo: { filename: string; mimeType: string } | null = null;
    let fileTooLarge = false;

    bb.on('file', (name, file, info) => {
      fileInfo = info;
      const chunks: Buffer[] = [];
      file.on('data', (data) => chunks.push(data));
      file.on('limit', () => (fileTooLarge = true));
      file.on('end', () => { if (!fileTooLarge) fileBuffer = Buffer.concat(chunks); });
    });

    bb.on('close', async () => {
      if (fileTooLarge) return resolve(res.status(413).json({ error: 'File too large (Max 5MB)' }));
      if (!fileBuffer || !fileInfo) return resolve(res.status(400).json({ error: 'No file uploaded' }));

      // Simple extension extraction from mime or filename
      const mime = fileInfo.mimeType;
      const ext = mime.split('/').pop() || 'jpg';
      const fileId = crypto.randomUUID();
      const uploadType = req.query.type || 'report';
      const bucketName = uploadType === 'avatar' ? 'avatars' : 'user_uploads';
      const filePath = `${user.id}/${fileId}.${ext}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, fileBuffer, { contentType: mime, upsert: false });

        if (uploadError) throw uploadError;

        const expiry = uploadType === 'avatar' ? 60 * 60 * 24 : 60 * 15;
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(filePath, expiry);

        if (signedError || !signedData?.signedUrl) throw (signedError || new Error('Signed URL failed'));

        return resolve(res.status(200).json({ url: signedData.signedUrl }));
      } catch (err: any) {
        logger.error({ event: 'upload_failure', error: err.message });
        return resolve(res.status(500).json({ error: 'Upload failed', details: err.message }));
      }
    });

    req.pipe(bb);
  });
}
