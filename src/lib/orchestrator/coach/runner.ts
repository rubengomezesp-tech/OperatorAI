/**
 * Coach Orchestrator — Master Runner
 *
 * Orquesta el ciclo completo:
 *   detect intent → build prompt → stream from coach → parse tool_call →
 *   validate + auto-correct → execute → recover on failure → close turn.
 *
 * Reemplaza el antiguo run-coach-with-tools.ts.
 *
 * El contrato de eventos es COMPATIBLE con la UI existente (text / tool_start /
 * tool_result / done / error), más eventos extra para diagnóstico
 * (intent_detected, tool_corrected, recovery_attempt) que la UI puede ignorar.
 */

import type { ToolContext } from '@/lib/chat/tools';
import { detectIntent, intentRequiresTool, toolsForIntent } from './intent-detector';
import { parseToolBlock, routeToolCall, executeValidatedCall, stripToolBlocks } from './tool-router';
import {
  recoverFromValidationFailure,
  recoverFromExecutionFailure,
  shouldAbortAfterAttempts,
} from './recovery-handler';
import { buildSystemPromptForIntent, buildPostToolPrompt } from './prompts';
import {
  COACH_CONFIG,
  type CoachEvent,
  type CoachToolName,
  type Intent,
  type RunCoachArgs,
  type ToolCallRequest,
  type ToolExecutionResult,
} from './types';

/* -------------------------------------------------------------------------- */
/*  Streaming primitivo del coach (OpenAI-compatible API)                      */
/* -------------------------------------------------------------------------- */

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface StreamFinal {
  full: string;
  usage: { prompt: number; completion: number };
}

