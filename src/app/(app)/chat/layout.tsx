import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getDefaultAssistant, isAssistantConfigured } from '@/features/assistants/server/queries';
import { ensureDefaultAssistant } from '@/features/chat/server/ensure-assistant';
import { OperatorCoachTesterDevOnly } from '@/components/dev/operator-coach-tester';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  try {
    const svc = createSupabaseServiceClient();
    const { data: onboard } = await svc.from('onboarding_state').select('completed').eq('user_id', user.id).maybeSingle();
    if (!onboard || !onboard.completed) {
      redirect('/welcome');
    }
  } catch {}

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  // Auto-crear asistente si no existe (datos vienen de Brand OS, no necesita wizard)
  const assistant = await getDefaultAssistant(svc, orgId);
  if (!isAssistantConfigured(assistant)) {
    try {
      const { data: bp } = await svc
        .from('brand_profile')
        .select('brand_name')
        .eq('org_id', orgId)
        .maybeSingle();
      const orgName = (bp as { brand_name?: string } | null)?.brand_name ?? 'Business';
      await ensureDefaultAssistant(svc, orgId, orgName);
    } catch (e) {
      console.error('[chat/layout] auto-create assistant failed:', e);
      redirect('/welcome');
    }
  }

  return (
    <>
      {children}
      <OperatorCoachTesterDevOnly />
    </>
  );
}
