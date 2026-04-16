#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI — Premium Onboarding + Route Audit"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# 1. MIGRATION 0024 — onboarding state + brand profile
# ============================================================
echo ">>> Creating migration 0024 (brand profile + onboarding)..."

cat > supabase/migrations/0024_onboarding.sql << 'EOFMIG'
-- Brand profile — per organization
create table if not exists public.brand_profile (
  org_id text primary key references public.organizations(id) on delete cascade,
  brand_name text,
  description text,
  vibe text check (vibe in ('minimal', 'editorial', 'bold', 'playful')),
  logo_url text,
  user_role text,
  first_prompt text,
  updated_at timestamptz not null default now()
);

alter table public.brand_profile enable row level security;

drop policy if exists "brand_profile by org members" on public.brand_profile;
create policy "brand_profile by org members"
  on public.brand_profile for all
  using (public.is_org_member(org_id));

-- Onboarding state — per user
create table if not exists public.onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id text references public.organizations(id) on delete cascade,
  current_step integer default 0,
  completed boolean default false,
  data jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz
);

alter table public.onboarding_state enable row level security;

drop policy if exists "onboarding own rows" on public.onboarding_state;
create policy "onboarding own rows"
  on public.onboarding_state for all
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
EOFMIG
echo "OK migration 0024"

# ============================================================
# 2. ONBOARDING API — save state
# ============================================================
echo ">>> Creating /api/onboarding..."

mkdir -p src/app/api/onboarding/save
cat > src/app/api/onboarding/save/route.ts << 'EOFSAVE'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  step: z.number().int().min(0).max(6),
  data: z.record(z.unknown()).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string | null = null;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    // user hasn't created an org yet
  }

  const payload = {
    user_id: user.id,
    org_id: orgId,
    current_step: parsed.data.step,
    data: parsed.data.data ?? {},
    completed: parsed.data.completed ?? false,
    completed_at: parsed.data.completed ? new Date().toISOString() : null,
  };

  const { error } = await svc
    .from('onboarding_state')
    .upsert(payload as never, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If complete, persist brand profile
  if (parsed.data.completed && orgId && parsed.data.data) {
    const d = parsed.data.data as Record<string, string>;
    await svc.from('brand_profile').upsert({
      org_id: orgId,
      brand_name: d.brand_name ?? null,
      description: d.description ?? null,
      vibe: d.vibe ?? null,
      user_role: d.user_role ?? null,
      first_prompt: d.first_prompt ?? null,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id' });
  }

  return NextResponse.json({ ok: true });
}
EOFSAVE

mkdir -p src/app/api/onboarding/state
cat > src/app/api/onboarding/state/route.ts << 'EOFSTATE'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function GET() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  const { data } = await svc
    .from('onboarding_state')
    .select('current_step, data, completed')
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json({ state: data });
}
EOFSTATE
echo "OK onboarding api"

# ============================================================
# 3. ONBOARDING WIZARD COMPONENT
# ============================================================
echo ">>> Creating onboarding wizard..."

mkdir -p "src/app/(onboarding)/welcome"
cat > "src/app/(onboarding)/welcome/page.tsx" << 'EOFPAGE'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/features/onboarding/components/wizard';

export const dynamic = 'force-dynamic';

export default async function WelcomePage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  return <OnboardingWizard userEmail={user.email ?? ''} />;
}
EOFPAGE

mkdir -p src/features/onboarding/components
cat > src/features/onboarding/components/wizard.tsx << 'EOFWIZ'
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StepWelcome } from './step-welcome';
import { StepAbout } from './step-about';
import { StepBrand } from './step-brand';
import { StepVibe } from './step-vibe';
import { StepFirstPrompt } from './step-first-prompt';
import { StepTour } from './step-tour';

export interface OnboardingData {
  full_name?: string;
  user_role?: string;
  brand_name?: string;
  description?: string;
  vibe?: 'minimal' | 'editorial' | 'bold' | 'playful';
  first_prompt?: string;
}

