import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export const maxDuration = 60; // Max execution time 60s for Vercel

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
    return res.status(500).json({ error: 'Server configuration missing' });
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
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
    }
    user = authUser;
  } catch (err: any) {
    logger.error({ event: 'negotiate_auth_failed', error: err.message });
    return res.status(500).json({ error: 'Session verification failed' });
  }

  // Rate Limiting (10 requests per minute)
  const rateLimitStatus = await assertRateLimit(user.id, 'negotiate', 15, '1 m');
  if (!rateLimitStatus.success) {
    logger.warn({ event: 'negotiate_rate_limit', userId: user.id });
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { carModel, problemDesc, quotedPrice, liveTranscript, imageBase64 } = req.body;

  // We require either a problem description OR an image OR a transcript
  if (!carModel && !problemDesc && !imageBase64 && !liveTranscript) {
    return res.status(400).json({ error: 'Missing input data' });
  }

  const SYSTEM_PROMPT = `You are a strict, objective, professional AI Automotive Analyst and Negotiator. 
Your goal is to evaluate mechanic quotes for fairness, identify issues if an image is provided, and provide users with actionable negotiation tactics.

CRITICAL RULES:
1. Output format MUST be valid JSON, strictly following the schema below.
2. The "status" must be exactly one of: "fair", "expensive", or "overpriced".
3. The "risk_level" must be exactly one of: "low", "medium", or "high". 
4. Assume common industry standard labor rates ($100-$180/hr) and typical OEM vs Aftermarket parts.
5. If an image is provided, analyze the invoice, dashboard warning, or car part shown to inform your "detected_issue".
6. If "liveTranscript" is provided, the user is CURRENTLY SPEAKING with the mechanic. Tailor your remarks as real-time feedback.
7. Keep explanations and next steps extremely concise and punchy.

INPUT DATA:
- Vehicle: ${carModel || 'Unknown'}
- Problem/Repair: ${problemDesc || 'Analyze image/transcript'}
- Quoted Price: ${quotedPrice ? '$' + quotedPrice : 'Evaluate based on context'}
${liveTranscript ? `- LIVE TRANSCRIPT from conversation: "${liveTranscript}"` : ''}

JSON RESPONSE SCHEMA REQUIRED:
{
  "detected_issue": "Very short name of the issue you detect.",
  "risk_level": "low" | "medium" | "high",
  "fair_price_range": "$XXX - $YYY",
  "status": "fair" | "expensive" | "overpriced",
  "explanation": "Short 1-2 sentence explanation of why the price is what it is.",
  "next_steps": "What the user should immediately do.",
  "smart_replies": {
    "polite": "Short polite script",
    "assertive": "Assertive script",
    "expert": "Expert questioning script (e.g. asking about labor hours / OEM vs aftermarket)"
  }
}
`;

  try {
    const userContent: any[] = [];
    userContent.push({ type: 'text', text: 'Analyze this situation based on the provided inputs.' });

    if (imageBase64) {
      // imageBase64 should include the data URI prefix (e.g., 'data:image/jpeg;base64,...')
      const imageUri = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;
        
      userContent.push({
        type: 'image_url',
        image_url: { url: imageUri }
      });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4o native multimodal
        messages: messages,
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

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ error: 'Invalid JSON returned from OpenAI' });
    }

    const finalContent = data?.choices?.[0]?.message?.content;
    
    if (!finalContent) {
      return res.status(502).json({ error: 'Missing content from OpenAI' });
    }

    let validatedContent;
    try {
      validatedContent = JSON.parse(finalContent);
    } catch {
      return res.status(502).json({ error: 'Assistant content was not valid JSON schema' });
    }
    
    logger.info({ event: 'negotiate_success', userId: user.id });
    return res.status(200).json(validatedContent);

  } catch (error: any) {
    logger.error({ event: 'negotiate_proxy_error', errorMsg: error.message });
    return res.status(500).json({ error: error.message || 'Negotiation Engine Error' });
  }
}
