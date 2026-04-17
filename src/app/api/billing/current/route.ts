import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getActiveSubscription } from '@/features/billing/server/subscription';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ planId: null });

    const svc = createSupabaseServiceClient();
    let orgId: string;
    try {
      orgId = (await resolveOrgContext(svc, user.id)).orgId;
    } catch {
      return NextResponse.json({ planId: null });
    }

    const sub = await getActiveSubscription(svc, orgId);
    if (!sub) return NextResponse.json({ planId: null });

    return NextResponse.json({
      planId: sub.planId,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch {
    return NextResponse.json({ planId: null });
  }
}
