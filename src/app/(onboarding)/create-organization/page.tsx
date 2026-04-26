/**
 * /create-organization — DEPRECATED
 *
 * This route used to be the entry point for new users.
 * Now we redirect to /welcome which has a unified premium wizard
 * (workspace + brand + vibe + first prompt + tour).
 *
 * Kept as a backwards-compat redirect so old bookmarks / email links
 * don't break.
 */
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function CreateOrgPage() {
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Send all users through the unified onboarding wizard
  redirect('/welcome');
}
