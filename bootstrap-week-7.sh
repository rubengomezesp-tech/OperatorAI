#!/usr/bin/env bash
set -euo pipefail

echo ">>> Operator AI - Week 7"
echo ">>> Stripe + 3 plans + 7-day trial + quotas"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Installing deps (stripe)..."
pnpm add stripe @stripe/stripe-js 2>&1 | tail -5

echo ""
echo ">>> Creating directories..."
mkdir -p src/features/billing/server
mkdir -p src/features/billing/data
mkdir -p src/features/billing/components
mkdir -p src/app/api/billing/checkout
mkdir -p src/app/api/billing/portal
mkdir -p src/app/api/billing/sync
mkdir -p src/app/api/webhooks/stripe
mkdir -p "src/app/(marketing)/pricing"
mkdir -p "src/app/(app)/settings/billing"
mkdir -p "src/app/billing/success"

echo ">>> Migration 0018 - billing + quotas..."

cat > supabase/migrations/0018_billing.sql << 'EOFMIG'
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
EOFMIG
echo "OK migration 0018"

echo ">>> Running migration via Supabase CLI..."
export $(grep -v '^#' .env.local | xargs) 2>/dev/null || true
pnpm supabase db push --linked --include-all 2>&1 | tail -10 || echo "(migration push skipped — run manually via SQL editor if needed)"

echo ""
echo ">>> Writing plan constants (shared between backend and UI)..."

cat > src/features/billing/data/plans.ts << 'EOFPLANS'
export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface PlanDefinition {
  id: 'starter' | 'pro' | 'agency';
  name: string;
  tagline: string;
  priceCents: number;
  priceDisplay: string;
  quotas: {
    chatMessages: number;
    imageGenerations: number;
    knowledgeDocuments: number;
    assistants: number;
  };
  features: string[];
  highlight?: boolean;
  cta: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For individuals and small projects',
    priceCents: 2900,
    priceDisplay: '$29',
    quotas: {
      chatMessages: 500,
      imageGenerations: 50,
      knowledgeDocuments: 10,
      assistants: 1,
    },
    features: [
      'GPT-4o, Claude Sonnet 4.5, Gemini 3.1 Pro',
      '500 chat messages / month',
      '50 AI images / month',
      '10 documents in Knowledge',
      '1 branded assistant',
      'Email support',
    ],
    cta: 'Start with Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For brands and independent professionals',
    priceCents: 9900,
    priceDisplay: '$99',
    quotas: {
      chatMessages: 3000,
      imageGenerations: 300,
      knowledgeDocuments: 100,
      assistants: 5,
    },
    features: [
      'Everything in Starter',
      '3,000 chat messages / month',
      '300 AI images / month',
      '100 documents in Knowledge',
      '5 branded assistants',
      'Reference images + refinement',
      'All editorial presets',
      'Priority support',
    ],
    highlight: true,
    cta: 'Start with Pro',
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For studios managing multiple brands',
    priceCents: 29900,
    priceDisplay: '$299',
    quotas: {
      chatMessages: 15000,
      imageGenerations: 1500,
      knowledgeDocuments: 999999,
      assistants: 999999,
    },
    features: [
      'Everything in Pro',
      '15,000 chat messages / month',
      '1,500 AI images / month',
      'Unlimited documents',
      'Unlimited assistants',
      'Concierge onboarding',
      'Custom branding',
      'Dedicated account manager',
    ],
    cta: 'Start with Agency',
  },
];

export function findPlan(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatLimit(n: number): string {
  if (n >= 999999) return 'Unlimited';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return n.toString();
}
EOFPLANS
echo "OK plans.ts"

echo ">>> Writing Stripe server client..."

cat > src/features/billing/server/stripe-client.ts << 'EOFSTRIPE'
import 'server-only';
import Stripe from 'stripe';
import { serverEnv } from '@/lib/env';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    if (!serverEnv.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    client = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return client;
}
EOFSTRIPE

echo ">>> Writing subscription helpers..."

cat > src/features/billing/server/subscription.ts << 'EOFSUB'
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findPlan } from '../data/plans';

