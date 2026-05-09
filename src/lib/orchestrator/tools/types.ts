/**
 * 🛠️ EXTERNAL TOOLS — Type Definitions
 * 
 * Tipos compartidos por todos los adapters externos:
 *   web_search, web_fetch, gmail, browser_action, etc.
 */

export type ExternalToolName =
  | 'web_search'
  | 'web_fetch'
  | 'send_email'
  | 'read_emails'
  | 'browser_action';

export interface AdapterContext {
  /** ID del usuario (para multi-tenant en el futuro) */
  userId?: string;
  /** ID de la organización */
  orgId?: string;
  /** Si activamos modo dry-run para testing */
  dryRun?: boolean;
}

export interface AdapterResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  durationMs?: number;
  /** Para logs / telemetría */
  meta?: Record<string, unknown>;
}

/** Patrón estándar de adapter */
export type AdapterFunction<TInput, TOutput> = (
  input: TInput,
  ctx: AdapterContext,
) => Promise<AdapterResult<TOutput>>;

/** Definición declarativa de un adapter (registro) */
export interface AdapterDefinition<TInput = unknown, TOutput = unknown> {
  name: ExternalToolName;
  description: string;
  /** Schema Zod para validar input (permisivo con .default() y .optional()) */
  inputSchema: import('zod').ZodType<TInput, import('zod').ZodTypeDef, unknown>;
  /** Función que ejecuta el adapter */
  execute: AdapterFunction<TInput, TOutput>;
  /** Si requiere confirmación del user antes de ejecutar */
  requiresConfirmation?: boolean;
  /** Si está disponible (depende de env vars / setup) */
  isAvailable: () => boolean;
}
