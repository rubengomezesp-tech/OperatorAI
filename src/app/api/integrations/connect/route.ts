import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { initiateConnection } from '@/features/integrations/server/composio-client';
import { findIntegration } from '@/features/integrations/data/catalog';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

const BodySchema = z.object({
  provider: z.string().min(1),
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

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'integration' });
  const q = quota as { allowed: boolean } | null;
  if (q && !q.allowed) {
    return NextResponse.json({ error: 'Integration limit reached for your plan.' }, { status: 402 });
  }

  const entityId = orgId + ':' + user.id;
  const callbackUrl = serverEnv.NEXT_PUBLIC_APP_URL + '/settings/integrations?connected=' + provider.id;

  try {
    const conn = await initiateConnection({
      entityId,
      appName: provider.composioName,
      redirectUrl: callbackUrl,
    });

    // Upsert integration row
    await svc
      .from('integrations')
      .upsert({
        org_id: orgId,
        user_id: user.id,
        provider: provider.id,
        composio_connection_id: conn.connectedAccountId,
        composio_entity_id: entityId,
        status: 'pending',
        scopes: provider.scopes,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: 'org_id,user_id,provider' });

    return NextResponse.json({ redirectUrl: conn.redirectUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Connect failed';
    if (msg.includes('COMPOSIO_API_KEY')) {
      return NextResponse.json({
        error: 'Integrations are not yet enabled on this server. Add COMPOSIO_API_KEY to environment.',
        setup: true,
      }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
