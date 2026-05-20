/**
 * Coach Orchestrator — Recovery Handler
 *
 * Cuando una validación o ejecución falla, decide qué hacer SIN exponer
 * basura técnica al usuario. Tres caminos posibles:
 *
 *   1. retry_with_different_tool: hay un fallback automático razonable
 *      (ej: el coach pidió compose_ad pero le faltan args → reintentar con
 *      create_ad usando el user_prompt del original)
 *
 *   2. ask_user: faltan datos que solo el usuario puede aportar (ej:
 *      pidió un anuncio pero no dijo de qué producto). Generamos una
 *      pregunta natural con la voz del coach.
 *
 *   3. abort_gracefully: error irrecuperable (ej: servicio externo caído).
 *      Damos un mensaje amable y honesto al usuario.
 */

import type {
  RecoveryAction,
  ToolCallInvalid,
  ToolCallRequest,
  ToolExecutionResult,
} from './types';

/* -------------------------------------------------------------------------- */
/*  RECOVERY PARA VALIDACIONES FALLIDAS                                        */
/* -------------------------------------------------------------------------- */

/**
 * Decide qué hacer cuando el tool_call NO pasó la validación previa
 * (antes de ejecutarse).
 */
export function recoverFromValidationFailure(
  invalid: ToolCallInvalid,
  originalUserMessage: string,
): RecoveryAction {
  // Caso 1: hay un fallback automático sugerido por el router
  if (invalid.suggestedFallback) {
    return {
      kind: 'retry_with_different_tool',
      newCall: invalid.suggestedFallback,
      userMessage: '', // silencioso — el usuario no debe ver retry técnico
    };
  }

  // Caso 2: faltan datos del usuario
  if (invalid.needsUserInput) {
    return {
      kind: 'ask_user',
      question: invalid.needsUserInput.question,
    };
  }

  // Caso 3: tool desconocida y sin alias → fallback contextual
  if (invalid.reason === 'unknown_tool') {
    const fallback = inferToolFromMessage(originalUserMessage);
    if (fallback) {
      return {
        kind: 'retry_with_different_tool',
        newCall: fallback,
        userMessage: '',
      };
    }
    return {
      kind: 'abort_gracefully',
      userMessage:
        'Brother, no estoy seguro de qué quieres conseguir. ¿Me lo cuentas con otras palabras?',
    };
  }

  // Caso 4: args inválidos sin posibilidad de auto-corrección
  if (invalid.reason === 'invalid_args') {
    return {
      kind: 'ask_user',
      question:
        'Necesito un detalle más para hacerlo bien. ¿Puedes decirme qué quieres exactamente?',
    };
  }

  // Caso 5: JSON malformado del coach → silencio + retry
  if (invalid.reason === 'malformed_json') {
    return {
      kind: 'abort_gracefully',
      userMessage:
        'Se me cruzó algo, brother. Repíteme lo que quieres y lo saco a la primera.',
    };
  }

  return {
    kind: 'abort_gracefully',
    userMessage:
      'Algo no encajó por mi lado. ¿Lo intentamos de otra forma? Cuéntame qué necesitas.',
  };
}

/* -------------------------------------------------------------------------- */
/*  RECOVERY PARA EJECUCIONES FALLIDAS                                         */
/* -------------------------------------------------------------------------- */

/**
 * Decide qué hacer cuando la tool se ejecutó pero falló.
 */
export function recoverFromExecutionFailure(
  failedCall: ToolCallRequest,
  result: ToolExecutionResult,
  originalUserMessage: string,
  attemptNumber: number,
): RecoveryAction {
  const errorLower = (result.error || '').toLowerCase();

  // Errores de cuota / rate limit
  if (errorLower.includes('quota') || errorLower.includes('rate limit') || errorLower.includes('429')) {
    return {
      kind: 'abort_gracefully',
      userMessage:
        'Brother, justo ahora hay mucha demanda en uno de los servicios externos. Dame 30 segundos y vuelve a probar.',
    };
  }

  // Timeouts
  if (errorLower.includes('timeout') || errorLower.includes('timed out') || errorLower.includes('aborted')) {
    if (attemptNumber === 1 && (failedCall.name === 'image' || failedCall.name === 'video')) {
      // Reintentar con configuración más conservadora
      const retried = scaleDownForRetry(failedCall);
      if (retried) {
        return {
          kind: 'retry_with_different_tool',
          newCall: retried,
          userMessage: '',
        };
      }
    }
    return {
      kind: 'abort_gracefully',
      userMessage:
        'Se me ha colgado el render esta vez. Lo retomamos en un momento, ¿lo lanzo de nuevo?',
    };
  }

  // Errores de auth / api key (no son del usuario)
  if (errorLower.includes('api key') || errorLower.includes('unauthorized') || errorLower.includes('401') || errorLower.includes('403')) {
    return {
      kind: 'abort_gracefully',
      userMessage:
        'Hay un problema de configuración del servicio externo. El equipo lo verá. Mientras tanto, ¿puedo ayudarte con otra cosa?',
    };
  }

  // Error específico de compose_ad: missing background_url o headline
  if (errorLower.includes('missing background_url') || errorLower.includes('missing headline')) {
    // Reintentamos con create_ad que SÍ maneja el pipeline completo
    return {
      kind: 'retry_with_different_tool',
      newCall: {
        id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: 'create_ad',
        arguments: {
          user_prompt: originalUserMessage,
          formats: ['1:1'],
        },
      },
      userMessage: '',
    };
  }

  // No se generó ningún output (filter de seguridad de OpenAI/FAL/etc)
  if (
    errorLower.includes('no image returned') ||
    errorLower.includes('no ads produced') ||
    errorLower.includes('no video url') ||
    errorLower.includes('content policy') ||
    errorLower.includes('safety')
  ) {
    return {
      kind: 'ask_user',
      question:
        'No pude generar lo que pediste — puede ser por filtros de contenido. ¿Probamos con otro enfoque o reformulación?',
    };
  }

  // File not found
  if (errorLower.includes('file not found')) {
    return {
      kind: 'ask_user',
      question:
        'No encuentro ese archivo en tu cuenta. ¿Lo subiste hoy o cambió de nombre?',
    };
  }

  // Genérico: si es el primer intento de una tool visual, reintentamos
  if (
    attemptNumber === 1 &&
    (failedCall.name === 'image' || failedCall.name === 'create_ad')
  ) {
    const retried = simplifyForRetry(failedCall);
    if (retried) {
      return {
        kind: 'retry_with_different_tool',
        newCall: retried,
        userMessage: '',
      };
    }
  }

  // Último recurso
  return {
    kind: 'abort_gracefully',
    userMessage:
      'Se me ha cruzado un cable, brother. ¿Me lo dices con otras palabras y lo lanzo otra vez?',
  };
}

