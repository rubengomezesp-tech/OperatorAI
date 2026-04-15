import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/features/billing/server/stripe-client';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] verify failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (!orgId) break;
        if (session.customer && typeof session.customer === 'string') {
          await svc.from('subscriptions').update({ stripe_customer_id: session.customer } as never).eq('org_id', orgId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        let planId: string | null = sub.metadata?.plan_id ?? null;
        const item = sub.items.data[0];
        if (!planId && item?.price?.id) {
          const { data: pr } = await svc.from('plans').select('id').eq('stripe_price_monthly_id', item.price.id).maybeSingle();
          planId = (pr as { id: string } | null)?.id ?? null;
        }
        const pEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
        const pStart = item?.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null;
        const tEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
        await svc.from('subscriptions').update({
          plan_id: planId ?? 'pro',
          stripe_subscription_id: sub.id,
          stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
          stripe_price_id: item?.price?.id ?? null,
          status: sub.status,
          current_period_start: pStart,
          current_period_end: pEnd,
          cancel_at_period_end: sub.cancel_at_period_end,
          canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
          trial_end: tEnd,
        } as never).eq('org_id', orgId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        await svc.from('subscriptions').update({ status: 'canceled', canceled_at: new Date().toISOString() } as never).eq('org_id', orgId);
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (inv.subscription && typeof inv.subscription === 'string') {
          await svc.from('subscriptions').update({ status: 'past_due' } as never).eq('stripe_subscription_id', inv.subscription);
        }
        break;
      }
      default: break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
