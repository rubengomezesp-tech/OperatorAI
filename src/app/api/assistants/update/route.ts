import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(60).optional(),
  business_name: z.string().min(1).max(120).optional(),
  industry: z.string().max(120).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  languages: z.array(z.string()).optional(),
  audience: z.string().max(500).nullable().optional(),
  services: z.array(z.string().max(60)).optional(),
  goals: z.array(z.string().max(120)).optional(),
  tone: z.array(z.string().max(40)).optional(),
  writing_style: z.string().max(600).nullable().optional(),
  banned_words: z.array(z.string().max(40)).optional(),
  custom_instructions: z.string().max(4000).nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, isDefault, ...patch } = parsed.data;

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

  if (isDefault === true) {
    await svc
      .from('assistants')
      .update({ is_default: false } as never)
      .eq('org_id', orgId)
      .eq('is_default', true);
  }

  const updateRow: Record<string, unknown> = { ...patch };
  if (typeof isDefault === 'boolean') updateRow.is_default = isDefault;

  const { error } = await svc
    .from('assistants')
    .update(updateRow as never)
    .eq('id', id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
