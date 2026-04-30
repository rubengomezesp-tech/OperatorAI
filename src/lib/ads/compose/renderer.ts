import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AdLayout } from './layouts';
import { getFontsForPreset } from './fonts';
import { AD_DIMENSIONS, type AdAspectRatio } from './dimensions';

export type AdPreset = 'luxury-minimal' | 'aggressive' | 'clean-conversion' | 'product-demo';

export interface RenderAdInput {
  baseImageDataUrl: string;
  logoDataUrl?: string;
  copy: { headline: string; subheadline: string; cta: string };
  preset: AdPreset;
  aspectRatio: AdAspectRatio;
}

export interface RenderAdOutput {
  url: string;
  storagePath: string;
  width: number;
  height: number;
  aspectRatio: AdAspectRatio;
  latencyMs: number;
}

export async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${buf.toString('base64')}`;
}

/**
 * Renders one ad format. Pure function: takes data URLs, returns PNG buffer + metadata.
 * Caller is responsible for fetching base/logo and uploading to storage.
 */
export async function renderAdToPng(input: RenderAdInput): Promise<{
  pngBuffer: Buffer;
  width: number;
  height: number;
  latencyMs: number;
}> {
  const start = Date.now();
  const dims = AD_DIMENSIONS[input.aspectRatio];

  const fonts = await getFontsForPreset(input.preset);

  const svg = await satori(
    AdLayout({
      baseImageDataUrl: input.baseImageDataUrl,
      logoDataUrl: input.logoDataUrl,
      copy: input.copy,
      preset: input.preset,
      width: dims.width,
      height: dims.height,
    }),
    { width: dims.width, height: dims.height, fonts },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: dims.width } });
  const pngBuffer = resvg.render().asPng();

  return {
    pngBuffer,
    width: dims.width,
    height: dims.height,
    latencyMs: Date.now() - start,
  };
}

/**
 * Renders + uploads one ad. Returns public URL + metadata.
 */
export async function renderAndUploadAd(params: {
  input: RenderAdInput;
  svc: SupabaseClient;
  orgId: string;
  filePrefix?: string;
}): Promise<RenderAdOutput> {
  const { input, svc, orgId, filePrefix = 'composed' } = params;
  const { pngBuffer, width, height, latencyMs } = await renderAdToPng(input);

  const fileName = `${filePrefix}-${input.aspectRatio.replace(':', 'x')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
  const storagePath = `${orgId}/composed/${fileName}`;

  const { error: upErr } = await svc.storage
    .from('generated-images')
    .upload(storagePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,
    });
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);

  const { data: pub } = svc.storage.from('generated-images').getPublicUrl(storagePath);

  return {
    url: pub.publicUrl,
    storagePath,
    width,
    height,
    aspectRatio: input.aspectRatio,
    latencyMs,
  };
}
