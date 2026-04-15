import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getOperationStatus, downloadVideo } from '@/features/video/server/veo-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  // Find processing videos and try to advance them
  const { data: pending } = await svc
    .from('videos')
    .select('id, operation_name')
    .eq('org_id', orgId)
    .eq('status', 'processing')
    .not('operation_name', 'is', null)
    .limit(5);

  const pendingRows = (pending ?? []) as Array<{ id: string; operation_name: string }>;

  // Poll each pending in parallel (best effort)
  await Promise.all(pendingRows.map(async (row) => {
    try {
      const status = await getOperationStatus(row.operation_name);
      if (!status.done) return;

      if (status.error) {
        await svc.from('videos').update({
          status: 'failed',
          error_message: status.error,
          completed_at: new Date().toISOString(),
        } as never).eq('id', row.id);
        return;
      }

      if (!status.videoUri) return;

      // Download from Google and upload to Supabase storage
      const buf = await downloadVideo(status.videoUri);
      const path = orgId + '/' + row.id + '.mp4';
      const { error: upErr } = await svc.storage
        .from('videos')
        .upload(path, buf, { contentType: 'video/mp4', upsert: true });

      if (upErr) {
        await svc.from('videos').update({
          status: 'failed',
          error_message: 'Upload failed: ' + upErr.message,
          completed_at: new Date().toISOString(),
        } as never).eq('id', row.id);
        return;
      }

      await svc.from('videos').update({
        status: 'completed',
        storage_path: path,
        completed_at: new Date().toISOString(),
      } as never).eq('id', row.id);
    } catch {
      // ignore individual errors
    }
  }));

  // Return latest list (with signed URLs for completed)
  const { data: videos } = await svc
    .from('videos')
    .select('id, prompt, model, aspect_ratio, duration_seconds, status, storage_path, error_message, cost_usd, created_at, completed_at')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = (videos ?? []) as Array<{
    id: string; storage_path: string | null; status: string;
    [key: string]: unknown;
  }>;

  // Sign URLs for completed videos
  const signed = await Promise.all(rows.map(async (v) => {
    if (v.status === 'completed' && v.storage_path) {
      const { data } = await svc.storage
        .from('videos')
        .createSignedUrl(v.storage_path, 60 * 60 * 24); // 24h
      return { ...v, video_url: data?.signedUrl ?? null };
    }
    return { ...v, video_url: null };
  }));

  return NextResponse.json({ videos: signed });
}
