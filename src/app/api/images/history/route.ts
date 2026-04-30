import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/images/history?url=<imageUrl>
// Returns: { versions: string[] } — chain of URLs from original → latest edit
export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) return NextResponse.json({ versions: [] });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ versions: [] });
  }

  // Find the row matching this URL
  const { data: row } = await svc
    .from('image_generations')
    .select('id, parent_image_id, output_urls')
    .eq('org_id', orgId)
    .contains('output_urls', [url])
    .maybeSingle();

  if (!row) return NextResponse.json({ versions: [url] });

  // Walk up to root
  const r = row as { id: string; parent_image_id: string | null; output_urls: string[] };
  let rootId = r.id;
  let cursor: string | null = r.parent_image_id;
  while (cursor) {
    const { data: parent } = await svc
      .from('image_generations')
      .select('id, parent_image_id')
      .eq('id', cursor)
      .maybeSingle();
    if (!parent) break;
    const p = parent as { id: string; parent_image_id: string | null };
    rootId = p.id;
    cursor = p.parent_image_id;
  }

  // Walk down all descendants in order
  const visited = new Set<string>();
  const ordered: string[] = [];

  async function collectChain(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const { data: node } = await svc
      .from('image_generations')
      .select('id, output_urls, created_at')
      .eq('id', id)
      .maybeSingle();
    if (!node) return;
    const n = node as { id: string; output_urls: string[]; created_at: string };
    if (n.output_urls?.[0]) ordered.push(n.output_urls[0]);

    const { data: children } = await svc
      .from('image_generations')
      .select('id, created_at')
      .eq('parent_image_id', id)
      .order('created_at', { ascending: true });

    for (const c of (children as Array<{ id: string }> | null) ?? []) {
      await collectChain(c.id);
    }
  }

  await collectChain(rootId);

  return NextResponse.json({ versions: ordered.length > 0 ? ordered : [url] });
}
