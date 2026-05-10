import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  membership_id: z.string().min(1).optional(),
  invitation_id: z.string().min(1).optional(),
});

/**
 * POST /api/team/remove
 *
 * Remove a member or cancel a pending invitation.
 * Only owners and admins can.
 */
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || (!parsed.data.membership_id && !parsed.data.invitation_id)) {
    return NextResponse.json({ error: 'membership_id or invitation_id required' }, { status: 400 });
  }

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

  // Verify caller has admin/owner role
  const { data: callerRow } = await svc
    .from('memberships')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const callerRole = (callerRow as { role: string } | null)?.role;
  if (callerRole !== 'owner' && callerRole !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can remove' }, { status: 403 });
  }

  // ─── Cancel pending invitation ───
  if (parsed.data.invitation_id) {
    const { error } = await svc
      .from('invitations')
      .delete()
      .eq('id', parsed.data.invitation_id)
      .eq('org_id', orgId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ─── Remove member ───
  // Get target membership
  const { data: targetRow } = await svc
    .from('memberships')
    .select('id, user_id, role')
    .eq('id', parsed.data.membership_id!)
    .eq('org_id', orgId)
    .maybeSingle();

  const target = targetRow as { id: string; user_id: string; role: string } | null;
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Can't remove last owner
  if (target.role === 'owner') {
    const { data: ownersList } = await svc
      .from('memberships')
      .select('id')
      .eq('org_id', orgId)
      .eq('role', 'owner')
      .eq('status', 'active');
    const ownerCount = ((ownersList as Array<{ id: string }> | null) ?? []).length;
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last owner. Transfer ownership first.' },
        { status: 400 },
      );
    }
  }

  // Admins can't remove owners
  if (callerRole === 'admin' && target.role === 'owner') {
    return NextResponse.json({ error: 'Admins cannot remove owners' }, { status: 403 });
  }

  const { error: delErr } = await svc
    .from('memberships')
    .delete()
    .eq('id', target.id)
    .eq('org_id', orgId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
