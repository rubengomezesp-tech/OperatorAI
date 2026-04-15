-- Plans table (managed by Stripe; this is our local mirror)
create table if not exists public.plans (
  id text primary key, -- e.g. "starter", "pro", "agency"
  stripe_price_id text unique,
  name text not null,
  monthly_price_cents integer not null,
  quota_chat_messages integer not null default 0,
  quota_image_generations integer not null default 0,
  quota_knowledge_documents integer not null default 0,
  quota_assistants integer not null default 0,
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Subscriptions tied to orgs
create table if not exists public.subscriptions (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  plan_id text references public.plans(id),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'trialing',
    -- one of: 'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused'
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_org_unique
  on public.subscriptions (org_id)
  where status in ('trialing', 'active', 'past_due', 'paused');

create index if not exists subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

-- RLS
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "plans are readable by everyone" on public.plans;
create policy "plans are readable by everyone"
  on public.plans for select
  using (true);

drop policy if exists "subscriptions by org members" on public.subscriptions;
create policy "subscriptions by org members"
  on public.subscriptions for select
  using (public.is_org_member(org_id));

-- Seed plans
insert into public.plans (id, name, monthly_price_cents, quota_chat_messages, quota_image_generations, quota_knowledge_documents, quota_assistants, features, sort_order)
values
  ('starter', 'Starter',   2900,    500,    50,   10,    1, '["3 AI models","500 chat messages/mo","50 images/mo","10 documents","1 assistant","Email support"]'::jsonb, 1),
  ('pro',     'Pro',       9900,   3000,   300,  100,    5, '["3 AI models","3000 chat messages/mo","300 images/mo","100 documents","5 assistants","Priority support","All presets","Reference images","Refinement"]'::jsonb, 2),
  ('agency',  'Agency',   29900,  15000,  1500, 999999, 999999, '["3 AI models","15000 chat messages/mo","1500 images/mo","Unlimited documents","Unlimited assistants","Priority support","Concierge onboarding","Custom branding"]'::jsonb, 3)
on conflict (id) do update set
  name = excluded.name,
  monthly_price_cents = excluded.monthly_price_cents,
  quota_chat_messages = excluded.quota_chat_messages,
  quota_image_generations = excluded.quota_image_generations,
  quota_knowledge_documents = excluded.quota_knowledge_documents,
  quota_assistants = excluded.quota_assistants,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Function: check_quota returns true if under limit, false if over
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
  -- Load active subscription
  select * into v_sub
  from public.subscriptions
  where org_id = p_org_id
    and status in ('trialing', 'active', 'past_due')
  order by created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'no_subscription',
      'used', 0,
      'limit', 0
    );
  end if;

  -- Trial or active with no plan = Pro defaults during trial
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
    v_limit := v_plan.quota_chat_messages;
    select coalesce(sum(quantity), 0) into v_used
      from public.usage_events
      where org_id = p_org_id and kind = 'chat_message' and created_at >= v_period_start;
  elsif p_kind = 'image_generation' then
    v_limit := v_plan.quota_image_generations;
    select coalesce(sum(quantity), 0) into v_used
      from public.usage_events
      where org_id = p_org_id and kind = 'image_generation' and created_at >= v_period_start;
  elsif p_kind = 'knowledge_document' then
    v_limit := v_plan.quota_knowledge_documents;
    select count(*)::bigint into v_used
      from public.documents
      where org_id = p_org_id and deleted_at is null;
  elsif p_kind = 'assistant' then
    v_limit := v_plan.quota_assistants;
    select count(*)::bigint into v_used
      from public.assistants
      where org_id = p_org_id and deleted_at is null;
  else
    return jsonb_build_object('allowed', false, 'reason', 'unknown_kind', 'used', 0, 'limit', 0);
  end if;

  return jsonb_build_object(
    'allowed', v_used < v_limit,
    'used', v_used,
    'limit', v_limit,
    'plan_id', v_plan.id,
    'status', v_sub.status,
    'trial_ends_at', v_sub.trial_ends_at
  );
end;
$$;

grant execute on function public.check_quota(text, text) to authenticated, service_role;

-- Trigger: when an organization is created, start a 7-day trial
create or replace function public.start_trial_for_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (org_id, status, trial_ends_at, current_period_start, current_period_end)
  values (
    new.id,
    'trialing',
    now() + interval '7 days',
    now(),
    now() + interval '7 days'
  )
  on conflict (org_id) where status in ('trialing', 'active', 'past_due', 'paused') do nothing;
  return new;
end;
$$;

drop trigger if exists on_organization_created_trial on public.organizations;
create trigger on_organization_created_trial
  after insert on public.organizations
  for each row execute function public.start_trial_for_new_org();

-- Backfill trials for any existing orgs without a subscription
insert into public.subscriptions (org_id, status, trial_ends_at, current_period_start, current_period_end)
select o.id, 'trialing', now() + interval '7 days', now(), now() + interval '7 days'
from public.organizations o
where not exists (
  select 1 from public.subscriptions s where s.org_id = o.id
);

notify pgrst, 'reload schema';
