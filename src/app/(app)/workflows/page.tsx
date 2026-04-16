import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { WorkflowsView } from '@/features/workflows/components/workflows-view';

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] w-full mx-auto">
      <WorkflowsView />
    </div>
  );
}
