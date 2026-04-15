import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({ id: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: doc } = await svc
    .from('documents')
    .select('id, storage_bucket, storage_path')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = doc as { id: string; storage_bucket: string; storage_path: string };

  // Soft delete first
  await svc
    .from('documents')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', d.id)
    .eq('org_id', orgId);

  // Hard delete chunks (they carry no user-editable state)
  await svc.from('document_chunks').delete().eq('document_id', d.id).eq('org_id', orgId);

  // Remove from storage (best-effort)
  await svc.storage.from(d.storage_bucket).remove([d.storage_path]).catch(() => {});

  return NextResponse.json({ ok: true });
}
