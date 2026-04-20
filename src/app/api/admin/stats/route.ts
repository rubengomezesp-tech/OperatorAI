import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user || !isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const svc = createSupabaseServiceClient();
    const [users, convos, images, fb] = await Promise.all([
      svc.auth.admin.listUsers({ page: 1, perPage: 1 }),
      svc.from('conversations').select('id', { count: 'exact', head: true }),
      svc.from('image_generations').select('id', { count: 'exact', head: true }),
      (svc as any).from('feedback').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    return NextResponse.json({
      stats: {
        users: users.data?.users?.length ?? 0,
        conversations: convos.count ?? 0,
        images: images.count ?? 0,
      },
      feedback: fb.data ?? [],
    });
  } catch {
    return NextResponse.json({ stats: { users: 0, conversations: 0, images: 0 }, feedback: [] });
  }
}
