import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { BrandOsForm } from '@/features/brand-os/components/brand-os-form';

export const dynamic = 'force-dynamic';

export default async function BrandOSPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let initial: Record<string, unknown> = {};
  try {
    const { orgId } = await resolveOrgContext(svc, user.id);
    const { data } = await (svc.from as any)('brand_os_rules')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();
    initial = (data as Record<string, unknown>) ?? {};
  } catch {}

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[820px] w-full mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">Operator AI</div>
        <h1 className="font-display text-[36px] leading-tight mb-3">Brand OS</h1>
        <p className="text-[14px] text-fg-muted max-w-[560px] leading-relaxed">
          The operating system of your brand. Operator enforces these rules on every output &mdash; copy, imagery, video. On-brand by default.
        </p>
      </div>
      <BrandOsForm initial={initial} />
    </div>
  );
}
