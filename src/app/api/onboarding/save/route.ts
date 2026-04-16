import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  step: z.number().int().min(0).max(6),
  data: z.record(z.unknown()).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string | null = null;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    // user hasn't created an org yet
  }

  const payload = {
    user_id: user.id,
    org_id: orgId,
    current_step: parsed.data.step,
    data: parsed.data.data ?? {},
    completed: parsed.data.completed ?? false,
    completed_at: parsed.data.completed ? new Date().toISOString() : null,
  };

  const { error } = await svc
    .from('onboarding_state')
    .upsert(payload as never, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If complete, persist brand profile
  if (parsed.data.completed && orgId && parsed.data.data) {
    const d = parsed.data.data as Record<string, string>;
    await svc.from('brand_profile').upsert({
      org_id: orgId,
      brand_name: d.brand_name ?? null,
      description: d.description ?? null,
      vibe: d.vibe ?? null,
      user_role: d.user_role ?? null,
      first_prompt: d.first_prompt ?? null,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id' });
  }

  return NextResponse.json({ ok: true });
}
