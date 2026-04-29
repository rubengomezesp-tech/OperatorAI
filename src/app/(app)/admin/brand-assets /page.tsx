import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { BrandAssetsManager } from './manager';

export const dynamic = 'force-dynamic';

export default async function BrandAssetsPage() {
  const db = await createSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdmin(user.email)) redirect('/chat');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Admin · Brand</div>
        <h1 className="font-display text-[32px] sm:text-[40px] tracking-tight mb-2">Brand Assets</h1>
        <p className="text-[14px] text-fg-muted">
          Sube y gestiona los logos, iconos y avatar de Operator AI.
        </p>
      </div>
      <BrandAssetsManager />
    </div>
  );
}
