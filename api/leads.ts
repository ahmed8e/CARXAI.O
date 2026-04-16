// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger';
import { assertRateLimit } from './utils/rate-limit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { report_id, shared_link_id, contact_value, contact_type, source } = req.body;

  // Validation
  if (!contact_value || !contact_type) {
    return res.status(400).json({ error: 'Missing contact information' });
  }

  // Rate Limiting
  // For leads, we limit by IP if no user ID (guest leads), or by user ID if available
  const authHeader = req.headers.authorization;
  let identifier = req.headers['x-forwarded-for'] || 'anonymous';
  let userId = null;

  if (authHeader) {
    const token = authHeader.split(' ').pop();
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      identifier = user.id;
      userId = user.id;
    }
  }

  const rateLimit = await assertRateLimit(identifier, 'leads', 5, '10 m');
  if (!rateLimit.success) {
    logger.warn({ event: 'lead_rate_limit_exceeded', identifier });
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { error } = await supabase
      .from('mechanic_leads')
      .insert([{
        user_id: userId,
        report_id,
        shared_link_id,
        contact_value,
        contact_type,
        source
      }]);

    if (error) throw error;

    logger.info({ event: 'lead_submitted', identifier, type: contact_type });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'lead_submission_error', error: error.message });
    return res.status(500).json({ error: 'Failed to submit lead' });
  }
}
