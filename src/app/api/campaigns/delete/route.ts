import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const BodySchema = z.object({ id: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();

  // Verify ownership before delete
  const { data: row, error: fetchErr } = await svc
    .from('campaigns' as never)
    .select('id, user_id')
    .eq('id', parsed.data.id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const r = row as { id: string; user_id: string };
  if (r.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Hard delete the campaign row
  // (Rendered images live in storage but are referenced from brain_output —
  //  cascading them needs more research. For now, we delete row, images
  //  remain orphaned in storage. TODO: cleanup job.)
  const { error: delErr } = await svc
    .from('campaigns' as never)
    .delete()
    .eq('id', parsed.data.id)
    .eq('user_id', user.id);

  if (delErr) {
    console.error('[campaigns/delete] failed:', delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
