import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { MissionsContent } from './missions-content';

export const dynamic = 'force-dynamic';

export default async function MissionsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  const { data: missions } = await svc
    .from('missions')
    .select('id, title, objective, category, status, progress, created_at, due_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  return <MissionsContent missions={(missions ?? []) as any} />;
}
