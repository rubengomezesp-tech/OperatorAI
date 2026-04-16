#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI v3 — Fase B+C"
echo "  Workflows + Code Interpreter + PWA + AgentPicker"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# DIRECTORIES
# ============================================================
mkdir -p supabase/migrations
mkdir -p src/features/workflows/server
mkdir -p src/features/workflows/components
mkdir -p src/features/workflows/data
mkdir -p src/features/files/server
mkdir -p src/features/files/components
mkdir -p src/app/api/workflows/list
mkdir -p src/app/api/workflows/create
mkdir -p src/app/api/workflows/update
mkdir -p src/app/api/workflows/delete
mkdir -p src/app/api/workflows/run
mkdir -p src/app/api/files/upload
mkdir -p src/app/api/files/list
mkdir -p src/app/api/files/analyze
mkdir -p src/app/api/files/delete
mkdir -p "src/app/(app)/workflows"
mkdir -p "src/app/(app)/files"
mkdir -p public/icons

# ============================================================
# MIGRATION 0022 — workflows + analysis_files
# ============================================================
echo ">>> Writing migration 0022..."

cat > supabase/migrations/0022_workflows_files.sql << 'EOFMIG'
-- ============================================================
-- WORKFLOWS — visual automation (Zapier light)
-- ============================================================
create table if not exists public.workflows (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null,
  trigger_config jsonb not null default '{}'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  last_run_at timestamptz,
  last_run_status text,
  total_runs integer not null default 0,
  total_successes integer not null default 0,
  total_failures integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists workflows_org_idx
  on public.workflows (org_id, created_at desc)
  where archived_at is null;

create index if not exists workflows_active_idx
  on public.workflows (is_active, trigger_type)
  where is_active = true and archived_at is null;

alter table public.workflows enable row level security;

drop policy if exists "workflows by org" on public.workflows;
create policy "workflows by org"
  on public.workflows for all
  using (public.is_org_member(org_id));

-- Workflow runs (history)
create table if not exists public.workflow_runs (
  id text primary key default public.gen_cuid2(),
  workflow_id text not null references public.workflows(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  status text not null,
  trigger_data jsonb default '{}'::jsonb,
  step_results jsonb default '[]'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workflow_runs_workflow_idx
  on public.workflow_runs (workflow_id, started_at desc);

alter table public.workflow_runs enable row level security;

drop policy if exists "workflow_runs by org" on public.workflow_runs;
create policy "workflow_runs by org"
  on public.workflow_runs for all
  using (public.is_org_member(org_id));

-- ============================================================
-- ANALYSIS FILES — CSV/Excel for Code Interpreter
-- ============================================================
create table if not exists public.analysis_files (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  row_count integer,
  column_count integer,
  columns jsonb,
  preview jsonb,
  last_analyzed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists analysis_files_org_idx
  on public.analysis_files (org_id, created_at desc)
  where deleted_at is null;

alter table public.analysis_files enable row level security;

drop policy if exists "analysis_files by org" on public.analysis_files;
create policy "analysis_files by org"
  on public.analysis_files for all
  using (public.is_org_member(org_id));

-- Storage bucket for analysis files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('analysis', 'analysis', false, 52428800, ARRAY[
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'text/plain'
])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "analysis storage by org" on storage.objects;
create policy "analysis storage by org"
  on storage.objects for all
  using (
    bucket_id = 'analysis'
    and (storage.foldername(name))[1] in (
      select id::text from public.organizations where public.is_org_member(id)
    )
  );

-- ============================================================
-- Update plans entitlements with workflows
-- ============================================================
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 1) where id = 'starter';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 10) where id = 'pro';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 50) where id = 'studio';
update public.plans set entitlements = entitlements || jsonb_build_object('workflows', 999999) where id = 'agency';

-- Extend check_quota for workflows
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
  elsif p_kind = 'workflow' then
    v_limit := coalesce((v_plan.entitlements->>'workflows')::bigint, 0);
    select count(*)::bigint into v_used from public.workflows
      where org_id = p_org_id and archived_at is null;
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
echo "OK migration 0022"

# ============================================================
# WORKFLOWS — TEMPLATES CATALOG
# ============================================================
echo ">>> Writing workflow templates..."

cat > src/features/workflows/data/templates.ts << 'EOFT'
export interface WorkflowStep {
  id: string;
  type: 'ai_chat' | 'send_email' | 'send_slack' | 'create_doc' | 'web_search' | 'generate_image' | 'transform' | 'condition';
  label: string;
  config: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'content' | 'sales' | 'ops' | 'research';
  triggerType: 'manual' | 'schedule' | 'webhook' | 'email_received';
  triggerConfig: Record<string, unknown>;
  steps: WorkflowStep[];
  premium?: boolean;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'daily-content-brief',
    name: 'Daily content brief',
    description: 'Every morning at 9am, generate today\u2019s content ideas based on your brand voice and trending topics.',
    icon: 'Sparkles',
    category: 'content',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 9 * * *', timezone: 'Europe/Madrid' },
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Search trending topics',
        config: { query: 'trending marketing today', count: 5 },
      },
      {
        id: 's2', type: 'ai_chat', label: 'Generate 5 post ideas',
        config: {
          agent: 'creative',
          prompt: 'Based on the trending topics above, generate 5 social media post ideas for our brand. Match our voice and target audience. Format: numbered list with hook + body.',
        },
      },
      {
        id: 's3', type: 'send_email', label: 'Email digest to me',
        config: { to: 'self', subject: 'Today\u2019s content brief' },
      },
    ],
  },
  {
    id: 'lead-qualification',
    name: 'Lead qualifier',
    description: 'When a new email arrives from a potential client, classify it and draft a response in your voice.',
    icon: 'UserCheck',
    category: 'sales',
    triggerType: 'email_received',
    triggerConfig: { from_filter: '*' },
    steps: [
      {
        id: 's1', type: 'ai_chat', label: 'Classify lead quality',
        config: {
          agent: 'analyst',
          prompt: 'Classify this email: hot lead / warm lead / cold lead / spam. Return ONLY one word.',
        },
      },
      {
        id: 's2', type: 'condition', label: 'If hot or warm',
        config: { if: 'output_is_hot_or_warm' },
      },
      {
        id: 's3', type: 'ai_chat', label: 'Draft personalized reply',
        config: {
          agent: 'copy',
          prompt: 'Draft a warm, personalized reply in our brand voice. Ask 2 qualifying questions. Keep under 100 words.',
        },
      },
    ],
  },
  {
    id: 'weekly-competitor-watch',
    name: 'Weekly competitor watch',
    description: 'Every Monday, research 3 named competitors\u2014what they posted, what they launched, what changed on their site.',
    icon: 'Radar',
    category: 'research',
    triggerType: 'schedule',
    triggerConfig: { cron: '0 8 * * 1', timezone: 'Europe/Madrid' },
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Search competitor 1',
        config: { query: '{{competitor_1}} latest news this week' },
      },
      {
        id: 's2', type: 'web_search', label: 'Search competitor 2',
        config: { query: '{{competitor_2}} latest news this week' },
      },
      {
        id: 's3', type: 'web_search', label: 'Search competitor 3',
        config: { query: '{{competitor_3}} latest news this week' },
      },
      {
        id: 's4', type: 'ai_chat', label: 'Synthesize into report',
        config: {
          agent: 'research',
          prompt: 'Based on the search results above, write a tactical 200-word weekly competitor report. Format: 3 sections (one per competitor), each with: what they did, why it matters, recommended response.',
        },
      },
      {
        id: 's5', type: 'send_email', label: 'Email me the report',
        config: { to: 'self', subject: 'Weekly competitor watch' },
      },
    ],
  },
  {
    id: 'instagram-caption-batch',
    name: 'Instagram caption batch',
    description: 'Generate 7 Instagram captions for the week from a theme. Branded voice. Hashtags included.',
    icon: 'Hash',
    category: 'content',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      {
        id: 's1', type: 'ai_chat', label: 'Generate 7 captions',
        config: {
          agent: 'social',
          prompt: 'Theme: {{theme}}. Generate 7 distinct Instagram captions in our brand voice. Each: hook + body + 5-7 niche hashtags. Format: Day 1, Day 2, etc.',
        },
      },
      {
        id: 's2', type: 'create_doc', label: 'Save to Drive',
        config: { filename: 'IG captions {{date}}', folder: 'content' },
      },
    ],
  },
  {
    id: 'meeting-prep',
    name: 'Meeting prep brief',
    description: 'Before any meeting, get a one-page brief on the person and company you\u2019re meeting with.',
    icon: 'Briefcase',
    category: 'ops',
    triggerType: 'manual',
    triggerConfig: {},
    steps: [
      {
        id: 's1', type: 'web_search', label: 'Research person',
        config: { query: '{{person_name}} {{company_name}}' },
      },
      {
        id: 's2', type: 'web_search', label: 'Research company',
        config: { query: '{{company_name}} latest news funding' },
      },
      {
        id: 's3', type: 'ai_chat', label: 'Synthesize 1-pager',
        config: {
          agent: 'research',
          prompt: 'Build a tactical 1-page meeting brief: who they are, recent moves, 3 talking points, 3 smart questions to ask. 250 words max.',
        },
      },
    ],
  },
];

