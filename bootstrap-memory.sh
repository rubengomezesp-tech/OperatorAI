#!/usr/bin/env bash
set -euo pipefail

echo ">>> Operator AI - Memory + Style Learning addon"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Creating directories..."
mkdir -p src/features/memory/server
mkdir -p src/features/memory/components
mkdir -p src/features/memory/data
mkdir -p src/app/api/memory/list
mkdir -p src/app/api/memory/create
mkdir -p src/app/api/memory/update
mkdir -p src/app/api/memory/delete
mkdir -p src/app/api/memory/learn-style
mkdir -p "src/app/(app)/settings/memory"

echo ">>> Writing migration 0019..."

cat > supabase/migrations/0019_memory.sql << 'EOFMIG'
-- Memory table: facts about user/org that persist across conversations
create table if not exists public.memories (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text default 'general',
  importance integer not null default 3,
  source text default 'explicit',
  source_conversation_id text references public.conversations(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memories_org_user_idx
  on public.memories (org_id, user_id)
  where is_active = true;

create index if not exists memories_importance_idx
  on public.memories (org_id, importance desc, created_at desc)
  where is_active = true;

alter table public.memories enable row level security;

drop policy if exists "memories by owner" on public.memories;
create policy "memories by owner"
  on public.memories for all
  using (user_id = auth.uid() and public.is_org_member(org_id));

-- Voice fingerprint: learned style from conversations
create table if not exists public.voice_fingerprints (
  id text primary key default public.gen_cuid2(),
  org_id text not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tone_summary text,
  sentence_length text,
  vocabulary_style text,
  preferred_phrases text[],
  avoided_phrases text[],
  structural_preferences text,
  example_messages jsonb default '[]'::jsonb,
  sample_count integer not null default 0,
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists voice_fingerprints_user_unique
  on public.voice_fingerprints (org_id, user_id);

alter table public.voice_fingerprints enable row level security;

drop policy if exists "fingerprints by owner" on public.voice_fingerprints;
create policy "fingerprints by owner"
  on public.voice_fingerprints for all
  using (user_id = auth.uid() and public.is_org_member(org_id));

notify pgrst, 'reload schema';
EOFMIG
echo "OK migration 0019"

echo ">>> Writing memory extraction service..."

cat > src/features/memory/server/extract-memory.ts << 'EOFEXTRACT'
import 'server-only';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';

const EXPLICIT_TRIGGERS = [
  /\brecuerda\b/i,
  /\bguárdalo\b/i,
  /\bguardalo\b/i,
  /\bmemoriza\b/i,
  /\bno olvides\b/i,
  /\btoma nota\b/i,
  /\banota\b/i,
  /\bremember\b/i,
  /\bsave this\b/i,
  /\bmemorize\b/i,
  /\bnote that\b/i,
  /\bkeep in mind\b/i,
];

export function isExplicitMemoryRequest(text: string): boolean {
  return EXPLICIT_TRIGGERS.some((r) => r.test(text));
}

export interface ExtractedMemory {
  content: string;
  category: 'preference' | 'fact' | 'goal' | 'context' | 'general';
  importance: 1 | 2 | 3 | 4 | 5;
}

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Extracts a clean, durable memory from a user message.
 * Used for both explicit ("remember X") and auto mode.
 */
export async function extractMemoryFromTurn(params: {
  userMessage: string;
  assistantReply?: string;
  mode: 'explicit' | 'auto';
}): Promise<ExtractedMemory[]> {
  const openai = getClient();

  const systemExplicit = [
    'The user has explicitly asked the assistant to remember something.',
    'Extract 1-3 durable, atomic facts/preferences/goals that would be useful to recall in future conversations.',
    'Each memory must be:',
    '- Self-contained (understandable without context)',
    '- First-person from the user perspective (e.g., "I prefer X", "My company is Y")',
    '- NOT ephemeral (not "today I feel tired" — only lasting facts)',
    '- Concise (max 200 chars each)',
    'Return strict JSON: {"memories": [{"content": "...", "category": "preference|fact|goal|context|general", "importance": 1-5}]}',
    'If nothing is worth remembering, return {"memories": []}',
  ].join('\n');

  const systemAuto = [
    'Analyze this conversation turn and extract ONLY genuinely durable facts the assistant should remember for future conversations.',
    'Be VERY conservative: extract nothing unless the user revealed a lasting preference, goal, personal fact, or brand detail.',
    'IGNORE: pleasantries, temporary questions, one-off requests, small talk.',
    'ONLY extract if content is useful months from now.',
    'Each memory must be:',
    '- Self-contained',
    '- First-person from the user perspective',
    '- Concise (max 200 chars)',
    '- Truly durable',
    'Return strict JSON: {"memories": [{"content": "...", "category": "preference|fact|goal|context|general", "importance": 1-5}]}',
    'Return {"memories": []} if nothing qualifies.',
  ].join('\n');

  const system = params.mode === 'explicit' ? systemExplicit : systemAuto;

  const userContent = params.assistantReply
    ? 'User: ' + params.userMessage + '\n\nAssistant reply: ' + params.assistantReply
    : 'User: ' + params.userMessage;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = res.choices[0]?.message?.content ?? '{"memories": []}';
    const parsed = JSON.parse(raw) as { memories?: Array<{ content?: string; category?: string; importance?: number }> };
    const items = parsed.memories ?? [];

    return items
      .filter((m) => m.content && m.content.trim().length > 5 && m.content.length < 220)
      .map((m) => ({
        content: m.content!.trim(),
        category: (['preference','fact','goal','context','general'].includes(m.category ?? '')
          ? m.category
          : 'general') as ExtractedMemory['category'],
        importance: Math.max(1, Math.min(5, Math.round(m.importance ?? 3))) as ExtractedMemory['importance'],
      }));
  } catch (e) {
    console.error('[memory.extract] failed:', e);
    return [];
  }
}
EOFEXTRACT
echo "OK extract-memory.ts"

echo ">>> Writing voice fingerprint learner..."

cat > src/features/memory/server/learn-voice.ts << 'EOFVOICE'
import 'server-only';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serverEnv } from '@/lib/env';

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

export interface VoiceFingerprint {
  tone_summary: string;
  sentence_length: string;
  vocabulary_style: string;
  preferred_phrases: string[];
  avoided_phrases: string[];
  structural_preferences: string;
}

export async function learnVoiceFromUser(params: {
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  minSamples?: number;
}): Promise<{ fingerprint: VoiceFingerprint | null; sampleCount: number }> {
  const minSamples = params.minSamples ?? 10;

  // Collect last 50 user messages
  const { data: rows } = await params.svc
    .from('messages')
    .select('content, created_at')
    .eq('user_id', params.userId)
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(50);

  type Row = { content: string; created_at: string };
  const samples = (rows as Row[] | null ?? [])
    .map((r) => (r.content ?? '').trim())
    .filter((c) => c.length > 15 && c.length < 2000);

  if (samples.length < minSamples) {
    return { fingerprint: null, sampleCount: samples.length };
  }

  const openai = getClient();

  const system = [
    'You analyze user-written messages and produce a style fingerprint of the author.',
    'Be specific, not generic. Focus on what is distinctive about this user\'s voice.',
    'Detect the dominant language the user writes in (Spanish, English, etc.) and reflect it in your analysis.',
    'Return JSON exactly matching this schema:',
    '{',
    '  "tone_summary": "2-3 sentence description of overall tone and register",',
    '  "sentence_length": "short | medium | long | mixed",',
    '  "vocabulary_style": "formal | casual | technical | poetic | direct | mixed (with brief explanation)",',
    '  "preferred_phrases": ["array of 3-8 distinctive phrases/words the user uses often"],',
    '  "avoided_phrases": ["array of 2-4 phrases the user seems to avoid or notably never uses"],',
    '  "structural_preferences": "how they tend to structure messages (short paragraphs, bullets, emojis, etc.)"',
    '}',
  ].join('\n');

  const userPayload = samples.slice(0, 30).map((s, i) => '[' + (i + 1) + '] ' + s).join('\n\n');

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPayload },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const raw = res.choices[0]?.message?.content ?? '{}';
    const fp = JSON.parse(raw) as Partial<VoiceFingerprint>;

    const normalized: VoiceFingerprint = {
      tone_summary: fp.tone_summary ?? '',
      sentence_length: fp.sentence_length ?? 'medium',
      vocabulary_style: fp.vocabulary_style ?? 'mixed',
      preferred_phrases: Array.isArray(fp.preferred_phrases) ? fp.preferred_phrases.slice(0, 12) : [],
      avoided_phrases: Array.isArray(fp.avoided_phrases) ? fp.avoided_phrases.slice(0, 6) : [],
      structural_preferences: fp.structural_preferences ?? '',
    };

    return { fingerprint: normalized, sampleCount: samples.length };
  } catch (e) {
    console.error('[voice.learn] failed:', e);
    return { fingerprint: null, sampleCount: samples.length };
  }
}

