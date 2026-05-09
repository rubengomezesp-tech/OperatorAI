/**
 * 🧬 STYLE DNA — Composer / Fusion Engine
 *
 * Fusiona 2-3 DNAs en una identidad visual híbrida.
 *
 * EJEMPLOS DE FUSIÓN:
 *   "minimalista pero con energía Y2K"
 *      → fuse([apple-minimal, y2k-chrome])
 *      → Apple typography + chrome materials
 *
 *   "Wes Anderson noir"
 *      → fuse([wes-anderson, yohji-yamamoto])
 *      → Symmetric framing + black palette
 *
 *   "brutalismo con vibras Ghibli"
 *      → INCOMPATIBLE (forbidden combination)
 *      → falla con error explicativo
 *
 * REGLAS DE FUSIÓN:
 *   1. Máximo 3 DNAs por fusión (más es caos).
 *   2. Verificar forbidden_combinations antes de fusionar.
 *   3. El PRIMER DNA es el "dominante" (su archetypeBase y typography mandan).
 *   4. Los siguientes aportan "flavor" (paleta, mood, materials).
 *   5. Las paletas se intersectan o blendean inteligentemente.
 */

import type { FusedDNA, StyleDNA } from './types';

// ═══════════════════════════════════════════════════════════════
// VALIDACIÓN DE COMPATIBILIDAD
// ═══════════════════════════════════════════════════════════════

export interface CompatibilityCheck {
  compatible: boolean;
  conflicts: Array<{ dnaA: string; dnaB: string; reason: string }>;
}

/**
 * Verifica si una lista de DNAs puede fusionarse sin conflictos.
 */
export function checkCompatibility(dnas: StyleDNA[]): CompatibilityCheck {
  const conflicts: CompatibilityCheck['conflicts'] = [];

  for (let i = 0; i < dnas.length; i++) {
    for (let j = i + 1; j < dnas.length; j++) {
      const a = dnas[i];
      const b = dnas[j];

      // ¿A prohíbe B?
      if (a.forbiddenCombinations?.includes(b.id)) {
        conflicts.push({
          dnaA: a.id,
          dnaB: b.id,
          reason: `${a.name} explicitly forbids combination with ${b.name}`,
        });
      }

      // ¿B prohíbe A?
      if (b.forbiddenCombinations?.includes(a.id)) {
        conflicts.push({
          dnaA: b.id,
          dnaB: a.id,
          reason: `${b.name} explicitly forbids combination with ${a.name}`,
        });
      }

      // Conflicto de intensidad: extreme + subtle es problemático sin dirección
      if (
        (a.intensity === 'extreme' && b.intensity === 'subtle') ||
        (a.intensity === 'subtle' && b.intensity === 'extreme')
      ) {
        // Solo lo registramos como warning, no bloqueamos (puede haber intención)
        // En logs lo veremos. Por ahora no añadimos a conflicts.
      }
    }
  }

  return {
    compatible: conflicts.length === 0,
    conflicts,
  };
}

// ═══════════════════════════════════════════════════════════════
// PALETTE BLENDING
// ═══════════════════════════════════════════════════════════════

/**
 * Combina paletas de varios DNAs.
 * 
 * Estrategia:
 *   - foundation: del DNA dominante (primero).
 *   - primary: intersección priorizando dominante.
 *   - accent: union de todos.
 *   - forbidden: union de todos los forbidden (más restrictivo).
 */
