import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { sendEmail } from '@/lib/email/client';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

/**
 * POST /api/team/invite
 *
 * Only owners and admins can invite. Creates pending invitation
 * + sends email with accept link (token-based).
 */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

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

  // Check inviter has owner or admin role
  const { data: inviterRow } = await svc
    .from('memberships')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const inviterRole = (inviterRow as { role: string } | null)?.role;
  if (inviterRole !== 'owner' && inviterRole !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can invite' }, { status: 403 });
  }

  // Get org for email branding
  const { data: orgRow } = await svc
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .maybeSingle();
  const orgName = (orgRow as { name: string } | null)?.name ?? 'your team';

  // Generate token + expiry (7 days)
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Insert invitation (idempotent on org_id+email pending)
  const { error: insertErr } = await svc
    .from('invitations')
    .upsert(
      {
        org_id: orgId,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        token,
        invited_by: user.id,
        expires_at: expiresAt,
      } as never,
      { onConflict: 'org_id,email' },
    );

  if (insertErr) {
    console.error('[team/invite] insert failed:', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Send email
  const appUrl = serverEnv.NEXT_PUBLIC_APP_URL || 'https://operatoraiapp.com';
  const acceptUrl = `${appUrl}/invite/${token}`;
  const inviterName =
    (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'A teammate';

  try {
    await sendEmail({
      to: parsed.data.email,
      subject: `${inviterName} te invita a ${orgName} en Operator AI`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background: #0A0A0A; color: #F5F5F5; padding: 40px 24px;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 18px; font-weight: 600;">Operator <span style="color: #C9A863;">AI</span></span>
    </div>
    <div style="background: #141414; border: 1px solid #2A2A2A; border-radius: 12px; padding: 32px;">
      <h1 style="font-size: 22px; margin: 0 0 16px 0;">Te han invitado a ${orgName}</h1>
      <p style="color: #A0A0A0; line-height: 1.6;"><strong>${inviterName}</strong> te invita a colaborar en <strong>${orgName}</strong> en Operator AI con rol <strong style="color: #C9A863;">${parsed.data.role}</strong>.</p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background: #C9A863; color: #0A0A0A; text-decoration: none; border-radius: 8px; font-weight: 600;">Aceptar invitación →</a>
      </div>
      <p style="color: #707070; font-size: 12px; line-height: 1.5;">Este link expira en 7 días. Si no esperabas esta invitación, ignora este email.</p>
    </div>
  </div>
</body>
</html>`,
      text: `${inviterName} te invita a ${orgName} en Operator AI con rol ${parsed.data.role}.\n\nAcepta aquí: ${acceptUrl}\n\nLink expira en 7 días.`,
    });
  } catch (e) {
    console.warn('[team/invite] email send failed:', e);
  }

  return NextResponse.json({ ok: true });
}
