#!/usr/bin/env bash
set -euo pipefail

echo ">>> Operator AI - Week 4"
echo ">>> Knowledge (RAG with documents)"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Installing deps (pdf-parse, mammoth for docx)..."
pnpm add pdf-parse mammoth 2>&1 | tail -3
pnpm add -D @types/pdf-parse 2>&1 | tail -3

echo ""
echo ">>> Creating directories..."
mkdir -p src/lib/rag
mkdir -p src/features/knowledge/components
mkdir -p src/features/knowledge/server
mkdir -p src/features/knowledge/hooks
mkdir -p src/app/api/knowledge/upload
mkdir -p src/app/api/knowledge/process
mkdir -p src/app/api/knowledge/list
mkdir -p src/app/api/knowledge/delete
mkdir -p src/app/api/knowledge/signed-url

echo ">>> Writing text extraction..."

cat > src/lib/rag/extract-text.ts <<'EOFEXTRACT'
import 'server-only';

export interface ExtractedText {
  text: string;
  meta: Record<string, unknown>;
}

const MAX_CHARS = 2_000_000;

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractedText> {
  const lower = filename.toLowerCase();

  if (mimeType === 'application/pdf' || lower.endsWith('.pdf')) {
    return extractPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  ) {
    return extractDocx(buffer);
  }

  if (
    mimeType.startsWith('text/') ||
    lower.endsWith('.txt') ||
    lower.endsWith('.md') ||
    lower.endsWith('.markdown') ||
    lower.endsWith('.csv') ||
    lower.endsWith('.json')
  ) {
    const text = buffer.toString('utf-8').slice(0, MAX_CHARS);
    return { text, meta: { type: 'text' } };
  }

  throw new Error('Unsupported file type: ' + mimeType);
}

async function extractPdf(buffer: Buffer): Promise<ExtractedText> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = (data.text ?? '').slice(0, MAX_CHARS);
  return {
    text,
    meta: { type: 'pdf', pages: data.numpages ?? null, info: data.info ?? null },
  };
}

async function extractDocx(buffer: Buffer): Promise<ExtractedText> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? '').slice(0, MAX_CHARS);
  return { text, meta: { type: 'docx', warnings: result.messages?.length ?? 0 } };
}
EOFEXTRACT

echo ">>> Writing recursive chunker..."

cat > src/lib/rag/chunker.ts <<'EOFCHUNKER'
export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
}

const SEPARATORS = ['\n\n\n', '\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' '];

/**
 * Rough token estimate: 1 token ~ 4 chars for English / similar for Spanish.
 * Good enough for chunk sizing without bringing in a tokenizer.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitRecursive(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  for (const sep of SEPARATORS) {
    if (!text.includes(sep)) continue;
    const pieces = text.split(sep);
    const merged: string[] = [];
    let buf = '';
    for (const p of pieces) {
      const candidate = buf.length === 0 ? p : buf + sep + p;
      if (candidate.length <= maxChars) {
        buf = candidate;
      } else {
        if (buf.length > 0) merged.push(buf);
        if (p.length > maxChars) {
          merged.push(...splitRecursive(p, maxChars));
          buf = '';
        } else {
          buf = p;
        }
      }
    }
    if (buf.length > 0) merged.push(buf);
    if (merged.length > 1) return merged;
  }

  // Hard split
  const out: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    out.push(text.slice(i, i + maxChars));
  }
  return out;
}

/**
 * Chunks text into overlapping pieces.
 * Default: ~800 tokens per chunk, ~120 token overlap.
 */
export function chunk(
  text: string,
  opts: { maxTokens?: number; overlapTokens?: number } = {},
): Chunk[] {
  const maxTokens = opts.maxTokens ?? 800;
  const overlapTokens = opts.overlapTokens ?? 120;
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const normalized = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!normalized) return [];

  const base = splitRecursive(normalized, maxChars);

  // Add overlap by prepending last overlapChars of previous chunk
  const chunks: Chunk[] = [];
  for (let i = 0; i < base.length; i++) {
    const piece = i === 0
      ? base[i]
      : base[i - 1].slice(-overlapChars) + '\n' + base[i];
    const clipped = piece.length > maxChars + overlapChars ? piece.slice(0, maxChars + overlapChars) : piece;
    chunks.push({
      index: i,
      content: clipped.trim(),
      tokenCount: estimateTokens(clipped),
    });
  }
  return chunks;
}
EOFCHUNKER