/* -------------------------------------------------------------------------- */
/*  HELPERS DE RETRY                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Simplifica los args de una llamada que falló para aumentar las chances
 * de éxito en el retry. Ejemplo: create_ad con 4 formatos → 1 formato.
 */
function scaleDownForRetry(call: ToolCallRequest): ToolCallRequest | null {
  if (call.name === 'create_ad') {
    return {
      ...call,
      id: `coach-retry-${Date.now()}`,
      arguments: {
        ...call.arguments,
        formats: ['1:1'], // 1 solo formato es más rápido
      },
    };
  }
  if (call.name === 'image') {
    return {
      ...call,
      id: `coach-retry-${Date.now()}`,
      arguments: {
        ...call.arguments,
        num_images: 1, // 1 sola variante
      },
    };
  }
  if (call.name === 'video') {
    return {
      ...call,
      id: `coach-retry-${Date.now()}`,
      arguments: {
        ...call.arguments,
        duration: 4, // duración mínima
      },
    };
  }
  return null;
}

/**
 * Reduce complejidad del prompt si parece demasiado denso o con caracteres raros.
 */
function simplifyForRetry(call: ToolCallRequest): ToolCallRequest | null {
  const args = { ...call.arguments };

  // Si el prompt tiene caracteres raros o es excesivamente largo, lo recortamos
  if (call.name === 'image' && typeof args.prompt === 'string') {
    const cleaned = args.prompt
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '')
      .slice(0, 400)
      .trim();
    if (cleaned !== args.prompt) {
      args.prompt = cleaned;
      return {
        ...call,
        id: `coach-retry-${Date.now()}`,
        arguments: args,
      };
    }
  }

  if (call.name === 'create_ad' && typeof args.user_prompt === 'string') {
    const cleaned = args.user_prompt
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '')
      .slice(0, 300)
      .trim();
    if (cleaned !== args.user_prompt) {
      args.user_prompt = cleaned;
      return {
        ...call,
        id: `coach-retry-${Date.now()}`,
        arguments: args,
      };
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  INFERENCIA: si el coach ni siquiera emitió tool_call válido               */
/* -------------------------------------------------------------------------- */

/**
 * Cuando el coach genera basura sin tool_call detectable, intentamos
 * inferir la tool más probable a partir del mensaje original del usuario.
 * Es el último cinturón de seguridad antes de "abort_gracefully".
 */
function inferToolFromMessage(message: string): ToolCallRequest | null {
  const lower = message.toLowerCase();

  if (/\b(an[uú]nci|publicidad|ad\s|campa[ñn]a|spot)/.test(lower)) {
    return {
      id: `coach-infer-${Date.now()}`,
      name: 'create_ad',
      arguments: {
        user_prompt: message,
        formats: ['1:1'],
      },
    };
  }

  if (/\b(imagen|im[áa]gen|foto|render|ilustra)/.test(lower)) {
    return {
      id: `coach-infer-${Date.now()}`,
      name: 'image',
      arguments: {
        prompt: `Photorealistic high-quality image. ${message}. Professional studio lighting, sharp focus, vibrant colors, balanced composition.`,
        aspect_ratio: '1:1',
      },
    };
  }

  if (/\b(v[íi]deo|video|clip|reel|animaci)/.test(lower)) {
    return {
      id: `coach-infer-${Date.now()}`,
      name: 'video',
      arguments: {
        prompt: message,
        duration: 4,
      },
    };
  }

  if (/\b(repo|repositorio|github|codex|terminal|c[oó]digo|build|deploy|vercel|commit|branch)/.test(lower)) {
    return {
      id: `coach-infer-${Date.now()}`,
      name: 'coding_mission',
      arguments: {
        task: message,
        mode: 'dry-run',
      },
    };
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  CIRCUIT BREAKER                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Decide si seguir intentando o abortar definitivamente.
 */
export function shouldAbortAfterAttempts(attemptNumber: number, maxAttempts: number): boolean {
  return attemptNumber >= maxAttempts;
}
