import 'server-only';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Organization } from '../types';

export async function resolveCurrentOrg(userId: string): Promise<{
  currentOrg: Organization | null;
  orgs: Organization[];
}> {
  const db = await createSupabaseServerClient();
  const { data: memberships } = await db
    .from('memberships')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  const orgs: Organization[] = [];
  for (const m of memberships ?? []) {
    const org = (m as unknown as { organizations: Organization | null }).organizations;
    if (org) orgs.push(org);
  }

  if (orgs.length === 0) return { currentOrg: null, orgs: [] };

  const cookieStore = await cookies();
  const preferred = cookieStore.get('operator.org_id')?.value;
  const currentOrg = (preferred && orgs.find((o) => o.id === preferred)) || orgs[0];
  return { currentOrg, orgs };
}
