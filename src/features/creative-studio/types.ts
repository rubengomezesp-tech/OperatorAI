// Creative Studio v2 — shared types

export type CampaignIntent = 'launch' | 'conversion' | 'branding' | 'retargeting';
export type Vertical = 'saas_app' | 'apparel' | 'ecommerce' | 'physical';
export type Tone = 'premium' | 'playful' | 'aggressive' | 'minimal' | 'technical';
export type VariantLayout =
  | 'hero_app'
  | 'feature_grid'
  | 'story_ad'
  | 'minimal_branding'
  | 'ui_focus';
export type RenderEngine = 'canvas' | 'flux' | 'hybrid';
export type AspectRatio = '9:16' | '1:1' | '4:5';
export type ImageRole = 'logo' | 'hero' | 'feature' | 'support' | 'lifestyle';

export type VariantAngle =
  | 'pain'
  | 'result'
  | 'authority'
  | 'curiosity'
  | 'aggressive';

export type Intensity = 'soft' | 'medium' | 'aggressive';

export type VisualStyle =
  | 'luxury'
  | 'minimal'
  | 'startup'
  | 'aggressive'
  | 'cinematic';

export type LogoPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-center';

// ═══════════════════════════════════════════════════════════
// NEW in Tanda 5 — Creative Brain types
// ═══════════════════════════════════════════════════════════

export type CampaignArchetype =
  | 'luxury'
  | 'performance'
  | 'viral'
  | 'launch'
  | 'editorial';

export type VisualRegister =
  | 'cinematic'
  | 'editorial'
  | 'startup'
  | 'aggressive'
  | 'minimal';

export type HeroStrategy =
  | 'device_centered'
  | 'device_angled'
  | 'contextual'
  | 'product_implied'
  | 'brand_only';

export type CopyStrategy =
  | 'text_dominant'
  | 'visual_dominant'
  | 'balanced'
  | 'text_free';

export type LightingDirection =
  | 'dark_premium'
  | 'high_key'
  | 'chiaroscuro'
  | 'ambient_glow'
  | 'flat_editorial';

export type MotionEnergy = 'static' | 'kinetic' | 'atmospheric';

export interface CampaignDirection {
  archetype: CampaignArchetype;
  visualRegister: VisualRegister;
  heroStrategy: HeroStrategy;
  copyStrategy: CopyStrategy;
  lightingDirection: LightingDirection;
  motionEnergy: MotionEnergy;
  paletteDirection: {
    dominant: string;
    accent: string;
    support: string[];
  };
  culturalReferences: string[];
  directionStatement: string;
  rationale: string;
}

// ═══════════════════════════════════════════════════════════
// Existing types
// ═══════════════════════════════════════════════════════════

export interface ImageAnalysis {
  index: number;
  role: ImageRole;
  isScreenshot: boolean;
  screenType?: 'home' | 'dashboard' | 'chat' | 'settings' | 'studio' | 'other';
  visibleText: string[];
  uiElements: string[];
  dominantColors: string[];
  importanceScore: number;
  communicates: 'product' | 'branding' | 'ambience';
  description: string;
}

export interface ProductBrief {
  vertical: Vertical;
  name?: string;
  oneLiner: string;
  features: string[];
  benefits: string[];
  tone: Tone;
  target: string;
  valueProposition: string;
  palette: string[];
  voiceCues: string[];
  suggestedCTA: string;
  campaignIntent: CampaignIntent;
  locale: 'en' | 'es';
}

export interface VariantCopy {
  headline: string;
  subheadline: string;
  cta: string;
  bullets?: string[];
}

export interface VariantComposition {
  heroAssetIndex?: number;
  supportAssetIndices: number[];
  logoIndex?: number;
  logoPosition: LogoPosition;
  mockupType?: 'iphone' | 'laptop' | 'none';
}

export interface Variant {
  id: string;
  layout: VariantLayout;
  angle: VariantAngle;
  intent: string;
  engine: RenderEngine;
  copy: VariantCopy;
  composition: VariantComposition;
  mood: string;
  palette: string[];
  confidence: number;
  reasoningSummary: string;
  aspectRatio: AspectRatio;
  renderPrompt?: string;
  visualDirection: string;
  compositionHint: string;
  intensity: Intensity;
  styleHint: VisualStyle;
}

export interface CampaignMemory {
  previousVariants: Variant[];
  selectedVariantId?: string;
  rejectedVariantIds: string[];
  userEdits: Record<string, Partial<Variant>>;
  regenerationCount: number;
}

export interface HeroScore {
  index: number;
  score: number;
  reasons: string[];
}

export interface QualityReport {
  variantId: string;
  score: number;
  passed: boolean;
  issues: string[];
  suggestions: string[];
  autoRetryRecommended?: boolean;
  subscores?: {
    legibility: number;
    hierarchy: number;
    contrast: number;
    depth: number;
    slopFree: number;
    brandCoherence: number;
  };
}

export interface PersistedCampaign {
  id: string;
  orgId: string;
  userId: string;
  imageUrls: string[];
  instructions?: string;
  brief: ProductBrief;
  analyses: ImageAnalysis[];
  direction?: CampaignDirection; // NEW in Tanda 5
  variants: Variant[];
  memory: CampaignMemory;
  aspectRatio: AspectRatio;
  createdAt: string;
  updatedAt: string;
}
