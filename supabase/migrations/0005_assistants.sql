create table public.assistants (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  name            text not null,
  slug            text not null,
  avatar_url      text,
  description     text,
  business_name   text not null,
  industry        text,
  audience        text,
  goals           text[],
  services        text[],
  tone            text[],
  languages       text[] not null default array['en'],
  writing_style   text,
  visual_style    text,
  banned_words    text[],
  custom_instructions text,
  voice_enabled   boolean not null default true,
  voice_provider  text default 'openai-tts',
  voice_id        text default 'alloy',
  voice_speed     numeric(3,2) default 1.00 check (voice_speed between 0.25 and 4.00),
  preferred_text_model   text default 'gpt-4o',
  preferred_image_model  text default 'flux-1.1-pro',
  temperature     numeric(3,2) default 0.70 check (temperature between 0.00 and 2.00),
  prompt_version_id text references public.prompt_versions(id),
  is_default      boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (org_id, slug)
);
create index assistants_org_idx on public.assistants (org_id) where deleted_at is null;
create unique index assistants_org_default_idx on public.assistants (org_id)
  where is_default = true and deleted_at is null;
create trigger assistants_updated_at before update on public.assistants
  for each row execute function tg_set_updated_at();
