import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { executeTool } from '@/features/integrations/server/composio-client';
import { findIntegration } from '@/features/integrations/data/catalog';

export const runtime = 'nodejs';

const BodySchema = z.object({
  provider: z.string().min(1),
  actionName: z.string().min(1),
  input: z.record(z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const provider = findIntegration(parsed.data.provider);
  if (!provider) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });

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

  const { data: integ } = await svc
    .from('integrations')
    .select('composio_entity_id, status')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('provider', parsed.data.provider)
    .maybeSingle();

  const row = integ as { composio_entity_id: string | null; status: string } | null;
  if (!row || row.status !== 'connected' || !row.composio_entity_id) {
    return NextResponse.json({ error: 'Integration not connected' }, { status: 400 });
  }

  try {
    const result = await executeTool({
      entityId: row.composio_entity_id,
      appName: provider.composioName,
      actionName: parsed.data.actionName,
      input: parsed.data.input,
    });

    await svc
      .from('integrations')
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .eq('provider', parsed.data.provider);

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Tool failed' }, { status: 500 });
  }
}