async function* streamCoach(
  messages: OpenAIMessage[],
  opts: { temperature: number; maxTokens: number; signal?: AbortSignal },
): AsyncGenerator<{ type: 'delta'; value: string } | { type: 'final'; data: StreamFinal }> {
  const res = await fetch(`${COACH_CONFIG.url}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: COACH_CONFIG.model,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
      stream: true,
    }),
    signal: opts.signal,
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
            prompt: json.usage.prompt_tokens ?? usage.prompt,
            completion: json.usage.completion_tokens ?? usage.completion,
          };
        }
      } catch {
        /* ignore malformed chunks */
      }
    }
  }

  yield { type: 'final', data: { full, usage } };
}

/**
 * Streamea respuesta del coach al usuario, ocultando el bloque tool_call si
 * aparece. Devuelve la respuesta completa al final para inspección.
 */
async function* streamWithToolMasking(
  messages: OpenAIMessage[],
  opts: { temperature: number; maxTokens: number; signal?: AbortSignal },
): AsyncGenerator<CoachEvent | { type: 'final_internal'; data: StreamFinal }> {
  let full = '';
  let safeEmittedLength = 0; // bytes que ya emitimos al usuario y SON seguros
  let inToolTag = false;
  // Buffer mínimo: no emitimos los últimos N chars hasta confirmar que no
  // forman parte de un patrón de tool_call. 12 chars cubre '<tool_call>' (11)
  // y patrones JSON cortos.
  const PEEK_BUFFER = 12;

  for await (const evt of streamCoach(messages, opts)) {
    if (evt.type === 'final') {
      // Al final, emitir lo que quede pendiente si no entramos en tool_call
      if (!inToolTag && safeEmittedLength < full.length) {
        const tail = full.slice(safeEmittedLength);
        // Verificar si la cola final contiene tool_call o JSON
        const tagIdx = tail.indexOf('<tool_call>');
        const jsonIdx = tail.search(/\{\s*"name"\s*:/);
        if (tagIdx === -1 && jsonIdx === -1) {
          if (tail) yield { type: 'text', value: tail };
        } else {
          const cutAt = tagIdx >= 0 ? tagIdx : jsonIdx;
          const safeTail = tail.slice(0, cutAt);
          if (safeTail) yield { type: 'text', value: safeTail };
        }
      }
      yield { type: 'final_internal', data: evt.data };
      return;
    }

    full += evt.value;
    if (inToolTag) continue;

    // Buscar marcadores de tool_call en lo nuevo
    const tagOpenIdx = full.indexOf('<tool_call>', safeEmittedLength);
    const jsonStartIdx = full.slice(safeEmittedLength).search(/\{\s*"name"\s*:/);
    const absJsonIdx = jsonStartIdx >= 0 ? safeEmittedLength + jsonStartIdx : -1;

    let cutoff = -1;
    if (tagOpenIdx >= 0 && (absJsonIdx === -1 || tagOpenIdx < absJsonIdx)) {
      cutoff = tagOpenIdx;
    } else if (absJsonIdx >= 0) {
      cutoff = absJsonIdx;
    }

    if (cutoff >= 0) {
      // Encontramos inicio de tool_call: emitir todo lo anterior y silenciar
      const toEmit = full.slice(safeEmittedLength, cutoff);
      if (toEmit) yield { type: 'text', value: toEmit };
      safeEmittedLength = cutoff;
      inToolTag = true;
      continue;
    }

    // No hay marcador todavía. Emitir lo nuevo dejando un buffer al final
    // por si los próximos chunks lo completan en algo problemático.
    const safeUpTo = Math.max(safeEmittedLength, full.length - PEEK_BUFFER);
    if (safeUpTo > safeEmittedLength) {
      const toEmit = full.slice(safeEmittedLength, safeUpTo);
      yield { type: 'text', value: toEmit };
      safeEmittedLength = safeUpTo;
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Render inline del resultado de tool                                        */
/* -------------------------------------------------------------------------- */

function* renderToolResultInline(
  toolName: CoachToolName,
  result: ToolExecutionResult,
): Generator<CoachEvent> {
  if (!result.ok) {
    yield {
      type: 'text',
      value: `\n\n> ⚠️ *${result.error ?? 'La tool falló.'}*\n\n`,
    };
    return;
  }

  const r = result.result;
  if (!r) return;

  if ((toolName === 'image' || toolName === 'create_ad') && r.urls?.length) {
    for (const url of r.urls) {
      yield { type: 'text', value: `\n\n![Imagen generada](${url})\n\n` };
    }
    yield { type: 'text', value: `[⬇ Descargar](${r.urls[0]})\n\n` };
    return;
  }

  if (toolName === 'video' && r.videoUrl) {
    yield {
      type: 'text',
      value: `\n\n🎬 **Vídeo generado:** [▶ Ver / Descargar](${r.videoUrl})\n\n`,
    };
    return;
  }

  if (toolName === 'file_analysis' && r.text) {
    yield {
      type: 'text',
      value: `\n\n> 📊 **Análisis:**\n>\n> ${r.text.split('\n').join('\n> ')}\n\n`,
    };
    return;
  }

  if (toolName === 'knowledge_search' && r.text) {
    yield {
      type: 'text',
      value: `\n\n> 📚 **De tu knowledge:**\n>\n> ${r.text.split('\n').join('\n> ')}\n\n`,
    };
    return;
  }

  if (toolName === 'get_brand_assets' && r.text) {
    yield {
      type: 'text',
      value: `\n\n> 🎨 **Tu marca:**\n>\n> ${r.text.split('\n').join('\n> ')}\n\n`,
    };
    return;
  }
}

/* -------------------------------------------------------------------------- */
/*  Construcción de mensajes para el coach                                     */
/* -------------------------------------------------------------------------- */

function buildMessages(args: RunCoachArgs, intent: Intent, allowedTools: CoachToolName[]): OpenAIMessage[] {
  const upstreamSystem = args.messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');

  const systemPrompt = buildSystemPromptForIntent({
    intent,
    allowedTools,
    upstreamContext: upstreamSystem || undefined,
    hasAttachedImage: Boolean(args.imageBase64 && args.imageMimeType),
  });

  const messages: OpenAIMessage[] = [{ role: 'system', content: systemPrompt }];

  for (const m of args.messages) {
    if (m.role === 'system') continue;
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    });
  }

  if (args.imageBase64 && args.imageMimeType) {
    const last = messages[messages.length - 1];
    if (last?.role === 'user') {
      last.content = `${last.content}\n\n[NOTA: el usuario adjuntó una imagen. La infraestructura la pasará automáticamente a la tool si aplica.]`;
    }
  }

  return messages;
}

/* -------------------------------------------------------------------------- */
/*  Helper: extraer último mensaje user (para recovery)                        */
/* -------------------------------------------------------------------------- */

function lastUserMessage(args: RunCoachArgs): string {
  for (let i = args.messages.length - 1; i >= 0; i--) {
    if (args.messages[i].role === 'user') return args.messages[i].content;
  }
  return '';
}

/* -------------------------------------------------------------------------- */
/*  Build ToolContext desde args                                               */
/* -------------------------------------------------------------------------- */

function buildToolContext(args: RunCoachArgs): ToolContext {
  return {
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
}

/* -------------------------------------------------------------------------- */
/*  Generator: ejecuta tool con recovery automático                            */
/* -------------------------------------------------------------------------- */

async function* executeWithRecovery(
  initialCall: ToolCallRequest,
  ctx: ToolContext,
  originalUserMessage: string,
): AsyncGenerator<CoachEvent, ToolExecutionResult | null> {
  let currentCall = initialCall;
  let attempt = 1;

  while (attempt <= COACH_CONFIG.maxRecoveryAttempts) {
    yield {
      type: 'tool_start',
      tool: currentCall.name,
      toolUseId: currentCall.id,
      input: currentCall.arguments,
    };

    if (attempt === 1) {
      yield { type: 'text', value: '\n\n---\n\n' };
    }

    const result = await executeValidatedCall(currentCall, ctx);

    yield {
      type: 'tool_result',
      tool: currentCall.name,
      toolUseId: currentCall.id,
      ok: result.ok,
      result: result.result,
      error: result.error,
    };

    // Render inline del resultado
    for (const evt of renderToolResultInline(currentCall.name, result)) {
      yield evt;
    }

    // Éxito → salir
    if (result.ok) return result;

    // Falló — intentar recovery
    if (shouldAbortAfterAttempts(attempt, COACH_CONFIG.maxRecoveryAttempts)) {
      return result;
    }

    const action = recoverFromExecutionFailure(currentCall, result, originalUserMessage, attempt);

    if (action.kind === 'retry_with_different_tool') {
      yield {
        type: 'recovery_attempt',
        attempt: attempt + 1,
        reason: `retry: ${action.newCall.name} (era ${currentCall.name})`,
      };
      currentCall = action.newCall;
      attempt++;
      continue;
    }

    if (action.kind === 'ask_user') {
      yield { type: 'text', value: `\n\n${action.question}\n\n` };
      return result;
    }

    // abort_gracefully
    yield { type: 'text', value: `\n\n${action.userMessage}\n\n` };
    return result;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Main: runCoach                                                             */
/* -------------------------------------------------------------------------- */

export async function* runCoach(args: RunCoachArgs): AsyncIterable<CoachEvent> {
  const userMessage = lastUserMessage(args);

  // ── PASO 1: detectar intent ──────────────────────────────────────────────
  let detection;
  try {
    detection = await detectIntent(userMessage, args.signal);
  } catch (e) {
    yield {
      type: 'error',
      message: e instanceof Error ? e.message : 'Intent detection failed',
      recoverable: false,
    };
    return;
  }

  yield {
    type: 'intent_detected',
    intent: detection.intent,
    confidence: detection.confidence,
  };

  // ── PASO 2: si es ambiguous → pedir aclaración SIN llamar a tools ────────
  if (detection.intent === 'ambiguous' && detection.suggestedClarification) {
    yield { type: 'text', value: detection.suggestedClarification };
    yield {
      type: 'done',
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      intent: detection.intent,
    };
    return;
  }

  // ── PASO 3: construir prompt y mensajes ──────────────────────────────────
  const allowedTools = toolsForIntent(detection.intent);
  const requiresTool = intentRequiresTool(detection.intent);
  const messages = buildMessages(args, detection.intent, allowedTools);

  // ── PASO 4: streaming inicial ────────────────────────────────────────────
  let firstStreamFull = '';
  let firstStreamUsage = { prompt: 0, completion: 0 };

  try {
    for await (const evt of streamWithToolMasking(messages, {
      temperature: COACH_CONFIG.responseTemperature,
      maxTokens: COACH_CONFIG.responseMaxTokens,
      signal: args.signal,
    })) {
      if (evt.type === 'final_internal') {
        firstStreamFull = evt.data.full;
        firstStreamUsage = evt.data.usage;
        break;
      }
      yield evt;
    }
  } catch (e) {
    yield {
      type: 'error',
      message: e instanceof Error ? e.message : 'Coach streaming failed',
      recoverable: false,
    };
    return;
  }

  // ── PASO 5: si no requiere tool, hemos terminado ────────────────────────
  if (!requiresTool) {
    yield {
      type: 'done',
      inputTokens: firstStreamUsage.prompt,
      outputTokens: firstStreamUsage.completion,
      costUsd: 0,
      intent: detection.intent,
    };
    return;
  }

  // ── PASO 6: parsear tool_call del coach ─────────────────────────────────
  const parsed = parseToolBlock(firstStreamFull);
  if (!parsed) {
    // El coach NO emitió tool_call aunque el intent lo requería.
    // Aplicamos recovery: inferir tool desde el mensaje del usuario.
    const action = recoverFromValidationFailure(
      {
        ok: false,
        reason: 'malformed_json',
        details: 'Coach did not emit a parseable tool_call',
      },
      userMessage,
    );

    if (action.kind === 'ask_user') {
      yield { type: 'text', value: `\n\n${action.question}\n\n` };
    } else if (action.kind === 'abort_gracefully') {
      yield { type: 'text', value: `\n\n${action.userMessage}\n\n` };
    } else if (action.kind === 'retry_with_different_tool') {
      // Inferimos tool, ejecutamos con recovery
      const result = yield* executeWithRecovery(action.newCall, buildToolContext(args), userMessage);
      yield* generateClosingComment(action.newCall.name, result, args.signal);
    }

    yield {
      type: 'done',
      inputTokens: firstStreamUsage.prompt,
      outputTokens: firstStreamUsage.completion,
      costUsd: 0,
      intent: detection.intent,
    };
    return;
  }

  // ── PASO 7: validar tool_call ────────────────────────────────────────────
  const routed = routeToolCall(parsed);

  if (!routed.ok) {
    const action = recoverFromValidationFailure(routed, userMessage);

    if (action.kind === 'retry_with_different_tool') {
      yield {
        type: 'tool_corrected',
        from: parsed.rawName,
        to: action.newCall.name,
        reason: routed.details,
      };
      const result = yield* executeWithRecovery(action.newCall, buildToolContext(args), userMessage);
      yield* generateClosingComment(action.newCall.name, result, args.signal);
    } else if (action.kind === 'ask_user') {
      yield { type: 'text', value: `\n\n${action.question}\n\n` };
    } else {
      yield { type: 'text', value: `\n\n${action.userMessage}\n\n` };
    }

    yield {
      type: 'done',
      inputTokens: firstStreamUsage.prompt,
      outputTokens: firstStreamUsage.completion,
      costUsd: 0,
      intent: detection.intent,
    };
    return;
  }

  // ── PASO 8: emitir corrections como evento de debug si hubo ─────────────
  for (const correction of routed.corrections) {
    yield {
      type: 'tool_corrected',
      from: parsed.rawName,
      to: routed.call.name,
      reason: correction,
    };
  }

  // ── PASO 9: ejecutar con recovery ───────────────────────────────────────
  const result = yield* executeWithRecovery(routed.call, buildToolContext(args), userMessage);

  // ── PASO 10: comentario de cierre con voz natural ───────────────────────
  yield* generateClosingComment(routed.call.name, result, args.signal);

  // ── PASO 11: done ───────────────────────────────────────────────────────
  yield {
    type: 'done',
    inputTokens: firstStreamUsage.prompt,
    outputTokens: firstStreamUsage.completion,
    costUsd: 0,
    intent: detection.intent,
  };
}

/* -------------------------------------------------------------------------- */
/*  Comentario de cierre tras ejecutar tool                                    */
/* -------------------------------------------------------------------------- */

async function* generateClosingComment(
  toolName: CoachToolName,
  result: ToolExecutionResult | null,
  signal?: AbortSignal,
): AsyncGenerator<CoachEvent> {
  // Si la tool fue exitosa Y produjo output visual, NO pedimos comentario al
  // coach: el resultado ya se mostró inline y la latencia importa más que un
  // comentario adicional. Damos un cierre breve hardcodeado.
  const isVisual = toolName === 'image' || toolName === 'video' || toolName === 'create_ad';
  const success = result?.ok ?? false;

  if (success && isVisual) {
    yield { type: 'text', value: '\n\n¡Listo, brother! Si quieres una variante o ajuste, dímelo. 💪' };
    return;
  }

  // Para tools no-visuales exitosas (knowledge_search, brand_query, file_analysis),
  // el coach genera un cierre breve para darle voz al resultado mostrado
  if (success && !isVisual) {
    const closingPrompt = buildPostToolPrompt(toolName, true);
    try {
      for await (const evt of streamCoach(
        [
          { role: 'system', content: closingPrompt },
          { role: 'user', content: '(genera el cierre)' },
        ],
        { temperature: 0.7, maxTokens: 200, signal },
      )) {
        if (evt.type === 'final') return;
        yield { type: 'text', value: evt.value };
      }
    } catch {
      // Si falla el cierre, no hacemos nada — el resultado ya se vio
    }
    return;
  }

  // Si la tool falló y NO hubo recovery exitoso, dejar el mensaje de error
  // (que ya se emitió antes desde recoverFromExecutionFailure)
}
