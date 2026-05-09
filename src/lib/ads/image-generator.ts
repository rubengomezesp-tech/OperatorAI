/**
 * 🎨 IMAGE GENERATOR — Función interna pura
 * 
 * Extraída de /api/images/generate y gpt-image-client.
 * SIN dependencias HTTP, SIN Supabase, SIN auth.
 * 
 * Usada por:
 *   - /api/images/generate (endpoint HTTP público)
 *   - brain-bridge (orquestador interno)
 *   - job-processor (worker asíncrono)
 * 
 * @author OperatorAI + DeepSeek Co-CEO
 */

import 'server-only';

// ═══ TIPOS ═══
export type ImageAspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';
export type ImageModel = 'gpt-image-2' | 'gpt-image-1';

export interface GenerateImageInput {
  prompt: string;
  aspectRatio: ImageAspectRatio;
  quality?: ImageQuality;
  model?: ImageModel;
  referenceUrls?: string[];
  referenceImages?: Array<{ data: string; mimeType: string }>;
  mask?: string;
  timeoutMs?: number;
}

export interface GenerateImageResult {
  buffer: Buffer;
  format: string;
  estimatedCostUsd: number;
  qualityUsed: ImageQuality;
  modelUsed: ImageModel;
}

export class ImageGeneratorError extends Error {
  code: 'NO_API_KEY' | 'API_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'NO_CONTENT' | 'UNKNOWN';
  constructor(code: ImageGeneratorError['code'], message: string) {
    super(message);
    this.name = 'ImageGeneratorError';
    this.code = code;
  }
}

// ═══ HELPERS ═══
function aspectToSize(aspect: ImageAspectRatio): '1024x1024' | '1024x1536' | '1536x1024' {
  switch (aspect) {
    case '1:1': return '1024x1024';
    case '16:9': case '3:2': return '1536x1024';
    case '4:5': case '9:16': return '1024x1536';
    default: return '1024x1024';
  }
}

function estimateCost(quality: ImageQuality, size: string): number {
  const sizeMultiplier = size === '1024x1024' ? 1 : 1.3;
  const base = quality === 'low' ? 0.011 : quality === 'high' ? 0.167 : quality === 'auto' ? 0.042 : 0.042;
  return base * sizeMultiplier;
}

function resolveQuality(override?: ImageQuality): ImageQuality {
  if (override) return override;
  const envQuality = process.env.GPT_IMAGE_QUALITY as ImageQuality | undefined;
  if (envQuality && ['low', 'medium', 'high', 'auto'].includes(envQuality)) return envQuality;
  return 'high';
}

function isPng(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;
  return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;
}

// ═══ FUNCIÓN PRINCIPAL ═══
export async function generateImage(input: GenerateImageInput): Promise<GenerateImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ImageGeneratorError('NO_API_KEY', 'OPENAI_API_KEY not set');

  const quality = resolveQuality(input.quality);
  const size = aspectToSize(input.aspectRatio);
  const model = input.model ?? 'gpt-image-2';
  // SPRINT 5.1 FIX: timeout aligned with Vercel maxDuration (300s).
  // gpt-image-2 with complex prompts (DNA + archetype + brand context)
  // can take 200-280s. Configurable via IMAGE_GEN_TIMEOUT_MS env var.
  const timeoutMs =
    input.timeoutMs ??
    (process.env.IMAGE_GEN_TIMEOUT_MS ? Number(process.env.IMAGE_GEN_TIMEOUT_MS) : null) ??
    300000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const hasReferences = (input.referenceUrls && input.referenceUrls.length > 0)
      || (input.referenceImages && input.referenceImages.length > 0);

    let res: Response;

    if (hasReferences) {
      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', input.prompt);
      formData.append('n', '1');
      formData.append('size', size);
      formData.append('quality', quality);

      // Agregar referencias URL
      if (input.referenceUrls) {
        for (let i = 0; i < input.referenceUrls.length && i < 16; i++) {
          const refUrl = input.referenceUrls[i];
          let refBuffer: Buffer;
          let refMime = 'image/png';

          if (refUrl.startsWith('data:')) {
            const match = refUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (!match) throw new ImageGeneratorError('INVALID_RESPONSE', `Invalid data URI for ref ${i}`);
            refMime = match[1];
            refBuffer = Buffer.from(match[2], 'base64');
          } else {
            const refRes = await fetch(refUrl, { signal: controller.signal });
            if (!refRes.ok) throw new ImageGeneratorError('API_ERROR', `Ref ${i} fetch failed: ${refRes.status}`);
            refBuffer = Buffer.from(await refRes.arrayBuffer());
            refMime = refRes.headers.get('content-type') || 'image/png';
          }

          const blob = new Blob([new Uint8Array(refBuffer)], { type: refMime });
          const ext = refMime.split('/')[1] || 'png';
          formData.append('image[]', blob, `ref-${i}.${ext}`);
        }
      }

      // Agregar referencias base64
      if (input.referenceImages) {
        for (let i = 0; i < input.referenceImages.length && i < 16; i++) {
          const ref = input.referenceImages[i];
          const refBuffer = Buffer.from(ref.data, 'base64');
          const blob = new Blob([new Uint8Array(refBuffer)], { type: ref.mimeType });
          formData.append('image[]', blob, `ref-upload-${i}.png`);
        }
      }

      if (input.mask) {
        const maskBuffer = Buffer.from(input.mask, 'base64');
        formData.append('mask', new Blob([new Uint8Array(maskBuffer)], { type: 'image/png' }), 'mask.png');
      }

      res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
        signal: controller.signal,
      });
    } else {
      res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt: input.prompt,
          n: 1,
          size,
          quality,
          output_format: 'png',
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      throw new ImageGeneratorError('API_ERROR', `OpenAI ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    if (!Array.isArray(data?.data) || data.data.length === 0) {
      throw new ImageGeneratorError('NO_CONTENT', 'OpenAI returned no data');
    }

    const b64 = data.data[0]?.b64_json;
    if (!b64 || typeof b64 !== 'string') {
      throw new ImageGeneratorError('INVALID_RESPONSE', 'Missing b64_json');
    }

    const buffer = Buffer.from(b64, 'base64');
    if (buffer.length < 1024) throw new ImageGeneratorError('INVALID_RESPONSE', `Too small: ${buffer.length} bytes`);
    if (!isPng(buffer)) throw new ImageGeneratorError('INVALID_RESPONSE', 'Not a valid PNG');

    return {
      buffer,
      format: 'png',
      estimatedCostUsd: estimateCost(quality, size),
      qualityUsed: quality,
      modelUsed: model,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ImageGeneratorError) throw err;
    if ((err as any)?.name === 'AbortError') throw new ImageGeneratorError('TIMEOUT', `Timed out after ${timeoutMs}ms`);
    throw new ImageGeneratorError('UNKNOWN', err instanceof Error ? err.message : String(err));
  }
}
