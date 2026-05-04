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
import { waitUntil } from '@vercel/functions';
import { checkUsage, incrementUsage } from '@/lib/billing/usage';
import { isChatDisabled, isMaintenanceMode } from '@/lib/admin/maintenance';

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

  const userEmail = user.email ?? "";
  const isAdminUser = userEmail === "rubengomezesp@gmail.com";

  // Kill switches (admin saltea)
  if (!isAdminUser) {
    if (await isMaintenanceMode()) {
      return NextResponse.json({ error: 'Maintenance mode — try again in a few minutes' }, { status: 503 });
    }
    if (await isChatDisabled()) {
      return NextResponse.json({ error: 'Chat is temporarily disabled. We are working on it.' }, { status: 503 });
    }

    const usage = await checkUsage(orgId, 'chat_messages');
    if (!usage.ok) {
      return NextResponse.json({
        error: usage.reason === 'no_subscription'
          ? 'Active subscription required. Please choose a plan.'
          : 'Monthly chat limit reached. Upgrade your plan to continue.',
        usage: { used: usage.used, limit: usage.limit, planId: usage.planId },
      }, { status: 402 });
    }
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
    model: body.model || 'claude-opus-4-7',
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
            
            // Convert messages with multimodal support
            type OAIContent = string | Array<
              | { type: 'text'; text: string }
              | { type: 'image_url'; image_url: { url: string } }
            >;
            const oaiMsgs: Array<{role: 'system'|'user'|'assistant'; content: OAIContent}> = messages.map(m => ({
              role: m.role as 'system' | 'user' | 'assistant',
              content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            }));
            
            // If user attached an image, inject into last user message
            if (body.imageBase64 && body.imageMimeType) {
              for (let i = oaiMsgs.length - 1; i >= 0; i--) {
                if (oaiMsgs[i].role === 'user') {
                  const txt = typeof oaiMsgs[i].content === 'string' 
                    ? oaiMsgs[i].content as string 
                    : '';
                  oaiMsgs[i].content = [
                    { type: 'text', text: txt || 'Analiza esta imagen' },
                    { type: 'image_url', image_url: { url: `data:${body.imageMimeType};base64,${body.imageBase64}` } },
                  ];
                  break;
                }
              }
            }
            
            // Define OpenAI function calling tools (mirror of Anthropic tools)
            const oaiTools = [
              {
                type: 'function' as const,
                function: {
                  name: 'generate_image',
                  description: 'Generate raw photorealistic images, photos, or illustrations WITHOUT text overlay, logo, or CTA. Use ONLY for plain image generation. DO NOT use this when user asks for an "ad", "publicidad", "anuncio", or "advertisement" — use create_ad for those.',
                  parameters: {
                    type: 'object',
                    properties: {
                      prompt: { type: 'string', description: 'Detailed image description: subject, composition, lighting, mood, colors, style. At least 20 words.' },
                      aspect_ratio: { type: 'string', enum: ['1:1','16:9','9:16','4:5','3:2'], description: 'Aspect ratio. Default 1:1.' },
                      num_images: { type: 'number', enum: [1,2,3,4], description: 'Number of variations. Default 1.' },
                    },
                    required: ['prompt'],
                  },
                },
              },
              {
                type: 'function' as const,
                function: {
                  name: 'create_ad',
                  description: 'Create a complete advertising piece (with copy, logo, CTA, audited) using the AD DIRECTOR pipeline. USE THIS — not generate_image — when the user asks for: "publicidad", "anuncio", "ad", "advertisement", "marketing piece", "creative", or any finished marketing asset. Auto-pulls brand logo and colors. Returns final ad image URLs ready to publish.',
                  parameters: {
                    type: 'object',
                    properties: {
                      user_prompt: { type: 'string', description: 'Faithful description of what the user wants the ad to communicate. Pass their original request.' },
                      formats: { type: 'array', items: { type: 'string', enum: ['9:16', '1:1', '4:5', '16:9'] }, description: 'Optional output formats. Pass multiple for variants (Story + Post + Feed).' },
                      preset_override: { type: 'string', enum: ['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo'], description: 'Optional style preset override when user explicitly requests a style.' },
                    },
                    required: ['user_prompt'],
                  },
                },
              },
            ];
            
            // Detect ad intent in user message → force create_ad tool
            const _userMsgForChoice = (body.message || '').toLowerCase();
            const _adKeywords = /\b(publicidad|anuncio|ad|advertisement|advert|creative|marketing\s+piece|ads)\b/i;
            const _isAdRequest = _adKeywords.test(_userMsgForChoice);
            const _forcedChoice = _isAdRequest
              ? { type: 'function' as const, function: { name: 'create_ad' } }
              : 'auto' as const;
            console.log('[chat:openai] tool_choice:', _isAdRequest ? 'create_ad (forced)' : 'auto', '| msg:', _userMsgForChoice.slice(0, 80));

            const firstCall = await oai.chat.completions.create({
              model: body.model || 'gpt-5.4',
              messages: oaiMsgs as never,
              tools: oaiTools,
              tool_choice: _forcedChoice,
              max_completion_tokens: 4096,
            });
            
            const choice = firstCall.choices[0];
            const toolCalls = choice?.message?.tool_calls ?? [];
            
            // CASE A: No tool — stream text response
            if (toolCalls.length === 0) {
              const stream = await oai.chat.completions.create({
                model: body.model || 'gpt-5.4',
                messages: oaiMsgs as never,
                stream: true,
                max_completion_tokens: 4096,
              });
              let oaiText = '';
              for await (const chunk of stream) {
                const d = chunk.choices[0]?.delta?.content || '';
                if (d) { oaiText += d; controller.enqueue(sseEncode('delta', { text: d })); }
              }
              await svc.from('messages').update({ content: oaiText, status: 'complete' } as never).eq('id', pendingMessageId);
              controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
              controller.close();
              return;
            }
            
            // CASE B: Tool call — execute tool, then stream final response
            const tcall = toolCalls[0];
            const tname = tcall.function?.name;
            
            if (tname === 'generate_image') {
              let toolArgs: { prompt?: string; aspect_ratio?: string; num_images?: number } = {};
              try { toolArgs = JSON.parse(tcall.function?.arguments || '{}'); } catch {}
              const imgPrompt = toolArgs.prompt || 'a product photo';
              const aspectRatio = toolArgs.aspect_ratio || '1:1';
              
              // Emit tool_start event (activates ImageGeneratingSkeleton in UI)
              const toolUseId = tcall.id || `gpt_img_${Date.now()}`;
              controller.enqueue(sseEncode('tool_start', {
                toolUseId,
                tool: 'image',
                input: { prompt: imgPrompt, aspect_ratio: aspectRatio },
              }));
              
              // Call internal image generation endpoint
              const cookieHeader = req.headers.get('cookie') || '';
              const origin = req.nextUrl.origin;
              try {
                // If user attached an image, pass it as reference for gpt-image-1
                const refImages = body.imageBase64 && body.imageMimeType
                  ? [{ data: body.imageBase64, mimeType: body.imageMimeType }]
                  : undefined;
                
                const imgRes = await fetch(`${origin}/api/images/generate`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
                  body: JSON.stringify({ 
                    prompt: imgPrompt, 
                    aspectRatio: aspectRatio,
                    model: 'gpt-image-2',
                    referenceImages: refImages,
                  }),
                });
                
                if (imgRes.ok) {
                  const imgData = await imgRes.json();
                  const url = imgData.url || imgData.urls?.[0];
                  if (url) {
                    // Emit tool_result event (skeleton replaced by actual image)
                    controller.enqueue(sseEncode('tool_result', {
                      toolUseId,
                      tool: 'image',
                      ok: true,
                      result: { urls: [url] },
                    }));
                    
                    await svc.from('messages').update({ content: `![Generated image](${url})`, status: 'complete' } as never).eq('id', pendingMessageId);
                    controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
                    controller.close();
                    return;
                  }
                }
                throw new Error('Image generation returned no URL');
              } catch (imgErr) {
                const errMsg = imgErr instanceof Error ? imgErr.message : 'Image generation failed';
                controller.enqueue(sseEncode('tool_result', {
                  toolUseId,
                  tool: 'image',
                  ok: false,
                  error: errMsg,
                }));
                await svc.from('messages').update({ content: `Image generation failed: ${errMsg}`, status: 'failed' } as never).eq('id', pendingMessageId);
                controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
                controller.close();
                return;
              }
            }
            
            if (tname === 'create_ad') {
              let toolArgs: { user_prompt?: string; formats?: string[]; preset_override?: string } = {};
              try { toolArgs = JSON.parse(tcall.function?.arguments || '{}'); } catch {}
              const userPrompt = toolArgs.user_prompt || '';

              const toolUseId = tcall.id || `gpt_ad_${Date.now()}`;
              controller.enqueue(sseEncode('tool_start', {
                toolUseId,
                tool: 'image',
                input: { prompt: 'Creating ad...' },
              }));

              const cookieHeader = req.headers.get('cookie') || '';
              const origin = req.nextUrl.origin;

              try {
                let logoUrl: string | undefined;
                let brandContext: { brand_name?: string; description?: string; vibe?: string } | undefined;
                try {
                  const { data: brand } = await svc.from('brand_profile')
                    .select('brand_name, description, vibe, logo_url')
                    .eq('org_id', orgId)
                    .maybeSingle();
                  if (brand) {
                    const b = brand as Record<string, unknown>;
                    logoUrl = b.logo_url ? String(b.logo_url) : undefined;
                    brandContext = {
                      brand_name: b.brand_name ? String(b.brand_name) : undefined,
                      description: b.description ? String(b.description) : undefined,
                      vibe: b.vibe ? String(b.vibe) : undefined,
                    };
                  }
                } catch { /* non-fatal */ }

                const _attachedImages = body.imageBase64 && body.imageMimeType
                  ? [{ base64: body.imageBase64, mimeType: body.imageMimeType }]
                  : undefined;
                console.log('[chat:openai] create_ad images:', _attachedImages ? _attachedImages.length : 0);

                const adRes = await fetch(`${origin}/api/ads/create`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', cookie: cookieHeader },
                  body: JSON.stringify({
                    userPrompt,
                    logoUrl,
                    brandContext,
                    images: _attachedImages,
                    formats: toolArgs.formats,
                    presetOverride: toolArgs.preset_override,
                    enableAudit: true,
                  }),
                });

                if (!adRes.ok) {
                  const errText = await adRes.text().catch(() => 'unknown');
                  throw new Error(`Ad pipeline failed (${adRes.status}): ${errText.slice(0, 200)}`);
                }

                const adData = await adRes.json() as {
                  results?: Array<{ format: string; url?: string; error?: string }>;
                  stages?: Array<{ stage: string; ok: boolean; error?: string }>;
                };
                const urls = (adData.results || []).filter((r) => r.url).map((r) => r.url as string);
                if (urls.length === 0) {
                  const fmtErrs = (adData.results || []).map((r) => `${r.format}=${r.error ?? 'no url'}`).join('; ');
                  const stgErrs = (adData.stages || []).filter((s) => !s.ok).map((s) => `${s.stage}=${s.error}`).join('; ');
                  throw new Error(`No ads produced. Formats[${fmtErrs}] Stages[${stgErrs || 'all ok'}]`);
                }

                controller.enqueue(sseEncode('tool_result', {
                  toolUseId,
                  tool: 'image',
                  ok: true,
                  result: { urls },
                }));

                const md = urls.map((u) => `![Ad](${u})`).join('\n\n');
                await svc.from('messages').update({ content: md, status: 'complete' } as never).eq('id', pendingMessageId);
                controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
                controller.close();
                return;
              } catch (adErr) {
                const errMsg = adErr instanceof Error ? adErr.message : 'Ad creation failed';
                controller.enqueue(sseEncode('tool_result', { toolUseId, tool: 'image', ok: false, error: errMsg }));
                await svc.from('messages').update({ content: `Ad creation failed: ${errMsg}`, status: 'failed' } as never).eq('id', pendingMessageId);
                controller.enqueue(sseEncode('done', { assistantMessageId: pendingMessageId, conversationId, isNewConversation: isNew }));
                controller.close();
                return;
              }
            }

            // Unknown tool — fallback to text
            const fallbackMsg = choice.message?.content || 'I tried to use a tool but it is not available.';
            controller.enqueue(sseEncode('delta', { text: fallbackMsg }));
            await svc.from('messages').update({ content: fallbackMsg, status: 'complete' } as never).eq('id', pendingMessageId);
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
            const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
            if (!apiKey) {
              throw new Error('GOOGLE_API_KEY or GEMINI_API_KEY not configured');
            }
            const genAI = new GoogleGenerativeAI(apiKey);
            const requestedModel = body.model || 'gemini-2.5-flash';
            // Strip any -preview/-experimental suffixes that might 404
            const cleanModel = requestedModel.replace(/-preview$|-experimental$/, '');
            const gemModel = genAI.getGenerativeModel({ model: cleanModel });
            // Build system instruction in Gemini Content format (not raw string)
            const sysMsgRaw = messages
              .filter(m => m.role === 'system')
              .map(m => typeof m.content === 'string' ? m.content : '')
              .join('\n\n')
              .trim();
            // Gemini caps system_instruction. Trim to safe length and use Content shape.
            const SYS_MAX = 8000;
            const sysMsg = sysMsgRaw.length > SYS_MAX
              ? sysMsgRaw.slice(0, SYS_MAX)
              : sysMsgRaw;
            
            type GemPart = { text: string } | { inlineData: { mimeType: string; data: string } };
            const chatMsgs: Array<{ role: 'user' | 'model'; parts: GemPart[] }> = messages
              .filter(m => m.role !== 'system')
              .map(m => ({
                role: m.role === 'assistant' ? 'model' as const : 'user' as const,
                parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
              }));
            const lastMsg = chatMsgs.pop();
            
            // If user attached an image, append it to last message parts
            if (lastMsg && body.imageBase64 && body.imageMimeType && lastMsg.role === 'user') {
              lastMsg.parts.push({
                inlineData: {
                  mimeType: body.imageMimeType,
                  data: body.imageBase64,
                },
              });
            }
            
            // Use Content object format (not bare string) for systemInstruction
            const systemInstructionConfig = sysMsg
              ? { role: 'system' as const, parts: [{ text: sysMsg }] }
              : undefined;
            
            const chat = gemModel.startChat({
              history: chatMsgs,
              systemInstruction: systemInstructionConfig,
            });
            const gemStream = await chat.sendMessageStream(lastMsg?.parts as never || [{ text: '' }]);
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

        await incrementUsage(orgId, 'chat_messages');

        // Memoria en background — no bloquea respuesta al usuario
        if (!failed && queryText) {
          const userId = user.id;
          const orgIdLocal = orgId;
          const conversationIdLocal = conversationId;
          const queryTextLocal = queryText;
          const fullTextLocal = fullText;
          waitUntil((async () => {
            try {
              const mode: 'explicit' | 'auto' = isExplicitMemoryRequest(queryTextLocal) ? 'explicit' : 'auto';
              const extracted = await extractMemoryFromTurn({
                userMessage: queryTextLocal,
                assistantReply: fullTextLocal,
                mode,
              });
              if (extracted.length > 0) {
                await svc.from('memories').insert(
                  extracted.map((m) => ({
                    org_id: orgIdLocal,
                    user_id: userId,
                    content: m.content,
                    category: m.category,
                    importance: m.importance,
                    source: mode,
                    source_conversation_id: conversationIdLocal,
                  })) as never
                );
                console.log('[memory:bg] saved', extracted.length, 'memories');
              }
            } catch (e) {
              console.error('[memory:bg] failed:', e);
            }
          })());
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
