import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { initiateConnection } from '@/features/integrations/server/composio-client';
import {
  findIntegration,
  getAuthConfigIdForProvider,
  isProviderConnectable,
} from '@/features/integrations/data/catalog';
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

  // Check provider is configured (has auth_config_id env var set)
  if (!isProviderConnectable(provider.id)) {
    return NextResponse.json(
      {
        error: `${provider.name} is not yet configured on this server. Auth config missing.`,
        setup: true,
      },
      { status: 503 },
    );
  }

  const authConfigEnvVar = getAuthConfigIdForProvider(provider.id);
  const authConfigId = authConfigEnvVar
    ? (serverEnv as unknown as Record<string, string | undefined>)[authConfigEnvVar]
    : undefined;

  if (authConfigEnvVar && !authConfigId) {
    return NextResponse.json(
      {
        error: `${provider.name} auth config missing. Add ${authConfigEnvVar} in Vercel with the Composio auth config id (ac_...).`,
        setup: true,
        envVar: authConfigEnvVar,
        setupHint: `Create an OAuth auth config for ${provider.composioName} in Composio, then set ${authConfigEnvVar}=ac_... in Vercel Production.`,
      },
      { status: 503 },
    );
  }

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

  // Quota check (fixed by 0031 migration: pro plan now has integrations: 10)
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'integration' });
  const q = quota as { allowed: boolean } | null;
  if (q && !q.allowed) {
    return NextResponse.json({ error: 'Integration limit reached for your plan.' }, { status: 402 });
  }

  // userId for Composio v3 — orgId:userId composite (replaces v1 entityId)
  const userId = orgId + ':' + user.id;
  const callbackUrl = serverEnv.NEXT_PUBLIC_APP_URL + '/settings/integrations?connected=' + provider.id;

  try {
    const conn = await initiateConnection({
      userId,
      providerId: provider.id,
      callbackUrl,
    });

    // Upsert integration row (use connectedAccountId from v3 nano-id)
    await svc
      .from('integrations')
      .upsert({
        org_id: orgId,
        user_id: user.id,
        provider: provider.id,
        composio_connection_id: conn.connectedAccountId,
        composio_entity_id: userId,
        status: 'pending',
        scopes: provider.scopes,
        updated_at: new Date().toISOString(),
      } as never, { onConflict: 'org_id,user_id,provider' });

    return NextResponse.json({ redirectUrl: conn.redirectUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Connect failed';

    // Special handling for missing API key
    if (msg.includes('COMPOSIO_API_KEY')) {
      return NextResponse.json({
        error: 'Integrations not enabled on this server. Add COMPOSIO_API_KEY to environment.',
        setup: true,
      }, { status: 503 });
    }

    // Auth config missing
    if (msg.includes('auth config') || msg.includes('COMPOSIO_AUTH_CONFIG')) {
      const envVar = getAuthConfigIdForProvider(provider.id);
      return NextResponse.json({
        error: `${provider.name} auth config missing. Add ${envVar ?? 'the provider auth config env var'} in Vercel with the Composio auth config id (ac_...).`,
        setup: true,
        envVar,
      }, { status: 503 });
    }

    console.error('[integrations/connect] failed:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
