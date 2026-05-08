/**
 * Coach Orchestrator — Tool Router
 *
 * Pipeline robusto para procesar tool_calls emitidos por el coach.
 *
 * Etapas:
 *   1. Parse: extrae JSON del bloque <tool_call>...</tool_call>
 *   2. Resolve name: aplica aliases para mapear nombres alternativos al canónico
 *   3. Coerce + validate: normaliza args + valida contra schema Zod
 *   4. Execute: invoca executeTool() de la infraestructura existente
 *
 * Si en CUALQUIER etapa hay error, devuelve un objeto estructurado con la
 * razón exacta — esto lo usa el RecoveryHandler para decidir qué hacer.
 */

import { executeTool, type ToolKind, type ToolContext } from '@/lib/chat/tools';
import {
  resolveToolName,
  validateToolArgs,
} from './tool-schemas';
import type {
  CoachToolName,
  ToolCallRequest,
  ToolCallValidation,
  ToolExecutionResult,
} from './types';

/* -------------------------------------------------------------------------- */
/*  PARSE — extraer tool_call del texto generado por el coach                  */
/* -------------------------------------------------------------------------- */

export interface ParsedToolBlock {
  rawName: string;
  rawArgs: Record<string, unknown>;
  startIndex: number;
  endIndex: number;
}

/**
 * Extrae el primer bloque <tool_call>{...}</tool_call> del texto.
 * Tolera variaciones comunes:
 *   - <tool_call>...</tool_call>
 *   - ```json\n{"name":...}\n``` (cuando el coach se confunde)
 *   - {"name":...,"arguments":{...}} pelado al final del mensaje
 */
export function parseToolBlock(text: string): ParsedToolBlock | null {
  // 1) Formato canónico: <tool_call>{...}</tool_call>
  const tagMatch = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (tagMatch && tagMatch.index !== undefined) {
    const jsonStr = tagMatch[1].trim();
    const parsed = tryParseToolJson(jsonStr);
    if (parsed) {
      return {
        rawName: parsed.name,
        rawArgs: parsed.arguments,
        startIndex: tagMatch.index,
        endIndex: tagMatch.index + tagMatch[0].length,
      };
    }
  }

  // 2) Formato code-block: ```json {...} ```
  const codeMatch = text.match(/```(?:json|tool_call)?\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch.index !== undefined) {
    const jsonStr = codeMatch[1].trim();
    const parsed = tryParseToolJson(jsonStr);
    if (parsed) {
      return {
        rawName: parsed.name,
        rawArgs: parsed.arguments,
        startIndex: codeMatch.index,
        endIndex: codeMatch.index + codeMatch[0].length,
      };
    }
  }

  // 3) JSON pelado: el coach pegó {"name":...,"arguments":{...}}
  const bareJsonMatch = text.match(/\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/);
  if (bareJsonMatch && bareJsonMatch.index !== undefined) {
    const parsed = tryParseToolJson(bareJsonMatch[0]);
    if (parsed) {
      return {
        rawName: parsed.name,
        rawArgs: parsed.arguments,
        startIndex: bareJsonMatch.index,
        endIndex: bareJsonMatch.index + bareJsonMatch[0].length,
      };
    }
  }

  return null;
}

function tryParseToolJson(jsonStr: string): { name: string; arguments: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const name = typeof parsed.name === 'string' ? parsed.name : null;
    if (!name) return null;
    const args = typeof parsed.arguments === 'object' && parsed.arguments !== null
      ? (parsed.arguments as Record<string, unknown>)
      : {};
    return { name, arguments: args };
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  ROUTE — pipeline completo de validación                                    */
/* -------------------------------------------------------------------------- */

/**
 * Procesa un tool block parseado:
 *   1. Resuelve el nombre canónico
 *   2. Pre-coerce + valida contra schema
 *
 * Devuelve:
 *   - { ok: true, call: ToolCallRequest, corrections: string[] }
 *   - { ok: false, reason: ..., details: ..., suggestedFallback?, needsUserInput? }
 */
export function routeToolCall(parsed: ParsedToolBlock): ToolCallValidation {
  // Etapa 1: resolver nombre
  const canonicalName = resolveToolName(parsed.rawName);
  if (!canonicalName) {
    return {
      ok: false,
      reason: 'unknown_tool',
      details: `La tool "${parsed.rawName}" no existe ni tiene alias conocido. Tools válidas: create_ad, image, video, knowledge_search, file_analysis, get_brand_assets.`,
    };
  }

  // Etapa 2: validar args
  const validation = validateToolArgs(canonicalName, parsed.rawArgs);
  if (!validation.ok) {
    // Si faltan args obligatorios, marcar como needs_user_input
    if (validation.missingFields && validation.missingFields.length > 0) {
      const fallback = buildFallbackForMissingFields(canonicalName, parsed.rawArgs, validation.missingFields);
      if (fallback) {
        return {
          ok: false,
          reason: 'missing_args',
          details: validation.error,
          suggestedFallback: fallback,
        };
      }
      return {
        ok: false,
        reason: 'missing_args',
        details: validation.error,
        needsUserInput: {
          field: validation.missingFields[0],
          question: humanizeMissingFieldQuestion(canonicalName, validation.missingFields[0]),
        },
      };
    }
    return {
      ok: false,
      reason: 'invalid_args',
      details: validation.error,
    };
  }

  // Tool call validado — generar id único
  const id = `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    ok: true,
    call: {
      id,
      name: canonicalName,
      arguments: validation.data,
    },
    corrections: validation.corrections,
  };
}

