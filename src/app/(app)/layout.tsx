import { PushNotificationPrompt } from '@/components/notifications/push-prompt';
import { AppFooter } from '@/components/layout/app-footer';
import { CommandPaletteProvider } from '@/features/command-palette/components/command-palette-provider';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveCurrentOrg } from '@/features/organizations/server/resolve';
import { AppShell } from '@/components/layout/app-shell';
import { OrgProvider } from '@/features/organizations/context/org-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');

  const { data: meRaw } = await db.from('users').select('full_name, email').eq('id', user.id).single();
  const me = meRaw as { full_name: string | null; email: string } | null;

  const { currentOrg, orgs } = await resolveCurrentOrg(user.id);
  if (!currentOrg) redirect('/create-organization');

  return (
    <OrgProvider initialOrg={currentOrg} initialOrgs={orgs}>
      <AppShell email={me?.email ?? user.email ?? ''} fullName={me?.full_name ?? null}>
        <CommandPaletteProvider>{children}
        <PushNotificationPrompt />
            <AppFooter /></CommandPaletteProvider>
      </AppShell>
    </OrgProvider>
  );
}
