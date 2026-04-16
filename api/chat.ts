import { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './utils/logger.js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Safe environment validation with fallback support
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  // Initial debug log (Boolean only - NEVER log actual secrets)
  logger.info({
    event: 'api_chat_received',
    hasAuth: !!req.headers.authorization,
    envStatus: {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasOpenAI: !!openaiKey
    }
  });

  // CORS headers
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

  // Basic env validation - Return JSON error early
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error({ event: 'chat_env_missing', details: 'SUPABASE_URL or ANON_KEY not found' });
    return res.status(500).json({ error: 'Database configuration missing on server.', code: 'ENV_CONFIG_MISSING' });
  }

  if (!openaiKey) {
    logger.error({ event: 'chat_env_missing_openai' });
    return res.status(500).json({ error: 'AI engine API key not configured on server.', code: 'ENV_OPENAI_MISSING' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required. Please sign in again.' });
  }

  const token = authHeader.split(' ').pop()?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid authentication token format.' });
  }

  let user = null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Explicitly check for successful initialization
    if (!supabase || !supabase.auth) {
      throw new Error('Supabase client failed to initialize');
    }

    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data?.user) {
      logger.warn({ event: 'chat_auth_failed', error: authError?.message || 'User not found' });
      return res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    }
    user = data.user;
  } catch (err: any) {
    logger.error({ event: 'chat_supabase_init_failed', error: err.message });
    return res.status(500).json({ error: 'Failed to verify user session.', diagnosticCode: 'AUTH_VERIFICATION_FAILED', details: err.message });
  }

  // Safety check for req.body
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing.', diagnosticCode: 'EMPTY_BODY' });
  }

  const { plan, response_mode, followup_context, is_retry, ...openAiPayload } = req.body;

  const STANDARD_PROMPT = `You are CarxAI AI Mechanic, a multimodal automotive assistant.

Your job is to help users understand car problems using any combination of:
- user text
- uploaded image/photo
- audio transcript
- mixed inputs

You handle general car issues across multiple input types.

CRITICAL TONE RULES:
- You must speak in a direct, decision-oriented, assistant-style format.
- Do NOT use generic vision phrases like "The image shows...", "In the picture I see...", or robotic descriptions.
- Respond like an automotive assistant focused on the user's situation and the car's likely problem. Action-first, confident, and helpful.

REASONING MODES:
1. "dashboard": For dashboard images. Focus ONLY on dashboard warnings, symbols, and fault messages. If fault text is visible, treat it as strong evidence. Combine icon and message if both present.
2. "visual_issue": For non-dashboard images (engine bay, tire, leak, smoke, battery, etc.). Focus on the visible issue. Do not hallucinate details. If unclear, be honest.
3. "symptom_based": For no-image cases (text/audio only). Reason from reported symptoms (clicking, vibration, rough idle, etc.). Use safety-first logic.
4. "mixed": For combined evidence (image + text/audio). Use all evidence together. Image is primary if clear; text/audio is supporting. If they agree, raise confidence. If they conflict, prioritize clearest direct evidence and mention uncertainty. Do not return generic fallback if evidence is strong enough.

RESPONSE STYLE EXAMPLES:
Provide "explanation" using structured, concise logic.
Example explanation:
1. Likely issue: Excessive exhaust smoke
2. Driving advice: Not recommended to continue driving
3. What to do now: Stop the car safely and avoid further driving until the issue is checked.
4. Possible cause: This may indicate oil burning, incomplete combustion, or another serious engine issue.
5. Best next step: Towing is the safest option if the smoke continues or the engine feels weak.
6. Note: This guidance is based on the visible symptoms and may need mechanic confirmation.

Return this exact schema:
{
  "mode": "standard",
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

  const FAST_ANSWER_PROMPT = `You are the EMERGENCY MECHANIC ADVISOR for carx.ai. You provide high-urgency, punchy automotive rescue advice.

CRITICAL EMERGENCY RULES:
1. REAL-WORLD TONE: Avoid robotic text. Talk like a real mechanic giving urgent advice over the phone. Use short, punchy, active sentences.
2. THE RED-LIGHT PRIORITY: Your "explanation" MUST start with a clear status: [STOP IMMEDIATELY] or [DRIVE WITH CAUTION].
3. IMMEDIATE DIAGNOSIS: Based ONLY on the visual evidence, identify the 2 most likely causes.
4. ACTION PLAN (NOW): Provide exactly 2 immediate steps the user must take right now.
5. VISUAL PROOF: Briefly reference the light/icon's appearance (e.g., "That red battery icon means...").
6. ULTRA-CONCISE: No long introductions or conclusions. Use Markdown bolding for emphasis. 

