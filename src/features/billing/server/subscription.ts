import 'server-only';
import { hasLifetimeAccess } from '@/lib/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findPlan } from '../data/plans';

export interface SubscriptionSummary {
  id: string;
  orgId: string;
  planId: 'starter' | 'pro' | 'agency' | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getActiveSubscription(svc: SupabaseClient, orgId: string): Promise<SubscriptionSummary | null> {
  const { data } = await svc
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    id: string; org_id: string; plan_id: string | null; status: string;
    trial_end: string | null; current_period_end: string | null;
    cancel_at_period_end: boolean; stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };
  return {
    id: row.id, orgId: row.org_id,
    planId: row.plan_id as SubscriptionSummary['planId'],
    status: row.status as SubscriptionSummary['status'],
    trialEndsAt: row.trial_end,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

export function isSubscriptionActive(sub: SubscriptionSummary | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active' || sub.status === 'past_due') return true;
  if (sub.status === 'trialing') {
    if (!sub.trialEndsAt) return true;
    return new Date(sub.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

export function daysUntilTrialEnds(sub: SubscriptionSummary | null): number | null {
  if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return null;
  const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export interface QuotaCheck { allowed: boolean; used: number; limit: number; reason?: string; planId?: string; }

export async function checkQuota(svc: SupabaseClient, orgId: string, kind: 'chat_message' | 'image_generation' | 'knowledge_document' | 'assistant'): Promise<QuotaCheck> {
  const { data, error } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: kind });
  if (error) return { allowed: false, used: 0, limit: 0, reason: error.message };
  return data as QuotaCheck;
}

export function planDisplayName(planId: string | null, status: string): string {
  if (status === 'trialing') return (planId ? findPlan(planId)?.name : 'Pro') + ' Trial';
  if (!planId) return 'No plan';
  return findPlan(planId)?.name ?? planId;
}


/**
 * Check if org has unlimited access (CEO lifetime pass)
 */
export async function hasUnlimitedAccess(svc: import('@supabase/supabase-js').SupabaseClient, orgId: string): Promise<boolean> {
  const { data } = await svc
    .from('organization_members')
    .select('users!inner(email)')
    .eq('org_id', orgId)
    .limit(10);
  
  if (!data) return false;
  return data.some((m: any) => hasLifetimeAccess(m.users?.email));
}
