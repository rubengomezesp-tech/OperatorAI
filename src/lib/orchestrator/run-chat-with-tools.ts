import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TOOL_SPECS, executeTool } from '@/lib/chat/tools';
import type { ToolKind } from '@/lib/chat/tools';
import type { ChatMessage } from '@/lib/providers';

const MODEL = 'claude-sonnet-4-5';
const MAX_TOOL_LOOPS = 5;
const INPUT_USD_PER_MTOKEN = 3;
const OUTPUT_USD_PER_MTOKEN = 15;

export type ToolStreamEvent =
  | { type: 'text'; value: string }
  | { type: 'tool_start'; tool: ToolKind; toolUseId: string; input: Record<string, unknown> }
  | {
      type: 'tool_result';
      tool: ToolKind;
      toolUseId: string;
      ok: boolean;
      result?: {
        urls?: string[];
        videoUrl?: string;
        thumbnailUrl?: string;
        text?: string;
        sources?: Array<{ title: string; id: string }>;
      };
      error?: string;
    }
  | { type: 'done'; inputTokens: number; outputTokens: number; costUsd: number }
  | { type: 'error'; message: string };

interface RunArgs {
  messages: ChatMessage[];
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  assistantId: string;
  origin: string;
  cookieHeader: string;
  /** Base64-encoded image attached by the user */
  imageBase64?: string;
  /** MIME type of attached image, e.g. image/jpeg */
  imageMimeType?: string;
  signal?: AbortSignal;
}

