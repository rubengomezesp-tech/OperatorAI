/**
 * Vision Critic Engine (AG-3)
 *
 * Uses Claude Sonnet 4.5 with Vision to evaluate generated images
 * against the brief. Returns a structured critique with score and
 * actionable suggestions.
 *
 * The critique drives the Iteration Loop (AG-4): if score < threshold,
 * we regenerate with adjusted prompt.
 */

import 'server-only';
import { serverEnv } from '@/lib/env';
import type { VariantBrief, BrainOutput } from '../types';

const VISION_MODEL = 'claude-sonnet-4-5-20250929';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface VisionCritique {
  /** Score 0-100 (combined quality assessment) */
  score: number;
  /** Pass/fail verdict for downstream loop */
  verdict: 'pass' | 'iterate' | 'fail';
  /** Concrete issues observed */
  issues: string[];
  /** Actionable adjustments for next render */
  suggestions: string[];
  /** Per-axis breakdown */
  scores: {
    brandAlignment: number;
    audienceFit: number;
    angleExecution: number;
    composition: number;
    productionValue: number;
  };
  /** One-line summary */
  summary: string;
  /** Latency for diagnostics */
  durationMs: number;
}

export interface VisionCriticInput {
  imageUrl: string;
  variantBrief: VariantBrief;
  brainOutput: BrainOutput;
  brandTone?: string | null;
  brandPalette?: string[];
}

// ────────────────────────────────────────────────────────────────
// Public entry point
// ────────────────────────────────────────────────────────────────

export async function critiqueImage(
  input: VisionCriticInput,
): Promise<VisionCritique> {
  const t0 = Date.now();

  // Build evaluation prompt
  const evalPrompt = buildEvalPrompt(input);

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

    // Fetch image as base64 (Anthropic SDK requires base64 source)
    const imgRes = await fetch(input.imageUrl, {
      signal: AbortSignal.timeout(20000),
    });
    if (!imgRes.ok) {
      throw new Error(`Image fetch failed: ${imgRes.status}`);
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const imgBase64 = imgBuffer.toString('base64');
    const contentType = imgRes.headers.get('content-type') ?? 'image/png';
    const mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' =
      contentType.includes('jpeg') || contentType.includes('jpg')
        ? 'image/jpeg'
        : contentType.includes('webp')
        ? 'image/webp'
        : contentType.includes('gif')
        ? 'image/gif'
        : 'image/png';

    const response = await claude.messages.create({
      model: VISION_MODEL,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imgBase64,
              },
            },
            {
              type: 'text',
              text: evalPrompt,
            },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n');

    const parsed = parseCritique(text);

    return {
      ...parsed,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    console.warn('[vision-critic] failed', {
      variantId: input.variantBrief.id,
      error: (err as Error).message,
    });
    // Fallback: optimistic pass (don't block rendering on critic failure)
    return buildOptimisticFallback(t0);
  }
}

// ────────────────────────────────────────────────────────────────
// Eval prompt builder
// ────────────────────────────────────────────────────────────────

function buildEvalPrompt(input: VisionCriticInput): string {
  const { variantBrief, brainOutput, brandTone, brandPalette } = input;

  const audienceHint = brainOutput.audience?.primaryPersona ?? 'the target audience';
  const hiddenDesire = brainOutput.diagnostic?.hiddenDesire ?? '';
  const aesthetic = brainOutput.visualDirection?.aesthetic ?? '';

  return [
    'You are a senior creative director reviewing an AI-generated marketing image.',
    'Evaluate this image against the brief and return ONLY a JSON object.',
    '',
    'BRIEF:',
    `  Strategic angle: ${variantBrief.angle}`,
    `  Headline concept: "${variantBrief.headline}"`,
    `  Platform: ${variantBrief.platform} (${variantBrief.aspectRatio})`,
    `  Audience: ${audienceHint}`,
    hiddenDesire ? `  Hidden desire of audience: "${hiddenDesire}"` : '',
    aesthetic ? `  Aesthetic direction: ${aesthetic}` : '',
    brandTone ? `  Brand tone: ${brandTone}` : '',
    brandPalette && brandPalette.length > 0
      ? `  Brand colors: ${brandPalette.slice(0, 3).join(', ')}`
      : '',
    '',
    'EVALUATE on 5 axes (each 0-100):',
    '  1. brandAlignment — Does it reflect the brand tone and palette?',
    '  2. audienceFit — Would the target audience stop scrolling for this?',
    '  3. angleExecution — Does it visually express the strategic angle?',
    '  4. composition — Is framing/lighting/safe-zones premium-grade?',
    '  5. productionValue — Does it look like commercial photography or generic AI?',
    '',
    'Return ONLY this JSON (no prose):',
    '{',
    '  "scores": {',
    '    "brandAlignment": 0-100,',
    '    "audienceFit": 0-100,',
    '    "angleExecution": 0-100,',
    '    "composition": 0-100,',
    '    "productionValue": 0-100',
    '  },',
    '  "issues": ["3-5 concrete issues observed"],',
    '  "suggestions": ["3-5 specific adjustments for next render"],',
    '  "summary": "1 sentence verdict"',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

// ────────────────────────────────────────────────────────────────
// Parser
// ────────────────────────────────────────────────────────────────

function parseCritique(
  raw: string,
): Omit<VisionCritique, 'durationMs'> {
  // Strip markdown code fences if present
  const jsonText = raw
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  // Find first { and last } to handle leading/trailing prose
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    return buildPessimisticParseFallback();
  }

  try {
    const obj = JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));

    const scores = {
      brandAlignment: clampScore(obj?.scores?.brandAlignment),
      audienceFit: clampScore(obj?.scores?.audienceFit),
      angleExecution: clampScore(obj?.scores?.angleExecution),
      composition: clampScore(obj?.scores?.composition),
      productionValue: clampScore(obj?.scores?.productionValue),
    };

    // Weighted overall score
    const score = Math.round(
      scores.brandAlignment * 0.2 +
        scores.audienceFit * 0.2 +
        scores.angleExecution * 0.25 +
        scores.composition * 0.15 +
        scores.productionValue * 0.2,
    );

    const verdict: VisionCritique['verdict'] =
      score >= 75 ? 'pass' : score >= 50 ? 'iterate' : 'fail';

    return {
      score,
      verdict,
      issues: Array.isArray(obj?.issues)
        ? (obj.issues as unknown[]).map(String).slice(0, 5)
        : [],
      suggestions: Array.isArray(obj?.suggestions)
        ? (obj.suggestions as unknown[]).map(String).slice(0, 5)
        : [],
      scores,
      summary: typeof obj?.summary === 'string' ? obj.summary : '',
    };
  } catch {
    return buildPessimisticParseFallback();
  }
}

function clampScore(n: unknown): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildPessimisticParseFallback(): Omit<VisionCritique, 'durationMs'> {
  return {
    score: 50,
    verdict: 'iterate',
    issues: ['Unable to parse critic response'],
    suggestions: [],
    scores: {
      brandAlignment: 50,
      audienceFit: 50,
      angleExecution: 50,
      composition: 50,
      productionValue: 50,
    },
    summary: 'Critic response unparseable',
  };
}

function buildOptimisticFallback(t0: number): VisionCritique {
  // If critic itself fails (network, etc), don't block the render
  return {
    score: 70,
    verdict: 'pass',
    issues: [],
    suggestions: [],
    scores: {
      brandAlignment: 70,
      audienceFit: 70,
      angleExecution: 70,
      composition: 70,
      productionValue: 70,
    },
    summary: 'Critic unavailable — passing optimistically',
    durationMs: Date.now() - t0,
  };
}