export interface SubscriptionSummary {
  id: string;
  orgId: string;
  planId: 'starter' | 'pro' | 'agency' | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export async function getActiveSubscription(
  svc: SupabaseClient,
  orgId: string,
): Promise<SubscriptionSummary | null> {
  const { data } = await svc
    .from('subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['trialing', 'active', 'past_due', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    id: string;
    org_id: string;
    plan_id: string | null;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };

  return {
    id: row.id,
    orgId: row.org_id,
    planId: row.plan_id as SubscriptionSummary['planId'],
    status: row.status as SubscriptionSummary['status'],
    trialEndsAt: row.trial_ends_at,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

export function isSubscriptionActive(sub: SubscriptionSummary | null): boolean {
  if (!sub) return false;
  if (sub.status === 'active') return true;
  if (sub.status === 'past_due') return true;
  if (sub.status === 'trialing') {
    if (!sub.trialEndsAt) return true;
    return new Date(sub.trialEndsAt).getTime() > Date.now();
  }
  return false;
}

export function daysUntilTrialEnds(sub: SubscriptionSummary | null): number | null {
  if (!sub || sub.status !== 'trialing' || !sub.trialEndsAt) return null;
  const ms = new Date(sub.trialEndsAt).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number;
  reason?: string;
  planId?: string;
}

export async function checkQuota(
  svc: SupabaseClient,
  orgId: string,
  kind: 'chat_message' | 'image_generation' | 'knowledge_document' | 'assistant',
): Promise<QuotaCheck> {
  const { data, error } = await svc.rpc('check_quota', {
    p_org_id: orgId,
    p_kind: kind,
  });
  if (error) {
    return { allowed: false, used: 0, limit: 0, reason: error.message };
  }
  return data as QuotaCheck;
}

export function planDisplayName(planId: string | null, status: string): string {
  if (status === 'trialing' && !planId) return 'Pro Trial';
  if (!planId) return 'No plan';
  const plan = findPlan(planId);
  return plan?.name ?? planId;
}
EOFSUB
echo "OK subscription.ts"

echo ">>> Writing script to sync plans/prices to Stripe..."

cat > scripts/stripe-setup.mjs << 'EOFSCRIPT'
#!/usr/bin/env node
/* eslint-disable no-console */
import 'dotenv/config';
import Stripe from 'stripe';
import { readFileSync, writeFileSync } from 'node:fs';

const KEY = process.env.STRIPE_SECRET_KEY;
if (!KEY) {
  console.error('STRIPE_SECRET_KEY missing in env');
  process.exit(1);
}
const stripe = new Stripe(KEY, { apiVersion: '2025-09-30.clover' });

const PLANS = [
  { id: 'starter', name: 'Operator AI - Starter', priceCents: 2900 },
  { id: 'pro',     name: 'Operator AI - Pro',     priceCents: 9900 },
  { id: 'agency',  name: 'Operator AI - Agency',  priceCents: 29900 },
];

async function ensureProductAndPrice(plan) {
  // Find existing product by metadata.operator_plan_id
  const existing = await stripe.products.search({
    query: 'metadata[\'operator_plan_id\']:\'' + plan.id + '\'',
  });

  let product;
  if (existing.data.length > 0) {
    product = existing.data[0];
    console.log('[' + plan.id + '] product exists: ' + product.id);
  } else {
    product = await stripe.products.create({
      name: plan.name,
      metadata: { operator_plan_id: plan.id },
    });
    console.log('[' + plan.id + '] created product: ' + product.id);
  }

  // Find existing recurring price at the same unit amount
  const prices = await stripe.prices.list({ product: product.id, limit: 100, active: true });
  let price = prices.data.find(
    (p) => p.unit_amount === plan.priceCents && p.recurring?.interval === 'month' && p.currency === 'usd',
  );

  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { operator_plan_id: plan.id },
    });
    console.log('[' + plan.id + '] created price: ' + price.id);
  } else {
    console.log('[' + plan.id + '] price exists: ' + price.id);
  }

  return { planId: plan.id, productId: product.id, priceId: price.id };
}

const results = [];
for (const plan of PLANS) {
  const r = await ensureProductAndPrice(plan);
  results.push(r);
}

console.log('\n=== Summary ===');
for (const r of results) {
  console.log(r.planId.padEnd(10) + ' price_id=' + r.priceId);
}

const envPath = '.env.local';
let current = '';
try { current = readFileSync(envPath, 'utf8'); } catch {}

for (const r of results) {
  const varName = 'STRIPE_PRICE_' + r.planId.toUpperCase();
  const line = varName + '=' + r.priceId;
  const re = new RegExp('^' + varName + '=.*$', 'm');
  if (re.test(current)) {
    current = current.replace(re, line);
  } else {
    current = current.trimEnd() + '\n' + line + '\n';
  }
}

