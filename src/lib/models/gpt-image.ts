/**
 * Operator AI — Model Router
 * Phase 2 / GPT-Image-1.5 client
 *
 * Best for:
 * - Multi-reference compositions (up to 5 images)
 * - Logo preservation (input_fidelity: 'high')
 * - Iterative editing
 *
 * Calls OpenAI Images API directly. Requires OPENAI_API_KEY.
 */

import type { ModelClient, RenderRequest, RenderResult } from './types';
import { CATALOG } from './catalog';
import { ModelRenderError, ModelTimeoutError } from './types';

const OPENAI_BASE = 'https://api.openai.com/v1';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 1;

export const gptImage15: ModelClient = {
  id: 'gpt-image-1.5',
  vendor: 'openai',
  capabilities: new Set(CATALOG['gpt-image-1.5'].capabilities),
  costCentsPerImage: CATALOG['gpt-image-1.5'].costCentsPerImage,
  typicalLatencyMs: CATALOG['gpt-image-1.5'].typicalLatencyMs,

  async render(req: RenderRequest): Promise<RenderResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ModelRenderError(
        'gpt-image-1.5',
        'openai',
        'OPENAI_API_KEY env var is not set'
      );
    }

    const start = Date.now();
    const hasReferences = (req.referenceImages?.length ?? 0) > 0 || req.logoUrl;

    // Endpoint differs:
    // - /v1/images/generations → text-to-image
    // - /v1/images/edits → with reference images
    const endpoint = hasReferences
      ? `${OPENAI_BASE}/images/edits`
      : `${OPENAI_BASE}/images/generations`;

    const size = mapSize(req.aspect);

    let lastError: unknown;
    for (let attempt = 0; attempt <= DEFAULT_MAX_RETRIES; attempt++) {
      try {
        let response: Response;

        if (hasReferences) {
          // Multipart form for /edits endpoint
          const formData = new FormData();
          formData.append('model', 'gpt-image-1.5');
          formData.append('prompt', req.prompt);
          formData.append('size', size);
          formData.append('quality', 'high');
          formData.append('input_fidelity', 'high'); // logo preservation
          formData.append('n', '1');

          // Attach reference images
          const allRefs = [
            ...(req.logoUrl ? [req.logoUrl] : []),
            ...(req.referenceImages ?? []),
          ].slice(0, 5); // max 5 high-fidelity refs

          for (const refUrl of allRefs) {
            const imgResponse = await fetch(refUrl);
            if (!imgResponse.ok) {
              throw new Error(`Failed to fetch reference image: ${refUrl}`);
            }
            const blob = await imgResponse.blob();
            formData.append('image[]', blob);
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

          response = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}` },
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeout);
        } else {
          // JSON body for /generations endpoint
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-image-1.5',
              prompt: req.prompt,
              size,
              quality: 'high',
              n: 1,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const firstImage = data?.data?.[0];

        if (!firstImage?.url && !firstImage?.b64_json) {
          throw new Error(`No image in OpenAI response: ${JSON.stringify(data).substring(0, 200)}`);
        }

        // GPT-Image returns either url or b64_json depending on response_format
        const imageUrl = firstImage.url ?? `data:image/png;base64,${firstImage.b64_json}`;

        return {
          imageUrl,
          modelId: 'gpt-image-1.5',
          vendor: 'openai',
          width: parseSizeWidth(size),
          height: parseSizeHeight(size),
          costCents: CATALOG['gpt-image-1.5'].costCentsPerImage,
          durationMs: Date.now() - start,
          raw: data,
        };
      } catch (err) {
        lastError = err;
        const isLastAttempt = attempt === DEFAULT_MAX_RETRIES;
        const isTimeout = (err as Error)?.name === 'AbortError';

        if (isLastAttempt) {
          if (isTimeout) {
            throw new ModelTimeoutError('gpt-image-1.5', 'openai', DEFAULT_TIMEOUT_MS);
          }
          throw new ModelRenderError(
            'gpt-image-1.5',
            'openai',
            `GPT-Image render failed: ${(err as Error).message}`,
            err
          );
        }

        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    throw new ModelRenderError(
      'gpt-image-1.5',
      'openai',
      'Unreachable',
      lastError
    );
  },
};

function mapSize(aspect: RenderRequest['aspect']): string {
  // GPT-Image supports specific size strings
  switch (aspect) {
    case '1:1':
      return '1024x1024';
    case '4:5':
      return '1024x1280';
    case '9:16':
      return '1024x1792';
    case '16:9':
      return '1792x1024';
    case '3:4':
      return '1024x1280';
    default:
      return '1024x1024';
  }
}

function parseSizeWidth(size: string): number {
  return parseInt(size.split('x')[0], 10);
}

function parseSizeHeight(size: string): number {
  return parseInt(size.split('x')[1], 10);
}
