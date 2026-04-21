import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ videos: [] });

    const svc = createSupabaseServiceClient();
    const { orgId } = await resolveOrgContext(svc, user.id);

    const { data } = await (svc as any)
      .from('videos')
      .select('id, prompt, model, aspect_ratio, duration_seconds, status, storage_path, error_message, cost_usd, created_at, completed_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const videos = (data ?? []).map((v: any) => ({
      ...v,
      video_url: v.storage_path
        ? (v.storage_path.startsWith('http') ? v.storage_path : SUPABASE_URL + '/storage/v1/object/public/videos/' + v.storage_path)
        : null,
    }));
    return NextResponse.json({ videos });
  } catch (e) {
    console.error('[video-list]', e);
    return NextResponse.json({ videos: [], error: String(e) });
  }
}
