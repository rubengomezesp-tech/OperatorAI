/**
 * Coach Orchestrator — Shared Types
 *
 * Tipos canónicos del runtime del coach.
 * Todos los módulos del orchestrator/coach/ importan desde aquí.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatMessage } from '@/lib/providers';

/* -------------------------------------------------------------------------- */
/*  INTENTS — qué quiere hacer el usuario                                      */
/* -------------------------------------------------------------------------- */

export type Intent =
  | 'small_talk'        // saludo, cómo estás, conversación trivial
  | 'business_advice'   // consejo de negocio, marketing, mentalidad (sin tool)
  | 'create_ad'         // anuncio publicitario completo
  | 'image_only'        // imagen sin texto/CTA (foto, render, ilustración)
  | 'image_edit'        // edición de imagen existente o adjunta
  | 'video'             // vídeo corto
  | 'knowledge_query'   // pregunta sobre documentos del usuario
  | 'file_analysis'     // análisis de archivo (CSV, Excel, JSON)
  | 'brand_query'       // pregunta sobre la marca del usuario
  | 'meta'              // pregunta sobre OperatorAI mismo (capacidades, etc.)
  | 'ambiguous';        // no se puede determinar — pedir aclaración

export interface IntentDetection {
  intent: Intent;
  confidence: number;          // 0..1
  reasoning: string;           // por qué se eligió este intent
  suggestedClarification?: string; // pregunta a hacer si ambiguous
}

/* -------------------------------------------------------------------------- */
/*  TOOLS — qué puede ejecutar el coach                                        */
/* -------------------------------------------------------------------------- */

export type CoachToolName =
  | 'create_ad'
  | 'image'
  | 'video'
  | 'knowledge_search'
  | 'file_analysis'
  | 'get_brand_assets';

/** Tool calls que el coach NUNCA debe usar directamente (se filtran del prompt) */
export const HIDDEN_TOOLS: ReadonlySet<string> = new Set([
  'compose_ad',
  'analyze_assets',
]);

export interface ToolCallRequest {
  id: string;
  name: CoachToolName;
  arguments: Record<string, unknown>;
}

export interface ToolCallValidated {
  ok: true;
  call: ToolCallRequest;
  corrections: string[]; // qué se auto-corrigió (ej: "format 'square' → '1:1'")
}

export interface ToolCallInvalid {
  ok: false;
  reason: 'unknown_tool' | 'missing_args' | 'invalid_args' | 'malformed_json';
  details: string;
  /** Si la tool se puede mapear a otra (ej: compose_ad → create_ad), aquí va */
  suggestedFallback?: ToolCallRequest;
  /** Si falta info que solo el usuario puede dar */
  needsUserInput?: { question: string; field: string };
}

export type ToolCallValidation = ToolCallValidated | ToolCallInvalid;

export interface ToolExecutionResult {
  ok: boolean;
  result?: {
    urls?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    sources?: Array<{ title: string; id: string }>;
  };
  error?: string;
  /** Latencia de la tool en ms */
  elapsedMs: number;
}

/* -------------------------------------------------------------------------- */
/*  EVENTS — qué emite el orquestador hacia el cliente                         */
/* -------------------------------------------------------------------------- */

export type CoachEvent =
  | { type: 'text'; value: string }
  | { type: 'intent_detected'; intent: Intent; confidence: number }
  | { type: 'tool_start'; tool: CoachToolName; toolUseId: string; input: Record<string, unknown> }
  | {
      type: 'tool_result';
      tool: CoachToolName;
      toolUseId: string;
      ok: boolean;
      result?: ToolExecutionResult['result'];
      error?: string;
    }
  | { type: 'tool_corrected'; from: string; to: string; reason: string } // debug
  | { type: 'recovery_attempt'; attempt: number; reason: string }
  | { type: 'done'; inputTokens: number; outputTokens: number; costUsd: number; intent: Intent }
  | { type: 'error'; message: string; recoverable: boolean };

/* -------------------------------------------------------------------------- */
/*  RUNNER ARGS                                                                */
/* -------------------------------------------------------------------------- */

export interface RunCoachArgs {
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

/* -------------------------------------------------------------------------- */
/*  RECOVERY                                                                   */
/* -------------------------------------------------------------------------- */

export type RecoveryAction =
  | { kind: 'retry_with_different_tool'; newCall: ToolCallRequest; userMessage: string }
  | { kind: 'ask_user'; question: string }
  | { kind: 'abort_gracefully'; userMessage: string };

/* -------------------------------------------------------------------------- */
/*  CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

export const COACH_CONFIG = {
  url: process.env.LOCAL_OPERATOR_URL || 'http://localhost:1234',
  model: process.env.LOCAL_OPERATOR_MODEL || 'operator-qwen14b',
  maxToolLoops: 3,
  maxRecoveryAttempts: 2,
  intentTemperature: 0.1,    // intent detection muy determinista
  responseTemperature: 0.7,  // respuesta natural más creativa
  intentMaxTokens: 200,
  responseMaxTokens: 1500,
} as const;
