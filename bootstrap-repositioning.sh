#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI — Repositioning v4.0"
echo "  Deploy missions. Not prompts."
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# 1. MIGRATION 0027 — missions + brand OS
# ============================================================
echo ">>> Creating migration 0027 (missions + brand_os)..."

cat > supabase/migrations/0027_missions_brand_os.sql << 'EOFMIG'
-- Missions — autonomous multi-step objectives
create table if not exists public.missions (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  objective text not null,
  category text check (category in ('content', 'campaign', 'research', 'operations', 'growth')),
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'failed')),
  autonomy_level text not null default 'review' check (autonomy_level in ('review', 'auto', 'scheduled')),
  progress integer not null default 0,
  budget_cents integer default 0,
  started_at timestamptz,
  completed_at timestamptz,
  due_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_org_idx
  on public.missions (org_id, status, created_at desc);

alter table public.missions enable row level security;

drop policy if exists "missions by org members" on public.missions;
create policy "missions by org members"
  on public.missions for all
  using (public.is_org_member(org_id));

-- Mission steps — orchestration log
create table if not exists public.mission_steps (
  id text primary key default public.gen_cuid2(),
  mission_id text not null references public.missions(id) on delete cascade,
  step_order integer not null,
  agent_type text,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'skipped')),
  output jsonb default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mission_steps_mission_idx
  on public.mission_steps (mission_id, step_order);

alter table public.mission_steps enable row level security;

drop policy if exists "mission_steps by org via parent" on public.mission_steps;
create policy "mission_steps by org via parent"
  on public.mission_steps for all
  using (exists (
    select 1 from public.missions m
    where m.id = mission_steps.mission_id
      and public.is_org_member(m.org_id)
  ));

-- Brand OS rules — rules for brand-locked validation
create table if not exists public.brand_os_rules (
  org_id text primary key references public.organizations(id) on delete cascade,
  brand_colors jsonb default '[]'::jsonb,
  typography jsonb default '{}'::jsonb,
  tone text check (tone in ('minimal', 'editorial', 'bold', 'playful', 'professional')),
  always_use_words text[] default array[]::text[],
  never_use_words text[] default array[]::text[],
  sample_outputs jsonb default '[]'::jsonb,
  logo_url text,
  validator_strictness text default 'medium' check (validator_strictness in ('low', 'medium', 'high', 'strict')),
  auto_correct boolean default true,
  updated_at timestamptz not null default now()
);

alter table public.brand_os_rules enable row level security;

drop policy if exists "brand_os_rules by org members" on public.brand_os_rules;
create policy "brand_os_rules by org members"
  on public.brand_os_rules for all
  using (public.is_org_member(org_id));

