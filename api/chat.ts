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

  const { plan, response_mode, followup_context, is_retry, ...openAiPayload } = req.body;

  const STANDARD_PROMPT = `You are CarxAI AI Mechanic, a multimodal automotive assistant.

Your job is to help users understand car problems using any combination of:
- user text
- uploaded image/photo
- audio transcript
- mixed inputs

You handle general car issues across multiple input types.

REASONING MODES:
1. "dashboard": For dashboard images. Focus ONLY on dashboard warnings, symbols, and fault messages. If fault text is visible, treat it as strong evidence. Combine icon and message if both present.
2. "visual_issue": For non-dashboard images (engine bay, tire, leak, smoke, battery, etc.). Focus on the visible issue. Do not hallucinate details. If unclear, be honest.
3. "symptom_based": For no-image cases (text/audio only). Reason from reported symptoms (clicking, vibration, rough idle, etc.). Use safety-first logic.
4. "mixed": For combined evidence (image + text/audio). Use all evidence together. Image is primary if clear; text/audio is supporting. If they agree, raise confidence. If they conflict, prioritize clearest direct evidence and mention uncertainty. Do not return generic fallback if evidence is strong enough.

RESPONSE STYLE:
- practical, safety-first, easy to understand.
- no unnecessary jargon.
- focused on likely issue, severity, driveability, and next step.

Return this exact schema:
{
  "analysis_mode": "dashboard" | "visual_issue" | "symptom_based" | "mixed",
  "issue_title": string,
  "severity": "low" | "medium" | "high",
  "can_drive": boolean,
  "confidence": "low" | "medium" | "high",
  "explanation": string,
  "next_step": string,
  "needs_more_input": boolean,
  "visible_area": string | null,
  "dashboard_type": "warning_light" | "text_message" | "both" | "non_dashboard" | "unknown" | null,
  "warning_light_name": string | null,
  "fault_message_text": string | null
}

Additional rules:
- If evidence is weak, say so clearly.
- If the issue may be dangerous, prioritize safety and set can_drive to false.
- Extract any readable text in the image.
- Return only valid JSON. Do not return markdown.`;

  const FAST_ANSWER_PROMPT = `You are the FAST ANSWER engine for carx.ai.
Your job is to give a quick, high-value, practical answer.

CRITICAL RULES:
1. Keep the "explanation" extremely short (1-2 sentences maximum).
2. DO NOT set "needs_followup" to true unless absolutely critical. Prefer giving your highest probability direct answer.

JSON SCHEMA:
{
  "mode": "fast_answer",
  "issue_title": string,
  "severity": "low" | "medium" | "high",
  "can_drive": boolean,
  "confidence": "medium" | "high",
  "explanation": string,
  "next_step": string,
  "needs_followup": boolean,
  "followup_questions": string[],
  "recommended_checks": string[],
  "tow_recommended": boolean
}`;

  const EXPERT_ANSWER_PROMPT = `You are the EXPERT DIAGNOSTIC engine for carx.ai. You must act as a Senior Master Technician.

CRITICAL EXPERT BEHAVIOR RULES:
1. Provide a master-level technical "explanation" covering the most likely root cause, mechanical/electrical theory behind the symptom, and alternative possibilities.
2. If the issue is clear, return the deep diagnosis immediately. Do NOT ask unnecessary questions.
3. If the issue is broad or ambiguous (e.g. "my car makes a noise"), set "needs_followup" to true and ask exactly 1 or 2 highly specific, diagnostic-narrowing questions (e.g. "Does the vibration happen only during braking or while accelerating?").
4. Do not return shallow, generic advice. Use advanced automotive knowledge.
5. You MUST return ONLY the JSON object defined below. Do NOT output raw text outside the JSON.
6. If "needs_followup" is true, focus purely on the "followup_questions" array. You may leave "issue_title" and "explanation" empty if you cannot form a strong preliminary diagnosis yet.

JSON SCHEMA:
{
  "mode": "expert_answer",
  "issue_title": string,
  "severity": "low" | "medium" | "high",
  "can_drive": boolean,
  "confidence": "low" | "medium" | "high",
  "explanation": string,
  "next_step": string,
  "needs_followup": boolean,
  "followup_questions": string[],
  "recommended_checks": string[],
  "tow_recommended": boolean
}`;

  let selectedPrompt = STANDARD_PROMPT;
  let modeString = 'standard';

  if (plan === 'advanced') {
    if (response_mode === 'fast_answer') {
      selectedPrompt = FAST_ANSWER_PROMPT;
      modeString = 'fast_answer';
    } else {
      selectedPrompt = EXPERT_ANSWER_PROMPT;
      modeString = 'expert_answer';
    }
  }

  // Force structured output globally since all prompts expect JSON
  openAiPayload.response_format = { type: "json_object" };
  
  // Inject retry and followup contexts securely on backend
  let diagnosticContext = `\n\nGUARDRAILS:\n- RETURN ONLY VALID JSON.\n- You MUST include the exact "mode": "${modeString}" field in the root of your response.`;
  if (followup_context) {
    diagnosticContext += `\n\nUSER PREVIOUS SELECTION/CONTEXT: ${JSON.stringify(followup_context)}`;
  }
  if (is_retry) {
    diagnosticContext += `\n\nIMPORTANT: Your previous response was invalid JSON. Please return ONLY valid JSON matching the requested schema.`;
  }

  const FINAL_SYSTEM_PROMPT = `${selectedPrompt}${diagnosticContext}`;

  // Prepend to messages array
  if (Array.isArray(openAiPayload.messages)) {
    openAiPayload.messages.unshift({ role: 'system', content: FINAL_SYSTEM_PROMPT });
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

    if (openAiPayload.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } else {
      const data = await response.json();
      res.status(200).json(data);
    }
  } catch (error: any) {
    console.error('Proxy Error:', error);
    if (!res.writableEnded) {
      res.status(500).json({ 
        error: error.message,
        details: 'Expert diagnostic engine encountered an internal issue.'
      });
    }
  }
}
