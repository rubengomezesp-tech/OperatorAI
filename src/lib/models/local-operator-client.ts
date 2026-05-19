/**
 * Cliente para OperatorAI local (Qwen2.5-14B fine-tuned)
 * 
 * Conecta con LM Studio corriendo en http://localhost:1234
 * Inyecta automáticamente el master system prompt en cada llamada.
 * 
 * Uso básico:
 *   const respuesta = await callOperator("Hola brother");
 * 
 * Con tools (modo orquestador):
 *   const respuesta = await callOperator("Crea un anuncio", { toolsContext: "..." });
 * 
 * Con RAG (knowledge layer):
 *   const respuesta = await callOperator("¿Qué dice Jack Ma?", { ragContext: "..." });
 */

import { OPERATOR_MASTER_PROMPT } from './operator-prompt';
import {
  getOperatorCoachConfig,
  getOperatorCoachHeaders,
  probeOperatorCoach,
} from '@/lib/operator/coach-endpoint';

export interface OperatorMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallOperatorOptions {
  /** Historial de mensajes previos del chat (sin system prompt) */
  history?: OperatorMessage[];
  /** Contexto dinámico de tools disponibles para el modo orquestador */
  toolsContext?: string;
  /** Contexto recuperado del RAG (libros, documentos, branding) */
  ragContext?: string;
  /** Tokens máximos de la respuesta */
  maxTokens?: number;
  /** Temperatura (0=determinista, 1=creativo). Default 0.7 */
  temperature?: number;
  /** Si true, devuelve la respuesta como stream */
  stream?: boolean;
}

export interface OperatorResponse {
  content: string;
  model: string;
  toolCall?: { name: string; arguments: Record<string, unknown> };
  raw: unknown;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Construye el system prompt completo combinando el master prompt
 * con contexto dinámico (tools + RAG).
 */
function buildSystemPrompt(options: CallOperatorOptions): string {
  let prompt = OPERATOR_MASTER_PROMPT;

  if (options.toolsContext) {
    prompt += `\n\n## TOOLS DISPONIBLES EN ESTA SESIÓN\n${options.toolsContext}`;
  }

  if (options.ragContext) {
    prompt += `\n\n## CONTEXTO RELEVANTE (RAG)\n${options.ragContext}`;
  }

  return prompt;
}

/**
 * Extrae un tool_call del contenido de la respuesta si existe.
 */
function parseToolCall(content: string): { name: string; arguments: Record<string, unknown> } | undefined {
  const match = content.match(/<tool_call>(.*?)<\/tool_call>/s);
  if (!match) return undefined;

  try {
    const parsed = JSON.parse(match[1].trim());
    if (typeof parsed === 'object' && parsed !== null && 'name' in parsed) {
      return {
        name: parsed.name,
        arguments: parsed.arguments || {},
      };
    }
  } catch (e) {
    console.error('[OperatorAI] Error parseando tool_call:', e);
  }
  return undefined;
}

/**
 * Llama al modelo OperatorAI local con el master prompt inyectado automáticamente.
 */
export async function callOperator(
  userMessage: string,
  options: CallOperatorOptions = {}
): Promise<OperatorResponse> {
  const config = getOperatorCoachConfig();
  const systemPrompt = buildSystemPrompt(options);

  const messages: OperatorMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(options.history || []),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${config.url}/v1/chat/completions`, {
    method: 'POST',
    headers: getOperatorCoachHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[OperatorAI] HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const toolCall = parseToolCall(content);

  return {
    content,
    model: String(data.model ?? config.model),
    toolCall,
    raw: data,
    usage: data.usage,
  };
}

/**
 * Verifica si el servidor local de OperatorAI está accesible.
 * Útil para healthchecks y mostrar estado en UI.
 */
export async function isOperatorAvailable(): Promise<boolean> {
  const probe = await probeOperatorCoach();
  return probe.ok;
}