function blendPalettes(dnas: StyleDNA[]): StyleDNA['palette'] {
  if (dnas.length === 0) {
    return { foundation: [], primary: [], accent: [] };
  }

  const dominant = dnas[0];

  // Foundation: dominante manda
  const foundation = [...dominant.palette.foundation];

  // Primary: dominante + 1 color de cada secundario
  const primary = [...dominant.palette.primary];
  for (let i = 1; i < dnas.length; i++) {
    const sec = dnas[i].palette.primary[0];
    if (sec && !primary.includes(sec)) {
      primary.push(sec);
    }
  }

  // Accent: union (limit to 5 to avoid chaos)
  const accentSet = new Set<string>();
  for (const dna of dnas) {
    for (const c of dna.palette.accent) {
      accentSet.add(c);
      if (accentSet.size >= 5) break;
    }
    if (accentSet.size >= 5) break;
  }

  // Forbidden: union (más restrictivo es más seguro)
  const forbiddenSet = new Set<string>();
  for (const dna of dnas) {
    if (dna.palette.forbidden) {
      for (const c of dna.palette.forbidden) {
        forbiddenSet.add(c);
      }
    }
  }

  return {
    foundation,
    primary,
    accent: Array.from(accentSet),
    forbidden: forbiddenSet.size > 0 ? Array.from(forbiddenSet) : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════
// TYPOGRAPHY BLENDING
// ═══════════════════════════════════════════════════════════════

/**
 * Combina sistemas tipográficos.
 * El dominante manda; los secundarios pueden aportar accent fonts.
 */
function blendTypography(dnas: StyleDNA[]): StyleDNA['typography'] {
  if (dnas.length === 0) {
    return { display: [], body: [] };
  }

  const dominant = dnas[0];

  return {
    display: dominant.typography.display,
    body: dominant.typography.body,
    accent: dnas
      .slice(1)
      .map((d) => d.typography.accent ?? d.typography.display)
      .flat()
      .slice(0, 3),
  };
}

// ═══════════════════════════════════════════════════════════════
// PROMPT DIRECTIVE COMPOSITION
// ═══════════════════════════════════════════════════════════════

/**
 * Compone el promptDirective fusionado.
 * 
 * Estrategia:
 *   - Header explicando que es fusión.
 *   - Sección "DOMINANT DNA" con el primero (toda la profundidad).
 *   - Sección "INFLUENCE FROM" con resumen del 2do/3ro.
 *   - "FUSION RULES" — guía explícita para el modelo de cómo combinar.
 */
function composePromptDirective(dnas: StyleDNA[]): string {
  if (dnas.length === 0) return '';
  if (dnas.length === 1) return dnas[0].promptDirective;

  const dominant = dnas[0];
  const influences = dnas.slice(1);

  const influencesBlock = influences
    .map((dna, idx) => {
      const moodList = dna.moodKeywords.slice(0, 5).join(', ');
      const refs =
        dna.references.brands?.slice(0, 2).join(', ') ??
        dna.references.artists?.slice(0, 2).join(', ') ??
        '';

      return `
═══ INFLUENCE ${idx + 1}: ${dna.name.toUpperCase()} ═══
Tagline: ${dna.tagline}
Mood notes to inject: ${moodList}
Reference touchstones: ${refs}
Color contributions: ${dna.palette.primary.slice(0, 3).join(', ')}
Material/texture notes: extracted from ${dna.movement} movement.

KEY ESSENCE TO BLEND IN (NOT to dominate):
${dna.promptDirective.substring(0, 600)}...
`;
    })
    .join('\n');

  return `
╔══════════════════════════════════════════════════════════════╗
║  FUSED STYLE DNA                                             ║
║  ${dominant.name.padEnd(40)} (DOMINANT)             ║
║  ${influences
    .map((d) => `+ ${d.name}`)
    .join(', ')
    .padEnd(58)}║
╚══════════════════════════════════════════════════════════════╝

This composition fuses ${dnas.length} style DNAs. The DOMINANT DNA defines structure (composition, typography, layout). INFLUENCES inject mood, palette accents, and material/texture qualities WITHOUT overriding the dominant framework.

═══ DOMINANT DNA: ${dominant.name.toUpperCase()} ═══
${dominant.promptDirective}

${influencesBlock}

═══ FUSION SYNTHESIS RULES ═══

1. STRUCTURE COMES FROM DOMINANT (${dominant.name}):
   - Composition rules of ${dominant.name} are LAW.
   - Typography family of ${dominant.name} is the system.
   - Camera/photography style of ${dominant.name} prevails.

2. INFLUENCES PROVIDE FLAVOR:
   - Color accents from influences appear in non-dominant elements.
   - Mood/atmospheric qualities from influences shape lighting and material treatment.
   - Cultural references from influences appear as subtle "easter eggs" — never as overrides.

3. CONFLICT RESOLUTION:
   - Where DNAs disagree, DOMINANT wins on STRUCTURE, INFLUENCES win on FEELING.
   - If dominant says "minimal" and influence says "maximalist," result is "minimal composition with one maximalist accent" — never "half maximalist."

4. THE GOAL:
   - The output should READ as the dominant style FIRST, with viewers thinking "this is ${dominant.name}-flavored."
   - On second look, viewers notice the influence: "...but with ${influences[0]?.name ?? '...'} mood/palette/atmosphere."
   - Never a 50/50 blend (that's mud). Always 70% dominant + 30% influence.
`.trim();
}

// ═══════════════════════════════════════════════════════════════
// API PRINCIPAL — FUSE DNA
// ═══════════════════════════════════════════════════════════════

/**
 * Resultado de intentar fusionar DNAs.
 */
export type FuseDNAResult =
  | { ok: true; fused: FusedDNA }
  | { ok: false; reason: string; conflicts: CompatibilityCheck['conflicts'] };

/**
 * Fusiona N DNAs (2-3) en una identidad híbrida.
 * 
 * @param dnas - Array de StyleDNAs a fusionar (orden importa: primero = dominante)
 * @returns FuseDNAResult con éxito o explicación de fallo
 */
export function fuseDNAs(dnas: StyleDNA[]): FuseDNAResult {
  if (dnas.length === 0) {
    return {
      ok: false,
      reason: 'Cannot fuse empty DNA list',
      conflicts: [],
    };
  }

  if (dnas.length === 1) {
    // No hay nada que fusionar — devolvemos como FusedDNA "trivial"
    return {
      ok: true,
      fused: {
        id: dnas[0].id,
        name: dnas[0].name,
        sources: [dnas[0]],
        promptDirective: dnas[0].promptDirective,
        palette: dnas[0].palette,
        typography: dnas[0].typography,
      },
    };
  }

  if (dnas.length > 3) {
    return {
      ok: false,
      reason: `Cannot fuse ${dnas.length} DNAs. Maximum is 3 (more becomes visual chaos).`,
      conflicts: [],
    };
  }

  // Verificar compatibilidad
  const compat = checkCompatibility(dnas);
  if (!compat.compatible) {
    const reasons = compat.conflicts
      .map((c) => `${c.dnaA} ↔ ${c.dnaB}: ${c.reason}`)
      .join(' | ');
    return {
      ok: false,
      reason: `Incompatible DNAs: ${reasons}`,
      conflicts: compat.conflicts,
    };
  }

  // Componer
  const fusedId = dnas.map((d) => d.id).join('+');
  const fusedName = `${dnas[0].name} × ${dnas
    .slice(1)
    .map((d) => d.name)
    .join(' × ')}`;

  return {
    ok: true,
    fused: {
      id: fusedId,
      name: fusedName,
      sources: dnas,
      promptDirective: composePromptDirective(dnas),
      palette: blendPalettes(dnas),
      typography: blendTypography(dnas),
    },
  };
}

/**
 * Helper: intenta fusionar y devuelve el resultado, o el dominante puro si la fusión falla.
 * Útil para no bloquear el flujo cuando hay conflictos.
 */
export function fuseDNAsWithFallback(dnas: StyleDNA[]): FusedDNA {
  const result = fuseDNAs(dnas);
  if (result.ok) return result.fused;

  // Fallback: usar solo el primero (dominante)
  return {
    id: dnas[0].id,
    name: dnas[0].name,
    sources: [dnas[0]],
    promptDirective: dnas[0].promptDirective,
    palette: dnas[0].palette,
    typography: dnas[0].typography,
  };
}
