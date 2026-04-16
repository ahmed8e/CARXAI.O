import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger';
import { assertRateLimit } from './utils/rate-limit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
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

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase configuration missing on server' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    logger.warn({ event: 'speech_auth_failed', error: authError?.message || 'Invalid token' });
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Rate Limiting (20 requests per minute per user)
  const rateLimitStatus = await assertRateLimit(user.id, 'speech', 20, '1 m');
  if (!rateLimitStatus.success) {
    logger.warn({ event: 'speech_rate_limit_exceeded', userId: user.id });
    return res.status(429).json({ error: 'Rate limit exceeded for speech requests.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const { text, model = 'tts-1', voice = 'nova' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error({ event: 'openai_speech_error', status: response.status, error });
      return res.status(response.status).json(error);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    logger.info({ event: 'speech_success', userId: user.id, textPreview: text.substring(0, 50) });
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    logger.error({ event: 'speech_proxy_error' }, error);
    res.status(500).json({ error: error.message });
  }
}