writeFileSync(envPath, current);
console.log('\n.env.local updated with STRIPE_PRICE_* vars.');

console.log('\nNow run in Supabase SQL editor:\n');
for (const r of results) {
  console.log('update public.plans set stripe_price_id = \'' + r.priceId + '\' where id = \'' + r.planId + '\';');
}
console.log('\n(Alternatively, we auto-read these from the .env.local-configured price IDs at runtime.)');
EOFSCRIPT
echo "OK stripe-setup.mjs"

# Make scripts dir if not exists
mkdir -p scripts

# Add script to package.json via a small node shim (idempotent)
if ! grep -q '"stripe:setup"' package.json; then
  perl -i -pe 's|"typecheck": "tsc --noEmit"|"typecheck": "tsc --noEmit",\n    "stripe:setup": "node scripts/stripe-setup.mjs"|' package.json
fi

echo ">>> Updating env schema with Stripe price IDs..."

cat > src/lib/env.ts << 'EOFENV'
import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === '' ? undefined : v))
  .pipe(z.string().url().optional());

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Operator AI'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),

  DEFAULT_TEXT_PROVIDER: z.enum(['openai', 'anthropic', 'google']).default('openai'),
  DEFAULT_IMAGE_PROVIDER: z.enum(['replicate']).default('replicate'),

  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_HOST: optionalUrl.transform((v) => v ?? 'https://cloud.langfuse.com'),

  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_AGENCY: z.string().optional(),

  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('Operator AI <noreply@operatorai.app>'),
});

export const serverEnv = (() => {
  if (typeof window !== 'undefined') throw new Error('serverEnv accessed in browser');
  return serverSchema.parse(process.env);
})();
EOFENV

echo ">>> Writing checkout API..."

cat > src/app/api/billing/checkout/route.ts << 'EOFCHECKOUT'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getStripe } from '@/features/billing/server/stripe-client';
import { getActiveSubscription } from '@/features/billing/server/subscription';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

const BodySchema = z.object({
  planId: z.enum(['starter', 'pro', 'agency']),
});

function priceIdForPlan(planId: string): string | null {
  if (planId === 'starter') return serverEnv.STRIPE_PRICE_STARTER ?? null;
  if (planId === 'pro') return serverEnv.STRIPE_PRICE_PRO ?? null;
  if (planId === 'agency') return serverEnv.STRIPE_PRICE_AGENCY ?? null;
  return null;
}

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  let orgName: string;
  try {
    const ctx = await resolveOrgContext(svc, user.id);
    orgId = ctx.orgId;
    orgName = ctx.orgName;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const priceId = priceIdForPlan(parsed.data.planId);
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured. Run pnpm stripe:setup' }, { status: 500 });
  }

  const stripe = getStripe();
  const sub = await getActiveSubscription(svc, orgId);

  // Reuse customer if exists; otherwise create
  let customerId = sub?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      name: orgName,
      metadata: { org_id: orgId, user_id: user.id },
    });
    customerId = customer.id;

    // Persist customer id immediately
    if (sub) {
      await svc
        .from('subscriptions')
        .update({ stripe_customer_id: customerId } as never)
        .eq('id', sub.id);
    }
  }

  const appUrl = serverEnv.NEXT_PUBLIC_APP_URL;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: appUrl + '/billing/success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: appUrl + '/pricing?canceled=1',
    subscription_data: {
      metadata: { org_id: orgId, plan_id: parsed.data.planId },
    },
    metadata: { org_id: orgId, plan_id: parsed.data.planId },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  });

  return NextResponse.json({ url: session.url });
}
EOFCHECKOUT
echo "OK checkout route"

echo ">>> Writing customer portal API..."

cat > src/app/api/billing/portal/route.ts << 'EOFPORTAL'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getStripe } from '@/features/billing/server/stripe-client';
import { getActiveSubscription } from '@/features/billing/server/subscription';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST() {
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

  const sub = await getActiveSubscription(svc, orgId);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account yet' }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: serverEnv.NEXT_PUBLIC_APP_URL + '/settings/billing',
  });

  return NextResponse.json({ url: session.url });
}
EOFPORTAL

echo ">>> Writing Stripe webhook handler..."

