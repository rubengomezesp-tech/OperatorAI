/**
 * 🎨 STYLE DNA — Public API
 *
 * Sistema de identidades visuales (Style DNAs) nivel ChatGPT-pipeline.
 *
 * USO RÁPIDO:
 *
 *   import {
 *     detectMultiVariantIntent,
 *     findDNAByAlias,
 *     fuseDNAs,
 *     resolveReference,
 *   } from '@/lib/ads/style-dna';
 *
 *   // 1. Detectar intent en user prompt
 *   const intent = detectMultiVariantIntent(
 *     "Hazme 3 ads: Wes Anderson, Yamamoto, y Memphis 80s"
 *   );
 *   // → { variantCount: 3, styleDNAs: [wes, yohji, memphis], remainingSlots: 0 }
 *
 *   // 2. Buscar un DNA específico
 *   const dna = findDNAByAlias("brutalismo");
 *
 *   // 3. Fusionar 2 DNAs en uno híbrido
 *   const fused = fuseDNAs([apple, ghibli]);
 *
 *   // 4. Resolver referencia cultural libre
 *   const dna2 = resolveReference("Royal Tenenbaums"); // → Wes Anderson
 *
 * FILOSOFÍA:
 *   Cada Style DNA es una identidad visual COMPLETA con tipografía,
 *   paleta, lighting, cultural references, mood, y "what it rejects."
 *   No son templates — son filosofías estéticas curadas.
 *
 * INTEGRACIÓN CON OPERATOR AI:
 *   Este módulo se integra con brain-bridge.ts para el flujo de
 *   generación de ads. Vertical-knowledge.ts (existente) sigue
 *   manejando contexto de industria; style-dna añade la capa de
 *   identidad visual.
 */

// ─── Types ─────────────────────────────────────────────────────
export type {
  StyleDNA,
  StyleEra,
  StyleMovement,
  StyleIntensity,
  StyleCategory,
  MultiVariantIntent,
  FusedDNA,
} from './types';

// ─── Library API ───────────────────────────────────────────────
export {
  getAllDNAs,
  getDNACount,
  getDNAById,
  findDNAByAlias,
  getDNAsByCategory,
  getDNAsByIntensity,
  getDNAsForVertical,
  getLibraryStats,
} from './library';

// ─── Detector ─────────────────────────────────────────────────
export {
  detectMultiVariantIntent,
  detectVariantCount,
  extractStyleDNAs,
  formatIntentForLog,
} from './detector';

// ─── Composer ─────────────────────────────────────────────────
export {
  fuseDNAs,
  fuseDNAsWithFallback,
  checkCompatibility,
} from './composer';

export type { FuseDNAResult, CompatibilityCheck } from './composer';

// ─── Cultural Reference Engine ────────────────────────────────
export {
  resolveReference,
  resolveReferenceWithDetails,
  resolveReferenceAll,
} from './cultural-reference-engine';
