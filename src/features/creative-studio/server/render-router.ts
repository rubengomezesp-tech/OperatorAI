import 'server-only';
import type { Variant, ImageAnalysis, QualityReport } from '../types';
import {
  renderCanvas,
  type RenderInput,
  type RenderOutput,
} from './renderers/canvas-renderer';
import { renderFlux } from './renderers/flux-renderer';
import { renderHybrid } from './renderers/hybrid-renderer';
import { evaluateVariant } from './quality-gate';

export interface FullRenderResult extends RenderOutput {
  qualityReport?: QualityReport;
  retried: boolean;
}

const PASS_THRESHOLD = 75;

/**
 * Orchestrates the render pipeline:
 * 1. Pick engine (with heroScore override)
 * 2. Render
 * 3. Quality gate (flux/hybrid get a real score; canvas gets fail-open until browser evaluates)
 * 4. If score < 75 and engine ∈ {flux, hybrid}: ONE aggressive retry
 * 5. Return result + report
 *
 * Canvas variants: if quality gate later flags them via /api/creative/validate,
 * the frontend triggers /api/creative/regenerate-variant (Tanda 4B wiring).
 * No hidden loops. No uncontrolled spend. Max 1 retry.
 */
export async function renderWithQuality(
  input: RenderInput,
): Promise<FullRenderResult> {
  const variant = selectEngineForVariant(input.variant, input.analyses);
  const inputWithEngine: RenderInput = { ...input, variant };

  let result: RenderOutput;
  try {
    result = await runEngine(inputWithEngine);
  } catch (err) {
    console.error('[render-router] primary engine failed:', err);
    result = await renderCanvas(inputWithEngine);
  }

  // Canvas variants: evaluation happens client-side
  if (!result.imageUrl.startsWith('http')) {
    return { ...result, retried: false };
  }

  const report = await evaluateVariant(variant, result.imageUrl);
  if (report.passed) {
    return { ...result, qualityReport: report, retried: false };
  }

  if (result.engine === 'canvas') {
    // Shouldn't happen (canvas does not produce http), but safeguard
    return { ...result, qualityReport: report, retried: false };
  }

  console.warn(
    '[render-router] quality gate score ' +
      report.score +
      ' below ' +
      PASS_THRESHOLD +
      ', retrying once for variant ' +
      variant.id,
  );

  const retryVariant = applyAggressiveRetry(variant, report);
  const retryInput: RenderInput = { ...input, variant: retryVariant };

  let retried: RenderOutput;
  try {
    retried = await runEngine(retryInput);
  } catch (err) {
    console.error('[render-router] retry failed, returning original:', err);
    return { ...result, qualityReport: report, retried: true };
  }

  if (!retried.imageUrl.startsWith('http')) {
    return { ...retried, qualityReport: report, retried: true };
  }

  const retryReport = await evaluateVariant(retryVariant, retried.imageUrl);

  // Pick whichever is better
  if (retryReport.score >= report.score) {
    return { ...retried, qualityReport: retryReport, retried: true };
  }
  return { ...result, qualityReport: report, retried: true };
}

function runEngine(input: RenderInput): Promise<RenderOutput> {
  switch (input.variant.engine) {
    case 'flux':
      return renderFlux(input);
    case 'hybrid':
      return renderHybrid(input);
    case 'canvas':
    default:
      return renderCanvas(input);
  }
}

/**
 * Engine override based on hero quality:
 * - hero score < 40 and engine is canvas and layout is not feature_grid/ui_focus
 *   -> promote to hybrid (Flux fills weak background, canvas overlays real UI)
 */
function selectEngineForVariant(
  variant: Variant,
  analyses: ImageAnalysis[],
): Variant {
  if (variant.engine !== 'canvas') return variant;
  if (variant.layout === 'feature_grid' || variant.layout === 'ui_focus') {
    return variant;
  }
  const heroAnalysis = analyses.find(
    (a) => a.index === variant.composition.heroAssetIndex,
  );
  const heroScore = heroAnalysis?.importanceScore ?? 60;
  if (heroScore < 40) return { ...variant, engine: 'hybrid' };
  return variant;
}

/**
 * Aggressive retry: raise intensity, switch styleHint, tighten visual direction,
 * and address the specific issues from the report.
 */
function applyAggressiveRetry(variant: Variant, report: QualityReport): Variant {
  const issues = report.issues.join(' ').toLowerCase();
  const sub = report.subscores;

  const additions: string[] = [];

  if (sub) {
    if (sub.legibility < 65 || issues.includes('legibility') || issues.includes('contrast')) {
      additions.push(
        'strong directional light creating clear negative space for copy, deep vignette around text zone, pronounced contrast between text area and surroundings',
      );
    }
    if (sub.depth < 65 || issues.includes('flat') || issues.includes('background')) {
      additions.push(
        'three distinct depth layers: clear foreground element, defined midground subject, receding atmospheric background with haze',
      );
    }
    if (sub.hierarchy < 65 || issues.includes('hierarchy') || issues.includes('focal')) {
      additions.push(
        'single dominant focal point occupying one third of the frame, minimal competing elements',
      );
    }
    if (sub.slopFree < 65 || issues.includes('slop') || issues.includes('stock') || issues.includes('ai')) {
      additions.push(
        'editorial photography feel, specific cultural reference, avoid symmetric center framing',
      );
    }
    if (sub.brandCoherence < 65 || issues.includes('brand') || issues.includes('palette')) {
      additions.push(
        'strictly honor the declared color palette, drop any off-palette hues, saturation anchored to brand primary',
      );
    }
  }

  return {
    ...variant,
    intensity: 'aggressive',
    styleHint: variant.styleHint === 'aggressive' ? 'cinematic' : 'aggressive',
    visualDirection: [variant.visualDirection, ...additions].filter(Boolean).join('. '),
  };
}
