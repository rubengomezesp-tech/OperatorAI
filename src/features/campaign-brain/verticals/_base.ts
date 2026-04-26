/**
 * Vertical registry & smart selector.
 *
 * The selector analyzes user intake and picks the best vertical
 * based on keyword matches, signals, and Brand OS context.
 */

import 'server-only';
import type {
  Vertical,
  VerticalSlug,
  CampaignIntake,
} from '../types';
import { FashionApparelVertical } from './fashion-apparel';
import { FitnessWellnessVertical } from './fitness-wellness';
import { TechSaasAppVertical } from './tech-saas-app';
import { EcommercePhysicalVertical } from './ecommerce-physical';
import { ServicesCoachingVertical } from './services-coaching';

// ────────────────────────────────────────────────────────────────
// REGISTRY — single source of truth for available verticals
// ────────────────────────────────────────────────────────────────

const VERTICALS_REGISTRY: Record<VerticalSlug, Vertical | undefined> = {
  'fashion-apparel': FashionApparelVertical,
  'fitness-wellness': FitnessWellnessVertical,
  'tech-saas-app': TechSaasAppVertical,
  'ecommerce-physical': EcommercePhysicalVertical,
  'services-coaching': ServicesCoachingVertical,

  // Reserved for next session — undefined for now
  'beauty-cosmetics': undefined,
  'food-beverage': undefined,
  'education-online': undefined,
  'real-estate': undefined,
  'automotive': undefined,
  'travel-hospitality': undefined,
  'home-decor': undefined,
  'health-medical': undefined,
  'pets': undefined,
  'jewelry-luxury': undefined,
  'finance-fintech': undefined,
  'other': undefined,
};

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

/**
 * Get a vertical definition by slug.
 * Returns null if not yet implemented.
 */
export function getVertical(slug: VerticalSlug): Vertical | null {
  return VERTICALS_REGISTRY[slug] ?? null;
}

/**
 * Get all currently available verticals.
 */
export function getAvailableVerticals(): Vertical[] {
  return Object.values(VERTICALS_REGISTRY).filter(
    (v): v is Vertical => v !== undefined
  );
}

/**
 * Smart selector: analyze user intake and pick best vertical.
 *
 * Algorithm:
 *   1. If user explicitly chose vertical → use that
 *   2. Else, score each vertical against intake text
 *   3. Highest score wins
 *   4. If no clear winner → fallback to 'ecommerce-physical' (most generic)
 */
export function selectVertical(intake: CampaignIntake): {
  vertical: Vertical;
  confidence: number;
  reasoning: string;
} {
  // 1. Explicit user choice
  if (intake.vertical && VERTICALS_REGISTRY[intake.vertical]) {
    const v = VERTICALS_REGISTRY[intake.vertical];
    if (v) {
      return {
        vertical: v,
        confidence: 1.0,
        reasoning: 'User explicitly selected this vertical',
      };
    }
  }

  // 2. Combine all intake text for keyword matching
  const haystack = [
    intake.productName,
    intake.productDescription,
    intake.goalDescription,
    intake.audienceDescription,
    intake.brandName ?? '',
  ]
    .join(' ')
    .toLowerCase();

  // 3. Score each vertical
  const scores: Array<{ slug: VerticalSlug; vertical: Vertical; score: number; matches: string[] }> = [];

  for (const vertical of getAvailableVerticals()) {
    const matches: string[] = [];
    let score = 0;

    for (const keyword of vertical.matchKeywords) {
      if (haystack.includes(keyword.toLowerCase())) {
        matches.push(keyword);
        score += 1;
      }
    }

    if (score > 0) {
      scores.push({ slug: vertical.id, vertical, score, matches });
    }
  }

  // 4. Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  // 5. Pick winner or fallback
  if (scores.length === 0 || (scores[0]?.score ?? 0) < 1) {
    const fallback = VERTICALS_REGISTRY['ecommerce-physical'];
    if (fallback) {
      return {
        vertical: fallback,
        confidence: 0.3,
        reasoning: 'No specific vertical detected — using generic e-commerce as fallback',
      };
    }
    // Should never happen but TypeScript safety
    throw new Error('No verticals available — registry is empty');
  }

  const winner = scores[0]!;
  const totalKeywordsScanned = winner.vertical.matchKeywords.length;
  const confidence = Math.min(1, winner.score / Math.max(3, totalKeywordsScanned * 0.3));

  return {
    vertical: winner.vertical,
    confidence,
    reasoning: `Detected vertical "${winner.vertical.displayName}" via keywords: ${winner.matches.slice(0, 5).join(', ')}`,
  };
}

/**
 * Build the negative prompt — combining vertical's restrictions
 * with universal "no text" rules from Composer V2.
 */
export function buildNegativePrompt(vertical: Vertical): string {
  const universal = [
    'no text',
    'no logos',
    'no watermarks',
    'no captions',
    'no signage',
    'no labels',
    'no writing',
    'no letters',
    'no numbers',
    'low quality',
    'blurry',
    'pixelated',
    'distorted faces',
    'extra fingers',
    'malformed hands',
  ];

  return [
    ...universal,
    ...vertical.restrictions,
    ...(vertical.extraNegativePrompt ? [vertical.extraNegativePrompt] : []),
  ].join(', ');
}
