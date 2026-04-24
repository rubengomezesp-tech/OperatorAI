import 'server-only';
import { generateWithFlux } from '@/features/image-studio/server/flux-client';
import type {
  Variant,
  VisualStyle,
  CampaignDirection,
  AdScenario,
} from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';
import {
  VISUAL_STYLES,
  pickDefaultStyleForLayout,
  normalizeVisualStyle,
} from '../../data/visual-styles';

/**
 * FLUX RENDERER v10
 *
 * Prompt construction is LAYERED and SCENARIO-DRIVEN:
 *   1. Scenario scene (what's in the image)
 *   2. Scenario framing (how subject is placed)
 *   3. Custom visual direction from planner
 *   4. Composition hint
 *   5. Lighting (style-driven)
 *   6. Palette (style or direction driven)
 *   7. Camera (style-driven)
 *   8. Reference aesthetic (style-driven)
 *   9. Quality markers (2 max)
 *  10. Hard constraints (no text, filled scene)
 *
 * Key changes vs v9:
 * - Uses variant.scenario (from product intelligence) as primary scene source
 * - Scenario has stable scene description written for the product category
 * - Style still drives lighting/palette/camera for visual variety
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

  console.log('[renderFlux]', {
    style: styleId,
    scenario: variant.scenario?.id,
    url: imageUrl.slice(0, 80),
  });

  return { imageUrl, engine: 'flux' };
}

// ═══════════════════════════════════════════════════════════════════
// PROMPT BUILDER — scenario-driven, style-enriched
// ═══════════════════════════════════════════════════════════════════

function buildFluxPrompt(
  variant: Variant,
  style: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const layers: string[] = [];

  // ─── LAYER 1: SCENARIO SCENE ────────────────────────────────
  // Primary scene description from product intelligence
  if (variant.scenario) {
    layers.push(variant.scenario.sceneDescription);
    layers.push(variant.scenario.subjectFraming);
  }

  // ─── LAYER 2: CUSTOM VISUAL DIRECTION ──────────────────────
  // Additional specifics from planner (may elaborate on scenario)
  if (
    variant.visualDirection &&
    (!variant.scenario ||
      !variant.visualDirection.includes(variant.scenario.sceneDescription))
  ) {
    layers.push(variant.visualDirection);
  }

  // ─── LAYER 3: COMPOSITION HINT ──────────────────────────────
  if (variant.compositionHint) {
    layers.push(variant.compositionHint);
  }

  // ─── LAYER 4: OVERLAY SPACE ─────────────────────────────────
  // Negative space reserved per scenario preference
  const overlayHint = overlayToPhrase(variant.scenario?.overlaySpace);
  if (overlayHint) layers.push(overlayHint);

  // ─── LAYER 5: LIGHTING (style-driven) ──────────────────────
  layers.push(pickOne(style.lighting));

  // ─── LAYER 6: PALETTE ──────────────────────────────────────
  if (direction?.paletteDirection) {
    layers.push(
      `palette: ${direction.paletteDirection.dominant} dominant with ${direction.paletteDirection.accent} accent`,
    );
  } else {
    layers.push(pickOne(style.palette));
  }

  // ─── LAYER 7: CAMERA ───────────────────────────────────────
  layers.push(style.camera.join(', '));

  // ─── LAYER 8: REFERENCE AESTHETIC ──────────────────────────
  layers.push(pickOne(style.reference));

  // ─── LAYER 9: ARCHETYPE TONE ───────────────────────────────
  if (direction?.archetype) {
    const archetypeNote = archetypeToPhrase(direction.archetype);
    if (archetypeNote) layers.push(archetypeNote);
  }

  // ─── LAYER 10: QUALITY MARKERS ─────────────────────────────
  // Just 2 precise markers, not a wall
  layers.push('commercial photography quality, real-world scene');

  // ─── LAYER 11: HARD CONSTRAINTS ────────────────────────────
  layers.push('no text, no letters, no typography, no UI overlays');
  layers.push(
    'filled scene with visible subject and environment, not an empty backdrop',
  );

  return layers.filter(Boolean).join('. ');
}

// ═══════════════════════════════════════════════════════════════════
// NEGATIVE PROMPT
// ═══════════════════════════════════════════════════════════════════

function buildNegativePrompt(
  style: (typeof VISUAL_STYLES)[VisualStyle],
): string {
  const universal = [
    'text',
    'letters',
    'words',
    'typography',
    'watermark',
    'signature',
    'UI elements',
    'screenshots',
    'blurry',
    'low quality',
    'deformed',
    'distorted anatomy',
    'broken perspective',
    'trending on artstation',
    'octane render',
    '3D render aesthetic',
    'CGI look',
    'cartoon',
    'clipart',
    'illustration',
    'cluttered composition',
    'visual noise overload',
    'dead-centered subject with zero negative space',
    'empty solid-color frame with no subject',
    'cheap stock photo',
    'amateur photography',
    'poorly lit',
  ];

  return [...universal, ...style.negativeHints].join(', ');
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function pickOne(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

function overlayToPhrase(
  overlay: AdScenario['overlaySpace'] | undefined,
): string {
  switch (overlay) {
    case 'top':
      return 'upper third of frame reserved as clean negative space for headline';
    case 'bottom':
      return 'lower third of frame reserved as clean space for copy';
    case 'left':
      return 'left portion reserved for vertical headline, subject on right';
    case 'right':
      return 'right portion reserved for headline, subject on left';
    case 'centered_safe':
      return 'composition leaves safe center zone for overlay text';
    default:
      return '';
  }
}

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
