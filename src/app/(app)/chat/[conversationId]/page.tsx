import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { ChatView } from '@/features/chat/components/chat-view';
import type { UiMessage } from '@/lib/chat/types';

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params;

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  const { data: conv } = await svc
    .from('conversations')
    .select('id, org_id, user_id')
    .eq('id', conversationId)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!conv) redirect('/chat');

  const { data: rows } = await svc
    .from('messages')
    .select('id, role, content, created_at, status, error_message, tool_parts')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  const messages: UiMessage[] = (rows ?? [])
    .filter((m) => {
      const role = (m as { role: string }).role;
      return role === 'user' || role === 'assistant';
    })
    .map((m) => {
      const row = m as {
        id: string; role: string; content: string | null;
        created_at: string; status: string | null; error_message: string | null;
        tool_parts: unknown;
      };
      return {
        id: row.id,
        role: row.role as 'user' | 'assistant',
        content: row.content ?? '',
        createdAt: row.created_at,
        status: (row.status as UiMessage['status']) ?? 'complete',
        error: row.error_message ?? undefined,
        toolParts: (row.tool_parts as UiMessage['toolParts']) ?? [],
      };
    });

  return <ChatView initialConversationId={conversationId} initialMessages={messages} />;
}
