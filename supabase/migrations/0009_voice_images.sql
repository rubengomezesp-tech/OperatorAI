create type voice_kind as enum ('stt', 'tts');
create type voice_status as enum ('pending', 'processing', 'complete', 'failed');

create table public.voice_requests (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  assistant_id    text references public.assistants(id) on delete set null,
  conversation_id text references public.conversations(id) on delete set null,
  kind            voice_kind not null,
  provider        text not null,
  model           text,
  voice_id        text,
  input_text      text,
  input_audio_storage_path text,
  input_audio_mime text,
  input_duration_ms int,
  output_text     text,
  output_audio_storage_path text,
  output_audio_mime text,
  output_duration_ms int,
  latency_ms      int,
  cost_usd        numeric(10,6),
  status          voice_status not null default 'pending',
  error_message   text,
  language        text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index voice_org_created_idx on public.voice_requests (org_id, created_at desc);
create index voice_user_idx on public.voice_requests (user_id);
create index voice_conv_idx on public.voice_requests (conversation_id);
create trigger voice_updated_at before update on public.voice_requests
  for each row execute function tg_set_updated_at();

create type image_status as enum ('pending', 'processing', 'complete', 'failed');

create table public.image_generations (
  id              text primary key default gen_cuid2(),
  org_id          text not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  assistant_id    text references public.assistants(id) on delete set null,
  conversation_id text references public.conversations(id) on delete set null,
  message_id      text references public.messages(id) on delete set null,
  prompt          text not null,
  enhanced_prompt text,
  negative_prompt text,
  preset          text,
  aspect_ratio    text not null default '1:1',
  seed            bigint,
  reference_storage_path text,
  reference_mime_type    text,
  provider        text not null,
  model           text not null,
  provider_job_id text,
  output_urls     text[] default array[]::text[],
  output_storage_paths text[] default array[]::text[],
  width           int,
  height          int,
  latency_ms      int,
  cost_usd        numeric(10,6),
  status          image_status not null default 'pending',
  error_message   text,
  is_starred      boolean not null default false,
  tags            text[] default array[]::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index images_org_created_idx on public.image_generations (org_id, created_at desc);
create index images_user_idx on public.image_generations (user_id);
create index images_starred_idx on public.image_generations (org_id, user_id) where is_starred = true;
create index images_tags_idx on public.image_generations using gin (tags);
create trigger images_updated_at before update on public.image_generations
  for each row execute function tg_set_updated_at();
