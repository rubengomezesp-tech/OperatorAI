/**
 * 🎲 LAYOUT RANDOMIZER — Selector inteligente de archetypes
 * 
 * Reemplaza la "convergencia al template default" del modelo por
 * selección rotativa entre los 14 archetypes definidos.
 * 
 * Estrategia:
 *   1. Filtra archetypes válidos por vertical + campaignType
 *   2. Aplica anti-repetition (no usar el último archetype usado)
 *   3. Sampling: 70% explore (random uniforme entre válidos),
 *               30% exploit (preferir bestForVerticals matching)
 * 
 * Anti-repetition tracker: in-memory Map por orgId.
 * (En producción se podría migrar a Supabase para persistencia
 *  cross-process, pero in-memory es suficiente para v1.)
 * 
 * @author OperatorAI + Claude (Sprint 2)
 */

import {
  ARCHETYPES,
  getAllArchetypeIds,
  getArchetypesForVertical,
  type ArchetypeId,
  type LayoutArchetype,
} from './layout-archetypes';

// ─── ANTI-REPETITION TRACKER ─────────────────────────────────────
// Map<orgId, ArchetypeId[]> — guarda los últimos 3 archetypes usados
const RECENT_ARCHETYPES = new Map<string, ArchetypeId[]>();
const RECENT_HISTORY_SIZE = 3;

function recordUsage(orgId: string, archetypeId: ArchetypeId): void {
  const recent = RECENT_ARCHETYPES.get(orgId) ?? [];
  recent.unshift(archetypeId);
  if (recent.length > RECENT_HISTORY_SIZE) {
    recent.length = RECENT_HISTORY_SIZE;
  }
  RECENT_ARCHETYPES.set(orgId, recent);
}

function getRecentArchetypes(orgId: string): ArchetypeId[] {
  return RECENT_ARCHETYPES.get(orgId) ?? [];
}

// ─── SELECTOR PRINCIPAL ──────────────────────────────────────────

export interface SelectArchetypeInput {
  vertical: string;
  campaignType: string;
  orgId: string;
  /** Si el user pidió explícitamente un archetype, lo usamos directo */
  forcedArchetype?: ArchetypeId;
  /** Texto del prompt original para detectar intent semántico (Sprint 3) */
  userPromptText?: string;
  /** Si el user adjuntó 2+ imágenes (logo + character + app icon) → SaaS launch probable */
  hasMultipleImages?: boolean;
}

// ═══ DETECCIÓN DE EXPLORATION INTENT (Sprint 3) ═══
// Si el user pide "explora variantes" / "muestra opciones" / "concept exploration"
// → forzamos brand-system-document (el destructor de competencia)
const EXPLORATION_INTENT_RX = /\b(explora|exploraci[oó]n|variantes|variations|opciones|options|muestra\s+opciones|m[aá]s\s+versiones|more\s+versions|concept\s+exploration|brand\s+book|brand\s+system|identity\s+round|brand\s+exploration|conceptos|concepts|alternativas|alternatives|propuestas|proposals|estilos|styles|formas|shapes|m[aá]s\s+formas|otros\s+conceptos)\b/i;

function detectsExplorationIntent(text?: string): boolean {
  if (!text) return false;
  return EXPLORATION_INTENT_RX.test(text);
}

// ═══ DETECCIÓN DE SAAS LAUNCH INTENT (Sprint 3) ═══
// Si el user pide ad/publicidad para una app/SaaS/producto digital
// → forzamos premium-saas-announcement (el ChatGPT-killer)
const SAAS_LAUNCH_INTENT_RX = /\b(app|aplicaci[oó]n|saas|plataforma|platform|software|launch|lanzamiento|producto\s+digital|herramienta\s+digital|digital\s+tool|web\s+app|mobile\s+app|product\s+launch|app\s+launch)\b/i;

const PREMIUM_AD_INTENT_RX = /\b(publicidad\s+premium|anuncio\s+premium|ad\s+premium|premium\s+ad|hero\s+ad|launch\s+ad|product\s+ad|saas\s+ad)\b/i;

function detectsSaasLaunchIntent(text?: string, hasMultipleImages?: boolean): boolean {
  if (!text) return false;
  // Si hay 2+ imágenes de referencia (logo + character + app icon) → muy probable que sea SaaS launch
  if (hasMultipleImages && SAAS_LAUNCH_INTENT_RX.test(text)) return true;
  // Match directo de "publicidad premium" / "saas ad"
  if (PREMIUM_AD_INTENT_RX.test(text)) return true;
  return false;
}

