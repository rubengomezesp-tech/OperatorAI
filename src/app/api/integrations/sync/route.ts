import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getConnectionStatus } from '@/features/integrations/server/composio-client';

export const runtime = 'nodejs';

/**
 * POST /api/integrations/sync
 *
 * Sincroniza el status real desde Composio para una integration row.
 * Llamado por el frontend después de OAuth callback (?connected=xxx).
 *
 * Flow:
 *   1. Frontend ve ?connected=gcal&connected_account_id=ca_xxx en URL
 *   2. Frontend llama POST /api/integrations/sync { provider, connectedAccountId }
 *   3. Endpoint consulta Composio API: ¿está conectado?
 *   4. Si sí → update BD status='connected' + connected_at=now()
 *   5. Returns { status: 'connected' | 'pending' | 'error' }
 */

const BodySchema = z.object({
  provider: z.string().min(1),
  connectedAccountId: z.string().optional(),
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

  // Get integration row
  const { data: integ } = await svc
    .from('integrations')
    .select('composio_connection_id, status')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('provider', parsed.data.provider)
    .maybeSingle();

  const row = integ as { composio_connection_id: string | null; status: string } | null;
  if (!row || !row.composio_connection_id) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }

  // Use connectedAccountId from URL param if provided (Composio callback)
  // Otherwise use stored composio_connection_id
  const accountId = parsed.data.connectedAccountId || row.composio_connection_id;

  try {
    // Query Composio for real status
    const { status: composioStatus } = await getConnectionStatus(accountId);

    // Map Composio statuses to our internal ones
    // Composio: ACTIVE, INITIATED, FAILED, EXPIRED, INACTIVE, etc.
    let newStatus: 'connected' | 'pending' | 'error' | 'disconnected' = 'pending';
    const upper = composioStatus.toUpperCase();
    if (upper === 'ACTIVE') newStatus = 'connected';
    else if (upper === 'INITIATED' || upper === 'PENDING') newStatus = 'pending';
    else if (upper === 'FAILED' || upper === 'EXPIRED') newStatus = 'error';
    else if (upper === 'INACTIVE') newStatus = 'disconnected';

    // Update BD if status changed
    if (newStatus !== row.status) {
      const updates: Record<string, unknown> = {
        status: newStatus,
        composio_connection_id: accountId, // Update if it changed
        updated_at: new Date().toISOString(),
      };
      if (newStatus === 'connected') {
        updates.connected_at = new Date().toISOString();
      }

      await svc
        .from('integrations')
        .update(updates as never)
        .eq('org_id', orgId)
        .eq('user_id', user.id)
        .eq('provider', parsed.data.provider);
    }

    return NextResponse.json({
      status: newStatus,
      composioStatus,
    });
  } catch (e) {
    console.error('[integrations/sync] failed:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sync failed' },
      { status: 500 },
    );
  }
}
