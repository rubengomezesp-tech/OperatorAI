import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssistantProfile } from '../types';

export async function getDefaultAssistant(
  svc: SupabaseClient,
  orgId: string,
): Promise<AssistantProfile | null> {
  const { data } = await svc
    .from('assistants')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_default', true)
    .is('deleted_at', null)
    .maybeSingle();
  return (data as AssistantProfile | null) ?? null;
}

export async function getAssistantById(
  svc: SupabaseClient,
  orgId: string,
  assistantId: string,
): Promise<AssistantProfile | null> {
  const { data } = await svc
    .from('assistants')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', assistantId)
    .is('deleted_at', null)
    .maybeSingle();
  return (data as AssistantProfile | null) ?? null;
}

export async function listAssistants(
  svc: SupabaseClient,
  orgId: string,
): Promise<AssistantProfile[]> {
  const { data } = await svc
    .from('assistants')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  return (data as AssistantProfile[]) ?? [];
}

/**
 * Heuristic: an assistant is considered "configured" if at least one of
 * industry, audience, tone, or custom_instructions has meaningful content.
 */
export function isAssistantConfigured(a: AssistantProfile | null): boolean {
  if (!a) return false;
  const hasTone = Array.isArray(a.tone) && a.tone.length > 0;
  const hasAudience = !!(a.audience && a.audience.trim().length > 2);
  const hasIndustry = !!(a.industry && a.industry.trim().length > 0);
  const hasInstructions = !!(a.custom_instructions && a.custom_instructions.trim().length > 5);
  const hasServices = Array.isArray(a.services) && a.services.length > 0;
  return hasTone || hasAudience || hasIndustry || hasInstructions || hasServices;
}
