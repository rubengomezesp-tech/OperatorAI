/**
 * Operator AI — Campaign Brain V2
 * Type definitions shared across the system.
 */

import 'server-only';

// ────────────────────────────────────────────────────────────────
// VERTICAL TYPES
// ────────────────────────────────────────────────────────────────

export type VerticalSlug =
  | 'fashion-apparel'
  | 'fitness-wellness'
  | 'tech-saas-app'
  | 'ecommerce-physical'
  | 'services-coaching'
  // Reserved for future expansion (mensaje 4):
  | 'beauty-cosmetics'
  | 'food-beverage'
  | 'education-online'
  | 'real-estate'
  | 'automotive'
  | 'travel-hospitality'
  | 'home-decor'
  | 'health-medical'
  | 'pets'
  | 'jewelry-luxury'
  | 'finance-fintech'
  | 'other';

export type CampaignTypeSlug =
  | 'product-launch'
  | 'flash-sale'
  | 'lead-generation'
  | 'brand-awareness'
  | 'seasonal'
  | 'social-proof'
  | 'retargeting'
  | 'waitlist-launch'
  | 'webinar-event';

export type AngleSlug =
  | 'pain-point'
  | 'desire'
  | 'authority'
  | 'luxury'
  | 'viral'
  | 'conversion'
  | 'curiosity'
  | 'urgency'
  | 'social-proof';

export type Aesthetic =
  | 'editorial'
  | 'lifestyle'
  | 'product-studio'
  | 'lookbook'
  | 'documentary'
  | 'minimal'
  | 'energetic'
  | 'luxury'
  | 'tech-modern'
  | 'organic-natural'
  | 'urban-street'
  | 'cinematic';

export type LightingMood =
  | 'soft-natural'
  | 'golden-hour'
  | 'dramatic-studio'
  | 'cool-cinematic'
  | 'overcast-soft'
  | 'high-key-bright'
  | 'low-key-moody'
  | 'neon-tech';

export type CompositionStyle =
  | 'rule-of-thirds'
  | 'centered-symmetric'
  | 'negative-space'
  | 'dynamic-diagonal'
  | 'overhead-flat-lay'
  | 'low-angle-hero'
  | 'eye-level-portrait';

export type AspectRatio = '1:1' | '4:5' | '9:16';

export type Platform =
  | 'instagram-feed'
  | 'instagram-story'
  | 'instagram-reel'
  | 'tiktok'
  | 'meta-ads'
  | 'linkedin'
  | 'pinterest'
  | 'twitter';

// ────────────────────────────────────────────────────────────────
// VERTICAL DEFINITION (the contract)
// ────────────────────────────────────────────────────────────────

/**
 * A Vertical encodes domain expertise:
 *   - When to select it (keywords, signals)
 *   - Visual codes (aesthetic, lighting, references)
 *   - Hook frameworks specific to the industry
 *   - Audience triggers
 *   - Restrictions
 *   - Background prompt generator
 */
export interface Vertical {
  /** URL-safe slug — must match VerticalSlug type */
  id: VerticalSlug;
  /** User-facing display name */
  displayName: string;
  /** One-line description shown in selector UI */
  description: string;
  /** Emoji or icon identifier for UI */
  icon: string;

  /** Brain selects this vertical if any of these match user input */
  matchKeywords: string[];

  /** Brain selects this vertical if any of these signal types match */
  matchSignals?: {
    productCategories?: string[];
    audiences?: string[];
    objectives?: string[];
  };

  /** Visual aesthetic codes for this industry */
  visualCodes: VerticalVisualCodes;

  /** Hook frameworks (proven copywriting structures) */
  hookFrameworks: HookFramework[];

  /** Trigger words by audience subtype */
  audienceTriggers: Record<string, string[]>;

  /** Things to AVOID in image generation */
  restrictions: string[];

  /** Generator function — produces background prompt for this vertical */
  generateBackgroundPrompt: (context: PromptContext) => string;

  /** Optional: extra negative prompt additions */
  extraNegativePrompt?: string;
}

export interface VerticalVisualCodes {
  /** Default aesthetic — can be overridden by campaign type */
  defaultAesthetic: Aesthetic;
  /** Photographic references (artists, magazines, brands) */
  references: string[];
  /** Default lighting mood */
  defaultLighting: LightingMood;
  /** Default composition style */
  defaultComposition: CompositionStyle;
  /** Mood adjectives that describe the vertical's feel */
  moodKeywords: string[];
  /** Color tendencies (description, not hex) */
  colorTendencies: string;
}

export interface HookFramework {
  /** Internal ID */
  id: string;
  /** Pattern name visible to user */
  name: string;
  /** Template with placeholders {brand}, {benefit}, {pain}, etc */
  template: string;
  /** Example filled-in */
  example: string;
  /** Best angles where this hook works */
  worksWithAngles: AngleSlug[];
}

// ────────────────────────────────────────────────────────────────
// CAMPAIGN TYPE DEFINITION
// ────────────────────────────────────────────────────────────────

export interface CampaignType {
  id: CampaignTypeSlug;
  displayName: string;
  description: string;
  icon: string;

  /** Psychology of this campaign type (urgency? trust? hype?) */
  psychology: string;

  /** Recommended angles for this campaign type */
  recommendedAngles: AngleSlug[];

  /** How CTAs typically read for this type */
  ctaPatterns: string[];

  /** How copy emphasizes — pricing, scarcity, transformation, etc */
  copyEmphasis: string[];

  /** Visual modifiers applied on top of vertical's defaults */
  visualModifiers?: {
    intensifyMood?: 'high' | 'low' | 'maintain';
    overlayElements?: string[];
    restrictions?: string[];
  };
}

