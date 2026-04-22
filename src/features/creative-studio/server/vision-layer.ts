import 'server-only';
import { serverEnv } from '@/lib/env';
import type { ImageAnalysis } from '../types';
import { assignRolesByScore } from './hero-scoring';

const VISION_MODEL = 'claude-sonnet-4-5-20250929';

const VISION_PROMPT = `You are a senior product designer analyzing images for an ad campaign.

For EACH image return ONE object:
- index: number (1-based, matches "Image N:" label)
- role: "logo" | "hero" | "feature" | "support" | "lifestyle" (best initial guess, will be re-scored)
- isScreenshot: boolean
- screenType: "home" | "dashboard" | "chat" | "settings" | "studio" | "other" (only if screenshot)
- visibleText: string[] (ALL legible text. For blurry text write "[illegible]")
- uiElements: string[] (buttons, inputs, cards, tabs, menus, modals)
- dominantColors: string[] (3-5 hex codes, lowercase like "#0a0a0b")
- importanceScore: 0-100 (how central to communicating the product)
- communicates: "product" | "branding" | "ambience"
- description: string (10-20 words, specific to what is shown)

RULES:
- BE PRECISE. No guessing.
- Role "logo" ONLY for actual brand marks (small ratio, minimal UI, typically square or horizontal wordmark)
- visibleText must be OCR-accurate, not paraphrased
- uiElements must match what is actually visible in the image

Respond ONLY with JSON: { "analyses": [ ... ] }`;

/**
 * LAYER 1 — VISION
 * Multi-image analysis via Claude Vision with strict OCR.
 */
export async function analyzeImages(
  imageUrls: string[],
): Promise<ImageAnalysis[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const claude = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });

  const contentBlocks: any[] = [];

  for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
    try {
      const res = await fetch(imageUrls[i]);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const rawMime = res.headers.get('content-type') || 'image/png';
      const mediaType = (
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(rawMime)
          ? rawMime
          : 'image/png'
      ) as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

      contentBlocks.push({ type: 'text', text: 'Image ' + (i + 1) + ':' });
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: buf.toString('base64'),
        },
      });
    } catch (err) {
      console.error('[vision-layer] fetch failed for index ' + i, err);
    }
  }

  if (contentBlocks.length === 0) {
    return buildFallbackAnalyses(imageUrls);
  }

  contentBlocks.push({ type: 'text', text: VISION_PROMPT });

  let raw: ImageAnalysis[] = [];
  try {
    const res = await claude.messages.create({
      model: VISION_MODEL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: contentBlocks }],
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.analyses)) {
        raw = parsed.analyses;
      }
    }
  } catch (err) {
    console.error('[vision-layer] claude/parse error:', err);
  }

  if (raw.length === 0) {
    raw = buildFallbackAnalyses(imageUrls);
  }

  // Normalize
  raw = raw.map((a, i) => ({
    index: a.index || i + 1,
    role: a.role || 'support',
    isScreenshot: a.isScreenshot ?? true,
    screenType: a.screenType,
    visibleText: Array.isArray(a.visibleText) ? a.visibleText : [],
    uiElements: Array.isArray(a.uiElements) ? a.uiElements : [],
    dominantColors: Array.isArray(a.dominantColors)
      ? a.dominantColors
      : ['#0a0a0b'],
    importanceScore:
      typeof a.importanceScore === 'number' ? a.importanceScore : 50,
    communicates: a.communicates || 'product',
    description: a.description || '',
  }));

  // Re-assign roles via deterministic scoring
  return assignRolesByScore(raw);
}

function buildFallbackAnalyses(imageUrls: string[]): ImageAnalysis[] {
  return imageUrls.map((_, i) => ({
    index: i + 1,
    role: i === 0 ? 'hero' : 'support',
    isScreenshot: true,
    visibleText: [],
    uiElements: [],
    dominantColors: ['#0a0a0b', '#c9a863'],
    importanceScore: 50,
    communicates: 'product',
    description: 'Image ' + (i + 1),
  }));
}
