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

  const { data: target } = await svc
    .from('brand_profile')
    .select('id, org_id' as never)
    .eq('id' as never, parsed.data.brand_id as never)
    .eq('org_id', orgId)
    .maybeSingle();

  if (!target) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

  await svc
    .from('brand_profile')
    .update({ is_active: false } as never)
    .eq('org_id', orgId);

  const { error } = await svc
    .from('brand_profile')
    .update({ is_active: true, updated_at: new Date().toISOString() } as never)
    .eq('id' as never, parsed.data.brand_id as never)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
