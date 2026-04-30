import { ChatView } from '@/features/chat/components/chat-view';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ChatPage() {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();

  let fullName = 'You';
  let avatarUrl: string | null = null;

  if (user) {
    const { data: profile } = await db
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    fullName = (profile as { full_name: string | null } | null)?.full_name ?? user.email ?? 'You';
    avatarUrl = (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ?? null;
  }

  return (
    <ChatView
      initialConversationId={null}
      currentUserName={fullName}
      currentUserAvatarUrl={avatarUrl}
    />
  );
}