export function fingerprintToPromptSnippet(fp: {
  tone_summary: string | null;
  sentence_length: string | null;
  vocabulary_style: string | null;
  preferred_phrases: string[] | null;
  avoided_phrases: string[] | null;
  structural_preferences: string | null;
}): string {
  const lines: string[] = [];
  lines.push('The user you are talking to has a specific voice. Match it naturally in your own writing:');
  if (fp.tone_summary) lines.push('- Tone: ' + fp.tone_summary);
  if (fp.sentence_length) lines.push('- Sentence length: ' + fp.sentence_length);
  if (fp.vocabulary_style) lines.push('- Vocabulary: ' + fp.vocabulary_style);
  if (fp.structural_preferences) lines.push('- Structure: ' + fp.structural_preferences);
  if (fp.preferred_phrases && fp.preferred_phrases.length) {
    lines.push('- Phrases the user likes: ' + fp.preferred_phrases.join(', '));
  }
  if (fp.avoided_phrases && fp.avoided_phrases.length) {
    lines.push('- Phrases to avoid: ' + fp.avoided_phrases.join(', '));
  }
  lines.push("Do not imitate robotically. Align with their register and cadence while staying yourself.");
  return lines.join('\n');
}
EOFVOICE
echo "OK learn-voice.ts"

