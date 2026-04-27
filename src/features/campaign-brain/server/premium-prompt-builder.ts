/**
 * Premium Prompt Orchestrator
 *
 * Builds a layered prompt for the image model that includes:
 *   1. Brand context (Brand OS: name, slogan, colors, tone)
 *   2. Campaign intelligence (Brain: audience, angle, hidden desire)
 *   3. Visual direction (Brain: aesthetic, lighting, composition)
 *   4. Hook concept (variant headline → visual translation)
 *   5. Vertical knowledge (industry-specific aesthetic cues)
 *   6. Platform spec (aspect ratio, safe zones for text overlay)
 *   7. Negative prompt (avoid generic AI, watermarks, text)
 *
 * Result: a prompt that makes GPT Image / Imagen / Nano Banana
 * produce images that REFLECT the brand, audience and angle —
 * not generic stock photos.
 */

import 'server-only';
import type {
  BrainOutput,
  VariantBrief,
  VerticalSlug,
} from '../types';

// ────────────────────────────────────────────────────────────────
// Brand kit shape (mirrors what Composer V2 returns from brand-adapter)
// ────────────────────────────────────────────────────────────────

export interface BrandKitForPrompt {
  /** Brand display name */
  name?: string | null;
  /** Brand slogan / tagline */
  slogan?: string | null;
  /** Tone description ("confident, modern, considered") */
  tone?: string | null;
  /** Hex colors — first is dominant, rest are accents */
  palette?: string[];
  /** Logo description (extracted by vision model) */
  logoDescription?: string | null;
  /** Whether brand has visual personality data */
  hasBrandData?: boolean;
}

// ────────────────────────────────────────────────────────────────
// Vertical-specific aesthetic cues
// ────────────────────────────────────────────────────────────────

const VERTICAL_AESTHETIC_CUES: Record<VerticalSlug, string> = {
  'fashion-apparel':
    'Editorial fashion photography. Models with confident posture. Natural lighting on fabric textures. Minimalist sets that emphasize the garment.',
  'fitness-wellness':
    'Active lifestyle scenes. Sweat, movement, golden hour or studio rim light. Subjects in motion or focused breath state.',
  'tech-saas-app':
    'Modern tech aesthetic. Subtle UI elements floating in space. Tech-modern color palette. Clean negative space. Glass/glow accents.',
  'ecommerce-physical':
    'Product hero photography. Studio lighting with controlled shadows. Premium props and textures. E-commerce ready composition.',
  'services-coaching':
    'Authentic human moments. Service provider in element or with client. Trust-building eye contact. Warm professional lighting.',
  'beauty-cosmetics':
    'Macro beauty shots. Skin texture, dewy glow, product as hero. Pastel or jewel tones. Editorial cosmetic photography.',
  'food-beverage':
    'Top-down or 45° food photography. Steam, droplets, fresh ingredients. Warm or moody lighting depending on cuisine.',
  'education-online':
    'Bright modern classroom or work-from-home setting. Open laptop, focused student, books or digital tools.',
  'real-estate':
    'Architectural photography. Wide-angle interiors with golden-hour windows. Lifestyle-oriented spaces.',
  'automotive':
    'Cinematic vehicle photography. Dynamic angles, motion blur context, dramatic lighting on metal/paint.',
  'travel-hospitality':
    'Aspirational destination imagery. Golden hour landscapes, infinity pools, local culture moments.',
  'home-decor':
    'Lifestyle interior photography. Warm domestic light, curated styling, hero piece in context.',
  'health-medical':
    'Clean clinical aesthetic. Trust signals: warm lighting, professional setting, focus on patient outcome.',
  pets:
    'Joyful pet photography. Eye-level perspective, natural light, owner-pet bond moments.',
  'jewelry-luxury':
    'Macro jewelry shot. Black or velvet backdrop, single point light source, sharp specular highlights.',
  'finance-fintech':
    'Modern financial aesthetic. Clean charts, confident professional, subtle wealth signals without cliché.',
  other:
    'Premium commercial photography. Strong subject framing, considered lighting, magazine-quality composition.',
};

// ────────────────────────────────────────────────────────────────
// Aspect ratio → platform safe-zone description
// ────────────────────────────────────────────────────────────────

function platformSafeZones(aspectRatio: '1:1' | '4:5' | '9:16'): string {
  switch (aspectRatio) {
    case '9:16':
      return 'Format: vertical 9:16 for Stories/Reels. Reserve top 12% for status bar safe zone and bottom 18% for caption/CTA safe zone. Subject framed in middle two-thirds.';
    case '4:5':
      return 'Format: 4:5 portrait for Instagram/Meta feed. Reserve bottom 15% as negative space for caption. Subject framed in upper two-thirds.';
    case '1:1':
    default:
      return 'Format: 1:1 square for feed grid. Subject centered or rule-of-thirds. Strong visual anchor that holds attention in a scrolling grid.';
  }
}