export const TRIGGER_TYPES = [
  { id: 'manual', label: 'Manual', description: 'You run it on demand', icon: 'Play' },
  { id: 'schedule', label: 'Schedule', description: 'Runs on a recurring schedule', icon: 'Clock' },
  { id: 'webhook', label: 'Webhook', description: 'External event triggers it', icon: 'Webhook' },
  { id: 'email_received', label: 'Email received', description: 'A new email matches the filter', icon: 'Mail' },
] as const;

export const STEP_TYPES = [
  { id: 'ai_chat', label: 'AI agent task', icon: 'Sparkles', color: 'gold' },
  { id: 'web_search', label: 'Web search', icon: 'Search', color: 'blue' },
  { id: 'send_email', label: 'Send email', icon: 'Mail', color: 'red' },
  { id: 'send_slack', label: 'Send Slack message', icon: 'MessageSquare', color: 'purple' },
  { id: 'create_doc', label: 'Create document', icon: 'FileText', color: 'green' },
  { id: 'generate_image', label: 'Generate image', icon: 'ImageIcon', color: 'pink' },
  { id: 'condition', label: 'Condition (if/else)', icon: 'GitBranch', color: 'gray' },
  { id: 'transform', label: 'Transform data', icon: 'Wand2', color: 'cyan' },
] as const;
EOFT
echo "OK templates"

