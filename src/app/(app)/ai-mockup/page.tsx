/**
 * /ai-mockup
 *
 * Mockup studio — applies brand assets (logo, colors) to product
 * mockups using AI. Wraps MockupStudioView from the feature module.
 */

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { MockupStudioView } from '@/features/ai-mockup/components/mockup-studio-view';

export const dynamic = 'force-dynamic';

export default async function MockupStudioPage() {
  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <MockupStudioView />;
}
