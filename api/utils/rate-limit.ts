import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

let redis: Redis | null = null;
let ratelimitCache = new Map<string, Ratelimit>();

// Internal helper for lazy-loading Redis
function getRedis() {
  if (redis !== null) return redis;

  try {
    const hasRedisUrl = !!process.env.UPSTASH_REDIS_REST_URL;
    const hasRedisToken = !!process.env.UPSTASH_REDIS_REST_TOKEN;

    if (hasRedisUrl && hasRedisToken) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      return redis;
    }
  } catch (error) {
    // Top-level initialization error shouldn't crash the utility
    console.error('[RateLimit Init Error]', error);
  }
  return null;
}

// 10 requests per 10 seconds is just an example default, pass specific limit parameters
export async function assertRateLimit(
  identifier: string, 
  route: string,
  limit: number = 10,
  windowTime: `${number} s` | `${number} m` | `${number} h` = '1 m'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  
  const currentRedis = getRedis();

  if (!currentRedis) {
    // Fail open if Redis is not configured, so we don't break the app
    return { success: true, limit, remaining: limit, reset: 0 };
  }

  const cacheKey = `${route}_${limit}_${windowTime}`;
  
  let ratelimit = ratelimitCache.get(cacheKey);
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(limit, windowTime),
      ephemeralCache: new Map(),
    });
    ratelimitCache.set(cacheKey, ratelimit);
  }

  try {
    const contextPrefix = `ratelimit_${route}_${identifier}`;
    const result = await ratelimit.limit(contextPrefix);

    if (!result.success) {
      logger.warn({
        event: 'rate_limit_exceeded',
        route,
        identifier: identifier === 'anonymous' ? 'IP-based' : identifier
      });
    }

    return result;
  } catch (error) {
    logger.error({ event: 'rate_limit_execution_error', route, identifier }, error);
    // Fail open if Upstash throws
    return { success: true, limit, remaining: limit, reset: 0 };
  }
}
