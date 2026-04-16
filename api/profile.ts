// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  // Rate Limiting (Infrequent updates)
  const rateLimit = await assertRateLimit(user.id, 'profile', 5, '1 h');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many profile updates. Please try again later.' });
  }

  const { fullName, phoneNumber, preferredLanguage } = req.body;

  try {
    const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Update profiles table
    if (fullName !== undefined) {
      await adminClient
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
      
      // Also update auth metadata for convenience
      await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { full_name: fullName }
      });
    }

    // Update user_settings table
    if (phoneNumber !== undefined || preferredLanguage !== undefined) {
      await adminClient
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          phone_number: phoneNumber,
          preferred_language: preferredLanguage
        });
    }

    logger.info({ event: 'profile_updated', userId: user.id });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    logger.error({ event: 'profile_update_error', userId: user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}
