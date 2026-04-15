#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI v3 — Fase A"
echo "  Video Studio (Veo 3.1) + Web Browsing"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# DIRECTORIES
mkdir -p supabase/migrations
mkdir -p src/features/video/server
mkdir -p src/features/video/components
mkdir -p src/features/video/data
mkdir -p src/features/web-browse/server
mkdir -p src/app/api/video/generate
mkdir -p src/app/api/video/list
mkdir -p src/app/api/video/delete
mkdir -p src/app/api/web-browse
mkdir -p "src/app/(app)/studio/video"

# ============================================================
# MIGRATION 0021 — videos table + quota
# ============================================================
echo ">>> Writing migration 0021..."

cat > supabase/migrations/0021_video_studio.sql << 'EOFMIG'
-- ============================================================
-- VIDEOS — Veo 3.1 generations
-- ============================================================
create table if not exists public.videos (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  prompt text not null,
  model text not null,
  aspect_ratio text not null default '16:9',
  duration_seconds integer not null default 8,
  resolution text default '1080p',
  has_audio boolean default true,
  source_image_url text,
  status text not null default 'pending',
  storage_path text,
  thumbnail_path text,
  operation_name text,
  cost_usd numeric(10,4),
  error_message text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists videos_org_idx
  on public.videos (org_id, created_at desc)
  where deleted_at is null;

create index if not exists videos_user_idx
  on public.videos (user_id, created_at desc)
  where deleted_at is null;

create index if not exists videos_status_idx
  on public.videos (status)
  where status in ('pending', 'processing');

alter table public.videos enable row level security;

drop policy if exists "videos by org members" on public.videos;
create policy "videos by org members"
  on public.videos for all
  using (public.is_org_member(org_id));

-- Storage bucket for videos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 104857600, ARRAY['video/mp4', 'video/webm', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies
drop policy if exists "videos storage by org" on storage.objects;
create policy "videos storage by org"
  on storage.objects for all
  using (
    bucket_id = 'videos'
    and (storage.foldername(name))[1] in (
      select id::text from public.organizations where public.is_org_member(id)
    )
  );

-- ============================================================
-- Update plans entitlements with video quotas
-- ============================================================
update public.plans
set entitlements = entitlements || jsonb_build_object('video_generations', 10)
where id = 'starter';

update public.plans
set entitlements = entitlements || jsonb_build_object('video_generations', 100)
where id = 'pro';

update public.plans
set entitlements = entitlements || jsonb_build_object('video_generations', 500)
where id = 'studio';

update public.plans
set entitlements = entitlements || jsonb_build_object('video_generations', 999999)
where id = 'agency';

-- ============================================================
-- Extend check_quota for videos
-- ============================================================
create or replace function public.check_quota(
  p_org_id text,
  p_kind text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub record;
  v_plan record;
  v_used bigint := 0;
  v_limit bigint := 0;
  v_period_start timestamptz;
begin
  select * into v_sub from public.subscriptions
  where org_id = p_org_id and status::text in ('trialing', 'active', 'past_due')
  order by created_at desc limit 1;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_subscription', 'used', 0, 'limit', 0);
  end if;

  if v_sub.plan_id is null then
    select * into v_plan from public.plans where id = 'pro' limit 1;
  else
    select * into v_plan from public.plans where id = v_sub.plan_id limit 1;
  end if;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_plan', 'used', 0, 'limit', 0);
  end if;

  v_period_start := coalesce(v_sub.current_period_start, date_trunc('month', now()));

  if p_kind = 'chat_message' then
    v_limit := coalesce((v_plan.entitlements->>'chat_messages')::bigint, 0);
    select coalesce(sum(quantity), 0) into v_used from public.usage_events
      where org_id = p_org_id and kind = 'chat_message' and created_at >= v_period_start;
  elsif p_kind = 'image_generation' then
    v_limit := coalesce((v_plan.entitlements->>'image_generations')::bigint, 0);
    select coalesce(sum(quantity), 0) into v_used from public.usage_events
      where org_id = p_org_id and kind = 'image_generation' and created_at >= v_period_start;
  elsif p_kind = 'video_generation' then
    v_limit := coalesce((v_plan.entitlements->>'video_generations')::bigint, 0);
    select count(*)::bigint into v_used from public.videos
      where org_id = p_org_id and deleted_at is null and created_at >= v_period_start
      and status in ('pending', 'processing', 'completed');
  elsif p_kind = 'knowledge_document' then
    v_limit := coalesce((v_plan.entitlements->>'knowledge_documents')::bigint, 0);
    select count(*)::bigint into v_used from public.documents
      where org_id = p_org_id and deleted_at is null;
  elsif p_kind = 'assistant' then
    v_limit := coalesce((v_plan.entitlements->>'assistants')::bigint, 0);
    select count(*)::bigint into v_used from public.assistants
      where org_id = p_org_id and deleted_at is null;
  elsif p_kind = 'project' then
    v_limit := coalesce((v_plan.entitlements->>'projects')::bigint, 0);
    select count(*)::bigint into v_used from public.projects
      where org_id = p_org_id and is_archived = false;
  elsif p_kind = 'integration' then
    v_limit := coalesce((v_plan.entitlements->>'integrations')::bigint, 0);
    select count(*)::bigint into v_used from public.integrations
      where org_id = p_org_id and status = 'connected';
  else
    return jsonb_build_object('allowed', false, 'reason', 'unknown_kind', 'used', 0, 'limit', 0);
  end if;

  return jsonb_build_object(
    'allowed', v_used < v_limit,
    'used', v_used, 'limit', v_limit,
    'plan_id', v_plan.id, 'status', v_sub.status::text,
    'trial_ends_at', v_sub.trial_end
  );
end;
$$;

grant execute on function public.check_quota(text, text) to authenticated, service_role;

notify pgrst, 'reload schema';
EOFMIG
echo "OK migration 0021"

# ============================================================
# VEO 3.1 CLIENT
# ============================================================
echo ">>> Writing Veo client..."

cat > src/features/video/server/veo-client.ts << 'EOFVEO'
import 'server-only';
import { serverEnv } from '@/lib/env';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type VeoModel =
  | 'veo-3.1-lite-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.1-generate-preview';

export interface VeoGenerateParams {
  prompt: string;
  model?: VeoModel;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  durationSeconds?: 4 | 6 | 8;
  imageBytes?: string;
  imageMimeType?: string;
}

export interface VeoOperationResult {
  operationName: string;
}

export interface VeoStatus {
  done: boolean;
  videoUri?: string;
  error?: string;
}

function getApiKey(): string {
  const key = serverEnv.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not configured');
  return key;
}

/**
 * Initiate video generation. Returns an operation name to poll.
 */
export async function generateVideo(params: VeoGenerateParams): Promise<VeoOperationResult> {
  const model = params.model ?? 'veo-3.1-fast-generate-preview';
  const key = getApiKey();

  const body: Record<string, unknown> = {
    instances: [
      {
        prompt: params.prompt,
        ...(params.imageBytes
          ? {
              image: {
                bytesBase64Encoded: params.imageBytes,
                mimeType: params.imageMimeType ?? 'image/jpeg',
              },
            }
          : {}),
      },
    ],
    parameters: {
      aspectRatio: params.aspectRatio ?? '16:9',
      resolution: params.resolution ?? '1080p',
      durationSeconds: params.durationSeconds ?? 8,
      personGeneration: 'allow_adult',
    },
  };

  const url = GOOGLE_API_BASE + '/models/' + model + ':predictLongRunning?key=' + key;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Veo generate ' + res.status + ': ' + text.slice(0, 300));
  }

  const json = (await res.json()) as { name: string };
  if (!json.name) throw new Error('Veo: no operation name returned');
  return { operationName: json.name };
}

/**
 * Poll an operation. Returns done=true and videoUri when ready.
 */
export async function getOperationStatus(operationName: string): Promise<VeoStatus> {
  const key = getApiKey();
  const url = GOOGLE_API_BASE + '/' + operationName + '?key=' + key;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { done: true, error: 'Status ' + res.status + ': ' + text.slice(0, 200) };
  }

  type OpResponse = {
    done?: boolean;
    error?: { message: string };
    response?: {
      generateVideoResponse?: {
        generatedSamples?: Array<{ video?: { uri: string } }>;
      };
    };
  };

  const json = (await res.json()) as OpResponse;

  if (!json.done) return { done: false };
  if (json.error) return { done: true, error: json.error.message };

  const uri = json.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) return { done: true, error: 'No video URI in response' };

  return { done: true, videoUri: uri };
}

