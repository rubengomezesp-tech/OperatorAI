import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1),
  category: z.enum(['brand', 'business', 'customers', 'content', 'other']),
  subcategory: z.string().optional().nullable(),
  is_brand_asset: z.boolean().optional(),
  importance: z.number().int().min(1).max(5).optional(),
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

  const updates: Record<string, unknown> = {
    category: parsed.data.category,
    // Auto-flag is_brand_asset based on category if not explicit
    is_brand_asset: parsed.data.is_brand_asset ?? parsed.data.category === 'brand',
  };

  if (parsed.data.subcategory !== undefined) {
    updates.subcategory = parsed.data.subcategory;
  }
  if (parsed.data.importance !== undefined) {
    updates.importance = parsed.data.importance;
  }

  const { error } = await svc
    .from('documents')
    .update(updates as never)
    .eq('id', parsed.data.id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