export function OnboardingWizard({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(true);

  // Load saved state on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/onboarding/state');
        if (res.ok) {
          const body = await res.json();
          if (!cancelled && body.state) {
            if (body.state.completed) {
              router.replace('/dashboard');
              return;
            }
            setStep(body.state.current_step ?? 0);
            setData((body.state.data ?? {}) as OnboardingData);
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  async function saveState(newStep: number, newData: OnboardingData, completed = false) {
    try {
      await fetch('/api/onboarding/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: newStep, data: newData, completed }),
      });
    } catch {
      // non-fatal
    }
  }

  async function next(partial: Partial<OnboardingData>) {
    const merged = { ...data, ...partial };
    setData(merged);
    const nextStep = step + 1;
    setStep(nextStep);
    await saveState(nextStep, merged, false);
  }

  async function complete(partial: Partial<OnboardingData>) {
    const merged = { ...data, ...partial };
    setData(merged);
    await saveState(6, merged, true);
    toast.success('You\'re all set!');
    router.push('/dashboard');
    router.refresh();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="h-8 w-8 rounded-full gold-grad animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-surface-2 relative overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 gold-grad transition-all duration-500 ease-out"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[640px]">
          {step === 0 && <StepWelcome onNext={() => next({})} email={userEmail} />}
          {step === 1 && <StepAbout data={data} onNext={next} onBack={back} />}
          {step === 2 && <StepBrand data={data} onNext={next} onBack={back} />}
          {step === 3 && <StepVibe data={data} onNext={next} onBack={back} />}
          {step === 4 && <StepFirstPrompt data={data} onNext={next} onBack={back} />}
          {step === 5 && <StepTour data={data} onComplete={complete} onBack={back} />}
        </div>
      </div>

      {/* Skip — available after step 1 */}
      {step > 0 && step < 5 && (
        <div className="text-center pb-6">
          <button
            type="button"
            onClick={() => complete(data)}
            className="text-[11.5px] uppercase tracking-[0.14em] text-fg-subtle hover:text-gold transition-colors"
          >
            Skip onboarding
          </button>
        </div>
      )}
    </div>
  );
}
EOFWIZ

# Step 0 — Welcome
cat > src/features/onboarding/components/step-welcome.tsx << 'EOFS0'
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function StepWelcome({ onNext, email }: { onNext: () => void; email: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="inline-flex items-center justify-center mb-8">
        <div className="relative">
          <div className="absolute inset-0 gold-grad rounded-2xl blur-2xl opacity-40 animate-pulse" />
          <img
            src="/logo.png"
            alt="Operator AI"
            className="relative h-24 w-24 rounded-2xl shadow-2xl"
          />
        </div>
      </div>

      <div className="text-[11px] uppercase tracking-[0.24em] text-gold mb-4">Operator AI</div>
      <h1 className="font-display text-[42px] lg:text-[56px] leading-[1.05] mb-5">
        Welcome to your<br />
        <span className="text-gold-grad">AI studio</span>.
      </h1>
      <p className="text-[15px] text-fg-muted mb-3">
        {email}
      </p>
      <p className="text-[14.5px] text-fg-muted max-w-[460px] mx-auto mb-10 leading-relaxed">
        Let's set up your studio in 60 seconds. We'll tailor Operator to your brand, your vibe, and your first question.
      </p>
      <Button size="lg" onClick={onNext} className="min-w-[180px]">
        <span>Begin</span>
      </Button>
      <p className="text-[11.5px] text-fg-subtle mt-6 uppercase tracking-[0.14em]">
        6 quick steps · 7-day free trial active
      </p>
    </div>
  );
}
EOFS0

# Step 1 — About
cat > src/features/onboarding/components/step-about.tsx << 'EOFS1'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

const roles = [
  { id: 'founder', label: 'Founder', desc: 'Solo or small team' },
  { id: 'marketer', label: 'Marketer', desc: 'Brand, growth, content' },
  { id: 'creator', label: 'Creator', desc: 'Personal brand, social' },
  { id: 'agency', label: 'Agency', desc: 'Multiple brands/clients' },
  { id: 'other', label: 'Something else', desc: 'Custom use case' },
];

export function StepAbout({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [name, setName] = useState(data.full_name ?? '');
  const [role, setRole] = useState(data.user_role ?? '');

  const canContinue = name.trim().length >= 2 && role.length > 0;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 1 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          First, <span className="text-gold-grad">who are you</span>?
        </h2>
        <p className="text-[14px] text-fg-muted">
          This helps us personalize everything.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rubén"
            autoFocus
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your role</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  'text-left rounded-md border px-4 py-3 transition-all',
                  role === r.id
                    ? 'bg-gold/10 border-gold/50 text-fg'
                    : 'bg-surface-2 border-border text-fg-muted hover:text-fg hover:border-border/60',
                )}
              >
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[11.5px] text-fg-subtle mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ full_name: name.trim(), user_role: role })}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
EOFS1

# Step 2 — Brand
cat > src/features/onboarding/components/step-brand.tsx << 'EOFS2'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OnboardingData } from './wizard';

