import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  brand_colors: z.array(z.string()).max(6),
  tone: z.enum(['minimal', 'editorial', 'bold', 'playful', 'professional']),
  always_use_words: z.array(z.string()).max(15),
  never_use_words: z.array(z.string()).max(15),
  validator_strictness: z.enum(['low', 'medium', 'high', 'strict']),
  auto_correct: z.boolean(),
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

  const { error } = await (svc.from as any)('brand_os_rules').upsert({
    org_id: orgId,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'org_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
