/**
 * Intent Detector — Pure heuristic, no LLM call.
 *
 * Returns the most likely vertical + subrama based on keyword matching.
 * If confidence is low, returns null (caller falls back to LLM agent).
 */

import type { IntentDetectionResult, VerticalId, SubrameKey } from './types';
import { APPAREL_VERTICAL } from './verticals/apparel';
import { PRODUCT_VERTICAL } from './verticals/product';
import { CONTENT_VERTICAL } from './verticals/content';
import { BUSINESS_VERTICAL } from './verticals/business';

const VERTICALS = [APPAREL_VERTICAL, PRODUCT_VERTICAL, CONTENT_VERTICAL, BUSINESS_VERTICAL];

const MIN_CONFIDENCE = 0.55;

/**
 * Detects which vertical (if any) matches the user input.
 */
export function detectIntent(text: string): IntentDetectionResult {
  if (!text || text.length < 3) {
    return {
      vertical: null,
      subrama: null,
      confidence: 0,
      matched_triggers: [],
      fallback_reason: 'text_too_short',
    };
  }

  const lower = text.toLowerCase().trim();
  const matches: Array<{
    vertical: VerticalId;
    subrama: SubrameKey;
    triggers_hit: string[];
    score: number;
  }> = [];

  for (const vertical of VERTICALS) {
    const verticalHits = vertical.triggers.filter((trig) => lower.includes(trig));
    if (verticalHits.length === 0) continue;

    for (const [subramaKey, subramaConfig] of Object.entries(vertical.subramas)) {
      const subramaHits = subramaConfig.triggers.filter((trig) => lower.includes(trig));
      if (subramaHits.length === 0) continue;

      const allHits = [...new Set([...verticalHits, ...subramaHits])];
      // Score: more specific (subrama) hits weight more
      const score = subramaHits.length * 0.6 + verticalHits.length * 0.4;

      matches.push({
        vertical: vertical.id,
        subrama: subramaKey,
        triggers_hit: allHits,
        score,
      });
    }
  }

  if (matches.length === 0) {
    return {
      vertical: null,
      subrama: null,
      confidence: 0,
      matched_triggers: [],
      fallback_reason: 'no_triggers_matched',
    };
  }

  // Best match by score
  matches.sort((a, b) => b.score - a.score);
  const best = matches[0];

  // Normalize confidence (rough heuristic)
  const confidence = Math.min(1, best.score / 2);

  if (confidence < MIN_CONFIDENCE) {
    return {
      vertical: null,
      subrama: null,
      confidence,
      matched_triggers: best.triggers_hit,
      fallback_reason: 'confidence_too_low',
    };
  }

  return {
    vertical: best.vertical,
    subrama: best.subrama,
    confidence,
    matched_triggers: best.triggers_hit,
  };
}
