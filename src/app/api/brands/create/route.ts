import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  brand_name: z.string().min(1).max(120),
  description: z.string().optional(),
  logo_url: z.string().url().optional(),
  industry: z.string().optional(),
  set_active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Only owners and admins can create brands' }, { status: 403 });
  }

  if (parsed.data.set_active) {
    await svc
      .from('brand_profile')
      .update({ is_active: false } as never)
      .eq('org_id', orgId);
  }

  const { data: created, error } = await svc
    .from('brand_profile')
    .insert({
      org_id: orgId,
      brand_name: parsed.data.brand_name,
      description: parsed.data.description ?? null,
      logo_url: parsed.data.logo_url ?? null,
      industry: parsed.data.industry ?? null,
      is_active: parsed.data.set_active,
    } as never)
    .select('id, brand_name, is_active' as never)
    .single();

  if (error) {
    console.error('[brands/create] failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ brand: created });
}