/**
 * Download the video bytes from Google's URI (requires API key).
 */
export async function downloadVideo(videoUri: string): Promise<Buffer> {
  const key = getApiKey();
  const url = videoUri + (videoUri.includes('?') ? '&' : '?') + 'key=' + key;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Veo download ' + res.status);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

/**
 * Pricing per second (rough, USD)
 */
export function estimatedCost(model: VeoModel, durationSeconds: number): number {
  const perSecond =
    model === 'veo-3.1-generate-preview' ? 0.40 :
    model === 'veo-3.1-fast-generate-preview' ? 0.15 :
    0.075; // lite
  return Number((perSecond * durationSeconds).toFixed(4));
}
EOFVEO
echo "OK veo-client.ts"

# ============================================================
# VIDEO PRESETS / DATA
# ============================================================
echo ">>> Writing video presets..."

cat > src/features/video/data/presets.ts << 'EOFPRE'
import type { VeoModel } from '../server/veo-client';

export interface VideoModelOption {
  id: VeoModel;
  name: string;
  tagline: string;
  costPerSecond: number;
  badge?: string;
}

export const VIDEO_MODELS: VideoModelOption[] = [
  {
    id: 'veo-3.1-lite-generate-preview',
    name: 'Veo 3.1 Lite',
    tagline: 'Fast & affordable. Best for iteration.',
    costPerSecond: 0.075,
    badge: 'CHEAPEST',
  },
  {
    id: 'veo-3.1-fast-generate-preview',
    name: 'Veo 3.1 Fast',
    tagline: 'Balanced quality + speed. Native audio.',
    costPerSecond: 0.15,
    badge: 'RECOMMENDED',
  },
  {
    id: 'veo-3.1-generate-preview',
    name: 'Veo 3.1 Standard',
    tagline: 'Top cinematic quality. Slower.',
    costPerSecond: 0.40,
    badge: 'PREMIUM',
  },
];

export interface VideoPreset {
  id: string;
  label: string;
  promptHint: string;
}

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: 'product',
    label: 'Product showcase',
    promptHint: 'Cinematic close-up of [product] rotating slowly on a marble surface, soft golden light from the left, shallow depth of field, professional studio look. 4K cinematic.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle scene',
    promptHint: 'A confident woman in her 30s, golden hour, walking through a sunlit Mediterranean street, slow motion, grain, cinematic mood. Camera tracks her from behind at chest height.',
  },
  {
    id: 'foodbeverage',
    label: 'Food & beverage',
    promptHint: 'Macro shot of [drink] being poured into a crystal glass, ice cubes splashing in slow motion, golden light, shallow depth of field. Premium ad quality.',
  },
  {
    id: 'fashion',
    label: 'Fashion editorial',
    promptHint: 'High fashion model walking confidently in [outfit], minimalist white studio, dramatic side lighting, slow motion, Vogue editorial aesthetic.',
  },
  {
    id: 'animation',
    label: 'Animated explainer',
    promptHint: 'Smooth 2D motion graphics of [concept], minimalist clean design, soft pastel colors, professional explainer video style.',
  },
];

