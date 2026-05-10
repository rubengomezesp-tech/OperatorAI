import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  brand_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { data: membership } = await svc
    .from('memberships')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  const role = (membership as { role: string } | null)?.role;
  if (role !== 'owner' && role !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can delete brands' }, { status: 403 });
  }

  const { data: allBrands } = await svc
    .from('brand_profile')
    .select('id, is_active' as never)
    .eq('org_id', orgId);

  type B = { id: string; is_active: boolean };
  const brands = (allBrands as B[] | null) ?? [];
  if (brands.length <= 1) {
    return NextResponse.json({ error: 'Cannot delete the only brand' }, { status: 400 });
  }

  const target = brands.find((b) => b.id === parsed.data.brand_id);
  if (!target) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  const { error } = await svc
    .from('brand_profile')
    .delete()
    .eq('id' as never, parsed.data.brand_id as never)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (target.is_active) {
    const next = brands.find((b) => b.id !== parsed.data.brand_id);
    if (next) {
      await svc
        .from('brand_profile')
        .update({ is_active: true } as never)
        .eq('id' as never, next.id as never);
    }
  }

  return NextResponse.json({ ok: true });
}
