export interface LogContext {
  event: string;
  [key: string]: any;
}

const REDACTED_KEYS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
  'secret',
  'stripe_secret_key',
  'openai_api_key',
  'supabase_service_role_key',
  'supabase_anon_key'
];

/**
 * Recursively deep clones an object and redacts any keys that resemble secrets.
 */
function sanitizePayload(payload: any): any {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    const isRedacted = REDACTED_KEYS.some(redactedKey => 
      key.toLowerCase().includes(redactedKey)
    );

    if (isRedacted) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizePayload(value);
    }
  }

  // Also truncate overly long strings (like massive base64 payloads) to keep logs concise
  for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 1000) {
          sanitized[key] = value.substring(0, 100) + '...[TRUNCATED]';
      }
  }

  return sanitized;
}

export const logger = {
  info: (context: LogContext) => {
    console.log(JSON.stringify(sanitizePayload({ level: 'info', timestamp: new Date().toISOString(), ...context })));
  },
  warn: (context: LogContext) => {
    console.warn(JSON.stringify(sanitizePayload({ level: 'warn', timestamp: new Date().toISOString(), ...context })));
  },
  error: (context: LogContext, error?: any) => {
    const errorDetails = error ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code
    } : {};
    console.error(JSON.stringify(sanitizePayload({ level: 'error', timestamp: new Date().toISOString(), ...context, ...errorDetails })));
  }
};
