import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { CodingRuntimeView } from '@/features/coding/components/coding-runtime-view';

export const dynamic = 'force-dynamic';

export default async function CodingPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <CodingRuntimeView isAdmin={isAdmin(user.email)} />;
}
