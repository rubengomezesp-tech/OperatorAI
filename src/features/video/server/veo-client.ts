import 'server-only';
import { serverEnv } from '@/lib/env';

const GOOGLE_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export type VeoModel =
  | 'veo-3.1-lite-generate-preview'
  | 'veo-3.1-fast-generate-preview'
  | 'veo-3.1-generate-preview';

export interface VeoGenerateParams {
  prompt: string;
  model?: VeoModel;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  durationSeconds?: 4 | 6 | 8;
  imageBytes?: string;
  imageMimeType?: string;
}

export interface VeoOperationResult {
  operationName: string;
}

export interface VeoStatus {
  done: boolean;
  videoUri?: string;
  error?: string;
}

function getApiKey(): string {
  const key = serverEnv.GOOGLE_API_KEY;
  if (!key) throw new Error('GOOGLE_API_KEY not configured');
  return key;
}

/**
 * Initiate video generation. Returns an operation name to poll.
 */
export async function generateVideo(params: VeoGenerateParams): Promise<VeoOperationResult> {
  const model = params.model ?? 'veo-3.1-fast-generate-preview';
  const key = getApiKey();

  const body: Record<string, unknown> = {
    instances: [
      {
        prompt: params.prompt,
        ...(params.imageBytes
          ? {
              image: {
                bytesBase64Encoded: params.imageBytes,
                mimeType: params.imageMimeType ?? 'image/jpeg',
              },
            }
          : {}),
      },
    ],
    parameters: {
      aspectRatio: params.aspectRatio ?? '16:9',
      resolution: params.resolution ?? '1080p',
      durationSeconds: params.durationSeconds ?? 8,
      personGeneration: 'allow_adult',
    },
  };

  const url = GOOGLE_API_BASE + '/models/' + model + ':predictLongRunning?key=' + key;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('Veo generate ' + res.status + ': ' + text.slice(0, 300));
  }

  const json = (await res.json()) as { name: string };
  if (!json.name) throw new Error('Veo: no operation name returned');
  return { operationName: json.name };
}

/**
 * Poll an operation. Returns done=true and videoUri when ready.
 */
export async function getOperationStatus(operationName: string): Promise<VeoStatus> {
  const key = getApiKey();
  const url = GOOGLE_API_BASE + '/' + operationName + '?key=' + key;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { done: true, error: 'Status ' + res.status + ': ' + text.slice(0, 200) };
  }

  type OpResponse = {
    done?: boolean;
    error?: { message: string };
    response?: {
      generateVideoResponse?: {
        generatedSamples?: Array<{ video?: { uri: string } }>;
      };
    };
  };

  const json = (await res.json()) as OpResponse;

  if (!json.done) return { done: false };
  if (json.error) return { done: true, error: json.error.message };

  const uri = json.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!uri) return { done: true, error: 'No video URI in response' };

  return { done: true, videoUri: uri };
}

/**
 * Download the video bytes from Google's URI (requires API key).
 */
export async function downloadVideo(videoUri: string): Promise<Buffer> {
  const key = getApiKey();
  const url = videoUri + (videoUri.includes('?') ? '&' : '?') + 'key=' + key;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Veo download ' + res.status);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

/**
 * Pricing per second (rough, USD)
 */
export function estimatedCost(model: VeoModel, durationSeconds: number): number {
  const perSecond =
    model === 'veo-3.1-generate-preview' ? 0.40 :
    model === 'veo-3.1-fast-generate-preview' ? 0.15 :
    0.075; // lite
  return Number((perSecond * durationSeconds).toFixed(4));
}
