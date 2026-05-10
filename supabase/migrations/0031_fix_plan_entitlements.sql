-- ═══════════════════════════════════════════════════════════════
-- 🔧 FIX PLAN ENTITLEMENTS — Sprint 6 hotfix
-- ═══════════════════════════════════════════════════════════════
-- Problem: plans 'pro' y 'starter' en BD tienen entitlements antiguos
-- (chat_messages_per_month, image_generations_per_month, ...).
-- check_quota() busca entitlements->>'integrations' y devuelve 0,
-- bloqueando todas las connections con "Integration limit reached".
--
-- Migration 0020 actualizó 'agency' y creó 'studio', pero olvidó
-- actualizar 'pro' y 'starter' al schema nuevo.
--
-- Fix: actualizar entitlements de 'pro' y 'starter' al schema correcto.
-- Match con plans.ts en código (source of truth).
-- ═══════════════════════════════════════════════════════════════

-- ── PRO PLAN ─────────────────────────────────────────────────────
-- $99/mo — For brands and pros
update public.plans
set entitlements = jsonb_build_object(
  'chat_messages', 1500,
  'image_generations', 150,
  'video_generations', 5,
  'knowledge_documents', 100,
  'assistants', 5,
  'projects', 5,
  'integrations', 10,
  'workflows', 25,
  'team_seats', 1,
  'features', coalesce(entitlements->'features', '{}'::jsonb)
)
where id = 'pro';

-- ── STARTER PLAN ─────────────────────────────────────────────────
-- $29/mo — For individuals
update public.plans
set entitlements = jsonb_build_object(
  'chat_messages', 200,
  'image_generations', 30,
  'video_generations', 0,
  'knowledge_documents', 10,
  'assistants', 1,
  'projects', 1,
  'integrations', 2,
  'workflows', 5,
  'team_seats', 1,
  'features', coalesce(entitlements->'features', '{}'::jsonb)
)
where id = 'starter';

-- ── ENSURE 'pro' EXISTS (idempotent) ─────────────────────────────
-- Si por alguna razón 'pro' no existe en plans table, lo creamos.
insert into public.plans (
  id, name, description,
  price_monthly_usd, price_yearly_usd,
  entitlements, sort_order, is_public, is_default
)
values (
  'pro', 'Pro', 'For brands and pros',
  99, 990,
  jsonb_build_object(
    'chat_messages', 1500,
    'image_generations', 150,
    'video_generations', 5,
    'knowledge_documents', 100,
    'assistants', 5,
    'projects', 5,
    'integrations', 10,
    'workflows', 25,
    'team_seats', 1,
    'features', '{}'::jsonb
  ),
  2, true, false
)
on conflict (id) do nothing;

-- ── ENSURE 'starter' EXISTS (idempotent) ──────────────────────────
insert into public.plans (
  id, name, description,
  price_monthly_usd, price_yearly_usd,
  entitlements, sort_order, is_public, is_default
)
values (
  'starter', 'Starter', 'For individuals',
  29, 290,
  jsonb_build_object(
    'chat_messages', 200,
    'image_generations', 30,
    'video_generations', 0,
    'knowledge_documents', 10,
    'assistants', 1,
    'projects', 1,
    'integrations', 2,
    'workflows', 5,
    'team_seats', 1,
    'features', '{}'::jsonb
  ),
  1, true, false
)
on conflict (id) do nothing;

-- ── VERIFICATION (informational, no-op if all good) ──────────────
-- Después de aplicar, este select debería devolver integrations >= 2
-- para starter, >= 10 para pro, etc.
--
--   select id, entitlements->>'integrations' as integrations_limit
--   from public.plans
--   order by sort_order;
