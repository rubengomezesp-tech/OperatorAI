/**
 * 🛠️ EXTERNAL TOOLS — Public API
 * 
 * Punto único de import para todo el sistema de tools externas.
 * 
 * Uso desde el orchestrator/coach:
 *   import { executeAdapter, listAvailableAdapters } from '@/lib/orchestrator/tools';
 */

export { 
  registerAdapter,
  getAdapter,
  listAvailableAdapters,
  listAllAdapters,
  executeAdapter,
  generateSystemPromptToolsBlock,
} from './tools-registry';

export type {
  ExternalToolName,
  AdapterContext,
  AdapterResult,
  AdapterFunction,
  AdapterDefinition,
} from './types';

// ─── Inicializar adapters (auto-registro al importar) ──────────────
// Cada adapter se auto-registra cuando se importa por primera vez.
import './adapters/web-search.adapter';
import './adapters/web-fetch.adapter';
import './adapters/browser.adapter';
