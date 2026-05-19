import 'server-only';

import {
  callOperator,
  type OperatorMessage,
  type OperatorResponse,
} from '@/lib/models/local-operator-client';
import { probeOperatorCoach } from '@/lib/operator/coach-endpoint';

/**
 * Coach Service — capa de servicio que conecta el modelo local OperatorAI
 * con el resto de la infraestructura (RAG, memory, tools context).
 *
 * Diseñado para usarse desde endpoints API como /api/operator/coach.
 *
 * Filosofía:
 *  - El modelo local SIEMPRE recibe el master system prompt (vía callOperator).
 *  - El RAG (libros, knowledge) se pasa como ragContext.
 *  - La memoria del usuario se pasa como parte de ragContext.
 *  - Las tools disponibles se pasan como toolsContext (si aplica).
 *  - El servicio NO conoce de auth ni billing; eso es del endpoint.
 */

export interface CoachInput {
  message: string;
  history?: OperatorMessage[];
  /** Texto plano con material recuperado del RAG (libros, conocimiento). */
  knowledge?: string;
  /** Texto plano con memorias relevantes del usuario. */
  memories?: string;
  /** Texto plano con la lista de tools disponibles en este flujo. */
  tools?: string;
  /** Información del usuario / org para personalización (opcional). */
  userContext?: {
    orgName?: string;
    userName?: string;
    role?: string;
  };
  /** Tokens máximos de la respuesta. Default 1024. */
  maxTokens?: number;
  /** Temperatura. Default 0.7. */
  temperature?: number;
}

export interface CoachOutput {
  /** Respuesta natural del coach (sin tags tool_call si los hubo). */
  text: string;
  /** Tool call detectado, si el modelo decidió orquestar. */
  toolCall: { name: string; arguments: Record<string, unknown> } | null;
  /** Tokens usados (para tracking de uso, aunque sea local). */
  usage: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Latencia en ms del round-trip al modelo local. */
  elapsedMs: number;
  /** Identificador del modelo que respondió. */
  model: string;
}

export class OperatorCoachUnavailableError extends Error {
  constructor(message?: string) {
    super(
      message
        ?? 'OperatorAI coach no está disponible. Verifica que el endpoint configurado en OPERATOR_COACH_URL responda y que el modelo pueda completar.'
    );
    this.name = 'OperatorCoachUnavailableError';
  }
}

function buildUnavailableMessage(probe: Awaited<ReturnType<typeof probeOperatorCoach>>): string {
  const base = `OperatorAI coach no está disponible en ${probe.config.url} usando modelo ${probe.config.model}.`;
  return probe.errorMessage ? `${base} ${probe.errorMessage}` : base;
}

/**
 * Construye el bloque de contexto dinámico (RAG + memoria + user context)
 * que se inyecta junto al master prompt.
 */
function buildRagBlock(input: CoachInput): string | undefined {
  const parts: string[] = [];

  if (input.userContext) {
    const lines: string[] = [];
    if (input.userContext.userName) lines.push(`Usuario: ${input.userContext.userName}`);
    if (input.userContext.orgName) lines.push(`Organización: ${input.userContext.orgName}`);
    if (input.userContext.role) lines.push(`Rol: ${input.userContext.role}`);
    if (lines.length) {
      parts.push(`### CONTEXTO DEL USUARIO\n${lines.join('\n')}`);
    }
  }

  if (input.memories?.trim()) {
    parts.push(`### MEMORIAS RELEVANTES\n${input.memories.trim()}`);
  }

  if (input.knowledge?.trim()) {
    parts.push(`### MATERIAL DE CONOCIMIENTO RELEVANTE\n${input.knowledge.trim()}`);
  }

  if (!parts.length) return undefined;

  return parts.join('\n\n');
}

/**
 * Limpia tags <tool_call>...</tool_call> del texto de respuesta para
 * mostrar al usuario solo la parte conversacional.
 */
function stripToolCallTags(content: string): string {
  return content.replace(/<tool_call>.*?<\/tool_call>/gs, '').trim();
}

/**
 * Llama al coach OperatorAI con todo el contexto necesario.
 *
 * Lanza OperatorCoachUnavailableError si el servidor local no responde.
 */
export async function runCoach(input: CoachInput): Promise<CoachOutput> {
  const start = Date.now();

  // Healthcheck rápido — evitamos esperar timeout de fetch si el server está caído
  const probe = await probeOperatorCoach();
  if (!probe.ok) {
    throw new OperatorCoachUnavailableError(buildUnavailableMessage(probe));
  }

  const ragContext = buildRagBlock(input);

  let response: OperatorResponse;
  try {
    response = await callOperator(input.message, {
      history: input.history,
      ragContext,
      toolsContext: input.tools,
      maxTokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0.7,
    });
  } catch (error) {
    // Si el server cayó entre el healthcheck y la llamada
    if (
      error instanceof Error
      && (error.message.includes('fetch') || error.message.startsWith('[OperatorAI] HTTP'))
    ) {
      throw new OperatorCoachUnavailableError(error.message);
    }
    throw error;
  }

  const elapsedMs = Date.now() - start;
  const text = stripToolCallTags(response.content);

  return {
    text: text || response.content, // fallback si todo era tool_call
    toolCall: response.toolCall ?? null,
    usage: {
      prompt: response.usage?.prompt_tokens ?? 0,
      completion: response.usage?.completion_tokens ?? 0,
      total: response.usage?.total_tokens ?? 0,
    },
    elapsedMs,
    model: response.model,
  };
}

/**
 * Healthcheck público para usar en UI o status pages.
 */
export async function isCoachAvailable(): Promise<boolean> {
  const probe = await probeOperatorCoach();
  return probe.ok;
}
