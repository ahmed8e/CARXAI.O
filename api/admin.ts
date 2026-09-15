import type { VercelRequest, VercelResponse } from '@vercel/node';
import providers from '../server-handlers/admin/admin-providers.js';

const handlers = {
  providers,
} as const;

type AdminAction = keyof typeof handlers;

function getAction(req: VercelRequest): AdminAction | null {
  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  return action && action in handlers ? action as AdminAction : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req);
  if (!action) {
    return res.status(404).json({ error: 'Unknown admin API action' });
  }

  return handlers[action](req, res);
}
