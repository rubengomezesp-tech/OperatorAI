/**
 * 🏛️ STYLE DNA — Cultural Reference Engine
 *
 * Resuelve referencias culturales LIBRES (que no están en aliases directos
 * de un DNA) a DNAs apropiados.
 *
 * Diferencia con findDNAByAlias:
 *   - findDNAByAlias("wes anderson") → match directo (es un alias).
 *   - resolveReference("Royal Tenenbaums") → busca en `references.works` y resuelve.
 *
 * Esto permite al usuario decir cosas como:
 *   "Estilo Royal Tenenbaums" → Wes Anderson DNA
 *   "Vibras Nighthawks" → Edward Hopper / Melancholy DNA
 *   "Tipo Spirited Away" → Studio Ghibli DNA
 *   "Estética Joy Division" (banda implicada) → Brutalism DNA
 *
 * El engine recorre TODOS los DNAs y busca en:
 *   - aliases (ya cubierto en findDNAByAlias, pero re-verificamos)
 *   - references.brands
 *   - references.artists
 *   - references.works
 *   - references.eras
 *   - moodKeywords (último recurso)
 */

import type { StyleDNA } from './types';
import { findDNAByAlias, getAllDNAs } from './library';

// ═══════════════════════════════════════════════════════════════
// MATCHING SCORERS
// ═══════════════════════════════════════════════════════════════

interface ReferenceMatch {
  dna: StyleDNA;
  score: number;
  matchedField: string;
  matchedValue: string;
}

/**
 * Normaliza texto para matching: lowercase, sin tildes, sin puntuación.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[.,;:!?"'()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula score de coincidencia entre query y un campo de referencia.
 * 
 * Heurística:
 *   - Match exacto: score 100
 *   - Query contiene field: score 80 (ej: "vibras Royal Tenenbaums" contiene "Royal Tenenbaums")
 *   - Field contiene query: score 70 (ej: query "Tenenbaums" → field "The Royal Tenenbaums (2001)")
 *   - Match parcial de palabras (>50% palabras coinciden): score 50
 *   - Sin match: score 0
 */
function scoreReferenceMatch(query: string, field: string): number {
  const q = normalize(query);
  const f = normalize(field);

  if (q === f) return 100;
  if (q.includes(f) && f.length >= 5) return 80;
  if (f.includes(q) && q.length >= 5) return 70;

  // Match de palabras: cuántas palabras de query aparecen en field
  const qWords = q.split(' ').filter((w) => w.length >= 3);
  if (qWords.length === 0) return 0;

  const matchingWords = qWords.filter((w) => f.includes(w));
  const ratio = matchingWords.length / qWords.length;
  if (ratio >= 0.5) return Math.round(50 * ratio);

  return 0;
}

// ═══════════════════════════════════════════════════════════════
// API PRINCIPAL — RESOLVE REFERENCE
// ═══════════════════════════════════════════════════════════════

/**
 * Resuelve una referencia cultural libre a un Style DNA.
 * 
 * Búsqueda multi-campo con scoring:
 *   1. aliases (más alto)
 *   2. references.brands / artists / works / eras
 *   3. moodKeywords (último recurso, low score)
 * 
 * @param reference - Texto libre del usuario (ej: "Royal Tenenbaums", "tipo Borges")
 * @returns El DNA mejor matched, o undefined si nada cuadra
 */
export function resolveReference(reference: string): StyleDNA | undefined {
  if (!reference || typeof reference !== 'string') return undefined;

  const query = normalize(reference);
  if (query.length < 3) return undefined;

  // 1. Intentar match directo por alias primero (más rápido y específico)
  const aliasMatch = findDNAByAlias(reference);
  if (aliasMatch) return aliasMatch;

  // 2. Buscar en todos los campos de referencia
  const matches: ReferenceMatch[] = [];

  for (const dna of getAllDNAs()) {
    let bestForThisDNA: ReferenceMatch | null = null;

    // Brands
    for (const brand of dna.references.brands ?? []) {
      const score = scoreReferenceMatch(query, brand);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score: score + 5, // small boost for brand matches
          matchedField: 'brands',
          matchedValue: brand,
        };
      }
    }

    // Artists
    for (const artist of dna.references.artists ?? []) {
      const score = scoreReferenceMatch(query, artist);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score: score + 10, // bigger boost for artist matches (more specific)
          matchedField: 'artists',
          matchedValue: artist,
        };
      }
    }

    // Works (películas, libros, exposiciones, etc.)
    for (const work of dna.references.works ?? []) {
      const score = scoreReferenceMatch(query, work);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score: score + 15, // biggest boost — works are very specific
          matchedField: 'works',
          matchedValue: work,
        };
      }
    }

    // Eras
    for (const era of dna.references.eras ?? []) {
      const score = scoreReferenceMatch(query, era);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score, // no boost — eras are broad
          matchedField: 'eras',
          matchedValue: era,
        };
      }
    }

    // moodKeywords (último recurso — score bajo)
    for (const mood of dna.moodKeywords) {
      const score = scoreReferenceMatch(query, mood);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score: Math.round(score * 0.5), // halved — moods are too generic
          matchedField: 'moodKeywords',
          matchedValue: mood,
        };
      }
    }

    if (bestForThisDNA) {
      matches.push(bestForThisDNA);
    }
  }

  if (matches.length === 0) return undefined;

  // Ordenar por score descendente
  matches.sort((a, b) => b.score - a.score);

  // Solo devolvemos si el mejor score es suficientemente alto (umbral 30)
  if (matches[0].score < 30) return undefined;

  return matches[0].dna;
}

