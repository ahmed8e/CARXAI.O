import type { VercelRequest, VercelResponse } from '@vercel/node';
import reports from '../server-handlers/user/reports.js';
import profile from '../server-handlers/user/profile.js';
import vehicles from '../server-handlers/user/vehicles.js';
import leads from '../server-handlers/user/leads.js';

const handlers = {
  reports,
  profile,
  vehicles,
  leads,
} as const;

type UserAction = keyof typeof handlers;

function getAction(req: VercelRequest): UserAction | null {
  const action = Array.isArray(req.query.action) ? req.query.action[0] : req.query.action;
  return action && action in handlers ? action as UserAction : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = getAction(req);
  if (!action) {
    return res.status(404).json({ error: 'Unknown user API action' });
  }

  return handlers[action](req, res);
}
