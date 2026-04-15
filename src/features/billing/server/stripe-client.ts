import 'server-only';
import Stripe from 'stripe';
import { serverEnv } from '@/lib/env';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    if (!serverEnv.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    client = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return client;
}
