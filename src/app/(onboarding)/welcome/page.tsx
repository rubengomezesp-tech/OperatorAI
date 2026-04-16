import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/features/onboarding/components/wizard';

export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <OnboardingWizard userEmail={user.email ?? ''} />;
}
