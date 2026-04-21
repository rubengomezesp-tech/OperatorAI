import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { subscription } = await req.json();
    if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not auth' }, { status: 401 });

    const svc = createSupabaseServiceClient();
    await (svc as any).from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
