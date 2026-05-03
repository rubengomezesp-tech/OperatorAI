import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { findPlan } from '@/features/billing/data/plans';
import { getActiveSubscription } from '@/features/billing/server/subscription';

export const runtime = 'nodejs';

interface UsageRow {
  chat_messages: number;
  image_generations: number;
  video_generations: number;
  period_start: string;
  period_end: string;
}

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    const sub = await getActiveSubscription(svc, orgId);
    const plan = sub?.planId ? findPlan(sub.planId) : null;

    const { data: usage } = await (svc as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => {
            gte: (k: string, v: string) => {
              order: (k: string, opts: { ascending: boolean }) => {
                limit: (n: number) => {
                  maybeSingle: () => Promise<{ data: UsageRow | null }>;
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

    return NextResponse.json({
      plan: plan ? {
        id: plan.id,
        name: plan.name,
        priceDisplay: plan.priceDisplay,
        quotas: plan.quotas,
      } : null,
      subscription: sub ? {
        status: sub.status,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialEnd: sub.trialEndsAt ?? null,
      } : null,
      usage: {
        chat_messages: usage?.chat_messages ?? 0,
        image_generations: usage?.image_generations ?? 0,
        video_generations: usage?.video_generations ?? 0,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
