import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import {
  buildCompanyIntelligence,
  type CompanyIntelDocDraft,
} from '@/lib/brand-os/company-intelligence';
import { processDocument } from '@/features/knowledge/server/process-document';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const BodySchema = z.object({
  url: z.string().min(3),
  maxPages: z.number().int().min(3).max(14).optional(),
  createKnowledge: z.boolean().default(true),
  replaceExisting: z.boolean().default(true),
});

interface CreatedKnowledgeDoc {
  id: string;
  title: string;
  status: 'ready' | 'failed';
  chunkCount: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

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
    const intel = await buildCompanyIntelligence({
      url: parsed.data.url,
      maxPages: parsed.data.maxPages,
    });

    const warnings = [...intel.warnings];
    let createdDocuments: CreatedKnowledgeDoc[] = [];

    if (parsed.data.createKnowledge) {
      if (parsed.data.replaceExisting) {
        const replaceWarning = await softDeletePreviousIntelDocs(svc, orgId, intel.hostname);
        if (replaceWarning) warnings.push(replaceWarning);
      }

      createdDocuments = await createKnowledgeDocuments({
        svc,
        orgId,
        userId: user.id,
        hostname: intel.hostname,
        sourceUrl: intel.sourceUrl,
        docs: intel.documents,
      });
    }

    return NextResponse.json({
      ok: true,
      sourceUrl: intel.sourceUrl,
      hostname: intel.hostname,
      method: intel.method,
      firecrawlEnabled: intel.firecrawlEnabled,
      pages: intel.pages.map((page) => ({
        url: page.url,
        title: page.title,
        description: page.description,
        method: page.method,
        score: page.score,
        chars: page.text.length,
      })),
      draftDocuments: intel.documents.map((doc) => ({
        title: doc.title,
        category: doc.category,
        subcategory: doc.subcategory,
        importance: doc.importance,
      })),
      createdDocuments,
      warnings,
      requirements: {
        firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
        embeddings: Boolean(process.env.OPENAI_API_KEY),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Company intelligence extraction failed', details: errorMessage(err) },
      { status: 500 },
    );
  }
}

async function createKnowledgeDocuments(input: {
  svc: ReturnType<typeof createSupabaseServiceClient>;
  orgId: string;
  userId: string;
  hostname: string;
  sourceUrl: string;
  docs: CompanyIntelDocDraft[];
}): Promise<CreatedKnowledgeDoc[]> {
  const created: CreatedKnowledgeDoc[] = [];
  const siteTag = `site:${input.hostname}`;
  const now = Date.now();

  for (let index = 0; index < input.docs.length; index += 1) {
    const draft = input.docs[index];
    const buffer = Buffer.from(draft.content, 'utf-8');
    const storagePath = `${input.orgId}/${now}-${index + 1}-${sanitizeFilename(draft.filename)}`;

    const { error: uploadError } = await input.svc.storage
      .from('knowledge')
      .upload(storagePath, buffer, {
        contentType: 'text/markdown; charset=utf-8',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      created.push({
        id: '',
        title: draft.title,
        status: 'failed',
        chunkCount: 0,
        error: uploadError.message,
      });
      continue;
    }

    const { data: docRow, error: insertError } = await input.svc
      .from('documents')
      .insert({
        org_id: input.orgId,
        uploaded_by: input.userId,
        storage_bucket: 'knowledge',
        storage_path: storagePath,
        original_name: draft.filename,
        mime_type: 'text/markdown',
        size_bytes: buffer.byteLength,
        status: 'uploading',
        title: draft.title,
        description: `Auto-generated from ${input.sourceUrl}`,
        tags: ['company-intel', siteTag, 'auto-generated'],
        category: draft.category,
        subcategory: draft.subcategory,
        is_brand_asset: draft.isBrandAsset,
        importance: draft.importance,
      } as never)
      .select('id')
      .single();

    if (insertError || !docRow) {
      await input.svc.storage.from('knowledge').remove([storagePath]);
      created.push({
        id: '',
        title: draft.title,
        status: 'failed',
        chunkCount: 0,
        error: insertError?.message ?? 'Failed to create document',
      });
      continue;
    }

    const documentId = (docRow as { id: string }).id;

    await input.svc.rpc('increment_usage', {
      p_org_id: input.orgId,
      p_kind: 'document_storage_bytes',
      p_quantity: buffer.byteLength,
      p_cost: 0,
    });

    try {
      const processed = await processDocument({
        svc: input.svc,
        orgId: input.orgId,
        documentId,
      });
      created.push({
        id: documentId,
        title: draft.title,
        status: 'ready',
        chunkCount: processed.chunkCount,
      });
    } catch (err) {
      const message = errorMessage(err);
      await input.svc
        .from('documents')
        .update({ status: 'failed', processing_error: message } as never)
        .eq('id', documentId)
        .eq('org_id', input.orgId);
      created.push({
        id: documentId,
        title: draft.title,
        status: 'failed',
        chunkCount: 0,
        error: message,
      });
    }
  }

  return created;
}

async function softDeletePreviousIntelDocs(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  orgId: string,
  hostname: string,
): Promise<string | null> {
  const siteTag = `site:${hostname}`;
  const { data, error } = await svc
    .from('documents')
    .select('id')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .contains('tags', ['company-intel', siteTag]);

  if (error) return `Could not replace previous company intelligence docs: ${error.message}`;
  const ids = ((data ?? []) as Array<{ id: string }>).map((doc) => doc.id);
  if (ids.length === 0) return null;

  const { error: updateError } = await svc
    .from('documents')
    .update({ deleted_at: new Date().toISOString() } as never)
    .in('id', ids)
    .eq('org_id', orgId);

  return updateError
    ? `Could not archive previous company intelligence docs: ${updateError.message}`
    : null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