export const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 — Landscape', tag: 'YouTube/desktop' },
  { id: '9:16', label: '9:16 — Vertical', tag: 'TikTok/Reels/Stories' },
] as const;
EOFPRE
echo "OK video presets"

# ============================================================
# API: /api/video/generate
# ============================================================
echo ">>> Writing /api/video/generate..."

cat > src/app/api/video/generate/route.ts << 'EOFGEN'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateVideo, estimatedCost, type VeoModel } from '@/features/video/server/veo-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  prompt: z.string().min(3).max(2000),
  model: z.enum([
    'veo-3.1-lite-generate-preview',
    'veo-3.1-fast-generate-preview',
    'veo-3.1-generate-preview',
  ]).optional(),
  aspectRatio: z.enum(['16:9', '9:16']).optional(),
  resolution: z.enum(['720p', '1080p']).optional(),
  durationSeconds: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  projectId: z.string().nullable().optional(),
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
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'video_generation' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({
      error: 'Monthly video limit reached. Upgrade to generate more.',
      quota: q,
    }, { status: 402 });
  }

  const model = (parsed.data.model ?? 'veo-3.1-fast-generate-preview') as VeoModel;
  const duration = parsed.data.durationSeconds ?? 8;
  const cost = estimatedCost(model, duration);

  try {
    const result = await generateVideo({
      prompt: parsed.data.prompt,
      model,
      aspectRatio: parsed.data.aspectRatio ?? '16:9',
      resolution: parsed.data.resolution ?? '1080p',
      durationSeconds: duration,
      imageBytes: parsed.data.imageBase64,
      imageMimeType: parsed.data.imageMimeType,
    });

    const { data: row, error } = await svc
      .from('videos')
      .insert({
        org_id: orgId,
        user_id: user.id,
        project_id: parsed.data.projectId ?? null,
        prompt: parsed.data.prompt,
        model,
        aspect_ratio: parsed.data.aspectRatio ?? '16:9',
        duration_seconds: duration,
        resolution: parsed.data.resolution ?? '1080p',
        has_audio: model !== 'veo-3.1-lite-generate-preview',
        operation_name: result.operationName,
        cost_usd: cost,
        status: 'processing',
      } as never)
      .select('id, status, prompt, model, aspect_ratio, duration_seconds, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: row, estimatedCostUsd: cost });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Video generation failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
EOFGEN
echo "OK /api/video/generate"

# ============================================================
# API: /api/video/list (also polls pending)
# ============================================================
echo ">>> Writing /api/video/list with auto-polling..."

cat > src/app/api/video/list/route.ts << 'EOFLIST'
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
EOFLIST
echo "OK /api/video/list"

# ============================================================
# API: /api/video/delete
# ============================================================
cat > src/app/api/video/delete/route.ts << 'EOFDEL'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({ id: z.string().min(1) });

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

  await svc.from('videos').update({
    deleted_at: new Date().toISOString(),
  } as never).eq('id', parsed.data.id).eq('org_id', orgId);

  return NextResponse.json({ ok: true });
}
EOFDEL
echo "OK /api/video/delete"

# ============================================================
# WEB BROWSE TOOL — for chat
# ============================================================
echo ">>> Writing web-browse tool..."

cat > src/features/web-browse/server/web-search.ts << 'EOFWEB'
import 'server-only';
import { serverEnv } from '@/lib/env';

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Web search using Brave Search API (free tier 2k queries/month).
 * If BRAVE_API_KEY not configured, gracefully returns empty.
 */
export async function webSearch(query: string, count = 5): Promise<WebResult[]> {
  const key = (serverEnv as unknown as Record<string, string | undefined>).BRAVE_API_KEY;
  if (!key) return [];

  try {
    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(count));

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': key,
      },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    type BraveResp = {
      web?: {
        results?: Array<{
          title: string;
          url: string;
          description: string;
        }>;
      };
    };

    const json = (await res.json()) as BraveResp;
    return (json.web?.results ?? []).slice(0, count).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
    }));
  } catch {
    return [];
  }
}

