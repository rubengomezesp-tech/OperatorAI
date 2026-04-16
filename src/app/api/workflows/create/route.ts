import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  triggerType: z.enum(['manual', 'schedule', 'webhook', 'email_received']),
  triggerConfig: z.record(z.unknown()).optional(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string(),
    config: z.record(z.unknown()).optional(),
  })),
  templateId: z.string().optional(),
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

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'workflow' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({ error: 'Workflow limit reached. Upgrade to add more.', quota: q }, { status: 402 });
  }

  const { data: row, error } = await svc
    .from('workflows')
    .insert({
      org_id: orgId,
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger_type: parsed.data.triggerType,
      trigger_config: parsed.data.triggerConfig ?? {},
      steps: parsed.data.steps,
      is_active: false,
    } as never)
    .select('id, name, trigger_type, is_active, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workflow: row });
}