export interface SelectArchetypeResult {
  archetype: LayoutArchetype;
  reason: string;
}

/**
 * Selecciona el archetype óptimo para esta generación.
 * 
 * Lógica:
 *   1. Si hay forcedArchetype → úsalo
 *   2. Filtra válidos por vertical (excluye forbiddenForVerticals)
 *   3. Excluye recientes del orgId (anti-repetition)
 *   4. Si vertical tiene "bestFor" matching → 70% prob entre esos,
 *      30% prob random entre el resto válido
 *   5. Si no hay matching: random uniforme entre válidos
 */
export function selectArchetype(input: SelectArchetypeInput): SelectArchetypeResult {
  const { vertical, campaignType, orgId, forcedArchetype, userPromptText } = input;

  // 0a. EXPLORATION INTENT (Sprint 3) — "explora", "variantes", "opciones"
  //     fuerza brand-system-document (Pentagram-style brand book)
  if (detectsExplorationIntent(userPromptText)) {
    recordUsage(orgId, 'brand-system-document');
    return {
      archetype: ARCHETYPES['brand-system-document'],
      reason: 'exploration-intent (forced brand-system-document)',
    };
  }

  // 0b. SAAS LAUNCH INTENT (Sprint 3) — ad para app/saas/plataforma
  //     fuerza premium-saas-announcement (Apple/Linear announcement style)
  if (detectsSaasLaunchIntent(userPromptText, input.hasMultipleImages)) {
    recordUsage(orgId, 'premium-saas-announcement');
    return {
      archetype: ARCHETYPES['premium-saas-announcement'],
      reason: 'saas-launch-intent (forced premium-saas-announcement)',
    };
  }

  // 1. Forced override
  if (forcedArchetype && ARCHETYPES[forcedArchetype]) {
    recordUsage(orgId, forcedArchetype);
    return {
      archetype: ARCHETYPES[forcedArchetype],
      reason: `forced: ${forcedArchetype}`,
    };
  }

  // 2. Filter valid archetypes for vertical
  const validIds = getArchetypesForVertical(vertical);
  if (validIds.length === 0) {
    // Fallback: usar todos
    const allIds = getAllArchetypeIds();
    const pick = allIds[Math.floor(Math.random() * allIds.length)];
    recordUsage(orgId, pick);
    return {
      archetype: ARCHETYPES[pick],
      reason: `fallback all (no valid for vertical=${vertical})`,
    };
  }

  // 3. Excluir recientes (anti-repetition)
  const recent = getRecentArchetypes(orgId);
  let candidates = validIds.filter((id) => !recent.includes(id));
  if (candidates.length === 0) {
    // Si todos están recientes, usar válidos sin filtrar
    candidates = validIds;
  }

  // 4. Sampling: prefer bestFor matches (70% explore matching, 30% random)
  const bestForVertical = candidates.filter((id) =>
    ARCHETYPES[id].bestForVerticals.includes(vertical),
  );
  const bestForCampaign = candidates.filter((id) =>
    ARCHETYPES[id].bestForCampaignTypes.includes(campaignType),
  );
  const intersection = bestForVertical.filter((id) => bestForCampaign.includes(id));

  let pool: ArchetypeId[];
  let strategy: string;

  if (intersection.length > 0 && Math.random() < 0.7) {
    // 70% prob: match perfecto vertical+campaign
    pool = intersection;
    strategy = 'best-match (vertical+campaign)';
  } else if (bestForVertical.length > 0 && Math.random() < 0.7) {
    // 70% prob: match vertical solo
    pool = bestForVertical;
    strategy = 'best-vertical';
  } else {
    // 30% explore: cualquier archetype válido (incluye fuera de bestFor)
    pool = candidates;
    strategy = 'explore-random';
  }

  const pick = pool[Math.floor(Math.random() * pool.length)];
  recordUsage(orgId, pick);

  return {
    archetype: ARCHETYPES[pick],
    reason: `${strategy} (pool=${pool.length}, recent=${recent.length})`,
  };
}

// ─── DEBUG / TELEMETRÍA ──────────────────────────────────────────

export function getRecentArchetypesForOrg(orgId: string): ArchetypeId[] {
  return getRecentArchetypes(orgId);
}

export function clearRecentForOrg(orgId: string): void {
  RECENT_ARCHETYPES.delete(orgId);
}