echo ">>> Writing embeddings client..."

cat > src/lib/rag/embeddings.ts <<'EOFEMB'
import 'server-only';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';

const EMBED_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

export async function embedOne(text: string): Promise<number[]> {
  const openai = getClient();
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

/**
 * Batch embed. OpenAI supports up to ~2048 inputs per request.
 * We batch at 100 to stay well under limits and keep latency low.
 */
export async function embedMany(texts: string[]): Promise<number[][]> {
  const openai = getClient();
  const BATCH = 96;
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH).map((t) => t.slice(0, 8000));
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: slice });
    out.push(...res.data.map((d) => d.embedding));
  }
  return out;
}
EOFEMB

echo ">>> Writing retriever (vector + keyword fused)..."

cat > src/lib/rag/retrieve.ts <<'EOFRETR'
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RetrievedChunk {
  id: string;
  document_id: string;
  content: string;
  source: string;
  vector_score: number;
  keyword_score: number;
  rrf_score: number;
}

interface RetrieveInput {
  svc: SupabaseClient;
  orgId: string;
  assistantId?: string | null;
  query: string;
  queryEmbedding: number[];
  topK?: number;
}

/**
 * Reciprocal Rank Fusion for vector + keyword search.
 * k=60 is the canonical constant in RRF papers.
 */
const RRF_K = 60;

export async function retrieveChunks({
  svc, orgId, assistantId, query, queryEmbedding, topK = 6,
}: RetrieveInput): Promise<RetrievedChunk[]> {
  // Vector search (top 15)
  const { data: vectorRows } = await svc.rpc('match_chunks', {
    p_org_id: orgId,
    p_assistant_id: assistantId ?? null,
    p_query_embedding: queryEmbedding as unknown as string,
    p_match_count: 15,
    p_min_similarity: 0.5,
  });

  // Keyword search (top 15) via tsvector
  const { data: keywordRows } = await svc
    .from('document_chunks')
    .select('id, document_id, content, documents!inner(title, original_name, status, deleted_at)')
    .eq('org_id', orgId)
    .eq('documents.status', 'ready')
    .is('documents.deleted_at', null)
    .textSearch('tsv', query.split(/\s+/).filter(Boolean).slice(0, 10).join(' | '), {
      type: 'plain',
      config: 'simple',
    })
    .limit(15);

  type VRow = { id: string; document_id: string; content: string; source: string; similarity: number };
  type KRow = {
    id: string;
    document_id: string;
    content: string;
    documents: { title: string | null; original_name: string; status: string; deleted_at: string | null } | null;
  };

  const vRows = (vectorRows ?? []) as VRow[];
  const kRows = (keywordRows ?? []) as unknown as KRow[];

  // Build map: id -> scores
  const map = new Map<string, RetrievedChunk>();

  vRows.forEach((r, rank) => {
    const existing = map.get(r.id);
    const vector_score = r.similarity;
    const rrf_v = 1 / (RRF_K + rank + 1);
    if (existing) {
      existing.vector_score = vector_score;
      existing.rrf_score += rrf_v;
    } else {
      map.set(r.id, {
        id: r.id,
        document_id: r.document_id,
        content: r.content,
        source: r.source,
        vector_score,
        keyword_score: 0,
        rrf_score: rrf_v,
      });
    }
  });

  kRows.forEach((r, rank) => {
    const source = r.documents?.title || r.documents?.original_name || 'Untitled';
    const rrf_k = 1 / (RRF_K + rank + 1);
    const existing = map.get(r.id);
    if (existing) {
      existing.keyword_score = 1;
      existing.rrf_score += rrf_k;
    } else {
      map.set(r.id, {
        id: r.id,
        document_id: r.document_id,
        content: r.content,
        source,
        vector_score: 0,
        keyword_score: 1,
        rrf_score: rrf_k,
      });
    }
  });

  return Array.from(map.values())
    .sort((a, b) => b.rrf_score - a.rrf_score)
    .slice(0, topK);
}

