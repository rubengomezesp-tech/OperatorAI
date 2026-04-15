import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getDefaultAssistant, isAssistantConfigured } from '@/features/assistants/server/queries';
import { OnboardingWizard } from '@/features/assistants/components/onboarding-wizard';

export default async function SetupAssistantPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let orgId: string;
  let orgName: string;
  try {
    const ctx = await resolveOrgContext(svc, user.id);
    orgId = ctx.orgId;
    orgName = ctx.orgName;
  } catch {
    redirect('/create-organization');
  }

  const existing = await getDefaultAssistant(svc, orgId);
  if (existing && isAssistantConfigured(existing)) {
    // Already configured, skip
    redirect('/chat');
  }

  return (
    <OnboardingWizard
      mode="create"
      initial={{
        business_name: orgName || existing?.business_name || '',
        industry: existing?.industry ?? null,
        website: existing?.website ?? null,
        languages: existing?.languages ?? ['en'],
        audience: existing?.audience ?? null,
        services: existing?.services ?? [],
        goals: existing?.goals ?? [],
        tone: existing?.tone ?? [],
        writing_style: existing?.writing_style ?? null,
        banned_words: existing?.banned_words ?? [],
        custom_instructions: existing?.custom_instructions ?? null,
      }}
    />
  );
}
