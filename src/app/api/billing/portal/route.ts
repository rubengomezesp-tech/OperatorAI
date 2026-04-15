import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getStripe } from '@/features/billing/server/stripe-client';
import { getActiveSubscription } from '@/features/billing/server/subscription';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const sub = await getActiveSubscription(svc, orgId);
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: 'No billing account yet' }, { status: 400 });

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: serverEnv.NEXT_PUBLIC_APP_URL + '/settings/billing',
  });

  return NextResponse.json({ url: session.url });
}
