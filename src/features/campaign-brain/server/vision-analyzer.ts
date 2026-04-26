/**
 * Vision Analyzer (EN-1)
 *
 * Uses Gemini 2.5 Pro Vision to extract structured information from
 * user-uploaded images. Two flavors:
 *   - analyzeProductImage(): for product photos uploaded in Stage Assets
 *   - analyzeLogoImage(): for brand logos in Brand OS
 *
 * Output is structured (typed) so the prompt builder + image renderer
 * can use it as concrete generation guidance — not vague text.
 */

import 'server-only';
import { serverEnv } from '@/lib/env';

const VISION_MODEL = 'gemini-2.5-pro';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface ProductAnalysis {
  productType: string;
  shape: string;
  materials: string[];
  colors: string[];
  branding: string;
  lighting: string;
  angle: string;
  distinctiveFeatures: string[];
  /** Single line ready to inject into image prompt */
  generationDescription: string;
  /** True if Gemini ran successfully */
  fromLiveAnalysis: boolean;
  durationMs: number;
}

export interface LogoAnalysis {
  type: 'wordmark' | 'iconic' | 'combination' | 'unknown';
  primaryColor: string;
  secondaryColors: string[];
  shape: string;
  typography: string;
  distinctiveFeatures: string[];
  /** Single line ready to inject into image prompt */
  embedDescription: string;
  fromLiveAnalysis: boolean;
  durationMs: number;
}

// ────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────

export async function analyzeProductImage(
  imageUrl: string,
): Promise<ProductAnalysis> {
  const t0 = Date.now();
  const result = await callGeminiVision(imageUrl, buildProductPrompt());
  const durationMs = Date.now() - t0;

  if (!result) {
    return {
      productType: 'unknown',
      shape: '',
      materials: [],
      colors: [],
      branding: '',
      lighting: '',
      angle: '',
      distinctiveFeatures: [],
      generationDescription: '',
      fromLiveAnalysis: false,
      durationMs,
    };
  }

  return {
    productType: stringField(result.productType, 'unknown'),
    shape: stringField(result.shape),
    materials: arrayField(result.materials),
    colors: arrayField(result.colors),
    branding: stringField(result.branding),
    lighting: stringField(result.lighting),
    angle: stringField(result.angle),
    distinctiveFeatures: arrayField(result.distinctiveFeatures),
    generationDescription: stringField(result.generationDescription),
    fromLiveAnalysis: true,
    durationMs,
  };
}

export async function analyzeLogoImage(
  imageUrl: string,
): Promise<LogoAnalysis> {
  const t0 = Date.now();
  const result = await callGeminiVision(imageUrl, buildLogoPrompt());
  const durationMs = Date.now() - t0;

  if (!result) {
    return {
      type: 'unknown',
      primaryColor: '',
      secondaryColors: [],
      shape: '',
      typography: '',
      distinctiveFeatures: [],
      embedDescription: '',
      fromLiveAnalysis: false,
      durationMs,
    };
  }

  const t = stringField(result.type).toLowerCase();
  const validType: LogoAnalysis['type'] =
    t === 'wordmark' || t === 'iconic' || t === 'combination' ? t : 'unknown';

  return {
    type: validType,
    primaryColor: stringField(result.primaryColor),
    secondaryColors: arrayField(result.secondaryColors),
    shape: stringField(result.shape),
    typography: stringField(result.typography),
    distinctiveFeatures: arrayField(result.distinctiveFeatures),
    embedDescription: stringField(result.embedDescription),
    fromLiveAnalysis: true,
    durationMs,
  };
}

// ────────────────────────────────────────────────────────────────
// Gemini Vision call (downloads image + sends inline)
// ────────────────────────────────────────────────────────────────

async function callGeminiVision(
  imageUrl: string,
  textPrompt: string,
): Promise<Record<string, unknown> | null> {
  const apiKey = serverEnv.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[vision-analyzer] GEMINI_API_KEY missing');
    return null;
  }

  try {
    // 1. Download image as base64
    const imgRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(20000),
    });
    if (!imgRes.ok) {
      console.warn('[vision-analyzer] image fetch failed', {
        status: imgRes.status,
      });
      return null;
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const base64Data = imgBuffer.toString('base64');
    const contentType = imgRes.headers.get('content-type') ?? 'image/png';
    const mimeType = contentType.includes('jpeg')
      ? 'image/jpeg'
      : contentType.includes('webp')
      ? 'image/webp'
      : 'image/png';

    // 2. Call Gemini using @google/genai SDK
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: textPrompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    });

    // Extract text response
    const text =
      typeof response.text === 'string' ? response.text : response.text ?? '';
    if (!text) return null;

    // Parse JSON from response
    const jsonText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      console.warn('[vision-analyzer] no JSON in response');
      return null;
    }

    return JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
  } catch (err) {
    console.warn('[vision-analyzer] failed', {
      error: (err as Error).message,
    });
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
// Prompts
// ────────────────────────────────────────────────────────────────

function buildProductPrompt(): string {
  return [
    'You are analyzing a product image for a marketing campaign.',
    'Look carefully at the product and return ONLY a JSON object with:',
    '',
    '{',
    '  "productType": "what is this? (bottle, phone, garment, dish, etc)",',
    '  "shape": "concise shape description (e.g., slim cylindrical 3:1 ratio)",',
    '  "materials": ["material1", "material2"],',
    '  "colors": ["#HEX dominant", "#HEX accent"],',
    '  "branding": "branding visible: logo, label, wordmark — describe placement",',
    '  "lighting": "current lighting setup observed",',
    '  "angle": "current camera angle (3/4 frontal, top-down, side, etc)",',
    '  "distinctiveFeatures": ["3-5 visually distinctive features"],',
    '  "generationDescription": "ONE sentence ready to inject into an image generation prompt to recreate this exact product faithfully"',
    '}',
    '',
    'Be specific and concrete. The "generationDescription" field is critical — it must capture the product so an AI image model can reproduce it.',
  ].join('\n');
}

function buildLogoPrompt(): string {
  return [
    'You are analyzing a brand logo for embedding in marketing images.',
    'Return ONLY a JSON object:',
    '',
    '{',
    '  "type": "wordmark | iconic | combination",',
    '  "primaryColor": "#HEX of dominant color",',
    '  "secondaryColors": ["#HEX of accent colors"],',
    '  "shape": "circular, square, horizontal, etc",',
    '  "typography": "if wordmark: describe font style (geometric sans, serif, script, etc)",',
    '  "distinctiveFeatures": ["3-4 distinctive design features"],',
    '  "embedDescription": "ONE sentence describing the logo so an AI image model can embed it faithfully in generated content"',
    '}',
    '',
    'Be precise about colors and typography. The "embedDescription" must help an AI reproduce the logo style.',
  ].join('\n');
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function stringField(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim();
  return fallback;
}

function arrayField(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === 'string')
    .map((v) => (v as string).trim())
    .filter((v) => v.length > 0)
    .slice(0, 8);
}