echo ">>> Writing memory query helpers..."

cat > src/features/memory/server/queries.ts << 'EOFQ'
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface MemoryRow {
  id: string;
  content: string;
  category: string;
  importance: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function listActiveMemories(svc: SupabaseClient, orgId: string, userId: string, limit = 50): Promise<MemoryRow[]> {
  const { data } = await svc
    .from('memories')
    .select('id, content, category, importance, source, created_at, updated_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('importance', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data as MemoryRow[] | null) ?? [];
}

export async function getRelevantMemories(svc: SupabaseClient, orgId: string, userId: string): Promise<MemoryRow[]> {
  // For v1, return top 20 by importance (same as list). Can be upgraded with embeddings later.
  return listActiveMemories(svc, orgId, userId, 20);
}

export function formatMemoriesBlock(memories: MemoryRow[]): string {
  if (memories.length === 0) return '';
  const lines: string[] = [
    '# What you know about this user (from prior conversations)',
    'Treat these as persistent context. Use them naturally when relevant.',
    'Do NOT list them back unless asked. Do NOT fabricate.',
    '',
  ];
  memories.forEach((m, i) => {
    lines.push('- [' + m.category + '] ' + m.content);
  });
  return lines.join('\n');
}
EOFQ
echo "OK memory/server/queries.ts"

echo ">>> Writing API routes..."

cat > src/app/api/memory/list/route.ts << 'EOFAPI1'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { listActiveMemories } from '@/features/memory/server/queries';

export const runtime = 'nodejs';

export async function GET() {
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

  const memories = await listActiveMemories(svc, orgId, user.id, 200);
  return NextResponse.json({ memories });
}
EOFAPI1
echo "OK memory/list"

cat > src/app/api/memory/create/route.ts << 'EOFAPI2'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  content: z.string().min(3).max(500),
  category: z.enum(['preference', 'fact', 'goal', 'context', 'general']).default('general'),
  importance: z.number().int().min(1).max(5).default(3),
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

  const { data, error } = await svc
    .from('memories')
    .insert({
      org_id: orgId,
      user_id: user.id,
      content: parsed.data.content,
      category: parsed.data.category,
      importance: parsed.data.importance,
      source: 'manual',
    } as never)
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: (data as { id: string }).id });
}
EOFAPI2
echo "OK memory/create"

