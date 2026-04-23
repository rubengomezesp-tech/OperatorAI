import 'server-only';
import type {
  Variant,
  ImageAnalysis,
  QualityReport,
  CampaignDirection,
} from '../types';
import { renderFlux } from './renderers/flux-renderer';
import { evaluateVariant } from './quality-gate';

export interface RenderInput {
  variant: Variant;
  imageUrls: string[];
  analyses: ImageAnalysis[];
  direction?: CampaignDirection;
}

export interface RenderOutput {
  imageUrl: string;
  engine: 'flux';
}

export interface FullRenderResult extends RenderOutput {
  qualityReport?: QualityReport;
  retried: boolean;
}

const PASS_THRESHOLD = 75;

/**
 * RENDER ROUTER v6 — Flux only, quality-gate fail-open.
 *
 * Important behavior:
 * - Flux render is the source of truth.
 * - Quality gate must NEVER block image delivery if Anthropic is down
 *   or out of credit.
 * - Retry only happens if a valid quality report exists and it fails.
 */
export async function renderWithQuality(
  input: RenderInput,
): Promise<FullRenderResult> {
  let result: RenderOutput;

  try {
    result = await renderFlux(input);
  } catch (err) {
    console.error('[render-router] flux failed:', err);
    throw err;
  }

  if (
    typeof result.imageUrl !== 'string' ||
    (!result.imageUrl.startsWith('http') &&
      !result.imageUrl.startsWith('data:image/'))
  ) {
    throw new Error(
      'Flux renderer returned an invalid image URL: ' + String(result.imageUrl),
    );
  }

  let report: QualityReport | undefined;

  try {
    report = await evaluateVariant(input.variant, result.imageUrl);
  } catch (err) {
    console.error('[quality-gate] non-blocking error:', err);
    report = undefined;
  }

  // If quality gate failed or is unavailable, do NOT block the image.
  if (!report) {
    return { ...result, qualityReport: undefined, retried: false };
  }

  if (report.passed) {
    return { ...result, qualityReport: report, retried: false };
  }

  console.warn(
    '[render-router] quality score ' +
      report.score +
      ' below ' +
      PASS_THRESHOLD +
      ', retrying once for variant ' +
      input.variant.id,
  );

  const retryVariant = applyAggressiveRetry(input.variant, report);
  const retryInput: RenderInput = { ...input, variant: retryVariant };

  let retried: RenderOutput;
  try {
    retried = await renderFlux(retryInput);
  } catch (err) {
    console.error('[render-router] retry failed, returning original:', err);
    return { ...result, qualityReport: report, retried: true };
  }

  if (
    typeof retried.imageUrl !== 'string' ||
    (!retried.imageUrl.startsWith('http') &&
      !retried.imageUrl.startsWith('data:image/'))
  ) {
    console.error(
      '[render-router] retry returned invalid image URL, keeping original',
      retried.imageUrl,
    );
    return { ...result, qualityReport: report, retried: true };
  }

  let retryReport: QualityReport | undefined;

  try {
    retryReport = await evaluateVariant(retryVariant, retried.imageUrl);
  } catch (err) {
    console.error('[quality-gate retry] non-blocking error:', err);
    retryReport = undefined;
  }

  // If retry quality gate fails, still keep the retried image
  if (!retryReport) {
    return { ...retried, qualityReport: undefined, retried: true };
  }

  if (retryReport.score >= report.score) {
    return { ...retried, qualityReport: retryReport, retried: true };
  }

  return { ...result, qualityReport: report, retried: true };
}

function applyAggressiveRetry(
  variant: Variant,
  report: QualityReport,
): Variant {
  const issues = report.issues.join(' ').toLowerCase();
  const sub = report.subscores;
  const additions: string[] = [];

  if (sub) {
    if (
      sub.legibility < 65 ||
      issues.includes('legibility') ||
      issues.includes('contrast')
    ) {
      additions.push(
        'strong directional light carving clear negative space, deep vignette around text zone, pronounced contrast between subject and surroundings',
      );
    }

    if (
      sub.depth < 65 ||
      issues.includes('flat') ||
      issues.includes('background')
    ) {
      additions.push(
        'three distinct depth layers: clear foreground element, defined midground subject, receding atmospheric background with volumetric haze',
      );
    }

    if (
      sub.hierarchy < 65 ||
      issues.includes('hierarchy') ||
      issues.includes('focal')
    ) {
      additions.push(
        'single dominant focal subject occupying one third of the frame, minimal competing elements',
      );
    }

    if (
      sub.slopFree < 65 ||
      issues.includes('slop') ||
      issues.includes('stock') ||
      issues.includes('ai')
    ) {
      additions.push(
        'editorial photography feel, specific cultural reference, break symmetric center framing, off-center composition',
      );
    }

    if (
      sub.brandCoherence < 65 ||
      issues.includes('brand') ||
      issues.includes('palette')
    ) {
      additions.push(
        'strictly honor the declared color palette, drop off-palette hues, saturation anchored to brand primary',
      );
    }
  }

  return {
    ...variant,
    intensity: 'aggressive',
    styleHint: variant.styleHint === 'aggressive' ? 'cinematic' : 'aggressive',
    visualDirection: [variant.visualDirection, ...additions]
      .filter(Boolean)
      .join('. '),
  };
}
