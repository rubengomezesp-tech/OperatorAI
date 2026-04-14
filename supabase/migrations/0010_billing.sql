create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled',
  'incomplete', 'incomplete_expired', 'unpaid', 'paused'
);

create table public.plans (
  id              text primary key,
  name            text not null,
  description     text,
  is_public       boolean not null default true,
  is_default      boolean not null default false,
  stripe_product_id text,
  stripe_price_monthly_id text,
  stripe_price_yearly_id  text,
  price_monthly_usd numeric(10,2),
  price_yearly_usd  numeric(10,2),
  entitlements    jsonb not null default '{}'::jsonb,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger plans_updated_at before update on public.plans
  for each row execute function tg_set_updated_at();

create table public.subscriptions (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  plan_id         text not null references public.plans(id),
  status          subscription_status not null,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  billing_interval text check (billing_interval in ('monthly', 'yearly')),
  current_period_start timestamptz,
  current_period_end   timestamptz,
  trial_start     timestamptz,
  trial_end       timestamptz,
  cancel_at       timestamptz,
  canceled_at     timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id)
);
create index subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_period_end_idx on public.subscriptions (current_period_end);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function tg_set_updated_at();

create table public.invoices (
  id              text primary key,
  org_id          text not null references public.organizations(id) on delete cascade,
  subscription_id text references public.subscriptions(id) on delete set null,
  stripe_hosted_invoice_url text,
  stripe_pdf_url  text,
  amount_due_usd  numeric(10,2),
  amount_paid_usd numeric(10,2),
  currency        text default 'usd',
  status          text,
  period_start    timestamptz,
  period_end      timestamptz,
  created_at      timestamptz not null default now()
);
create index invoices_org_created_idx on public.invoices (org_id, created_at desc);