// ────────────────────────────────────────────────────────────────
// ANGLE DEFINITION
// ────────────────────────────────────────────────────────────────

export interface Angle {
  id: AngleSlug;
  displayName: string;
  description: string;
  emoji: string;

  /** Psychology behind this angle */
  psychology: string;

  /** Best-fit hook framework IDs */
  preferredHookFrameworks: string[];

  /** Visual cues that reinforce this angle */
  visualCues: string[];

  /** Color emotion mapping */
  emotionalColor: 'warm' | 'cool' | 'neutral' | 'high-contrast';

  /** When to use vs when to avoid */
  useWhen: string[];
  avoidWhen: string[];
}

// ────────────────────────────────────────────────────────────────
// PROMPT CONTEXT (passed to generators)
// ────────────────────────────────────────────────────────────────

export interface PromptContext {
  /** What's being promoted */
  productName: string;
  productDescription: string;
  productCategory?: string;

  /** Brand context (from Brand OS or user input) */
  brandName: string;
  brandTone?: string;
  brandColors?: { primary?: string; accent?: string };

  /** Campaign context */
  angle: AngleSlug;
  campaignType: CampaignTypeSlug;
  platform: Platform;
  aspectRatio: AspectRatio;

  /** Audience */
  audience?: string;
  audienceTriggers?: string[];

  /** Special context */
  hasOffer?: boolean;
  offerDetails?: string; // "50% off", "buy 2 get 1", etc
  isLaunch?: boolean;
  isSeasonal?: { season: string; holiday?: string };

  /** Image references uploaded by user */
  hasReferenceImages?: boolean;
  referenceDescription?: string;
}

// ────────────────────────────────────────────────────────────────
// INTAKE DATA (what user fills in the form)
// ────────────────────────────────────────────────────────────────

export interface CampaignIntake {
  // Required core
  campaignName: string;
  productName: string;
  productDescription: string;
  goalDescription: string;
  audienceDescription: string;

  // Optional but recommended
  vertical?: VerticalSlug; // user can override Brain's choice
  campaignType?: CampaignTypeSlug;
  platforms?: Platform[];
  brandTone?: string;
  offer?: string;
  callToAction?: string;
  competitorReferences?: string[];
  visualReferences?: string[]; // URLs of uploaded images
  doNotInclude?: string;

  // Auto-populated from Brand OS if available
  brandName?: string;
  brandColors?: Record<string, string>;
  brandLogoUrl?: string;
  brandFontUrl?: string;
}

// ────────────────────────────────────────────────────────────────
// BRAIN OUTPUT (Strategy Brief)
// ────────────────────────────────────────────────────────────────

export interface BrainOutput {
  /** Optional research dossier (web search + visual refs) */
  researchDossier?: {
    productFacts: string[];
    competitorSignals: string[];
    visualReferences: string[];
    trendingTopics: string[];
    sources: string[];
    synthesis: string;
    fromLiveSearch: boolean;
    durationMs: number;
  } | null;

  /** Brain's reasoning summary */
  reasoning: string;

  /** Detected/confirmed vertical and type */
  detectedVertical: VerticalSlug;
  detectedCampaignType: CampaignTypeSlug;
  confidence: number; // 0-1

  /** Diagnostic */
  diagnostic: {
    pain: string;
    desire: string;
    objection: string;
    hiddenDesire: string;
  };

  /** Audience deep-dive */
  audience: {
    primaryPersona: string;
    secondaryPersonas: string[];
    triggers: string[];
    barriers: string[];
  };

  /** Strategic angles selected */
  selectedAngles: {
    primary: AngleSlug;
    alternatives: AngleSlug[];
    reasoning: string;
  };

  /** Visual direction */
  visualDirection: {
    aesthetic: Aesthetic;
    lighting: LightingMood;
    composition: CompositionStyle;
    moodDescription: string;
  };

  /** Hooks generated */
  hooks: Array<{
    text: string;
    framework: string;
    targetAngle: AngleSlug;
  }>;

  /** CTAs */
  ctas: string[];

  /** Variant briefs (input for renderer) */
  variantBriefs: VariantBrief[];

  /** Optional: Launch plan if applicable */
  launchPlan?: LaunchPlan;
}

export interface VariantBrief {
  id: string;
  angle: AngleSlug;
  platform: Platform;
  aspectRatio: AspectRatio;
  headline: string;
  cta: string;
  backgroundPrompt: string;
  negativePrompt: string;
  reasoning: string;
}

export interface LaunchPlan {
  durationDays: number;
  posts: Array<{
    day: number;
    time?: string;
    platform: Platform;
    contentType: 'feed' | 'story' | 'reel' | 'ad';
    angle: AngleSlug;
    copyHint: string;
    visualHint: string;
  }>;
}

// ────────────────────────────────────────────────────────────────
// HELPER GUARDS
// ────────────────────────────────────────────────────────────────

export function isValidVertical(s: string): s is VerticalSlug {
  return [
    'fashion-apparel',
    'fitness-wellness',
    'tech-saas-app',
    'ecommerce-physical',
    'services-coaching',
    'beauty-cosmetics',
    'food-beverage',
    'education-online',
    'real-estate',
    'automotive',
    'travel-hospitality',
    'home-decor',
    'health-medical',
    'pets',
    'jewelry-luxury',
    'finance-fintech',
    'other',
  ].includes(s);
}

export function isValidCampaignType(s: string): s is CampaignTypeSlug {
  return [
    'product-launch',
    'flash-sale',
    'lead-generation',
    'brand-awareness',
    'seasonal',
    'social-proof',
    'retargeting',
    'waitlist-launch',
    'webinar-event',
  ].includes(s);
}