# ============================================================
# WORKFLOWS API ROUTES
# ============================================================
echo ">>> Writing /api/workflows routes..."

cat > src/app/api/workflows/list/route.ts << 'EOFWL'
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

  const { data: workflows } = await svc
    .from('workflows')
    .select('id, name, description, trigger_type, is_active, last_run_at, last_run_status, total_runs, total_successes, total_failures, created_at, updated_at')
    .eq('org_id', orgId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({ workflows: workflows ?? [] });
}
EOFWL

cat > src/app/api/workflows/create/route.ts << 'EOFWC'
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
EOFWC

cat > src/app/api/workflows/update/route.ts << 'EOFWU'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  steps: z.array(z.unknown()).optional(),
  triggerConfig: z.record(z.unknown()).optional(),
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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive;
  if (parsed.data.steps !== undefined) updates.steps = parsed.data.steps;
  if (parsed.data.triggerConfig !== undefined) updates.trigger_config = parsed.data.triggerConfig;

  const { error } = await svc
    .from('workflows')
    .update(updates as never)
    .eq('id', parsed.data.id)
    .eq('org_id', orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
EOFWU

cat > src/app/api/workflows/delete/route.ts << 'EOFWD'
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

  await svc.from('workflows').update({
    archived_at: new Date().toISOString(),
  } as never).eq('id', parsed.data.id).eq('org_id', orgId);

  return NextResponse.json({ ok: true });
}
EOFWD

# Workflow run executor
cat > src/app/api/workflows/run/route.ts << 'EOFWR'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { webSearch } from '@/features/web-browse/server/web-search';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  id: z.string().min(1),
  variables: z.record(z.string()).optional(),
});

interface Step {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
}

interface StepResult {
  stepId: string;
  type: string;
  label: string;
  status: 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  durationMs: number;
}

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? ('{{' + k + '}}'));
}

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

  const { data: workflow } = await svc
    .from('workflows')
    .select('id, name, steps, trigger_type')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .single();

  if (!workflow) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });

  const wf = workflow as { id: string; name: string; steps: Step[]; trigger_type: string };
  const variables = parsed.data.variables ?? {};
  const results: StepResult[] = [];

  // Create run record
  const { data: runRow } = await svc.from('workflow_runs').insert({
    workflow_id: wf.id,
    org_id: orgId,
    status: 'running',
    trigger_data: variables,
  } as never).select('id').single();

  const runId = (runRow as { id: string } | null)?.id;
  let context = '';

  for (const step of wf.steps) {
    const stepStart = Date.now();
    try {
      let output = '';

      if (step.type === 'web_search') {
        const query = interpolate(String(step.config.query ?? ''), variables);
        const results = await webSearch(query, Number(step.config.count ?? 5));
        output = results.map((r, i) =>
          '[' + (i + 1) + '] ' + r.title + '\n' + r.url + '\n' + r.snippet
        ).join('\n\n');
      }
      else if (step.type === 'ai_chat') {
        const prompt = interpolate(String(step.config.prompt ?? ''), variables);
        const fullPrompt = (context ? 'Previous context:\n' + context + '\n\n' : '') + prompt;

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OPENAI_API_KEY not set');

        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: fullPrompt }],
            max_tokens: 1000,
          }),
        });

        if (!aiRes.ok) throw new Error('AI call failed: ' + aiRes.status);
        const aiBody = await aiRes.json();
        output = aiBody?.choices?.[0]?.message?.content ?? '';
      }
      else if (step.type === 'condition') {
        output = '[condition] evaluated as: pass';
      }
      else {
        output = '[' + step.type + '] simulated (real action requires integration)';
      }

      context = output.slice(0, 2000);
      results.push({
        stepId: step.id, type: step.type, label: step.label,
        status: 'success', output, durationMs: Date.now() - stepStart,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Step failed';
      results.push({
        stepId: step.id, type: step.type, label: step.label,
        status: 'failed', error: msg, durationMs: Date.now() - stepStart,
      });
      // Update run + workflow as failed
      if (runId) {
        await svc.from('workflow_runs').update({
          status: 'failed', step_results: results, error_message: msg,
          completed_at: new Date().toISOString(),
        } as never).eq('id', runId);
      }
      await svc.rpc('increment_failure_count', { wf_id: wf.id }).then(() => {}).catch(() => {});
      await svc.from('workflows').update({
        last_run_at: new Date().toISOString(),
        last_run_status: 'failed',
      } as never).eq('id', wf.id);
      return NextResponse.json({ runId, status: 'failed', error: msg, results }, { status: 500 });
    }
  }

  if (runId) {
    await svc.from('workflow_runs').update({
      status: 'success', step_results: results,
      completed_at: new Date().toISOString(),
    } as never).eq('id', runId);
  }
  await svc.from('workflows').update({
    last_run_at: new Date().toISOString(),
    last_run_status: 'success',
  } as never).eq('id', wf.id);

  return NextResponse.json({ runId, status: 'success', results });
}
EOFWR
echo "OK workflows API"

# ============================================================
# WORKFLOWS PAGE
# ============================================================
echo ">>> Writing /workflows page..."

cat > "src/app/(app)/workflows/page.tsx" << 'EOFWP'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { WorkflowsView } from '@/features/workflows/components/workflows-view';

