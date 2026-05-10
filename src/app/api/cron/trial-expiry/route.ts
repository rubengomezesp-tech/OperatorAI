import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendEmail } from '@/lib/email/client';
import { trialEndingEmail } from '@/lib/email/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REMINDER_DAYS = [7, 3, 1];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  const now = new Date();

  const { data: trials, error } = await svc
    .from('subscriptions')
    .select('id, org_id, plan_id, current_period_end, trial_end, status')
    .eq('status', 'trialing');

  if (error) {
    console.error('[cron/trial-expiry] fetch failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Sub = {
    id: string;
    org_id: string;
    plan_id: string;
    current_period_end: string | null;
    trial_end: string | null;
    status: string;
  };

  const subs = (trials ?? []) as Sub[];
  let remindersSent = 0;
  let expiredCount = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    const endDate = sub.trial_end || sub.current_period_end;
    if (!endDate) continue;

    const end = new Date(endDate);
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    try {
      if (daysLeft <= 0) {
        await svc
          .from('subscriptions')
          .update({ status: 'expired', updated_at: now.toISOString() } as never)
          .eq('id', sub.id);
        expiredCount++;
        continue;
      }

      if (REMINDER_DAYS.includes(daysLeft)) {
        const { data: members } = await svc
          .from('memberships')
          .select('user_id')
          .eq('org_id', sub.org_id)
          .eq('role', 'owner')
          .limit(1);

        type Member = { user_id: string };
        const ownerUserId = ((members as Member[] | null) ?? [])[0]?.user_id;
        if (!ownerUserId) continue;

        const { data: ownerData } = await svc.auth.admin.getUserById(ownerUserId);
        const owner = ownerData?.user;
        if (!owner?.email) continue;

        const userName =
          (owner.user_metadata?.full_name as string) ||
          owner.email.split('@')[0] ||
          'there';

        const tpl = trialEndingEmail({ userName, daysLeft });
        await sendEmail({
          to: owner.email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
        remindersSent++;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      errors.push(`${sub.id}: ${msg}`);
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    trials_checked: subs.length,
    reminders_sent: remindersSent,
    expired: expiredCount,
    errors,
  });
}
