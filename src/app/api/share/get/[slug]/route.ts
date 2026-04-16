import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const svc = createSupabaseServiceClient();

  const { data: share } = await svc
    .from('conversation_shares')
    .select('id, conversation_id, user_id, org_id, visibility, title, created_at, view_count')
    .eq('slug', slug)
    .is('revoked_at', null)
    .maybeSingle();

  if (!share) {
    return NextResponse.json({ error: 'Share not found or revoked' }, { status: 404 });
  }

  const row = share as {
    id: string;
    conversation_id: string;
    user_id: string;
    visibility: string;
    title: string | null;
    created_at: string;
    view_count: number;
  };

  if (row.visibility === 'private') {
    return NextResponse.json({ error: 'This share is private' }, { status: 403 });
  }

  // Increment view count (fire-and-forget)
  ((svc.from as any)('conversation_shares').update as any)({
    view_count: row.view_count + 1,
    last_viewed_at: new Date().toISOString(),
  }).eq('id', row.id).then(() => {}).catch(() => {});

  // Fetch messages
  const { data: messages } = await svc
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', row.conversation_id)
    .order('created_at', { ascending: true })
    .limit(200);

  // Fetch owner info
  const { data: userData } = await svc.auth.admin.getUserById(row.user_id);
  const ownerName = (userData?.user?.user_metadata?.full_name as string) ?? 'A user';

  return NextResponse.json({
    title: row.title,
    visibility: row.visibility,
    viewCount: row.view_count + 1,
    createdAt: row.created_at,
    ownerName,
    messages: messages ?? [],
  });
}