/**
 * Versión "explicada" del resolver — devuelve también qué campo matched
 * y con qué score. Útil para debugging y telemetría.
 */
export function resolveReferenceWithDetails(reference: string):
  | { dna: StyleDNA; matchedField: string; matchedValue: string; score: number }
  | undefined {
  if (!reference || typeof reference !== 'string') return undefined;

  // Si findDNAByAlias funciona, devolvemos eso con score 100
  const aliasMatch = findDNAByAlias(reference);
  if (aliasMatch) {
    return {
      dna: aliasMatch,
      matchedField: 'aliases',
      matchedValue: reference,
      score: 100,
    };
  }

  // Si no, recurrimos al engine completo
  const query = normalize(reference);
  if (query.length < 3) return undefined;

  const matches: ReferenceMatch[] = [];

  for (const dna of getAllDNAs()) {
    let bestForThisDNA: ReferenceMatch | null = null;

    const fieldGroups: Array<{
      name: string;
      values: string[] | undefined;
      boost: number;
    }> = [
      { name: 'brands', values: dna.references.brands, boost: 5 },
      { name: 'artists', values: dna.references.artists, boost: 10 },
      { name: 'works', values: dna.references.works, boost: 15 },
      { name: 'eras', values: dna.references.eras, boost: 0 },
    ];

    for (const group of fieldGroups) {
      for (const value of group.values ?? []) {
        const score = scoreReferenceMatch(query, value) + group.boost;
        if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
          bestForThisDNA = {
            dna,
            score,
            matchedField: group.name,
            matchedValue: value,
          };
        }
      }
    }

    // moodKeywords con penalty
    for (const mood of dna.moodKeywords) {
      const score = Math.round(scoreReferenceMatch(query, mood) * 0.5);
      if (score > 0 && (!bestForThisDNA || score > bestForThisDNA.score)) {
        bestForThisDNA = {
          dna,
          score,
          matchedField: 'moodKeywords',
          matchedValue: mood,
        };
      }
    }

    if (bestForThisDNA) matches.push(bestForThisDNA);
  }

  if (matches.length === 0) return undefined;
  matches.sort((a, b) => b.score - a.score);
  if (matches[0].score < 30) return undefined;

  return matches[0];
}

/**
 * Encuentra TODOS los DNAs que matchean una referencia (no solo el mejor).
 * Útil para "you might also like" o cuando hay ambigüedad.
 */
export function resolveReferenceAll(reference: string, minScore = 30): StyleDNA[] {
  if (!reference || typeof reference !== 'string') return [];

  const query = normalize(reference);
  if (query.length < 3) return [];

  const matches: ReferenceMatch[] = [];

  for (const dna of getAllDNAs()) {
    let bestScore = 0;
    let bestField = '';
    let bestValue = '';

    const allFields: Array<{ values: string[]; boost: number; name: string }> = [
      { values: dna.aliases, boost: 0, name: 'aliases' },
      { values: dna.references.brands ?? [], boost: 5, name: 'brands' },
      { values: dna.references.artists ?? [], boost: 10, name: 'artists' },
      { values: dna.references.works ?? [], boost: 15, name: 'works' },
      { values: dna.references.eras ?? [], boost: 0, name: 'eras' },
    ];

    for (const group of allFields) {
      for (const value of group.values) {
        const score = scoreReferenceMatch(query, value) + group.boost;
        if (score > bestScore) {
          bestScore = score;
          bestField = group.name;
          bestValue = value;
        }
      }
    }

    if (bestScore >= minScore) {
      matches.push({ dna, score: bestScore, matchedField: bestField, matchedValue: bestValue });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.map((m) => m.dna);
}
