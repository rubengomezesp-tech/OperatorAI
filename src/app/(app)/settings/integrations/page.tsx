import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { IntegrationsView } from '@/features/integrations/components/integrations-view';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
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

  const { data } = await svc
    .from('integrations')
    .select('provider, status, connected_at, last_used_at')
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1080px] w-full mx-auto">
      <IntegrationsView initialIntegrations={(data as never) ?? []} />
    </div>
  );
}
