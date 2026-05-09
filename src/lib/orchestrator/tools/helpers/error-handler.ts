/**
 * ⚠️ ERROR HANDLER — Errores estandarizados para adapters
 * 
 * Convierte errores técnicos en mensajes user-friendly que el coach
 * puede leer y, opcionalmente, transmitir al usuario.
 */

import type { AdapterResult } from '../types';

export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'ADAPTER_ERROR',
    public readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

/**
 * Convierte cualquier error en un AdapterResult fallido.
 */
export function toFailedResult<T>(error: unknown, durationMs?: number): AdapterResult<T> {
  if (error instanceof AdapterError) {
    return {
      ok: false,
      error: error.userMessage || error.message,
      durationMs,
      meta: { code: error.code },
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    error: message,
    durationMs,
    meta: { code: 'UNKNOWN_ERROR' },
  };
}

/**
 * Wrapper para ejecutar una función adapter con error handling automático
 * y medición de tiempo.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
): Promise<AdapterResult<T>> {
  const startTime = Date.now();
  try {
    const data = await fn();
    return {
      ok: true,
      data,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return toFailedResult<T>(error, Date.now() - startTime);
  }
}
