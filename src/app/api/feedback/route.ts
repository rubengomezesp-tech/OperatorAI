import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messageId, conversationId, type, content, comment } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    }

    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();

    const svc = createSupabaseServiceClient();

    const { error } = await svc.from('feedback').insert({
      user_id: user?.id ?? null,
      message_id: messageId ?? null,
      conversation_id: conversationId ?? null,
      feedback_type: type,
      message_preview: (content ?? '').substring(0, 500),
      comment: comment ?? null,
    } as never);

    if (error) {
      console.log('[feedback]', { type, messageId, comment: comment?.substring(0, 200) });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[feedback] error:', e);
    return NextResponse.json({ ok: true });
  }
}
