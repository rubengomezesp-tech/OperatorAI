import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';
import { AdminDashboard } from './admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email)) redirect('/dashboard');

  const svc = createSupabaseServiceClient();

  // Fetch stats
  const [
    { count: userCount },
    { count: convCount },
    { count: imageCount },
    { data: feedback },
    { data: recentUsers },
  ] = await Promise.all([
    svc.from('users').select('*', { count: 'exact', head: true }),
    svc.from('conversations').select('*', { count: 'exact', head: true }),
    svc.from('image_generations').select('*', { count: 'exact', head: true }),
    (svc as any).from('feedback').select('id, feedback_type, message_preview, comment, created_at').order('created_at', { ascending: false }).limit(50),
    svc.from('users').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(20),
  ]);

  return (
    <AdminDashboard
      stats={{
        users: userCount ?? 0,
        conversations: convCount ?? 0,
        images: imageCount ?? 0,
      }}
      feedback={feedback ?? []}
      recentUsers={recentUsers ?? []}
    />
  );
}
