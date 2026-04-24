import 'server-only';

// ═══════════════════════════════════════════════════════════════════
// fal.ai Client — Flux Fill for mockup generation
//
// Uses flux-pro-fill for inpainting with mask. Input:
//   - garment image
//   - mask (where the logo should go)
//   - prompt describing the application style
//
// Returns: generated image URL (ephemeral, caller must re-host)
// ═══════════════════════════════════════════════════════════════════

export interface FalFluxFillInput {
  imageUrl: string;
  maskUrl: string;
  prompt: string;
  /** 0-1 how strongly to modify (lower = more faithful to input) */
  strength?: number;
  timeoutMs?: number;
}

export interface FalFluxFillResult {
  imageUrl: string;
  seed?: number;
  estimatedCostUsd: number;
}

export class FalError extends Error {
  code: 'NO_API_KEY' | 'API_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'UNKNOWN';
  constructor(code: FalError['code'], message: string) {
    super(message);
    this.name = 'FalError';
    this.code = code;
  }
}

const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux-pro/v1/fill';

export async function falFluxFill(input: FalFluxFillInput): Promise<FalFluxFillResult> {
  const key = process.env.FAL_API_KEY;
  if (!key) throw new FalError('NO_API_KEY', 'FAL_API_KEY not set');

  const timeoutMs = input.timeoutMs ?? 60000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(FAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        image_url: input.imageUrl,
        mask_url: input.maskUrl,
        prompt: input.prompt,
        guidance_scale: 30,
        num_inference_steps: 30,
        safety_tolerance: '2',
        output_format: 'png',
        sync_mode: true, // inline image data; no polling needed
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new FalError('API_ERROR', `fal.ai ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const url = data?.images?.[0]?.url || data?.image?.url;

    if (!url || typeof url !== 'string') {
      throw new FalError('INVALID_RESPONSE', 'No image URL in fal.ai response');
    }

    return {
      imageUrl: url,
      seed: data?.seed,
      estimatedCostUsd: 0.05,
    };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof FalError) throw err;
    if ((err as any)?.name === 'AbortError') {
      throw new FalError('TIMEOUT', `fal.ai request timed out after ${timeoutMs}ms`);
    }
    throw new FalError('UNKNOWN', err instanceof Error ? err.message : String(err));
  }
}

export function isFalAvailable(): boolean {
  return (
    process.env.MOCKUP_ENGINE_ENABLED === 'true' &&
    !!process.env.FAL_API_KEY
  );
}