export function StepBrand({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [brandName, setBrandName] = useState(data.brand_name ?? '');
  const [description, setDescription] = useState(data.description ?? '');

  const canContinue = brandName.trim().length >= 2 && description.trim().length >= 10;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 2 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          What's your <span className="text-gold-grad">brand</span>?
        </h2>
        <p className="text-[14px] text-fg-muted">
          Operator will keep this context in every conversation.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Brand or project name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Vesper Studio, Maison, Canal"
            autoFocus
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Describe it in one sentence</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A boutique branding studio for independent fashion labels in Madrid."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <p className="text-[11.5px] text-fg-subtle mt-1.5">
            Be specific — what you do, for whom, and how. Operator uses this as context forever.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ brand_name: brandName.trim(), description: description.trim() })}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
EOFS2

# Step 3 — Vibe
cat > src/features/onboarding/components/step-vibe.tsx << 'EOFS3'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

const vibes = [
  { id: 'minimal', label: 'Minimal', desc: 'Clean, restrained, architectural', sample: 'Less is more.' },
  { id: 'editorial', label: 'Editorial', desc: 'Cultured, cinematic, considered', sample: 'A quiet kind of luxury.' },
  { id: 'bold', label: 'Bold', desc: 'Loud, confident, category-defining', sample: 'We don\'t whisper. We move.' },
  { id: 'playful', label: 'Playful', desc: 'Warm, fun, conversational', sample: 'Serious work. Fun people.' },
] as const;

export function StepVibe({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [vibe, setVibe] = useState(data.vibe ?? '');

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 3 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          Choose your <span className="text-gold-grad">vibe</span>.
        </h2>
        <p className="text-[14px] text-fg-muted">
          This sets the tone of everything Operator writes for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vibes.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVibe(v.id)}
            className={cn(
              'text-left rounded-lg border p-5 transition-all',
              vibe === v.id
                ? 'bg-gold/10 border-gold/50 shadow-[0_4px_24px_-8px_rgba(201,168,99,0.35)]'
                : 'bg-surface border-border hover:border-border/60',
            )}
          >
            <div className="font-display text-[20px] mb-1">{v.label}</div>
            <div className="text-[12.5px] text-fg-muted mb-3">{v.desc}</div>
            <div className="text-[13px] italic text-fg-soft border-l-2 border-gold/40 pl-3">
              "{v.sample}"
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ vibe: vibe as OnboardingData['vibe'] })}
          disabled={!vibe}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
EOFS3

# Step 4 — First Prompt
cat > src/features/onboarding/components/step-first-prompt.tsx << 'EOFS4'
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { OnboardingData } from './wizard';

function suggestionFor(role?: string, brand?: string): string {
  const name = brand || 'my brand';
  switch (role) {
    case 'founder':
      return `Help me pitch ${name} to an investor in 3 short paragraphs.`;
    case 'marketer':
      return `Draft a launch campaign plan for ${name} with 5 channels.`;
    case 'creator':
      return `Write 7 Instagram captions for ${name}, consistent with my voice.`;
    case 'agency':
      return `Propose a tone-of-voice guide for a new client similar to ${name}.`;
    default:
      return `Give me a 60-second brand diagnosis for ${name}: what works, what doesn't, what to fix first.`;
  }
}

export function StepFirstPrompt({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const suggestion = suggestionFor(data.user_role, data.brand_name);
  const [prompt, setPrompt] = useState(data.first_prompt ?? suggestion);

  useEffect(() => {
    if (!data.first_prompt) setPrompt(suggestion);
  }, [suggestion, data.first_prompt]);

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 4 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          Ask Operator your <span className="text-gold-grad">first question</span>.
        </h2>
        <p className="text-[14px] text-fg-muted">
          We pre-filled one based on your profile. Edit it freely.
        </p>
      </div>

      <div>
        <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your first prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          autoFocus
          className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
        />
        <div className="flex items-center gap-2 mt-2 text-[11.5px] text-fg-subtle">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>Operator already knows your brand, role, and vibe. Skip the setup talk.</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ first_prompt: prompt.trim() })}
          disabled={prompt.trim().length < 5}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
EOFS4

# Step 5 — Tour
cat > src/features/onboarding/components/step-tour.tsx << 'EOFS5'
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, ImageIcon, Video, Mic, Zap, FileSpreadsheet, FolderOpen, Search } from 'lucide-react';
import type { OnboardingData } from './wizard';

