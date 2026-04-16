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
import { getRelevantMemories, formatMemoriesBlock } from '@/features/memory/server/queries';
import { extractMemoryFromTurn, isExplicitMemoryRequest } from '@/features/memory/server/extract-memory';
import { fingerprintToPromptSnippet } from '@/features/memory/server/learn-voice';
import { findAgent } from '@/features/agents/data/catalog';
import { webSearch, formatWebContext, shouldSearch } from '@/features/web-browse/server/web-search';
import type { ChatMessage } from '@/lib/providers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1).max(10_000).optional().nullable(),
  regenerate: z.boolean().optional().default(false),
  provider: z.enum(['openai', 'anthropic', 'google']).optional(),
  model: z.string().optional(),
  agentType: z.enum(['creative','brand','copy','research','analyst','social']).optional(),
  webBrowse: z.boolean().optional(),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  projectId: z.string().optional().nullable(),
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

  // Quota check
  const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'chat_message' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed) {
    return NextResponse.json({ error: 'Monthly chat limit reached. Upgrade your plan.', quota: q }, { status: 402 });
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

  // Specialized agent
  const selectedAgent = findAgent(body.agentType ?? 'creative');
  const effectiveProvider = body.provider ?? selectedAgent?.preferredProvider ?? 'openai';
  const effectiveModel = body.model ?? selectedAgent?.preferredModel;

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

  const systemAdditions: ChatMessage[] = [];

  // Web browse: explicit flag OR auto-detect for researcher agent
  const wantsWeb = body.webBrowse === true || (selectedAgent?.id === 'research' && shouldSearch(body.message ?? ''));
  if (wantsWeb) {
    try {
      const webResults = await webSearch(body.message ?? '', 5);
      const webBlock = formatWebContext(webResults);
      if (webBlock) systemAdditions.push({ role: 'system', content: webBlock });
    } catch { /* graceful fallback */ }
  }

  if (selectedAgent && selectedAgent.systemPromptAddition) {
    systemAdditions.push({ role: 'system', content: selectedAgent.systemPromptAddition });
  }
  if (voiceSnippet) systemAdditions.push({ role: 'system', content: voiceSnippet });
  if (memoryBlock) systemAdditions.push({ role: 'system', content: memoryBlock });
  if (knowledgeBlock) systemAdditions.push({ role: 'system', content: knowledgeBlock });
  const messages: ChatMessage[] = [...systemAdditions, ...baseMessages];

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
    provider: effectiveProvider,
    model: effectiveModel ?? null,
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
          provider: effectiveProvider,
          model: effectiveModel,
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

        // Memory extraction (fire-and-forget)
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
