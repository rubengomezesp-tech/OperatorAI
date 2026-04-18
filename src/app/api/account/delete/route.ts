import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    const userId = user.id;

    await svc.from('messages').delete().eq('user_id', userId);
    await svc.from('conversations').delete().eq('user_id', userId);
    await svc.from('image_generations').delete().eq('user_id', userId);
    await (svc as any).from('feedback').delete().eq('user_id', userId);
    await (svc as any).from('documents').delete().eq('user_id', userId);
    await svc.auth.admin.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[delete-account]', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
