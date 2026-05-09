/**
 * 🎨 STYLE DNA LIBRARY — Central Registry
 *
 * Punto único de import para todos los Style DNAs disponibles.
 * Cada DNA se registra automáticamente al importar este módulo.
 *
 * Uso:
 *   import { findDNAByAlias, getAllDNAs } from '@/lib/ads/style-dna/library';
 *   const dna = findDNAByAlias('minimalista');
 */

import type { StyleDNA } from '../types';

// ─── Imports de las categorías ─────────────────────────────────
import { DESIGN_MOVEMENT_DNAS } from './design-movements';
import { BRAND_REFERENCE_DNAS } from './brand-references';
import { CINEMATIC_DNAS } from './cinematic';
import { MOOD_EMOTIONAL_DNAS } from './mood-emotional';
import { PHOTOGRAPHIC_DNAS } from './photographic';
import { BRAND_REFERENCE_EXTRA_DNAS } from './brand-references-extra';
import { CINEMATIC_EXTRA_DNAS } from './cinematic-extra';
import { ERA_HISTORICAL_DNAS } from './era-historical';

// ─── Registry global ────────────────────────────────────────────
const ALL_DNAS: StyleDNA[] = [
  ...DESIGN_MOVEMENT_DNAS,
  ...BRAND_REFERENCE_DNAS,
  ...CINEMATIC_DNAS,
  ...MOOD_EMOTIONAL_DNAS,
  ...PHOTOGRAPHIC_DNAS,
  ...BRAND_REFERENCE_EXTRA_DNAS,
  ...CINEMATIC_EXTRA_DNAS,
  ...ERA_HISTORICAL_DNAS,
];

// ─── Index de búsqueda rápida por ID ────────────────────────────
const DNA_BY_ID = new Map<string, StyleDNA>(
  ALL_DNAS.map((dna) => [dna.id, dna]),
);

// ─── Index de aliases para búsqueda fuzzy ──────────────────────
// Cada alias normalizado (lowercase, trimmed) → DNA
const DNA_BY_ALIAS = new Map<string, StyleDNA>();
for (const dna of ALL_DNAS) {
  for (const alias of dna.aliases) {
    const normalized = alias.toLowerCase().trim();
    DNA_BY_ALIAS.set(normalized, dna);
  }
  // El propio ID también es buscable
  DNA_BY_ALIAS.set(dna.id.toLowerCase(), dna);
  // El nombre humano también es buscable
  DNA_BY_ALIAS.set(dna.name.toLowerCase(), dna);
}

// ─── API pública ────────────────────────────────────────────────

/**
 * Devuelve TODOS los DNAs disponibles en la library.
 */
export function getAllDNAs(): StyleDNA[] {
  return [...ALL_DNAS];
}

/**
 * Cuenta cuántos DNAs hay registrados.
 */
export function getDNACount(): number {
  return ALL_DNAS.length;
}

/**
 * Busca un DNA por su ID exacto.
 */
export function getDNAById(id: string): StyleDNA | undefined {
  return DNA_BY_ID.get(id);
}

/**
 * Busca un DNA por alias (lenguaje natural del usuario).
 * 
 * Ejemplos:
 *   findDNAByAlias('minimalista')      → minimal-japanese-zen
 *   findDNAByAlias('Wes Anderson')     → cinematic-wes-anderson
 *   findDNAByAlias('estilo Apple')     → brand-apple-keynote
 *   findDNAByAlias('memphis 80s')      → design-memphis-group
 *   findDNAByAlias('vibras Yamamoto')  → brand-yohji-yamamoto-noir
 *   findDNAByAlias('THIS_DOES_NOT_EXIST') → undefined
 */
export function findDNAByAlias(alias: string): StyleDNA | undefined {
  const normalized = alias.toLowerCase().trim();

  // 1. Match exacto
  const exact = DNA_BY_ALIAS.get(normalized);
  if (exact) return exact;

  // 2. Match parcial: el alias contiene una palabra clave de algún DNA
  // Ejemplo: "estilo tipo Apple keynote elegante" → match con 'apple keynote'
  for (const [aliasKey, dna] of DNA_BY_ALIAS.entries()) {
    if (aliasKey.length < 4) continue; // Evita falsos positivos con palabras cortas
    if (normalized.includes(aliasKey)) return dna;
  }

  // 3. Match inverso: alguno de los aliases de un DNA está contenido en la query
  for (const dna of ALL_DNAS) {
    for (const a of dna.aliases) {
      const aN = a.toLowerCase().trim();
      if (aN.length < 5) continue;
      if (normalized.includes(aN)) return dna;
    }
  }

  return undefined;
}

/**
 * Filtra DNAs por categoría.
 */
export function getDNAsByCategory(category: StyleDNA['category']): StyleDNA[] {
  return ALL_DNAS.filter((dna) => dna.category === category);
}

/**
 * Filtra DNAs por intensidad.
 */
export function getDNAsByIntensity(intensity: StyleDNA['intensity']): StyleDNA[] {
  return ALL_DNAS.filter((dna) => dna.intensity === intensity);
}

/**
 * Filtra DNAs apropiados para un vertical concreto.
 * Tiene en cuenta tanto bestForVerticals como forbiddenForVerticals.
 */
export function getDNAsForVertical(vertical: string): StyleDNA[] {
  return ALL_DNAS.filter((dna) => {
    // Si está prohibido explícitamente para este vertical, fuera
    if (dna.forbiddenForVerticals?.includes(vertical)) return false;
    // Si tiene lista de "best for" y este vertical está → priorizar
    if (dna.bestForVerticals?.includes(vertical)) return true;
    // Si no tiene restricciones explícitas, es candidato general
    if (!dna.bestForVerticals && !dna.forbiddenForVerticals) return true;
    // Si tiene "best for" pero este vertical no está, no es óptimo
    return false;
  });
}

/**
 * Devuelve estadísticas de la library (para debug/admin).
 */
export function getLibraryStats(): {
  total: number;
  byCategory: Record<string, number>;
  byEra: Record<string, number>;
  byIntensity: Record<string, number>;
  totalAliases: number;
} {
  const byCategory: Record<string, number> = {};
  const byEra: Record<string, number> = {};
  const byIntensity: Record<string, number> = {};
  let totalAliases = 0;

  for (const dna of ALL_DNAS) {
    byCategory[dna.category] = (byCategory[dna.category] ?? 0) + 1;
    byEra[dna.era] = (byEra[dna.era] ?? 0) + 1;
    byIntensity[dna.intensity] = (byIntensity[dna.intensity] ?? 0) + 1;
    totalAliases += dna.aliases.length;
  }

  return {
    total: ALL_DNAS.length,
    byCategory,
    byEra,
    byIntensity,
    totalAliases,
  };
}

// ─── Re-exports ─────────────────────────────────────────────────
export {
  DESIGN_MOVEMENT_DNAS,
  BRAND_REFERENCE_DNAS,
  CINEMATIC_DNAS,
  MOOD_EMOTIONAL_DNAS,
};
