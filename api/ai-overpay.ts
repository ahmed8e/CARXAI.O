import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export const maxDuration = 60;

// ─── CORS helper ─────────────────────────────────────────────────────────────
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function verifyUser(token: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase env missing');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error('Unauthorized');
  return data.user;
}

// ─── OpenAI call ──────────────────────────────────────────────────────────────
async function callOpenAI(messages: object[]) {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 700,
    }),
  });

  const text = await response.text();

  if (!response.ok) {
    let parsed: any = { error: text };
    try { parsed = JSON.parse(text); } catch {}
    throw new Error(parsed?.error?.message || `OpenAI error ${response.status}`);
  }

  const data = JSON.parse(text);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');
  return JSON.parse(content);
}

// ─── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(carModel: string, problemDesc: string, quotedPrice: string, liveTranscript?: string) {
  return `You are an expert AI automotive pricing analyst. Your sole job is to verify whether a mechanic's quote is fair.

INPUT:
- Vehicle: ${carModel || 'Unknown'}
- Repair/Problem: ${problemDesc || 'See image or transcript'}
- Quoted Price: ${quotedPrice ? '$' + quotedPrice : 'Not provided — estimate a fair range only'}
${liveTranscript ? `- Live conversation transcript: "${liveTranscript}"` : ''}

RULES:
1. Use real-world labor rates ($100–$180/hr) and OEM vs aftermarket part costs.
2. If an image is attached, analyze it (invoice, dashboard warning, damaged part) to improve accuracy.
3. If liveTranscript is provided, user is currently at the mechanic — give tactical, real-time advice.
4. "status" must be one of: "fair" | "expensive" | "overpriced"
5. "risk_level" must be one of: "low" | "medium" | "high"
6. "overpay_percent" is an integer (0 = fair, 40 = 40% overpriced). Return 0 if price is fair.
7. Keep explanation to 2 sentences max. Keep next_steps to 1 sentence.
8. smart_replies must be realistic scripts a car owner could say verbatim.

OUTPUT (strict JSON, no markdown):
{
  "detected_issue": "Short name of the repair/issue",
  "risk_level": "low" | "medium" | "high",
  "fair_price_range": "$XXX – $YYY",
  "status": "fair" | "expensive" | "overpriced",
  "overpay_percent": 0,
  "explanation": "2-sentence plain-English analysis.",
  "next_steps": "Single action the user should take right now.",
  "smart_replies": {
    "polite": "...",
    "assertive": "...",
    "expert": "..."
  }
}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ──
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' });
  const token = authHeader.replace('Bearer ', '').trim();

  let user: any;
  try {
    user = await verifyUser(token);
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Unauthorized' });
  }

  // ── Rate limit ──
  const rl = await assertRateLimit(user.id, 'ai-overpay', 15, '1 m');
  if (!rl.success) return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });

  // ── Parse body ──
  const { carModel, problemDesc, quotedPrice, imageBase64, liveTranscript } = req.body || {};

  // Require at least one meaningful input
  if (!carModel && !problemDesc && !imageBase64 && !liveTranscript) {
    return res.status(400).json({ error: 'Please provide car details, a problem description, or an image.' });
  }

  try {
    const systemPrompt = buildSystemPrompt(carModel, problemDesc, quotedPrice, liveTranscript);

    // Build the user message — always array to support vision
    const userContent: any[] = [
      { type: 'text', text: 'Analyze this mechanic quote and return your assessment.' },
    ];

    if (imageBase64) {
      // Accept both raw base64 and full data URIs
      const imageUri = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      userContent.push({ type: 'image_url', image_url: { url: imageUri, detail: 'low' } });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const result = await callOpenAI(messages);

    logger.info({ event: 'ai_overpay_success', userId: user.id });
    return res.status(200).json(result);

  } catch (err: any) {
    logger.error({ event: 'ai_overpay_error', userId: user.id, msg: err.message });
    return res.status(500).json({ error: err.message || 'AI analysis failed. Please try again.' });
  }
}
