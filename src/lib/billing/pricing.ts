/**
 * Pricing config — mapeo de price_ids a planes e intervalos.
 *
 * Las price_ids vienen de env vars para no commit secrets:
 *   STRIPE_PRICE_STARTER_MONTHLY
 *   STRIPE_PRICE_STARTER_YEARLY
 *   STRIPE_PRICE_PRO_MONTHLY
 *   STRIPE_PRICE_PRO_YEARLY
 *   STRIPE_PRICE_STUDIO_MONTHLY
 *   STRIPE_PRICE_STUDIO_YEARLY
 *   STRIPE_PRICE_AGENCY_MONTHLY
 *   STRIPE_PRICE_AGENCY_YEARLY
 */

export type PlanId = 'starter' | 'pro' | 'studio' | 'agency';
export type Interval = 'monthly' | 'yearly';

export const TRIAL_DAYS = 3;

export function getPriceId(planId: PlanId, interval: Interval): string | null {
  const key = `STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key] ?? null;
}

/**
 * Reverse lookup: dado un price_id de Stripe, identificar el plan + intervalo.
 * Útil en el webhook para saber qué plan acaba de comprar el user.
 */
export function resolvePriceId(priceId: string): { planId: PlanId; interval: Interval } | null {
  const plans: PlanId[] = ['starter', 'pro', 'studio', 'agency'];
  const intervals: Interval[] = ['monthly', 'yearly'];
  for (const plan of plans) {
    for (const interval of intervals) {
      if (getPriceId(plan, interval) === priceId) return { planId: plan, interval };
    }
  }
  return null;
}
