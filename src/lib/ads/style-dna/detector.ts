/**
 * 🔍 STYLE DNA — Multi-Variant Intent Detector
 *
 * Parser que analiza un user prompt y extrae:
 *   1. ¿Cuántas variantes pide? (1, 2, 3, 5...)
 *   2. ¿Qué Style DNAs específicos invoca? (Wes Anderson, Bauhaus, Apple...)
 *   3. ¿Hay slots libres para anti-repetition?
 *
 * EJEMPLOS:
 *   "Hazme 3 ads: minimalista, agresivo, editorial"
 *      → variantCount=3, DNAs=[apple-minimal, brutalist, swiss], remaining=0
 *
 *   "Quiero el ad con vibras Wes Anderson"
 *      → variantCount=1, DNAs=[wes-anderson], remaining=0
 *
 *   "5 versiones: estilo Yamamoto, Memphis, y 3 más sorpréndeme"
 *      → variantCount=5, DNAs=[yohji, memphis], remaining=3
 *
 *   "Hazme 3 anuncios" (sin estilo específico)
 *      → variantCount=3, DNAs=[], remaining=3 (todos random)
 */

import type { MultiVariantIntent, StyleDNA } from './types';
import { findDNAByAlias, getAllDNAs } from './library';

// ═══════════════════════════════════════════════════════════════
// PATRONES PARA DETECTAR NÚMERO DE VARIANTES
// ═══════════════════════════════════════════════════════════════

const NUMBER_WORDS_ES: Record<string, number> = {
  un: 1, uno: 1, una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

const NUMBER_WORDS_EN: Record<string, number> = {
  one: 1, a: 1, an: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * Detecta cuántas variantes solicita el usuario.
 * 
 * Soporta:
 *   - Números arábigos: "3 ads", "5 versiones"
 *   - Números en palabras (ES): "tres anuncios", "dos enfoques"
 *   - Números en palabras (EN): "three ads", "two versions"
 *   - Inferencia desde lista: "uno minimalista, otro agresivo" → 2
 */
export function detectVariantCount(prompt: string): number {
  const lower = prompt.toLowerCase();

  // 1. Números arábigos seguidos de palabras-señal
  const variantNouns =
    'anuncios?|ads?|versiones?|versions?|enfoques?|approaches?|variantes?|variants?|opciones?|options?|estilos?|styles?|propuestas?|proposals?|alternativas?|alternatives?|piezas?|pieces?';
  const arabicMatch = lower.match(
    new RegExp(`\\b(\\d+)\\s+(${variantNouns})\\b`),
  );
  if (arabicMatch) {
    const n = parseInt(arabicMatch[1], 10);
    if (n >= 1 && n <= 10) return n;
  }

  // 2. Patrones tipo "hazme/dame/genera N"
  const givePatterns = [
    /\b(?:hazme|dame|genera|generame|crea|create|give\s+me|make\s+me)\s+(\d+)\b/i,
    /\b(\d+)\s+(?:variantes?|versiones?|opciones?)\b/i,
  ];
  for (const pat of givePatterns) {
    const m = lower.match(pat);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 1 && n <= 10) return n;
    }
  }

  // 3. Números en palabras (ES + EN)
  const allNumberWords = { ...NUMBER_WORDS_ES, ...NUMBER_WORDS_EN };
  for (const [word, value] of Object.entries(allNumberWords)) {
    const re = new RegExp(`\\b${word}\\s+(${variantNouns})\\b`, 'i');
    if (re.test(lower)) return value;
  }

  // 4. Patrones de listado: "uno ... otro ... otro" → contar enumeración
  // "uno minimalista, otro agresivo" → 2
  // "uno A, otro B, otro C" → 3
  const otroMatches = lower.match(/\b(uno|otro|another)\b/g);
  if (otroMatches && otroMatches.length >= 2) {
    return otroMatches.length;
  }

  // 5. Default: 1 variante
  return 1;
}

// ═══════════════════════════════════════════════════════════════
// EXTRACCIÓN DE STYLE DNAS
// ═══════════════════════════════════════════════════════════════

/**
 * Limpia frases conectoras del prompt para mejorar matching.
 */