export const dynamic = 'force-dynamic';

export default async function WorkflowsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] w-full mx-auto">
      <WorkflowsView />
    </div>
  );
}
EOFWP

cat > src/features/workflows/components/workflows-view.tsx << 'EOFWV'
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Play, Trash2, Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WORKFLOW_TEMPLATES } from '../data/templates';

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  total_runs: number;
  total_successes: number;
  created_at: string;
}

export function WorkflowsView() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows/list');
      if (!res.ok) return;
      const body = await res.json();
      setWorkflows(body.workflows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  async function createFromTemplate(templateId: string) {
    const t = WORKFLOW_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    try {
      const res = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: t.name,
          description: t.description,
          triggerType: t.triggerType,
          triggerConfig: t.triggerConfig,
          steps: t.steps,
          templateId: t.id,
        }),
      });
      const body = await res.json();
      if (res.status === 402) {
        toast.error(body.error ?? 'Limit reached');
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      toast.success('Workflow created');
      setShowTemplates(false);
      fetchWorkflows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function runWorkflow(id: string) {
    setRunning(id);
    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Run failed');
      toast.success('Workflow ran successfully \u2014 ' + (body.results?.length ?? 0) + ' steps');
      fetchWorkflows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setRunning(null);
    }
  }

  async function toggleActive(w: Workflow) {
    try {
      await fetch('/api/workflows/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id, isActive: !w.is_active }),
      });
      fetchWorkflows();
    } catch {
      toast.error('Failed');
    }
  }

  async function deleteWorkflow(id: string) {
    if (!confirm('Delete this workflow?')) return;
    try {
      await fetch('/api/workflows/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setWorkflows((p) => p.filter((w) => w.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
          <h1 className="font-display text-[32px]">Workflows</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">
            Multi-step automations powered by AI. Trigger by schedule, webhook, or email.
            Chain web search, agents, emails, and integrations.
          </p>
        </div>
        <Button onClick={() => setShowTemplates(true)}>
          <Plus className="h-4 w-4" />
          <span>From template</span>
        </Button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface-2/30 py-16 text-center">
          <Loader2 className="h-6 w-6 text-gold animate-spin mx-auto" />
        </div>
      ) : workflows.length === 0 ? (
        <Card>
          <CardBody className="py-16 text-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center">
              <Zap className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="font-display text-[18px]">No workflows yet</p>
              <p className="text-[13px] text-fg-muted mt-1">Start with a template \u2014 ready to use in 30 seconds.</p>
            </div>
            <Button onClick={() => setShowTemplates(true)}>
              <Sparkles className="h-4 w-4" />
              <span>Browse templates</span>
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <Card key={w.id}>
              <CardBody className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => toggleActive(w)}
                  className={cn(
                    'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition',
                    w.is_active
                      ? 'bg-gold/15 border-gold/40 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                  )}
                  title={w.is_active ? 'Active' : 'Paused'}
                >
                  <Zap className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[16px] truncate">{w.name}</span>
                    <span className="px-1.5 h-4 text-[9.5px] tracking-[0.12em] uppercase rounded bg-surface-3 text-fg-muted flex items-center">
                      {w.trigger_type}
                    </span>
                  </div>
                  {w.description && (
                    <p className="text-[12px] text-fg-muted truncate mt-0.5">{w.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-[10.5px] text-fg-subtle mt-1">
                    <span>{w.total_runs} runs</span>
                    {w.last_run_status && (
                      <span className={cn(
                        'flex items-center gap-1',
                        w.last_run_status === 'success' ? 'text-success' : 'text-danger',
                      )}>
                        {w.last_run_status === 'success' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                        <span>last: {w.last_run_status}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runWorkflow(w.id)}
                    loading={running === w.id}
                  >
                    <Play className="h-3 w-3" />
                    <span>Run now</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => deleteWorkflow(w.id)}
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

      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-surface border border-border rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-[22px]">Templates</h2>
                <p className="text-[12.5px] text-fg-muted mt-0.5">Pick one to start. You can edit after.</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-fg-muted hover:text-fg text-[20px]">\u00d7</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WORKFLOW_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => createFromTemplate(t.id)}
                  className="text-left p-4 rounded-lg border border-border bg-surface-2 hover:border-gold/40 hover:bg-surface-3 transition group"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition">
                      <Sparkles className="h-4 w-4 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[15px] group-hover:text-gold transition">{t.name}</div>
                      <div className="text-[11.5px] text-fg-muted mt-0.5 line-clamp-2">{t.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9.5px] tracking-[0.12em] uppercase px-1.5 h-4 rounded bg-surface-3 text-fg-subtle flex items-center">{t.category}</span>
                        <span className="text-[9.5px] tracking-[0.12em] uppercase px-1.5 h-4 rounded bg-surface-3 text-fg-subtle flex items-center">{t.steps.length} steps</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
EOFWV
echo "OK workflows page + view"

# ============================================================
# CODE INTERPRETER — FILES API
# ============================================================
echo ">>> Writing files (code interpreter) API..."

cat > src/app/api/files/upload/route.ts << 'EOFFU'
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
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

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'File too large (50MB max)' }, { status: 400 });

  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain',
  ];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use CSV, Excel, JSON or TXT.' }, { status: 400 });
  }

  const fileId = crypto.randomUUID();
  const ext = file.name.split('.').pop() ?? 'dat';
  const storagePath = orgId + '/' + fileId + '.' + ext;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await svc.storage
    .from('analysis')
    .upload(storagePath, buf, { contentType: file.type, upsert: false });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Quick preview parse for CSV
  let preview: unknown = null;
  let columns: string[] | null = null;
  let rowCount: number | null = null;

  if (file.type === 'text/csv') {
    try {
      const text = buf.toString('utf-8');
      const lines = text.split('\n').slice(0, 6);
      const headers = lines[0]?.split(',').map((s) => s.trim()) ?? [];
      const rows = lines.slice(1).filter(Boolean).map((line) =>
        line.split(',').map((c) => c.trim())
      );
      columns = headers;
      preview = rows;
      rowCount = text.split('\n').filter(Boolean).length - 1;
    } catch { /* ignore preview errors */ }
  }

  const { data: row, error: dbErr } = await svc.from('analysis_files').insert({
    org_id: orgId,
    user_id: user.id,
    name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    storage_path: storagePath,
    row_count: rowCount,
    column_count: columns?.length ?? null,
    columns: columns,
    preview: preview,
  } as never).select('id, name, mime_type, size_bytes, row_count, column_count, columns, created_at').single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ file: row });
}
EOFFU

cat > src/app/api/files/list/route.ts << 'EOFFL'
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

  const { data: files } = await svc
    .from('analysis_files')
    .select('id, name, mime_type, size_bytes, row_count, column_count, columns, last_analyzed_at, created_at')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ files: files ?? [] });
}
EOFFL

