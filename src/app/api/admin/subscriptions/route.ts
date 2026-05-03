import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { findPlan } from '@/features/billing/data/plans';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SubRow {
  id: string;
  org_id: string;
  plan_id: string;
  status: string;
  billing_interval: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  organizations?: { name: string; owner_user_id: string } | null;
}

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const svc = createSupabaseServiceClient();

  // Lista completa con join a organizations
  const { data: subsRaw } = await (svc as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (k: string, opts: { ascending: boolean }) => Promise<{ data: SubRow[] | null }>;
      };
    };
  })
    .from('subscriptions')
    .select('*, organizations:org_id(name, owner_user_id)')
    .order('created_at', { ascending: false });

  const subs = subsRaw ?? [];

  // Métricas
  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneMonthAgo = new Date(now.getTime() - 30 * oneDayMs);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * oneDayMs);
  const oneDayFromNow = new Date(now.getTime() + oneDayMs);

  const active = subs.filter((s) => s.status === 'active').length;
  const trialing = subs.filter((s) => s.status === 'trialing').length;
  const canceled = subs.filter((s) => s.status === 'canceled' && s.canceled_at && new Date(s.canceled_at) >= oneMonthAgo).length;
  const pastDue = subs.filter((s) => s.status === 'past_due').length;

  // MRR (active + trialing si tarjeta validada)
  let mrrCents = 0;
  for (const s of subs) {
    if (s.status !== 'active' && s.status !== 'trialing') continue;
    const plan = findPlan(s.plan_id);
    if (!plan) continue;
    const isYearly = s.billing_interval === 'yearly';
    // Anual: dividir entre 12 para normalizar a MRR
    const monthlyCents = isYearly ? Math.round(plan.priceCents * 0.8) : plan.priceCents;
    mrrCents += monthlyCents;
  }

  // Distribución por plan
  const byPlan: Record<string, number> = {};
  for (const s of subs) {
    if (s.status === 'active' || s.status === 'trialing') {
      byPlan[s.plan_id] = (byPlan[s.plan_id] ?? 0) + 1;
    }
  }

  // Trials expirando
  const trialsExpiring24h = subs.filter((s) => {
    if (s.status !== 'trialing' || !s.trial_end) return false;
    const end = new Date(s.trial_end);
    return end > now && end <= oneDayFromNow;
  }).length;

  const trialsExpiring7d = subs.filter((s) => {
    if (s.status !== 'trialing' || !s.trial_end) return false;
    const end = new Date(s.trial_end);
    return end > now && end <= sevenDaysFromNow;
  }).length;

  // Conversion rate (paid actuales / [paid + canceled últimos 30d])
  const paidEver = subs.filter((s) => s.status === 'active' || (s.status === 'canceled' && s.canceled_at && new Date(s.canceled_at) >= oneMonthAgo)).length;
  const conversionRate = paidEver > 0 ? Math.round((active / paidEver) * 100) : 0;

  // Churn rate último mes
  const startOfMonth = subs.filter((s) => new Date(s.created_at) <= oneMonthAgo && (s.status === 'active' || s.status === 'canceled')).length;
  const churnRate = startOfMonth > 0 ? Math.round((canceled / startOfMonth) * 100) : 0;

  return NextResponse.json({
    metrics: {
      mrr: mrrCents / 100,
      active,
      trialing,
      pastDue,
      canceledLast30d: canceled,
      conversionRate,
      churnRate,
      trialsExpiring24h,
      trialsExpiring7d,
    },
    byPlan,
    subscriptions: subs.map((s) => ({
      id: s.id,
      orgId: s.org_id,
      orgName: s.organizations?.name ?? '—',
      planId: s.plan_id,
      status: s.status,
      interval: s.billing_interval,
      trialEnd: s.trial_end,
      periodEnd: s.current_period_end,
      cancelAtPeriodEnd: s.cancel_at_period_end,
      createdAt: s.created_at,
      stripeCustomerId: s.stripe_customer_id,
    })),
  });
}
