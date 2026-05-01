import { PushNotificationPrompt } from '@/components/notifications/push-prompt';
import { AppFooter } from '@/components/layout/app-footer';
import { CommandPaletteProvider } from '@/features/command-palette/components/command-palette-provider';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { BrandAssetsProvider } from '@/lib/brand-assets-context';
import { getBrandAssets } from '@/lib/brand-assets-server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveCurrentOrg } from '@/features/organizations/server/resolve';
import { AppShell } from '@/components/layout/app-shell';
import { OrgProvider } from '@/features/organizations/context/org-provider';
import { Aurora } from '@/components/ui/aurora';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  const { data: meRaw } = await db
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();
  const me = meRaw as { full_name: string | null; email: string } | null;

  // Check onboarding state — force /welcome if not completed
  const svc = createSupabaseServiceClient();
  const { data: onboardingRaw } = await svc
    .from('onboarding_state')
    .select('completed')
    .eq('user_id', user.id)
    .maybeSingle();
  const onboarding = onboardingRaw as { completed: boolean } | null;

  // If onboarding not completed (or no row exists), send to welcome wizard
  if (!onboarding || !onboarding.completed) {
    redirect('/welcome');
  }

  const { currentOrg, orgs } = await resolveCurrentOrg(user.id);
  if (!currentOrg) redirect('/welcome');

  // Fetch brand assets (logo, icon, avatar, bg) from Supabase Storage
  const brandAssets = await getBrandAssets();

  return (
    <OrgProvider initialOrg={currentOrg} initialOrgs={orgs}>
      <BrandAssetsProvider {...brandAssets}>
        <AppShell email={me?.email ?? user.email ?? ''} fullName={me?.full_name ?? null}>
        <CommandPaletteProvider>
          <div className="relative min-h-full bg-mesh">
            {/* Subtle global aurora — visible but never intrusive */}
            <Aurora intensity="medium" className="fixed inset-0 -z-10 pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
          <PushNotificationPrompt />
          <AppFooter />
        </CommandPaletteProvider>
      </AppShell>
      </BrandAssetsProvider>
    </OrgProvider>
  );
}
