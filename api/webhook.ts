import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { logger } from './utils/logger.js';

// Stripe needs the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27.acacia' // Use the most recent stable version needed
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    logger.warn({ event: 'webhook_missing_signature_or_secret' });
    return res.status(400).send(`Webhook Error: Missing signature or webhook secret`);
  }

  let event: Stripe.Event;

  try {
    // Collect the raw body buffer to verify signature
    const buf = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      req.on('error', (err) => reject(err));
      req.on('end', () => resolve(Buffer.concat(chunks)));
    });

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    logger.warn({ event: 'webhook_signature_verification_failed' }, err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        logger.info({ event: 'webhook_checkout_completed', customerId: session.customer, sessionId: session.id });
        // Add your DB update logic here using Supabase Service Key
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logger.info({ event: 'webhook_subscription_deleted', subscriptionId: subscription.id });
        // Add your DB update logic here using Supabase Service Key
        break;
      }
      default:
        logger.info({ event: 'webhook_unhandled_event_type', type: event.type });
    }

    res.json({ received: true });
  } catch (err: any) {
    logger.error({ event: 'webhook_processing_error' }, err);
    res.status(500).send('Webhook handler failed');
  }
}
