import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { renderWithFalAi, generateMaskBuffer } from './ai-renderer';
import { isFalAvailable } from './fal-client';
import type { MockupJobInput, MockupEngine } from '../types';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────

/** TTL for signed URLs (1 hour) — long enough for fal.ai to process */
const MASK_SIGNED_URL_TTL = 60 * 60;

/** TTL for result URL returned to frontend (24 hours) */
const RESULT_SIGNED_URL_TTL = 24 * 60 * 60;

/** Bucket where masks and results are stored */
const STORAGE_BUCKET = 'image-outputs';

// ────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────

export interface EngineDirective {
  useOverlay: boolean;
  imageUrl?: string;
  /** Storage path of the result (for re-fetching when signed URL expires) */
  storagePath?: string;
  engineUsed: MockupEngine;
  fallbackUsed: boolean;
  preservationScore?: number;
  latencyMs: number;
  error?: string;
}

// ────────────────────────────────────────────────────────────────
// MAIN ORCHESTRATOR
// ────────────────────────────────────────────────────────────────

export async function orchestrate(
  input: MockupJobInput & {
    garmentWidth: number;
    garmentHeight: number;
    userId: string;
    orgId: string;
  },
): Promise<EngineDirective> {
  const start = Date.now();

  // Validate required org context
  if (!input.orgId) {
    return {
      useOverlay: true,
      engineUsed: 'fallback_overlay',
      fallbackUsed: true,
      latencyMs: Date.now() - start,
      error: 'Missing orgId — required for RLS-compliant storage paths',
    };
  }

  // Mode: exact_overlay always uses overlay
  if (input.mode === 'exact_overlay') {
    return {
      useOverlay: true,
      engineUsed: 'overlay',
      fallbackUsed: false,
      latencyMs: Date.now() - start,
    };
  }

  // Mode: AI but fal not configured → fallback
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

  // ── Main AI path ────────────────────────────────────────────
  try {
    // 1. Generate mask
    const maskBuffer = await generateMaskBuffer({
      garmentWidth: input.garmentWidth,
      garmentHeight: input.garmentHeight,
      garmentType: input.garmentType,
      placement: input.placement,
      customPlacement: input.customPlacement,
    });

    const svc = createSupabaseServiceClient();

    // 2. Upload mask with org-scoped path (RLS-compliant)
    const maskPath = buildMaskPath(input.orgId, input.userId);
    const { error: upErr } = await svc.storage
      .from(STORAGE_BUCKET)
      .upload(maskPath, maskBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (upErr) {
      throw new Error(`Mask upload failed: ${upErr.message}`);
    }

    // 3. Get a SIGNED URL for the mask (so fal.ai can fetch it)
    //    Public URLs don't work on private buckets — signed URLs do.
    const maskSignedUrl = await getSignedUrl(svc, maskPath, MASK_SIGNED_URL_TTL);
    if (!maskSignedUrl) {
      throw new Error('Failed to create signed URL for mask');
    }

    // 4. Send to fal.ai with the signed mask URL
    const ai = await renderWithFalAi(input, maskSignedUrl);

    // 5. Download AI result and upload to our storage
    const aiBuf = await fetchToBuffer(ai.imageUrl);
    const resultPath = buildResultPath(input.orgId, input.userId);

    const { error: resErr } = await svc.storage
      .from(STORAGE_BUCKET)
      .upload(resultPath, aiBuf, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    if (resErr) {
      throw new Error(`Result upload failed: ${resErr.message}`);
    }

    // 6. Return a SIGNED URL (24h TTL) for the frontend
    const resultSignedUrl = await getSignedUrl(svc, resultPath, RESULT_SIGNED_URL_TTL);
    if (!resultSignedUrl) {
      throw new Error('Failed to create signed URL for result');
    }

    return {
      useOverlay: false,
      imageUrl: resultSignedUrl,
      storagePath: resultPath,
      engineUsed: 'fal_flux_fill',
      fallbackUsed: false,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    console.warn('[mockup-engine] AI failed, falling back to overlay', {
      error: err instanceof Error ? err.message : String(err),
      orgId: input.orgId,
      userId: input.userId,
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

// ────────────────────────────────────────────────────────────────
// PATH BUILDERS — RLS-compliant
// ────────────────────────────────────────────────────────────────
// IMPORTANT: All paths MUST start with `${orgId}/` so that
// Supabase Storage RLS policies (which use the first segment as
// the org_id) work correctly.

function buildMaskPath(orgId: string, userId: string): string {
  const ts = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${orgId}/mockup-masks/${ts}-${userId}-${random}.png`;
}

function buildResultPath(orgId: string, userId: string): string {
  const ts = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${orgId}/mockup-results/${ts}-${userId}-${random}.png`;
}

// ────────────────────────────────────────────────────────────────
// SIGNED URL HELPER
// ────────────────────────────────────────────────────────────────

/**
 * Create a signed URL for a private bucket file.
 * Returns null on failure (caller decides how to handle).
 *
 * Why signed URLs:
 * - Bucket is private (correct security posture)
 * - getPublicUrl() returns 401/403 on private buckets
 * - Signed URLs include a token that grants temporary access
 */
async function getSignedUrl(
  svc: ReturnType<typeof createSupabaseServiceClient>,
  path: string,
  expiresInSeconds: number,
): Promise<string | null> {
  const { data, error } = await svc.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    console.error('[mockup-engine] createSignedUrl error', {
      path,
      error: error.message,
    });
    return null;
  }

  return data?.signedUrl ?? null;
}

// ────────────────────────────────────────────────────────────────
// FETCH HELPER (with timeout + retry)
// ────────────────────────────────────────────────────────────────

async function fetchToBuffer(url: string, timeoutMs = 30_000): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      throw new Error(`Fetch failed ${res.status}: ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(new Uint8Array(ab));
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Failed to fetch ${url}: ${(err as Error).message}`);
  }
}

// ────────────────────────────────────────────────────────────────
// PUBLIC HELPERS (for re-fetching expired URLs)
// ────────────────────────────────────────────────────────────────

/**
 * Re-create a signed URL for a result that was generated earlier.
 * Use this when the original signed URL has expired (after 24h).
 *
 * Frontend can call an endpoint that uses this when image fails to load.
 */
export async function refreshResultSignedUrl(
  storagePath: string,
): Promise<string | null> {
  const svc = createSupabaseServiceClient();
  return getSignedUrl(svc, storagePath, RESULT_SIGNED_URL_TTL);
}
