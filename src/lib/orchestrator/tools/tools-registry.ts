/**
 * 🛠️ TOOLS REGISTRY — Registro central de external adapters
 * 
 * Punto único donde se registran TODOS los adapters externos.
 * El orchestrator/coach consulta este registro para:
 *   - Saber qué tools están disponibles
 *   - Validar argumentos
 *   - Ejecutar tools
 *   - Generar el system prompt con la lista de tools
 */

import type { ExternalToolName, AdapterDefinition, AdapterContext, AdapterResult } from './types';

// ─── Registry interno ────────────────────────────────────────────────
const ADAPTERS = new Map<ExternalToolName, AdapterDefinition>();

/**
 * Registra un adapter en el sistema.
 * Llamado al inicializar cada adapter.
 */
export function registerAdapter<TInput, TOutput>(
  definition: AdapterDefinition<TInput, TOutput>,
): void {
  ADAPTERS.set(definition.name, definition as AdapterDefinition);
  console.log(`[tools-registry] ✅ adapter registered: ${definition.name}`);
}

/**
 * Obtiene un adapter por nombre.
 */
export function getAdapter(name: ExternalToolName): AdapterDefinition | undefined {
  return ADAPTERS.get(name);
}

/**
 * Lista todos los adapters disponibles (que están availability=true).
 */
export function listAvailableAdapters(): AdapterDefinition[] {
  return Array.from(ADAPTERS.values()).filter((adapter) => adapter.isAvailable());
}

/**
 * Lista TODOS los adapters (incluso los no disponibles, para debug).
 */
export function listAllAdapters(): AdapterDefinition[] {
  return Array.from(ADAPTERS.values());
}

/**
 * Ejecuta un adapter por nombre con args validados.
 */
export async function executeAdapter(
  name: ExternalToolName,
  rawInput: unknown,
  ctx: AdapterContext = {},
): Promise<AdapterResult> {
  const adapter = ADAPTERS.get(name);
  if (!adapter) {
    return {
      ok: false,
      error: `Adapter "${name}" no encontrado en el registry`,
    };
  }

  if (!adapter.isAvailable()) {
    return {
      ok: false,
      error: `Adapter "${name}" no está disponible (faltan credentials o setup)`,
    };
  }

  // Validar input con Zod schema
  const parsed = adapter.inputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Input inválido para "${name}": ${parsed.error.message}`,
    };
  }

  // Ejecutar
  console.log(`[tools-registry] 🚀 executing adapter: ${name}`);
  const result = await adapter.execute(parsed.data, ctx);
  console.log(
    `[tools-registry] ${result.ok ? '✅' : '❌'} ${name} done in ${result.durationMs}ms`,
  );
  return result;
}

/**
 * Genera la descripción de tools para inyectar al system prompt del coach.
 * El coach (Qwen v3) usará esto para saber qué tools puede invocar.
 */
export function generateSystemPromptToolsBlock(): string {
  const available = listAvailableAdapters();
  if (available.length === 0) return '';

  const lines: string[] = [
    '═══ EXTERNAL TOOLS DISPONIBLES ═══',
    '',
    'Puedes invocar estas herramientas externas usando el formato:',
    '<tool_call>{"name": "tool_name", "arguments": {...}}</tool_call>',
    '',
  ];

  for (const adapter of available) {
    lines.push(`▸ ${adapter.name}`);
    lines.push(`  ${adapter.description}`);
    if (adapter.requiresConfirmation) {
      lines.push(`  ⚠️ Requiere confirmación del usuario antes de ejecutar`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
