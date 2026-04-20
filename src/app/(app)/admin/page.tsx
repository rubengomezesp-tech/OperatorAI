import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email ?? '')) redirect('/dashboard');

  return <AdminDashboard />;
}