function preprocessPromptForDNA(prompt: string): string {
  return prompt
    .toLowerCase()
    // Eliminar signos de puntuación pesada (mantener comas y espacios)
    .replace(/[.!?;:()[\]{}"']/g, ' ')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Divide el prompt en "segments" — chunks separados por comas, "y", "and",
 * "uno...", "otro...", etc. Cada segment puede contener un estilo distinto.
 */
function segmentPrompt(prompt: string): string[] {
  const cleaned = preprocessPromptForDNA(prompt);

  // Dividir por separadores explícitos de listado
  const separators = [
    ',',
    ' y ',
    ' and ',
    ' uno ',
    ' otro ',
    ' otra ',
    ' another ',
    ' además ',
    ' also ',
  ];

  let segments: string[] = [cleaned];
  for (const sep of separators) {
    const next: string[] = [];
    for (const seg of segments) {
      next.push(...seg.split(sep));
    }
    segments = next;
  }

  return segments.map((s) => s.trim()).filter((s) => s.length > 2);
}

/**
 * Extrae los Style DNAs invocados en el prompt, en ORDEN de aparición.
 * 
 * Estrategia:
 *   1. Segmentar prompt en chunks (separados por comas, "y", "uno...otro...")
 *   2. Para cada segmento, intentar match con findDNAByAlias
 *   3. Devolver lista en orden de aparición SIN duplicados
 */
export function extractStyleDNAs(prompt: string): {
  dnas: StyleDNA[];
  matchedPhrases: string[];
} {
  const segments = segmentPrompt(prompt);
  const matched: StyleDNA[] = [];
  const matchedPhrases: string[] = [];
  const seenIds = new Set<string>();

  for (const segment of segments) {
    const dna = findDNAByAlias(segment);
    if (dna && !seenIds.has(dna.id)) {
      matched.push(dna);
      matchedPhrases.push(segment);
      seenIds.add(dna.id);
    }
  }

  // Si segmentación no encontró nada, intentar match en el prompt completo
  // (puede que el usuario no haya usado lista, sino una sola referencia inline)
  if (matched.length === 0) {
    const cleaned = preprocessPromptForDNA(prompt);
    const dna = findDNAByAlias(cleaned);
    if (dna) {
      matched.push(dna);
      matchedPhrases.push(cleaned);
    }
  }

  // Estrategia adicional: buscar aliases largos en el prompt completo
  // (ejemplo: "Wes Anderson" tiene espacio, no segmenta limpio).
  // Esto rescata DNAs que el segmentador puede haber perdido.
  if (matched.length === 0) {
    const cleaned = preprocessPromptForDNA(prompt);
    for (const dna of getAllDNAs()) {
      for (const alias of dna.aliases) {
        const aN = alias.toLowerCase().trim();
        if (aN.length < 5) continue; // evitar falsos positivos
        if (cleaned.includes(aN) && !seenIds.has(dna.id)) {
          matched.push(dna);
          matchedPhrases.push(aN);
          seenIds.add(dna.id);
          break; // solo un alias por DNA
        }
      }
    }
  }

  return { dnas: matched, matchedPhrases };
}

// ═══════════════════════════════════════════════════════════════
// API PRINCIPAL — DETECTOR COMPLETO
// ═══════════════════════════════════════════════════════════════

/**
 * Detecta multi-variant intent en un user prompt.
 * 
 * @param prompt - Texto del usuario
 * @returns MultiVariantIntent con todas las decisiones tomadas
 * 
 * EJEMPLOS REALES:
 * 
 *   detectMultiVariantIntent("Hazme 3 ads: minimalista, agresivo, editorial")
 *     → {
 *         detected: true,
 *         variantCount: 3,
 *         styleDNAs: [apple-minimal, brutalist, swiss],
 *         remainingSlots: 0,
 *         reason: "User requested 3 variants with 3 explicit DNAs",
 *         matchedPhrases: ["minimalista", "agresivo", "editorial"]
 *       }
 * 
 *   detectMultiVariantIntent("3 ads para Operator: estilo Apple, Vercel, y Vogue")
 *     → 3 DNAs específicos
 * 
 *   detectMultiVariantIntent("Hazme 5 ads: minimalista y 4 más random")
 *     → variantCount=5, DNAs=[apple-minimal], remaining=4
 * 
 *   detectMultiVariantIntent("Hazme un anuncio")
 *     → variantCount=1, DNAs=[], remaining=1 (será fully random)
 */
export function detectMultiVariantIntent(prompt: string): MultiVariantIntent {
  if (!prompt || typeof prompt !== 'string') {
    return {
      detected: false,
      variantCount: 1,
      styleDNAs: [],
      remainingSlots: 1,
      reason: 'Empty or invalid prompt',
      matchedPhrases: [],
    };
  }

  const variantCount = detectVariantCount(prompt);
  const { dnas, matchedPhrases } = extractStyleDNAs(prompt);

  // Limitar DNAs detectados al variantCount (no usar más DNAs que variantes)
  const usableDNAs = dnas.slice(0, variantCount);
  const remainingSlots = Math.max(0, variantCount - usableDNAs.length);

  // ¿"Detected" significa que detectamos AL MENOS UN style DNA explícito?
  // Si no hay DNAs detectados pero piden N variantes, anti-repetition existente
  // se encarga (no es nuestro caso de uso).
  const detected = usableDNAs.length > 0;

  let reason: string;
  if (!detected) {
    reason = `No specific style DNAs detected. ${variantCount} variant(s) will use anti-repetition fallback.`;
  } else if (remainingSlots === 0) {
    reason = `User requested ${variantCount} variant(s) with ${usableDNAs.length} explicit DNA(s).`;
  } else {
    reason = `User requested ${variantCount} variant(s): ${usableDNAs.length} explicit DNA(s) + ${remainingSlots} remaining slot(s) for anti-repetition.`;
  }

  return {
    detected,
    variantCount,
    styleDNAs: usableDNAs,
    remainingSlots,
    reason,
    matchedPhrases: matchedPhrases.slice(0, variantCount),
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS DE DEBUG / LOGGING
// ═══════════════════════════════════════════════════════════════

/**
 * Genera un resumen legible del intent detectado (para logs).
 */
export function formatIntentForLog(intent: MultiVariantIntent): string {
  const dnaIds = intent.styleDNAs.map((d) => d.id).join(', ');
  const phrases = intent.matchedPhrases.join(' | ');
  return [
    `[multi-variant-detector]`,
    `  detected: ${intent.detected}`,
    `  variantCount: ${intent.variantCount}`,
    `  DNAs (${intent.styleDNAs.length}): ${dnaIds || '(none)'}`,
    `  remainingSlots: ${intent.remainingSlots}`,
    `  matchedPhrases: ${phrases || '(none)'}`,
    `  reason: ${intent.reason}`,
  ].join('\n');
}
