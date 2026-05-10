import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { autoClassifyDocument } from '@/lib/knowledge/auto-classify-document';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

export async function POST(req: NextRequest) {
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

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 400 });
  }

  const looksAllowedByExt = /\.(pdf|docx|txt|md|markdown|csv|json)$/i.test(file.name);
  if (!ALLOWED.has(file.type) && !looksAllowedByExt) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = orgId + '/' + Date.now() + '-' + sanitize(file.name);

  const { error: upErr } = await svc.storage
    .from('knowledge')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // PHASE 2: Auto-classify by filename + mime
  const classification = autoClassifyDocument({
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
  });

  const insertRow = {
    org_id: orgId,
    uploaded_by: user.id,
    storage_bucket: 'knowledge',
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    status: 'uploading',
    title: file.name.replace(/\.[^/.]+$/, ''),
    category: classification.category,
    subcategory: classification.subcategory,
    is_brand_asset: classification.is_brand_asset,
    importance: classification.importance,
  } as never;

  const { data: docRow, error: insErr } = await svc
    .from('documents')
    .insert(insertRow)
    .select('id')
    .single();

  if (insErr || !docRow) {
    await svc.storage.from('knowledge').remove([storagePath]);
    return NextResponse.json({ error: insErr?.message ?? 'Failed to create document' }, { status: 500 });
  }

  const documentId = (docRow as { id: string }).id;

  // Usage tracking for storage bytes
  await svc.rpc('increment_usage', {
    p_org_id: orgId,
    p_kind: 'document_storage_bytes',
    p_quantity: file.size,
    p_cost: 0,
  });

  return NextResponse.json({ id: documentId });
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