REQUIRED EXPLANATION STRUCTURE:
Status: [STATUS]
**The Problem**: [Brief diagnosis + Visual Proof]
**Can I Drive?**: [Immediate safety answer + Why]
**Check First**: [Step 1 of Action Plan]
**Next Step**: [Step 2 of Action Plan]

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

  const EXPERT_ANSWER_PROMPT = `You are the CONTEXT-AWARE DIAGNOSTIC INVESTIGATOR for carx.ai. You act as a Master Technician who treats every interaction as a systematic investigation.

CRITICAL INVESTIGATOR RULES:
1. ACTIVE LISTENING & TRUTH: Treat all user inputs as absolute technical truth. If a user says "No noise" or "No leak", you must explicitly rule out mechanical failures related to those symptoms and pivot your investigation to other systems (e.g., electrical or fluids) immediately.
2. THE REALITY CHECK: Every response MUST start by acknowledging the user's previous answer/selection. (Example: "Noted. Since everything sounds normal, that points us more towards an electrical sensor issue rather than a mechanical failure. Let's check...").
3. ONE QUESTION, ONE GOAL: Do not provide a final solution until you have interacted at least 2 or 3 times (check your message history). Each turn must feel like you are "digging deeper" based on the ongoing conversation.
4. VISUAL-VERBAL SYNC: Continuously reference the uploaded photo in context with the conversation. (Example: "Looking at that orange Check Engine light again, and knowing there's no noise, I suspect a faulty O2 sensor. Do you feel any loss of power?").
5. DYNAMIC REPORTING: No pre-written templates. The "explanation" must be a synthesized summary of the specific conversation history and the visual evidence from the photo.
6. SEQUENTIAL DIAGNOSTICS: Ask ONLY ONE highly-relevant question at a time.
7. INTERACTIVE QUICK-REPLIES: Every question MUST include 3-4 specific "Quick Reply" buttons (options) representing potential user answers.

CRITICAL TONE RULES:
- Friendly Master Technician mentor tone.
- Concise dialogue, simple terms, no long paragraphs.
- Use Markdown (bold text, emojis) for clarity.
- STRICTLY AVOID HTML TAGS (no <strong>, <div>, etc.).

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
  "followup_questions": [
    {
      "question": string,
      "options": string[]
    }
  ],
  "recommended_checks": string[],
  "tow_recommended": boolean
}

Note on followup_questions: The array MUST contain exactly one object if needs_followup is true. That object must contain exactly 3 to 4 selectable options.`;

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
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        ...openAiPayload,
        stream: false, // force non-stream for stable JSON
      }),
    });

    const rawText = await response.text();

    logger.info({ event: 'openai_chat_response', status: response.status, rawPreview: rawText.slice(0, 500) });

    if (!response.ok) {
      let parsedError: any = null;
      try {
        parsedError = JSON.parse(rawText);
      } catch {
        parsedError = { error: rawText || 'Unknown OpenAI error' };
      }

      logger.error({ event: 'openai_chat_error', parsedError });
      return res.status(response.status).json(parsedError);
    }

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      logger.error({ event: 'chat_parse_error_raw' }, parseErr);

      return res.status(502).json({
        error: 'Invalid JSON returned from OpenAI proxy layer',
        details: rawText.slice(0, 2000),
      });
    }

    // Extract final assistant content safely
    const finalContent = data?.choices?.[0]?.message?.content;

    if (!finalContent) {
      logger.error({ event: 'chat_missing_content', data });
      return res.status(502).json({
        error: 'Missing assistant content from OpenAI response',
      });
    }

    // Make sure assistant content itself is valid JSON
    let validatedContent: any;
    try {
      validatedContent = typeof finalContent === 'string'
        ? JSON.parse(finalContent)
        : finalContent;
    } catch (contentErr: any) {
      logger.error({ event: 'chat_invalid_assistant_json', finalContent });

      return res.status(502).json({
        error: 'Assistant content was not valid JSON',
        details: typeof finalContent === 'string' ? finalContent.slice(0, 2000) : finalContent,
      });
    }

    logger.info({ event: 'chat_success', userId: user.id });
    return res.status(200).json({
      content: validatedContent
    });
  } catch (error: any) {
    logger.error({ event: 'chat_proxy_error', errorMsg: error.message }, error);

    if (!res.writableEnded) {
      return res.status(500).json({
        error: error.message || 'Unknown proxy error',
        diagnosticCode: 'FETCH_INVOCATION_FAILED',
        details: 'Expert diagnostic engine encountered an internal issue.'
      });
    }
  }
}
