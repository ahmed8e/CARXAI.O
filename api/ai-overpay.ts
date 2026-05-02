import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';
import { assertRateLimit } from './utils/rate-limit.js';

export const maxDuration = 60;

// ─── CORS ─────────────────────────────────────────────────────────────────────
function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
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

// ─── OpenAI ───────────────────────────────────────────────────────────────────
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
      temperature: 0.15,
      max_tokens: 1200,
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

// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(
  carModel: string,
  problemDesc: string,
  quotedPrice: string,
  region?: string,
  liveTranscript?: string
) {
  return `You are an elite automotive pricing intelligence system used by a premium car safety SaaS. You have deep expertise in real-world US/international mechanic pricing, OEM vs aftermarket parts, and regional labor rates.

INPUT:
- Vehicle: ${carModel || 'Unknown'}
- Repair/Issue: ${problemDesc || 'See image or transcript'}
- Quoted Price: ${quotedPrice ? '$' + quotedPrice : 'Not provided — estimate fair range only'}
${region ? `- Region/Location: ${region}` : '- Region: General US market'}
${liveTranscript ? `- Live Transcript: "${liveTranscript}"` : ''}

YOUR TASK:
Analyze the mechanic's quote with the precision of an expert who has 20+ years in the industry.

PRICING GUIDELINES:
- Labor rates: $90–$160/hr (general shops), $130–$200/hr (dealerships)
- Always distinguish parts vs labor costs
- Consider OEM vs aftermarket pricing
- Factor in vehicle make/model (luxury cars cost more)

RULES:
1. "status" must be exactly: "fair" | "expensive" | "overpriced"
2. "risk_level" must be exactly: "low" | "medium" | "high"  
3. "overpriced_component" must be: "parts" | "labor" | "both" | null
4. "overpay_percent" is integer 0–200 (0 = fair price)
5. "scam_warning" is a string if suspicious, or null if not
6. "negotiation_script" must be a realistic, confident 1–2 sentence script the user can say verbatim
7. Keep "explanation" to 2–3 expert, confident sentences. No filler.
8. "cheaper_parts_sources" must be 3 specific sources relevant to the repair
9. Be opinionated and specific — users depend on this for real financial decisions

OUTPUT (strict JSON, no markdown, no extra keys):
{
  "detected_issue": "Short name of the repair",
  "status": "fair" | "expensive" | "overpriced",
  "overpay_percent": 0,
  "risk_level": "low" | "medium" | "high",
  "scam_warning": null or "string describing the suspicious element",
  "fair_price_range": "$XXX – $YYY",
  "market_breakdown": {
    "parts_range": "$XXX – $YYY",
    "labor_range": "$XXX – $YYY",
    "total_range": "$XXX – $YYY"
  },
  "explanation": "2–3 sentences of expert analysis.",
  "overpriced_component": "parts" | "labor" | "both" | null,
  "cheaper_parts_sources": ["Source 1", "Source 2", "Source 3"],
  "negotiation_script": "I looked up fair pricing for this repair and found...",
  "next_steps": "Single most important action right now.",
  "smart_replies": {
    "polite": "...",
    "assertive": "...",
    "expert": "..."
  }
}`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' });
  const token = authHeader.replace('Bearer ', '').trim();

  let user: any;
  try { user = await verifyUser(token); }
  catch (err: any) { return res.status(401).json({ error: err.message || 'Unauthorized' }); }

  const rl = await assertRateLimit(user.id, 'ai-overpay', 15, '1 m');
  if (!rl.success) return res.status(429).json({ error: 'Rate limit exceeded. Please wait a moment.' });

  const { carModel, problemDesc, quotedPrice, imageBase64, liveTranscript, region } = req.body || {};

  if (!carModel && !problemDesc && !imageBase64 && !liveTranscript) {
    return res.status(400).json({ error: 'Please provide car details, a problem description, or an image.' });
  }

  try {
    const systemPrompt = buildSystemPrompt(carModel, problemDesc, quotedPrice, region, liveTranscript);

    const userContent: any[] = [
      { type: 'text', text: 'Analyze this mechanic quote and return your structured assessment.' },
    ];

    if (imageBase64) {
      const imageUri = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
      userContent.push({ type: 'image_url', image_url: { url: imageUri, detail: 'high' } });
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
