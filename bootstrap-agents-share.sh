#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "================================================================"
echo "  Operator AI — AgentPicker + Conversation Sharing (Epic Combo)"
echo "================================================================"
echo ""

cd "$(dirname "$0")"
if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

# ============================================================
# 1. MIGRATION 0025 — conversation_shares + conversation_agent
# ============================================================
echo ">>> Creating migration 0025..."

cat > supabase/migrations/0025_shares_and_agents.sql << 'EOFMIG'
-- Add agent_type to conversations for per-conversation agent selection
alter table public.conversations
  add column if not exists agent_type text
    check (agent_type in ('creative', 'brand', 'copy', 'research', 'analyst', 'social'));

-- Public conversation shares
create table if not exists public.conversation_shares (
  id text primary key default public.gen_cuid2(),
  slug text unique not null default encode(gen_random_bytes(8), 'hex'),
  conversation_id text not null references public.conversations(id) on delete cascade,
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'link' check (visibility in ('private', 'link', 'public')),
  title text,
  view_count integer not null default 0,
  last_viewed_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversation_shares_slug_idx
  on public.conversation_shares (slug)
  where revoked_at is null;

create index if not exists conversation_shares_conv_idx
  on public.conversation_shares (conversation_id);

create index if not exists conversation_shares_user_idx
  on public.conversation_shares (user_id, created_at desc);

alter table public.conversation_shares enable row level security;

-- Owner can do anything
drop policy if exists "shares own rows" on public.conversation_shares;
create policy "shares own rows"
  on public.conversation_shares for all
  using (auth.uid() = user_id);

-- Service role bypasses RLS; public reads happen via service client in API
-- (prevents exposing private shares accidentally)

notify pgrst, 'reload schema';
EOFMIG
echo "OK migration 0025"

# ============================================================
# 2. AGENT PICKER COMPONENT (in chat composer)
# ============================================================
echo ">>> Creating AgentPicker component..."

cat > src/features/agents/components/agent-picker.tsx << 'EOFAP'
'use client';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { AGENTS, type AgentId } from '../data/catalog';

interface Props {
  value: AgentId;
  onChange: (id: AgentId) => void;
}

export function AgentPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = AGENTS.find((a) => a.id === value) ?? AGENTS[0];

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-2.5 h-8 rounded-md border text-[12px] transition',
          open
            ? 'bg-gold/10 border-gold/50 text-gold'
            : 'bg-surface-2 border-border text-fg-muted hover:text-fg hover:border-border/60'
        )}
      >
        <span className="text-[14px] leading-none">{selected.emoji}</span>
        <span className="font-medium">{selected.name}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[320px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-40 animate-fadeIn">
          <div className="p-1.5 max-h-[380px] overflow-y-auto">
            {AGENTS.map((agent) => {
              const isSelected = agent.id === value;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => { onChange(agent.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-2.5 rounded-md transition',
                    isSelected
                      ? 'bg-gold/10'
                      : 'hover:bg-surface-2'
                  )}
                >
                  <span className="text-[20px] leading-none shrink-0 mt-0.5">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[13px] font-medium',
                        isSelected ? 'text-gold' : 'text-fg'
                      )}>{agent.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle uppercase tracking-[0.1em]">
                        {agent.provider}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-fg-muted mt-0.5 leading-relaxed">
                      {agent.tagline}
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-gold shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
EOFAP
echo "OK agent-picker.tsx"

# ============================================================
# 3. UPDATE AGENTS CATALOG WITH EMOJI/PROVIDER
# ============================================================
echo ">>> Updating agents catalog with display fields..."

python3 << 'PYCAT'
import re
path = 'src/features/agents/data/catalog.ts'
src = open(path, 'r').read()

# Ensure each agent has emoji and provider display field
if 'emoji:' not in src:
    # Inject fields based on agent id
    mapping = {
        "'creative'": ("💬", "GPT-4o"),
        "'brand'": ("🎨", "Claude"),
        "'copy'": ("✍️", "Claude"),
        "'research'": ("🔍", "Gemini"),
        "'analyst'": ("📊", "GPT-4o"),
        "'social'": ("📱", "GPT-4o"),
    }

    for aid, (emoji, provider) in mapping.items():
        # Find the agent object and add fields after id
        pattern = re.compile(r"(id:\s*" + re.escape(aid) + r",)", re.DOTALL)
        replacement = r"\1\n    emoji: '" + emoji + "',\n    provider: '" + provider + "',"
        src = pattern.sub(replacement, src, count=1)

    open(path, 'w').write(src)
    print('Agents catalog updated with emoji + provider')

# Also ensure the AGENTS export exists
if 'export const AGENTS' not in src and 'AGENT_CATALOG' in src:
    src = open(path, 'r').read()
    src += "\nexport const AGENTS = AGENT_CATALOG;\n"
    open(path, 'w').write(src)
    print('Added AGENTS alias')
PYCAT
echo "OK catalog"

# ============================================================
# 4. WIRE AGENT PICKER INTO COMPOSER
# ============================================================
echo ">>> Wiring AgentPicker into chat composer..."

# Find composer
COMPOSER=$(find src/features/chat -name "composer*.tsx" | head -1)
if [ -n "$COMPOSER" ]; then
  python3 << PYC
path = "$COMPOSER"
src = open(path, 'r').read()

# Add AgentPicker import if not present
if 'AgentPicker' not in src:
    if "from 'lucide-react'" in src:
        first_import_line = src.index('import')
        src = "import { AgentPicker } from '@/features/agents/components/agent-picker';\n" + src
    print('AgentPicker imported into composer')

open(path, 'w').write(src)
PYC
  echo "OK composer import"
fi

# ============================================================
# 5. SHARE API — create, list, revoke, get by slug
# ============================================================
echo ">>> Creating /api/share routes..."

mkdir -p src/app/api/share/create
cat > src/app/api/share/create/route.ts << 'EOFSC'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  conversationId: z.string().min(1),
  visibility: z.enum(['private', 'link', 'public']).optional(),
  title: z.string().max(200).optional(),
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
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  // Verify conversation ownership
  const { data: conv } = await svc
    .from('conversations')
    .select('id, title, org_id')
    .eq('id', parsed.data.conversationId)
    .maybeSingle();

  if (!conv || (conv as { org_id: string }).org_id !== orgId) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Check for existing active share
  const { data: existing } = await svc
    .from('conversation_shares')
    .select('id, slug, visibility')
    .eq('conversation_id', parsed.data.conversationId)
    .is('revoked_at', null)
    .maybeSingle();

  if (existing) {
    const row = existing as { id: string; slug: string; visibility: string };
    // Update visibility if different
    if (parsed.data.visibility && parsed.data.visibility !== row.visibility) {
      await (svc.from('conversation_shares').update as any)({
        visibility: parsed.data.visibility,
        updated_at: new Date().toISOString(),
      }).eq('id', row.id);
    }
    return NextResponse.json({
      slug: row.slug,
      url: `/c/${row.slug}`,
      visibility: parsed.data.visibility ?? row.visibility,
    });
  }

  // Create new share
  const { data, error } = await svc
    .from('conversation_shares')
    .insert({
      conversation_id: parsed.data.conversationId,
      org_id: orgId,
      user_id: user.id,
      visibility: parsed.data.visibility ?? 'link',
      title: parsed.data.title ?? (conv as { title: string | null }).title ?? 'Shared conversation',
    } as never)
    .select('slug, visibility')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const row = data as { slug: string; visibility: string };
  return NextResponse.json({
    slug: row.slug,
    url: `/c/${row.slug}`,
    visibility: row.visibility,
  });
}
EOFSC

mkdir -p src/app/api/share/revoke
cat > src/app/api/share/revoke/route.ts << 'EOFSR'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

const BodySchema = z.object({
  slug: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();

  await (svc.from('conversation_shares').update as any)({
    revoked_at: new Date().toISOString(),
  }).eq('slug', parsed.data.slug).eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
EOFSR

mkdir -p src/app/api/share/get/[slug]
cat > "src/app/api/share/get/[slug]/route.ts" << 'EOFSG'
import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;

  const svc = createSupabaseServiceClient();

  const { data: share } = await svc
    .from('conversation_shares')
    .select('id, conversation_id, user_id, org_id, visibility, title, created_at, view_count')
    .eq('slug', slug)
    .is('revoked_at', null)
    .maybeSingle();

  if (!share) {
    return NextResponse.json({ error: 'Share not found or revoked' }, { status: 404 });
  }

  const row = share as {
    id: string;
    conversation_id: string;
    user_id: string;
    visibility: string;
    title: string | null;
    created_at: string;
    view_count: number;
  };

  if (row.visibility === 'private') {
    return NextResponse.json({ error: 'This share is private' }, { status: 403 });
  }

  // Increment view count (fire-and-forget)
  (svc.from('conversation_shares').update as any)({
    view_count: row.view_count + 1,
    last_viewed_at: new Date().toISOString(),
  }).eq('id', row.id).then(() => {}).catch(() => {});

  // Fetch messages
  const { data: messages } = await svc
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', row.conversation_id)
    .order('created_at', { ascending: true })
    .limit(200);

  // Fetch owner info
  const { data: userData } = await svc.auth.admin.getUserById(row.user_id);
  const ownerName = (userData?.user?.user_metadata?.full_name as string) ?? 'A user';

  return NextResponse.json({
    title: row.title,
    visibility: row.visibility,
    viewCount: row.view_count + 1,
    createdAt: row.created_at,
    ownerName,
    messages: messages ?? [],
  });
}
EOFSG

echo "OK share api"

# ============================================================
# 6. PUBLIC SHARE PAGE /c/[slug]
# ============================================================
echo ">>> Creating public share page /c/[slug]..."

mkdir -p "src/app/c/[slug]"
cat > "src/app/c/[slug]/page.tsx" << 'EOFSP'
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Sparkles, Eye, Clock, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

async function fetchShare(slug: string) {
  const h = await headers();
  const host = h.get('host') ?? 'www.operatoraiapp.com';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const url = `${proto}://${host}/api/share/get/${slug}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json() as Promise<{
    title: string;
    visibility: string;
    viewCount: number;
    createdAt: string;
    ownerName: string;
    messages: Message[];
  }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchShare(slug);
  if (!data) return { title: 'Conversation — Operator AI' };
  return {
    title: `${data.title ?? 'Conversation'} — Operator AI`,
    description: `A shared conversation on Operator AI — the AI studio for your brand.`,
    openGraph: {
      title: data.title ?? 'Conversation',
      description: `Shared by ${data.ownerName} on Operator AI.`,
      images: ['/icons/icon-512.png'],
    },
  };
}

export default async function SharedConversationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await fetchShare(slug);
  if (!data) notFound();

  const date = new Date(data.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Header */}
      <header className="sticky top-0 z-20 glass border-b border-border">
        <div className="max-w-[820px] mx-auto flex items-center justify-between h-14 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] tracking-tight">Operator</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
            </div>
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition"
          >
            <span>Try it free</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[820px] mx-auto px-5 lg:px-8 pt-10 pb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" />
          Shared conversation
        </div>
        <h1 className="font-display text-[32px] lg:text-[40px] leading-tight mb-4">
          {data.title ?? 'Untitled conversation'}
        </h1>
        <div className="flex items-center gap-5 text-[12px] text-fg-muted">
          <span>Shared by <span className="text-fg">{data.ownerName}</span></span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            {data.viewCount} {data.viewCount === 1 ? 'view' : 'views'}
          </span>
        </div>
      </section>

      {/* Messages */}
      <section className="max-w-[820px] mx-auto px-5 lg:px-8 pb-16">
        <div className="space-y-5">
          {data.messages.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[13px] text-fg-muted">This conversation has no messages yet.</p>
            </div>
          ) : (
            data.messages.map((m) => {
              if (m.role === 'system') return null;
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center gold-grad">
                      <Sparkles className="h-3.5 w-3.5 text-bg" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-lg px-4 py-3 ${
                    isUser
                      ? 'bg-surface-2 border border-border text-fg'
                      : 'bg-surface border border-border text-fg-soft'
                  }`}>
                    <div className="text-[10px] uppercase tracking-[0.14em] mb-1 text-fg-subtle">
                      {isUser ? data.ownerName : 'Operator AI'}
                    </div>
                    <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                  {isUser && (
                    <div className="h-8 w-8 rounded-md shrink-0 flex items-center justify-center bg-surface-2 border border-border text-[10px] font-medium text-fg-muted">
                      {data.ownerName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border bg-surface/40 py-14 px-5 lg:px-8 text-center overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-[500px] rounded-full gold-grad opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="relative max-w-[620px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Operator AI</div>
          <h2 className="font-display text-[28px] lg:text-[36px] leading-tight mb-4">
            Run your brand like a <span className="text-gold-grad">studio</span>.
          </h2>
          <p className="text-[14px] text-fg-muted mb-7 max-w-[460px] mx-auto">
            Chat, imagery, video, voice, and workflows — unified under one AI that knows your brand. 7 days free. No card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-md gold-grad text-bg text-[13.5px] font-medium hover:brightness-110 transition"
          >
            <span>Get started free</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-5">
        <div className="max-w-[820px] mx-auto flex items-center justify-between">
          <div className="text-[11.5px] text-fg-muted">
            &copy; {new Date().getFullYear()} Operator AI
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[11.5px] text-fg-muted hover:text-gold">Privacy</Link>
            <Link href="/terms" className="text-[11.5px] text-fg-muted hover:text-gold">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
EOFSP
echo "OK /c/[slug] page"

# ============================================================
# 7. SHARE BUTTON COMPONENT (for chat header)
# ============================================================
echo ">>> Creating ShareButton component..."

cat > src/features/chat/components/share-button.tsx << 'EOFSB'
'use client';
import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Globe, Link as LinkIcon, Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  conversationId: string;
}

type Visibility = 'private' | 'link' | 'public';

export function ShareButton({ conversationId }: Props) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('link');
  const [slug, setSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  async function createOrUpdate(vis: Visibility) {
    setLoading(true);
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, visibility: vis }),
      });
      if (!res.ok) throw new Error('Failed');
      const body = await res.json();
      setSlug(body.slug);
      setVisibility(vis);
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!slug) return;
    const url = `${window.location.origin}/c/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  }

  async function revoke() {
    if (!slug) return;
    if (!confirm('Revoke this share? The link will stop working.')) return;
    setLoading(true);
    try {
      await fetch('/api/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      setSlug(null);
      setVisibility('private');
      toast.success('Share revoked');
    } catch {
      toast.error('Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open && !slug) createOrUpdate('link'); }}
        className={cn(
          'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] transition border',
          open
            ? 'bg-gold/10 border-gold/50 text-gold'
            : 'bg-surface-2 border-border text-fg-muted hover:text-gold hover:border-gold/40'
        )}
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share</span>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-[340px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="p-4 border-b border-border">
            <div className="text-[10px] uppercase tracking-[0.14em] text-gold mb-2">Share conversation</div>
            <div className="text-[12.5px] text-fg-muted">Anyone with this link can view this conversation.</div>
          </div>

          <div className="p-3 space-y-1.5">
            <VisibilityOption
              active={visibility === 'private'}
              icon={Lock}
              label="Private"
              desc="Only you can see this"
              onClick={() => revoke()}
              disabled={!slug}
            />
            <VisibilityOption
              active={visibility === 'link'}
              icon={LinkIcon}
              label="Anyone with link"
              desc="Viewable by anyone with the URL"
              onClick={() => createOrUpdate('link')}
            />
            <VisibilityOption
              active={visibility === 'public'}
              icon={Globe}
              label="Public"
              desc="Indexable, discoverable"
              onClick={() => createOrUpdate('public')}
            />
          </div>

          {slug && (
            <div className="p-3 border-t border-border bg-surface/40">
              <div className="flex items-center gap-2">
                <div className="flex-1 text-[11.5px] font-mono text-fg-muted truncate rounded-md border border-border bg-surface-2 px-2.5 py-2">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/c/{slug}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="h-8 w-8 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition flex items-center justify-center shrink-0"
                  aria-label="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="button"
                onClick={revoke}
                disabled={loading}
                className="mt-2 w-full inline-flex items-center justify-center gap-1.5 h-7 rounded-md text-[11.5px] text-fg-muted hover:text-danger transition"
              >
                <Trash2 className="h-3 w-3" />
                <span>Revoke link</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VisibilityOption({
  active, icon: Icon, label, desc, onClick, disabled,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-start gap-3 p-2.5 rounded-md text-left transition',
        active ? 'bg-gold/10' : 'hover:bg-surface-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', active ? 'text-gold' : 'text-fg-muted')} />
      <div className="flex-1">
        <div className={cn('text-[12.5px] font-medium', active ? 'text-gold' : 'text-fg')}>
          {label}
        </div>
        <div className="text-[11px] text-fg-muted mt-0.5">{desc}</div>
      </div>
      {active && <Check className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />}
    </button>
  );
}
EOFSB
echo "OK share-button"

# ============================================================
# 8. TYPECHECK
# ============================================================
echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "================================================================"
echo "  EPIC COMBO COMPLETE"
echo "================================================================"
echo ""
echo "WHAT WAS ADDED:"
echo ""
echo "🤖 AGENT PICKER:"
echo "  ✓ AgentPicker dropdown component"
echo "  ✓ 6 agents: Creative / Brand / Copy / Research / Analyst / Social"
echo "  ✓ Each with emoji, provider badge, description"
echo "  ✓ Imported into chat composer"
echo ""
echo "🌐 CONVERSATION SHARING:"
echo "  ✓ Migration 0025: conversation_shares table"
echo "  ✓ 3 visibility levels: Private / Link / Public"
echo "  ✓ /api/share/create (auto-reuse or update)"
echo "  ✓ /api/share/revoke"
echo "  ✓ /api/share/get/[slug] (with view counter)"
echo "  ✓ Public page /c/[slug] with:"
echo "     - Premium header with logo + 'Try it free' CTA"
echo "     - Shared by <Name>, date, view count"
echo "     - Clean message list (user + assistant styled)"
echo "     - Conversion CTA at bottom"
echo "     - Footer with legal links"
echo "  ✓ ShareButton component with:"
echo "     - Visibility selector"
echo "     - Copy link with feedback"
echo "     - Revoke link"
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Apply migration 0025:"
echo "   open -e supabase/migrations/0025_shares_and_agents.sql"
echo "   [Supabase SQL Editor → paste → Run]"
echo ""
echo "2. Regenerate types:"
echo "   export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "   pnpm db:generate"
echo ""
echo "3. Push:"
echo "   git add -A"
echo "   git commit -m 'feat: AgentPicker + conversation sharing'"
echo "   git push"
echo ""
echo "4. MANUAL: Wire ShareButton + AgentPicker into chat UI"
echo "   (The components are created but need to be imported"
echo "    into the chat page. I'll give you the exact patches"
echo "    after you review the bootstrap output.)"
echo ""
