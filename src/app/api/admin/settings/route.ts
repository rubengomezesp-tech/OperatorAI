import { NextResponse, type NextRequest } from 'next/server';
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
    const { data } = await (svc as any).from('app_settings').select('*').single();
    return NextResponse.json({ settings: data ?? {} });
  } catch {
    return NextResponse.json({ settings: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user || !isAdmin(user.email ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const svc = createSupabaseServiceClient();
    const { error } = await (svc as any).from('app_settings').upsert({
      id: 'global',
      support_email: body.support_email || null,
      support_url: body.support_url || null,
      announcement: body.announcement || null,
      announcement_active: body.announcement_active ?? false,
      maintenance_mode: body.maintenance_mode ?? false,
      maintenance_message: body.maintenance_message || null,
      default_model: body.default_model || 'gpt-4o',
      max_free_messages: body.max_free_messages ?? 50,
      max_free_images: body.max_free_images ?? 5,
      welcome_message: body.welcome_message || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