cat > src/app/api/memory/update/route.ts << 'EOFAPI3'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  id: z.string().min(1),
  content: z.string().min(3).max(500).optional(),
  category: z.enum(['preference','fact','goal','context','general']).optional(),
  importance: z.number().int().min(1).max(5).optional(),
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

  const { id, ...patch } = parsed.data;
  const updatePatch: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() };
  const { error } = await svc
    .from('memories')
    .update(updatePatch as never)
    .eq('id', id)
    .eq('org_id', orgId)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
EOFAPI3
echo "OK memory/update"

cat > src/app/api/memory/delete/route.ts << 'EOFAPI4'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({ id: z.string().min(1) });

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

  await svc
    .from('memories')
    .update({ is_active: false } as never)
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .eq('user_id', user.id);
  return NextResponse.json({ ok: true });
}
EOFAPI4
echo "OK memory/delete"

cat > src/app/api/memory/learn-style/route.ts << 'EOFAPI5'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { learnVoiceFromUser } from '@/features/memory/server/learn-voice';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

  const { fingerprint, sampleCount } = await learnVoiceFromUser({ svc, orgId, userId: user.id });
  if (!fingerprint) {
    return NextResponse.json({
      ok: false,
      reason: 'not_enough_samples',
      sampleCount,
      needed: 10,
    });
  }

  await svc
    .from('voice_fingerprints')
    .upsert({
      org_id: orgId,
      user_id: user.id,
      tone_summary: fingerprint.tone_summary,
      sentence_length: fingerprint.sentence_length,
      vocabulary_style: fingerprint.vocabulary_style,
      preferred_phrases: fingerprint.preferred_phrases,
      avoided_phrases: fingerprint.avoided_phrases,
      structural_preferences: fingerprint.structural_preferences,
      sample_count: sampleCount,
      last_analyzed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id,user_id' });

  return NextResponse.json({ ok: true, fingerprint, sampleCount });
}

export async function GET() {
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

  const { data } = await svc
    .from('voice_fingerprints')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();
  return NextResponse.json({ fingerprint: data ?? null });
}
EOFAPI5
echo "OK memory/learn-style"

echo ">>> Wiring memory + voice into /api/chat..."

# Backup the existing chat route
cp src/app/api/chat/route.ts src/app/api/chat/route.ts.bak

# We inject memory block + voice fingerprint into the existing chat pipeline
# The approach: after we compute the knowledge block, also compute the memory block
# and prepend a system message containing both the voice fingerprint guidance and the memories.

python3 << 'PYEOF'
import re, io

path = 'src/app/api/chat/route.ts'
src = open(path, 'r').read()

# 1) Add imports at top
if "getRelevantMemories" not in src:
    src = src.replace(
        "import { embedOne } from '@/lib/rag/embeddings';",
        "import { embedOne } from '@/lib/rag/embeddings';\n"
        "import { getRelevantMemories, formatMemoriesBlock } from '@/features/memory/server/queries';\n"
        "import { extractMemoryFromTurn, isExplicitMemoryRequest } from '@/features/memory/server/extract-memory';\n"
        "import { fingerprintToPromptSnippet } from '@/features/memory/server/learn-voice';",
        1
    )

# 2) After the RAG retrieval block (which sets `knowledgeBlock`), fetch memories + voice fingerprint
rag_marker = "knowledgeBlock = formatKnowledgeBlock(retrieved);"
if rag_marker in src and "// === MEMORY + VOICE ===" not in src:
    inject = rag_marker + """
    } catch (e) {
      console.error('[rag] retrieval failed:', e);
    }
  }

  // === MEMORY + VOICE ===
  let memoryBlock = '';
  let voiceSnippet = '';
  try {
    const memories = await getRelevantMemories(svc, orgId, user.id);
    memoryBlock = formatMemoriesBlock(memories);
    const { data: fpRow } = await svc
      .from('voice_fingerprints')
      .select('tone_summary, sentence_length, vocabulary_style, preferred_phrases, avoided_phrases, structural_preferences')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (fpRow) {
      voiceSnippet = fingerprintToPromptSnippet(fpRow as {
        tone_summary: string | null;
        sentence_length: string | null;
        vocabulary_style: string | null;
        preferred_phrases: string[] | null;
        avoided_phrases: string[] | null;
        structural_preferences: string | null;
      });
    }
  } catch (e) {
    console.error('[memory/voice] load failed:', e);
  }
  if (false) {"""
    src = src.replace(rag_marker + """
    } catch (e) {
      console.error('[rag] retrieval failed:', e);
    }
  }""", inject, 1)
    # Balance the dummy `if (false) {` we just opened: close later
    # Actually we don't want that dummy if; let's fix by replacing more carefully below
    src = src.replace("if (false) {", "")

# 3) When building `messages`, include memoryBlock + voiceSnippet
# Replace the assignment "const messages: ChatMessage[] = knowledgeBlock ? ..."
old_messages_assign = """const messages: ChatMessage[] = knowledgeBlock
    ? [{ role: 'system', content: knowledgeBlock }, ...baseMessages]
    : baseMessages;"""

new_messages_assign = """const systemAdditions: ChatMessage[] = [];
  if (voiceSnippet) systemAdditions.push({ role: 'system', content: voiceSnippet });
  if (memoryBlock) systemAdditions.push({ role: 'system', content: memoryBlock });
  if (knowledgeBlock) systemAdditions.push({ role: 'system', content: knowledgeBlock });
  const messages: ChatMessage[] = [...systemAdditions, ...baseMessages];"""

if old_messages_assign in src:
    src = src.replace(old_messages_assign, new_messages_assign, 1)

# 4) After a message completes, fire memory extraction (fire-and-forget)
# We insert after the `await svc.from('messages').update({ ... status: ... })` block
ext_marker = """controller.enqueue(sseEncode('done', { latencyMs, inputTokens, outputTokens, costUsd }));"""
ext_code = """
        // Fire-and-forget memory extraction
        if (!failed && queryText) {
          try {
            const mode: 'explicit' | 'auto' = isExplicitMemoryRequest(queryText) ? 'explicit' : 'auto';
            const extracted = await extractMemoryFromTurn({
              userMessage: queryText,
              assistantReply: fullText,
              mode,
            });
            if (extracted.length > 0) {
              await svc.from('memories').insert(
                extracted.map((m) => ({
                  org_id: orgId,
                  user_id: user.id,
                  content: m.content,
                  category: m.category,
                  importance: m.importance,
                  source: mode,
                  source_conversation_id: conversationId,
                })) as never
              );
              controller.enqueue(sseEncode('memory_saved', { count: extracted.length, memories: extracted.map(m => m.content) }));
            }
          } catch (e) {
            console.error('[memory.extract] failed:', e);
          }
        }

        """
if ext_code.strip() not in src:
    src = src.replace(ext_marker, ext_code + ext_marker, 1)

open(path, 'w').write(src)
print("chat route patched")
PYEOF

echo "OK chat route patched with memory + voice"

echo ">>> Writing /settings/memory page..."

cat > "src/app/(app)/settings/memory/page.tsx" << 'EOFPAGE'
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { listActiveMemories } from '@/features/memory/server/queries';
import { MemoryView } from '@/features/memory/components/memory-view';

export default async function MemoryPage() {
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

  const memories = await listActiveMemories(svc, orgId, user.id, 200);

  const { data: fpRow } = await svc
    .from('voice_fingerprints')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] w-full mx-auto">
      <MemoryView initialMemories={memories} initialFingerprint={fpRow as never} />
    </div>
  );
}
EOFPAGE
echo "OK memory page"

