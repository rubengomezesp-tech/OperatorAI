import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ plan: 'Free', usage: null });
  }

  // Get plan
  const { data: sub } = await svc
    .from('subscriptions')
    .select('plan_id, status')
    .eq('org_id', orgId)
    .in('status', ['trialing', 'active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const planId = (sub as { plan_id: string | null } | null)?.plan_id ?? null;
  const planDisplay = planId
    ? planId.charAt(0).toUpperCase() + planId.slice(1)
    : 'Free';

  // Usage this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [chatCount, imageCount, videoCount] = await Promise.all([
    svc.from('usage_events').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('kind', 'chat_message')
      .gte('created_at', monthStart.toISOString()),
    svc.from('usage_events').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('kind', 'image_generation')
      .gte('created_at', monthStart.toISOString()),
    svc.from('videos').select('*', { count: 'exact', head: true })
      .eq('org_id', orgId).is('deleted_at', null)
      .gte('created_at', monthStart.toISOString()),
  ]);

  return NextResponse.json({
    plan: planDisplay,
    usage: {
      chat: chatCount.count ?? 0,
      images: imageCount.count ?? 0,
      videos: videoCount.count ?? 0,
    },
  });
}