cat > src/app/api/webhooks/stripe/route.ts << 'EOFWEBHOOK'
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/features/billing/server/stripe-client';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { serverEnv } from '@/lib/env';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 });
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] signature verify failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.org_id;
        const planId = session.metadata?.plan_id;
        if (!orgId || !planId) break;

        // Record customer id now
        if (session.customer && typeof session.customer === 'string') {
          await svc
            .from('subscriptions')
            .update({ stripe_customer_id: session.customer } as never)
            .eq('org_id', orgId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;

        const planId = sub.metadata?.plan_id ?? deriveFromPrice(sub);
        const item = sub.items.data[0];
        const periodEnd = item?.current_period_end
          ? new Date(item.current_period_end * 1000).toISOString()
          : null;
        const periodStart = item?.current_period_start
          ? new Date(item.current_period_start * 1000).toISOString()
          : null;
        const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;

        await svc
          .from('subscriptions')
          .update({
            plan_id: planId ?? null,
            stripe_subscription_id: sub.id,
            stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            status: sub.status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            trial_ends_at: trialEnd,
          } as never)
          .eq('org_id', orgId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.org_id;
        if (!orgId) break;
        await svc
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          } as never)
          .eq('org_id', orgId);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        type InvoiceWithSub = Stripe.Invoice & { subscription?: string | null };
        const invoiceWithSub = invoice as InvoiceWithSub;
        if (invoiceWithSub.subscription && typeof invoiceWithSub.subscription === 'string') {
          const stripeSubId = invoiceWithSub.subscription;
          await svc
            .from('subscriptions')
            .update({ status: 'past_due' } as never)
            .eq('stripe_subscription_id', stripeSubId);
        }
        break;
      }

      default:
        // ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

function deriveFromPrice(sub: Stripe.Subscription): string | null {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return null;
  if (priceId === serverEnv.STRIPE_PRICE_STARTER) return 'starter';
  if (priceId === serverEnv.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === serverEnv.STRIPE_PRICE_AGENCY) return 'agency';
  return null;
}
EOFWEBHOOK
echo "OK webhook route"

echo ">>> Wiring quota checks into chat, images, knowledge, assistant APIs..."

# Patch chat route
if ! grep -q "check_quota" src/app/api/chat/route.ts 2>/dev/null; then
  perl -i -pe 's|const assistantId = await ensureDefaultAssistant\(svc, orgId, orgName\);|// Quota check\n  const { data: quota } = await svc.rpc(\x27check_quota\x27, { p_org_id: orgId, p_kind: \x27chat_message\x27 });\n  const q = quota as { allowed: boolean; used: number; limit: number } \| null;\n  if (q \&\& !q.allowed) {\n    return NextResponse.json({ error: \x27Monthly chat limit reached. Upgrade your plan.\x27, quota: q }, { status: 402 });\n  }\n\n  const assistantId = await ensureDefaultAssistant(svc, orgId, orgName);|' src/app/api/chat/route.ts
fi

# Patch images/generate route
if ! grep -q "check_quota" src/app/api/images/generate/route.ts 2>/dev/null; then
  perl -i -pe 's|const preset = IMAGE_PRESETS\.find|const { data: quota } = await svc.rpc(\x27check_quota\x27, { p_org_id: orgId, p_kind: \x27image_generation\x27 });\n  const q = quota as { allowed: boolean; used: number; limit: number } \| null;\n  if (q \&\& !q.allowed) {\n    return NextResponse.json({ error: \x27Monthly image limit reached. Upgrade your plan.\x27, quota: q }, { status: 402 });\n  }\n\n  const preset = IMAGE_PRESETS.find|' src/app/api/images/generate/route.ts
fi

# Patch knowledge/upload route
if ! grep -q "check_quota" src/app/api/knowledge/upload/route.ts 2>/dev/null; then
  perl -i -pe 's|const formData = await req\.formData|const { data: kdQuota } = await svc.rpc(\x27check_quota\x27, { p_org_id: orgId, p_kind: \x27knowledge_document\x27 });\n  const kq = kdQuota as { allowed: boolean; used: number; limit: number } \| null;\n  if (kq \&\& !kq.allowed) {\n    return NextResponse.json({ error: \x27Document limit reached. Upgrade your plan.\x27, quota: kq }, { status: 402 });\n  }\n\n  const formData = await req.formData|' src/app/api/knowledge/upload/route.ts
fi

