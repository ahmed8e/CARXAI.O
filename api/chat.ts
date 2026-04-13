// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
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

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid Authorization header format' });
  }
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase configuration missing on server' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured on server' });
  }

  const { plan, response_mode, followup_context, ...openAiPayload } = req.body;

  // ── Advanced Tier Special Logic ──────────────────────────────────────────
  if (plan === 'Advanced') {
    const MASTER_PROMPT = `You are an Advanced AI Mechanic Assistant inside a premium automotive diagnostic app.
Your role is to help drivers understand likely car problems quickly, clearly, and safely.
You are professional, confident, calm, and practical.

DIAGNOSTIC CONTEXT GUIDELINES:
- Treat input as VAGUE if it is too short, general, or missing key context (e.g., "Car has a problem", "There is an issue", "I hear something", "There is a light").
- Treat input as SPECIFIC if it contains technical detail or clear symptoms (e.g., "Engine cranks but won't start", "Battery light came on while driving", "Steering shakes when braking").
- For vague inputs, ALWAYS use guided follow-up questions with options before attempting a diagnosis.`;

    const FAST_SYSTEM_PROMPT = `You are the FAST ANSWER engine for carx.ai.
Your job is to give a quick, high-value, practical answer.

JSON SCHEMA:
{
  "mode": "fast_answer",
  "issue_title": string,
  "explanation": string,
  "severity": "low" | "medium" | "high" | "emergency",
  "can_drive": boolean,
  "next_step": string,
  "needs_followup": false,
  "confidence": "medium" | "high",
  "recommended_actions": string[]
}`;

    const EXPERT_SYSTEM_PROMPT = `You are the EXPERT DIAGNOSTIC engine for carx.ai.
Your identity: Lukas Schneider, Senior Diagnostic Specialist.
Your methodology: Master Technician "Mental Sandbox".

DIAGNOSTIC HIERARCHY:
1. System Identification
2. Symptom Analysis
3. Urgency Determination
4. Precision Resolution

VAGUE INPUT RULE:
If input is vague, set needs_followup to true and provide 1-2 followup_questions.

JSON SCHEMA:
{
  "mode": "expert_answer",
  "needs_followup": boolean,
  "followup_questions": string[],
  "issue_title": string | null,
  "severity": "low" | "medium" | "high" | null,
  "can_drive": boolean,
  "confidence": "low" | "medium" | "high",
  "explanation": string,
  "next_step": string,
  "possible_causes": string[],
  "recommended_checks": string[],
  "tow_recommended": boolean
}`;

    const GUARDRAILS = `GUARDRAILS:
- RETURN ONLY VALID JSON. No markdown blocks.
- You MUST include the exact "mode": "${response_mode === 'fast' ? 'fast_answer' : 'expert_answer'}" field in the root of your response.
- If needs_followup is true, followup_questions MUST be an array of strings.
- can_drive and tow_recommended must be booleans.
- severity must be: low, medium, high, or null.`;

    // Context Injection
    let previousContext = followup_context ? `\n\nUSER PREVIOUS SELECTION/CONTEXT: ${JSON.stringify(followup_context)}` : '';

    const FINAL_SYSTEM_PROMPT = `${MASTER_PROMPT}

${response_mode === 'fast' ? FAST_SYSTEM_PROMPT : EXPERT_SYSTEM_PROMPT}

${GUARDRAILS}${previousContext}

IMPORTANT: ALWAYS return standardized JSON matching the EXACT schema above.`;

    // Inject as the very first message
    if (Array.isArray(openAiPayload.messages)) {
      openAiPayload.messages.unshift({ role: 'system', content: FINAL_SYSTEM_PROMPT });
    }
    
    // Force structured output for Advanced/Expert flows
    openAiPayload.response_format = { type: "json_object" };
    openAiPayload.model = "gpt-4o";
    // Ensure we don't stream if we want to log the full response on backend
    openAiPayload.stream = false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(openAiPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[API Chat] OpenAI Error:', error);
      return res.status(response.status).json(error);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    // ── Raw Logging (Requested by User) ──────────────────────────────────
    if (plan === 'Advanced') {
      console.log('[Expert API] RAW OpenAI Response Content:', rawContent);
    }

    // If it's a JSON response, we send the parsed content or raw string
    // depending on the client's expectations.
    // For carx.ai AIMechanic.tsx, it expects a stream or a structured object.
    
    if (req.body.stream === true || plan !== 'Advanced') {
      // If client requested stream, we manually send a single-chunk stream 
      // of the final content to maintain frontend compatibility.
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const chunk = `data: ${JSON.stringify(data)}\n\ndata: [DONE]\n\n`;
      res.write(chunk);
      res.end();
    } else {
      // Standard JSON response
      return res.status(200).json(data);
    }
  } catch (error: any) {
    console.error('Proxy Error:', error);
    if (!res.writableEnded) {
      // Return a structured error that the frontend can parse
      res.status(500).json({ 
        error: error.message,
        details: 'Expert diagnostic engine encountered an internal issue.'
      });
    }
  }
}
