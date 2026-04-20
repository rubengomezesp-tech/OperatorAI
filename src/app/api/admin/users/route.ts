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
    const { data: { users }, error } = await svc.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;

    const list = (users ?? []).map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name ?? null,
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at,
      provider: u.app_metadata?.provider ?? 'email',
    }));

    return NextResponse.json({ users: list });
  } catch (e) {
    return NextResponse.json({ users: [], error: String(e) });
  }
}