# Patch assistants/create route
if ! grep -q "check_quota" src/app/api/assistants/create/route.ts 2>/dev/null; then
  perl -i -pe 's|// If marking as default|const { data: aQuota } = await svc.rpc(\x27check_quota\x27, { p_org_id: orgId, p_kind: \x27assistant\x27 });\n  const aq = aQuota as { allowed: boolean; used: number; limit: number } \| null;\n  if (aq \&\& !aq.allowed) {\n    return NextResponse.json({ error: \x27Assistant limit reached. Upgrade your plan.\x27, quota: aq }, { status: 402 });\n  }\n\n  // If marking as default|' src/app/api/assistants/create/route.ts
fi

echo "OK quota checks wired into 4 routes"

echo ">>> Writing pricing page..."

cat > "src/app/(marketing)/pricing/page.tsx" << 'EOFPRICING'
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PLANS } from '@/features/billing/data/plans';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function startCheckout(planId: 'starter' | 'pro' | 'agency') {
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/signup?next=/pricing');
          return;
        }
        throw new Error(body?.error ?? 'Could not start checkout');
      }
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] py-16 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-3">Pricing</div>
          <h1 className="font-display text-[48px] leading-[1.05] mb-4">
            Operator AI is <span className="text-gold-grad">priced to pay off</span> in a week
          </h1>
          <p className="text-[15px] text-fg-muted max-w-[560px] mx-auto">
            Three plans, all models included, all features included. Cancel anytime.
            <span className="block mt-2 text-fg-subtle">7-day free trial, no card required.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[1080px] mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border p-7 flex flex-col',
                plan.highlight
                  ? 'border-gold/50 bg-gold/5 shadow-2xl shadow-gold/10'
                  : 'border-border bg-surface',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 px-2.5 rounded-full gold-grad text-[10px] uppercase tracking-[0.14em] text-bg font-semibold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  Most popular
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-display text-[22px] mb-1">{plan.name}</h3>
                <p className="text-[12.5px] text-fg-muted">{plan.tagline}</p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[44px] leading-none">{plan.priceDisplay}</span>
                  <span className="text-[13px] text-fg-muted">/month</span>
                </div>
              </div>

              <Button
                size="md"
                variant={plan.highlight ? 'default' : 'outline'}
                onClick={() => startCheckout(plan.id)}
                loading={loading === plan.id}
                className="w-full mb-5"
              >
                <span>{plan.cta}</span>
              </Button>

              <div className="space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-[13px]">
                    <Check className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', plan.highlight ? 'text-gold' : 'text-fg-soft')} />
                    <span className={plan.highlight ? 'text-fg' : 'text-fg-soft'}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <p className="text-[13px] text-fg-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-gold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
EOFPRICING
echo "OK pricing page"

echo ">>> Writing billing success page..."

cat > "src/app/billing/success/page.tsx" << 'EOFSUCCESS'
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-[480px] w-full text-center">
        <div className="h-14 w-14 rounded-full gold-grad mx-auto mb-6 flex items-center justify-center">
          <Check className="h-6 w-6 text-bg" strokeWidth={3} />
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2">Welcome aboard</div>
        <h1 className="font-display text-[34px] leading-[1.1] mb-4">
          Your subscription is <span className="text-gold-grad">live</span>
        </h1>
        <p className="text-[14px] text-fg-muted mb-8">
          Your plan is active. Head to your dashboard and start creating.
        </p>
        <Link href="/dashboard">
          <Button size="md">Go to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
EOFSUCCESS

echo ">>> Writing settings/billing page..."

cat > "src/app/(app)/settings/billing/page.tsx" << 'EOFSETTINGS'
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import {
  getActiveSubscription,
  isSubscriptionActive,
  daysUntilTrialEnds,
  planDisplayName,
} from '@/features/billing/server/subscription';
import { findPlan, formatLimit } from '@/features/billing/data/plans';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BillingActions } from '@/features/billing/components/billing-actions';

