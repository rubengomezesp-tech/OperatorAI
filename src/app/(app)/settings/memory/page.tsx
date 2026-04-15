import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { listActiveMemories } from '@/features/memory/server/queries';
import { MemoryView } from '@/features/memory/components/memory-view';

export default async function MemoryPage() {
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

  const memories = await listActiveMemories(svc, orgId, user.id, 200);

  const { data: fpRow } = await svc
    .from('voice_fingerprints')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] w-full mx-auto">
      <MemoryView initialMemories={memories} initialFingerprint={fpRow as never} />
    </div>
  );
}