-- Brand OS validations — audit log of output checks
create table if not exists public.brand_os_validations (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  content_type text not null check (content_type in ('text', 'image', 'video')),
  content_hash text,
  passed boolean not null,
  violations jsonb default '[]'::jsonb,
  auto_corrected boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists brand_os_validations_org_idx
  on public.brand_os_validations (org_id, created_at desc);

alter table public.brand_os_validations enable row level security;

drop policy if exists "brand_os_validations by org members" on public.brand_os_validations;
create policy "brand_os_validations by org members"
  on public.brand_os_validations for all
  using (public.is_org_member(org_id));

notify pgrst, 'reload schema';
EOFMIG
echo "OK migration 0027"

# ============================================================
# 2. NEW DASHBOARD — 5 modules (Missions hero + 4 tiles)
# ============================================================
echo ">>> Building new dashboard (5 modules)..."

cat > "src/app/(app)/dashboard/page.tsx" << 'EOFD'
import Link from 'next/link';
import { Rocket, MessageSquare, Sparkles, Zap, Target, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative px-6 lg:px-10 pt-10 lg:pt-14 pb-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full gold-grad opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="relative max-w-[960px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Operator AI</div>
          <h1 className="font-display text-[40px] lg:text-[52px] leading-[1.02] mb-4">
            Deploy missions. <span className="text-gold-grad">Not prompts.</span>
          </h1>
          <p className="text-[15px] text-fg-muted max-w-[540px] leading-relaxed mb-8">
            Your autonomous operations platform. Tell Operator what you want achieved &mdash; it orchestrates the work.
          </p>
        </div>
      </section>

      {/* Missions — hero tile */}
      <section className="px-6 lg:px-10 pb-6">
        <div className="max-w-[960px] mx-auto">
          <Link
            href="/missions"
            className="group block relative rounded-2xl border border-gold/30 bg-gradient-to-br from-surface via-surface-2 to-bg p-8 lg:p-10 overflow-hidden hover:border-gold/60 transition-all"
          >
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full gold-grad opacity-[0.10] blur-3xl pointer-events-none group-hover:opacity-[0.18] transition-opacity" />
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-gold bg-gold/10 border border-gold/20 rounded px-2 py-0.5 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                  <span>New paradigm</span>
                </div>
                <h2 className="font-display text-[28px] lg:text-[34px] leading-tight mb-2.5">
                  Your first <span className="text-gold-grad">Mission</span>.
                </h2>
                <p className="text-[14px] text-fg-muted leading-relaxed max-w-[440px] mb-5">
                  Define an objective. Operator deploys agents, generates content, runs the workflow, and tracks outcomes. You approve. It executes.
                </p>
                <div className="inline-flex items-center gap-2 h-9 px-4 rounded-md gold-grad text-bg text-[13px] font-medium group-hover:brightness-110 transition">
                  <Rocket className="h-3.5 w-3.5" />
                  <span>Deploy a Mission</span>
                  <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </div>
              <div className="hidden lg:flex shrink-0 h-28 w-28 rounded-2xl border border-gold/30 bg-gold/5 items-center justify-center">
                <Rocket className="h-12 w-12 text-gold" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Core modules — 4 tiles */}
      <section className="px-6 lg:px-10 pb-12">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Core modules</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ModuleTile
              href="/chat"
              icon={MessageSquare}
              label="Chat"
              description="Talk to your brand AI. Ask, generate, execute &mdash; in one conversation."
              kbd="G+C"
            />
            <ModuleTile
              href="/studio/image"
              icon={Sparkles}
              label="Studio"
              description="Imagery and video, on-brand by default. Imagen 4, Flux 2 Pro, Veo 3.1."
              kbd="G+I"
            />
            <ModuleTile
              href="/workflows"
              icon={Zap}
              label="Workflows"
              description="Multi-step automations. Chain agents, integrations, and schedules."
              kbd="G+W"
            />
            <ModuleTile
              href="/brand-os"
              icon={Target}
              label="Brand OS"
              description="The rules your brand runs on. Colors, tone, words. Enforced on every output."
              kbd="G+B"
              isNew
            />
          </div>
        </div>
      </section>

      {/* Secondary — quick access */}
      <section className="px-6 lg:px-10 pb-16">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Also here</div>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/projects', label: 'Projects' },
              { href: '/knowledge', label: 'Knowledge' },
              { href: '/files', label: 'Files' },
              { href: '/voice', label: 'Voice' },
              { href: '/assistants', label: 'Agents' },
              { href: '/settings/integrations', label: 'Integrations' },
              { href: '/settings/memory', label: 'Memory' },
              { href: '/settings/billing', label: 'Billing' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition"
              >
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleTile({
  href, icon: Icon, label, description, kbd, isNew,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  kbd?: string;
  isNew?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-xl border border-border bg-surface p-5 hover:border-gold/40 hover:bg-surface-2 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display text-[17px] group-hover:text-gold transition-colors">{label}</span>
            {isNew && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold text-bg font-bold uppercase tracking-[0.1em]">New</span>
            )}
          </div>
          <p className="text-[12.5px] text-fg-muted leading-relaxed">{description}</p>
        </div>
        {kbd && (
          <div className="hidden lg:flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {kbd.split('+').map((k, i) => (
              <kbd
                key={i}
                className="min-w-[18px] h-5 px-1 rounded bg-surface-3 border border-border text-[9.5px] font-mono text-fg-subtle flex items-center justify-center"
              >
                {k}
              </kbd>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
EOFD
echo "OK dashboard"

# ============================================================
# 3. MISSIONS PAGE (/missions)
# ============================================================
echo ">>> Creating /missions page..."

mkdir -p "src/app/(app)/missions"
cat > "src/app/(app)/missions/page.tsx" << 'EOFMP'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { Rocket, Plus, CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react';
import { MissionsDeployCta } from '@/features/missions/components/deploy-cta';

export const dynamic = 'force-dynamic';

interface Mission {
  id: string;
  title: string;
  objective: string;
  category: string | null;
  status: string;
  progress: number;
  created_at: string;
  due_at: string | null;
}

const templates = [
  {
    id: 'ig-growth',
    title: 'Grow my Instagram',
    description: '30-day plan with weekly content generation and engagement tracking.',
    category: 'growth',
    icon: '📈',
  },
  {
    id: 'launch-campaign',
    title: 'Launch a campaign',
    description: 'Full campaign: research, copy, visuals, and scheduling in one mission.',
    category: 'campaign',
    icon: '🚀',
  },
  {
    id: 'content-week',
    title: '7 days of content',
    description: 'A week of on-brand posts across channels, pre-scheduled.',
    category: 'content',
    icon: '✍️',
  },
  {
    id: 'competitor-watch',
    title: 'Watch my competitors',
    description: 'Weekly digest of what competitors are doing, with opportunities flagged.',
    category: 'research',
    icon: '🔍',
  },
  {
    id: 'sales-outreach',
    title: 'Cold outreach campaign',
    description: 'Research prospects, draft personalized emails, track responses.',
    category: 'operations',
    icon: '📬',
  },
];

export default async function MissionsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let missions: Mission[] = [];

  try {
    const { orgId } = await resolveOrgContext(svc, user.id);
    const { data } = await (svc.from as any)('missions')
      .select('id, title, objective, category, status, progress, created_at, due_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);
    missions = (data as Mission[]) ?? [];
  } catch {
    // User has no org yet
  }

  const active = missions.filter((m) => m.status === 'running');
  const completed = missions.filter((m) => m.status === 'completed');

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[960px] w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">Operator AI</div>
          <h1 className="font-display text-[40px] leading-tight mb-2">Missions</h1>
          <p className="text-[14px] text-fg-muted max-w-[540px]">
            Objectives that run on their own. Deploy one &mdash; Operator handles the rest.
          </p>
        </div>
        <MissionsDeployCta />
      </div>

      {/* Active missions */}
      {active.length > 0 && (
        <section className="mb-10">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>Running ({active.length})</span>
          </div>
          <div className="space-y-2">
            {active.map((m) => <MissionRow key={m.id} mission={m} />)}
          </div>
        </section>
      )}

      {/* Templates — show if no missions or as always-available */}
      <section className="mb-10">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Mission templates</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/missions/new?template=${t.id}`}
              className="group rounded-lg border border-border bg-surface p-4 hover:border-gold/40 hover:bg-surface-2 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-[22px] shrink-0">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium mb-1 group-hover:text-gold transition-colors">{t.title}</div>
                  <p className="text-[12px] text-fg-muted leading-relaxed">{t.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Completed missions */}
      {completed.length > 0 && (
        <section>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Completed ({completed.length})</div>
          <div className="space-y-2">
            {completed.slice(0, 5).map((m) => <MissionRow key={m.id} mission={m} />)}
          </div>
        </section>
      )}

      {/* Empty state when no missions */}
      {missions.length === 0 && (
        <section className="mt-8 rounded-xl border border-dashed border-border bg-surface/40 py-12 px-6 text-center">
          <Rocket className="h-8 w-8 text-gold mx-auto mb-3" />
          <h3 className="font-display text-[20px] mb-1.5">No missions yet</h3>
          <p className="text-[13px] text-fg-muted max-w-[380px] mx-auto mb-5">
            Pick a template above to deploy your first mission, or write your own objective from scratch.
          </p>
          <Link
            href="/missions/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Create custom mission
          </Link>
        </section>
      )}
    </div>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const statusColors: Record<string, string> = {
    running: 'text-gold',
    completed: 'text-green-400',
    failed: 'text-danger',
    paused: 'text-fg-muted',
    draft: 'text-fg-subtle',
  };
  const StatusIcon = mission.status === 'completed' ? CheckCircle2
    : mission.status === 'failed' ? AlertCircle
    : mission.status === 'running' ? Play
    : Clock;

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="group block rounded-lg border border-border bg-surface p-4 hover:border-gold/40 hover:bg-surface-2 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`h-3.5 w-3.5 ${statusColors[mission.status] ?? 'text-fg-muted'}`} />
            <span className="text-[13.5px] font-medium group-hover:text-gold transition-colors truncate">{mission.title}</span>
          </div>
          <p className="text-[12px] text-fg-muted line-clamp-1">{mission.objective}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle">{mission.status}</div>
          {mission.status === 'running' && (
            <div className="mt-1.5 w-24 h-1 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full gold-grad transition-all" style={{ width: `${mission.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
EOFMP

# Deploy CTA component
mkdir -p src/features/missions/components
cat > src/features/missions/components/deploy-cta.tsx << 'EOFDCTA'
'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function MissionsDeployCta() {
  return (
    <Link
      href="/missions/new"
      className="shrink-0 inline-flex items-center gap-2 h-10 px-5 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition"
    >
      <Plus className="h-3.5 w-3.5" />
      <span>Deploy Mission</span>
    </Link>
  );
}
EOFDCTA

echo "OK missions page"

# ============================================================
# 4. MISSION DETAIL + NEW pages
# ============================================================
echo ">>> Creating /missions/new and /missions/[id]..."

mkdir -p "src/app/(app)/missions/new"
cat > "src/app/(app)/missions/new/page.tsx" << 'EOFNEWM'
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { MissionNewForm } from '@/features/missions/components/new-form';

export default function NewMissionPage() {
  return (
    <div className="px-6 lg:px-10 py-10 max-w-[720px] w-full mx-auto">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-gold transition mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to Missions</span>
      </Link>
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">New Mission</div>
      <h1 className="font-display text-[34px] leading-tight mb-3">Deploy a mission</h1>
      <p className="text-[14px] text-fg-muted mb-8">
        Describe what you want achieved. Operator will orchestrate the steps.
      </p>
      <MissionNewForm />
    </div>
  );
}
EOFNEWM

cat > src/features/missions/components/new-form.tsx << 'EOFFORM'
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

const categories = [
  { id: 'content', label: 'Content', desc: 'Posts, emails, copy' },
  { id: 'campaign', label: 'Campaign', desc: 'Full launches, multi-channel' },
  { id: 'research', label: 'Research', desc: 'Market, competitors, leads' },
  { id: 'operations', label: 'Operations', desc: 'Outreach, follow-ups, tasks' },
  { id: 'growth', label: 'Growth', desc: 'Funnel, retention, acquisition' },
];

const autonomyLevels = [
  { id: 'review', label: 'Review each step', desc: 'Maximum control. You approve everything.' },
  { id: 'auto', label: 'Auto-execute within bounds', desc: 'Operator proceeds unless it hits a guardrail.' },
  { id: 'scheduled', label: 'Scheduled', desc: 'Runs on a schedule. You get a summary.' },
];

export function MissionNewForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('content');
  const [autonomy, setAutonomy] = useState('review');
  const [loading, setLoading] = useState(false);

  async function deploy() {
    if (!title.trim() || objective.trim().length < 10) {
      toast.error('Give your mission a title and clear objective');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/missions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, objective, category, autonomyLevel: autonomy }),
      });
      if (!res.ok) throw new Error('Failed to deploy');
      const body = await res.json();
      toast.success('Mission deployed');
      router.push(`/missions/${body.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Mission title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grow my Instagram to 10k followers"
              className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
            />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Objective (what success looks like)</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="In 90 days: double followers, 5% engagement rate, 3 posts per week. All on-brand, using my existing style."
              rows={4}
              className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[14px] focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Category</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`text-left rounded-md border p-3 transition ${
                  category === c.id
                    ? 'bg-gold/10 border-gold/50'
                    : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{c.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Autonomy level</div>
          <div className="space-y-2">
            {autonomyLevels.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAutonomy(a.id)}
                className={`w-full text-left rounded-md border p-3 transition ${
                  autonomy === a.id
                    ? 'bg-gold/10 border-gold/50'
                    : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{a.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5">{a.desc}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => window.history.back()}>Cancel</Button>
        <Button onClick={deploy} loading={loading} size="lg">
          Deploy mission
        </Button>
      </div>
    </div>
  );
}
EOFFORM

mkdir -p "src/app/(app)/missions/[id]"
cat > "src/app/(app)/missions/[id]/page.tsx" << 'EOFMID'
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ChevronLeft, Rocket, CheckCircle2, Clock, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  const { data: mission } = await (svc.from as any)('missions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!mission) notFound();
  const m = mission as {
    id: string; title: string; objective: string; status: string; progress: number;
    category: string | null; created_at: string; due_at: string | null;
  };

  const { data: stepsData } = await (svc.from as any)('mission_steps')
    .select('*')
    .eq('mission_id', id)
    .order('step_order', { ascending: true });
  const steps = (stepsData as Array<{
    id: string; step_order: number; title: string; description: string | null;
    status: string; agent_type: string | null;
  }>) ?? [];

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[820px] w-full mx-auto">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-gold transition mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to Missions</span>
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <Rocket className="h-4 w-4 text-gold" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-gold">{m.status}</span>
      </div>
      <h1 className="font-display text-[34px] leading-tight mb-3">{m.title}</h1>
      <p className="text-[14px] text-fg-muted mb-8 max-w-[620px] leading-relaxed">{m.objective}</p>

      {m.status === 'running' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Progress</span>
            <span className="text-[13px] font-medium text-gold">{m.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full gold-grad transition-all" style={{ width: `${m.progress}%` }} />
          </div>
        </div>
      )}

      <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-4">Steps</div>
      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center">
          <Clock className="h-6 w-6 text-fg-subtle mx-auto mb-2" />
          <p className="text-[13px] text-fg-muted">
            Steps will appear here as Operator orchestrates the mission.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => {
            const StatusIcon = step.status === 'completed' ? CheckCircle2
              : step.status === 'running' ? Play
              : Clock;
            const color = step.status === 'completed' ? 'text-green-400'
              : step.status === 'running' ? 'text-gold'
              : 'text-fg-muted';
            return (
              <div key={step.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="h-7 w-7 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-[11px] font-mono text-fg-muted">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusIcon className={`h-3.5 w-3.5 ${color}`} />
                    <span className="text-[13.5px] font-medium">{step.title}</span>
                  </div>
                  {step.description && (
                    <p className="text-[12px] text-fg-muted leading-relaxed">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
EOFMID
echo "OK mission new + detail pages"

# ============================================================
# 5. MISSION API
# ============================================================
echo ">>> Creating /api/missions routes..."

mkdir -p src/app/api/missions/create
cat > src/app/api/missions/create/route.ts << 'EOFAPIC'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  title: z.string().min(2).max(200),
  objective: z.string().min(10).max(2000),
  category: z.enum(['content', 'campaign', 'research', 'operations', 'growth']),
  autonomyLevel: z.enum(['review', 'auto', 'scheduled']),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No workspace' }, { status: 403 });
  }

  const { data, error } = await (svc.from as any)('missions').insert({
    org_id: orgId,
    user_id: user.id,
    title: parsed.data.title,
    objective: parsed.data.objective,
    category: parsed.data.category,
    autonomy_level: parsed.data.autonomyLevel,
    status: 'draft',
    started_at: new Date().toISOString(),
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: (data as { id: string }).id, ok: true });
}
EOFAPIC
echo "OK missions API"

# ============================================================
# 6. BRAND OS PAGE
# ============================================================
echo ">>> Creating /brand-os page..."

mkdir -p "src/app/(app)/brand-os"
cat > "src/app/(app)/brand-os/page.tsx" << 'EOFBO'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { BrandOsForm } from '@/features/brand-os/components/brand-os-form';

export const dynamic = 'force-dynamic';

export default async function BrandOSPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let initial: Record<string, unknown> = {};
  try {
    const { orgId } = await resolveOrgContext(svc, user.id);
    const { data } = await (svc.from as any)('brand_os_rules')
      .select('*')
      .eq('org_id', orgId)
      .maybeSingle();
    initial = (data as Record<string, unknown>) ?? {};
  } catch {}

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[820px] w-full mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">Operator AI</div>
        <h1 className="font-display text-[36px] leading-tight mb-3">Brand OS</h1>
        <p className="text-[14px] text-fg-muted max-w-[560px] leading-relaxed">
          The operating system of your brand. Operator enforces these rules on every output &mdash; copy, imagery, video. On-brand by default.
        </p>
      </div>
      <BrandOsForm initial={initial} />
    </div>
  );
}
EOFBO

mkdir -p src/features/brand-os/components
cat > src/features/brand-os/components/brand-os-form.tsx << 'EOFBOF'
'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Palette, Type, X as XIcon, Plus } from 'lucide-react';

const tones = [
  { id: 'minimal', label: 'Minimal', sample: 'Less is more.' },
  { id: 'editorial', label: 'Editorial', sample: 'A quiet kind of luxury.' },
  { id: 'bold', label: 'Bold', sample: "We don't whisper. We move." },
  { id: 'playful', label: 'Playful', sample: 'Serious work. Fun people.' },
  { id: 'professional', label: 'Professional', sample: 'Precision. Trust. Delivery.' },
] as const;

interface Props {
  initial: Record<string, unknown>;
}

export function BrandOsForm({ initial }: Props) {
  const [colors, setColors] = useState<string[]>(
    Array.isArray(initial.brand_colors) ? (initial.brand_colors as string[]) : []
  );
  const [newColor, setNewColor] = useState('#c9a863');
  const [tone, setTone] = useState((initial.tone as string) ?? 'editorial');
  const [alwaysWords, setAlwaysWords] = useState<string[]>(
    Array.isArray(initial.always_use_words) ? (initial.always_use_words as string[]) : []
  );
  const [neverWords, setNeverWords] = useState<string[]>(
    Array.isArray(initial.never_use_words) ? (initial.never_use_words as string[]) : []
  );
  const [newAlwaysWord, setNewAlwaysWord] = useState('');
  const [newNeverWord, setNewNeverWord] = useState('');
  const [strictness, setStrictness] = useState((initial.validator_strictness as string) ?? 'medium');
  const [autoCorrect, setAutoCorrect] = useState(initial.auto_correct !== false);
  const [saving, setSaving] = useState(false);

  function addColor() {
    if (!newColor.match(/^#[0-9a-fA-F]{6}$/)) {
      toast.error('Enter a valid hex color (e.g., #c9a863)');
      return;
    }
    if (colors.length >= 6) {
      toast.error('Maximum 6 colors');
      return;
    }
    setColors([...colors, newColor]);
  }

  function removeColor(i: number) {
    setColors(colors.filter((_, idx) => idx !== i));
  }

  function addWord(kind: 'always' | 'never') {
    const w = (kind === 'always' ? newAlwaysWord : newNeverWord).trim().toLowerCase();
    if (w.length < 2) return;
    if (kind === 'always') {
      if (alwaysWords.includes(w) || alwaysWords.length >= 15) return;
      setAlwaysWords([...alwaysWords, w]);
      setNewAlwaysWord('');
    } else {
      if (neverWords.includes(w) || neverWords.length >= 15) return;
      setNeverWords([...neverWords, w]);
      setNewNeverWord('');
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/brand-os/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_colors: colors,
          tone,
          always_use_words: alwaysWords,
          never_use_words: neverWords,
          validator_strictness: strictness,
          auto_correct: autoCorrect,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Brand OS updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Colors */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Brand colors</h2>
          </div>
          <p className="text-[12px] text-fg-muted">Up to 6 colors. Imagery and video will favor these.</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-surface-2 pl-2 pr-1 py-1">
                <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c }} />
                <span className="text-[12px] font-mono uppercase">{c}</span>
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="h-5 w-5 rounded hover:bg-surface-3 flex items-center justify-center"
                  aria-label="Remove color"
                >
                  <XIcon className="h-3 w-3 text-fg-muted" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-14 rounded border border-border bg-surface-2 cursor-pointer"
            />
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="#c9a863"
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-gold/60"
            />
            <Button type="button" onClick={addColor} size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tone */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Brand tone</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`text-left rounded-md border p-3 transition ${
                  tone === t.id ? 'bg-gold/10 border-gold/50' : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{t.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5 italic">&quot;{t.sample}&quot;</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Words */}
      <Card>
        <CardBody className="space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Always use</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {alwaysWords.map((w) => (
                <span key={w} className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 text-[11.5px] text-green-400">
                  {w}
                  <button type="button" onClick={() => setAlwaysWords(alwaysWords.filter((x) => x !== w))}>
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAlwaysWord}
                onChange={(e) => setNewAlwaysWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord('always'))}
                placeholder="e.g., curated, timeless, considered"
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] focus:outline-none focus:border-gold/60"
              />
              <Button type="button" onClick={() => addWord('always')} size="sm" variant="outline">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Never use</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {neverWords.map((w) => (
                <span key={w} className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/30 px-2.5 py-0.5 text-[11.5px] text-danger">
                  {w}
                  <button type="button" onClick={() => setNeverWords(neverWords.filter((x) => x !== w))}>
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNeverWord}
                onChange={(e) => setNewNeverWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord('never'))}
                placeholder="e.g., cheap, basic, generic"
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] focus:outline-none focus:border-gold/60"
              />
              <Button type="button" onClick={() => addWord('never')} size="sm" variant="outline">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Validator settings */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Validator</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[13px] font-medium">Auto-correct violations</div>
              <div className="text-[11.5px] text-fg-muted">When an output breaks a rule, Operator regenerates it.</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoCorrect(!autoCorrect)}
              className={`relative h-6 w-11 rounded-full transition-colors ${autoCorrect ? 'bg-gold' : 'bg-surface-3'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoCorrect ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-2">Strictness</div>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'strict'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrictness(s)}
                  className={`rounded-md border py-2 text-[12px] transition capitalize ${
                    strictness === s
                      ? 'bg-gold/10 border-gold/50 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted hover:border-border/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} size="lg">
          Save Brand OS
        </Button>
      </div>
    </div>
  );
}
EOFBOF
echo "OK brand-os page"

# Brand OS save API
mkdir -p src/app/api/brand-os/save
cat > src/app/api/brand-os/save/route.ts << 'EOFBOSAVE'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  brand_colors: z.array(z.string()).max(6),
  tone: z.enum(['minimal', 'editorial', 'bold', 'playful', 'professional']),
  always_use_words: z.array(z.string()).max(15),
  never_use_words: z.array(z.string()).max(15),
  validator_strictness: z.enum(['low', 'medium', 'high', 'strict']),
  auto_correct: z.boolean(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No workspace' }, { status: 403 });
  }

  const { error } = await (svc.from as any)('brand_os_rules').upsert({
    org_id: orgId,
    ...parsed.data,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'org_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
EOFBOSAVE
echo "OK brand-os API"

# ============================================================
# 7. UPDATE SIDEBAR — new structure
# ============================================================
echo ">>> Updating sidebar with new structure..."

python3 << 'PYSB'
import re
path = 'src/components/layout/sidebar.tsx'
src = open(path, 'r').read()

# Add Rocket and Target to icon imports if missing
if "Rocket" not in src:
    # Add to lucide imports
    pattern = r"from 'lucide-react'"
    match = re.search(r"import \{([^}]+)\} from 'lucide-react';", src)
    if match:
        current = match.group(1)
        if 'Rocket' not in current:
            new_imports = current.rstrip() + ', Rocket, Target'
            src = src.replace(match.group(0), f"import {{{new_imports}}} from 'lucide-react';")

open(path, 'w').write(src)
print('Added Rocket/Target imports')

# Now add Missions + Brand OS to navigation
# This is best-effort and keeps existing structure
if '/missions' not in src:
    # Find first nav item and inject Missions at top
    patterns = [
        (r"(\{ href: '/dashboard',)", r"{ href: '/missions', label: 'Missions', icon: Rocket, badge: 'NEW' },\n      \1"),
    ]
    for p, r in patterns:
        if re.search(p, src):
            src = re.sub(p, r, src, count=1)
            open(path, 'w').write(src)
            print('Missions added to sidebar')
            break

if '/brand-os' not in src:
    # Add Brand OS after dashboard
    patterns = [
        (r"(\{ href: '/chat', label: 'Chat'[^}]+\},)",
         r"\1\n      { href: '/brand-os', label: 'Brand OS', icon: Target, badge: 'NEW' },"),
    ]
    for p, r in patterns:
        if re.search(p, src):
            src = re.sub(p, r, src, count=1)
            open(path, 'w').write(src)
            print('Brand OS added to sidebar')
            break
PYSB
echo "OK sidebar"

# ============================================================
# 8. NEW LANDING PAGE
# ============================================================
echo ">>> Creating new landing page..."

cat > src/app/page.tsx << 'EOFLAND'
import Link from 'next/link';
import { ArrowRight, Rocket, Target, Zap, Sparkles, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'Operator AI — Deploy missions. Not prompts.',
  description: 'The autonomous operations platform for brands. Deploy missions, enforce your brand, track outcomes.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between h-14 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] tracking-tight">Operator</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold transition-colors">Pricing</Link>
            <Link href="/changelog" className="hover:text-gold transition-colors">Changelog</Link>
            <Link href="/login" className="hover:text-gold transition-colors">Log in</Link>
          </nav>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition"
          >
            <span>Start 7-day free trial</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 lg:px-8 pt-20 lg:pt-28 pb-20 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full gold-grad opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="relative max-w-[920px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1 text-[11px] uppercase tracking-[0.14em] text-gold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>Operator AI v4.0</span>
          </div>
          <h1 className="font-display text-[52px] lg:text-[80px] leading-[0.98] mb-6">
            Deploy missions.<br />
            <span className="text-gold-grad">Not prompts.</span>
          </h1>
          <p className="text-[16px] lg:text-[18px] text-fg-muted max-w-[620px] mx-auto leading-relaxed mb-10">
            Operator AI is the autonomous operations platform for brands. Define an objective. Deploy a mission.
            Agents orchestrate the work. You review outcomes, not prompts.
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>Start 7-day free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              View pricing
            </Link>
          </div>
          <p className="text-[11.5px] text-fg-subtle uppercase tracking-[0.14em]">
            No card required &middot; Starter from $29/mo
          </p>
        </div>
      </section>

      {/* Compare */}
      <section className="px-5 lg:px-8 pb-20">
        <div className="max-w-[920px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">The shift</div>
            <h2 className="font-display text-[32px] lg:text-[40px] leading-tight">
              From prompts to <span className="text-gold-grad">operations</span>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-6 opacity-80">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">The old way</div>
              <div className="text-[16px] font-display mb-4">Write prompt. Copy. Edit. Repeat.</div>
              <ul className="space-y-2 text-[13px] text-fg-muted">
                <li>&bull; Open 5 AI tools</li>
                <li>&bull; Craft prompts for each</li>
                <li>&bull; Manually copy outputs</li>
                <li>&bull; Check every output for brand consistency</li>
                <li>&bull; No memory of what worked</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gold-grad opacity-[0.12] blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-3">With Operator</div>
                <div className="text-[16px] font-display mb-4">Deploy mission. Review outcomes.</div>
                <ul className="space-y-2 text-[13px] text-fg-muted">
                  <li className="text-fg">&bull; One objective, one click</li>
                  <li className="text-fg">&bull; Agents orchestrate automatically</li>
                  <li className="text-fg">&bull; Brand OS enforces every output</li>
                  <li className="text-fg">&bull; Outcomes tracked, learning applied</li>
                  <li className="text-fg">&bull; You approve. It executes.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core pillars */}
      <section className="px-5 lg:px-8 pb-24">
        <div className="max-w-[1020px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Three pillars</div>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-tight">
              Everything runs on <span className="text-gold-grad">your brand</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Pillar
              icon={Rocket}
              title="Missions"
              description="Deploy autonomous objectives. Agents generate, execute, and track for you."
            />
            <Pillar
              icon={Target}
              title="Brand OS"
              description="Your colors, words, tone &mdash; enforced on every output. On-brand by default."
            />
            <Pillar
              icon={Zap}
              title="Workflows"
              description="Multi-step automations with real integrations. Schedule, trigger, chain."
            />
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="relative px-5 lg:px-8 py-24 border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-[500px] rounded-full gold-grad opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="relative max-w-[720px] mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Ready when you are</div>
          <h2 className="font-display text-[40px] lg:text-[56px] leading-tight mb-5">
            Run your brand like a <span className="text-gold-grad">studio</span>.
          </h2>
          <p className="text-[15px] text-fg-muted max-w-[500px] mx-auto mb-8">
            Start free for 7 days. No card required. Cancel anytime. Plans from $29/month.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>Start free trial</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              See plans
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-5">
        <div className="max-w-[1020px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-6 w-6 rounded" />
            <span className="text-[12px] text-fg-muted">&copy; {new Date().getFullYear()} Operator AI</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold">Pricing</Link>
            <Link href="/changelog" className="hover:text-gold">Changelog</Link>
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon: Icon, title, description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 hover:border-gold/40 transition-all">
      <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <h3 className="font-display text-[20px] mb-2">{title}</h3>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{description}</p>
    </div>
  );
}
EOFLAND
echo "OK landing page"

# ============================================================
# 9. TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  REPOSITIONING v4.0 — COMPLETE"
echo "================================================================"
echo ""
echo "WHAT WAS ADDED:"
echo ""
echo "💾 DATABASE:"
echo "  ✓ Migration 0027: missions + mission_steps + brand_os_rules + brand_os_validations"
echo ""
echo "🎯 NEW DASHBOARD (collapsed to 5):"
echo "  ✓ Missions (hero tile)"
echo "  ✓ Chat · Studio · Workflows · Brand OS"
echo "  ✓ 'Also here' row for Projects/Knowledge/Files/etc"
echo ""
echo "🚀 MISSIONS:"
echo "  ✓ /missions — list + templates + empty state"
echo "  ✓ /missions/new — deploy flow (title/objective/category/autonomy)"
echo "  ✓ /missions/[id] — detail page with steps"
echo "  ✓ /api/missions/create"
echo ""
echo "🎨 BRAND OS:"
echo "  ✓ /brand-os — full configuration (colors/tone/words/validator)"
echo "  ✓ /api/brand-os/save"
echo ""
echo "🏠 LANDING PAGE:"
echo "  ✓ New hero: 'Deploy missions. Not prompts.'"
echo "  ✓ Comparison section (prompts vs missions)"
echo "  ✓ Three pillars (Missions/Brand OS/Workflows)"
echo "  ✓ Pricing CTA section"
echo "  ✓ Premium footer"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Apply migration 0027:"
echo "   open -e supabase/migrations/0027_missions_brand_os.sql"
echo "   [Supabase SQL Editor → paste → Run]"
echo ""
echo "2. Regenerate types (when API is reachable):"
echo "   export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "   pnpm db:generate"
echo ""
echo "3. Push:"
echo "   git add -A"
echo "   git commit -m 'feat: v4.0 repositioning — Missions + Brand OS + new landing'"
echo "   git push"
echo ""
echo "All 'as any' casts are in place so build should pass even without regenerated types."
echo ""