// ────────────────────────────────────────────────────────────────
// MAIN BUILDER
// ────────────────────────────────────────────────────────────────

export interface PremiumPromptInput {
  variantBrief: VariantBrief;
  brainOutput: BrainOutput;
  vertical: VerticalSlug;
  brandKit?: BrandKitForPrompt | null;
  /** Optional URLs of reference photos uploaded by user (Stage Assets) */
  productPhotoUrls?: string[];
  /** Optional research dossier with visual references */
  researchDossier?: {
    visualReferences: string[];
    productFacts: string[];
  } | null;
  /** Optional Gemini Vision analyses of uploaded product photos */
  productAnalyses?: Array<{
    productType: string;
    generationDescription: string;
    colors: string[];
    materials: string[];
  }>;
}

export interface PremiumPromptResult {
  /** Full layered prompt to pass to image model */
  prompt: string;
  /** Negative prompt (things to avoid) */
  negativePrompt: string;
  /** Debug info about which layers were active */
  layers: {
    brand: boolean;
    brainDiagnostic: boolean;
    visualDirection: boolean;
    hookTranslation: boolean;
    vertical: boolean;
    platform: boolean;
    productReference: boolean;
    visualReferences: boolean;
    productVision: boolean;
  };
}

export function buildPremiumImagePrompt(
  input: PremiumPromptInput,
): PremiumPromptResult {
  const { variantBrief, brainOutput, vertical, brandKit, productPhotoUrls, researchDossier, productAnalyses } = input;

  const layers = {
    brand: false,
    brainDiagnostic: false,
    visualDirection: false,
    hookTranslation: false,
    vertical: false,
    platform: false,
    productReference: false,
    visualReferences: false,
    productVision: false,
  };

  const parts: string[] = [];

  // ─── LAYER 1: BRAND CONTEXT ──────────────────────────────────
  if (brandKit && brandKit.hasBrandData) {
    const brandParts: string[] = [];
    if (brandKit.name) brandParts.push(`Brand: ${brandKit.name}`);
    if (brandKit.tone)
      brandParts.push(`Brand personality: ${brandKit.tone}`);
    if (brandKit.palette && brandKit.palette.length > 0) {
      const dominant = brandKit.palette[0];
      const accents = brandKit.palette.slice(1, 3).join(', ');
      brandParts.push(
        `Brand colors: ${dominant} as dominant${accents ? `, with ${accents} as accents` : ''}`,
      );
    }
    if (brandParts.length > 0) {
      parts.push(brandParts.join('. ') + '.');
      layers.brand = true;
    }
  }

  // ─── LAYER 2: CAMPAIGN INTELLIGENCE ──────────────────────────
  // The "WHY" — psychology of the audience that the image must speak to
  const diagBits: string[] = [];
  if (brainOutput.audience?.primaryPersona) {
    diagBits.push(
      `Audience: ${brainOutput.audience.primaryPersona}`,
    );
  }
  if (brainOutput.diagnostic?.hiddenDesire) {
    diagBits.push(
      `Their unstated desire: "${brainOutput.diagnostic.hiddenDesire}"`,
    );
  }
  if (variantBrief.angle) {
    diagBits.push(`Strategic angle: ${variantBrief.angle}`);
  }
  if (diagBits.length > 0) {
    parts.push(diagBits.join('. ') + '.');
    layers.brainDiagnostic = true;
  }

  // ─── LAYER 3: VISUAL DIRECTION (Brain) ───────────────────────
  if (brainOutput.visualDirection) {
    const vd = brainOutput.visualDirection;
    const visualBits: string[] = [];
    if (vd.aesthetic) visualBits.push(`Aesthetic: ${vd.aesthetic}`);
    if (vd.lighting) visualBits.push(`Lighting: ${vd.lighting}`);
    if (vd.composition) visualBits.push(`Composition: ${vd.composition}`);
    if (vd.moodDescription) visualBits.push(`Mood: ${vd.moodDescription}`);
    if (visualBits.length > 0) {
      parts.push(visualBits.join('. ') + '.');
      layers.visualDirection = true;
    }
  }

  // ─── LAYER 4: HOOK TRANSLATION ───────────────────────────────
  // Translate the headline into VISUAL concept (not literal text)
  if (variantBrief.headline) {
    parts.push(
      `Visual concept (express through image, not text): "${variantBrief.headline}"`,
    );
    layers.hookTranslation = true;
  }

  // ─── LAYER 5: VERTICAL KNOWLEDGE ─────────────────────────────
  const verticalCue = VERTICAL_AESTHETIC_CUES[vertical];
  if (verticalCue) {
    parts.push(verticalCue);
    layers.vertical = true;
  }

  // ─── LAYER 5.5: VISUAL REFERENCES (from research dossier) ────
  if (researchDossier?.visualReferences && researchDossier.visualReferences.length > 0) {
    const refs = researchDossier.visualReferences.slice(0, 5);
    parts.push(
      `Aesthetic references — match the production quality and visual language of: ${refs.join('; ')}.`,
    );
    layers.visualReferences = true;
  }

  // ─── LAYER 6: BACKGROUND PROMPT (from Brain) ─────────────────
  // The Brain already wrote a vertical-aware bg prompt — include it
  if (variantBrief.backgroundPrompt) {
    parts.push(variantBrief.backgroundPrompt);
  }

  // ─── LAYER 7: PRODUCT REFERENCE ──────────────────────────────
  if (productPhotoUrls && productPhotoUrls.length > 0) {
    parts.push(
      `Reference: maintain visual consistency with the supplied product photos. The hero subject should match the product's identity, colors, and proportions.`,
    );
    layers.productReference = true;
  }

  // ─── LAYER 7.5: PRODUCT VISION (from Gemini analysis) ────────
  if (productAnalyses && productAnalyses.length > 0) {
    const primary = productAnalyses[0];
    if (primary.generationDescription) {
      parts.push(
        `Product fidelity (CRITICAL): ${primary.generationDescription}`,
      );
      if (primary.colors.length > 0) {
        parts.push(
          `Preserve exact product colors: ${primary.colors.slice(0, 4).join(', ')}.`,
        );
      }
      if (primary.materials.length > 0) {
        parts.push(
          `Preserve materials: ${primary.materials.slice(0, 3).join(', ')}.`,
        );
      }
      layers.productVision = true;
    }
  }

  // ─── LAYER 8: PLATFORM SPEC ──────────────────────────────────
  parts.push(platformSafeZones(variantBrief.aspectRatio));
  layers.platform = true;

  // ─── LAYER 9: QUALITY CONTRACT ───────────────────────────────
  parts.push(
    'Commercial-grade photography. Sharp focus. Premium production value. Magazine-quality output.',
  );

  // ─── BUILD NEGATIVE PROMPT ───────────────────────────────────
  const negParts: string[] = [];

  // Brain may already provide a negative prompt
  if (variantBrief.negativePrompt) {
    negParts.push(variantBrief.negativePrompt);
  }

  // Always avoid these:
  negParts.push(
    'no text, no letters, no words, no typography, no logos, no watermarks, no UI overlays, no captions',
  );
  negParts.push(
    'no stock photo aesthetic, no generic AI look, no cluttered composition, no fake testimonials',
  );
  negParts.push('no low resolution, no blurriness, no jpeg artifacts');

  // Final assembly
  const prompt = parts
    .filter(Boolean)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(' ');

  const negativePrompt = negParts
    .filter(Boolean)
    .map((p) => p.trim())
    .join('. ');

  return { prompt, negativePrompt, layers };
}

