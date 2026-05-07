import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Perfil</h1>
      <p className="text-muted-foreground">
        Gestiona tu información de perfil desde aquí.
      </p>
    </div>
  );
}
