import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 📦 ACCOUNT DATA EXPORT (GDPR Art. 20)
 *
 * GET /api/account/export
 *
 * Returns JSON with ALL user data:
 *   - Profile (auth.users)
 *   - Organizations (owned)
 *   - Memberships
 *   - Conversations + messages
 *   - Documents (metadata only — content available via /knowledge UI)
 *   - Campaigns
 *   - Brand profile
 *   - Integrations (sin secrets)
 *   - Memory entries
 *   - Subscriptions
 *
 * Security:
 *   - Auth required
 *   - Only own data (filter by user_id)
 *   - Sensitive fields stripped (composio_connection_id, embeddings)
 *
 * Response: application/json with Content-Disposition: attachment
 */

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  const userId = user.id;

  // Helper: safe select (returns [] on error)
  async function safeSelect<T>(
    table: string,
    columns: string,
    filter: Record<string, unknown>,
  ): Promise<T[]> {
    try {
      let query = svc.from(table as never).select(columns);
      for (const [k, v] of Object.entries(filter)) {
        query = query.eq(k as never, v as never);
      }
      const { data, error } = await query;
      if (error) {
        console.warn(`[export] ${table} error:`, error.message);
        return [];
      }
      return (data ?? []) as T[];
    } catch (e) {
      console.warn(`[export] ${table} threw:`, e);
      return [];
    }
  }

  // Get user's orgs first (for memberships)
  const memberships = await safeSelect<{ org_id: string; role: string }>(
    'memberships',
    'org_id, role, created_at',
    { user_id: userId },
  );

  const orgIds = memberships.map((m) => m.org_id);

  // Parallel fetch
  const [
    conversations,
    messages,
    documents,
    campaigns,
    brandProfiles,
    integrations,
    memory,
    subscriptions,
    organizations,
  ] = await Promise.all([
    safeSelect('conversations', 'id, title, created_at, updated_at, agent_type', {
      user_id: userId,
    }),
    safeSelect('messages', 'id, conversation_id, role, content, created_at', {
      user_id: userId,
    }),
    safeSelect(
      'documents',
      'id, title, file_name, mime_type, size_bytes, category, created_at',
      { user_id: userId },
    ),
    safeSelect(
      'campaigns',
      'id, name, vertical, campaign_type, created_at, updated_at',
      { user_id: userId },
    ),
    orgIds.length > 0
      ? svc
          .from('brand_profile')
          .select('org_id, brand_name, description, logo_url, created_at, updated_at')
          .in('org_id', orgIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    safeSelect(
      'integrations',
      'provider, status, scopes, connected_at, last_used_at',
      { user_id: userId },
    ),
    safeSelect('memory_entries', 'id, content, created_at', { user_id: userId }),
    orgIds.length > 0
      ? svc
          .from('subscriptions')
          .select('id, org_id, plan_id, status, current_period_end, trial_end')
          .in('org_id', orgIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    orgIds.length > 0
      ? svc
          .from('organizations')
          .select('id, name, created_at')
          .in('id', orgIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  const exportData = {
    export_info: {
      generated_at: new Date().toISOString(),
      user_id: userId,
      gdpr_compliance: 'Article 20 - Right to data portability',
      contact: 'hi@operatoraiapp.com',
    },
    profile: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      user_metadata: user.user_metadata,
    },
    organizations,
    memberships,
    subscriptions,
    brand_profiles: brandProfiles,
    conversations,
    messages,
    documents,
    campaigns,
    integrations,
    memory,
  };

  // Return as downloadable JSON
  const filename = `operator-ai-export-${userId.slice(0, 8)}-${Date.now()}.json`;
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