export async function* runChatWithTools(args: RunArgs): AsyncIterable<ToolStreamEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'ANTHROPIC_API_KEY missing on server' };
    return;
  }
  const client = new Anthropic({ apiKey });

  const systemBlocks = args.messages.filter((m) => m.role === 'system');
  const chatBlocks = args.messages.filter((m) => m.role !== 'system');

  const systemText =
    systemBlocks.map((m) => m.content).join('\n\n') +
    '\n\n<agent_behavior>You are Operator, a world-class AI creative director, brand strategist, and autonomous operations agent. EXPERTISE: Brand Strategy, Creative Direction, Copywriting, Marketing, Visual Production, Data Analytics. RULES: 1) When user asks for visuals, CALL the tool immediately. 2) Write image prompts of 40-80 words. Be EXTREMELY precise: specify exact subject, camera lens (mm), aperture, lighting setup (key/fill/rim), specific colors (hex or name), composition technique, texture, mood. For logos: specify style (wordmark/emblem/abstract), typography style, symbol details, color scheme, background. NEVER generate random text or letters unless explicitly asked. 3) When user asks for variations, set num_images to 2-4. 4) Match user language Spanish or English. 5) After generating, describe briefly and suggest refinements. 6) NEVER include image URLs in text. 7) NEVER tell user to go elsewhere. 8) If user attaches images, analyze them in detail. 9) Be proactive, suggest improvements. 10) Personality: confident, creative, direct, inspiring. 11) AD vs IMAGE: When the user asks for an "ad", "publicidad", "anuncio", "advertisement", "creative", or wants a finished marketing asset with copy/logo/CTA, ALWAYS use the create_ad tool. Use the image tool ONLY for raw images/photos/illustrations without text overlay.</agent_behavior>';

  // Build conversation. The last user message may include an image attachment.
  const convo: Anthropic.MessageParam[] = [];

  for (let i = 0; i < chatBlocks.length; i++) {
    const m = chatBlocks[i];
    const isLastUser = m.role === 'user' && i === chatBlocks.length - 1;

    if (isLastUser && args.imageBase64 && args.imageMimeType) {
      // Attach image to the last user message as a vision content block
      convo.push({
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: args.imageMimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: args.imageBase64,
            },
          },
          { type: 'text', text: m.content },
        ],
      });
    } else {
      convo.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      });
    }
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Detect ad intent in last user message → force create_ad on first turn
  const _lastUserText = (() => {
    for (let i = convo.length - 1; i >= 0; i--) {
      const m = convo[i];
      if (m.role !== 'user') continue;
      if (typeof m.content === 'string') return m.content.toLowerCase();
      if (Array.isArray(m.content)) {
        for (const blk of m.content) {
          if (blk.type === 'text' && typeof (blk as { text?: string }).text === 'string') {
            return (blk as { text: string }).text.toLowerCase();
          }
        }
      }
      return '';
    }
    return '';
  })();
  const _adKeywords = /\b(publicidad|anuncio|ad|advertisement|advert|creative|marketing\s+piece|ads)\b/i;
  const _isAdRequest = _adKeywords.test(_lastUserText);

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    const _toolChoice: Anthropic.MessageCreateParams.ToolChoiceTool | Anthropic.MessageCreateParams.ToolChoiceAuto =
      (loop === 0 && _isAdRequest)
        ? { type: 'tool', name: 'create_ad' }
        : { type: 'auto' };

    if (loop === 0) {
      console.log('[chat:anthropic] tool_choice:', _isAdRequest ? 'create_ad (forced)' : 'auto', '| msg:', _lastUserText.slice(0, 80));
    }

    let stream: Awaited<ReturnType<typeof client.messages.stream>>;
    try {
      stream = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 4000,
          system: systemText,
          tools: TOOL_SPECS.map((t) => ({
            name: t.name,
            description: t.description,
            input_schema: t.input_schema as Anthropic.Tool.InputSchema,
          })),
          tool_choice: _toolChoice,
          messages: convo,
        },
        { signal: args.signal },
      );
    } catch (e) {
      yield { type: 'error', message: e instanceof Error ? e.message : 'Claude stream failed' };
      return;
    }

    const pendingToolUses: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
    let currentToolUse: { id: string; name: string; partialJson: string } | null = null;

    try {
      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          const block = event.content_block;
          if (block.type === 'tool_use') {
            currentToolUse = { id: block.id, name: block.name, partialJson: '' };
            yield { type: 'tool_start', tool: block.name as ToolKind, toolUseId: block.id, input: {} };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield { type: 'text', value: event.delta.text };
          } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
            currentToolUse.partialJson += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop' && currentToolUse) {
          let parsedInput: Record<string, unknown> = {};
          try { parsedInput = currentToolUse.partialJson ? JSON.parse(currentToolUse.partialJson) : {}; } catch {}
          pendingToolUses.push({ id: currentToolUse.id, name: currentToolUse.name, input: parsedInput });
          currentToolUse = null;
        }
      }
    } catch (e) {
      yield { type: 'error', message: e instanceof Error ? e.message : 'Claude stream error' };
      return;
    }

    let finalMessage: Anthropic.Message;
    try { finalMessage = await stream.finalMessage(); } catch (e) {
      yield { type: 'error', message: e instanceof Error ? e.message : 'Failed to finalize' };
      return;
    }

    totalInputTokens += finalMessage.usage.input_tokens ?? 0;
    totalOutputTokens += finalMessage.usage.output_tokens ?? 0;

    if (pendingToolUses.length === 0) {
      const costUsd = (totalInputTokens / 1_000_000) * INPUT_USD_PER_MTOKEN + (totalOutputTokens / 1_000_000) * OUTPUT_USD_PER_MTOKEN;
      yield { type: 'done', inputTokens: totalInputTokens, outputTokens: totalOutputTokens, costUsd };
      return;
    }

    convo.push({ role: 'assistant', content: finalMessage.content });

    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
    for (const use of pendingToolUses) {
      const toolLabel = use.name === 'image' ? '◐' : use.name === 'video' ? '◐' : use.name === 'file_analysis' ? '◐' : '◐';
      const toolAction = use.name === 'image' ? 'Generating image' : use.name === 'video' ? 'Rendering video' : use.name === 'file_analysis' ? 'Analyzing' : 'Searching';
      yield { type: 'text', value: '\n\n---\n\n' };

      const execResult = await executeTool(use.name as ToolKind, use.input, {
        svc: args.svc,
        orgId: args.orgId,
        userId: args.userId,
        assistantId: args.assistantId,
        origin: args.origin,
        cookieHeader: args.cookieHeader,
        signal: args.signal,
        attachedImages: args.imageBase64 && args.imageMimeType
          ? [{ base64: args.imageBase64, mimeType: args.imageMimeType }]
          : undefined,
      });

      yield {
        type: 'tool_result',
        tool: use.name as ToolKind,
        toolUseId: use.id,
        ok: execResult.ok,
        result: execResult.result,
        error: execResult.error,
      };

      // Inject result as markdown into the text stream
      if (execResult.ok) {
        if (use.name === 'image' && execResult.result?.urls) {
          for (const url of execResult.result.urls) {
            yield { type: 'text', value: '\n\n![Generated image](' + url + ')\n\n' };
          }
          yield { type: 'text', value: '[⬇ Download image](' + execResult.result.urls[0] + ')\n\n' };
        } else if (use.name === 'video' && execResult.result?.videoUrl) {
          yield { type: 'text', value: '\n\n🎬 **Video generated:** [▶ Watch / Download](' + execResult.result.videoUrl + ')\n\n' };
        } else if (use.name === 'file_analysis' && execResult.result?.text) {
          yield { type: 'text', value: '\n\n> 📊 **Analysis result:**\n>\n> ' + execResult.result.text.split('\n').join('\n> ') + '\n\n' };
        } else if (use.name === 'knowledge_search' && execResult.result?.text) {
          yield { type: 'text', value: '\n\n> 📚 **From your knowledge base:**\n>\n> ' + execResult.result.text.split('\n').join('\n> ') + '\n\n' };
        }
      } else {
        yield { type: 'text', value: '\n\n> ⚠️ *' + (execResult.error ?? 'Tool execution failed') + '*\n\n' };
      }

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: execResult.ok
          ? JSON.stringify({ success: true, ...(execResult.result ?? {}), note: 'Result already displayed inline to the user. Do NOT repeat URLs or embed images. Continue naturally.' })
          : JSON.stringify({ success: false, error: execResult.error ?? 'Failed' }),
        is_error: !execResult.ok,
      });
    }

    convo.push({ role: 'user', content: toolResultBlocks });
  }

  yield { type: 'error', message: 'Max tool loops reached.' };
}