/**
 * Cuando faltan args, intenta construir un fallback con valores por defecto
 * SI Y SOLO SI tiene sentido lógico. Ejemplo: create_ad sin formats → ['1:1'].
 */
function buildFallbackForMissingFields(
  toolName: CoachToolName,
  rawArgs: Record<string, unknown>,
  missingFields: string[],
): ToolCallRequest | undefined {
  const args = { ...rawArgs };

  if (toolName === 'create_ad') {
    if (missingFields.includes('user_prompt')) {
      // user_prompt es OBLIGATORIO — no hay fallback razonable
      return undefined;
    }
    if (missingFields.includes('formats') && !args.formats) {
      args.formats = ['1:1'];
    }
    return {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'create_ad',
      arguments: args,
    };
  }

  if (toolName === 'image') {
    if (missingFields.includes('prompt')) return undefined;
    if (missingFields.includes('aspect_ratio') && !args.aspect_ratio) {
      args.aspect_ratio = '1:1';
    }
    return {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'image',
      arguments: args,
    };
  }

  if (toolName === 'video') {
    if (missingFields.includes('prompt')) return undefined;
    if (missingFields.includes('duration') && !args.duration) {
      args.duration = 4;
    }
    return {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: 'video',
      arguments: args,
    };
  }

  return undefined;
}

function humanizeMissingFieldQuestion(toolName: CoachToolName, field: string): string {
  const map: Record<string, string> = {
    'create_ad.user_prompt': '¿Qué quieres anunciar exactamente? Cuéntame producto, oferta o mensaje principal.',
    'image.prompt': '¿Qué imagen quieres? Descríbeme escena, sujeto, mood.',
    'video.prompt': '¿Qué quieres ver en el vídeo? Descríbeme la escena.',
    'knowledge_search.query': '¿Sobre qué tema quieres que busque en tus documentos?',
    'file_analysis.file_id': '¿Qué archivo quieres analizar?',
    'file_analysis.question': '¿Qué quieres saber del archivo?',
  };
  return map[`${toolName}.${field}`] ?? `Falta el campo "${field}". ¿Me lo aclaras?`;
}

/* -------------------------------------------------------------------------- */
/*  EXECUTE — invoca la infraestructura existente                              */
/* -------------------------------------------------------------------------- */

export async function executeValidatedCall(
  call: ToolCallRequest,
  ctx: ToolContext,
): Promise<ToolExecutionResult> {
  const start = Date.now();
  try {
    const res = await executeTool(call.name as ToolKind, call.arguments, ctx);
    return {
      ok: res.ok,
      result: res.result,
      error: res.error,
      elapsedMs: Date.now() - start,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Tool execution threw',
      elapsedMs: Date.now() - start,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  HELPER: stripear el bloque <tool_call> del texto                          */
/* -------------------------------------------------------------------------- */

/**
 * Elimina el primer bloque tool_call (en cualquiera de sus formas) del texto,
 * útil para emitir solo la parte conversacional al usuario.
 */
export function stripToolBlocks(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .replace(/```(?:json|tool_call)?\s*\{[\s\S]*?"name"[\s\S]*?\}\s*```/g, '')
    .trim();
}
