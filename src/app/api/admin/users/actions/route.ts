import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { getStripe } from '@/features/billing/server/stripe-client';
import { logAudit } from '@/lib/admin/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) return null;
  return user;
}

interface OrgRow { id: string }
interface SubRow { stripe_customer_id: string | null; stripe_subscription_id: string | null }

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.action || !body?.userId) {
    return NextResponse.json({ error: 'Missing action or userId' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  switch (body.action) {
    case 'grant_plan': {
      // Dar plan manual sin pasar por Stripe (ej: regalo, beta tester)
      const planId = body.planId;
      if (!planId) return NextResponse.json({ error: 'Missing planId' }, { status: 400 });

      // Buscar org del user
      const { data: orgRaw } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: OrgRow | null }> } } } })
        .from('organizations')
        .select('id')
        .eq('owner_user_id', body.userId)
        .maybeSingle();

      if (!orgRaw) return NextResponse.json({ error: 'No org found' }, { status: 404 });

      // Upsert subscription manualmente
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await (svc as unknown as { from: (t: string) => { upsert: (data: object, opts: object) => Promise<{ error: { message: string } | null }> } })
        .from('subscriptions')
        .upsert({
          org_id: orgRaw.id,
          plan_id: planId,
          status: 'active',
          billing_interval: 'manual',
          current_period_end: oneYearFromNow,
        }, { onConflict: 'org_id' });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAudit({
        adminId: admin.id,
        adminEmail: admin.email ?? '',
        action: 'users.grant_plan',
        entityType: 'user',
        entityId: body.userId,
        details: body as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true });
    }

    case 'refund_last': {
      // Buscar el último invoice del customer y hacer refund
      const { data: subRaw } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: SubRow | null }> } } } })
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('org_id', body.orgId ?? '')
        .maybeSingle();

      if (!subRaw?.stripe_customer_id) return NextResponse.json({ error: 'No Stripe customer' }, { status: 404 });

      const stripe = getStripe();
      const charges = await stripe.charges.list({ customer: subRaw.stripe_customer_id, limit: 1 });
      if (!charges.data.length) return NextResponse.json({ error: 'No charges found' }, { status: 404 });

      const lastCharge = charges.data[0];
      const refund = await stripe.refunds.create({ charge: lastCharge.id });

      await logAudit({
        adminId: admin.id,
        adminEmail: admin.email ?? '',
        action: 'users.refund_last',
        entityType: 'user',
        entityId: body.userId,
        details: body as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true, refundId: refund.id, amount: refund.amount });
    }

    case 'ban': {
      // Soft ban: actualiza users con flag banned (asume que existe campo)
      const { error } = await (svc as unknown as { from: (t: string) => { update: (data: object) => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> } } })
        .from('users')
        .update({ banned: true, banned_at: new Date().toISOString(), banned_by: admin.id, ban_reason: body.reason ?? 'No reason given' })
        .eq('id', body.userId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAudit({
        adminId: admin.id,
        adminEmail: admin.email ?? '',
        action: 'users.ban',
        entityType: 'user',
        entityId: body.userId,
        details: body as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true });
    }

    case 'unban': {
      const { error } = await (svc as unknown as { from: (t: string) => { update: (data: object) => { eq: (k: string, v: string) => Promise<{ error: { message: string } | null }> } } })
        .from('users')
        .update({ banned: false, banned_at: null, banned_by: null, ban_reason: null })
        .eq('id', body.userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await logAudit({
        adminId: admin.id,
        adminEmail: admin.email ?? '',
        action: 'users.unban',
        entityType: 'user',
        entityId: body.userId,
        details: body as Record<string, unknown>,
      });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