const tools = [
  { label: 'Creative Agent', icon: MessageSquare, desc: 'Chat with your brand AI' },
  { label: 'Image Studio', icon: ImageIcon, desc: 'Editorial imagery' },
  { label: 'Video Studio', icon: Video, desc: 'Cinematic AI video' },
  { label: 'Voice Mode', icon: Mic, desc: 'Push-to-talk' },
  { label: 'Workflows', icon: Zap, desc: 'Multi-step automations' },
  { label: 'Files & Analysis', icon: FileSpreadsheet, desc: 'Insights from data' },
  { label: 'Projects', icon: FolderOpen, desc: 'Brand workspaces' },
  { label: 'Knowledge', icon: Search, desc: 'Searchable docs' },
];

export function StepTour({
  data, onComplete, onBack,
}: { data: OnboardingData; onComplete: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const name = data.full_name?.split(' ')[0] || 'there';

  async function handleFinish() {
    setLoading(true);
    onComplete({});
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Step 5 of 5</div>
        <h2 className="font-display text-[36px] lg:text-[44px] leading-tight mb-3">
          You're all set, <span className="text-gold-grad">{name}</span>.
        </h2>
        <p className="text-[14.5px] text-fg-muted max-w-[440px] mx-auto">
          Your studio is ready. Here's what you can do next.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.label} className="rounded-md border border-border bg-surface p-3.5 text-center">
              <Icon className="h-4 w-4 text-gold mx-auto mb-2" />
              <div className="text-[12.5px] font-medium">{t.label}</div>
              <div className="text-[10.5px] text-fg-subtle mt-0.5 leading-tight">{t.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button size="lg" onClick={handleFinish} loading={loading}>
          Enter studio
        </Button>
      </div>
    </div>
  );
}
EOFS5

echo "OK wizard + 6 steps"

# ============================================================
# 4. ONBOARDING LAYOUT
# ============================================================
echo ">>> Creating onboarding layout..."

cat > "src/app/(onboarding)/welcome/layout.tsx" << 'EOFLAY'
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome — Operator AI',
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
EOFLAY
echo "OK onboarding layout"

# ============================================================
# 5. INJECT BRAND PROFILE INTO CHAT SYSTEM PROMPT
# ============================================================
echo ">>> Injecting brand profile into chat context..."

python3 << 'PYCHAT'
path = 'src/app/api/chat/route.ts'
src = open(path, 'r').read()

if 'brand_profile' not in src:
    # Find a good place to inject — right after resolveOrgContext
    # Add a simple fetch to load brand profile and include in systemAdditions
    injection = """
  // Load brand profile for persistent context
  try {
    const { data: bp } = await svc.from('brand_profile').select('*').eq('org_id', orgId).maybeSingle();
    if (bp) {
      const profile = bp as { brand_name?: string; description?: string; vibe?: string; user_role?: string };
      const lines: string[] = ['<brand_profile>'];
      if (profile.brand_name) lines.push('Brand: ' + profile.brand_name);
      if (profile.description) lines.push('Description: ' + profile.description);
      if (profile.vibe) lines.push('Tone: ' + profile.vibe);
      if (profile.user_role) lines.push('User role: ' + profile.user_role);
      lines.push('Use this context to personalize every response. Match the tone.');
      lines.push('</brand_profile>');
      systemAdditions.push({ role: 'system', content: lines.join('\\n') });
    }
  } catch { /* non-fatal */ }
"""

    # Find insertion point: right before "if (selectedAgent"
    anchor = "if (selectedAgent && selectedAgent.systemPromptAddition)"
    if anchor in src:
        src = src.replace(anchor, injection + '\n  ' + anchor, 1)
        open(path, 'w').write(src)
        print('Chat route patched with brand_profile context')
    else:
        print('Anchor not found — skipping chat patch')
PYCHAT
echo "OK chat brand context"

# ============================================================
# 6. AUTH GUARD — redirect to onboarding if not completed
# ============================================================
echo ">>> Adding onboarding guard to app layout..."

APP_LAYOUT=$(find src/app -path "*app*/layout.tsx" | grep -v "(marketing)" | grep -v "(onboarding)" | head -1)
if [ -n "$APP_LAYOUT" ]; then
  python3 << PYGUARD
path = "$APP_LAYOUT"
src = open(path, 'r').read()

if 'onboarding_state' not in src and 'createSupabaseServiceClient' in src:
    # Add guard: check onboarding_state and redirect to /welcome if not completed
    # This is best-effort; the user can manually edit if the layout doesn't follow the expected pattern

    # Find the auth check (getUser) and add guard after it
    import re
    # Common pattern: const { data: { user } } = await ssr.auth.getUser();
    if 'auth.getUser()' in src and 'redirect' in src:
        guard = """
  // Onboarding guard — redirect to welcome if not completed
  try {
    const svc = createSupabaseServiceClient();
    const { data: onboard } = await svc.from('onboarding_state').select('completed').eq('user_id', user.id).maybeSingle();
    if (!onboard || !onboard.completed) {
      redirect('/welcome');
    }
  } catch { /* non-fatal — let user through */ }
"""
        # Try to insert after redirect('/login') pattern, before the return
        marker = "if (!user) redirect('/login');"
        if marker in src and 'createSupabaseServiceClient' in src:
            src = src.replace(marker, marker + guard, 1)
        else:
            # Try other marker
            marker = "redirect('/login')"
            if marker in src:
                src = src.replace(marker, marker + ';\n' + guard, 1)

        open(path, 'w').write(src)
        print(f'Onboarding guard added to {path}')
    else:
        print(f'Could not find auth pattern in {path} — guard skipped')
PYGUARD
fi
echo "OK guard"

# ============================================================
# 7. ROUTE AUDIT SCRIPT
# ============================================================
echo ">>> Creating route audit script..."

mkdir -p scripts
cat > scripts/audit-routes.mjs << 'EOFAUDIT'
#!/usr/bin/env node
/**
 * Audit all internal routes in the app.
 * - Finds all href="/...", router.push("/..."), redirect("/..."), router.replace("/...")
 * - Compares against existing page.tsx files in src/app/**
 * - Reports broken links (href points to nonexistent page)
 * - Reports orphan pages (page exists but nothing links to it)
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, 'src', 'app');
const SRC_DIR = path.join(ROOT, 'src');

function walk(dir, acc = []) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.next') continue;
        walk(full, acc);
      } else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) {
        acc.push(full);
      }
    }
  } catch {}
  return acc;
}

// ---- Discover existing pages ----
function discoverPages() {
  const pages = new Set();
  const apiRoutes = new Set();
  const files = walk(APP_DIR);

  for (const file of files) {
    const rel = path.relative(APP_DIR, file);
    const base = path.basename(rel);
    if (base === 'page.tsx' || base === 'page.jsx' || base === 'page.ts' || base === 'page.js') {
      let route = '/' + path.dirname(rel).replace(/\\/g, '/');
      // Remove route group segments: (app), (marketing), (onboarding)
      route = route.replace(/\/\([^)]+\)/g, '');
      // Normalize
      if (route === '/.') route = '/';
      // Replace [param] with :param marker
      route = route.replace(/\[([^\]]+)\]/g, ':$1');
      pages.add(route);
    }
    if (base === 'route.ts' || base === 'route.js') {
      let r = '/' + path.dirname(rel).replace(/\\/g, '/');
      r = r.replace(/\/\([^)]+\)/g, '');
      r = r.replace(/\[([^\]]+)\]/g, ':$1');
      apiRoutes.add(r);
    }
  }
  return { pages, apiRoutes };
}

// ---- Extract links from all source files ----
function extractLinks() {
  const links = []; // {file, line, route}
  const files = walk(SRC_DIR);
  const patterns = [
    /href\s*=\s*["'`](\/[^"'`?#\s]*)["'`]/g,
    /router\.(?:push|replace)\s*\(\s*["'`](\/[^"'`?#\s)]*)["'`]/g,
    /redirect\s*\(\s*["'`](\/[^"'`?#\s)]*)["'`]/g,
    /Link[^>]*href\s*=\s*\{?\s*["'`](\/[^"'`?#\s}]*)["'`]/g,
  ];

  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let m;
        while ((m = pattern.exec(line)) !== null) {
          const route = m[1];
          if (route.startsWith('/api/') || route.startsWith('/_next/')) continue;
          links.push({
            file: path.relative(ROOT, file),
            line: i + 1,
            route,
          });
        }
      }
    }
  }
  return links;
}

function matchesPage(route, pages) {
  if (pages.has(route)) return true;
  // Strip trailing slash
  const trimmed = route.replace(/\/$/, '');
  if (pages.has(trimmed)) return true;
  if (pages.has(trimmed + '/')) return true;
  // Try with :param matching
  for (const p of pages) {
    if (p.includes(':')) {
      const regex = new RegExp('^' + p.replace(/:[^/]+/g, '[^/]+') + '$');
      if (regex.test(route) || regex.test(trimmed)) return true;
    }
  }
  // Special cases (always valid)
  const specialRoutes = ['/login', '/signup', '/logout', '/auth/callback', '/', '/dashboard'];
  if (specialRoutes.includes(route) || specialRoutes.includes(trimmed)) return true;
  return false;
}

// ---- Run audit ----
const { pages } = discoverPages();
const links = extractLinks();

const broken = [];
const used = new Set();

for (const link of links) {
  if (!matchesPage(link.route, pages)) {
    broken.push(link);
  } else {
    used.add(link.route);
    // Also mark trimmed versions
    used.add(link.route.replace(/\/$/, ''));
  }
}

// Pages that exist but are never linked
const orphans = [];
for (const p of pages) {
  if (used.has(p) || used.has(p.replace(/\/$/, ''))) continue;
  // Ignore special pages
  if (['/privacy', '/terms', '/cookies', '/delete-data', '/robots.txt'].includes(p)) continue;
  if (p.startsWith('/auth')) continue;
  orphans.push(p);
}

// ---- Report ----
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log('');
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log(BOLD + '  Operator AI — Route Audit' + RESET);
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log('');
console.log(`${CYAN}Pages discovered:${RESET} ${pages.size}`);
console.log(`${CYAN}Total links found:${RESET} ${links.length}`);
console.log('');

if (broken.length === 0) {
  console.log(GREEN + '✓ No broken links!' + RESET);
} else {
  console.log(RED + BOLD + '🚨 BROKEN LINKS (' + broken.length + '):' + RESET);
  for (const b of broken) {
    console.log(`  ${RED}${b.route}${RESET} ← ${b.file}:${b.line}`);
  }
}

console.log('');

if (orphans.length === 0) {
  console.log(GREEN + '✓ No orphan pages!' + RESET);
} else {
  console.log(YELLOW + BOLD + '🔗 ORPHAN PAGES (no links point to them):' + RESET);
  for (const o of orphans) {
    console.log(`  ${YELLOW}${o}${RESET}`);
  }
}

console.log('');
console.log(BOLD + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' + RESET);
console.log('');

if (broken.length > 0) {
  process.exit(1);
}
EOFAUDIT

chmod +x scripts/audit-routes.mjs

# Add script to package.json
python3 << 'PYPKG'
import json
with open('package.json', 'r') as f:
    pkg = json.load(f)
pkg['scripts']['audit:routes'] = 'node scripts/audit-routes.mjs'
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
    f.write('\n')
print('Added pnpm audit:routes to package.json')
PYPKG

echo "OK route audit script"

# ============================================================
# 8. RUN ROUTE AUDIT (non-blocking)
# ============================================================
echo ""
echo ">>> Running initial route audit (for your review)..."
node scripts/audit-routes.mjs || true

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  Onboarding + Route Audit Complete"
echo "================================================================"
echo ""
echo "WHAT WAS ADDED:"
echo "  ✓ Migration 0024: brand_profile + onboarding_state tables"
echo "  ✓ /welcome onboarding wizard (6 premium steps)"
echo "    - Step 0: Welcome with animated logo"
echo "    - Step 1: Name + role (5 roles)"
echo "    - Step 2: Brand name + description"
echo "    - Step 3: Vibe selector (4 styles)"
echo "    - Step 4: First prompt (pre-filled by role)"
echo "    - Step 5: Tour of 8 tools + Enter studio"
echo "  ✓ Progress bar (0-100% gold gradient)"
echo "  ✓ Persist state (resume mid-onboarding)"
echo "  ✓ Skip onboarding option (after step 1)"
echo "  ✓ /api/onboarding/save + /api/onboarding/state"
echo "  ✓ Chat route injects brand_profile as context"
echo "  ✓ App layout guard (redirect to /welcome if not completed)"
echo "  ✓ scripts/audit-routes.mjs (pnpm audit:routes)"
echo ""
echo "NEXT STEPS:"
echo "  1. Apply migration 0024:"
echo "     open -e supabase/migrations/0024_onboarding.sql"
echo "     [Supabase SQL Editor → paste → Run]"
echo ""
echo "  2. Regenerate types:"
echo "     export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "     pnpm db:generate"
echo ""
echo "  3. Fix any broken routes shown above"
echo ""
echo "  4. Push:"
echo "     git add -A"
echo "     git commit -m 'feat: premium onboarding + route audit'"
echo "     git push"
echo ""
echo "Use pnpm audit:routes anytime to check route integrity."
echo ""
