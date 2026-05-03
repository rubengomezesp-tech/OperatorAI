-- Tabla para rate limit del chat público (3 mensajes / 24h por IP)
create table if not exists public.public_chat_usage (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  created_at timestamptz not null default now()
);

create index if not exists public_chat_usage_ip_created_idx
  on public.public_chat_usage (ip, created_at desc);

-- Limpiar registros antiguos (>7 días) automáticamente cuando hagas mantenimiento
-- DELETE FROM public.public_chat_usage WHERE created_at < now() - interval '7 days';
