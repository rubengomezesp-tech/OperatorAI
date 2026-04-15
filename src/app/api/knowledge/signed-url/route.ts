import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const QuerySchema = z.object({ id: z.string().min(1) });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ id: url.searchParams.get('id') ?? '' });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

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
    .select('storage_bucket, storage_path, original_name')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = doc as { storage_bucket: string; storage_path: string; original_name: string };

  const { data: signed, error } = await svc.storage
    .from(d.storage_bucket)
    .createSignedUrl(d.storage_path, 300);

  if (error || !signed) return NextResponse.json({ error: error?.message ?? 'Failed to sign' }, { status: 500 });
  return NextResponse.json({ url: signed.signedUrl, name: d.original_name });
}
