import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CreateView } from '@/features/create/components/create-view';

export const dynamic = 'force-dynamic';

export default async function CreatePage() {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');
  return <CreateView />;
}
