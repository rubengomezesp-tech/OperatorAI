import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getStripe } from '@/features/billing/server/stripe-client';
import { getActiveSubscription } from '@/features/billing/server/subscription';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

const BodySchema = z.object({ planId: z.enum(['starter', 'pro', 'studio', 'agency']) });

// Map plan IDs to env var price IDs
function getPriceId(planId: string): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    studio: process.env.STRIPE_PRICE_STUDIO,
    agency: process.env.STRIPE_PRICE_AGENCY,
  };
  return map[planId] ?? null;
}

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const planId = parsed.data.planId;

  // Studio and Agency without price → contact sales
  const priceId = getPriceId(planId);
  if (!priceId) {
    return NextResponse.json({ error: 'This plan requires contacting sales. Email sales@operatorai.app' }, { status: 400 });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string; let orgName: string;
  try {
    const ctx = await resolveOrgContext(svc, user.id);
    orgId = ctx.orgId; orgName = ctx.orgName;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const stripe = getStripe();
  const sub = await getActiveSubscription(svc, orgId);

  let customerId = sub?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: orgName,
      metadata: { org_id: orgId, user_id: user.id },
    });
    customerId = customer.id;
    if (sub) {
      await svc.from('subscriptions').update({ stripe_customer_id: customerId } as never).eq('id', sub.id);
    }
  }

  const appUrl = serverEnv.NEXT_PUBLIC_APP_URL ?? 'https://www.operatoraiapp.com';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl + '/billing/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: appUrl + '/billing?canceled=1',
    subscription_data: { metadata: { org_id: orgId, plan_id: planId } },
    metadata: { org_id: orgId, plan_id: planId },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return NextResponse.json({ url: session.url });
}
