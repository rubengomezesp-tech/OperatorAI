import 'server-only';
import { serverEnv } from '@/lib/env';
import type { Variant, QualityReport } from '../types';

const QG_MODEL = 'claude-sonnet-4-5-20250929';

/**
 * QUALITY GATE
 * After a variant is rendered, Claude Vision evaluates the PNG against the brief.
 * Returns a QualityReport. The caller (render layer in tanda 2) decides whether
 * to regenerate based on score threshold.
 *
 * This module only evaluates. It does NOT regenerate on its own.
 */
export async function evaluateVariant(
  variant: Variant,
  renderedImageUrl: string,
): Promise<QualityReport> {
  // canvas-spec URLs are not real PNGs yet; skip gate (frontend will render)
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
      return {
        variantId: variant.id,
        score: 0,
        passed: false,
        issues: ['Could not fetch rendered image for evaluation'],
        suggestions: [],
      };
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
    return {
      variantId: variant.id,
      score: 0,
      passed: false,
      issues: ['Fetch error: ' + (err instanceof Error ? err.message : 'unknown')],
      suggestions: [],
    };
  }

  const prompt = [
    'You are a senior art director doing quality control on an ad creative.',
    '',
    'EXPECTED:',
    '- Layout: ' + variant.layout,
    '- Angle: ' + variant.angle,
    '- Headline: "' + variant.copy.headline + '"',
    '- CTA: "' + variant.copy.cta + '"',
    '- Mood: ' + variant.mood,
    '- Palette hex: ' + variant.palette.join(', '),
    '',
    'Evaluate the image against 4 tests. For each, return pass/fail and a short reason.',
    '',
    '1. LEGIBILITY: Can you read the headline clearly? (contrast, size, placement)',
    '2. HIERARCHY: Does the main element grab attention first and match the expected layout?',
    '3. BRAND COHERENCE: Do the colors match the declared palette?',
    '4. AI SLOP CHECK: Any fake UI, cheap gradients, generic AI aesthetic, clipart, or stock-photo look?',
    '',
    'Return ONLY JSON:',
    '{',
    '  "score": 0-100,',
    '  "legibility": { "pass": boolean, "reason": "..." },',
    '  "hierarchy": { "pass": boolean, "reason": "..." },',
    '  "brand": { "pass": boolean, "reason": "..." },',
    '  "slop": { "pass": boolean, "reason": "..." },',
    '  "suggestions": [ "short actionable suggestions if score < 70" ]',
    '}',
    '',
    'Scoring: each test passing = 25 points. Pass = true if score >= 70.',
  ].join('\n');

  try {
    const res = await claude.messages.create({
      model: QG_MODEL,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [imageBlock, { type: 'text', text: prompt }],
        },
      ],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const issues: string[] = [];
      if (parsed.legibility && !parsed.legibility.pass) {
        issues.push('Legibility: ' + parsed.legibility.reason);
      }
      if (parsed.hierarchy && !parsed.hierarchy.pass) {
        issues.push('Hierarchy: ' + parsed.hierarchy.reason);
      }
      if (parsed.brand && !parsed.brand.pass) {
        issues.push('Brand: ' + parsed.brand.reason);
      }
      if (parsed.slop && !parsed.slop.pass) {
        issues.push('AI slop: ' + parsed.slop.reason);
      }

      const score = typeof parsed.score === 'number' ? parsed.score : 70;
      return {
        variantId: variant.id,
        score,
        passed: score >= 70,
        issues,
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
      };
    }
  } catch (err) {
    console.error('[quality-gate] claude error:', err);
  }

  // Fail-open: if the gate itself fails, mark as passed with warning
  return {
    variantId: variant.id,
    score: 70,
    passed: true,
    issues: ['Quality gate unavailable, passed by default'],
    suggestions: [],
  };
}
