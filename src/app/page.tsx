import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LandingPageClient } from './landing-client';

export default async function HomePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (user) redirect('/chat');
  return <LandingPageClient />;
}
