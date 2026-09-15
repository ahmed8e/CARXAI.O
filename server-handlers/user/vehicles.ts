// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { assertRateLimit } from '../utils/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.split(' ').pop();
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  // Rate Limiting
  const rateLimit = await assertRateLimit(user.id, 'vehicles', 15, '10 m');
  if (!rateLimit.success) {
    return res.status(429).json({ error: 'Too many garage updates. Please try again later.' });
  }

  const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  try {
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Missing vehicle ID' });
      
      const { error } = await adminClient
        .from('vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info({ event: 'vehicle_deleted', userId: user.id, vehicleId: id });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'POST') {
      const { action, id, ...vehicleData } = req.body;

      // Handle "set default" action
      if (action === 'set_default' && id) {
        await adminClient
          .from('vehicles')
          .update({ is_default: false })
          .eq('user_id', user.id);
        
        await adminClient
          .from('vehicles')
          .update({ is_default: true })
          .eq('id', id)
          .eq('user_id', user.id);
        
        return res.status(200).json({ success: true });
      }

      // Handle Upsert / Update
      if (vehicleData.is_default) {
        await adminClient
          .from('vehicles')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      if (id) {
        // Update
        const { error } = await adminClient
          .from('vehicles')
          .update({ ...vehicleData, user_id: user.id })
          .eq('id', id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await adminClient
          .from('vehicles')
          .insert([{ ...vehicleData, user_id: user.id }]);
        if (error) throw error;
      }

      logger.info({ event: 'vehicle_saved', userId: user.id, action: id ? 'update' : 'create' });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    logger.error({ event: 'vehicle_mutation_error', userId: user.id, error: error.message });
    return res.status(500).json({ error: 'Failed to manage garage' });
  }
}
