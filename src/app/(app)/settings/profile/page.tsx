import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/features/profile/components/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? '';
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? '';

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Account</div>
        <h1 className="font-display text-[32px]">Profile</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">
          Manage how you appear in Operator AI.
        </p>
      </div>

      <ProfileForm
        email={user.email ?? ''}
        fullName={fullName}
        avatarUrl={avatar}
        userId={user.id}
      />
    </div>
  );
}
