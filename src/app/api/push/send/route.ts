import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import webpush from 'web-push';

export const runtime = 'nodejs';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url } = await req.json();
    if (!userId || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails('mailto:rubengomezesp@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

    const svc = createSupabaseServiceClient();
    const { data: sub } = await (svc as any)
      .from('push_subscriptions')
      .select('endpoint, keys')
      .eq('user_id', userId)
      .single();

    if (!sub?.endpoint) return NextResponse.json({ error: 'No subscription' }, { status: 404 });

    const pushSub = { endpoint: sub.endpoint, keys: sub.keys };
    await webpush.sendNotification(pushSub, JSON.stringify({ title, body, url }));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[push-send]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
