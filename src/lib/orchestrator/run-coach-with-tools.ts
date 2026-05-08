/**
 * run-coach-with-tools.ts
 *
 * Reemplaza a Claude/GPT como cerebro principal con tu modelo local
 * Operator-Qwen14B (entrenado con tu voz). Mantiene toda la infraestructura
 * de tools, brand-bridge, jobs, streaming SSE y billing.
 *
 * Flujo:
 *   1. Construye prompt con master prompt + brand context + tool specs
 *   2. Llama a tu coach local (localhost:1234) en streaming
 *   3. Acumula la respuesta y detecta <tool_call>{...}</tool_call>
 *   4. Si hay tool_call → ejecuta la tool real con tu infraestructura
 *   5. Inyecta el resultado de vuelta al coach con un mensaje system
 *   6. El coach genera el texto final natural con el resultado
 *   7. Mantiene el contrato de eventos idéntico a runChatWithTools
 *      (text / tool_start / tool_result / done / error)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { TOOL_SPECS, executeTool, type ToolKind } from '@/lib/chat/tools';
import type { ChatMessage } from '@/lib/providers';
import { OPERATOR_MASTER_PROMPT } from '@/lib/models/operator-prompt';

const COACH_URL = process.env.LOCAL_OPERATOR_URL || 'http://localhost:1234';
const COACH_MODEL = process.env.LOCAL_OPERATOR_MODEL || 'operator-qwen14b';
const MAX_TOOL_LOOPS = 4;

export type CoachStreamEvent =
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

interface RunCoachArgs {
  messages: ChatMessage[];
  svc: SupabaseClient;
  orgId: string;
  userId: string;
  assistantId: string;
  origin: string;
  cookieHeader: string;
  imageBase64?: string;
  imageMimeType?: string;
  signal?: AbortSignal;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ParsedToolCall {
  id: string;
  name: ToolKind;
  input: Record<string, unknown>;
  rawTagStart: number;
  rawTagEnd: number;
}

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Construye el bloque de instrucciones de tools para el coach,
 * basándose en TOOL_SPECS de tu app.
 */
function buildToolsBlock(): string {
  const specs = TOOL_SPECS.map((t) => {
    return `- **${t.name}**: ${t.description.split('.')[0]}.`;
  }).join('\n');

  return `## TOOLS DISPONIBLES EN ESTA SESIÓN

Tienes acceso a las siguientes tools de OperatorAI. Cuando el usuario pida una acción ejecutable, responde ÚNICAMENTE con un bloque tool_call en este formato exacto:

<tool_call>{"name": "NOMBRE_TOOL", "arguments": {...}}</tool_call>

Tools disponibles:
${specs}

REGLAS DE INVOCACIÓN:
- Para "anuncio", "publicidad", "ad" finalizado → usa create_ad con user_prompt detallado.
- Para imagen suelta sin texto/CTA → usa image.
- Para vídeo → usa video.
- Para preguntar a documentos del usuario → usa knowledge_search.
- Para conocer la marca antes de crear → usa get_brand_assets PRIMERO si necesitas info.
- Cuando uses image: el campo prompt debe tener 40-80 palabras describiendo cámara, luz, color, composición.
- Si el usuario adjunta una imagen y pide editarla, pasa reference_image_url al campo correspondiente.
- NUNCA inventes tools que no están en la lista.
- Si la petición es ambigua, pregunta antes de ejecutar.
- Si el usuario solo conversa, NO uses tools — responde con tu voz natural.

DESPUÉS DE QUE SE EJECUTE LA TOOL: recibirás el resultado. Comenta brevemente lo entregado con tu voz (1-3 frases), sin pegar URLs ni repetir lo que ya se mostró inline al usuario.`;
}

/**
 * Construye los mensajes para enviar al coach combinando:
 *  - master prompt (identidad fija)
 *  - tools block (dinámico)
 *  - system prompts del flow original
 *  - historial conversacional
 */
