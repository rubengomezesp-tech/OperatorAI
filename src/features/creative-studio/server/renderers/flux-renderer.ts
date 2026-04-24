import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type { Variant, VisualStyle, CampaignDirection } from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';
import {
  VISUAL_STYLES,
  pickDefaultStyleForLayout,
  normalizeVisualStyle,
} from '../../data/visual-styles';

/**
 * FLUX RENDERER v9
 *
 * Prompt construction is LAYERED:
 *   1. Subject (what's the focal element)
 *   2. Composition (how it's framed)
 *   3. Lighting (driven by style, not hardcoded)
 *   4. Palette (driven by style)
 *   5. Camera (lens, aperture, DOF)
 *   6. Reference aesthetic (medium-based)
 *   7. Quality markers (2-3 max, not a wall)
 *   8. Constraints (no text, no empty frame)
 *
 * Key changes vs v8:
 * - No hardcoded "premium commercial advertising" bias
 * - No hardcoded "dark" or "premium" defaults
 * - Style drives lighting/palette/camera independently
 * - Reference aesthetics are medium-based (editorial photography, product shot)
 *   NOT brand names (violates Flux TOS + produces poor output)
 * - Negative prompt tailored per style to prevent drift
 */
export async function renderFlux(
  input: RenderInput & { direction?: CampaignDirection },
): Promise<RenderOutput> {
  const { variant } = input;

  const styleId = variant.styleHint
    ? normalizeVisualStyle(variant.styleHint)
    : pickDefaultStyleForLayout(variant.layout, variant.intensity);

  const style = VISUAL_STYLES[styleId] ?? VISUAL_STYLES.clean_bright;

  const prompt = buildFluxPrompt(variant, style, input.direction);
  const negativePrompt = buildNegativePrompt(style);

  const result = await generateWithFlux({
    prompt,
    aspectRatio: variant.aspectRatio,
    model: 'flux-2-pro',
    negativePrompt,
  });

  const imageUrl = result.urls?.[0];

  if (!imageUrl) {
    throw new Error('Flux renderer: generateWithFlux returned no URLs');
  }

  if (
    typeof imageUrl !== 'string' ||
    (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image/'))
  ) {
    throw new Error(
      'Flux renderer: returned invalid image URL: ' + String(imageUrl),
    );
  }

  console.log('[renderFlux]', { style: styleId, url: imageUrl.slice(0, 80) });

  return { imageUrl, engine: 'flux' };
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDER — layered, style-driven
// ═══════════════════════════════════════════════════════════════════

function buildFluxPrompt(
  variant: Variant,
  style: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const layers: string[] = [];

  // ─── LAYER 1: SUBJECT ───────────────────────────────────────
  // Most important: what's in the image. Comes first so Flux locks on it.
  if (variant.visualDirection) {
    layers.push(variant.visualDirection);
  } else {
    layers.push('clear focal subject with visible environment');
  }

  // ─── LAYER 2: COMPOSITION ──────────────────────────────────
  // Style dictates composition pattern
  layers.push(pickOne(style.composition));

  // Custom composition hint from planner (if provided)
  if (variant.compositionHint) {
    layers.push(variant.compositionHint);
  }

  // Reserved space for text overlay — concrete, not vague
  layers.push('negative space reserved on one side for headline overlay');

  // ─── LAYER 3: LIGHTING ─────────────────────────────────────
  // 100% style-driven, no defaults to "dark" or "premium"
  layers.push(pickOne(style.lighting));

  // ─── LAYER 4: PALETTE ──────────────────────────────────────
  // Style-driven unless direction provides explicit palette
  if (direction?.paletteDirection) {
    layers.push(
      `palette: ${direction.paletteDirection.dominant} dominant with ${direction.paletteDirection.accent} accent`,
    );
  } else {
    layers.push(pickOne(style.palette));
  }

  // ─── LAYER 5: CAMERA ───────────────────────────────────────
  // Realistic photography language — lens + aperture
  layers.push(style.camera.join(', '));

  // ─── LAYER 6: REFERENCE AESTHETIC ──────────────────────────
  // Medium-based, not brand names
  layers.push(pickOne(style.reference));

  // Campaign archetype tones down or enriches the aesthetic
  if (direction?.archetype) {
    const archetypeNote = archetypeToPhrase(direction.archetype);
    if (archetypeNote) layers.push(archetypeNote);
  }

  // ─── LAYER 7: QUALITY MARKERS ──────────────────────────────
  // Just 2-3 precise markers. Stacking degrades Flux.
  layers.push('commercial photography quality, real-world scene');

  // ─── LAYER 8: HARD CONSTRAINTS ─────────────────────────────
  // These must be repeated because Flux ignores them otherwise
  layers.push('no text, no letters, no typography, no UI overlays');
  layers.push('filled scene with visible subject and environment, not an empty backdrop');

  return layers.filter(Boolean).join('. ');
}

// ═══════════════════════════════════════════════════════════════════
// NEGATIVE PROMPT — per-style + universal
// ═══════════════════════════════════════════════════════════════════

function buildNegativePrompt(
  style: (typeof VISUAL_STYLES)[VisualStyle],
): string {
  const universal = [
    // Text/UI (always off)
    'text',
    'letters',
    'words',
    'typography',
    'watermark',
    'signature',
    'UI elements',
    'screenshots',
    // Quality issues
    'blurry',
    'low quality',
    'deformed',
    'distorted anatomy',
    'broken perspective',
    // AI-art clichés
    'trending on artstation',
    'octane render',
    '3D render aesthetic',
    'CGI look',
    'cartoon',
    'clipart',
    'illustration',
    // Bad composition
    'cluttered composition',
    'visual noise overload',
    'dead-centered subject with zero negative space',
    'empty solid-color frame with no subject',
    // Cheap look
    'cheap stock photo',
    'amateur photography',
    'poorly lit',
  ];

  return [...universal, ...style.negativeHints].join(', ');
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Picks one phrase from an array. Used to add slight variation
 * between variants of the same style.
 */
function pickOne(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Campaign archetype → short tonal phrase.
 * Never defaults to "dark premium".
 */
function archetypeToPhrase(archetype: string): string {
  switch (archetype) {
    case 'luxury':
      return 'refined high-end brand sensibility';
    case 'performance':
      return 'high-energy performance marketing tone';
    case 'viral':
      return 'eye-catching scroll-stopping composition';
    case 'launch':
      return 'confident product launch visual';
    case 'editorial':
      return 'sophisticated editorial tone';
    default:
      return '';
  }
}
