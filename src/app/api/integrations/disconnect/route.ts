import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { disconnectAccount } from '@/features/integrations/server/composio-client';

export const runtime = 'nodejs';

const BodySchema = z.object({ provider: z.string().min(1) });

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

  const { data: existing } = await svc
    .from('integrations')
    .select('composio_connection_id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('provider', parsed.data.provider)
    .maybeSingle();

  const row = existing as { composio_connection_id: string | null } | null;
  if (row?.composio_connection_id) {
    try {
      await disconnectAccount(row.composio_connection_id);
    } catch { /* best effort */ }
  }

  await svc
    .from('integrations')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() } as never)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('provider', parsed.data.provider);

  return NextResponse.json({ ok: true });
}
