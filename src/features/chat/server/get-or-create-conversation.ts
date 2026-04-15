import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

interface Input {
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  assistantId: string;
  conversationId?: string | null;
}

export async function getOrCreateConversation({
  svc, orgId, userId, assistantId, conversationId,
}: Input): Promise<{ id: string; isNew: boolean }> {
  if (conversationId) {
    const { data } = await svc
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (data) return { id: (data as { id: string }).id, isNew: false };
  }

  const insert = {
    org_id: orgId,
    assistant_id: assistantId,
    user_id: userId,
    title: null,
    last_message_at: new Date().toISOString(),
  } as never;

  const { data: created, error } = await svc
    .from('conversations')
    .insert(insert)
    .select('id')
    .single();

  if (error || !created) throw new Error(error?.message ?? 'Failed to create conversation');
  return { id: (created as { id: string }).id, isNew: true };
}
