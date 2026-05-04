import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { KnowledgeView } from './knowledge-view';

export const dynamic = 'force-dynamic';

export default async function KnowledgePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <KnowledgeView />;
}