export function formatKnowledgeBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';
  const lines: string[] = [
    '# Relevant business knowledge',
    'Use the following passages where relevant. When you reference them, cite with [n] matching the number.',
    '',
  ];
  chunks.forEach((c, i) => {
    lines.push('[' + (i + 1) + '] Source: ' + c.source);
    lines.push(c.content.trim());
    lines.push('');
  });
  return lines.join('\n');
}
EOFRETR

echo ">>> Writing server-side processor..."

cat > src/features/knowledge/server/process-document.ts <<'EOFPROC'
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { extractTextFromBuffer } from '@/lib/rag/extract-text';
import { chunk, estimateTokens } from '@/lib/rag/chunker';
import { embedMany } from '@/lib/rag/embeddings';

interface Input {
  svc: SupabaseClient;
  orgId: string;
  documentId: string;
}

export async function processDocument({ svc, orgId, documentId }: Input): Promise<{
  chunkCount: number;
  preview: string;
}> {
  // Mark as processing
  await svc
    .from('documents')
    .update({ status: 'processing', processing_error: null } as never)
    .eq('id', documentId)
    .eq('org_id', orgId);

  const { data: doc } = await svc
    .from('documents')
    .select('id, storage_bucket, storage_path, mime_type, original_name')
    .eq('id', documentId)
    .eq('org_id', orgId)
    .single();

  if (!doc) throw new Error('Document not found');
  const d = doc as { id: string; storage_bucket: string; storage_path: string; mime_type: string; original_name: string };

  // Download from storage
  const { data: file, error: dlErr } = await svc.storage
    .from(d.storage_bucket)
    .download(d.storage_path);
  if (dlErr || !file) throw new Error('Failed to download: ' + (dlErr?.message ?? 'unknown'));
  const buffer = Buffer.from(await file.arrayBuffer());

  // Extract
  const { text } = await extractTextFromBuffer(buffer, d.mime_type, d.original_name);
  if (!text || text.trim().length < 20) {
    throw new Error('Document is empty or could not extract text');
  }

  // Chunk
  const chunks = chunk(text, { maxTokens: 800, overlapTokens: 120 });
  if (chunks.length === 0) throw new Error('No chunks produced');

  // Embed
  const embeddings = await embedMany(chunks.map((c) => c.content));

  // Delete existing chunks for this doc (idempotent)
  await svc.from('document_chunks').delete().eq('document_id', documentId).eq('org_id', orgId);

  // Insert chunks
  const rows = chunks.map((c, i) => ({
    org_id: orgId,
    document_id: documentId,
    chunk_index: c.index,
    content: c.content,
    content_hash: simpleHash(c.content),
    token_count: c.tokenCount,
    embedding: embeddings[i] as unknown as string,
  }));

  // Insert in batches to avoid payload limits
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error: insErr } = await svc.from('document_chunks').insert(slice as never);
    if (insErr) throw new Error('Chunk insert failed: ' + insErr.message);
  }

  const preview = text.slice(0, 500);
  const totalTokens = chunks.reduce((acc, c) => acc + c.tokenCount, 0);

  await svc
    .from('documents')
    .update({
      status: 'ready',
      chunk_count: chunks.length,
      extracted_text_preview: preview,
      processed_at: new Date().toISOString(),
    } as never)
    .eq('id', documentId)
    .eq('org_id', orgId);

  // Usage tracking
  await svc.rpc('increment_usage', {
    p_org_id: orgId,
    p_kind: 'document_ingested',
    p_quantity: 1,
    p_cost: 0,
  });
  await svc.rpc('increment_usage', {
    p_org_id: orgId,
    p_kind: 'embedding_tokens',
    p_quantity: totalTokens,
    p_cost: (totalTokens * 0.02) / 1_000_000,
  });

  return { chunkCount: chunks.length, preview };
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return 'h' + (h >>> 0).toString(36);
}
EOFPROC

echo ">>> Writing API routes..."

cat > src/app/api/knowledge/upload/route.ts <<'EOFUPLOAD'
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

