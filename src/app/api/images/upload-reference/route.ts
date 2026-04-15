import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF allowed' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.match(/\.[^.]+$/)?.[0] ?? '.png').toLowerCase();
  const path = orgId + '/ref-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;

  const { error: upErr } = await svc.storage
    .from('image-references')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Return a 24h signed URL so Replicate can fetch it during generation
  const { data: signed, error: sErr } = await svc.storage
    .from('image-references')
    .createSignedUrl(path, 60 * 60 * 24);

  if (sErr || !signed) {
    await svc.storage.from('image-references').remove([path]).catch(() => {});
    return NextResponse.json({ error: sErr?.message ?? 'Signed URL failed' }, { status: 500 });
  }

  return NextResponse.json({
    path,
    url: signed.signedUrl,
  });
}
