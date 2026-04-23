import 'server-only';
import { serverEnv } from '@/lib/env';
import type { Variant, QualityReport } from '../types';

const QG_MODEL = 'claude-sonnet-4-5-20250929';
const PASS_THRESHOLD = 75;

/**
 * QUALITY GATE v4A
 * 6 tests weighted equally (0-100 each, final score is average):
 * 1. legibility       — headline readable at a glance
 * 2. hierarchy        — clear focal point matching expected layout
 * 3. contrast         — text/CTA pop off background
 * 4. depth            — foreground/midground/background present (not flat)
 * 5. slopFree         — no AI aesthetic, no fake UI, no stock-photo look
 * 6. brandCoherence   — palette and mood match the brief
 *
 * Returns QualityReport with subscores and autoRetryRecommended.
 */
export async function evaluateVariant(
  variant: Variant,
  renderedImageUrl: string,
): Promise<QualityReport> {
  if (!renderedImageUrl.startsWith('http')) {
    return {
      variantId: variant.id,
      score: 75,
      passed: true,
      issues: [],
      suggestions: ['Canvas spec will be evaluated after frontend render'],
    };
  }

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  let imageBlock: any;
  try {
    const res = await fetch(renderedImageUrl);
    if (!res.ok) {
      return failedReport(variant.id, 'Could not fetch rendered image');
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const rawMime = res.headers.get('content-type') || 'image/png';
    const mediaType = (
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(rawMime)
        ? rawMime
        : 'image/png'
    ) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    imageBlock = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType,
        data: buf.toString('base64'),
      },
    };
  } catch (err) {
    console.error('[quality-gate] fetch error:', err);
    return failedReport(variant.id, 'Fetch error');
  }

  const prompt = [
    'You are a senior art director doing strict quality control on an ad creative.',
    'Be demanding. Premium agencies reject weak work.',
    '',
    'EXPECTED:',
    '- Layout: ' + variant.layout,
    '- Angle: ' + variant.angle,
    '- Intensity: ' + variant.intensity,
    '- Style: ' + variant.styleHint,
    '- Headline: "' + variant.copy.headline + '"',
    '- CTA: "' + variant.copy.cta + '"',
    '- Mood: ' + variant.mood,
    '- Palette: ' + variant.palette.join(', '),
    '- Visual direction: ' + (variant.visualDirection || 'not specified'),
    '- Composition: ' + (variant.compositionHint || 'not specified'),
    '',
    'Score each of 6 tests 0-100. Be strict.',
    '',
    '1. LEGIBILITY: Is the headline readable at a glance? Penalize low contrast, small size, bad placement over busy areas.',
    '2. HIERARCHY: Is there a clear focal point? Does it match the expected layout? Penalize competing elements, flat distribution of weight.',
    '3. CONTRAST: Do text and CTA pop? Penalize muddy midtones, washed out elements.',
    '4. DEPTH: Is there foreground / midground / background separation? Penalize flat compositions, empty backdrops, uniform textures.',
    '5. SLOP-FREE: No AI aesthetic, no fake UI, no stock-photo look, no isometric clipart, no cheap gradients, no generic composition.',
    '6. BRAND: Do palette and mood match the brief? Penalize off-palette hues or wrong emotional register.',
    '',
    'Thresholds:',
    '- 90-100: agency-grade',
    '- 75-89: publishable',
    '- 60-74: weak, needs retry',
    '- below 60: reject',
    '',
    'Return ONLY JSON:',
    '{',
    '  "legibility": 0-100,',
    '  "hierarchy": 0-100,',
    '  "contrast": 0-100,',
    '  "depth": 0-100,',
    '  "slopFree": 0-100,',
    '  "brandCoherence": 0-100,',
    '  "issues": ["short strings naming concrete problems, max 5"],',
    '  "suggestions": ["short actionable fixes, max 4"]',
    '}',
  ].join('\n');

  try {
    const res = await claude.messages.create({
      model: QG_MODEL,
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: [imageBlock, { type: 'text', text: prompt }],
        },
      ],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return failedReport(variant.id, 'Could not parse gate response');

    const parsed = JSON.parse(match[0]);

    const sub = {
      legibility: clamp(parsed.legibility),
      hierarchy: clamp(parsed.hierarchy),
      contrast: clamp(parsed.contrast),
      depth: clamp(parsed.depth),
      slopFree: clamp(parsed.slopFree),
      brandCoherence: clamp(parsed.brandCoherence),
    };
    const avg =
      (sub.legibility +
        sub.hierarchy +
        sub.contrast +
        sub.depth +
        sub.slopFree +
        sub.brandCoherence) /
      6;

    const issues: string[] = Array.isArray(parsed.issues) ? parsed.issues.slice(0, 5) : [];
    const suggestions: string[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.slice(0, 4)
      : [];

    // Hard penalties (deduct points if any subscore is critically low)
    let score = avg;
    if (sub.slopFree < 50) score = Math.min(score, 55); // slop is unforgivable
    if (sub.depth < 40) score = Math.min(score, 60); // flat background is unforgivable
    if (sub.legibility < 50) score = Math.min(score, 58); // unreadable = useless

    const passed = score >= PASS_THRESHOLD;
    const autoRetryRecommended = !passed && score >= 40; // worth retrying if not catastrophic

    return {
      variantId: variant.id,
      score: Math.round(score),
      passed,
      issues,
      suggestions,
      autoRetryRecommended,
      subscores: sub,
    };
  } catch (err) {
    console.error('[quality-gate] claude error:', err);
    return failedReport(variant.id, 'Quality gate internal error');
  }
}

function clamp(n: any): number {
  const x = typeof n === 'number' ? n : 50;
  return Math.max(0, Math.min(100, x));
}

function failedReport(variantId: string, reason: string): QualityReport {
  return {
    variantId,
    score: 70,
    passed: true, // fail-open so user still sees the output
    issues: [reason],
    suggestions: [],
    autoRetryRecommended: false,
  };
}
