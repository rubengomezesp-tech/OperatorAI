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
    '\n\n<agent_behavior>\nYou are the Operator agent. When the user asks for visual output (image, video, illustration, photo), or to analyze their files, or to look up their knowledge base — YOU execute the tool yourself. Do NOT tell the user to go to another page, use another tool, or visit any external service. Briefly say what you are about to do, then call the tool. After the tool result, describe what was generated and ask if they want changes. Match the user language (Spanish or English). ALWAYS use your tools when the user asks for images, videos, file analysis, or knowledge search. You HAVE the capability. IMPORTANT: After the tool executes, do NOT include image URLs or links in your text. The images are already displayed to the user automatically by the system.\nIf the user attaches an image, analyze it and respond about what you see. You can also use the image as context for generating new images or content.\n</agent_behavior>';

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

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
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
      const toolLabel = use.name === 'image' ? '🎨' : use.name === 'video' ? '🎬' : use.name === 'file_analysis' ? '📊' : '📚';
      const toolAction = use.name === 'image' ? 'Generating image' : use.name === 'video' ? 'Rendering video' : use.name === 'file_analysis' ? 'Analyzing file' : 'Searching knowledge';
      yield { type: 'text', value: '\n\n> ' + toolLabel + ' *' + toolAction + '...*\n\n' };

      const execResult = await executeTool(use.name as ToolKind, use.input, {
        svc: args.svc,
        orgId: args.orgId,
        userId: args.userId,
        assistantId: args.assistantId,
        origin: args.origin,
        cookieHeader: args.cookieHeader,
        signal: args.signal,
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