/**
 * Format results as a context block for the LLM.
 */
export function formatWebContext(results: WebResult[]): string {
  if (results.length === 0) return '';
  const blocks = results.map((r, i) =>
    '[' + (i + 1) + '] ' + r.title + '\n' +
    'URL: ' + r.url + '\n' +
    r.snippet
  );
  return [
    '<web_search_results>',
    'The user enabled live web search. Use these results to ground your answer with current info.',
    'Cite sources inline using [1], [2] etc. matching the index below.',
    '',
    blocks.join('\n\n'),
    '</web_search_results>',
  ].join('\n');
}

/**
 * Detect if user message wants web search (heuristic).
 */
export function shouldSearch(message: string): boolean {
  const lower = message.toLowerCase();
  const triggers = [
    'search', 'busca', 'investiga', 'find', 'last news', 'última',
    'latest', 'reciente', 'today', 'hoy', 'this week', 'esta semana',
    'who is', 'what is happening', 'pasó con', 'what happened',
    'price of', 'precio de', 'cotización', 'stock',
  ];
  return triggers.some((t) => lower.includes(t));
}
EOFWEB
echo "OK web-search.ts"

# ============================================================
# API: /api/web-browse
# ============================================================
cat > src/app/api/web-browse/route.ts << 'EOFWB'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { webSearch } from '@/features/web-browse/server/web-search';

export const runtime = 'nodejs';

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  count: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const results = await webSearch(parsed.data.query, parsed.data.count ?? 5);
  return NextResponse.json({ results });
}
EOFWB
echo "OK /api/web-browse"

# ============================================================
# WIRE WEB BROWSE INTO CHAT
# ============================================================
echo ">>> Patching chat route to support web browsing..."

