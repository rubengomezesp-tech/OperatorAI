import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FeedbackRow {
  id: string;
  kind: string;
  comment: string | null;
  rating: number | null;
  categories: string[] | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  user_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
}

async function checkAdmin() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user || !isAdmin(user.email ?? '')) return null;
  return user;
}

export async function GET() {
  const u = await checkAdmin();
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const svc = createSupabaseServiceClient();

  const { data: items } = await (svc as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (k: string, opts: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: FeedbackRow[] | null }>;
        };
      };
    };
  })
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  const list = items ?? [];

  // Stats
  const total = list.length;
  const resolved = list.filter((f) => f.resolved).length;
  const open = total - resolved;
  const positive = list.filter((f) => f.kind === 'up' || f.kind === 'love').length;
  const negative = list.filter((f) => f.kind === 'down' || f.kind === 'flag').length;
  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;

  return NextResponse.json({
    stats: { total, open, resolved, positive, negative, positivePct },
    items: list.map((f) => ({
      id: f.id,
      kind: f.kind,
      comment: f.comment,
      rating: f.rating,
      categories: f.categories ?? [],
      resolved: f.resolved,
      resolvedAt: f.resolved_at,
      createdAt: f.created_at,
      userId: f.user_id,
      conversationId: f.conversation_id,
      messageId: f.message_id,
    })),
  });
}

export async function POST(req: NextRequest) {
  const u = await checkAdmin();
  if (!u) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const svc = createSupabaseServiceClient();
  const update: Record<string, unknown> = {};

  if (typeof body.resolved === 'boolean') {
    update.resolved = body.resolved;
    update.resolved_at = body.resolved ? new Date().toISOString() : null;
    update.resolved_by = body.resolved ? u.id : null;
  }

  const { error } = await (svc as unknown as {
    from: (t: string) => {
      update: (data: object) => {
        eq: (k: string, v: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  })
    .from('feedback')
    .update(update)
    .eq('id', body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
