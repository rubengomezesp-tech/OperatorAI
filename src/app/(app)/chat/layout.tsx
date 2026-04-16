import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getDefaultAssistant, isAssistantConfigured } from '@/features/assistants/server/queries';
import { ConversationsRail } from '@/features/chat/components/conversations-rail';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');
  // Onboarding guard — redirect to welcome if not completed
  try {
    const svc = createSupabaseServiceClient();
    const { data: onboard } = await svc.from('onboarding_state').select('completed').eq('user_id', user.id).maybeSingle();
    if (!onboard || !onboard.completed) {
      redirect('/welcome');
    }
  } catch { /* non-fatal — let user through */ }


  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  const assistant = await getDefaultAssistant(svc, orgId);
  if (!isAssistantConfigured(assistant)) {
    redirect('/setup-assistant');
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <ConversationsRail />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
