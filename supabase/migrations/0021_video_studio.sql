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
