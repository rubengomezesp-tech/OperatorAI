/**
 * Operator AI — Brand OS
 * Phase 3 / Storage
 *
 * Thin wrappers around Supabase Storage for the 3 brand buckets:
 * - brand-logos
 * - brand-fonts
 * - brand-references
 *
 * Naming convention: {orgId}/{kind}/{timestamp}-{random}.{ext}
 * This isolates per-org content and prevents collisions.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { BrandUploadError } from './types';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────

export const BUCKET = {
  LOGOS: 'brand-logos',
  FONTS: 'brand-fonts',
  REFERENCES: 'brand-references',
} as const;

// ────────────────────────────────────────────────────────────────
// PATH BUILDERS
// ────────────────────────────────────────────────────────────────

export function buildLogoPath(orgId: string, ext: string, variant?: 'main' | 'dark'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const suffix = variant === 'dark' ? '-dark' : '';
  return `${orgId}/logo${suffix}-${timestamp}-${random}.${ext}`;
}

export function buildFontPath(orgId: string, family: string, weight: number = 400): string {
  const timestamp = Date.now();
  const safeFamily = family.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `${orgId}/${safeFamily}-${weight}-${timestamp}.woff2`;
}

export function buildReferencePath(orgId: string, ext: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${orgId}/ref-${timestamp}-${random}.${ext}`;
}

// ────────────────────────────────────────────────────────────────
// UPLOAD
// ────────────────────────────────────────────────────────────────

export interface UploadParams {
  supabase: SupabaseClient;
  bucket: string;
  path: string;
  buffer: Buffer | ArrayBuffer | Uint8Array;
  contentType: string;
  /** Cache-Control header (default: long cache for static brand assets) */
  cacheControl?: string;
  /** Whether to overwrite existing file */
  upsert?: boolean;
}

export interface UploadResult {
  publicUrl: string;
  storagePath: string;
  bucket: string;
}

/**
 * Upload a buffer to a Supabase Storage bucket and return the public URL.
 * Throws BrandUploadError on failure.
 */
export async function uploadToStorage(params: UploadParams): Promise<UploadResult> {
  const { supabase, bucket, path, buffer, contentType, cacheControl, upsert } = params;

  const body = buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, body, {
      contentType,
      cacheControl: cacheControl ?? '31536000', // 1 year
      upsert: upsert ?? false,
    });

  if (uploadError) {
    throw new BrandUploadError(bucket, `Upload failed: ${uploadError.message}`, uploadError);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

  if (!urlData?.publicUrl) {
    throw new BrandUploadError(bucket, `Failed to get public URL for ${path}`);
  }

  return {
    publicUrl: urlData.publicUrl,
    storagePath: path,
    bucket,
  };
}

/**
 * Delete a file from a bucket. Idempotent (no error if not found).
 */
export async function deleteFromStorage(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error && !error.message.includes('not found')) {
    throw new BrandUploadError(bucket, `Delete failed: ${error.message}`, error);
  }
}

/**
 * Get the public URL for a file already in storage.
 */
export function getPublicUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): string | null {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

// ────────────────────────────────────────────────────────────────
// REMOTE URL → BUFFER (helper for extraction pipelines)
// ────────────────────────────────────────────────────────────────

/**
 * Fetch a remote URL and return its buffer + content-type.
 * Used when extracting logos from external websites.
 */
export async function fetchRemoteAsset(
  url: string,
  timeoutMs = 15_000
): Promise<{ buffer: Buffer; contentType: string; sizeBytes: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
      sizeBytes: arrayBuffer.byteLength,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`Failed to fetch ${url}: ${(err as Error).message}`);
  }
}
