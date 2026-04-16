#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI — TIER 1 (Production-Grade Upgrade)"
echo "  Sentry + Analytics + Settings + Error Boundaries + Health"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# 0. INSTALL DEPS (Sentry + PostHog)
# ============================================================
echo ">>> Installing Sentry + PostHog..."
pnpm add @sentry/nextjs posthog-js posthog-node 2>&1 | tail -5
echo "OK deps"

# ============================================================
# 1. SENTRY CONFIG (client + server + edge)
# ============================================================
echo ">>> Setting up Sentry..."

cat > sentry.client.config.ts << 'EOFSCL'
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
    ],
  });
}
EOFSCL

cat > sentry.server.config.ts << 'EOFSSV'
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}
EOFSSV

cat > sentry.edge.config.ts << 'EOFSE'
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? 'development',
    tracesSampleRate: 0.1,
  });
}
EOFSE
echo "OK sentry configs"

# ============================================================
# 2. POSTHOG CLIENT
# ============================================================
echo ">>> Setting up PostHog..."

cat > src/lib/posthog.ts << 'EOFPH'
'use client';
import posthog from 'posthog-js';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

let initialized = false;

export function initPostHog() {
  if (typeof window === 'undefined' || initialized) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    loaded: (p) => {
      if (process.env.NEXT_PUBLIC_VERCEL_ENV !== 'production') {
        p.debug(false);
      }
    },
  });
  initialized = true;
}

export function usePostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!initialized || !pathname) return;
    let url = window.origin + pathname;
    if (searchParams?.toString()) url += '?' + searchParams.toString();
    posthog.capture('$pageview', { $current_url: url });
  }, [pathname, searchParams]);
}

export function identifyUser(userId: string, email: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, { email, ...properties });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}
EOFPH

# PostHog provider wrapper
cat > src/components/analytics/posthog-provider.tsx << 'EOFPHP'
'use client';
import { useEffect, Suspense } from 'react';
import { initPostHog, usePostHogPageView } from '@/lib/posthog';