// ────────────────────────────────────────────────────────────────
// Helper: load brand kit from Supabase (server-only)
// Uses the same source Composer V2 uses (brand-adapter)
// ────────────────────────────────────────────────────────────────

export async function loadBrandKitForPrompt(
  svc: ReturnType<
    typeof import('@/lib/supabase/service').createSupabaseServiceClient
  >,
  orgId: string,
): Promise<BrandKitForPrompt | null> {
  try {
    // Reuse Composer V2's brand-adapter — single source of truth
    const { getBrandKitForOrg } = await import('@/lib/composer/brand-adapter');
    const composerKit = await getBrandKitForOrg(svc as never, orgId);

    if (!composerKit) return null;

    // composerKit shape varies — we pick what we need defensively
    const k = composerKit as unknown as Record<string, unknown>;
    return {
      name: (k.brandName as string | undefined) ?? (k.name as string | undefined) ?? null,
      slogan: (k.slogan as string | undefined) ?? null,
      tone: (k.tone as string | undefined) ?? (k.fontNotes as string | undefined) ?? null,
      palette: Array.isArray(k.palette)
        ? (k.palette as string[])
        : Array.isArray(k.colors)
        ? (k.colors as string[])
        : [],
      logoDescription:
        (k.logoDescription as string | undefined) ??
        (k.description as string | undefined) ??
        null,
      hasBrandData: true,
    };
  } catch (err) {
    console.warn('[premium-prompt] loadBrandKit failed', {
      error: (err as Error).message,
    });
    return null;
  }
}
