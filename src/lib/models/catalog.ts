/**
 * Operator AI — Model Router
 * Phase 2 / Catalog
 *
 * Static metadata for every supported model.
 * Source of truth for capabilities, cost, and routing decisions.
 *
 * Update this file when:
 * - A new model is released
 * - Vendor pricing changes
 * - We measure new latency baselines
 *
 * Last verified: April 2026
 */

import type { Capability, ModelId, Vendor } from './types';

export interface CatalogEntry {
  id: ModelId;
  vendor: Vendor;
  /** Vendor-specific endpoint identifier */
  endpoint: string;
  /** Display name for UI */
  displayName: string;
  /** Short description */
  description: string;
  /** Capabilities this model has */
  capabilities: Capability[];
  /** Cost per generation in USD cents (rounded up) */
  costCentsPerImage: number;
  /** Typical end-to-end latency in milliseconds */
  typicalLatencyMs: number;
  /** Maximum native resolution (px on longest side) */
  maxResolution: number;
  /** Whether this model accepts seed for reproducibility */
  supportsSeed: boolean;
  /** Whether this model accepts negative prompts */
  supportsNegativePrompt: boolean;
  /** Maximum reference images supported */
  maxReferenceImages: number;
  /** Notes for engineers */
  notes?: string;
}

export const CATALOG: Record<ModelId, CatalogEntry> = {
  // ── Flux family ─────────────────────────────────────────────
  'flux-1.1-pro': {
    id: 'flux-1.1-pro',
    vendor: 'fal',
    endpoint: 'fal-ai/flux-pro/v1.1',
    displayName: 'Flux 1.1 Pro',
    description: 'Default photoreal model, no text in image. Reliable workhorse.',
    capabilities: ['photoreal', 'illustration'],
    costCentsPerImage: 4,
    typicalLatencyMs: 8000,
    maxResolution: 1440,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 0,
    notes: 'Use as background-only renderer when Composer is on.',
  },

  'flux-1.1-pro-ultra': {
    id: 'flux-1.1-pro-ultra',
    vendor: 'fal',
    endpoint: 'fal-ai/flux-pro/v1.1-ultra',
    displayName: 'Flux 1.1 Pro Ultra',
    description: '4MP photoreal, premium quality. Slower but higher detail.',
    capabilities: ['photoreal', 'ultra-resolution'],
    costCentsPerImage: 6,
    typicalLatencyMs: 12000,
    maxResolution: 2752,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 0,
    notes: 'Premium tier hero shots. Has prompt_upsampling flag.',
  },

  'flux-schnell': {
    id: 'flux-schnell',
    vendor: 'fal',
    endpoint: 'fal-ai/flux/schnell',
    displayName: 'Flux Schnell',
    description: 'Cheapest/fastest Flux. Good for drafts and free tier.',
    capabilities: ['photoreal', 'fast', 'cheap'],
    costCentsPerImage: 1,
    typicalLatencyMs: 2000,
    maxResolution: 1024,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 0,
  },

  'flux-pro-kontext': {
    id: 'flux-pro-kontext',
    vendor: 'fal',
    endpoint: 'fal-ai/flux-pro/kontext',
    displayName: 'Flux Pro Kontext',
    description: 'Multi-reference editing. Best for logo preservation across edits.',
    capabilities: ['multi-reference', 'editing', 'logo-preservation', 'photoreal'],
    costCentsPerImage: 4,
    typicalLatencyMs: 5500,
    maxResolution: 2048,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 10,
    notes: 'SOTA for "place this logo on this scene" — used for premium mockups.',
  },

  'flux-pro-kontext-max': {
    id: 'flux-pro-kontext-max',
    vendor: 'fal',
    endpoint: 'fal-ai/flux-pro/kontext/max',
    displayName: 'Flux Pro Kontext Max',
    description: 'Higher fidelity Kontext. Agency tier mockups.',
    capabilities: ['multi-reference', 'editing', 'logo-preservation', 'photoreal', 'ultra-resolution'],
    costCentsPerImage: 8,
    typicalLatencyMs: 7000,
    maxResolution: 2048,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 10,
  },

  // ── Ideogram ────────────────────────────────────────────────
  'ideogram-v3': {
    id: 'ideogram-v3',
    vendor: 'fal',
    endpoint: 'fal-ai/ideogram/v3',
    displayName: 'Ideogram V3',
    description: 'Best-in-class text rendering. ~90% accuracy on slogans.',
    capabilities: ['text-rendering', 'illustration', 'photoreal'],
    costCentsPerImage: 7,
    typicalLatencyMs: 6000,
    maxResolution: 2048,
    supportsSeed: true,
    supportsNegativePrompt: true,
    maxReferenceImages: 3,
    notes: 'Use when text MUST be rendered in-image (rare with Composer).',
  },

  'ideogram-v3-turbo': {
    id: 'ideogram-v3-turbo',
    vendor: 'fal',
    endpoint: 'fal-ai/ideogram/v3/turbo',
    displayName: 'Ideogram V3 Turbo',
    description: 'Cheap+fast Ideogram. Good text rendering at budget price.',
    capabilities: ['text-rendering', 'fast', 'cheap'],
    costCentsPerImage: 3,
    typicalLatencyMs: 3500,
    maxResolution: 1280,
    supportsSeed: true,
    supportsNegativePrompt: true,
    maxReferenceImages: 3,
  },

  // ── Recraft ────────────────────────────────────────────────
  'recraft-v3': {
    id: 'recraft-v3',
    vendor: 'fal',
    endpoint: 'fal-ai/recraft/v3/text-to-image',
    displayName: 'Recraft V3',
    description: 'Poster aesthetic, exact brand colors, typography.',
    capabilities: ['text-rendering', 'illustration', 'photoreal'],
    costCentsPerImage: 4,
    typicalLatencyMs: 6500,
    maxResolution: 2048,
    supportsSeed: false,
    supportsNegativePrompt: true,
    maxReferenceImages: 3,
    notes: 'Honors hex codes in prompts. Best for poster-style ads.',
  },

  'recraft-v3-svg': {
    id: 'recraft-v3-svg',
    vendor: 'fal',
    endpoint: 'fal-ai/recraft/v3/text-to-vector',
    displayName: 'Recraft V3 (SVG)',
    description: 'Vector SVG output. Logo concepts and icon design.',
    capabilities: ['text-rendering', 'illustration', 'svg-export'],
    costCentsPerImage: 8,
    typicalLatencyMs: 7000,
    maxResolution: 2048,
    supportsSeed: false,
    supportsNegativePrompt: true,
    maxReferenceImages: 0,
    notes: 'Outputs SVG file URL — special handling in client.',
  },

  // ── GPT-Image ──────────────────────────────────────────────
  'gpt-image-1.5': {
    id: 'gpt-image-1.5',
    vendor: 'openai',
    endpoint: 'gpt-image-1.5',
    displayName: 'GPT-Image 1.5',
    description: 'Multi-ref + logo lock + text rendering. Premium tier default.',
    capabilities: [
      'text-rendering',
      'logo-preservation',
      'multi-reference',
      'photoreal',
      'illustration',
      'editing',
      'ultra-resolution',
    ],
    costCentsPerImage: 8,
    typicalLatencyMs: 14000,
    maxResolution: 2048,
    supportsSeed: false,
    supportsNegativePrompt: false,
    maxReferenceImages: 5,
    notes: 'Use input_fidelity:high for logo preservation. Cost varies by quality tier.',
  },

  // ── Imagen 4 ───────────────────────────────────────────────
  'imagen-4': {
    id: 'imagen-4',
    vendor: 'fal',
    endpoint: 'fal-ai/imagen4/preview',
    displayName: 'Google Imagen 4',
    description: 'Photoreal + text rendering. Strong on natural scenes.',
    capabilities: ['photoreal', 'text-rendering', 'multi-reference'],
    costCentsPerImage: 4,
    typicalLatencyMs: 5500,
    maxResolution: 2048,
    supportsSeed: true,
    supportsNegativePrompt: true,
    maxReferenceImages: 14,
  },

  'imagen-4-fast': {
    id: 'imagen-4-fast',
    vendor: 'fal',
    endpoint: 'fal-ai/imagen4/preview/fast',
    displayName: 'Google Imagen 4 Fast',
    description: 'Cheap photoreal at 2K. Agency tier high-volume.',
    capabilities: ['photoreal', 'fast', 'cheap'],
    costCentsPerImage: 2,
    typicalLatencyMs: 3000,
    maxResolution: 2048,
    supportsSeed: true,
    supportsNegativePrompt: false,
    maxReferenceImages: 0,
  },

  // ── Real-ESRGAN ────────────────────────────────────────────
  'real-esrgan': {
    id: 'real-esrgan',
    vendor: 'replicate',
    endpoint: 'nightmareai/real-esrgan',
    displayName: 'Real-ESRGAN x2/x4',
    description: 'Upscales any image 2× or 4×. Adds sharpness.',
    capabilities: ['ultra-resolution', 'fast'],
    costCentsPerImage: 1,
    typicalLatencyMs: 3000,
    maxResolution: 4096,
    supportsSeed: false,
    supportsNegativePrompt: false,
    maxReferenceImages: 0,
    notes: 'Use after composer for premium tiers.',
  },
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

export function getCatalogEntry(id: ModelId): CatalogEntry {
  const entry = CATALOG[id];
  if (!entry) {
    throw new Error(`Unknown model ID: ${id}`);
  }
  return entry;
}

export function findModelsByCapability(cap: Capability): CatalogEntry[] {
  return Object.values(CATALOG).filter((e) => e.capabilities.includes(cap));
}

export function getCheapestModelWithCapabilities(caps: Capability[]): CatalogEntry | undefined {
  const candidates = Object.values(CATALOG).filter((e) =>
    caps.every((cap) => e.capabilities.includes(cap))
  );
  if (candidates.length === 0) return undefined;
  return candidates.sort((a, b) => a.costCentsPerImage - b.costCentsPerImage)[0];
}