export default async function BillingSettingsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    redirect('/create-organization');
  }

  const sub = await getActiveSubscription(svc, orgId);
  const plan = sub?.planId ? findPlan(sub.planId) : findPlan('pro'); // trial uses pro limits
  const isActive = isSubscriptionActive(sub);
  const trialDays = daysUntilTrialEnds(sub);

  // Read usage for display
  const { data: chatUsed } = await svc
    .rpc('check_quota', { p_org_id: orgId, p_kind: 'chat_message' });
  const { data: imgUsed } = await svc
    .rpc('check_quota', { p_org_id: orgId, p_kind: 'image_generation' });
  const { data: docUsed } = await svc
    .rpc('check_quota', { p_org_id: orgId, p_kind: 'knowledge_document' });
  const { data: astUsed } = await svc
    .rpc('check_quota', { p_org_id: orgId, p_kind: 'assistant' });

  type QuotaRow = { used: number; limit: number } | null;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[880px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Billing</div>
        <h1 className="font-display text-[32px]">Plan &amp; usage</h1>
      </div>

      {/* Current plan */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-display text-[22px]">
                  {planDisplayName(sub?.planId ?? null, sub?.status ?? 'trialing')}
                </h2>
                <StatusBadge status={sub?.status ?? 'trialing'} />
              </div>
              {sub?.status === 'trialing' && trialDays !== null && (
                <p className="text-[13px] text-fg-muted">
                  {trialDays > 0
                    ? trialDays + ' day' + (trialDays !== 1 ? 's' : '') + ' left in trial'
                    : 'Trial has ended. Upgrade to continue.'}
                </p>
              )}
              {sub?.status === 'active' && sub.currentPeriodEnd && (
                <p className="text-[13px] text-fg-muted">
                  Next renewal on {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {sub?.cancelAtPeriodEnd && (
                <p className="text-[13px] text-fg-muted">
                  Canceled at end of period.
                </p>
              )}
            </div>
            <BillingActions hasCustomer={!!sub?.stripeCustomerId} />
          </div>

          {!isActive && (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] text-fg">Your subscription is not active.</p>
                <p className="text-[12px] text-fg-muted mt-0.5">
                  Choose a plan to restore access.
                </p>
              </div>
              <Link href="/pricing">
                <Button size="sm">See plans</Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Usage */}
      <Card>
        <CardBody className="space-y-4">
          <h3 className="font-display text-[17px]">Usage this period</h3>
          <div className="space-y-3">
            <UsageRow label="Chat messages"     row={chatUsed as QuotaRow} />
            <UsageRow label="Image generations" row={imgUsed as QuotaRow} />
            <UsageRow label="Knowledge docs"    row={docUsed as QuotaRow} />
            <UsageRow label="Assistants"        row={astUsed as QuotaRow} />
          </div>
        </CardBody>
      </Card>

      {/* Features summary */}
      {plan && (
        <Card>
          <CardBody>
            <h3 className="font-display text-[17px] mb-3">What&apos;s included</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13px] text-fg-soft">
                  <Sparkles className="h-3 w-3 text-gold shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    trialing:  { bg: 'bg-gold/15 text-gold border-gold/30',         label: 'Trial' },
    active:    { bg: 'bg-success/10 text-success border-success/30', label: 'Active' },
    past_due:  { bg: 'bg-danger/10 text-danger border-danger/30',   label: 'Past due' },
    canceled:  { bg: 'bg-surface-3 text-fg-muted border-border',    label: 'Canceled' },
    paused:    { bg: 'bg-surface-3 text-fg-muted border-border',    label: 'Paused' },
  };
  const m = map[status] ?? map.canceled;
  return (
    <span className={'inline-flex items-center gap-1 px-2 h-5 rounded text-[10.5px] uppercase tracking-[0.12em] border ' + m.bg}>
      {m.label}
    </span>
  );
}

function UsageRow({ label, row }: { label: string; row: { used: number; limit: number } | null }) {
  const used = row?.used ?? 0;
  const limit = row?.limit ?? 0;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const over = used >= limit;
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] mb-1.5">
        <span className="text-fg-soft">{label}</span>
        <span className={over ? 'text-danger' : 'text-fg-muted'}>
          {used.toLocaleString()} / {formatLimit(limit)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={'h-full transition-all ' + (over ? 'bg-danger' : pct > 80 ? 'bg-gold' : 'gold-grad')}
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  );
}
EOFSETTINGS

cat > src/features/billing/components/billing-actions.tsx << 'EOFACTIONS'
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface Props {
  hasCustomer: boolean;
}

export function BillingActions({ hasCustomer }: Props) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Could not open portal');
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open portal');
    } finally {
      setLoading(false);
    }
  }

  if (!hasCustomer) {
    return (
      <Link href="/pricing">
        <Button size="md">Choose a plan</Button>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/pricing">
        <Button variant="outline" size="md">Change plan</Button>
      </Link>
      <Button size="md" onClick={openPortal} loading={loading}>
        Manage billing
      </Button>
    </div>
  );
}
EOFACTIONS

echo ">>> Writing trial banner..."

cat > src/features/billing/components/trial-banner.tsx << 'EOFBANNER'
'use client';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface Props {
  daysLeft: number;
  status: string;
}

export function TrialBanner({ daysLeft, status }: Props) {
  if (status !== 'trialing') return null;

  const text =
    daysLeft > 0
      ? daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' left in your free trial'
      : 'Your trial has ended';

  return (
    <div className="sticky top-14 z-30 bg-gold/10 border-b border-gold/30 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-6 h-10 flex items-center justify-between text-[12.5px]">
        <div className="flex items-center gap-2 text-gold">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="font-medium">{text}</span>
        </div>
        <Link href="/pricing" className="text-gold hover:text-gold font-medium underline underline-offset-2">
          Choose a plan
        </Link>
      </div>
    </div>
  );
}
EOFBANNER

echo ">>> Injecting trial banner into app layout..."

cat > "src/app/(app)/layout.tsx" << 'EOFLAYOUT'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { getActiveSubscription, daysUntilTrialEnds } from '@/features/billing/server/subscription';
import { AppTopbar } from '@/components/layout/app-topbar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TrialBanner } from '@/features/billing/components/trial-banner';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let orgCtx;
  try {
    orgCtx = await resolveOrgContext(svc, user.id);
  } catch {
    redirect('/create-organization');
  }

  const sub = await getActiveSubscription(svc, orgCtx.orgId);
  const days = daysUntilTrialEnds(sub);

  return (
    <div className="min-h-screen bg-bg">
      <AppTopbar orgName={orgCtx.orgName} userEmail={user.email ?? ''} />
      {sub && sub.status === 'trialing' && days !== null && (
        <TrialBanner daysLeft={days} status={sub.status} />
      )}
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
EOFLAYOUT
echo "OK app layout with trial banner"

echo ">>> Adding 'Billing' link to sidebar..."

# Idempotent sidebar patch: add billing entry if not present
if ! grep -q "/settings/billing" src/components/layout/app-sidebar.tsx 2>/dev/null; then
  perl -i -pe "s|{ href: '/settings'|{ href: '/settings/billing', label: 'Billing', icon: CreditCard },\n  { href: '/settings'|" src/components/layout/app-sidebar.tsx
  perl -i -pe "s|from 'lucide-react';|from 'lucide-react'; import { CreditCard } from 'lucide-react';|" src/components/layout/app-sidebar.tsx 2>/dev/null || true
fi

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -20

echo ""
echo "================================================"
echo "  Week 7 complete."
echo "================================================"
echo ""
echo "What's new:"
echo "  * 3 plans: Starter \$29, Pro \$99, Agency \$299"
echo "  * 7-day trial automatic on signup, no card required"
echo "  * 4 quota types enforced across chat, images, docs, assistants"
echo "  * Landing /pricing editorial with 3 columns"
echo "  * /settings/billing with plan, usage bars, manage button"
echo "  * Stripe Checkout + Customer Portal integrated"
echo "  * Webhook handling subscription lifecycle"
echo "  * Trial countdown banner"
echo ""
echo "NEXT STEPS (manual):"
echo ""
echo "  1. APPLY THE MIGRATION"
echo "     a. Supabase Dashboard > SQL Editor > New query"
echo "     b. Paste contents of supabase/migrations/0018_billing.sql"
echo "     c. Run"
echo ""
echo "  2. REGENERATE TYPES"
echo "     export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "     pnpm db:generate"
echo ""
echo "  3. CREATE STRIPE PRODUCTS + PRICES"
echo "     pnpm stripe:setup"
echo "     (This creates products + prices in Stripe Test mode and writes"
echo "      STRIPE_PRICE_STARTER/PRO/AGENCY into .env.local)"
echo ""
echo "  4. START LOCAL WEBHOOK LISTENER (separate terminal, leave running)"
echo "     stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo "     (The command will print a whsec_... secret. Copy it and paste"
echo "      into .env.local as STRIPE_WEBHOOK_SECRET=whsec_xxx)"
echo ""
echo "  5. RESTART pnpm dev and test:"
echo "     a. Create a new org -> you get 7-day trial automatically"
echo "     b. Go to /pricing and click a plan"
echo "     c. Use test card 4242 4242 4242 4242, any future date, any CVC"
echo "     d. After success, /settings/billing shows your active plan"
echo ""
