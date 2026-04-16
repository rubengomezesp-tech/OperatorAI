import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  conversationId: z.string().min(1),
  visibility: z.enum(['private', 'link', 'public']).optional(),
  title: z.string().max(200).optional(),
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

  // Verify conversation ownership
  const { data: conv } = await svc
    .from('conversations')
    .select('id, title, org_id')
    .eq('id', parsed.data.conversationId)
    .maybeSingle();

  if (!conv || (conv as { org_id: string }).org_id !== orgId) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Check for existing active share
  const { data: existing } = await svc
    .from('conversation_shares')
    .select('id, slug, visibility')
    .eq('conversation_id', parsed.data.conversationId)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; slug: string; visibility: string };
    // Update visibility if different
    if (parsed.data.visibility && parsed.data.visibility !== row.visibility) {
      await ((svc.from as any)('conversation_shares').update as any)({
        visibility: parsed.data.visibility,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
    }
    return NextResponse.json({
      slug: row.slug,
      url: `/c/${row.slug}`,
      visibility: parsed.data.visibility ?? row.visibility,
    });
  }

  // Create new share
  const { data, error } = await svc
    .from('conversation_shares')
    .insert({
      conversation_id: parsed.data.conversationId,
      org_id: orgId,
      user_id: user.id,
      visibility: parsed.data.visibility ?? 'link',
      title: parsed.data.title ?? (conv as { title: string | null }).title ?? 'Shared conversation',
    } as never)
    .select('slug, visibility')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = data as { slug: string; visibility: string };
  return NextResponse.json({
    slug: row.slug,
    url: `/c/${row.slug}`,
    visibility: row.visibility,
  });
}
