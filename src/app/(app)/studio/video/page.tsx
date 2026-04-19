import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VideoStudio } from '@/features/video/components/video-studio';

export const dynamic = 'force-dynamic';

export default async function VideoStudioPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] w-full mx-auto">
      <VideoStudio />
    </div>
  );
}
