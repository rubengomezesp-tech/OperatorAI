/**
 * Operator AI — Model Router
 * Phase 2 / Types
 *
 * Vendor-agnostic interface for image-generation models.
 * All clients (Flux, Ideogram, Recraft, GPT-Image, etc) implement
 * the same ModelClient interface. The router reasons about
 * capabilities, never about vendors.
 */

// ────────────────────────────────────────────────────────────────
// MODEL IDENTITY
// ────────────────────────────────────────────────────────────────

export type ModelId =
  | 'flux-1.1-pro'
  | 'flux-1.1-pro-ultra'
  | 'flux-schnell'
  | 'flux-pro-kontext'
  | 'flux-pro-kontext-max'
  | 'ideogram-v3'
  | 'ideogram-v3-turbo'
  | 'recraft-v3'
  | 'recraft-v3-svg'
  | 'gpt-image-1.5'
  | 'imagen-4'
  | 'imagen-4-fast'
  | 'real-esrgan';

export type Vendor = 'fal' | 'replicate' | 'openai' | 'self-hosted';

export type Capability =
  | 'text-rendering' // good at rendering text inside the image
  | 'logo-preservation' // maintains exact logos via reference images
  | 'photoreal' // photo-quality output
  | 'illustration' // illustrative / poster aesthetic
  | 'multi-reference' // accepts >1 reference image
  | 'inpainting' // can fill masked regions
  | 'editing' // accepts an existing image to edit
  | 'svg-export' // outputs vector SVG
  | 'fast' // sub-3-second generation
  | 'ultra-resolution' // 2K+ native
  | 'cheap'; // <$0.01 per image

export type AspectInput = '1:1' | '4:5' | '9:16' | '16:9' | '1.91:1' | '3:4';

// ────────────────────────────────────────────────────────────────
// REQUEST / RESPONSE
// ────────────────────────────────────────────────────────────────

export interface RenderRequest {
  /** The text prompt */
  prompt: string;
  /** Suppression prompt (anti-text, anti-watermark, etc) */
  negativePrompt?: string;
  /** Target aspect ratio */
  aspect: AspectInput;
  /** Width in px (some models require this) */
  width?: number;
  /** Height in px */
  height?: number;
  /** Reference image URLs (for editing/multi-ref models) */
  referenceImages?: string[];
  /**
   * Logo URL — if provided, model uses high-fidelity reference
   * (only applies to models with logo-preservation capability)
   */
  logoUrl?: string;
  /** Random seed for reproducibility */
  seed?: number;
  /** Number of inference steps (model-specific defaults if omitted) */
  steps?: number;
  /** Guidance scale (model-specific) */
  guidance?: number;
  /** Model-specific extras (passed through) */
  extras?: Record<string, unknown>;
}

export interface RenderResult {
  /** Final image URL (CDN-hosted by vendor) */
  imageUrl: string;
  /** Model that produced this */
  modelId: ModelId;
  /** Vendor used */
  vendor: Vendor;
  /** Final width × height */
  width: number;
  height: number;
  /** Cost in USD cents (estimated based on catalog) */
  costCents: number;
  /** Generation latency */
  durationMs: number;
  /** Vendor-specific request ID for debugging */
  requestId?: string;
  /** Optional raw response for further processing */
  raw?: unknown;
}

// ────────────────────────────────────────────────────────────────
// CLIENT INTERFACE
// ────────────────────────────────────────────────────────────────

export interface ModelClient {
  /** Stable identifier */
  readonly id: ModelId;
  /** Backend that runs it */
  readonly vendor: Vendor;
  /** What this model is good at */
  readonly capabilities: Set<Capability>;
  /** Cost in USD cents per generation */
  readonly costCentsPerImage: number;
  /** Typical generation time in ms */
  readonly typicalLatencyMs: number;

  /** Render an image */
  render(request: RenderRequest): Promise<RenderResult>;

  /** Health check (optional — some vendors expose this) */
  healthcheck?(): Promise<{ healthy: boolean; latencyMs?: number }>;
}

// ────────────────────────────────────────────────────────────────
// TIER CONTROL
// ────────────────────────────────────────────────────────────────

export type Tier = 'free' | 'pro' | 'agency';

export type OutputType =
  | 'ad-with-text' // ad where text/CTA is overlaid by Composer (text inside image not needed)
  | 'ad-text-in-image' // legacy single-shot ad with text inside the AI image
  | 'background-only' // AI generates only background; Composer adds text
  | 'mockup' // product mockup (logo on tshirt etc)
  | 'poster' // typography-heavy poster
  | 'photoreal' // photo-quality scene
  | 'illustration' // stylized illustration
  | 'logo-locked' // composition with exact logo from reference
  | 'edit' // image-to-image editing
  | 'draft'; // cheap/fast preview

export interface RoutingContext {
  outputType: OutputType;
  tier: Tier;
  /** Hard requirements that override tier defaults */
  requiredCapabilities?: Capability[];
  /** Cost budget in cents (router rejects models above this) */
  maxCostCents?: number;
  /** Latency budget in ms (router rejects models above this) */
  maxLatencyMs?: number;
}

// ────────────────────────────────────────────────────────────────
// ERRORS
// ────────────────────────────────────────────────────────────────

export class ModelRenderError extends Error {
  constructor(
    public readonly modelId: ModelId,
    public readonly vendor: Vendor,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'ModelRenderError';
  }
}

export class ModelTimeoutError extends ModelRenderError {
  constructor(modelId: ModelId, vendor: Vendor, timeoutMs: number) {
    super(modelId, vendor, `Model ${modelId} timed out after ${timeoutMs}ms`);
    this.name = 'ModelTimeoutError';
  }
}

export class NoModelAvailableError extends Error {
  constructor(public readonly context: RoutingContext) {
    super(
      `No model matches routing context: outputType=${context.outputType}, tier=${context.tier}`
    );
    this.name = 'NoModelAvailableError';
  }
}
