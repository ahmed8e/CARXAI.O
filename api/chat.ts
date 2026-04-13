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

  const { plan, response_mode, ...openAiPayload } = req.body;

  // ── Advanced Tier Special Logic ──────────────────────────────────────────
  if (plan === 'Advanced') {
    const MASTER_PROMPT = `You are an Advanced AI Mechanic Assistant inside a premium automotive diagnostic app.
Your role is to help drivers understand likely car problems quickly, clearly, and safely.
You are professional, confident, calm, and practical.

DIAGNOSTIC CONTEXT GUIDELINES:
- Treat input as VAGUE if it is too short, general, or missing key context (e.g., "Car has a problem", "There is an issue", "I hear something", "There is a light").
- Treat input as SPECIFIC if it contains technical detail or clear symptoms (e.g., "Engine cranks but won't start", "Battery light came on while driving", "Steering shakes when braking").
- For vague inputs, ALWAYS use guided follow-up questions with options before attempting a diagnosis.`;

    let modeInstruction = '';
    if (response_mode === 'fast') {
      modeInstruction = `You are in FAST ANSWER mode.
Your job is to give a quick, high-value, practical answer with minimal friction.
FAST mode rules:
- Be concise, clear, and decision-oriented.
- Give immediate value first.
- Do not over-explain.
- Ask at most 1 follow-up unless absolutely necessary.
- If the problem is vague, provide a short guided follow-up with selectable options in the "options" field.
- Preferred follow-up style: "Choose what matches best:", "Pick the closest symptom:", "Which of these fits best?".
- Focus on likely issue, quick reason, urgency, and what to do now.
- Output style: Short, Clean, Premium, Easy to scan, Useful in urgent moments.`;
    } else {
      modeInstruction = `You are in EXPERT DIAGNOSIS mode.
Your job is to provide a more precise diagnostic flow while keeping the interaction efficient, practical, and premium.
EXPERT mode rules:
- Think like a skilled diagnostic assistant.
- If the issue is already specific enough, give a structured diagnosis directly.
- If the issue is vague or incomplete, ask 1 highly relevant follow-up first.
- Ask a second follow-up only if it will meaningfully improve confidence.
- Prefer guided option-based follow-ups over free-text whenever possible.
- Focus on the most diagnostic detail first.
- Once enough information exists, finalize clearly and confidently.
- Note: Do NOT sound complex. Sound precise, helpful, and efficient.
- Clarification strategy: Focus on narrowing factors like no-start type, warning light type, sound type, timing, overheating/smell/smoke, or braking/steering behavior.`;
    }

    const GUARDRAILS = `GUARDRAILS:
- Never say “I need more information” without trying to guide the user with options first.
- Never ask many open-ended questions in a row.
- Never respond with a long generic explanation when a short structured answer is enough.
- Never overload the user with jargon.
- Never sound uncertain without still offering a best likely direction.
- Never leave the user without a next step.
- If the issue is dangerous (unsafe driving, fire risk, brake failure), clearly raise urgency to HIGH or STOP_DRIVING.
- If the issue is emergency-like, prioritize towing / urgent mechanic recommendation.`;

    // Detect if we should append the Finalization Prompt (if more than 2 messages in history)
    let finalizationPrompt = '';
    if (openAiPayload.messages && openAiPayload.messages.length > 3) {
      finalizationPrompt = `\n\nFINALIZATION RULES (User has answered your follow-up):
- Once the user has answered your follow-up questions, you MUST finalize the diagnosis.
- Do NOT restart the questioning flow or ask unnecessary extra questions.
- Use the original issue plus the follow-up answers to produce the strongest likely diagnosis.
- If confidence is still limited, say so clearly but still provide the best likely direction.
- The result should feel stronger and more precise than before.
- RETURN: needs_followup = false, options = [], followup_question = null, plus the final diagnostic fields.`;
    }

    const ADVANCED_SYSTEM_PROMPT = `${MASTER_PROMPT}

${modeInstruction}

${GUARDRAILS}${finalizationPrompt}

JSON SCHEMA:
{
  "status": "success" | "error",
  "response_mode": "${response_mode}",
  "issue_title": string | null,
  "explanation": string,
  "urgency": "low" | "medium" | "high" | "emergency" | null,
  "can_drive": boolean | null,
  "next_step": string,
  "needs_followup": boolean,
  "followup_question": string | null,
  "options": string[] | null,
  "recommended_actions": string[],
  "confidence": "low" | "medium" | "high"
}

IMPORTANT:
- Do NOT behave like a generic chatbot.
- Do NOT produce long essays.
- Always prioritize safety, urgency, and next action.`;

    // Inject as the very first message
    if (Array.isArray(openAiPayload.messages)) {
      openAiPayload.messages.unshift({ role: 'system', content: ADVANCED_SYSTEM_PROMPT });
    }
    
    // Enforce consistency
    openAiPayload.response_format = { type: "json_object" };
    openAiPayload.model = "gpt-4o";
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
      return res.status(response.status).json(error);
    }

    // Proxy the stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }

    res.end();
  } catch (error: any) {
    console.error('Proxy Error:', error);
    if (!res.writableEnded) {
      res.status(500).json({ error: error.message });
    }
  }
}
