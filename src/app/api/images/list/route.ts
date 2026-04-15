import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
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

  const { data } = await svc
    .from('image_generations')
    .select('id, prompt, enhanced_prompt, preset, aspect_ratio, seed, output_urls, output_storage_paths, status, is_starred, created_at, error_message, cost_usd, latency_ms')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Generate signed URLs for storage paths (images stored in private bucket)
  type Row = {
    id: string;
    output_storage_paths: string[] | null;
    output_urls: string[] | null;
  };
  const rows = (data ?? []) as unknown as (Row & Record<string, unknown>)[];

  const enriched = await Promise.all(rows.map(async (r) => {
    let displayUrls: string[] = r.output_urls ?? [];
    if (r.output_storage_paths && r.output_storage_paths.length > 0) {
      const signed = await Promise.all(
        r.output_storage_paths.map(async (path) => {
          const { data } = await svc.storage.from('image-outputs').createSignedUrl(path, 60 * 60);
          return data?.signedUrl ?? null;
        }),
      );
      const validSigned = signed.filter((u): u is string => typeof u === 'string');
      if (validSigned.length > 0) displayUrls = validSigned;
    }
    return { ...r, display_urls: displayUrls };
  }));

  return NextResponse.json({ images: enriched });
}
