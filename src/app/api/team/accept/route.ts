import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const BodySchema = z.object({
  token: z.string().min(20),
});

/**
 * POST /api/team/accept
 *
 * Accept invitation via token. User must be authenticated.
 * If user email matches invitation email, create active membership.
 */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();

  // Fetch invitation
  const { data: inviteRow } = await svc
    .from('invitations')
    .select('id, org_id, email, role, expires_at, accepted_at')
    .eq('token', parsed.data.token)
    .maybeSingle();

  type Invite = {
    id: string;
    org_id: string;
    email: string;
    role: string;
    expires_at: string;
    accepted_at: string | null;
  };
  const invite = inviteRow as Invite | null;

  if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  if (invite.accepted_at) {
    return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 });
  }

  // Verify email match (case insensitive)
  if ((user.email ?? '').toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      {
        error: `This invitation is for ${invite.email}. You're logged in as ${user.email}.`,
      },
      { status: 403 },
    );
  }

  // Create or activate membership
  const { error: msErr } = await svc
    .from('memberships')
    .upsert(
      {
        org_id: invite.org_id,
        user_id: user.id,
        role: invite.role,
        status: 'active',
        invited_by: null, // could be set if needed
        accepted_at: new Date().toISOString(),
      } as never,
      { onConflict: 'org_id,user_id' },
    );

  if (msErr) {
    console.error('[team/accept] membership upsert failed:', msErr);
    return NextResponse.json({ error: msErr.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await svc
    .from('invitations')
    .update({ accepted_at: new Date().toISOString(), accepted_by: user.id } as never)
    .eq('id', invite.id);

  return NextResponse.json({ ok: true, org_id: invite.org_id });
}
