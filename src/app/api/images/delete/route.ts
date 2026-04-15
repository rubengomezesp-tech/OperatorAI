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

  const { data: img } = await svc
    .from('image_generations')
    .select('id, output_storage_paths')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .maybeSingle();
  if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const imgRow = img as { id: string; output_storage_paths: string[] | null };

  if (imgRow.output_storage_paths?.length) {
    await svc.storage.from('image-outputs').remove(imgRow.output_storage_paths).catch(() => {});
  }
  await svc.from('image_generations').delete().eq('id', imgRow.id).eq('org_id', orgId);

  return NextResponse.json({ ok: true });
}
