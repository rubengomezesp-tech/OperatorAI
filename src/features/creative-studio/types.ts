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

// NEW in Tanda 4A — marketing angles (more specific than before)
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

  // NEW in Tanda 4A
  visualDirection: string; // sentence describing scene, light, depth
  compositionHint: string; // layout hint for canvas/hybrid
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

// EXTENDED in Tanda 4A — 6 tests, threshold 75, retry recommendation
export interface QualityReport {
  variantId: string;
  score: number;
  passed: boolean;
  issues: string[];
  suggestions: string[];
  autoRetryRecommended?: boolean; // frontend reads this to trigger regenerate
  subscores?: {
    legibility: number; // 0-100
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
  variants: Variant[];
  memory: CampaignMemory;
  aspectRatio: AspectRatio;
  createdAt: string;
  updatedAt: string;
}
