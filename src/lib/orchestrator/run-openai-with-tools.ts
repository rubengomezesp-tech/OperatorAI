/**
 * runOpenAIWithTools — OpenAI runner unificado
 * 
 * Drop-in replacement compatible con runChatWithTools (Anthropic).
 * Misma firma de eventos, mismo brain-bridge, mismas tools.
 * 
 * Diferencias vs runChatWithTools:
 *   - Provider: OpenAI Chat Completions API
 *   - Tools: function calling estilo OpenAI
 *   - Forced tool_choice cuando detecta intent de ad
 * 
 * Iguales:
 *   - executeTool() de tools.ts (mismo brain-bridge)
 *   - userImages viajan correctamente
 *   - Streaming SSE compatible con UI
 *   - Manejo de errores y telemetría
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { executeTool } from '@/lib/chat/tools';
import type { ToolKind } from '@/lib/chat/tools';
import type { ChatMessage } from '@/lib/providers';

const DEFAULT_MODEL = 'gpt-5.4';
const MAX_TOOL_LOOPS = 5;
const INPUT_USD_PER_MTOKEN = 2.5;
const OUTPUT_USD_PER_MTOKEN = 10;

// ─── Tipos de eventos (mismos que runChatWithTools) ──────────────────
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
  model?: string;
  imageBase64?: string;
  imageMimeType?: string;
  signal?: AbortSignal;
}

// ─── Tool schemas (estilo OpenAI function calling) ────────────────────
const OPENAI_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_ad',
      description:
        'CREATE AN ADVERTISEMENT — finished marketing asset with copy, logo, and CTA. CALL THIS WHEN USER SAYS: "crea un anuncio", "publicidad", "hazme un ad", "anuncio para [marca]", "campaña", "ad", "advertisement", "promociona", "banner", "creativo". DO NOT CALL knowledge_search or generate_image for advertising — THIS is the only tool for ads. Auto-pulls brand logo, colors, and uses brain-bridge with DNA system for premium quality.',
      parameters: {
        type: 'object',
        properties: {
          user_prompt: {
            type: 'string',
            description: "Faithful description of what the user wants the ad to communicate. Pass their original request verbatim or summarized.",
          },
          formats: {
            type: 'array',
            items: { type: 'string', enum: ['9:16', '1:1', '4:5', '16:9'] },
            description: 'Output formats. Pass multiple for variants (Story + Post + Feed).',
          },
          preset_override: {
            type: 'string',
            enum: ['luxury-minimal', 'aggressive', 'clean-conversion', 'product-demo'],
            description: 'Optional style preset override when user explicitly requests a style.',
          },
        },
        required: ['user_prompt'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'image',
      description:
        'Generate raw photorealistic images, photos, or illustrations WITHOUT text overlay, logo, or CTA. Use ONLY for plain image generation (e.g. "show me a photo of a cat", "generate an illustration"). DO NOT use this when user asks for an ad/publicidad/anuncio — use create_ad instead.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed image description: subject, composition, lighting, mood, colors, style. At least 20 words.',
          },
          aspect_ratio: {
            type: 'string',
            enum: ['1:1', '16:9', '9:16', '4:5', '3:2'],
            description: 'Aspect ratio. Default 1:1.',
          },
          num_images: {
            type: 'number',
            enum: [1, 2, 3, 4],
            description: 'Number of variations. Default 1.',
          },
        },
        required: ['prompt'],
      },
    },
  },
];

// ─── Detección de intent de ad para forzar tool ──────────────────────
const AD_INTENT_RX = /\b(publicidad|anuncio|anuncia|ad|advertisement|advert|creative|marketing\s+piece|ads|campa[ñn]a|banner|pieza\s+publicitaria|promociona|promotion)\b/i;

function detectAdIntent(messages: ChatMessage[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return false;
  const txt = typeof lastUser.content === 'string' ? lastUser.content : '';
  return AD_INTENT_RX.test(txt);
}

// ─── Conversión de mensajes al formato OpenAI ─────────────────────────
type OAIContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

interface OAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: OAIContent;
  tool_calls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
  name?: string;
}

function convertMessages(args: RunArgs): OAIMessage[] {
  const out: OAIMessage[] = args.messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));

  // Inyectar imagen adjunta en el último mensaje user
  if (args.imageBase64 && args.imageMimeType) {
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].role === 'user') {
        const txt = typeof out[i].content === 'string' ? (out[i].content as string) : '';
        out[i].content = [
          { type: 'text', text: txt || 'Analiza esta imagen' },
          {
            type: 'image_url',
            image_url: {
              url: `data:${args.imageMimeType};base64,${args.imageBase64}`,
            },
          },
        ];
        break;
      }
    }
  }

  return out;
}

// ─── Runner principal ────────────────────────────────────────────────
export async function* runOpenAIWithTools(args: RunArgs): AsyncIterable<ToolStreamEvent> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    yield { type: 'error', message: 'OPENAI_API_KEY missing on server' };
    return;
  }

  const oai = new OpenAI({ apiKey });
  const model = args.model ?? DEFAULT_MODEL;
  const oaiMessages = convertMessages(args);

  const isAdRequest = detectAdIntent(args.messages);
  const toolChoice = isAdRequest
    ? ({ type: 'function' as const, function: { name: 'create_ad' } })
    : ('auto' as const);

  console.log(
    '[runOpenAI] tool_choice:',
    isAdRequest ? 'create_ad (forced)' : 'auto',
    '| model:',
    model,
  );

  let totalInput = 0;
  let totalOutput = 0;
  let loopCount = 0;

  while (loopCount < MAX_TOOL_LOOPS) {
    loopCount++;

    // ── Llamada al modelo (no streaming en primer turno para detectar tools) ──
    const completion = await oai.chat.completions.create({
      model,
      messages: oaiMessages as never,
      tools: OPENAI_TOOLS,
      tool_choice: loopCount === 1 ? toolChoice : 'auto',
      max_completion_tokens: 4096,
    });

    if (completion.usage) {
      totalInput += completion.usage.prompt_tokens ?? 0;
      totalOutput += completion.usage.completion_tokens ?? 0;
    }

    const choice = completion.choices[0];
    const message = choice?.message;
    if (!message) {
      yield { type: 'error', message: 'OpenAI returned no message' };
      return;
    }

    const toolCalls = message.tool_calls ?? [];

    // ── CASO A: No hay tool calls — emitir texto ──
    if (toolCalls.length === 0) {
      const text = message.content ?? '';
      if (text) {
        yield { type: 'text', value: text };
      }
      const costUsd =
        (totalInput * INPUT_USD_PER_MTOKEN + totalOutput * OUTPUT_USD_PER_MTOKEN) / 1_000_000;
      yield {
        type: 'done',
        inputTokens: totalInput,
        outputTokens: totalOutput,
        costUsd,
      };
      return;
    }

    // ── CASO B: Hay tool calls — emitir texto previo si lo hubiera ──
    if (message.content) {
      yield { type: 'text', value: message.content };
    }

    // Push assistant message con tool_calls al historial
    oaiMessages.push({
      role: 'assistant',
      content: message.content ?? '',
      tool_calls: toolCalls,
    });

    // ── Ejecutar cada tool call ──
    for (const tcall of toolCalls) {
      const toolName = tcall.function?.name as ToolKind | undefined;
      if (!toolName) continue;

      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(tcall.function?.arguments || '{}');
      } catch {
        toolArgs = {};
      }

      const toolUseId = tcall.id || `oai_tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      yield {
        type: 'tool_start',
        tool: toolName,
        toolUseId,
        input: toolArgs,
      };

      // ── Ejecutar via executeTool (brain-bridge unificado) ──
      const ctx = {
        svc: args.svc,
        orgId: args.orgId,
        userId: args.userId,
        assistantId: args.assistantId,
        origin: args.origin,
        cookieHeader: args.cookieHeader,
        signal: args.signal,
        attachedImages:
          args.imageBase64 && args.imageMimeType
            ? [{ base64: args.imageBase64, mimeType: args.imageMimeType }]
            : undefined,
      };

      const execResult = await executeTool(toolName, toolArgs, ctx);

      yield {
        type: 'tool_result',
        tool: toolName,
        toolUseId,
        ok: execResult.ok,
        result: execResult.ok ? (execResult.result as { urls?: string[]; videoUrl?: string; thumbnailUrl?: string; text?: string; sources?: Array<{ title: string; id: string }> }) : undefined,
        error: execResult.ok ? undefined : execResult.error,
      };

      // Push tool result al historial para que el modelo lo vea
      oaiMessages.push({
        role: 'tool',
        tool_call_id: toolUseId,
        content: JSON.stringify(
          execResult.ok ? execResult.result : { error: execResult.error },
        ),
      });

      // Si fue create_ad y salió bien → cerrar turno (no segundo loop)
      if (toolName === 'create_ad' && execResult.ok) {
        console.log('[runOpenAI] create_ad success — ending turn');
        const costUsd =
          (totalInput * INPUT_USD_PER_MTOKEN + totalOutput * OUTPUT_USD_PER_MTOKEN) / 1_000_000;
        yield {
          type: 'done',
          inputTokens: totalInput,
          outputTokens: totalOutput,
          costUsd,
        };
        return;
      }
    }

    // ── Continuar bucle: próximo loop modelo ve tool_results y cierra turno ──
  }

  // Si llegamos aquí es por max loops alcanzado
  console.warn('[runOpenAI] max tool loops reached');
  const costUsd =
    (totalInput * INPUT_USD_PER_MTOKEN + totalOutput * OUTPUT_USD_PER_MTOKEN) / 1_000_000;
  yield {
    type: 'done',
    inputTokens: totalInput,
    outputTokens: totalOutput,
    costUsd,
  };
}
