import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { generateWithGptImage, GptImageError } from '../gpt-image-client';
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
 * GPT-IMAGE RENDERER (Premium-aware)
 *
 * - If variant.renderPrompt is set (Premium Prompt Orchestrator)
 *   → use it DIRECTLY without rebuilding
 * - Otherwise (legacy path) → build prompt from scenario + style
 *
 * Output is uploaded to Supabase Storage and returned as a public URL.
 */
export async function renderGptImage(
  input: RenderInput & { direction?: CampaignDirection },
): Promise<RenderOutput> {
  const { variant } = input;

  // ★ KEY CHANGE: respect renderPrompt if Brain provided it
  let prompt: string;
  if (variant.renderPrompt && variant.renderPrompt.length > 50) {
    prompt = variant.renderPrompt;
    console.log('[renderGptImage] using premium renderPrompt', {
      variantId: variant.id,
      promptLength: prompt.length,
    });
  } else {
    // Legacy path: build prompt from scenario + style
    const styleId = variant.styleHint
      ? normalizeVisualStyle(variant.styleHint)
      : pickDefaultStyleForLayout(variant.layout, variant.intensity);

    const style = VISUAL_STYLES[styleId] ?? VISUAL_STYLES.clean_bright;
    prompt = buildGptImagePrompt(variant, style, input.direction);
    console.log('[renderGptImage] using legacy buildGptImagePrompt', {
      variantId: variant.id,
      style: styleId,
    });
  }

  // Default to 'high' for premium quality
  const result = await generateWithGptImage({
    prompt,
    aspectRatio: variant.aspectRatio,
    quality: 'high',
  });

  const svc = createSupabaseServiceClient();
  const safeVariantId = String(variant.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `gpt-image/${Date.now()}-${safeVariantId}.png`;

  const { error: upErr } = await svc.storage
    .from('image-outputs')
    .upload(path, result.buffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true,
    });

  if (upErr) {
    throw new GptImageError(
      'UNKNOWN',
      `Supabase upload failed: ${upErr.message}`,
    );
  }

  const { data: pub } = svc.storage.from('image-outputs').getPublicUrl(path);

  const imageUrl = pub.publicUrl;

  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new GptImageError('UNKNOWN', 'Supabase returned invalid public URL');
  }

  console.log('[renderGptImage]', {
    variantId: variant.id,
    quality: result.qualityUsed,
    sizeBytes: result.buffer.length,
    cost: `$${result.estimatedCostUsd.toFixed(4)}`,
    promptType: variant.renderPrompt ? 'premium' : 'legacy',
  });

  return { imageUrl, engine: 'gpt-image' };
}

// ═══════════════════════════════════════════════════════════════════
// LEGACY PROMPT BUILDER (kept as fallback)
// ═══════════════════════════════════════════════════════════════════

function buildGptImagePrompt(
  variant: Variant,
  style: (typeof VISUAL_STYLES)[VisualStyle],
  direction?: CampaignDirection,
): string {
  const parts: string[] = [];

  if (variant.scenario) {
    parts.push(capitalize(variant.scenario.sceneDescription) + '.');
    parts.push(capitalize(variant.scenario.subjectFraming) + '.');
  }

  if (
    variant.visualDirection &&
    (!variant.scenario ||
      !variant.visualDirection.includes(
        variant.scenario.sceneDescription.slice(0, 30),
      ))
  ) {
    parts.push(capitalize(variant.visualDirection) + '.');
  }

  if (variant.compositionHint) {
    parts.push(capitalize(variant.compositionHint) + '.');
  }

  const overlayHint = overlayToPhrase(variant.scenario?.overlaySpace);
  if (overlayHint) parts.push(overlayHint + '.');

  parts.push('Lighting: ' + pickOne(style.lighting) + '.');

  if (direction?.paletteDirection) {
    parts.push(
      `Color palette: ${direction.paletteDirection.dominant} as dominant color with ${direction.paletteDirection.accent} accents.`,
    );
  } else {
    parts.push('Palette: ' + pickOne(style.palette) + '.');
  }

  parts.push('Camera: ' + style.camera.join(', ') + '.');
  parts.push('Style reference: ' + pickOne(style.reference) + '.');

  if (direction?.archetype) {
    const tone = archetypeToPhrase(direction.archetype);
    if (tone) parts.push(capitalize(tone) + '.');
  }

  parts.push('Commercial-grade photography quality.');

  parts.push(
    'Important: do NOT include any text, letters, words, typography, logos, watermarks, or UI overlays in the image.',
  );
  parts.push(
    'The image must show a clear subject within a visible environment. Do not generate an empty backdrop or a blank solid color.',
  );

  return parts.filter(Boolean).join(' ');
}

function pickOne(arr: string[]): string {
  if (!arr || arr.length === 0) return '';
  if (arr.length === 1) return arr[0];
  return arr[Math.floor(Math.random() * arr.length)];
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function overlayToPhrase(
  overlay: AdScenario['overlaySpace'] | undefined,
): string {
  switch (overlay) {
    case 'top':
      return 'Reserve the upper third of the frame as clean negative space for a headline';
    case 'bottom':
      return 'Reserve the lower third of the frame as clean negative space for copy';
    case 'left':
      return 'Leave the left portion of the frame empty for a vertical headline, with the subject on the right';
    case 'right':
      return 'Leave the right portion of the frame empty for a headline, with the subject on the left';
    case 'centered_safe':
      return 'Keep a safe center zone available for overlay text';
    default:
      return '';
  }
}

function archetypeToPhrase(archetype: string): string {
  switch (archetype) {
    case 'luxury':
      return 'the overall tone should feel refined and high-end';
    case 'performance':
      return 'the overall tone should feel energetic and performance-driven';
    case 'viral':
      return 'the composition should be eye-catching and scroll-stopping';
    case 'launch':
      return 'the composition should feel like a confident product launch visual';
    case 'editorial':
      return 'the tone should feel sophisticated and editorial';
    default:
      return '';
  }
}
