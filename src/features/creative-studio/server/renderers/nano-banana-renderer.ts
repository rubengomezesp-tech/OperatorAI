/**
 * Nano Banana Pro Renderer (EN-2)
 *
 * Uses Google's gemini-2.5-flash-image (Nano Banana) — accepts
 * multiple reference images and generates new images that are
 * faithful to the references.
 *
 * Why this matters: GPT Image is text-to-image only. It cannot
 * "see" a product photo. Nano Banana accepts images as input,
 * so we can pass the user's product photo + logo and the model
 * will preserve them while applying the campaign style.
 */

import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { serverEnv } from '@/lib/env';
import type { Variant } from '../../types';
import type { RenderInput, RenderOutput } from '../render-router';

const NANO_BANANA_MODEL = 'gemini-2.5-flash-image';

export class NanoBananaError extends Error {
  code:
    | 'NO_API_KEY'
    | 'API_ERROR'
    | 'NO_IMAGE'
    | 'TIMEOUT'
    | 'UPLOAD_FAILED'
    | 'UNKNOWN';

  constructor(code: NanoBananaError['code'], message: string) {
    super(message);
    this.name = 'NanoBananaError';
    this.code = code;
  }
}

export interface NanoBananaRenderInput extends RenderInput {
  /** Reference images to ground the generation */
  referenceImages?: string[];
}

// ────────────────────────────────────────────────────────────────
// MAIN RENDERER
// ────────────────────────────────────────────────────────────────

export async function renderNanoBanana(
  input: NanoBananaRenderInput,
): Promise<RenderOutput> {
  const apiKey = serverEnv.GEMINI_API_KEY;
  if (!apiKey) {
    throw new NanoBananaError('NO_API_KEY', 'GEMINI_API_KEY is not set');
  }

  const { variant } = input;

  // 1. Build prompt — prefer Brain's premium prompt; fallback to intent
  let prompt: string;
  if (variant.renderPrompt && variant.renderPrompt.length > 50) {
    prompt = variant.renderPrompt;
  } else {
    prompt = variant.intent ?? 'Premium commercial photography';
  }

  // Aspect ratio at TOP (primary instruction) AND bottom (reinforcement).
  // Models obey instructions placed at extremities better than middle.
  const aspectHint = aspectToHint(variant.aspectRatio);
  prompt = `${aspectHint}\n\n${prompt}\n\n${aspectHint}`;

  // 2. Download reference images and convert to base64 inline parts
  const refImages = input.referenceImages ?? [];
  const inlineImages: Array<{
    inlineData: { mimeType: string; data: string };
  }> = [];

  for (const url of refImages.slice(0, 6)) {
    try {
      const imgRes = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!imgRes.ok) continue;
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const ct = imgRes.headers.get('content-type') ?? 'image/png';
      const mimeType = ct.includes('jpeg')
        ? 'image/jpeg'
        : ct.includes('webp')
        ? 'image/webp'
        : 'image/png';
      inlineImages.push({
        inlineData: {
          mimeType,
          data: buf.toString('base64'),
        },
      });
    } catch (err) {
      console.warn('[nano-banana] reference fetch failed', {
        url: url.slice(0, 80),
        error: (err as Error).message,
      });
    }
  }

  console.log('[renderNanoBanana] calling Gemini', {
    variantId: variant.id,
    promptLength: prompt.length,
    referenceImages: inlineImages.length,
  });

  // 3. Call Nano Banana
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: NANO_BANANA_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, ...inlineImages],
        },
      ],
    });
  } catch (err) {
    throw new NanoBananaError(
      'API_ERROR',
      `Gemini API call failed: ${(err as Error).message}`,
    );
  }

  // 4. Extract image bytes from response
  const imageBuffer = extractImageFromResponse(response);
  if (!imageBuffer) {
    throw new NanoBananaError(
      'NO_IMAGE',
      'Gemini response did not contain an image',
    );
  }

  // 5. Upload to Supabase Storage
  const svc = createSupabaseServiceClient();
  const safeId = String(variant.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `nano-banana/${Date.now()}-${safeId}.png`;

  const { error: upErr } = await svc.storage
    .from('image-outputs')
    .upload(path, imageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: true,
    });

  if (upErr) {
    throw new NanoBananaError(
      'UPLOAD_FAILED',
      `Supabase upload failed: ${upErr.message}`,
    );
  }

  const { data: pub } = svc.storage.from('image-outputs').getPublicUrl(path);
  const imageUrl = pub.publicUrl;

  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new NanoBananaError('UPLOAD_FAILED', 'Invalid public URL');
  }

  console.log('[renderNanoBanana] success', {
    variantId: variant.id,
    sizeBytes: imageBuffer.length,
  });

  return { imageUrl, engine: 'nano-banana' as Variant['engine'] };
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

interface GeminiResponseShape {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string; mimeType?: string };
        inline_data?: { data?: string; mime_type?: string };
        text?: string;
      }>;
    };
  }>;
}

function extractImageFromResponse(response: unknown): Buffer | null {
  const r = response as GeminiResponseShape;
  const candidates = r?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  for (const cand of candidates) {
    const parts = cand?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      // SDK may serialize as inlineData (camel) or inline_data (snake)
      const inline = p.inlineData ?? p.inline_data;
      const data = inline?.data;
      if (typeof data === 'string' && data.length > 100) {
        try {
          return Buffer.from(data, 'base64');
        } catch {
          // fall through
        }
      }
    }
  }
  return null;
}

function aspectToHint(aspect: Variant['aspectRatio']): string {
  switch (aspect) {
    case '9:16':
      return 'CRITICAL OUTPUT FORMAT — VERTICAL 9:16 (1024x1820 pixels). This is for Instagram Stories / Reels / TikTok. The image MUST be tall and narrow. DO NOT generate landscape, square, or 16:9. Vertical orientation is mandatory.';
    case '4:5':
      return 'CRITICAL OUTPUT FORMAT — VERTICAL 4:5 PORTRAIT (1024x1280 pixels). This is for Instagram feed portrait posts. Tall not wide. DO NOT generate square or landscape.';
    case '1:1':
    default:
      return 'CRITICAL OUTPUT FORMAT — PERFECT SQUARE 1:1 (1024x1024 pixels). Equal width and height. DO NOT generate portrait or landscape.';
  }
}
