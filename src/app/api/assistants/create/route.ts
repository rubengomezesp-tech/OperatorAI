import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

const BodySchema = z.object({
  name: z.string().min(1).max(60).default('Creative Agent'),
  business_name: z.string().min(1).max(120),
  industry: z.string().max(120).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
  languages: z.array(z.string()).default(['en']),
  audience: z.string().max(500).nullable().optional(),
  services: z.array(z.string().max(60)).default([]),
  goals: z.array(z.string().max(120)).default([]),
  tone: z.array(z.string().max(40)).default([]),
  writing_style: z.string().max(600).nullable().optional(),
  banned_words: z.array(z.string().max(40)).default([]),
  custom_instructions: z.string().max(4000).nullable().optional(),
  isDefault: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

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

  // If marking as default, clear existing default
  if (input.isDefault) {
    await svc
      .from('assistants')
      .update({ is_default: false } as never)
      .eq('org_id', orgId)
      .eq('is_default', true);
  }

  const slug = slugify(input.name || input.business_name || 'agent') + '-' + Math.random().toString(36).slice(2, 7);

  const insert = {
    org_id: orgId,
    name: input.name,
    slug,
    business_name: input.business_name,
    industry: input.industry ?? null,
    website: input.website ?? null,
    languages: input.languages,
    audience: input.audience ?? null,
    services: input.services,
    goals: input.goals,
    tone: input.tone,
    writing_style: input.writing_style ?? null,
    banned_words: input.banned_words,
    custom_instructions: input.custom_instructions ?? null,
    is_default: input.isDefault,
    is_active: true,
  } as never;

  const { data, error } = await svc
    .from('assistants')
    .insert(insert)
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create assistant' }, { status: 500 });
  }

  return NextResponse.json({ id: (data as { id: string }).id });
}
