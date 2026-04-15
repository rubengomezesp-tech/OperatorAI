import 'server-only';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves current org from cookie or falls back to the user's first active membership.
 * Returns {orgId, orgName}. Throws if none found.
 */
export async function resolveOrgContext(
  svc: SupabaseClient,
  userId: string,
): Promise<{ orgId: string; orgName: string }> {
  const cookieStore = await cookies();
  const preferred = cookieStore.get('operator.org_id')?.value;

  const { data: memberships } = await svc
    .from('memberships')
    .select('org_id, organizations(id, name)')
    .eq('user_id', userId)
    .eq('status', 'active');

  const rows = (memberships ?? []) as unknown as Array<{
    org_id: string;
    organizations: { id: string; name: string } | null;
  }>;

  const orgs = rows.map((r) => r.organizations).filter(Boolean) as { id: string; name: string }[];
  if (orgs.length === 0) throw new Error('User has no active org membership');

  const chosen = (preferred && orgs.find((o) => o.id === preferred)) || orgs[0];
  return { orgId: chosen.id, orgName: chosen.name };
}