export async function POST(req: NextRequest) {
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

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 400 });
  }

  const looksAllowedByExt = /\.(pdf|docx|txt|md|markdown|csv|json)$/i.test(file.name);
  if (!ALLOWED.has(file.type) && !looksAllowedByExt) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = orgId + '/' + Date.now() + '-' + sanitize(file.name);

  const { error: upErr } = await svc.storage
    .from('knowledge')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const insertRow = {
    org_id: orgId,
    uploaded_by: user.id,
    storage_bucket: 'knowledge',
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    status: 'uploading',
    title: file.name.replace(/\.[^/.]+$/, ''),
  } as never;

  const { data: docRow, error: insErr } = await svc
    .from('documents')
    .insert(insertRow)
    .select('id')
    .single();

  if (insErr || !docRow) {
    await svc.storage.from('knowledge').remove([storagePath]);
    return NextResponse.json({ error: insErr?.message ?? 'Failed to create document' }, { status: 500 });
  }

  const documentId = (docRow as { id: string }).id;

  // Usage tracking for storage bytes
  await svc.rpc('increment_usage', {
    p_org_id: orgId,
    p_kind: 'document_storage_bytes',
    p_quantity: file.size,
    p_cost: 0,
  });

  return NextResponse.json({ id: documentId });
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
EOFUPLOAD

cat > src/app/api/knowledge/process/route.ts <<'EOFPROCAPI'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { processDocument } from '@/features/knowledge/server/process-document';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  documentId: z.string().min(1),
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

  try {
    const result = await processDocument({ svc, orgId, documentId: parsed.data.documentId });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    await svc
      .from('documents')
      .update({ status: 'failed', processing_error: message } as never)
      .eq('id', parsed.data.documentId)
      .eq('org_id', orgId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOFPROCAPI

cat > src/app/api/knowledge/list/route.ts <<'EOFLIST'
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

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

  const { data } = await svc
    .from('documents')
    .select('id, title, original_name, mime_type, size_bytes, status, chunk_count, extracted_text_preview, processing_error, created_at, processed_at, tags')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return NextResponse.json({ documents: data ?? [] });
}
EOFLIST

cat > src/app/api/knowledge/delete/route.ts <<'EOFDEL'
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

  const { data: doc } = await svc
    .from('documents')
    .select('id, storage_bucket, storage_path')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = doc as { id: string; storage_bucket: string; storage_path: string };

  // Soft delete first
  await svc
    .from('documents')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', d.id)
    .eq('org_id', orgId);

  // Hard delete chunks (they carry no user-editable state)
  await svc.from('document_chunks').delete().eq('document_id', d.id).eq('org_id', orgId);

  // Remove from storage (best-effort)
  await svc.storage.from(d.storage_bucket).remove([d.storage_path]).catch(() => {});

  return NextResponse.json({ ok: true });
}
EOFDEL

cat > src/app/api/knowledge/signed-url/route.ts <<'EOFSIGN'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const QuerySchema = z.object({ id: z.string().min(1) });

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({ id: url.searchParams.get('id') ?? '' });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });

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

  const { data: doc } = await svc
    .from('documents')
    .select('storage_bucket, storage_path, original_name')
    .eq('id', parsed.data.id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const d = doc as { storage_bucket: string; storage_path: string; original_name: string };

  const { data: signed, error } = await svc.storage
    .from(d.storage_bucket)
    .createSignedUrl(d.storage_path, 300);

  if (error || !signed) return NextResponse.json({ error: error?.message ?? 'Failed to sign' }, { status: 500 });
  return NextResponse.json({ url: signed.signedUrl, name: d.original_name });
}
EOFSIGN

echo ">>> Wiring RAG into /api/chat..."

