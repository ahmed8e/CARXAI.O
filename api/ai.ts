import type { VercelRequest, VercelResponse } from '@vercel/node';
import chat from '../server-handlers/ai/chat.js';
import transcribe from '../server-handlers/ai/transcribe.js';
import speech from '../server-handlers/ai/speech.js';
import negotiate from '../server-handlers/ai/negotiate.js';
import aiOverpay from '../server-handlers/ai/ai-overpay.js';

export const maxDuration = 60;

const handlers = {
  chat,
  transcribe,
  speech,
  negotiate,
  'ai-overpay': aiOverpay,
} as const;

type AiAction = keyof typeof handlers;

function getAction(req: VercelRequest): AiAction | null {
  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  return action && action in handlers ? action as AiAction : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req);
  if (!action) {
    return res.status(404).json({ error: 'Unknown AI API action' });
  }

  return handlers[action](req, res);
}
