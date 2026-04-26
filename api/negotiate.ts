import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
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

  if (!supabaseUrl || !supabaseAnonKey || !openaiKey) {
    logger.error({ event: 'negotiate_missing_env' });
    return res.status(500).json({ error: 'Server configuration missing.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) return res.status(401).json({ error: 'Invalid token format' });

  let user = null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    user = authUser;
  } catch (err: any) {
    logger.error({ event: 'negotiate_auth_failed', error: err.message });
    return res.status(500).json({ error: 'Session verification failed' });
  }

  // Rate Limiting (10 requests per minute)
  const rateLimitStatus = await assertRateLimit(user.id, 'negotiate', 10, '1 m');
  if (!rateLimitStatus.success) {
    logger.warn({ event: 'negotiate_rate_limit', userId: user.id });
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { carModel, problemDesc, quotedPrice, liveTranscript } = req.body;

  if (!carModel || (!problemDesc && !liveTranscript) || !quotedPrice) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const SYSTEM_PROMPT = `You are a strict, objective, automotive pricing analyst and intelligent negotiator.
Your goal is to evaluate mechanic quotes for fairness and provide users with actionable negotiation tactics.

CRITICAL RULES:
1. Output format MUST be valid JSON, strictly following the schema below.
2. The "status" must be strictly one of: "fair", "expensive", or "overpriced".
3. Assume common industry standard labor rates (approx $100-$150/hr depending on location/brand) and standard Mitchell/Alldata hour estimates.
4. If "liveTranscript" is provided, the user is CURRENTLY SPEAKING with the mechanic. Tailor the explanation and replies as immediate real-time feedback.
5. "smart_replies" must contain exactly 3 distinct string suggestions.
6. The explanations should be succinct, 1-2 lines maximum.

INPUT CONTEXT:
- Vehicle: ${carModel}
- Problem/Repair: ${problemDesc || 'Provided via transcript'}
- Quoted Price: $${quotedPrice}
${liveTranscript ? `- LIVE TRANSCRIPT from mechanic conversation: "${liveTranscript}"` : ''}

JSON RESPONSE SCHEMA:
{
  "fair_price_range": "$XXX - $YYY",
  "status": "fair" | "expensive" | "overpriced",
  "explanation": "Short 1-2 sentence explanation of why the price is what it is.",
  "smart_replies": {
    "polite": "Thanks for... I checked...",
    "assertive": "This seems high because...",
    "expert": "Alldata suggests this is a X hour job..."
  }
}
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    const rawText = await response.text();

    if (!response.ok) {
      let parsedError: any = { error: rawText };
      try { parsedError = JSON.parse(rawText); } catch {}
      logger.error({ event: 'openai_negotiate_error', parsedError });
      return res.status(response.status).json(parsedError);
    }

    const data = JSON.parse(rawText);
    const finalContent = data?.choices?.[0]?.message?.content;
    
    if (!finalContent) {
      return res.status(502).json({ error: 'Missing content from OpenAI' });
    }

    const validatedContent = JSON.parse(finalContent);
    
    logger.info({ event: 'negotiate_success', userId: user.id });
    return res.status(200).json(validatedContent);

  } catch (error: any) {
    logger.error({ event: 'negotiate_proxy_error', errorMsg: error.message });
    return res.status(500).json({ error: 'Negotiation Engine Error' });
  }
}
