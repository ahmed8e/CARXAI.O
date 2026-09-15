import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from '../utils/logger.js';
import { assertRateLimit } from '../utils/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI key missing' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' });

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) return res.status(401).json({ error: 'Invalid token' });

  let user = null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Invalid token' });
    user = authUser;
  } catch (err) {
    return res.status(500).json({ error: 'Session verification failed' });
  }

  // Rate Limiting
  const rateLimitStatus = await assertRateLimit(user.id, 'transcribe', 10, '1 m');
  if (!rateLimitStatus.success) {
    return res.status(429).json({ error: 'Rate limit exceeded.' });
  }

  const { audioBase64 } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'Missing audio base64 data' });
  }

  try {
    // Decode base64 to Buffer
    const binaryString = Buffer.from(audioBase64, 'base64');
    
    // Construct FormData for OpenAI
    const formData = new FormData();
    const blob = new Blob([binaryString], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    const rawText = await response.text();

    if (!response.ok) {
      let parsedError: any = { error: rawText };
      try { parsedError = JSON.parse(rawText); } catch {}
      logger.error({ event: 'openai_transcribe_error', parsedError });
      return res.status(response.status).json(parsedError);
    }

    const data = JSON.parse(rawText);
    
    logger.info({ event: 'transcribe_success', userId: user.id });
    // Returns { text: "transcribed text" }
    return res.status(200).json({ text: data.text });

  } catch (error: any) {
    logger.error({ event: 'transcribe_proxy_error', errorMsg: error.message });
    return res.status(500).json({ error: 'STT Engine Error' });
  }
}
