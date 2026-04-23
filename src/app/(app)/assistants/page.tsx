import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { listAssistants } from '@/features/assistants/server/queries';
import { AssistantsContent } from './assistants-content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AssistantsPage() {
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();

  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  const assistants = await listAssistants(svc, orgId);

  return <AssistantsContent assistants={assistants as any} />;
}
