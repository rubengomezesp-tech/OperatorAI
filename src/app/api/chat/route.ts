import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sseEncode, sseComment } from '@/lib/sse/encoder';
import { runChatWithTools } from '@/lib/orchestrator/run-chat-with-tools';
import { buildToolFetchContext } from '@/lib/chat/tools';
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
import { buildCreativeAgentPrompt } from '@/lib/agents/creative-agent-prompt';
import { detectsCampaignGenerationIntent, detectLocale } from '@/lib/agents/action-detector';

export const runtime = 'nodejs';
export const maxDuration = 300;

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

  const userEmail = user.email ?? ""; const isAdminUser = userEmail === "rubengomezesp@gmail.com"; const { data: quota } = await svc.rpc('check_quota', { p_org_id: orgId, p_kind: 'chat_message' });
  const q = quota as { allowed: boolean; used: number; limit: number } | null;
  if (q && !q.allowed && !isAdminUser) {
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

  const selectedAgent = findAgent(body.agentType ?? 'creative');

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

  const wantsWeb = body.webBrowse === true || (selectedAgent?.id === 'research' && shouldSearch(body.message ?? ''));
  if (wantsWeb) {
    try {
      const webResults = await webSearch(body.message ?? '', 5);
      const webBlock = formatWebContext(webResults);
      if (webBlock) systemAdditions.push({ role: 'system', content: webBlock });
    } catch { /* graceful */ }
  }

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
      systemAdditions.push({ role: 'system', content: lines.join('\n') });
    }
  } catch { /* non-fatal */ }

  if (selectedAgent && selectedAgent.systemPromptAddition) {
    systemAdditions.push({ role: 'system', content: selectedAgent.systemPromptAddition });
  }
  if (voiceSnippet) systemAdditions.push({ role: 'system', content: voiceSnippet });
  if (memoryBlock) systemAdditions.push({ role: 'system', content: memoryBlock });
  if (knowledgeBlock) systemAdditions.push({ role: 'system', content: knowledgeBlock });

  try {
    const { data: recentFiles } = await svc
      .from('analysis_files')
      .select('id, name')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (recentFiles && recentFiles.length > 0) {
      const list = (recentFiles as Array<{ id: string; name: string }>)
        .map((f) => `- ${f.name} (id: ${f.id})`)
        .join('\n');
      systemAdditions.push({
        role: 'system',
        content:
          '<user_files>\nRecent uploaded files. Use these IDs with the file_analysis tool if the user mentions one:\n' +
          list +
          '\n</user_files>',
      });
    }
  } catch { /* optional */ }

  const messages: ChatMessage[] = [...systemAdditions, ...baseMessages];

  const pendingInsert = {
    org_id: orgId,
    conversation_id: conversationId,
    user_id: user.id,
    role: 'assistant',
    content: '',
    status: 'streaming',
    provider: body.provider || 'anthropic',
    model: body.model || 'claude-sonnet-4-5',
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

  // Build per-request context the tools need: absolute origin + cookie header.
  const toolFetchCtx = await buildToolFetchContext(req);

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

        // ═══ PROVIDER ROUTING ═══
        const selectedProvider = (body.provider || 'anthropic') as string;
        
        if (selectedProvider === 'openai') {
          try {
            const OpenAI = (await import('openai')).default;
            const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            const oaiMsgs = messages.map(m => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            }));
            const oaiStream = await oai.chat.completions.create({
              model: body.model || 'gpt-4o',
              messages: oaiMsgs,
              stream: true,
              max_tokens: 4096,
            });
            let oaiText = '';
            for await (const chunk of oaiStream) {
              const d = chunk.choices[0]?.delta?.content || '';
              if (d) { oaiText += d; controller.enqueue(sseEncode('delta', { text: d })); }
            }
            await svc.from('messages').update({ content: oaiText, status: 'complete' } as never).eq('id', pendingMessageId);
            controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
            controller.close();
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'OpenAI error';
            controller.enqueue(sseEncode('error', { message: msg }));
            controller.close();
          }
          return;
        }
        
        if (selectedProvider === 'google') {
          try {
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
            const gemModel = genAI.getGenerativeModel({ model: body.model || 'gemini-2.5-flash-preview' });
            const sysMsg = messages.filter(m => m.role === 'system').map(m => typeof m.content === 'string' ? m.content : '').join('\n');
            const chatMsgs = messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'model' as const : 'user' as const,
              parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
            }));
            const lastMsg = chatMsgs.pop();
            const chat = gemModel.startChat({ history: chatMsgs, systemInstruction: sysMsg || undefined });
            const gemStream = await chat.sendMessageStream(lastMsg?.parts[0]?.text || '');
            let gemText = '';
            for await (const chunk of gemStream.stream) {
              const d = chunk.text();
              if (d) { gemText += d; controller.enqueue(sseEncode('delta', { text: d })); }
            }
            await svc.from('messages').update({ content: gemText, status: 'complete' } as never).eq('id', pendingMessageId);
            controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
            controller.close();
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Gemini error';
            controller.enqueue(sseEncode('error', { message: msg }));
            controller.close();
          }
          return;
        }
        
        // ═══ ANTHROPIC (default) — with tool-use for images ═══
        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let costUsd = 0;
        let failed = false;
        let errorMessage = '';
        const toolParts: Array<{
          id: string; kind: string; status: 'running'|'done'|'failed';
          input: Record<string, unknown>;
          result?: Record<string, unknown>;
          error?: string;
          createdAt: string;
        }> = [];

        for await (const event of runChatWithTools({
          messages,
          svc,
          orgId,
          userId: user.id,
          assistantId,
          origin: toolFetchCtx.origin,
          cookieHeader: toolFetchCtx.cookieHeader,
          imageBase64: body.imageBase64,
          imageMimeType: body.imageMimeType,
          signal: req.signal,
        })) {
          if (event.type === 'text') {
            fullText += event.value;
            controller.enqueue(sseEncode('delta', { text: event.value }));
          } else if (event.type === 'tool_start') {
            toolParts.push({
              id: event.toolUseId,
              kind: event.tool,
              status: 'running',
              input: event.input,
              createdAt: new Date().toISOString(),
            });
            controller.enqueue(sseEncode('tool_start', {
              toolUseId: event.toolUseId,
              tool: event.tool,
              input: event.input,
            }));
          } else if (event.type === 'tool_result') {
            const existing = toolParts.find((p) => p.id === event.toolUseId);
            if (existing) {
              existing.status = event.ok ? 'done' : 'failed';
              existing.result = event.result as Record<string, unknown> | undefined;
              existing.error = event.error;
            }
            controller.enqueue(sseEncode('tool_result', {
              toolUseId: event.toolUseId,
              tool: event.tool,
              ok: event.ok,
              result: event.result,
              error: event.error,
            }));
          } else if (event.type === 'done') {
            inputTokens = event.inputTokens;
            outputTokens = event.outputTokens;
            costUsd = event.costUsd;
          } else if (event.type === 'error') {
            failed = true;
            errorMessage = event.message;
            controller.enqueue(sseEncode('error', { message: event.message }));
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
            tool_parts: toolParts,
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