python3 << 'PYWEB'
path = 'src/app/api/chat/route.ts'
src = open(path, 'r').read()

# 1) Add imports
if "webSearch" not in src:
    src = src.replace(
        "import { findAgent } from '@/features/agents/data/catalog';",
        "import { findAgent } from '@/features/agents/data/catalog';\n"
        "import { webSearch, formatWebContext, shouldSearch } from '@/features/web-browse/server/web-search';"
    )

# 2) Add webBrowse to BodySchema
if "webBrowse:" not in src:
    src = src.replace(
        "agentType: z.enum(['creative','brand','copy','research','analyst','social']).optional(),",
        "agentType: z.enum(['creative','brand','copy','research','analyst','social']).optional(),\n  webBrowse: z.boolean().optional(),",
        1
    )

# 3) Inject web search results into system additions if enabled or auto-detected
old = "if (selectedAgent && selectedAgent.systemPromptAddition) {"
new = (
    "// Web browse: explicit flag OR auto-detect for researcher agent\n"
    "  const wantsWeb = body.webBrowse === true ||\n"
    "    (selectedAgent?.id === 'research' && shouldSearch(body.message));\n"
    "  if (wantsWeb) {\n"
    "    try {\n"
    "      const webResults = await webSearch(body.message, 5);\n"
    "      const webBlock = formatWebContext(webResults);\n"
    "      if (webBlock) systemAdditions.push({ role: 'system', content: webBlock });\n"
    "    } catch { /* graceful fallback */ }\n"
    "  }\n"
    "  if (selectedAgent && selectedAgent.systemPromptAddition) {"
)
if "wantsWeb" not in src:
    src = src.replace(old, new, 1)

open(path, 'w').write(src)
print("chat route patched with web browsing")
PYWEB
echo "OK chat route patched"

# ============================================================
# UI: VIDEO STUDIO PAGE
# ============================================================
echo ">>> Writing /studio/video page..."

cat > "src/app/(app)/studio/video/page.tsx" << 'EOFPAGE'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { VideoStudio } from '@/features/video/components/video-studio';

export const dynamic = 'force-dynamic';

export default async function VideoStudioPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] w-full mx-auto">
      <VideoStudio />
    </div>
  );
}
EOFPAGE
echo "OK video studio page"

# ============================================================
# VIDEO STUDIO COMPONENT
# ============================================================
echo ">>> Writing VideoStudio component..."

cat > src/features/video/components/video-studio.tsx << 'EOFVS'
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, Video, Trash2, Download, Play, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { VIDEO_MODELS, VIDEO_PRESETS, ASPECT_RATIOS } from '../data/presets';

interface VideoRow {
  id: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  duration_seconds: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  error_message: string | null;
  cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
}

