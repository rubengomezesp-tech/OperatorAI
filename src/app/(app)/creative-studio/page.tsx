import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CreativeStudioView } from '@/features/creative-studio/components/creative-studio-view';

export const dynamic = 'force-dynamic';

export default async function CreativeStudioPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <CreativeStudioView />;
}
