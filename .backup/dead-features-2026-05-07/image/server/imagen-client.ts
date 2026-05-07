import 'server-only';
import { serverEnv } from '@/lib/env';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type ImagenModel =
  | 'imagen-4.0-fast-generate-001'
  | 'imagen-4.0-generate-001'
  | 'imagen-4.0-ultra-generate-001';

export interface ImagenGenerateParams {
  prompt: string;
  model?: ImagenModel;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages?: 1 | 2 | 4;
}

export interface ImagenResult {
  images: Array<{
    base64: string;
    mimeType: string;
  }>;
}

function getApiKey(): string {
  const key = serverEnv.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not configured');
  return key;
}

export async function generateImageImagen(params: ImagenGenerateParams): Promise<ImagenResult> {
  const model = params.model ?? 'imagen-4.0-generate-001';
  const key = getApiKey();

  const url = `${GOOGLE_API_BASE}/models/${model}:predict?key=${key}`;

  const body = {
    instances: [{ prompt: params.prompt }],
    parameters: {
      sampleCount: params.numberOfImages ?? 1,
      aspectRatio: params.aspectRatio ?? '1:1',
      personGeneration: 'allow_adult',
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Imagen ${res.status}: ${text.slice(0, 300)}`);
  }

  type PredictResponse = {
    predictions?: Array<{
      bytesBase64Encoded: string;
      mimeType: string;
    }>;
  };

  const json = (await res.json()) as PredictResponse;
  const predictions = json.predictions ?? [];

  if (predictions.length === 0) {
    throw new Error('No images generated. The prompt may have been blocked by safety filters.');
  }

  return {
    images: predictions.map((p) => ({
      base64: p.bytesBase64Encoded,
      mimeType: p.mimeType || 'image/png',
    })),
  };
}

export function imagenCost(model: ImagenModel): number {
  switch (model) {
    case 'imagen-4.0-fast-generate-001': return 0.02;
    case 'imagen-4.0-generate-001': return 0.04;
    case 'imagen-4.0-ultra-generate-001': return 0.06;
    default: return 0.04;
  }
}
