import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  title: z.string().min(2).max(200),
  objective: z.string().min(10).max(2000),
  category: z.enum(['content', 'campaign', 'research', 'operations', 'growth']),
  autonomyLevel: z.enum(['review', 'auto', 'scheduled']),
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
    return NextResponse.json({ error: 'No workspace' }, { status: 403 });
  }

  const { data, error } = await (svc.from as any)('missions').insert({
    org_id: orgId,
    user_id: user.id,
    title: parsed.data.title,
    objective: parsed.data.objective,
    category: parsed.data.category,
    autonomy_level: parsed.data.autonomyLevel,
    status: 'draft',
    started_at: new Date().toISOString(),
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: (data as { id: string }).id, ok: true });
}
