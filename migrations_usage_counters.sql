-- ════════════════════════════════════════════════════════════════════════════
-- USAGE_COUNTERS: tracking de uso por org y mes
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  chat_messages int not null default 0,
  image_generations int not null default 0,
  video_generations int not null default 0,
  knowledge_documents int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, period_start)
);

create index if not exists usage_counters_org_period_idx
  on public.usage_counters (org_id, period_start desc);

-- Helper: get/upsert el counter del mes actual
create or replace function public.get_or_create_usage_counter(p_org_id uuid)
returns public.usage_counters
language plpgsql
as $$
declare
  v_period_start timestamptz := date_trunc('month', now());
  v_period_end timestamptz := date_trunc('month', now()) + interval '1 month';
  v_row public.usage_counters;
begin
  insert into public.usage_counters (org_id, period_start, period_end)
  values (p_org_id, v_period_start, v_period_end)
  on conflict (org_id, period_start) do update set updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

-- Helper: incrementar contador
create or replace function public.increment_usage(
  p_org_id uuid,
  p_field text,
  p_amount int default 1
)
returns int
language plpgsql
as $$
declare
  v_period_start timestamptz := date_trunc('month', now());
  v_new_value int;
begin
  -- Asegurar que existe el row del mes
  perform public.get_or_create_usage_counter(p_org_id);
  
  if p_field = 'chat_messages' then
    update public.usage_counters
      set chat_messages = chat_messages + p_amount, updated_at = now()
      where org_id = p_org_id and period_start = v_period_start
      returning chat_messages into v_new_value;
  elsif p_field = 'image_generations' then
    update public.usage_counters
      set image_generations = image_generations + p_amount, updated_at = now()
      where org_id = p_org_id and period_start = v_period_start
      returning image_generations into v_new_value;
  elsif p_field = 'video_generations' then
    update public.usage_counters
      set video_generations = video_generations + p_amount, updated_at = now()
      where org_id = p_org_id and period_start = v_period_start
      returning video_generations into v_new_value;
  end if;
  
  return v_new_value;
end;
$$;