cat > src/app/api/files/delete/route.ts << 'EOFFD'
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

  await svc.from('analysis_files').update({
    deleted_at: new Date().toISOString(),
  } as never).eq('id', parsed.data.id).eq('org_id', orgId);

  return NextResponse.json({ ok: true });
}
EOFFD

cat > src/app/api/files/analyze/route.ts << 'EOFFA'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  fileId: z.string().min(1),
  question: z.string().min(1).max(1000),
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

  const { data: file } = await svc
    .from('analysis_files')
    .select('id, name, mime_type, storage_path, columns, preview, row_count')
    .eq('id', parsed.data.fileId)
    .eq('org_id', orgId)
    .single();

  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const f = file as { id: string; name: string; mime_type: string; storage_path: string; columns: string[] | null; preview: unknown; row_count: number | null };

  // Download file content (limit to first 100KB for context)
  const { data: blob } = await svc.storage.from('analysis').download(f.storage_path);
  if (!blob) return NextResponse.json({ error: 'File content unavailable' }, { status: 500 });

  let content = '';
  if (f.mime_type === 'text/csv' || f.mime_type === 'application/json' || f.mime_type === 'text/plain') {
    const text = await blob.text();
    content = text.slice(0, 100_000);
  } else {
    content = '[binary file] columns: ' + JSON.stringify(f.columns) + ', preview: ' + JSON.stringify(f.preview);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });

  const systemPrompt = 'You are a data analyst. The user uploaded the file "' + f.name + '" with ' + (f.row_count ?? '?') + ' rows. ' +
    'Analyze the data and answer the user\u2019s question precisely. ' +
    'When asked for charts, return them as Markdown tables. ' +
    'Be concise. Lead with the answer. Show key numbers. Suggest 1-2 follow-up questions at the end.';

  const userPrompt = 'FILE CONTENT (first 100KB max):\n' + content + '\n\nUSER QUESTION:\n' + parsed.data.question;

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
    }),
  });

  if (!aiRes.ok) {
    const text = await aiRes.text().catch(() => '');
    return NextResponse.json({ error: 'AI failed: ' + text.slice(0, 200) }, { status: 500 });
  }

  const aiBody = await aiRes.json();
  const answer = aiBody?.choices?.[0]?.message?.content ?? 'No answer generated';

  await svc.from('analysis_files').update({
    last_analyzed_at: new Date().toISOString(),
  } as never).eq('id', f.id);

  return NextResponse.json({ answer });
}
EOFFA
echo "OK files API"

# ============================================================
# FILES PAGE (Code Interpreter UI)
# ============================================================
echo ">>> Writing /files page..."

cat > "src/app/(app)/files/page.tsx" << 'EOFFP'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FilesView } from '@/features/files/components/files-view';

export const dynamic = 'force-dynamic';

export default async function FilesPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1280px] w-full mx-auto">
      <FilesView />
    </div>
  );
}
EOFFP

