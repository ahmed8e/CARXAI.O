import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV || 'development',
    visibility: {
      hasOpenAiKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      hasSupabaseAnonKey: !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasUpstashRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    connectivity: {
      supabase: 'pending',
      database: 'pending',
      storage: 'pending',
      buckets: {},
    }
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      diagnostics.connectivity.supabase = 'failed_missing_keys';
      return res.status(200).json(diagnostics);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    diagnostics.connectivity.supabase = 'initialized';

    // Test Database Connectivity
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      diagnostics.connectivity.database = 'healthy';
    } catch (dbErr: any) {
      diagnostics.connectivity.database = `failed: ${dbErr.message}`;
    }

    // Test Storage Connectivity & Buckets
    try {
      const { data: buckets, error: storageErr } = await supabase.storage.listBuckets();
      if (storageErr) throw storageErr;
      
      diagnostics.connectivity.storage = 'healthy';
      const bucketNames = buckets.map(b => b.name);
      diagnostics.connectivity.buckets = {
        user_uploads: bucketNames.includes('user_uploads'),
        avatars: bucketNames.includes('avatars'),
        available: bucketNames
      };
    } catch (stErr: any) {
      diagnostics.connectivity.storage = `failed: ${stErr.message}`;
    }

    logger.info({ event: 'diagnostic_health_check', status: 'completed' });
    return res.status(200).json(diagnostics);
  } catch (err: any) {
    diagnostics.error = err.message;
    logger.error({ event: 'diagnostic_health_check_failed', error: err.message });
    return res.status(500).json(diagnostics);
  }
}
