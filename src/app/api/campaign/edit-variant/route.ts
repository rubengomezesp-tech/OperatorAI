/**
 * /api/campaign/edit-variant
 *
 * Image-to-image editing via Nano Banana Pro.
 * Receives current image + natural-language instruction +
 * preservation context (product/logo analyses) and returns a new image.
 *
 * Body: {
 *   draftId: string,
 *   variantId: string,
 *   currentImageUrl: string,
 *   instruction: string,
 * }
 *
 * Returns: { imageUrl, version }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { serverEnv } from '@/lib/env';
import type { BrainOutput } from '@/features/campaign-brain/types';

export const runtime = 'nodejs';
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const NANO_BANANA_MODEL = 'gemini-2.5-flash-image';
const BUCKET = 'image-outputs';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

interface ProductAnalysis {
  productType: string;
  generationDescription: string;
  colors: string[];
  materials: string[];
}

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

// ────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      draftId?: string;
      variantId?: string;
      currentImageUrl?: string;
      instruction?: string;
    };

    if (!body.draftId || !body.variantId || !body.currentImageUrl || !body.instruction) {
      return NextResponse.json(
        { error: 'draftId, variantId, currentImageUrl and instruction are required' },
        { status: 400 },
      );
    }

    if (!serverEnv.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Image editor unavailable (GEMINI_API_KEY missing)' },
        { status: 500 },
      );
    }

    const svc = createSupabaseServiceClient();

    // Resolve org
    let orgId: string | undefined;
    try {
      const ctx = await resolveOrgContext(svc, user.id);
      orgId = ctx.orgId;
    } catch {
      orgId = undefined;
    }
    if (!orgId) {
      return NextResponse.json({ error: 'No org context' }, { status: 400 });
    }

    // Load draft for context
    const { data: draftRaw } = await svc
      .from('campaigns' as never)
      .select('intake_data, brain_output')
      .eq('id' as never, body.draftId as never)
      .eq('user_id' as never, user.id as never)
      .single();

    const draft = draftRaw as {
      intake_data?: {
        visualReferences?: string[];
        productAnalyses?: ProductAnalysis[];
      } | null;
      brain_output?: BrainOutput | null;
    } | null;

    const productAnalyses = draft?.intake_data?.productAnalyses ?? [];
    const refs = draft?.intake_data?.visualReferences ?? [];

    // Build edit prompt
    const editPrompt = buildEditPrompt(body.instruction, productAnalyses);

    // Download current image + reference images as inline parts
    const inlineImages = await downloadInline([
      body.currentImageUrl,
      ...refs.slice(0, 3),
    ]);

    if (inlineImages.length === 0) {
      return NextResponse.json(
        { error: 'Could not download any reference images' },
        { status: 500 },
      );
    }

    // Call Nano Banana
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: serverEnv.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: NANO_BANANA_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: editPrompt }, ...inlineImages],
        },
      ],
    });

    const imageBuffer = extractImageFromResponse(response);
    if (!imageBuffer) {
      return NextResponse.json(
        { error: 'Nano Banana did not return an image' },
        { status: 502 },
      );
    }

    // Upload + sign
    const version = Date.now();
    const path = `${orgId}/campaigns/${body.draftId}/${body.variantId}-edit-${version}.png`;
    const { error: upErr } = await svc.storage
      .from(BUCKET)
      .upload(path, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
        cacheControl: '604800',
      });
    if (upErr) {
      return NextResponse.json(
        { error: `Upload failed: ${upErr.message}` },
        { status: 500 },
      );
    }
    const { data: signed } = await svc.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL);

    if (!signed?.signedUrl) {
      return NextResponse.json(
        { error: 'Could not sign URL' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      imageUrl: signed.signedUrl,
      version,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Edit failed' },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function buildEditPrompt(
  instruction: string,
  productAnalyses: ProductAnalysis[],
): string {
  const parts: string[] = [
    `Edit the first image according to this instruction: "${instruction}".`,
  ];

  if (productAnalyses && productAnalyses.length > 0) {
    const primary = productAnalyses[0];
    if (primary.generationDescription) {
      parts.push(
        `CRITICAL — preserve the product faithfully: ${primary.generationDescription}`,
      );
    }
    if (primary.colors.length > 0) {
      parts.push(
        `Preserve product colors: ${primary.colors.slice(0, 3).join(', ')}.`,
      );
    }
  }

  parts.push(
    'Maintain commercial-grade photography quality. Keep composition cleanliness for marketing use.',
  );
  parts.push(
    'Do not introduce new text, watermarks, or UI overlays.',
  );

  return parts.join(' ');
}

async function downloadInline(
  urls: string[],
): Promise<Array<{ inlineData: { mimeType: string; data: string } }>> {
  const inlineImages: Array<{ inlineData: { mimeType: string; data: string } }> = [];

  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const ct = r.headers.get('content-type') ?? 'image/png';
      const mimeType = ct.includes('jpeg')
        ? 'image/jpeg'
        : ct.includes('webp')
        ? 'image/webp'
        : 'image/png';
      inlineImages.push({
        inlineData: { mimeType, data: buf.toString('base64') },
      });
    } catch {
      // skip failed downloads
    }
  }

  return inlineImages;
}

function extractImageFromResponse(response: unknown): Buffer | null {
  const r = response as GeminiResponseShape;
  const candidates = r?.candidates;
  if (!Array.isArray(candidates)) return null;

  for (const cand of candidates) {
    const parts = cand?.content?.parts;
    if (!Array.isArray(parts)) continue;
    for (const p of parts) {
      const inline = p.inlineData ?? p.inline_data;
      const data = inline?.data;
      if (typeof data === 'string' && data.length > 100) {
        try {
          return Buffer.from(data, 'base64');
        } catch {
          // skip
        }
      }
    }
  }
  return null;
}
