import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { ProfileHeader } from './profile-header';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? '';
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? '';

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <ProfileHeader />
      <ProfileForm
        email={user.email ?? ''}
        fullName={fullName}
        avatarUrl={avatar}
        userId={user.id}
      />
    </div>
  );
}
