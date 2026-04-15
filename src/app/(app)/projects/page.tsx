import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { ProjectsView } from '@/features/projects/components/projects-view';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
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
    .from('projects')
    .select('id, name, description, color, sort_order, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('is_archived', false)
    .order('sort_order', { ascending: true });

  // Counts
  const { count: convCount } = await svc
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1080px] w-full mx-auto">
      <ProjectsView initialProjects={(data as never) ?? []} totalConversations={convCount ?? 0} />
    </div>
  );
}