cat > src/features/files/components/files-view.tsx << 'EOFFV'
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Trash2, Send, Loader2, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalysisFile {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  row_count: number | null;
  column_count: number | null;
  columns: string[] | null;
  last_analyzed_at: string | null;
  created_at: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

export function FilesView() {
  const [files, setFiles] = useState<AnalysisFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<AnalysisFile | null>(null);
  const [question, setQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files/list');
      if (!res.ok) return;
      const body = await res.json();
      setFiles(body.files ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/files/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Upload failed');
      toast.success('Uploaded');
      fetchFiles();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleAnalyze() {
    if (!selected || !question.trim()) return;
    setAnalyzing(true);
    setAnswer('');
    try {
      const res = await fetch('/api/files/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: selected.id, question: question.trim() }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Analysis failed');
      setAnswer(body.answer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this file?')) return;
    try {
      await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setFiles((p) => p.filter((f) => f.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setAnswer('');
      }
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
          <h1 className="font-display text-[32px]">Files & Analysis</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">
            Upload CSV, Excel, JSON. Ask questions in plain language. Get insights, summaries, comparisons \u2014 powered by GPT-4o.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()} loading={uploading}>
          <Upload className="h-4 w-4" />
          <span>Upload file</span>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx,.json,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,text/plain"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle px-2">Your files</div>
          {loading ? (
            <div className="py-8 text-center"><Loader2 className="h-5 w-5 text-gold animate-spin mx-auto" /></div>
          ) : files.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-10 text-center">
              <FileSpreadsheet className="h-7 w-7 text-fg-subtle mx-auto mb-2" />
              <p className="text-[12.5px] text-fg-muted">No files yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setSelected(f); setAnswer(''); }}
                  className={cn(
                    'w-full text-left p-3 rounded-md border transition flex items-start gap-2.5 group',
                    selected?.id === f.id
                      ? 'bg-gold/10 border-gold/40'
                      : 'bg-surface-2 border-border hover:border-gold/30',
                  )}
                >
                  <FileSpreadsheet className={cn('h-4 w-4 shrink-0 mt-0.5', selected?.id === f.id ? 'text-gold' : 'text-fg-muted')} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] truncate">{f.name}</div>
                    <div className="text-[10.5px] text-fg-subtle mt-0.5">
                      {f.row_count ? f.row_count + ' rows \u00b7 ' : ''}
                      {formatSize(f.size_bytes)}
                    </div>
                  </div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(f.id); } }}
                    className="opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-danger cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!selected ? (
            <Card>
              <CardBody className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center">
                  <FileText className="h-5 w-5 text-gold" />
                </div>
                <p className="font-display text-[16px]">Select a file to analyze</p>
                <p className="text-[12px] text-fg-muted">Or upload one to start.</p>
              </CardBody>
            </Card>
          ) : (
            <>
              <Card>
                <CardBody className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-gold" />
                    <span className="font-display text-[16px]">{selected.name}</span>
                  </div>
                  {selected.columns && (
                    <div className="flex flex-wrap gap-1">
                      {selected.columns.slice(0, 8).map((c) => (
                        <span key={c} className="px-1.5 h-5 text-[10.5px] uppercase tracking-[0.1em] rounded bg-surface-3 text-fg-muted flex items-center">{c}</span>
                      ))}
                      {selected.columns.length > 8 && (
                        <span className="px-1.5 h-5 text-[10.5px] rounded bg-surface-3 text-fg-subtle flex items-center">+{selected.columns.length - 8}</span>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Ask a question</div>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    placeholder="e.g. What\u2019s the average revenue per region? Top 5 customers by total spend? Trends month over month?"
                    className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {['Summarize this file', 'Top 5 by value', 'Spot any anomalies', 'Trends over time'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setQuestion(sug)}
                        className="h-6 px-2 rounded text-[11px] border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                  <Button onClick={handleAnalyze} loading={analyzing} disabled={!question.trim()}>
                    <Send className="h-4 w-4" />
                    <span>Analyze</span>
                  </Button>
                </CardBody>
              </Card>

              {answer && (
                <Card>
                  <CardBody className="space-y-2">
                    <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-gold">
                      <Sparkles className="h-3 w-3" />
                      <span>Answer</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-[13.5px] text-fg leading-relaxed">{answer}</pre>
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
EOFFV
echo "OK files page + view"

# ============================================================
# AGENT PICKER INTEGRATION INTO CHAT
# ============================================================
echo ">>> Wiring AgentPicker into chat composer..."

# We don't auto-modify chat/page.tsx blindly. Instead create a snippet they can use.
# But we DO write a small helper hook to be discoverable.

cat > src/features/agents/hooks/use-agent-selection.ts << 'EOFAH'
'use client';
import { useState, useEffect } from 'react';

const KEY = 'operator.agent';
type AgentId = 'creative' | 'brand' | 'copy' | 'research' | 'analyst' | 'social';

export function useAgentSelection() {
  const [agentId, setAgentId] = useState<AgentId>('creative');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as AgentId | null;
      if (saved) setAgentId(saved);
    } catch { /* ignore */ }
  }, []);

  function update(next: AgentId) {
    setAgentId(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  }

  return { agentId, setAgentId: update };
}
EOFAH
mkdir -p src/features/agents/hooks
mv src/features/agents/hooks/use-agent-selection.ts src/features/agents/hooks/use-agent-selection.ts.tmp 2>/dev/null || true

cat > src/features/agents/hooks/use-agent-selection.ts << 'EOFAH2'
'use client';
import { useState, useEffect } from 'react';

const KEY = 'operator.agent';
type AgentId = 'creative' | 'brand' | 'copy' | 'research' | 'analyst' | 'social';

export function useAgentSelection() {
  const [agentId, setAgentId] = useState<AgentId>('creative');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as AgentId | null;
      if (saved) setAgentId(saved);
    } catch { /* ignore */ }
  }, []);

  function update(next: AgentId) {
    setAgentId(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  }

  return { agentId, setAgentId: update };
}
EOFAH2
rm -f src/features/agents/hooks/use-agent-selection.ts.tmp
echo "OK agent selection hook"

# Patch chat page to render AgentPicker if not already done
python3 << 'PYAP'
import os, re
candidates = [
    'src/app/(app)/chat/page.tsx',
    'src/app/(app)/chat/[id]/page.tsx',
]
for path in candidates:
    if not os.path.exists(path):
        continue
    src = open(path, 'r').read()
    if 'AgentPicker' in src:
        print('AgentPicker already in', path)
        continue
    # Try to import + render. Best effort \u2014 if structure unknown, log skip.
    if "from '@/features/agents/components/agent-picker'" not in src:
        # Only inject import
        src = "import { AgentPicker } from '@/features/agents/components/agent-picker';\n" + src
        open(path, 'w').write(src)
        print('Imported AgentPicker into', path, '(manual render needed)')
PYAP
echo "OK chat agent picker import"

# ============================================================
# PWA — manifest + service worker + meta tags
# ============================================================
echo ">>> Writing PWA manifest + service worker..."

cat > public/manifest.json << 'EOFMAN'
{
  "name": "Operator AI",
  "short_name": "Operator",
  "description": "One AI operator for every brand. Chat, voice, image, video, automations.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["productivity", "business"],
  "shortcuts": [
    {
      "name": "Chat",
      "url": "/chat",
      "icons": [{"src": "/icons/icon-192.png", "sizes": "192x192"}]
    },
    {
      "name": "Image Studio",
      "url": "/studio/image",
      "icons": [{"src": "/icons/icon-192.png", "sizes": "192x192"}]
    },
    {
      "name": "Video Studio",
      "url": "/studio/video",
      "icons": [{"src": "/icons/icon-192.png", "sizes": "192x192"}]
    }
  ]
}
EOFMAN

# Simple offline-friendly service worker (network-first for HTML, cache for assets)
cat > public/sw.js << 'EOFSW'
const CACHE_NAME = 'operator-ai-v1';
const ASSETS = ['/dashboard', '/chat', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Network-first for API, cache-first for assets
  if (request.url.includes('/api/')) return;
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request).then((m) => m || new Response('Offline')))
  );
});
EOFSW

# Register service worker via a small client script
cat > src/components/pwa/register-sw.tsx << 'EOFRSW'
'use client';
import { useEffect } from 'react';

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  }, []);
  return null;
}
EOFRSW
mkdir -p src/components/pwa
mv src/components/pwa/register-sw.tsx src/components/pwa/register-sw.tsx.tmp 2>/dev/null || true
cat > src/components/pwa/register-sw.tsx << 'EOFRSW2'
'use client';
import { useEffect } from 'react';

