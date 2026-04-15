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
