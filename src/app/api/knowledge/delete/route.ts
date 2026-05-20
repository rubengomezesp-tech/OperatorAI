import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1).optional(),
  documentId: z.string().min(1).optional(),
}).refine((body) => body.id || body.documentId, {
  message: 'Missing document id',
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid body' },
      { status: 400 },
    );
  }
  const documentId = parsed.data.id ?? parsed.data.documentId;
  if (!documentId) return NextResponse.json({ error: 'Missing document id' }, { status: 400 });

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

  // Fetch document — DON'T filter by deleted_at (allow re-delete attempts)
  const { data: doc, error: fetchErr } = await svc
    .from('documents')
    .select('id, storage_bucket, storage_path, deleted_at')
    .eq('id', documentId)
    .eq('org_id', orgId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[knowledge/delete] fetch error:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const d = doc as {
    id: string;
    storage_bucket: string;
    storage_path: string;
    deleted_at: string | null;
  };

  // Soft delete (idempotent — already deleted is fine)
  if (!d.deleted_at) {
    const { error: updErr } = await svc
      .from('documents')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', d.id)
      .eq('org_id', orgId);

    if (updErr) {
      console.error('[knowledge/delete] update error:', updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  // Hard delete chunks (best-effort, log but don't fail)
  const { error: chunkErr } = await svc
    .from('document_chunks')
    .delete()
    .eq('document_id', d.id)
    .eq('org_id', orgId);

  if (chunkErr) {
    console.warn('[knowledge/delete] chunks deletion failed (non-fatal):', chunkErr);
  }

  // Remove from storage (best-effort)
  try {
    await svc.storage.from(d.storage_bucket).remove([d.storage_path]);
  } catch (err) {
    console.warn('[knowledge/delete] storage removal failed (non-fatal):', err);
  }

  return NextResponse.json({ ok: true });
}
