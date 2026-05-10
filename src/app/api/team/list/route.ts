import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

/**
 * GET /api/team/list
 *
 * Returns members + pending invitations for current user's org.
 */
export async function GET() {
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

  // Fetch members
  const { data: rawMembers } = await svc
    .from('memberships')
    .select('id, user_id, role, status, created_at')
    .eq('org_id', orgId)
    .eq('status', 'active');

  type Member = { id: string; user_id: string; role: string; status: string; created_at: string };
  const members = (rawMembers as Member[] | null) ?? [];

  // Hydrate user emails (best-effort)
  const hydrated = await Promise.all(
    members.map(async (m) => {
      try {
        const { data } = await svc.auth.admin.getUserById(m.user_id);
        const u = data?.user;
        return {
          id: m.id,
          user_id: m.user_id,
          email: u?.email ?? '(unknown)',
          name: (u?.user_metadata?.full_name as string) ?? null,
          role: m.role,
          status: m.status,
          created_at: m.created_at,
          is_self: m.user_id === user.id,
        };
      } catch {
        return {
          id: m.id,
          user_id: m.user_id,
          email: '(unknown)',
          name: null,
          role: m.role,
          status: m.status,
          created_at: m.created_at,
          is_self: m.user_id === user.id,
        };
      }
    }),
  );

  // Pending invitations
  const { data: rawInvites } = await svc
    .from('invitations')
    .select('id, email, role, expires_at, created_at')
    .eq('org_id', orgId)
    .is('accepted_at', null);

  return NextResponse.json({
    members: hydrated,
    invitations: rawInvites ?? [],
  });
}