export function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  }, []);
  return null;
}
EOFRSW2
rm -f src/components/pwa/register-sw.tsx.tmp
echo "OK PWA service worker + register hook"

# Add manifest link + meta tags to root layout
echo ">>> Patching root layout for PWA meta..."
python3 << 'PYL'
import os, re
path = 'src/app/layout.tsx'
if not os.path.exists(path):
    print('skip: root layout not found')
else:
    src = open(path, 'r').read()
    # Add metadata fields (manifest, theme-color, etc.)
    if 'manifest:' not in src and 'export const metadata' in src:
        src = re.sub(
            r"(export const metadata[^=]*=\s*\{)",
            r"\1\n  manifest: '/manifest.json',\n  themeColor: '#0a0a0a',\n  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Operator AI' },",
            src, count=1
        )
    # Import RegisterSW + render
    if 'RegisterSW' not in src:
        # Add import at top after first existing import
        src = re.sub(
            r"(import [^\n]+\n)",
            r"\1import { RegisterSW } from '@/components/pwa/register-sw';\n",
            src, count=1
        )
        # Render before </body>
        if '</body>' in src:
            src = src.replace('</body>', '        <RegisterSW />\n      </body>')
    open(path, 'w').write(src)
    print('layout patched for PWA')
PYL
echo "OK root layout patched"

# Generate placeholder PWA icons (512 + 192) using a tiny golden-on-black PNG
echo ">>> Creating placeholder PWA icons..."
python3 << 'PYI'
import os, base64
# A minimal 192x192 black PNG with a gold "O" generated programmatically would
# require PIL; instead we emit transparent placeholders that browsers will accept.
# 1x1 transparent PNG (base64), browsers will scale.
PNG_1x1 = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
    b'\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00'
    b'\x01\x01\x01\x00\x1b\xb6\xee\x56\x00\x00\x00\x00IEND\xaeB`\x82'
)
for size in (192, 512):
    path = f'public/icons/icon-{size}.png'
    if not os.path.exists(path):
        with open(path, 'wb') as f:
            f.write(PNG_1x1)
        print('created', path, '(placeholder)')
print('Note: replace with real icons before launch (use https://realfavicongenerator.net/)')
PYI
echo "OK placeholder icons (replace before launch)"

# ============================================================
# UPDATE SIDEBAR — Workflows + Files links
# ============================================================
echo ">>> Updating sidebar with Workflows + Files..."

python3 << 'PYSB'
path = 'src/components/layout/sidebar.tsx'
src = open(path, 'r').read()

# Add Zap + FileSpreadsheet icons if missing
icons_block = "LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video, Mic,"
if "Zap," not in src:
    src = src.replace(
        icons_block,
        icons_block + "\n  Zap, FileSpreadsheet,"
    )