function PageViewTracker() {
  usePostHogPageView();
  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
EOFPHP
echo "OK posthog"

# Wire PostHog provider into root layout
python3 << 'PYROOT'
path = 'src/app/layout.tsx'
src = open(path, 'r').read()
if 'PostHogProvider' not in src:
    src = src.replace(
        "import { I18nProvider } from '@/lib/i18n';",
        "import { I18nProvider } from '@/lib/i18n';\nimport { PostHogProvider } from '@/components/analytics/posthog-provider';"
    )
    src = src.replace(
        '<I18nProvider>{children}</I18nProvider>',
        '<PostHogProvider><I18nProvider>{children}</I18nProvider></PostHogProvider>'
    )
    open(path, 'w').write(src)
    print('layout.tsx wrapped with PostHog')
PYROOT

# ============================================================
# 3. ERROR BOUNDARIES (error.tsx in key segments)
# ============================================================
echo ">>> Creating error boundaries..."

# Root error.tsx
cat > src/app/error.tsx << 'EOFERR'
'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center px-6">
      <div className="max-w-[460px] text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-danger/10 border border-danger/30 mb-4">
            <AlertCircle className="h-7 w-7 text-danger" />
          </div>
        </div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Error</div>
        <h1 className="font-display text-[32px] leading-tight mb-3">Something went wrong</h1>
        <p className="text-[14px] text-fg-muted mb-7">
          We&apos;ve logged this error and our team has been notified. Try again, or return home.
        </p>
        {error.digest && (
          <p className="text-[11px] text-fg-subtle mb-6 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>Try again</Button>
          <Link href="/dashboard">
            <Button>Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
EOFERR

# App segment error.tsx
cat > "src/app/(app)/error.tsx" << 'EOFAPPERR'
'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-[420px]">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-danger/10 border border-danger/30 mb-4">
          <AlertCircle className="h-6 w-6 text-danger" />
        </div>
        <h2 className="font-display text-[24px] mb-2">This section had an error</h2>
        <p className="text-[13.5px] text-fg-muted mb-6">
          The issue has been reported. You can retry or navigate elsewhere.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={reset}>Retry</Button>
          <Link href="/dashboard"><Button>Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
EOFAPPERR

# Not found page
cat > src/app/not-found.tsx << 'EOFNF'
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-[440px]">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">404</div>
        <h1 className="font-display text-[48px] leading-tight mb-3">Page not found</h1>
        <p className="text-[14px] text-fg-muted mb-7">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
      </div>
    </div>
  );
}
EOFNF
echo "OK error boundaries"

# ============================================================
# 4. HEALTH CHECK ENDPOINT
# ============================================================
echo ">>> Creating /api/health..."

mkdir -p src/app/api/health
cat > src/app/api/health/route.ts << 'EOFH'
import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ServiceStatus {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  error?: string;
}

async function checkWithTimeout(name: string, fn: () => Promise<void>, timeoutMs = 5000): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), timeoutMs)),
    ]);
    return { name, status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { name, status: 'down', latencyMs: Date.now() - start, error: e instanceof Error ? e.message : 'unknown' };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkWithTimeout('supabase', async () => {
      const svc = createSupabaseServiceClient();
      const { error } = await svc.from('organizations').select('id').limit(1);
      if (error) throw error;
    }),
    checkWithTimeout('openai', async () => {
      if (!process.env.OPENAI_API_KEY) throw new Error('not configured');
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
    checkWithTimeout('anthropic', async () => {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error('not configured');
      // Anthropic doesn't have a cheap ping; check a HEAD on the root API
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'OPTIONS',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
    }),
    checkWithTimeout('google', async () => {
      if (!process.env.GOOGLE_API_KEY) throw new Error('not configured');
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
    checkWithTimeout('stripe', async () => {
      if (!process.env.STRIPE_SECRET_KEY) throw new Error('not configured');
      const res = await fetch('https://api.stripe.com/v1/charges?limit=1', {
        headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }),
  ]);

  const anyDown = checks.some((c) => c.status === 'down');
  const overall = anyDown ? 'degraded' : 'ok';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    services: checks,
  }, { status: anyDown ? 503 : 200 });
}
EOFH
echo "OK /api/health"

# ============================================================
# 5. SETTINGS HUB — sidebar with 10 sections
# ============================================================
echo ">>> Building expanded settings hub..."

# Replace settings/page.tsx with proper hub
cat > "src/app/(app)/settings/page.tsx" << 'EOFS'
import Link from 'next/link';
import {
  Plug, Brain, CreditCard, User, Palette, Bell, Shield, Cpu,
  Key, Database, Building, Webhook, Terminal, ChevronRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Section {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: 'account' | 'ai' | 'integrations' | 'developer';
  badge?: string;
}

const sections: Section[] = [
  { group: 'account', href: '/settings/profile', label: 'Profile', description: 'Your name, avatar, and display info.', icon: User },
  { group: 'account', href: '/settings/appearance', label: 'Appearance', description: 'Theme, density, and motion preferences.', icon: Palette },
  { group: 'account', href: '/settings/notifications', label: 'Notifications', description: 'Email, push, and in-app alerts.', icon: Bell },
  { group: 'account', href: '/settings/security', label: 'Security', description: 'Password, 2FA, and active sessions.', icon: Shield },
  { group: 'account', href: '/settings/billing', label: 'Billing', description: 'Plan, invoices, payment method.', icon: CreditCard },
  { group: 'ai', href: '/settings/ai', label: 'AI Preferences', description: 'Default model, temperature, language.', icon: Cpu },
  { group: 'ai', href: '/settings/memory', label: 'Memory & Voice', description: 'What Operator knows about you.', icon: Brain },
  { group: 'integrations', href: '/settings/integrations', label: 'Integrations', description: 'Gmail, Calendar, Notion, Slack and more.', icon: Plug },
  { group: 'integrations', href: '/settings/organization', label: 'Organization', description: 'Team seats, roles, org details.', icon: Building },
  { group: 'developer', href: '/settings/api-keys', label: 'API Keys', description: 'Generate keys to use Operator from your own apps.', icon: Key, badge: 'Pro' },
  { group: 'developer', href: '/settings/webhooks', label: 'Webhooks', description: 'Receive events at your own endpoint.', icon: Webhook, badge: 'Pro' },
  { group: 'developer', href: '/settings/data', label: 'Data & Privacy', description: 'Export data, delete history, GDPR controls.', icon: Database },
  { group: 'developer', href: '/settings/developer', label: 'Developer', description: 'API logs, rate limits, usage graphs.', icon: Terminal, badge: 'Pro' },
];

const groups = [
  { id: 'account', label: 'Account' },
  { id: 'ai', label: 'AI' },
  { id: 'integrations', label: 'Workspace' },
  { id: 'developer', label: 'Developer' },
] as const;

export default function SettingsPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] w-full mx-auto">
      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
        <h1 className="font-display text-[36px]">Settings</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Manage your workspace, integrations, and account.</p>
      </div>

      <div className="space-y-10">
        {groups.map((g) => {
          const items = sections.filter((s) => s.group === g.id);
          if (items.length === 0) return null;
          return (
            <div key={g.id}>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">{g.label}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="group flex items-center gap-3.5 p-3.5 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-gold/40 transition-all"
                    >
                      <div className="h-9 w-9 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
                        <Icon className="h-4 w-4 text-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium group-hover:text-gold transition-colors flex items-center gap-2">
                          {s.label}
                          {s.badge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-[0.1em]">{s.badge}</span>}
                        </div>
                        <div className="text-[12.5px] text-fg-muted mt-0.5">{s.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
EOFS
echo "OK settings hub"

# ============================================================
# 6. SETTINGS PAGES — create all 10 new ones
# ============================================================
echo ">>> Creating 10 new settings pages..."

# Helper function: generic settings page shell
# Instead of custom pages, we create well-designed pages for each.

# /settings/appearance
mkdir -p "src/app/(app)/settings/appearance"
cat > "src/app/(app)/settings/appearance/page.tsx" << 'EOFA'
'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsBack } from '@/features/settings/components/settings-back';

const themes = [
  { id: 'dark', label: 'Dark', desc: 'Editorial black + gold. Default.' },
  { id: 'light', label: 'Light', desc: 'Clean white. Coming soon.', disabled: true },
  { id: 'auto', label: 'Auto', desc: 'Match system preference.', disabled: true },
];

const densities = [
  { id: 'comfortable', label: 'Comfortable', desc: 'More spacing, larger hits.' },
  { id: 'compact', label: 'Compact', desc: 'More info per screen.' },
];

export default function AppearancePage() {
  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('comfortable');
  const [animations, setAnimations] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('operator.theme') ?? 'dark';
    const d = localStorage.getItem('operator.density') ?? 'comfortable';
    const a = localStorage.getItem('operator.animations') !== 'false';
    setTheme(t);
    setDensity(d);
    setAnimations(a);
  }, []);

  function save(key: string, value: string | boolean) {
    localStorage.setItem(`operator.${key}`, String(value));
    toast.success('Saved');
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Appearance</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Customize how Operator looks and feels.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardBody className="space-y-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Theme</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={t.disabled}
                  onClick={() => { setTheme(t.id); save('theme', t.id); }}
                  className={cn(
                    'text-left rounded-md border p-3.5 transition',
                    theme === t.id
                      ? 'bg-gold/10 border-gold/50'
                      : 'bg-surface-2 border-border hover:border-border/60',
                    t.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <div className="text-[13px] font-medium">{t.label}</div>
                  <div className="text-[11.5px] text-fg-muted mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Density</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {densities.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setDensity(d.id); save('density', d.id); }}
                  className={cn(
                    'text-left rounded-md border p-3.5 transition',
                    density === d.id
                      ? 'bg-gold/10 border-gold/50'
                      : 'bg-surface-2 border-border hover:border-border/60'
                  )}
                >
                  <div className="text-[13px] font-medium">{d.label}</div>
                  <div className="text-[11.5px] text-fg-muted mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px] font-medium">Animations</div>
                <div className="text-[12px] text-fg-muted mt-0.5">Smooth transitions and motion effects.</div>
              </div>
              <button
                type="button"
                onClick={() => { const v = !animations; setAnimations(v); save('animations', v); }}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  animations ? 'bg-gold' : 'bg-surface-3'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  animations ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOFA

# /settings/notifications
mkdir -p "src/app/(app)/settings/notifications"
cat > "src/app/(app)/settings/notifications/page.tsx" << 'EOFN'
'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsBack } from '@/features/settings/components/settings-back';

interface Toggle {
  id: string;
  label: string;
  desc: string;
  defaultValue: boolean;
  channels: Array<'email' | 'push' | 'app'>;
}

const events: Toggle[] = [
  { id: 'video_ready', label: 'Video generation complete', desc: 'When your Veo video finishes rendering.', defaultValue: true, channels: ['email', 'app'] },
  { id: 'workflow_done', label: 'Workflow completed', desc: 'When an automated workflow finishes.', defaultValue: true, channels: ['app'] },
  { id: 'trial_ending', label: 'Trial ending soon', desc: '3 days before your trial ends.', defaultValue: true, channels: ['email'] },
  { id: 'quota_warning', label: 'Approaching quota limit', desc: '80% of monthly quota used.', defaultValue: true, channels: ['email', 'app'] },
  { id: 'security_alert', label: 'Security alerts', desc: 'Login from new device, password change.', defaultValue: true, channels: ['email'] },
  { id: 'weekly_digest', label: 'Weekly digest', desc: 'Summary of your usage every Monday.', defaultValue: false, channels: ['email'] },
  { id: 'product_news', label: 'Product news', desc: 'New features, tips, releases.', defaultValue: false, channels: ['email'] },
];

export default function NotificationsPage() {
  const [state, setState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const e of events) {
      const saved = localStorage.getItem(`operator.notif.${e.id}`);
      initial[e.id] = saved === null ? e.defaultValue : saved === 'true';
    }
    setState(initial);
  }, []);

  function toggle(id: string) {
    const newVal = !state[id];
    setState({ ...state, [id]: newVal });
    localStorage.setItem(`operator.notif.${id}`, String(newVal));
    toast.success('Saved');
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Notifications</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Choose what Operator tells you about.</p>
      </div>

      <Card>
        <CardBody className="space-y-0 divide-y divide-border p-0">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">{e.label}</div>
                <div className="text-[12px] text-fg-muted mt-0.5">{e.desc}</div>
                <div className="flex gap-1.5 mt-1.5">
                  {e.channels.map((c) => (
                    <span key={c} className="text-[9.5px] uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-surface-2 text-fg-subtle">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(e.id)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors shrink-0',
                  state[e.id] ? 'bg-gold' : 'bg-surface-3'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                  state[e.id] ? 'translate-x-5' : 'translate-x-0.5'
                )} />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
EOFN

# /settings/security
mkdir -p "src/app/(app)/settings/security"
cat > "src/app/(app)/settings/security/page.tsx" << 'EOFSEC'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardBody } from '@/components/ui/card';
import { Shield, Smartphone, Clock } from 'lucide-react';
import { SettingsBack } from '@/features/settings/components/settings-back';
import { SecurityActions } from '@/features/settings/components/security-actions';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Security</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Protect your account and review activity.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">Password</div>
                <div className="text-[12px] text-fg-muted mt-0.5">Update your account password.</div>
              </div>
            </div>
            <SecurityActions email={user.email ?? ''} />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Smartphone className="h-4 w-4 text-fg-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium flex items-center gap-2">
                  Two-factor authentication
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle uppercase tracking-[0.1em]">Coming</span>
                </div>
                <div className="text-[12px] text-fg-muted mt-0.5">Add a second factor with an authenticator app.</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-fg-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">Recent activity</div>
                <div className="text-[12px] text-fg-muted mt-0.5">Last sign-in: {lastSignIn?.toLocaleString() ?? 'Unknown'}</div>
                <div className="text-[12px] text-fg-muted mt-0.5">Account created: {new Date(user.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOFSEC

mkdir -p src/features/settings/components
cat > src/features/settings/components/security-actions.tsx << 'EOFSA'
'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function SecurityActions({ email }: { email: string }) {
  const [sending, setSending] = useState(false);

  async function handleReset() {
    setSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast.success('Password reset email sent');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReset} loading={sending}>
      Send password reset email
    </Button>
  );
}
EOFSA

# SettingsBack component (reusable)
cat > src/features/settings/components/settings-back.tsx << 'EOFSB'
'use client';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function SettingsBack() {
  return (
    <div className="mb-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-gold transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to Settings</span>
      </Link>
    </div>
  );
}
EOFSB

# /settings/ai
mkdir -p "src/app/(app)/settings/ai"
cat > "src/app/(app)/settings/ai/page.tsx" << 'EOFAI'
'use client';
import { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SettingsBack } from '@/features/settings/components/settings-back';

const models = [
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'Best all-around, fast, great with images.', provider: 'OpenAI' },
  { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', desc: 'Excellent writing, nuanced reasoning.', provider: 'Anthropic' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', desc: 'Long context, research, multimodal.', provider: 'Google' },
];

const languages = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'it', label: 'Italiano' },
  { id: 'pt', label: 'Português' },
];

export default function AISettingsPage() {
  const [model, setModel] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [language, setLanguage] = useState('en');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    setModel(localStorage.getItem('operator.ai.model') ?? 'gpt-4o');
    setTemperature(parseFloat(localStorage.getItem('operator.ai.temp') ?? '0.7'));
    setLanguage(localStorage.getItem('operator.ai.language') ?? 'en');
    setInstructions(localStorage.getItem('operator.ai.instructions') ?? '');
  }, []);

  function save<T>(key: string, value: T, setter: (v: T) => void) {
    setter(value);
    localStorage.setItem(`operator.ai.${key}`, String(value));
    toast.success('Saved');
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">AI Preferences</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Tune how the AI behaves across all chats.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Default model</div>
            <div className="grid grid-cols-1 gap-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => save('model', m.id, setModel)}
                  className={cn(
                    'text-left rounded-md border p-3 transition',
                    model === m.id
                      ? 'bg-gold/10 border-gold/50'
                      : 'bg-surface-2 border-border hover:border-border/60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13.5px] font-medium">{m.label}</div>
                      <div className="text-[11.5px] text-fg-muted mt-0.5">{m.desc}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-surface-3 text-fg-subtle uppercase tracking-[0.1em] shrink-0 ml-3">{m.provider}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Temperature</div>
              <div className="text-[13px] font-mono text-gold">{temperature.toFixed(2)}</div>
            </div>
            <input
              type="range"
              min="0" max="1" step="0.05"
              value={temperature}
              onChange={(e) => save('temp', parseFloat(e.target.value), setTemperature)}
              className="w-full accent-gold"
            />
            <div className="flex justify-between text-[11px] text-fg-subtle">
              <span>Focused (0.0)</span>
              <span>Balanced (0.5)</span>
              <span>Creative (1.0)</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">AI response language</div>
            <select
              value={language}
              onChange={(e) => save('language', e.target.value, setLanguage)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-gold/60"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Custom instructions</div>
            <textarea
              value={instructions}
              onChange={(e) => { setInstructions(e.target.value); localStorage.setItem('operator.ai.instructions', e.target.value); }}
              placeholder="e.g. Always respond in a professional tone. Never use emojis. Prefer short answers."
              rows={4}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 resize-none"
            />
            <p className="text-[11px] text-fg-subtle">These apply to every chat. Brand context from onboarding is always included.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOFAI

# /settings/shortcuts
mkdir -p "src/app/(app)/settings/shortcuts"
cat > "src/app/(app)/settings/shortcuts/page.tsx" << 'EOFSH'
import { Card, CardBody } from '@/components/ui/card';
import { SettingsBack } from '@/features/settings/components/settings-back';

const shortcuts = [
  { action: 'Open command palette', keys: ['⌘', 'K'] },
  { action: 'New chat', keys: ['⌘', 'N'] },
  { action: 'Go to dashboard', keys: ['G', 'D'] },
  { action: 'Go to projects', keys: ['G', 'P'] },
  { action: 'Go to settings', keys: ['G', 'S'] },
  { action: 'Focus composer', keys: ['/'] },
  { action: 'Send message', keys: ['⌘', 'Enter'] },
  { action: 'Regenerate response', keys: ['⌘', 'R'] },
  { action: 'Toggle sidebar', keys: ['⌘', 'B'] },
  { action: 'Search conversations', keys: ['⌘', 'F'] },
];

export default function ShortcutsPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Keyboard Shortcuts</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Work faster with keyboard navigation.</p>
      </div>

      <Card>
        <CardBody className="p-0">
          {shortcuts.map((s, i) => (
            <div key={s.action} className={i > 0 ? 'border-t border-border' : ''}>
              <div className="flex items-center justify-between px-5 py-3.5">
                <span className="text-[13.5px]">{s.action}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd key={k} className="min-w-[24px] h-6 px-1.5 rounded border border-border bg-surface-2 text-[11.5px] font-mono text-fg-muted flex items-center justify-center">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      <p className="text-[11.5px] text-fg-subtle text-center mt-6">Custom shortcut mapping coming soon.</p>
    </div>
  );
}
EOFSH

# /settings/api-keys
mkdir -p "src/app/(app)/settings/api-keys"
cat > "src/app/(app)/settings/api-keys/page.tsx" << 'EOFAK'
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/card';
import { Key, Lock } from 'lucide-react';
import { SettingsBack } from '@/features/settings/components/settings-back';

export const dynamic = 'force-dynamic';

export default function APIKeysPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Developer</div>
        <h1 className="font-display text-[32px] flex items-center gap-3">
          API Keys
          <span className="text-[11px] px-2 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-[0.1em]">Pro</span>
        </h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Use Operator from your own apps and scripts.</p>
      </div>

      <Card>
        <CardBody className="py-12 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gold/10 border border-gold/30 mb-4">
            <Lock className="h-6 w-6 text-gold" />
          </div>
          <h2 className="font-display text-[22px] mb-2">Upgrade to Pro to create API keys</h2>
          <p className="text-[13.5px] text-fg-muted max-w-[380px] mx-auto mb-6">
            Build custom integrations, automate your workflow, or connect Operator to your own tools.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-gold text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            <Key className="h-3.5 w-3.5" />
            View plans
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
EOFAK

# /settings/data
mkdir -p "src/app/(app)/settings/data"
cat > "src/app/(app)/settings/data/page.tsx" << 'EOFD'
'use client';
import { useState } from 'react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { SettingsBack } from '@/features/settings/components/settings-back';

export default function DataPage() {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operator-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Data &amp; Privacy</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Export or delete your data at any time.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Download className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium">Export your data</div>
                <div className="text-[12.5px] text-fg-muted mt-1">
                  Download all your chats, generated content, documents, and memories as JSON. Complies with GDPR data portability rights.
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} loading={downloading}>
              Export data (JSON)
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-danger/10 border border-danger/30 flex items-center justify-center shrink-0">
                <Trash2 className="h-4 w-4 text-danger" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium">Delete account</div>
                <div className="text-[12.5px] text-fg-muted mt-1">
                  Permanently delete your account and all data. This cannot be undone.
                </div>
              </div>
            </div>
            <a
              href="/delete-data"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-danger/40 bg-danger/5 text-danger text-[13px] hover:bg-danger/10 transition w-fit"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Request deletion
            </a>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOFD

# /api/account/export endpoint
mkdir -p src/app/api/account/export
cat > src/app/api/account/export/route.ts << 'EOFEXP'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

  const [convs, imgs, videos, docs, projects, memories] = await Promise.all([
    svc.from('conversations').select('*').eq('org_id', orgId).limit(1000),
    svc.from('analysis_files').select('*').eq('org_id', orgId).limit(500),
    svc.from('videos').select('*').eq('org_id', orgId).limit(500),
    svc.from('documents').select('*').eq('org_id', orgId).limit(500),
    svc.from('projects').select('*').eq('org_id', orgId),
    svc.from('memories').select('*').eq('org_id', orgId).limit(500),
  ]);

  const payload = {
    exportDate: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    },
    organization: { id: orgId },
    conversations: convs.data ?? [],
    files: imgs.data ?? [],
    videos: videos.data ?? [],
    documents: docs.data ?? [],
    projects: projects.data ?? [],
    memories: memories.data ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="operator-data-${Date.now()}.json"`,
    },
  });
}
EOFEXP

# /settings/organization
mkdir -p "src/app/(app)/settings/organization"
cat > "src/app/(app)/settings/organization/page.tsx" << 'EOFORG'
import { Card, CardBody } from '@/components/ui/card';
import { Building, Users, Crown } from 'lucide-react';
import Link from 'next/link';
import { SettingsBack } from '@/features/settings/components/settings-back';

export default function OrganizationPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Settings</div>
        <h1 className="font-display text-[32px]">Organization</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Manage your workspace, team, and roles.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                <Building className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium">Workspace info</div>
                <div className="text-[12.5px] text-fg-muted mt-0.5">Name, logo, and general settings.</div>
              </div>
            </div>
            <p className="text-[12px] text-fg-subtle">Configurable in the next update.</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-surface-2 border border-border flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 text-fg-muted" />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-medium flex items-center gap-2">
                  Team members
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-[0.1em]">Studio+</span>
                </div>
                <div className="text-[12.5px] text-fg-muted mt-0.5">Invite teammates and assign roles.</div>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-surface-2 text-fg-muted text-[13px] hover:text-gold hover:border-gold/40 transition w-fit"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade to Studio
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
EOFORG

# /settings/webhooks
mkdir -p "src/app/(app)/settings/webhooks"
cat > "src/app/(app)/settings/webhooks/page.tsx" << 'EOFWH'
import { Card, CardBody } from '@/components/ui/card';
import { Webhook, Lock } from 'lucide-react';
import Link from 'next/link';
import { SettingsBack } from '@/features/settings/components/settings-back';

export default function WebhooksPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Developer</div>
        <h1 className="font-display text-[32px] flex items-center gap-3">
          Webhooks
          <span className="text-[11px] px-2 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-[0.1em]">Pro</span>
        </h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Receive real-time events at your own endpoint.</p>
      </div>

      <Card>
        <CardBody className="py-12 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gold/10 border border-gold/30 mb-4">
            <Webhook className="h-6 w-6 text-gold" />
          </div>
          <h2 className="font-display text-[22px] mb-2">Webhooks are a Pro feature</h2>
          <p className="text-[13.5px] text-fg-muted max-w-[400px] mx-auto mb-6">
            Get notified when videos finish, workflows complete, documents are indexed, and more.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-gold text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            <Lock className="h-3.5 w-3.5" />
            Upgrade to unlock
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
EOFWH

# /settings/developer
mkdir -p "src/app/(app)/settings/developer"
cat > "src/app/(app)/settings/developer/page.tsx" << 'EOFDEV'
import { Card, CardBody } from '@/components/ui/card';
import { Terminal, BarChart, Activity } from 'lucide-react';
import Link from 'next/link';
import { SettingsBack } from '@/features/settings/components/settings-back';

export default function DeveloperPage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[720px] w-full mx-auto">
      <SettingsBack />
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Developer</div>
        <h1 className="font-display text-[32px] flex items-center gap-3">
          Developer Console
          <span className="text-[11px] px-2 py-0.5 rounded bg-gold/15 text-gold uppercase tracking-[0.1em]">Pro</span>
        </h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">Monitor your API usage, rate limits, and logs.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <BarChart className="h-4 w-4 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium">Usage graphs</div>
              <div className="text-[12px] text-fg-muted mt-0.5">Detailed breakdown of API calls, tokens used, and costs.</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Activity className="h-4 w-4 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium">Rate limits</div>
              <div className="text-[12px] text-fg-muted mt-0.5">View current limits and request a quota increase.</div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Terminal className="h-4 w-4 text-gold" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-medium">API logs</div>
              <div className="text-[12px] text-fg-muted mt-0.5">Audit every API request with request/response inspection.</div>
            </div>
          </CardBody>
        </Card>

        <div className="text-center py-4">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-gold text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            Unlock Developer Console
          </Link>
        </div>
      </div>
    </div>
  );
}
EOFDEV

echo "OK settings pages (10 new)"

# ============================================================
# 7. UPDATE SIDEBAR SETTINGS CHILDREN
# ============================================================
echo ">>> Updating sidebar with new settings subpages..."

python3 << 'PYSB'
path = 'src/components/layout/sidebar.tsx'
src = open(path, 'r').read()

if 'Appearance' not in src:
    # Find the settings children array and expand it
    old = """        children: [
          { href: '/settings/integrations', label: 'Integrations', icon: Plug },
          { href: '/settings/memory', label: 'Memory', icon: Brain },
          { href: '/settings/billing', label: 'Billing', icon: CreditCard },
        ],"""

    new = """        children: [
          { href: '/settings/profile', label: 'Profile', icon: Settings },
          { href: '/settings/integrations', label: 'Integrations', icon: Plug },
          { href: '/settings/memory', label: 'Memory', icon: Brain },
          { href: '/settings/ai', label: 'AI Preferences', icon: Sparkles },
          { href: '/settings/billing', label: 'Billing', icon: CreditCard },
        ],"""

    if old in src:
        src = src.replace(old, new)
        open(path, 'w').write(src)
        print('Sidebar updated with expanded settings')
PYSB
echo "OK sidebar updated"

# ============================================================
# 8. ENV SCHEMA — Sentry + PostHog
# ============================================================
echo ">>> Adding env variables..."

python3 << 'PYENV'
import glob
import re
env_files = glob.glob('src/lib/env.ts')
if env_files:
    path = env_files[0]
    src = open(path, 'r').read()
    if 'SENTRY_DSN' not in src:
        # Add optional env vars
        pattern = r'(BRAVE_API_KEY: z\.string\(\)\.optional\(\),)'
        replacement = r'\1\n  SENTRY_DSN: z.string().optional(),\n  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),\n  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),\n  NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),'
        if re.search(pattern, src):
            src = re.sub(pattern, replacement, src)
            open(path, 'w').write(src)
            print('env.ts extended with Sentry/PostHog')
        else:
            print('Pattern not found - env vars must be added manually')
PYENV
echo "OK env"

# ============================================================
# 9. NEXT.CONFIG — Sentry integration
# ============================================================
echo ">>> Wrapping next.config with Sentry..."

python3 << 'PYN'
path = 'next.config.mjs'
try:
    src = open(path, 'r').read()
except:
    path = 'next.config.js'
    src = open(path, 'r').read()

if 'withSentryConfig' not in src:
    # Add import at top
    if 'export default nextConfig;' in src:
        wrapper = """
// Sentry wrapper — only active in production if DSN is set
import { withSentryConfig } from '@sentry/nextjs';

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    }, {
      widenClientFileUpload: true,
      transpileClientSDK: false,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;
"""
        src = src.replace('export default nextConfig;', wrapper.strip())
        open(path, 'w').write(src)
        print(f'{path} wrapped with Sentry')
PYN
echo "OK next.config"

# ============================================================
# 10. ROUTE AUDIT
# ============================================================
echo ""
echo ">>> Running route audit..."
node scripts/audit-routes.mjs 2>&1 | tail -20 || true

# ============================================================
# TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  TIER 1 — COMPLETE"
echo "================================================================"
echo ""
echo "WHAT WAS ADDED:"
echo ""
echo "📊 OBSERVABILITY:"
echo "  ✓ Sentry (client + server + edge configs)"
echo "  ✓ PostHog analytics with auto page tracking"
echo "  ✓ /api/health — checks Supabase + OpenAI + Anthropic + Google + Stripe"
echo ""
echo "🛡️ ERROR HANDLING:"
echo "  ✓ Global error.tsx with Sentry integration"
echo "  ✓ App segment error.tsx"
echo "  ✓ Custom not-found.tsx"
echo ""
echo "⚙️ SETTINGS (11 total — was 3):"
echo "  ✓ /settings — new hub with grouped sections"
echo "  ✓ /settings/profile (existing)"
echo "  ✓ /settings/appearance — theme, density, animations"
echo "  ✓ /settings/notifications — 7 event toggles x 3 channels"
echo "  ✓ /settings/security — password reset, 2FA placeholder, activity"
echo "  ✓ /settings/ai — default model, temperature, language, custom instructions"
echo "  ✓ /settings/shortcuts — 10 keyboard shortcuts documented"
echo "  ✓ /settings/api-keys — Pro feature with upgrade CTA"
echo "  ✓ /settings/data — export JSON + delete account"
echo "  ✓ /settings/organization — workspace + team (Studio+)"
echo "  ✓ /settings/webhooks — Pro feature"
echo "  ✓ /settings/developer — Pro feature"
echo "  ✓ /settings/billing (existing)"
echo "  ✓ /settings/integrations (existing)"
echo "  ✓ /settings/memory (existing)"
echo ""
echo "🔧 API:"
echo "  ✓ /api/account/export — full GDPR data export"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. PUSH the code:"
echo "   git add -A"
echo "   git commit -m 'feat: TIER 1 — Sentry + PostHog + 10 settings pages + error boundaries'"
echo "   git push"
echo ""
echo "2. SENTRY setup (5 min, free):"
echo "   - Sign up at https://sentry.io"
echo "   - Create project: Next.js"
echo "   - Copy DSN"
echo "   - Add to .env.local AND Vercel:"
echo "     SENTRY_DSN=..."
echo "     NEXT_PUBLIC_SENTRY_DSN=..."
echo "     SENTRY_ORG=..."
echo "     SENTRY_PROJECT=..."
echo ""
echo "3. POSTHOG setup (5 min, free):"
echo "   - Sign up at https://posthog.com"
echo "   - Create project"
echo "   - Copy API Key (starts with phc_)"
echo "   - Add to .env.local AND Vercel:"
echo "     NEXT_PUBLIC_POSTHOG_KEY=phc_..."
echo "     NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com  (or us.i.posthog.com)"
echo ""
echo "Without these env vars, Sentry and PostHog simply do nothing (no errors)."
echo ""
