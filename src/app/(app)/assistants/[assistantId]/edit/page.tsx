import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getAssistantById } from '@/features/assistants/server/queries';
import { OnboardingWizard } from '@/features/assistants/components/onboarding-wizard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { assistantId: string };
}

export default async function EditAssistantPage({ params }: PageProps) {
  const { assistantId } = params;

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

  const a = await getAssistantById(svc, orgId, assistantId);
  if (!a) notFound();

  return (
    <div className="py-10 px-6">
      <OnboardingWizard
        mode="edit"
        existingId={a.id}
        initial={{
          name: a.name,
          business_name: a.business_name ?? '',
          industry: a.industry ?? null,
          website: a.website ?? null,
          languages: a.languages ?? ['en'],
          audience: a.audience ?? null,
          services: a.services ?? [],
          goals: a.goals ?? [],
          tone: a.tone ?? [],
          writing_style: a.writing_style ?? null,
          banned_words: a.banned_words ?? [],
          custom_instructions: a.custom_instructions ?? null,
        }}
      />
    </div>
  );
}