cat > src/features/memory/components/memory-view.tsx << 'EOFV'
'use client';
import { useState } from 'react';
import { Plus, Wand2, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  content: string;
  category: string;
  importance: number;
  source: string;
  created_at: string;
  updated_at: string;
}

interface Fingerprint {
  tone_summary: string | null;
  sentence_length: string | null;
  vocabulary_style: string | null;
  preferred_phrases: string[] | null;
  avoided_phrases: string[] | null;
  structural_preferences: string | null;
  sample_count: number | null;
  last_analyzed_at: string | null;
}

const CATEGORY_OPTIONS: Array<{ id: Memory['category']; label: string }> = [
  { id: 'preference', label: 'Preference' },
  { id: 'fact',       label: 'Fact' },
  { id: 'goal',       label: 'Goal' },
  { id: 'context',    label: 'Context' },
  { id: 'general',    label: 'General' },
];

export function MemoryView({
  initialMemories,
  initialFingerprint,
}: {
  initialMemories: Memory[];
  initialFingerprint: Fingerprint | null;
}) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [fp, setFp] = useState<Fingerprint | null>(initialFingerprint);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [learningStyle, setLearningStyle] = useState(false);

  async function addMemory() {
    if (!newContent.trim()) return;
    try {
      const res = await fetch('/api/memory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim(), category: newCategory }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');

      const now = new Date().toISOString();
      setMemories((prev) => [{
        id: body.id,
        content: newContent.trim(),
        category: newCategory,
        importance: 3,
        source: 'manual',
        created_at: now,
        updated_at: now,
      }, ...prev]);
      setNewContent('');
      setAdding(false);
      toast.success('Memory saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch('/api/memory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setMemories((prev) => prev.map((m) => m.id === id ? { ...m, content: editContent.trim(), updated_at: new Date().toISOString() } : m));
      setEditingId(null);
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory?')) return;
    try {
      await fetch('/api/memory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  async function learnStyle() {
    setLearningStyle(true);
    try {
      const res = await fetch('/api/memory/learn-style', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (!body.ok) {
        toast.error('Need ' + (body.needed ?? 10) + '+ conversations first. You have ' + (body.sampleCount ?? 0) + '.');
        return;
      }
      setFp({
        tone_summary: body.fingerprint.tone_summary,
        sentence_length: body.fingerprint.sentence_length,
        vocabulary_style: body.fingerprint.vocabulary_style,
        preferred_phrases: body.fingerprint.preferred_phrases,
        avoided_phrases: body.fingerprint.avoided_phrases,
        structural_preferences: body.fingerprint.structural_preferences,
        sample_count: body.sampleCount,
        last_analyzed_at: new Date().toISOString(),
      });
      toast.success('Voice learned');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLearningStyle(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Your Operator</div>
        <h1 className="font-display text-[32px]">Memory &amp; voice</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          What your assistant remembers about you, and how it has learned to write like you.
        </p>
      </div>

      {/* Voice fingerprint */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-gold" />
                <h2 className="font-display text-[20px]">Your voice</h2>
              </div>
              <p className="text-[13px] text-fg-muted">
                {fp?.last_analyzed_at
                  ? 'Last analyzed from ' + (fp.sample_count ?? 0) + ' messages.'
                  : 'Not analyzed yet. Send a few messages first, then click Learn my voice.'}
              </p>
            </div>
            <Button size="md" onClick={learnStyle} loading={learningStyle}>
              <Wand2 className="h-4 w-4" />
              <span>{fp?.last_analyzed_at ? 'Re-learn voice' : 'Learn my voice'}</span>
            </Button>
          </div>

          {fp?.last_analyzed_at && (
            <div className="space-y-3 pt-2 border-t border-border">
              {fp.tone_summary && (
                <VoiceLine label="Tone" value={fp.tone_summary} />
              )}
              {fp.vocabulary_style && (
                <VoiceLine label="Vocabulary" value={fp.vocabulary_style} />
              )}
              {fp.sentence_length && (
                <VoiceLine label="Sentence length" value={fp.sentence_length} />
              )}
              {fp.structural_preferences && (
                <VoiceLine label="Structure" value={fp.structural_preferences} />
              )}
              {fp.preferred_phrases && fp.preferred_phrases.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">Preferred phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.preferred_phrases.map((p) => (
                      <span key={p} className="h-6 px-2 rounded bg-gold/10 border border-gold/30 text-[11.5px] text-gold flex items-center">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {fp.avoided_phrases && fp.avoided_phrases.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">Avoided phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.avoided_phrases.map((p) => (
                      <span key={p} className="h-6 px-2 rounded bg-surface-3 border border-border text-[11.5px] text-fg-muted flex items-center line-through">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Memories */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[20px] mb-1">Memories</h2>
              <p className="text-[13px] text-fg-muted">
                {memories.length} active · Saved automatically when meaningful or when you ask.
              </p>
            </div>
            <Button size="md" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              <span>Add memory</span>
            </Button>
          </div>

          {adding && (
            <div className="rounded-md border border-gold/40 bg-gold/5 p-3 space-y-2">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="I prefer concise bullet summaries over paragraphs..."
                rows={2}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id)}
                      className={cn(
                        'h-6 px-2 rounded text-[10.5px] uppercase tracking-[0.1em] border',
                        newCategory === c.id
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewContent(''); }}>Cancel</Button>
                  <Button size="sm" onClick={addMemory}>Save</Button>
                </div>
              </div>
            </div>
          )}

          {memories.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-surface-2/30 py-10 text-center">
              <p className="text-[13px] text-fg-muted">
                No memories yet. Chat a bit and say &quot;remember that...&quot; or add manually.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {memories.map((m) => (
                <div key={m.id} className="group flex items-start gap-3 rounded-md border border-border bg-surface px-3.5 py-2.5">
                  <div className={cn(
                    'mt-1 h-1.5 w-1.5 rounded-full shrink-0',
                    m.importance >= 4 ? 'bg-gold' : m.importance >= 3 ? 'bg-fg-soft' : 'bg-fg-subtle',
                  )} />
                  <div className="flex-1 min-w-0">
                    {editingId === m.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 rounded border border-border bg-surface-2 px-2 py-1 text-[13px] text-fg"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditingId(null); }}
                        />
                        <button type="button" onClick={() => saveEdit(m.id)} className="h-7 w-7 rounded-md text-gold hover:bg-gold/10 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="h-7 w-7 rounded-md text-fg-muted hover:bg-surface-2 flex items-center justify-center">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[13.5px] text-fg leading-snug">{m.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10.5px] uppercase tracking-[0.1em] text-fg-subtle">{m.category}</span>
                          <span className="text-[10.5px] text-fg-subtle">·</span>
                          <span className="text-[10.5px] text-fg-subtle">{m.source}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== m.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditingId(m.id); setEditContent(m.content); }} className="h-7 w-7 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteMemory(m.id)} className="h-7 w-7 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function VoiceLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-0.5">{label}</div>
      <p className="text-[13px] text-fg-soft leading-relaxed">{value}</p>
    </div>
  );
}
EOFV
echo "OK memory-view.tsx"

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "============================================"
echo "  Memory + Voice Learning addon complete."
echo "============================================"
echo ""
echo "NEXT STEPS (manual):"
echo ""
echo "1. APPLY MIGRATION:"
echo "   Supabase SQL Editor > New query > paste supabase/migrations/0019_memory.sql > Run"
echo ""
echo "2. REGENERATE TYPES:"
echo "   export \$(grep SUPABASE_PROJECT_ID .env.local | xargs)"
echo "   pnpm db:generate"
echo "   pnpm typecheck"
echo ""
echo "3. COMMIT + PUSH:"
echo "   git add -A"
echo "   git commit -m 'feat: memory + voice learning'"
echo "   git push"
echo ""
echo "4. TEST:"
echo "   /settings/memory  -> see/add/edit/delete memories, learn voice"
echo "   Chat 'Remember that I prefer short answers' -> auto-saved"
echo ""
