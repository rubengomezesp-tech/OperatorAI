import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { findPlan, type PlanDefinition } from '@/features/billing/data/plans';
import { getActiveSubscription } from '@/features/billing/server/subscription';

export type UsageField = 'chat_messages' | 'image_generations' | 'video_generations';

interface UsageCounter {
  chat_messages: number;
  image_generations: number;
  video_generations: number;
  period_start: string;
  period_end: string;
}

interface UsageResult {
  ok: boolean;
  used: number;
  limit: number;
  remaining: number;
  planId: string | null;
  reason?: string;
}

/**
 * Check si una org puede consumir 1 unidad de un recurso.
 * NO incrementa el contador. Llama a `incrementUsage` después si el caller efectivamente consumió.
 */
export async function checkUsage(orgId: string, field: UsageField): Promise<UsageResult> {
  const svc = createSupabaseServiceClient();

  const sub = await getActiveSubscription(svc, orgId);
  const planId = sub?.planId ?? null;

  // Sin suscripción → bloqueado completo
  if (!planId) {
    return {
      ok: false,
      used: 0,
      limit: 0,
      remaining: 0,
      planId: null,
      reason: 'no_subscription',
    };
  }

  const plan = findPlan(planId);
  if (!plan) {
    return { ok: false, used: 0, limit: 0, remaining: 0, planId, reason: 'unknown_plan' };
  }

  const limit = getQuotaForField(plan, field);

  // Get counter del mes
  const { data } = await (svc as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        eq: (k: string, v: string) => {
          gte: (k: string, v: string) => {
            order: (k: string, opts: { ascending: boolean }) => {
              limit: (n: number) => {
                maybeSingle: () => Promise<{ data: UsageCounter | null }>;
              };
            };
          };
        };
      };
    };
  })
    .from('usage_counters')
    .select('*')
    .eq('org_id', orgId)
    .gte('period_end', new Date().toISOString())
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  const counter = data;
  const used = counter ? (counter[field] ?? 0) : 0;
  const remaining = Math.max(0, limit - used);
  const ok = used < limit;

  return {
    ok,
    used,
    limit,
    remaining,
    planId,
    reason: ok ? undefined : 'quota_exceeded',
  };
}

/**
 * Incrementar el contador de uso. Idempotent en el sentido de la BBDD.
 * Llama después de consumir el recurso (nunca antes).
 */
export async function incrementUsage(orgId: string, field: UsageField, amount = 1): Promise<void> {
  const svc = createSupabaseServiceClient();
  await (svc as unknown as { rpc: (fn: string, args: object) => Promise<unknown> }).rpc(
    'increment_usage',
    { p_org_id: orgId, p_field: field, p_amount: amount }
  );
}

function getQuotaForField(plan: PlanDefinition, field: UsageField): number {
  switch (field) {
    case 'chat_messages':
      return plan.quotas.chatMessages;
    case 'image_generations':
      return plan.quotas.imageGenerations;
    case 'video_generations':
      return plan.quotas.videoGenerations;
  }
}

/**
 * Helper que combina check + increment. Lanza error si bloqueado.
 * Útil para wrappear llamadas en endpoints.
 */
export async function consumeUsage(
  orgId: string,
  field: UsageField,
  amount = 1
): Promise<UsageResult> {
  const check = await checkUsage(orgId, field);
  if (!check.ok) return check;
  await incrementUsage(orgId, field, amount);
  return { ...check, used: check.used + amount, remaining: check.remaining - amount };
}
