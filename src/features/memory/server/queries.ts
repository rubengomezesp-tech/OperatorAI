import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryRow {
  id: string;
  content: string;
  category: string;
  importance: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function listActiveMemories(svc: SupabaseClient, orgId: string, userId: string, limit = 50): Promise<MemoryRow[]> {
  const { data } = await svc
    .from('memories')
    .select('id, content, category, importance, source, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data as MemoryRow[] | null) ?? [];
}

export async function getRelevantMemories(svc: SupabaseClient, orgId: string, userId: string): Promise<MemoryRow[]> {
  // For v1, return top 20 by importance (same as list). Can be upgraded with embeddings later.
  return listActiveMemories(svc, orgId, userId, 20);
}

export function formatMemoriesBlock(memories: MemoryRow[]): string {
  if (memories.length === 0) return '';
  const lines: string[] = [
    '# What you know about this user (from prior conversations)',
    'Treat these as persistent context. Use them naturally when relevant.',
    'Do NOT list them back unless asked. Do NOT fabricate.',
    '',
  ];
  memories.forEach((m, i) => {
    lines.push('- [' + m.category + '] ' + m.content);
  });
  return lines.join('\n');
}
