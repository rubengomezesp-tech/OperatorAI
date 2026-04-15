import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { processDocument } from '@/features/knowledge/server/process-document';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  documentId: z.string().min(1),
});

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

  try {
    const result = await processDocument({ svc, orgId, documentId: parsed.data.documentId });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    await svc
      .from('documents')
      .update({ status: 'failed', processing_error: message } as never)
      .eq('id', parsed.data.documentId)
      .eq('org_id', orgId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
