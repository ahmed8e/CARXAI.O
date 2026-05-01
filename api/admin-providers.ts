// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { logger } from './utils/logger.js';

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

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const adminClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. ROBUST ADMIN CHECK
    // Check multiple sources to verify admin status:
    // a) JWT User Metadata (fastest, standard Supabase)
    // b) Profiles Table (canonical DB state)
    // c) Email Domain (fallback for Carsafety staff)
    
    const jwtMetadata = user.user_metadata || {};
    const jwtRole = jwtMetadata.role;

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role, subscription_tier, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error({ event: 'admin_profile_fetch_error', userId: user.id, error: profileError.message });
    }

    const { role: dbRole, subscription_tier: dbTier, email: dbEmail } = profile || {};
    
    // Authorization logic: any match is enough
    const isAdminRole = (jwtRole === 'admin') || (dbRole === 'admin');
    const isAdminTier = (dbTier === 'Admin');
    const isStaffEmail = (user.email?.endsWith('@carx.ai')) || (dbEmail?.endsWith('@carx.ai'));

    const isAuthorized = isAdminRole || isAdminTier || isStaffEmail;

    if (!isAuthorized) {
      logger.warn({ 
        event: 'admin_access_denied', 
        userId: user.id,
        diagnostics: {
          jwtRole,
          dbRole,
          dbTier,
          email: user.email,
          hasProfile: !!profile
        }
      });

      return res.status(403).json({ 
        error: 'Forbidden: Admin access required',
        details: {
          message: 'Your account does not have administrative privileges.',
          hint: 'Ensure your role is set to "admin" or you are using an @carx.ai email.'
        }
      });
    }

    const { providers, provider, id, action = 'insert' } = req.body;

    // BATCH INSERT
    if (action === 'insert' && providers && Array.isArray(providers)) {
      logger.info({ event: 'admin_import_started', userId: user.id, count: providers.length });

      const BATCH_SIZE = 50;
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < providers.length; i += BATCH_SIZE) {
        const batch = providers.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await adminClient
          .from('service_providers_raw')
          .insert(batch);

        if (insertError) {
          logger.error({ event: 'admin_import_batch_failed', error: insertError.message, batchIndex: i });
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      return res.status(200).json({ success: true, added: successCount, failed: failedCount });
    }

    // SINGLE INSERT
    if (action === 'insert' && provider) {
      const { error: insertError } = await adminClient
        .from('service_providers_raw')
        .insert(provider);

      if (insertError) throw insertError;
      return res.status(200).json({ success: true });
    }

    // SINGLE UPDATE
    if (action === 'update' && id && provider) {
      const { error: updateError } = await adminClient
        .from('service_providers_raw')
        .update(provider)
        .eq('id', id);

      if (updateError) throw updateError;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid request: providers, provider, or id missing for the specified action' });

  } catch (error: any) {
    logger.error({ event: 'admin_provider_action_error', userId: user.id, error: error.message });
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
