import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { slugify } from '@/lib/utils';

/**
 * Ensures the org has at least one assistant. Returns its id.
 * For Week 2 we auto-create a generic default assistant on first chat.
 */
export async function ensureDefaultAssistant(
  svc: SupabaseClient,
  orgId: string,
  orgName: string,
): Promise<string> {
  const { data: existing } = await svc
    .from('assistants')
    .select('id')
    .eq('org_id', orgId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (existing) return (existing as { id: string }).id;

  const insert = {
    org_id: orgId,
    name: 'Creative Agent',
    slug: slugify(orgName || 'default') + '-agent',
    business_name: orgName || 'Business',
    languages: ['en', 'es'],
    is_default: true,
    is_active: true,
  } as never;

  const { data: created, error } = await svc
    .from('assistants')
    .insert(insert)
    .select('id')
    .single();

  if (error || !created) {
    throw new Error(error?.message ?? 'Failed to create default assistant');
  }
  return (created as { id: string }).id;
}