cat > src/app/api/chat/route.ts <<'EOFCHAT'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sseEncode, sseComment } from '@/lib/sse/encoder';
import { runChat } from '@/lib/orchestrator/run-chat';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { ensureDefaultAssistant } from '@/features/chat/server/ensure-assistant';
import { getOrCreateConversation } from '@/features/chat/server/get-or-create-conversation';
import { embedOne } from '@/lib/rag/embeddings';
import { retrieveChunks, formatKnowledgeBlock, type RetrievedChunk } from '@/lib/rag/retrieve';
import type { ChatMessage } from '@/lib/providers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1).max(10_000).optional().nullable(),
  regenerate: z.boolean().optional().default(false),
  provider: z.enum(['openai', 'anthropic']).optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (!body.regenerate && (!body.message || !body.message.trim())) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

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

  const assistantId = await ensureDefaultAssistant(svc, orgId, orgName);

  if (body.regenerate && !body.conversationId) {
    return NextResponse.json({ error: 'conversationId required for regenerate' }, { status: 400 });
  }

  const { id: conversationId, isNew } = await getOrCreateConversation({
    svc, orgId, userId: user.id, assistantId, conversationId: body.conversationId,
  });

  let userMessageId: string | null = null;
  let queryText: string | null = body.message ?? null;

  if (body.regenerate) {
    const { data: lastUserRows } = await svc
      .from('messages')
      .select('id, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1);
    const lastUserRow = lastUserRows?.[0] as { id: string; content: string; created_at: string } | undefined;
    if (!lastUserRow) return NextResponse.json({ error: 'Nothing to regenerate' }, { status: 400 });
    userMessageId = lastUserRow.id;
    queryText = lastUserRow.content;

    await svc
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .gt('created_at', lastUserRow.created_at);
  } else {
    const userMsgInsert = {
      org_id: orgId,
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: body.message,
      status: 'complete',
    } as never;
    const { data: userMsgRow, error: userMsgErr } = await svc
      .from('messages')
      .insert(userMsgInsert)
      .select('id')
      .single();
    if (userMsgErr || !userMsgRow) {
      return NextResponse.json({ error: userMsgErr?.message ?? 'Failed to persist message' }, { status: 500 });
    }
    userMessageId = (userMsgRow as { id: string }).id;
  }

  // === RAG retrieval ===
  let retrieved: RetrievedChunk[] = [];
  let knowledgeBlock = '';
  if (queryText && queryText.trim().length > 0) {
    try {
      const queryEmbedding = await embedOne(queryText);
      retrieved = await retrieveChunks({
        svc, orgId, assistantId, query: queryText, queryEmbedding, topK: 6,
      });
      knowledgeBlock = formatKnowledgeBlock(retrieved);
    } catch (e) {
      // RAG failure must not break chat — log and continue without knowledge
      console.error('[rag] retrieval failed:', e);
    }
  }

  // Load history
  const { data: history } = await svc
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(30);

  const baseMessages: ChatMessage[] = (history ?? []).map((m) => ({
    role: (m as { role: string }).role as ChatMessage['role'],
    content: (m as { content: string }).content ?? '',
  }));

  // Inject knowledge block as a synthetic system turn at the very start (after the real system prompt)
  const messages: ChatMessage[] = knowledgeBlock
    ? [{ role: 'system', content: knowledgeBlock }, ...baseMessages]
    : baseMessages;

  const { data: assistantRow } = await svc
    .from('assistants')
    .select('business_name, industry, audience, services, goals, tone, writing_style, languages, custom_instructions, banned_words')
    .eq('id', assistantId)
    .single();

  const pendingInsert = {
    org_id: orgId,
    conversation_id: conversationId,
    user_id: user.id,
    role: 'assistant',
    content: '',
    status: 'streaming',
    provider: body.provider ?? 'openai',
    model: body.model ?? null,
    parent_message_id: userMessageId,
    context_doc_chunks: retrieved.map((c) => c.id),
  } as never;
  const { data: pendingRow, error: pendingErr } = await svc
    .from('messages')
    .insert(pendingInsert)
    .select('id')
    .single();
  if (pendingErr || !pendingRow) {
    return NextResponse.json({ error: pendingErr?.message ?? 'Failed to create pending message' }, { status: 500 });
  }
  const pendingMessageId = (pendingRow as { id: string }).id;

  const started = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(sseComment('stream start'));
        controller.enqueue(sseEncode('meta', {
          conversationId,
          assistantMessageId: pendingMessageId,
          isNewConversation: isNew,
          citations: retrieved.map((c, i) => ({
            n: i + 1,
            documentId: c.document_id,
            source: c.source,
          })),
        }));

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let costUsd = 0;
        let failed = false;
        let errorMessage = '';

        for await (const delta of runChat({
          messages,
          assistant: assistantRow as Parameters<typeof runChat>[0]['assistant'],
          provider: body.provider,
          model: body.model,
          signal: req.signal,
        })) {
          if (delta.type === 'text') {
            fullText += delta.value;
            controller.enqueue(sseEncode('delta', { text: delta.value }));
          } else if (delta.type === 'done') {
            inputTokens = delta.inputTokens ?? 0;
            outputTokens = delta.outputTokens ?? 0;
            costUsd = delta.costUsd ?? 0;
          } else if (delta.type === 'error') {
            failed = true;
            errorMessage = delta.message;
            controller.enqueue(sseEncode('error', { message: delta.message }));
          }
        }

        const latencyMs = Date.now() - started;

        await svc
          .from('messages')
          .update({
            content: fullText,
            status: failed ? 'failed' : 'complete',
            error_message: failed ? errorMessage : null,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            latency_ms: latencyMs,
            cost_usd: costUsd,
          } as never)
          .eq('id', pendingMessageId);

        if (isNew) {
          const title = fullText.slice(0, 60).replace(/\s+/g, ' ').trim() || (body.message ?? '').slice(0, 60);
          await svc.from('conversations').update({ title } as never).eq('id', conversationId);
        }

        await svc.rpc('increment_usage', {
          p_org_id: orgId,
          p_kind: 'chat_message',
          p_quantity: 1,
          p_cost: costUsd,
        });

        controller.enqueue(sseEncode('done', { latencyMs, inputTokens, outputTokens, costUsd }));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(sseEncode('error', { message: msg }));
        await svc
          .from('messages')
          .update({ status: 'failed', error_message: msg } as never)
          .eq('id', pendingMessageId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
EOFCHAT

echo ">>> Writing Knowledge UI components..."

cat > src/features/knowledge/components/upload-dropzone.tsx <<'EOFDROP'
'use client';
import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCEPT = '.pdf,.docx,.txt,.md,.markdown,.csv,.json';
const MAX_SIZE = 25 * 1024 * 1024;

interface Props {
  onUploaded: () => void;
}

export function UploadDropzone({ onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);

  const handleFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(f.name + ': too large (max 25 MB)');
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading((n) => n + valid.length);

    for (const file of valid) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/knowledge/upload', { method: 'POST', body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(file.name + ': ' + (body?.error ?? 'upload failed'));
        } else {
          toast.success(file.name + ' uploaded');
          // Fire processing (fire-and-forget, UI polls status)
          fetch('/api/knowledge/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: body.id }),
          }).catch(() => {});
        }
      } catch (e) {
        toast.error(file.name + ': ' + (e instanceof Error ? e.message : 'failed'));
      } finally {
        setUploading((n) => n - 1);
        onUploaded();
      }
    }
  }, [onUploaded]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'relative block rounded-xl border-2 border-dashed transition-all cursor-pointer',
        'px-6 py-12 text-center',
        dragOver
          ? 'border-gold bg-gold/5'
          : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
      )}
    >
      <input type="file" multiple accept={ACCEPT} onChange={onChange} className="sr-only" />
      <div className="flex flex-col items-center gap-3">
        {uploading > 0 ? (
          <>
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
            <div className="text-[14px] text-fg">Uploading {uploading} file{uploading !== 1 ? 's' : ''}...</div>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-surface-3 border border-border flex items-center justify-center">
              <UploadCloud className="h-5 w-5 text-gold" />
            </div>
            <div>
              <div className="text-[14.5px] text-fg font-medium">
                Drop files here or <span className="text-gold">click to browse</span>
              </div>
              <div className="text-[12px] text-fg-muted mt-1.5">
                PDF, DOCX, TXT, MD, CSV, JSON · up to 25 MB each
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mt-1">
              <FileText className="h-3 w-3" />
              <span>Files are extracted, chunked, and indexed for semantic search.</span>
            </div>
          </>
        )}
      </div>
    </label>
  );
}
EOFDROP

