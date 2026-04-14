create table public.eval_suites (
  id              text primary key default gen_cuid2(),
  name            text not null,
  description     text,
  test_cases      jsonb not null,
  created_at      timestamptz not null default now()
);

create table public.eval_runs (
  id              text primary key default gen_cuid2(),
  suite_id        text not null references public.eval_suites(id) on delete cascade,
  prompt_version_id text references public.prompt_versions(id) on delete set null,
  model           text not null,
  pass_count      int not null default 0,
  fail_count      int not null default 0,
  scores          jsonb,
  details         jsonb,
  status          text not null default 'pending',
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index eval_runs_suite_idx on public.eval_runs (suite_id, created_at desc);

create type feedback_kind as enum ('thumbs_up', 'thumbs_down', 'rating', 'comment', 'bug_report');

create table public.feedback (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  message_id      text references public.messages(id) on delete cascade,
  conversation_id text references public.conversations(id) on delete cascade,
  image_id        text references public.image_generations(id) on delete cascade,
  kind            feedback_kind not null,
  rating          int check (rating between 1 and 5),
  comment         text,
  categories      text[],
  resolved        boolean not null default false,
  resolved_by     uuid references public.users(id),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index feedback_org_created_idx on public.feedback (org_id, created_at desc);
create index feedback_message_idx on public.feedback (message_id);
create index feedback_kind_idx on public.feedback (kind, created_at desc);

create type job_status as enum ('queued', 'running', 'completed', 'failed', 'retrying');

create table public.jobs (
  id              text primary key default gen_cuid2(),
  org_id          text references public.organizations(id) on delete cascade,
  kind            text not null,
  inngest_run_id  text unique,
  payload         jsonb,
  status          job_status not null default 'queued',
  attempts        int not null default 0,
  error           text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index jobs_org_kind_idx on public.jobs (org_id, kind, created_at desc);
create index jobs_status_idx on public.jobs (status);
