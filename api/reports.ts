// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ').pop();
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Rate Limiting
  const rateLimit = await assertRateLimit(user.id, 'reports', 15, '10 m');
  if (!rateLimit.success) {
    logger.warn({ event: 'report_rate_limit_exceeded', userId: user.id });
    return res.status(429).json({ error: 'Too many reports generated. Please take a break.' });
  }

  const { issue_name, urgency_level, diagnostic_data } = req.body;

  if (!issue_name) {
    return res.status(400).json({ error: 'Missing report data' });
  }

  try {
    const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Insert with service role to ensure it bypasses any restrictive RLS if needed,
    // but manually enforcing user_id ownership.
    const { data, error } = await adminClient
      .from('ai_chats')
      .insert([{
        user_id: user.id,
        issue_name,
        urgency_level,
        diagnostic_data // Optional: store full JSON blob
      }])
      .select('id')
      .single();

    if (error) throw error;

    logger.info({ event: 'report_saved', userId: user.id, chatId: data.id });
    return res.status(200).json({ success: true, id: data.id });
  } catch (error: any) {
    logger.error({ event: 'report_save_error', userId: user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to save diagnostic report' });
  }
}
