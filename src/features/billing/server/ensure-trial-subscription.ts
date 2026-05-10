import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TRIAL_DAYS } from '@/lib/billing/pricing';

/**
 * 🎁 TRIAL AUTO-PROVISION
 *
 * Crea una subscription en estado 'trialing' para una org
 * que acaba de completar onboarding.
 *
 * Defaults:
 *   - planId: 'pro' (les damos lo bueno durante el trial)
 *   - status: 'trialing'
 *   - trial_ends_at: now + TRIAL_DAYS
 *
 * Idempotente: si ya existe una subscription activa, NO crea otra.
 *
 * IMPORTANTE: esto desbloquea connectors + tools + image gen
 * inmediatamente al terminar onboarding. Sin esto, checkUsage
 * devuelve 'no_subscription' y todo se bloquea.
 */
export async function ensureTrialSubscription(
  svc: SupabaseClient,
  orgId: string,
  options: { planId?: 'starter' | 'pro' | 'studio' | 'agency' } = {},
): Promise<{ created: boolean; subscriptionId: string | null; reason?: string }> {
  const planId = options.planId ?? 'pro';

  // 1. Check if active subscription already exists (idempotent)
  const { data: existing } = await svc
    .from('subscriptions')
    .select('id, status')
    .eq('org_id', orgId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      created: false,
      subscriptionId: (existing as { id: string }).id,
      reason: 'already_has_subscription',
    };
  }

  // 2. Create trial subscription
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const periodStart = new Date();
  const periodEnd = trialEndsAt; // For trial, period_end = trial_ends_at

  const { data: created, error } = await svc
    .from('subscriptions')
    .insert({
      org_id: orgId,
      plan_id: planId,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    } as never)
    .select('id')
    .single();

  if (error) {
    console.error('[ensureTrialSubscription] insert failed:', error);
    return { created: false, subscriptionId: null, reason: error.message };
  }

  console.log(
    '[ensureTrialSubscription] ✅ trial created:',
    {
      orgId,
      planId,
      trialEndsAt: trialEndsAt.toISOString(),
      subscriptionId: (created as { id: string }).id,
    },
  );

  return {
    created: true,
    subscriptionId: (created as { id: string }).id,
  };
}
