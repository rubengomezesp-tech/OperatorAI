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
