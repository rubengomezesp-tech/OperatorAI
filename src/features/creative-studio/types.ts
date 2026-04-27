// Creative Studio v2 — shared types (v5 — Pixel-perfect editor + Brand Assets)

export type CampaignIntent = 'launch' | 'conversion' | 'branding' | 'retargeting';
export type Vertical = 'saas_app' | 'apparel' | 'ecommerce' | 'physical';
export type Tone = 'premium' | 'playful' | 'aggressive' | 'minimal' | 'technical';
export type VariantLayout =
  | 'hero_app'
  | 'feature_grid'
  | 'story_ad'
  | 'minimal_branding'
  | 'ui_focus';
export type RenderEngine = 'canvas' | 'flux' | 'hybrid' | 'gpt-image' | 'nano-banana';
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
  | 'dark_cinematic'
  | 'clean_bright'
  | 'luxury_beige'
  | 'bold_startup'
  | 'editorial_magazine'
  | 'tech_product_white'
  | 'social_media_ad'
  | 'lifestyle_product'
  | 'minimal_swiss';

export type LogoPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-center';

// ═══════════════════════════════════════════════════════════
// Product Intelligence
// ═══════════════════════════════════════════════════════════

export type ProductCategory =
  | 'fashion_apparel'
  | 'streetwear'
  | 'saas_productivity'
  | 'saas_developer'
  | 'health_supplements'
  | 'food_beverage'
  | 'consumer_tech'
  | 'beauty_cosmetics'
  | 'home_goods'
  | 'fitness_equipment'
  | 'fitness_service'
  | 'local_service'
  | 'ecommerce_general'
  | 'digital_product'
  | 'luxury_goods'
  | 'automotive'
  | 'entertainment_media'
  | 'unknown';

export interface AdScenario {
  id: string;
  name: string;
  sceneDescription: string;
  subjectFraming: string;
  overlaySpace: 'top' | 'bottom' | 'left' | 'right' | 'centered_safe';
  preferredStyles: VisualStyle[];
  summary: string;
}

// ═══════════════════════════════════════════════════════════
// Brand Assets (v5)
// ═══════════════════════════════════════════════════════════

export interface BrandLogoAnalysis {
  /** Hex colors extracted from the logo */
  colors: string[];
  /** Whether the logo appears to have a transparent background */
  hasTransparentBackground: boolean;
  /** horizontal | vertical | square based on aspect ratio */
  orientation: 'horizontal' | 'vertical' | 'square';
  /** Short description from vision model */
  description: string;
}

export interface BrandAssets {
  /** Supabase URL of the logo file */
  logoUrl: string;
  /** Analysis result from vision layer */
  logoAnalysis?: BrandLogoAnalysis;
  /** Optional brand palette (overrides auto-extracted colors) */
  palette?: string[];
  /** Optional tagline / slogan */
  slogan?: string;
  /** Optional brand name */
  brandName?: string;
  /** Optional font / typography preferences */
  fontNotes?: string;
  /** Where to place logo by default in editor */
  defaultLogoPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-center';
}

// ═══════════════════════════════════════════════════════════
// Creative Brain types
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
// Core domain types
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
  scenario?: AdScenario;
  productCategory?: ProductCategory;
  /** Reference images for vision-aware models like Nano Banana */
  referenceImages?: string[];
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
  direction?: CampaignDirection;
  productCategory?: ProductCategory;
  brandAssets?: BrandAssets;
  variants: Variant[];
  memory: CampaignMemory;
  aspectRatio: AspectRatio;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════
// Ad Editor Layer System (v4 - pixel-perfect)
//
// All coordinates are in PIXELS of the native canvas.
// Canvas sizes: 1080×1080 (1:1), 1080×1350 (4:5), 1080×1920 (9:16).
//
// Templates return 0-1 normalized. The editor converts them to px
// when the template is applied.
// ═══════════════════════════════════════════════════════════

export type LayerType = 'text' | 'image' | 'shape' | 'logo';

export interface BaseLayer {
  id: string;
  type: LayerType;
  /** Canvas px (0 = left edge). */
  x: number;
  /** Canvas px (0 = top edge). */
  y: number;
  /** Canvas px width. */
  width: number;
  /** Canvas px height. */
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked?: boolean;
  visible: boolean;
  name?: string;
}

export interface TextLayerData extends BaseLayer {
  type: 'text';
  text: string;
  color: string;
  /**
   * NOTE: historical name. Templates store this as % of canvas height
   * (e.g. 6 = 6% of canvas height). When template is applied, editor
   * multiplies by canvasHeight to get real font-size in px.
   * Editor stores final value in pixels.
   */
  fontSizePercent: number;
  fontFamily: 'inter' | 'system' | 'serif' | 'mono' | 'display';
  fontWeight: number;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
  isButton?: boolean;
  buttonBg?: string;
  buttonTextColor?: string;
  buttonRadius?: number;
  buttonPadding?: number;
}

export interface ImageLayerData extends BaseLayer {
  type: 'image';
  src: string;
  fit: 'contain' | 'cover';
}

export interface ShapeLayerData extends BaseLayer {
  type: 'shape';
  shape: 'rect' | 'circle';
  fill: string;
  strokeWidth: number;
  strokeColor: string;
  borderRadius: number;
}

export interface LogoLayerData extends BaseLayer {
  type: 'logo';
  src: string;
}

export type EditorLayer =
  | TextLayerData
  | ImageLayerData
  | ShapeLayerData
  | LogoLayerData;