export function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(VIDEO_MODELS[1].id);
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [refImage, setRefImage] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [polling, setPolling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/video/list');
      if (!res.ok) return;
      const body = await res.json();
      setVideos(body.videos ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Poll while there are processing videos
  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'pending');
    if (!hasProcessing) return;

    setPolling(true);
    const interval = setInterval(fetchVideos, 8000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [videos, fetchVideos]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setRefImage({ base64, mime: file.type, preview: result });
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          aspectRatio: aspect,
          durationSeconds: duration,
          ...(refImage ? { imageBase64: refImage.base64, imageMimeType: refImage.mime } : {}),
        }),
      });
      const body = await res.json();
      if (res.status === 402) {
        toast.error(body.error ?? 'Limit reached');
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? 'Generation failed');
      toast.success('Video generation started — typically 30-60s');
      setPrompt('');
      setRefImage(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchVideos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this video?')) return;
    try {
      await fetch('/api/video/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    }
  }

  const selectedModel = VIDEO_MODELS.find((m) => m.id === model)!;
  const estimatedCost = (selectedModel.costPerSecond * duration).toFixed(2);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Studio</div>
        <h1 className="font-display text-[32px]">Video</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">
          Cinematic-grade AI video powered by Veo 3.1. Text-to-video or animate a reference image.
          Native audio. 16:9 or vertical 9:16. Up to 8 seconds per generation.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the video you want. Be specific: subject, action, camera, lighting, mood..."
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
          />

          <div className="space-y-2">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Quick presets</div>
            <div className="flex flex-wrap gap-1.5">
              {VIDEO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrompt(p.promptHint)}
                  className="h-7 px-2.5 rounded-md text-[11.5px] border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as typeof model)}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-gold/60"
              >
                {VIDEO_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ${m.costPerSecond.toFixed(3)}/sec
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-fg-muted">{selectedModel.tagline}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Aspect ratio</label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as '16:9' | '9:16')}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-gold/60"
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Duration</label>
              <div className="flex gap-1.5">
                {[4, 6, 8].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d as 4 | 6 | 8)}
                    className={cn(
                      'flex-1 h-9 rounded-md text-[12.5px] border transition',
                      duration === d
                        ? 'bg-gold/15 border-gold/50 text-gold'
                        : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Reference image (optional)</label>
              {refImage ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 p-2">
                  <img src={refImage.preview} alt="ref" className="h-9 w-9 rounded object-cover" />
                  <span className="flex-1 text-[12px] text-fg-muted truncate">Image attached</span>
                  <button
                    type="button"
                    onClick={() => { setRefImage(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="h-7 w-7 rounded text-fg-muted hover:text-danger flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-9 rounded-md border border-dashed border-border bg-surface-2/50 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Animate from image</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
            <div className="text-[11px] text-fg-muted">
              Estimated cost: <span className="text-gold font-medium">${estimatedCost}</span>
              <span className="text-fg-subtle"> · Generation usually takes 30–60 seconds</span>
            </div>
            <Button onClick={handleGenerate} loading={generating} disabled={!prompt.trim()}>
              <Sparkles className="h-4 w-4" />
              <span>Generate video</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[20px]">Your videos</h2>
          {polling && (
            <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Polling for updates...</span>
            </div>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
            <Video className="h-8 w-8 text-fg-subtle mx-auto mb-3" />
            <p className="text-[13.5px] text-fg-muted">No videos yet. Generate your first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <Card key={v.id}>
                <CardBody className="space-y-2.5">
                  <div className={cn(
                    'relative rounded-md overflow-hidden bg-surface-3 flex items-center justify-center',
                    v.aspect_ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-video',
                  )}>
                    {v.status === 'completed' && v.video_url ? (
                      <video
                        src={v.video_url}
                        controls
                        className="absolute inset-0 w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : v.status === 'failed' ? (
                      <div className="text-center px-4">
                        <X className="h-6 w-6 text-danger mx-auto mb-1" />
                        <div className="text-[11px] text-fg-muted">{v.error_message ?? 'Failed'}</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 text-gold animate-spin mx-auto mb-1" />
                        <div className="text-[11px] uppercase tracking-[0.12em] text-fg-muted">
                          Generating...
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[12.5px] text-fg-soft line-clamp-2 leading-snug">{v.prompt}</p>

                  <div className="flex items-center justify-between text-[10.5px] text-fg-subtle">
                    <span>{v.duration_seconds}s · {v.aspect_ratio}</span>
                    <span>${(v.cost_usd ?? 0).toFixed(2)}</span>
                  </div>

                  <div className="flex gap-1 pt-1">
                    {v.video_url && (
                      <a
                        href={v.video_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-7 rounded-md border border-border bg-surface-2 text-[11.5px] text-fg-muted hover:text-fg flex items-center justify-center gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="h-7 w-7 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-danger hover:border-danger/40 flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOFVS
echo "OK video-studio.tsx"

# ============================================================
# UPDATE PLANS DATA WITH VIDEO QUOTAS
# ============================================================
echo ">>> Updating plans data with video quotas..."

python3 << 'PYP'
import re
path = 'src/features/billing/data/plans.ts'
src = open(path, 'r').read()

# Add videoGenerations to quotas type if not present
if "videoGenerations" not in src:
    src = src.replace(
        "integrations: number;",
        "integrations: number;\n    videoGenerations: number;"
    )
    # Add to each plan's quotas object
    src = re.sub(
        r"integrations: 2 }",
        "integrations: 2, videoGenerations: 10 }",
        src, count=1
    )
    src = re.sub(
        r"integrations: 10 }",
        "integrations: 10, videoGenerations: 100 }",
        src, count=1
    )
    src = re.sub(
        r"integrations: 50 }",
        "integrations: 50, videoGenerations: 500 }",
        src, count=1
    )
    src = re.sub(
        r"integrations: 999999 }",
        "integrations: 999999, videoGenerations: 999999 }",
        src, count=1
    )
    # Add a feature line in each plan
    src = src.replace(
        "'Voice mode + memory',",
        "'Voice mode + memory',\n      '10 AI videos / mo (Veo 3.1)',",
        1
    )
    src = src.replace(
        "'Reference images + refinement',",
        "'Reference images + refinement',\n      '100 AI videos / mo (Veo 3.1)',",
        1
    )
    src = src.replace(
        "'1,500 AI images / mo',",
        "'1,500 AI images / mo',\n      '500 AI videos / mo (Veo 3.1)',",
        1
    )
    src = src.replace(
        "'5,000 AI images / mo',",
        "'5,000 AI images / mo',\n      'Unlimited AI videos (Veo 3.1)',",
        1
    )
    open(path, 'w').write(src)
    print("plans.ts updated with video quotas")
PYP
echo "OK plans data"

# ============================================================
# ADD VIDEO STUDIO TO SIDEBAR
# ============================================================
echo ">>> Adding Video Studio to sidebar..."

python3 << 'PYSB'
path = 'src/components/layout/sidebar.tsx'
src = open(path, 'r').read()

# Add Video icon import (use Video from lucide if missing)
if "Video," not in src:
    src = src.replace(
        "LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Mic,",
        "LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video, Mic,"
    )

# Add video link in Studio section
old_studio = """  {
    group: 'Studio',
    items: [
      { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
      { href: '/voice', label: 'Voice Mode', icon: Mic },
    ],
  },"""

new_studio = """  {
    group: 'Studio',
    items: [
      { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
      { href: '/studio/video', label: 'Video Studio', icon: Video, badge: 'NEW' },
      { href: '/voice', label: 'Voice Mode', icon: Mic },
    ],
  },"""

if "/studio/video" not in src:
    src = src.replace(old_studio, new_studio)
    open(path, 'w').write(src)
    print("sidebar updated with Video Studio")
PYSB
echo "OK sidebar updated"

# ============================================================
# ENV TYPES
# ============================================================
echo ">>> Adding BRAVE_API_KEY to env (optional)..."
ENV_FILE=$(find src/lib -name "env.ts" -type f | head -n1 || echo "")
if [ -n "$ENV_FILE" ]; then
  python3 << PYENV
path = "$ENV_FILE"
src = open(path, 'r').read()
if "BRAVE_API_KEY" not in src and "z.object" in src:
    import re
    m = re.search(r"(COMPOSIO_API_KEY[^,\n]*,)", src)
    if m:
        src = src[:m.end()] + "\n  BRAVE_API_KEY: z.string().optional()," + src[m.end():]
        open(path, 'w').write(src)
        print('env.ts updated with BRAVE_API_KEY')
PYENV
fi
echo "OK env"

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  Operator AI v3 — Fase A bootstrap complete."
echo "================================================================"
echo ""
echo "WHAT YOU GOT:"
echo "  ✓ Migration 0021: videos table + storage bucket + quota"
echo "  ✓ Veo 3.1 client (Lite/Fast/Standard) with operation polling"
echo "  ✓ /api/video: generate + list (auto-poll) + delete"
echo "  ✓ /studio/video page with full UI"
echo "  ✓ Web Browse: webSearch tool (Brave API)"
echo "  ✓ /api/web-browse endpoint"
echo "  ✓ Chat route auto-uses web search for Researcher agent"
echo "  ✓ Sidebar: Video Studio added with NEW badge"
echo "  ✓ Plans: video quotas (10/100/500/unlimited)"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. APPLY MIGRATION:"
echo "   cat supabase/migrations/0021_video_studio.sql | pbcopy"
echo "   Paste in Supabase SQL Editor + Run"
echo ""
echo "2. REGENERATE TYPES:"
echo "   export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "   pnpm db:generate"
echo "   pnpm typecheck"
echo ""
echo "3. (OPTIONAL) BRAVE SEARCH for web browsing:"
echo "   - Sign up at https://brave.com/search/api/"
echo "   - Free tier: 2,000 queries/month"
echo "   - Add to .env.local: BRAVE_API_KEY=xxx"
echo "   - Add to Vercel env vars"
echo "   - Without it, web browsing is silently disabled"
echo ""
echo "4. PUSH:"
echo "   git add -A"
echo "   git commit -m 'feat: v3 fase A - video studio + web browse'"
echo "   git push"
echo ""
