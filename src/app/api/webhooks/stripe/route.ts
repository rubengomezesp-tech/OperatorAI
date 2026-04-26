/**
 * POST /api/webhooks/stripe
 *
 * Stripe webhook handler with idempotency protection.
 *
 * Idempotency:
 *   Stripe automatically retries webhooks if our response is slow or
 *   non-2xx. Without idempotency, retries cause double-processing.
 *
 *   We track processed event IDs in `stripe_events_processed` table.
 *   When Stripe retries, we recognize the event ID and skip processing
 *   while still returning 200 (so Stripe stops retrying).
 *
 * NOTE: This route requires the migration:
 *   supabase/migrations/20260425_stripe_events.sql
 *
 * Without that migration, idempotency falls back to "best effort"
 * (no DB tracking, but webhook still works for new events).
 */

import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/features/billing/server/stripe-client';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  // ── 1. Verify signature ──────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[stripe-webhook] verify failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  // ── 2. Idempotency check ─────────────────────────────────────
  // Try to insert event ID. If duplicate, we've seen it before.
  // Using `(svc as any)` because stripe_events_processed table may
  // not be in generated types yet (migration just applied).
  let alreadyProcessed = false;
  try {
    const { error: insertError } = await (svc as any)
      .from('stripe_events_processed')
      .insert({
        event_id: event.id,
        event_type: event.type,
      });

    if (insertError) {
      // PostgreSQL unique violation = duplicate event
      // Code 23505 = unique_violation
      if (
        insertError.code === '23505' ||
        insertError.message?.includes('duplicate') ||
        insertError.message?.includes('unique')
      ) {
        alreadyProcessed = true;
        console.log('[stripe-webhook] duplicate event — already processed', {
          eventId: event.id,
          eventType: event.type,
        });
      } else {
        // Some other error — log but don't fail (fall back to best-effort)
        console.warn('[stripe-webhook] idempotency insert failed', {
          eventId: event.id,
          error: insertError.message,
          hint:
            'If error mentions "stripe_events_processed", apply migration 20260425_stripe_events.sql',
        });
      }
    }
  } catch (err) {
    console.warn('[stripe-webhook] idempotency check failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // If we've already processed this event, return 200 immediately
  // (Stripe will stop retrying once it gets a 2xx response).
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── 3. Process event ─────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        if (!orgId) break;
        if (session.customer && typeof session.customer === 'string') {
          await svc
            .from('subscriptions')
            .update({ stripe_customer_id: session.customer } as never)
            .eq('org_id', orgId);
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
          const { data: pr } = await svc
            .from('plans')
            .select('id')
            .eq('stripe_price_monthly_id', item.price.id)
            .maybeSingle();
          planId = (pr as { id: string } | null)?.id ?? null;
        }
        const pEnd = item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null;
        const pStart = item?.current_period_start
          ? new Date(item.current_period_start * 1000).toISOString()
          : null;
        const tEnd = sub.trial_end
          ? new Date(sub.trial_end * 1000).toISOString()
          : null;
        await svc
          .from('subscriptions')
          .update({
            plan_id: planId ?? 'pro',
            stripe_subscription_id: sub.id,
            stripe_customer_id:
              typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            stripe_price_id: item?.price?.id ?? null,
            status: sub.status,
            current_period_start: pStart,
            current_period_end: pEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
            trial_end: tEnd,
          } as never)
          .eq('org_id', orgId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        await svc
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          } as never)
          .eq('org_id', orgId);
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice & {
          subscription?: string | null;
        };
        if (inv.subscription && typeof inv.subscription === 'string') {
          await svc
            .from('subscriptions')
            .update({ status: 'past_due' } as never)
            .eq('stripe_subscription_id', inv.subscription);
        }
        break;
      }
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] processing failed', {
      eventId: event.id,
      eventType: event.type,
      error: err instanceof Error ? err.message : String(err),
    });

    // ── 4. Rollback idempotency on failure ─────────────────────
    // If processing failed, remove the event ID so Stripe's retry
    // can re-attempt it. Without this, a transient failure would
    // mark the event as "processed" forever.
    try {
      await (svc as any)
        .from('stripe_events_processed')
        .delete()
        .eq('event_id', event.id);
    } catch {
      // Ignore — best effort cleanup
    }

    return NextResponse.json(
      { error: 'Processing failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