function buildCoachMessages(args: RunCoachArgs): OpenAIMessage[] {
  const result: OpenAIMessage[] = [];

  // 1. Master prompt (identidad inmutable de OperatorAI)
  let systemContent = OPERATOR_MASTER_PROMPT;

  // 2. System prompts del flow original (brand, RAG, memoria, voz, etc.)
  const incomingSystem = args.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  if (incomingSystem.trim()) {
    systemContent += `\n\n## CONTEXTO DEL FLOW (RAG, BRAND, MEMORIA)\n${incomingSystem}`;
  }

  // 3. Tools block
  systemContent += `\n\n${buildToolsBlock()}`;

  result.push({ role: 'system', content: systemContent });

  // 4. Historial — solo user/assistant
  for (const m of args.messages) {
    if (m.role === 'system') continue;
    result.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  // Nota sobre imágenes: el modelo local no es multimodal todavía.
  // Si hay imagen adjunta, dejamos un texto plano describiendo el adjunto
  // para que el coach sepa que existe y la pase a las tools si aplica.
  if (args.imageBase64 && args.imageMimeType) {
    const last = result[result.length - 1];
    if (last?.role === 'user') {
      last.content = `${last.content}\n\n[El usuario ha adjuntado una imagen. Si la acción lo requiere, las tools recibirán automáticamente la imagen como referencia.]`;
    }
  }

  return result;
}

/**
 * Detecta y parsea el primer <tool_call>{...}</tool_call> en el texto acumulado.
 */
function parseFirstToolCall(text: string): ParsedToolCall | null {
  const match = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match || match.index === undefined) return null;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed !== 'object' || parsed === null || !parsed.name) return null;

    return {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: parsed.name as ToolKind,
      input: (parsed.arguments || {}) as Record<string, unknown>,
      rawTagStart: match.index,
      rawTagEnd: match.index + match[0].length,
    };
  } catch {
    return null;
  }
}

/**
 * Llama al coach local en modo streaming OpenAI-compatible y va emitiendo
 * los deltas de texto. Acumula todo el output para detectar tool_calls al final.
 */
async function* streamFromCoach(
  messages: OpenAIMessage[],
  signal?: AbortSignal,
): AsyncGenerator<{ type: 'delta'; value: string } | { type: 'final'; full: string; usage: { prompt: number; completion: number } }> {
  const res = await fetch(`${COACH_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: COACH_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1500,
      stream: true,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => 'unknown');
    throw new Error(`Coach HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';
  let usage = { prompt: 0, completion: 0 };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;

      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length) {
          full += delta;
          yield { type: 'delta', value: delta };
        }
        if (json.usage) {
          usage = {
            prompt: json.usage.prompt_tokens ?? 0,
            completion: json.usage.completion_tokens ?? 0,
          };
        }
      } catch {
        /* ignore malformed chunks */
      }
    }
  }

  yield { type: 'final', full, usage };
}

/* -------------------------------------------------------------------------- */
/*  Main runner                                                                */
/* -------------------------------------------------------------------------- */

