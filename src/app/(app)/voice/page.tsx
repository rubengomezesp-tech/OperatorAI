import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VoiceConversation } from '@/features/voice/components/voice-conversation';

export default async function VoicePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <VoiceConversation />;
}
