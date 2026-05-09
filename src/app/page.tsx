import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LandingPageClient } from './landing-client';
import { InvocationWrapper } from '@/components/landing/invocation-wrapper';
import { DEFAULT_HOME_CONTENT, type HomeContent } from '@/lib/home-content/defaults';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

async function getHomeContent(): Promise<HomeContent> {
  try {
    const svc = createSupabaseServiceClient();
    const { data } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: { extra?: { home?: Partial<HomeContent> } } | null }> } } } })
      .from('app_settings')
      .select('extra')
      .eq('id', 'global')
      .maybeSingle();

    const extra = data?.extra ?? {};
    const overrides = extra.home ?? {};
    return { ...DEFAULT_HOME_CONTENT, ...overrides } as HomeContent;
  } catch {
    return DEFAULT_HOME_CONTENT;
  }
}

export default async function HomePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (user) redirect('/chat');

  const content = await getHomeContent();
  return (
    <InvocationWrapper>
      <LandingPageClient content={content} />
    </InvocationWrapper>
  );
}
