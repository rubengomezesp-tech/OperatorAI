import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { renderWithFalAi, generateMaskBuffer } from './ai-renderer';
import { isFalAvailable } from './fal-client';
import type { MockupJobInput, MockupEngine } from '../types';

export interface EngineDirective {
  useOverlay: boolean;
  imageUrl?: string;
  engineUsed: MockupEngine;
  fallbackUsed: boolean;
  preservationScore?: number;
  latencyMs: number;
  error?: string;
}

export async function orchestrate(
  input: MockupJobInput & {
    garmentWidth: number;
    garmentHeight: number;
    userId: string;
    orgId: string;
  },
): Promise<EngineDirective> {
  const start = Date.now();

  if (input.mode === 'exact_overlay') {
    return {
      useOverlay: true,
      engineUsed: 'overlay',
      fallbackUsed: false,
      latencyMs: Date.now() - start,
    };
  }

  if (!isFalAvailable()) {
    console.warn('[mockup-engine] AI unavailable, fallback to overlay');
    return {
      useOverlay: true,
      engineUsed: 'fallback_overlay',
      fallbackUsed: true,
      latencyMs: Date.now() - start,
      error: 'AI engine unavailable',
    };
  }

  try {
    const maskBuffer = await generateMaskBuffer({
      garmentWidth: input.garmentWidth,
      garmentHeight: input.garmentHeight,
      garmentType: input.garmentType,
      placement: input.placement,
      customPlacement: input.customPlacement,
    });

    const svc = createSupabaseServiceClient();

    const maskPath = `mockup-masks/${Date.now()}-${input.userId}.png`;
    const { error: upErr } = await svc.storage
      .from('image-outputs')
      .upload(maskPath, maskBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });
    if (upErr) throw new Error('Mask upload: ' + upErr.message);

    const { data: pubMask } = svc.storage.from('image-outputs').getPublicUrl(maskPath);

    const ai = await renderWithFalAi(input, pubMask.publicUrl);

    const aiBuf = await fetchToBuffer(ai.imageUrl);
    const resultPath = `mockup-results/${Date.now()}-${input.userId}.png`;
    const { error: resErr } = await svc.storage
      .from('image-outputs')
      .upload(resultPath, aiBuf, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });
    if (resErr) throw new Error('Result upload: ' + resErr.message);

    const { data: pubRes } = svc.storage.from('image-outputs').getPublicUrl(resultPath);

    return {
      useOverlay: false,
      imageUrl: pubRes.publicUrl,
      engineUsed: 'fal_flux_fill',
      fallbackUsed: false,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    console.warn('[mockup-engine] AI failed, fallback', {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      useOverlay: true,
      engineUsed: 'fallback_overlay',
      fallbackUsed: true,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown',
    };
  }
}

async function fetchToBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}