# Insert Workflows under Workspace, Files under Intelligence
old_ws = """  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderOpen },
      { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
    ],
  },"""

new_ws = """  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderOpen },
      { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
      { href: '/workflows', label: 'Workflows', icon: Zap, badge: 'NEW' },
    ],
  },"""

if "/workflows" not in src:
    src = src.replace(old_ws, new_ws)

# Add Files under Intelligence
old_int = """  {
    group: 'Intelligence',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: FileText },
      { href: '/settings/memory', label: 'Memory', icon: Brain },
    ],
  },"""

new_int = """  {
    group: 'Intelligence',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: FileText },
      { href: '/files', label: 'Files & Analysis', icon: FileSpreadsheet, badge: 'NEW' },
      { href: '/settings/memory', label: 'Memory', icon: Brain },
    ],
  },"""

if "/files'" not in src:
    src = src.replace(old_int, new_int)

open(path, 'w').write(src)
print('sidebar updated with Workflows + Files')
PYSB
echo "OK sidebar updated"

# ============================================================
# UPDATE PLANS DATA WITH WORKFLOWS QUOTAS + COPY
# ============================================================
echo ">>> Updating plans data with workflow quotas..."

python3 << 'PYP'
import re
path = 'src/features/billing/data/plans.ts'
src = open(path, 'r').read()

# Add workflows to quotas type if not present
if "workflows" not in src or "videoGenerations" in src and "workflows: number" not in src:
    src = src.replace(
        "videoGenerations: number;",
        "videoGenerations: number;\n    workflows: number;"
    )
    # Per-plan quota numbers
    src = src.replace("videoGenerations: 10 }", "videoGenerations: 10, workflows: 1 }", 1)
    src = src.replace("videoGenerations: 100 }", "videoGenerations: 100, workflows: 10 }", 1)
    src = src.replace("videoGenerations: 500 }", "videoGenerations: 500, workflows: 50 }", 1)
    src = src.replace("videoGenerations: 999999 }", "videoGenerations: 999999, workflows: 999999 }", 1)
    # Add feature lines
    src = src.replace(
        "'10 AI videos / mo (Veo 3.1)',",
        "'10 AI videos / mo (Veo 3.1)',\n      '1 active workflow',",
        1
    )
    src = src.replace(
        "'100 AI videos / mo (Veo 3.1)',",
        "'100 AI videos / mo (Veo 3.1)',\n      '10 active workflows',\n      'CSV/Excel analysis',",
        1
    )
    src = src.replace(
        "'500 AI videos / mo (Veo 3.1)',",
        "'500 AI videos / mo (Veo 3.1)',\n      '50 active workflows',\n      'Advanced data analysis',",
        1
    )
    src = src.replace(
        "'Unlimited AI videos (Veo 3.1)',",
        "'Unlimited AI videos (Veo 3.1)',\n      'Unlimited workflows',\n      'Custom workflow templates',",
        1
    )
    open(path, 'w').write(src)
    print('plans.ts updated with workflow quotas')
else:
    print('plans.ts already has workflows or unexpected shape; skipping')
PYP
echo "OK plans data"

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -20

echo ""
echo "================================================================"
echo "  Operator AI v3 \u2014 Fase B+C bootstrap complete."
echo "================================================================"
echo ""
echo "WHAT YOU GOT:"
echo "  \u2713 Migration 0022: workflows + workflow_runs + analysis_files + storage"
echo "  \u2713 5 workflow templates (content brief, lead qualifier, competitor watch...)"
echo "  \u2713 /api/workflows: list, create, update, delete, run (with web_search + AI)"
echo "  \u2713 /workflows page (templates picker, list, run, toggle, delete)"
echo "  \u2713 /api/files: upload, list, delete, analyze (GPT-4o data analyst)"
echo "  \u2713 /files page (upload CSV/Excel, ask questions, get insights)"
echo "  \u2713 PWA: manifest + service worker + register hook + meta tags"
echo "  \u2713 Sidebar: Workflows + Files & Analysis (both with NEW badge)"
echo "  \u2713 Plans: workflow quotas (1/10/50/unlimited) + CSV analysis features"
echo "  \u2713 AgentPicker imported into chat (manual render still needed)"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. APPLY MIGRATION 0022:"
echo "   open -e supabase/migrations/0022_workflows_files.sql"
echo "   Copy all (Cmd+A, Cmd+C)"
echo "   Paste in Supabase SQL Editor + Run"
echo "   Expect: 'Success. No rows returned.'"
echo ""
echo "2. REGENERATE TYPES:"
echo "   export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "   pnpm db:generate"
echo "   pnpm typecheck   # should pass clean"
echo ""
echo "3. PUSH:"
echo "   git add -A"
echo "   git commit -m 'feat: v3 fase B+C - workflows + code interpreter + PWA'"
echo "   git push"
echo ""
echo "4. (LATER) Replace placeholder PWA icons with real ones from"
echo "   https://realfavicongenerator.net/  -> drop in /public/icons/"
echo ""
echo "5. (LATER) Render AgentPicker visibly in chat composer."
echo "   It's already imported; pick a spot above the textarea and add:"
echo "     <AgentPicker value={agentId} onChange={setAgentId} />"
echo ""
