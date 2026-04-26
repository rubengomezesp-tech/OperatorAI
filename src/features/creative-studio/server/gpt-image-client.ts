import 'server-only';
import type { AspectRatio } from '../types';

// ═══════════════════════════════════════════════════════════════════
// GPT-Image Client
// Wraps OpenAI's gpt-image-1 API with timeout, validation, and
// cost estimation. Kept independent so it can be swapped/mocked.
// ═══════════════════════════════════════════════════════════════════

export type GptImageQuality = 'low' | 'medium' | 'high' | 'auto';

export interface GptImageInput {
  prompt: string;
  aspectRatio: AspectRatio;
  /** Override env default */
  quality?: GptImageQuality;
  /** Default 45s */
  timeoutMs?: number;
}

export interface GptImageResult {
  /** PNG buffer — caller is responsible for uploading/persisting */
  buffer: Buffer;
  /** Size requested (e.g. 1024x1024) */
  size: string;
  /** Rough cost in USD */
  estimatedCostUsd: number;
  /** Quality actually used */
  qualityUsed: GptImageQuality;
}

export class GptImageError extends Error {
  code:
    | 'NO_API_KEY'
    | 'API_ERROR'
    | 'TIMEOUT'
    | 'INVALID_RESPONSE'
    | 'NO_CONTENT'
    | 'UNKNOWN';

  constructor(code: GptImageError['code'], message: string) {
    super(message);
    this.name = 'GptImageError';
    this.code = code;
  }
}

// ─── Size mapping ──────────────────────────────────────────
// OpenAI gpt-image-1 supports only: 1024x1024, 1024x1536, 1536x1024, auto
function aspectToSize(
  aspect: AspectRatio,
): '1024x1024' | '1024x1536' | '1536x1024' {
  switch (aspect) {
    case '1:1':
      return '1024x1024';
    case '4:5':
    case '9:16':
      return '1024x1536';
    default:
      return '1024x1024';
  }
}

// ─── Cost estimation ──────────────────────────────────────
// Source: OpenAI pricing as of Apr 2025 for gpt-image-1
// low ~$0.011, medium ~$0.042, high ~$0.167 per 1024x1024 image
function estimateCost(quality: GptImageQuality, size: string): number {
  const sizeMultiplier = size === '1024x1024' ? 1 : 1.3;
  const base =
    quality === 'low'
      ? 0.011
      : quality === 'high'
      ? 0.167
      : quality === 'auto'
      ? 0.042
      : 0.042;
  return base * sizeMultiplier;
}

// ─── Resolve quality from input + env ─────────────────────
function resolveQuality(override?: GptImageQuality): GptImageQuality {
  if (override) return override;
  const envQuality = process.env.GPT_IMAGE_QUALITY as GptImageQuality | undefined;
  if (
    envQuality === 'low' ||
    envQuality === 'medium' ||
    envQuality === 'high' ||
    envQuality === 'auto'
  ) {
    return envQuality;
  }
  // Default to 'high' for premium quality (TIER S output)
  return 'high';
}

// ═══════════════════════════════════════════════════════════════════
// MAIN API
// ═══════════════════════════════════════════════════════════════════

export async function generateWithGptImage(
  input: GptImageInput,
): Promise<GptImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new GptImageError(
      'NO_API_KEY',
      'OPENAI_API_KEY is not set in environment',
    );
  }

  const quality = resolveQuality(input.quality);
  const size = aspectToSize(input.aspectRatio);
  const timeoutMs = input.timeoutMs ?? 45000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: input.prompt,
        n: 1,
        size,
        quality,
        output_format: 'png',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      throw new GptImageError(
        'API_ERROR',
        `OpenAI returned ${res.status}: ${errText.slice(0, 300)}`,
      );
    }

    const data = await res.json();

    if (!Array.isArray(data?.data) || data.data.length === 0) {
      throw new GptImageError(
        'NO_CONTENT',
        'OpenAI response has no data array',
      );
    }

    const b64 = data.data[0]?.b64_json;
    if (!b64 || typeof b64 !== 'string') {
      throw new GptImageError(
        'INVALID_RESPONSE',
        'Missing or invalid b64_json in response',
      );
    }

    const buffer = Buffer.from(b64, 'base64');

    // Validate it's a real PNG (magic bytes + minimum size)
    if (buffer.length < 1024) {
      throw new GptImageError(
        'INVALID_RESPONSE',
        `Response too small (${buffer.length} bytes)`,
      );
    }
    if (!isPng(buffer)) {
      throw new GptImageError(
        'INVALID_RESPONSE',
        'Response is not a valid PNG',
      );
    }

    return {
      buffer,
      size,
      estimatedCostUsd: estimateCost(quality, size),
      qualityUsed: quality,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof GptImageError) throw err;

    if ((err as any)?.name === 'AbortError') {
      throw new GptImageError(
        'TIMEOUT',
        `GPT-Image request timed out after ${timeoutMs}ms`,
      );
    }

    throw new GptImageError(
      'UNKNOWN',
      err instanceof Error ? err.message : String(err),
    );
  }
}

// ─── PNG magic bytes validation ────────────────────────────
function isPng(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  return (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}