cat > src/features/knowledge/components/document-row.tsx <<'EOFROW'
'use client';
import { useState } from 'react';
import { FileText, FileIcon, Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export interface DocumentRow {
  id: string;
  title: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  chunk_count: number;
  extracted_text_preview: string | null;
  processing_error: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Props {
  doc: DocumentRow;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentRow({ doc, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);

  const statusChip = (() => {
    switch (doc.status) {
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-surface-3 border border-border text-fg-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-gold/10 border border-gold/30 text-gold">
            <Loader2 className="h-3 w-3 animate-spin" /> Indexing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-success/10 border border-success/30 text-success">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-danger/10 border border-danger/30 text-danger">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        );
    }
  })();

  async function openFile() {
    const res = await fetch('/api/knowledge/signed-url?id=' + encodeURIComponent(doc.id));
    const data = await res.json();
    if (data.url) window.open(data.url, '_blank');
  }

  async function handleDelete() {
    if (!confirm('Delete ' + (doc.title || doc.original_name) + '?')) return;
    setDeleting(true);
    try { await onDelete(doc.id); } finally { setDeleting(false); }
  }

  const Icon = doc.mime_type === 'application/pdf' ? FileText : FileIcon;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-surface hover:border-border-strong transition-colors">
      <div className="h-10 w-10 rounded-md shrink-0 bg-surface-2 border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[14px] font-medium text-fg truncate">
            {doc.title || doc.original_name}
          </div>
          {statusChip}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11.5px] text-fg-subtle">
          <span>{formatBytes(doc.size_bytes)}</span>
          <span>·</span>
          <span>{formatDate(doc.created_at)}</span>
          {doc.status === 'ready' && (
            <>
              <span>·</span>
              <span>{doc.chunk_count} chunks</span>
            </>
          )}
        </div>
        {doc.processing_error && (
          <div className="mt-1.5 text-[11.5px] text-danger line-clamp-1">{doc.processing_error}</div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={openFile}
          className="h-8 w-8 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center"
          aria-label="Open"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'h-8 w-8 rounded-md flex items-center justify-center',
            deleting ? 'text-fg-subtle' : 'text-fg-muted hover:text-danger hover:bg-danger/10',
          )}
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
EOFROW

cat > src/features/knowledge/components/knowledge-view.tsx <<'EOFVIEW'
'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UploadDropzone } from './upload-dropzone';
import { DocumentRow, type DocumentRow as DocType } from './document-row';

export function KnowledgeView() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setDocs(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll when there are docs in progress
  useEffect(() => {
    const inProgress = docs.some((d) => d.status === 'uploading' || d.status === 'processing');
    if (!inProgress) return;
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [docs, refresh]);

  async function onDelete(id: string) {
    const res = await fetch('/api/knowledge/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error ?? 'Delete failed');
      return;
    }
    toast.success('Deleted');
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={refresh} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[18px]">Documents</h2>
          <span className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            {docs.length} {docs.length === 1 ? 'file' : 'files'}
          </span>
        </div>
        {loading && (
          <div className="text-[13px] text-fg-muted py-6 text-center">Loading...</div>
        )}
        {!loading && docs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-10 text-center">
            <p className="text-[13.5px] text-fg-muted">
              No documents yet. Upload your first file to start.
            </p>
          </div>
        )}
        {!loading && docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((d) => (
              <DocumentRow key={d.id} doc={d} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
EOFVIEW

echo ">>> Updating /knowledge page..."

cat > "src/app/(app)/knowledge/page.tsx" <<'EOFPAGE'
import { KnowledgeView } from '@/features/knowledge/components/knowledge-view';

export default function KnowledgePage() {
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Business brain</div>
        <h1 className="font-display text-[32px]">Knowledge</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          Upload your brand manual, briefs, SOPs, catalogs, or any document. Your assistant searches them in every conversation and cites sources with [n].
        </p>
      </div>
      <KnowledgeView />
    </div>
  );
}
EOFPAGE

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -20

echo ""
echo "========================================"
echo "  Week 4 complete."
echo "========================================"
echo ""
echo "What's new:"
echo "  * Document upload with drag & drop at /knowledge"
echo "  * Supports PDF, DOCX, TXT, MD, CSV, JSON up to 25 MB"
echo "  * Auto-processing: extract -> chunk -> embed -> index"
echo "  * pgvector + keyword hybrid search with RRF"
echo "  * Chat uses retrieved chunks automatically with [n] citations"
echo "  * Status polling, signed URLs, soft-delete"
echo ""
echo "Try it:"
echo "  1. Restart pnpm dev if running"
echo "  2. Open http://localhost:3000/knowledge"
echo "  3. Upload a document"
echo "  4. Wait for 'Ready' status (10-30 sec)"
echo "  5. Go to chat and ask something from the document"
echo ""