export async function* runCoachWithTools(
  args: RunCoachArgs,
): AsyncIterable<CoachStreamEvent> {
  const messages = buildCoachMessages(args);

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let createdAdAlready = false;

  for (let loop = 0; loop < MAX_TOOL_LOOPS; loop++) {
    let preToolText = '';
    let fullResponse = '';
    let usageThisRound = { prompt: 0, completion: 0 };
    let detectedToolCall: ParsedToolCall | null = null;
    let inToolCallTag = false;

    try {
      for await (const evt of streamFromCoach(messages, args.signal)) {
        if (evt.type === 'final') {
          fullResponse = evt.full;
          usageThisRound = evt.usage;
          break;
        }

        // evt.type === 'delta'
        const delta = evt.value;
        fullResponse += delta;

        // Detectamos si entramos/salimos de un tool_call para no streamear basura
        if (!inToolCallTag) {
          if (fullResponse.includes('<tool_call>')) {
            // El delta actual o uno anterior abrió la tag; pintamos solo lo previo
            const idx = fullResponse.indexOf('<tool_call>');
            const newPre = fullResponse.slice(0, idx);
            const toEmit = newPre.slice(preToolText.length);
            if (toEmit) yield { type: 'text', value: toEmit };
            preToolText = newPre;
            inToolCallTag = true;
          } else {
            // Stream normal hacia el cliente
            yield { type: 'text', value: delta };
            preToolText = fullResponse;
          }
        }
        // Si estamos dentro de la tag, esperamos al cierre antes de hacer nada
      }
    } catch (e) {
      yield {
        type: 'error',
        message: e instanceof Error ? e.message : 'Coach stream failed',
      };
      return;
    }

    totalPromptTokens += usageThisRound.prompt;
    totalCompletionTokens += usageThisRound.completion;

    detectedToolCall = parseFirstToolCall(fullResponse);

    // ── No hay tool: respuesta natural completa, fin del turno ──
    if (!detectedToolCall) {
      yield {
        type: 'done',
        inputTokens: totalPromptTokens,
        outputTokens: totalCompletionTokens,
        costUsd: 0, // local model = $0
      };
      return;
    }

    // ── Bloqueo de duplicados de create_ad en el mismo turno ──
    if (detectedToolCall.name === 'create_ad' && createdAdAlready) {
      yield { type: 'text', value: '\n\n---\n\n*(Anuncio ya generado en este turno.)*' };
      yield {
        type: 'done',
        inputTokens: totalPromptTokens,
        outputTokens: totalCompletionTokens,
        costUsd: 0,
      };
      return;
    }

    // ── Notificar inicio de tool ──
    yield {
      type: 'tool_start',
      tool: detectedToolCall.name,
      toolUseId: detectedToolCall.id,
      input: detectedToolCall.input,
    };

    yield { type: 'text', value: '\n\n---\n\n' };

    // ── Ejecutar tool real con tu infraestructura ──
    const execResult = await executeTool(detectedToolCall.name, detectedToolCall.input, {
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
    });

    yield {
      type: 'tool_result',
      tool: detectedToolCall.name,
      toolUseId: detectedToolCall.id,
      ok: execResult.ok,
      result: execResult.result,
      error: execResult.error,
    };

    // ── Render inline del resultado para el usuario ──
    if (execResult.ok) {
      if (detectedToolCall.name === 'image' && execResult.result?.urls?.length) {
        for (const url of execResult.result.urls) {
          yield { type: 'text', value: `\n\n![Imagen generada](${url})\n\n` };
        }
        yield { type: 'text', value: `[⬇ Descargar](${execResult.result.urls[0]})\n\n` };
      } else if (detectedToolCall.name === 'video' && execResult.result?.videoUrl) {
        yield {
          type: 'text',
          value: `\n\n🎬 **Vídeo generado:** [▶ Ver / Descargar](${execResult.result.videoUrl})\n\n`,
        };
      } else if (detectedToolCall.name === 'create_ad' && execResult.result?.urls?.length) {
        for (const url of execResult.result.urls) {
          yield { type: 'text', value: `\n\n![Anuncio](${url})\n\n` };
        }
        yield { type: 'text', value: `[⬇ Descargar anuncio](${execResult.result.urls[0]})\n\n` };
        createdAdAlready = true;
      } else if (detectedToolCall.name === 'compose_ad' && execResult.result?.urls?.length) {
        yield { type: 'text', value: `\n\n![Anuncio compuesto](${execResult.result.urls[0]})\n\n` };
      } else if (detectedToolCall.name === 'file_analysis' && execResult.result?.text) {
        yield {
          type: 'text',
          value: `\n\n> 📊 **Análisis:**\n>\n> ${execResult.result.text.split('\n').join('\n> ')}\n\n`,
        };
      } else if (detectedToolCall.name === 'knowledge_search' && execResult.result?.text) {
        yield {
          type: 'text',
          value: `\n\n> 📚 **De tu knowledge base:**\n>\n> ${execResult.result.text.split('\n').join('\n> ')}\n\n`,
        };
      } else if (detectedToolCall.name === 'get_brand_assets' && execResult.result?.text) {
        yield {
          type: 'text',
          value: `\n\n> 🎨 **Brand context:**\n>\n> ${execResult.result.text.split('\n').join('\n> ')}\n\n`,
        };
      }
    } else {
      yield {
        type: 'text',
        value: `\n\n> ⚠️ *${execResult.error ?? 'La tool falló.'}*\n\n`,
      };
    }

    // ── Tools que producen output visual: cerramos turno ya ──
    // El usuario YA vio el resultado inline, no necesitamos otro round-trip al coach.
    const visualTools: ToolKind[] = ['create_ad', 'image', 'video', 'compose_ad'];
    if (visualTools.includes(detectedToolCall.name) && execResult.ok) {
      yield { type: 'text', value: '\n\n¡Listo brother! Cuando quieras, otra. 💪' };
      yield {
        type: 'done',
        inputTokens: totalPromptTokens,
        outputTokens: totalCompletionTokens,
        costUsd: 0,
      };
      return;
    }

    // ── Inyectar resultado al coach para que cierre con texto natural ──
    messages.push({
      role: 'assistant',
      content: fullResponse,
    });

    const summary = execResult.ok
      ? JSON.stringify({
          success: true,
          ...(execResult.result ?? {}),
          note: 'Resultado YA mostrado al usuario inline. NO repitas URLs ni embebas imágenes. Solo comenta brevemente con tu voz (1-3 frases).',
        })
      : JSON.stringify({ success: false, error: execResult.error });

    messages.push({
      role: 'user',
      content: `[TOOL_RESULT] ${detectedToolCall.name}\n${summary}`,
    });
    // Loop para que el coach genere el cierre natural
  }

  yield {
    type: 'error',
    message: 'Max tool loops reached.',
  };
}
