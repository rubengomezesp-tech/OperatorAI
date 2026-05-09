/**
 * OperatorAI — Sistema Nervioso Central
 * Tipos compartidos para brain, orchestrator, jobs, y endpoints.
 */

// ═══ ASPECT RATIOS ═══
export const ALLOWED_ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:5', '3:2'] as const;
export type AspectRatio = typeof ALLOWED_ASPECT_RATIOS[number];

// ═══ CAMPAIGN TYPES ═══
export type CampaignType =
  | 'flash-sale'
  | 'product-launch'
  | 'waitlist-launch'
  | 'brand-awareness'
  | 'lead-generation'
  | 'social-proof'
  | 'seasonal'
  | 'webinar-event'
  | 'retargeting';

// ═══ VERTICAL ═══
export type Vertical =
  | 'saas'
  | 'fashion'
  | 'fitness'
  | 'beauty'
  | 'food'
  | 'ecommerce'
  | 'coaching'
  | 'finance'
  | 'realestate'
  | 'health'
  | 'education'
  | 'tech'
  | 'agency'
  | 'other';

// ═══ CREATIVE PLAN ═══
export interface CreativePlan {
  creativePlanId: string;
  campaignType: CampaignType;
  vertical: Vertical;
  concept: string;
  mainAngle: string;
  emotionalTrigger: string;
  framework: string;
  visualStyle: VisualStyle;
  layout: AdLayout;
  promptBase: string;
  negativePrompt: string;
  variants: VariantSpec[];
  brandContext?: BrandContext;
  /** Imágenes de referencia adjuntadas por el usuario (base64). Se pasan a gpt-image-2 como references visuales. */
  userImages?: Array<{ base64: string; mimeType: string }>;
  /** Layout archetype seleccionado por el randomizer (Sprint 2). Dicta la estructura compositiva. */
  archetype?: {
    id: string;
    name: string;
    promptDirective: string;
    compositionRules: string[];
    typographyCharacter: string;
    paletteDirective: string;
    lightingDirective: string;
    cameraDirective: string;
    forbidPatterns: string[];
  };
  created_at: string;
}

export interface VisualStyle {
  mood: string;
  colors: string[];
  lighting: string;
  composition: string;
  typographyDirection: string;
  preset?: string;
}

export interface AdLayout {
  type: 'hero_ad' | 'split_screen' | 'before_after' | 'social_proof' | 'minimal';
  safeAreas: string[];
  elements: string[];
}

export interface VariantSpec {
  id: string;
  aspectRatio: AspectRatio;
  variantModifier: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
}

export interface BrandContext {
  brand_name?: string;
  description?: string;
  vibe?: string;
  logo_url?: string;
  colors?: string[];
  fonts?: string[];
  tone_keywords?: string[];
}

// ═══ JOBS ═══
export interface AdJob {
  jobId: string;
  creativePlanId: string;
  orgId: string;
  userId: string;
  status: 'queued' | 'planning' | 'generating' | 'auditing' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  stages: StageLog[];
  results: VariantResult[];
  created_at: string;
  updated_at: string;
}

export interface StageLog {
  stage: string;
  status: 'started' | 'completed' | 'failed';
  durationMs: number;
  error?: string;
  timestamp: string;
}

export interface VariantResult {
  variantId: string;
  aspectRatio: AspectRatio;
  status: 'pending' | 'generating' | 'auditing' | 'completed' | 'failed';
  url?: string;
  storagePath?: string;
  audit?: AuditResult;
  error?: string;
  durationMs?: number;
  retryCount?: number;
}

// ═══ AUDIT ═══
export interface AuditResult {
  passed: boolean;
  score: number;
  issues: AuditIssue[];
  suggestedFix: string;
  reasoning: string;
}

export interface AuditIssue {
  category: 'legibility' | 'cta' | 'logo' | 'invented-text' | 'mobile' | 'composition' | 'brand';
  severity: 'critical' | 'warning' | 'minor';
  description: string;
}

// ═══ INPUT ═══
export interface CreateAdInput {
  userPrompt: string;
  brandContext?: BrandContext;
  logoUrl?: string;
  images?: Array<{ base64: string; mimeType: string }>;
  aspectRatios?: AspectRatio[];
  campaignType?: CampaignType;
  tone?: string;
  language?: 'es' | 'en';
  targetAudience?: string;
  campaignGoal?: string;
  presetOverride?: string;
}

// ═══ RESPONSE ═══
export interface CreateAdResponse {
  jobId: string;
  creativePlanId: string;
  status: AdJob['status'];
  progress: number;
  currentStage: string;
  creativePlan?: CreativePlan;
  results?: VariantResult[];
  stages?: StageLog[];
}
