/**
 * Operator AI — Brand OS
 * Phase 3 / Logo Uploader
 *
 * Validates and uploads brand logos.
 *
 * Pipeline:
 * 1. Detect MIME and validate
 * 2. Read with Sharp to get dimensions and channels (alpha)
 * 3. Optionally normalize (max dimension cap)
 * 4. Upload to Supabase Storage
 * 5. Return public URL + metadata
 */

import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LogoUploadResult } from './types';
import { BUCKET, buildLogoPath, uploadToStorage, fetchRemoteAsset } from './storage';
import { BrandUploadError } from './types';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────

const MAX_DIMENSION = 2048; // longest side cap
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
]);

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface UploadLogoOptions {
  supabase: SupabaseClient;
  orgId: string;
  /** Logo source: Buffer, ArrayBuffer, or remote URL */
  source: Buffer | ArrayBuffer | string;
  /** MIME type (required if source is Buffer/ArrayBuffer) */
  contentType?: string;
  /** Variant: 'main' or 'dark' (for dark mode logo) */
  variant?: 'main' | 'dark';
  /** Whether to resize if too big (default: true) */
  autoResize?: boolean;
}

/**
 * Upload a logo to brand-logos bucket and return its public URL.
 */
export async function uploadLogo(options: UploadLogoOptions): Promise<LogoUploadResult> {
  const {
    supabase,
    orgId,
    source,
    contentType: explicitContentType,
    variant = 'main',
    autoResize = true,
  } = options;

  // 1. Resolve source to Buffer
  let buffer: Buffer;
  let detectedContentType: string;

  if (typeof source === 'string') {
    const fetched = await fetchRemoteAsset(source);
    buffer = fetched.buffer;
    detectedContentType = fetched.contentType;
  } else if (source instanceof Buffer) {
    buffer = source;
    detectedContentType = explicitContentType ?? 'application/octet-stream';
  } else {
    buffer = Buffer.from(source);
    detectedContentType = explicitContentType ?? 'application/octet-stream';
  }

  // 2. Validate size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new BrandUploadError(
      BUCKET.LOGOS,
      `File too large: ${buffer.byteLength} bytes (max ${MAX_FILE_SIZE})`
    );
  }

  if (buffer.byteLength === 0) {
    throw new BrandUploadError(BUCKET.LOGOS, 'Empty file');
  }

  // 3. Validate MIME
  const finalContentType = detectedContentType.toLowerCase().split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(finalContentType)) {
    throw new BrandUploadError(
      BUCKET.LOGOS,
      `Unsupported MIME type: ${finalContentType}. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(', ')}`
    );
  }

  // 4. Process: SVG passes through, raster goes through Sharp
  const isSvg = finalContentType === 'image/svg+xml';
  const warnings: string[] = [];

  let finalBuffer = buffer;
  let width = 0;
  let height = 0;
  let hasTransparency = isSvg; // SVG has implicit transparency
  let ext = mimeToExt(finalContentType);

  if (!isSvg) {
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width ?? 0;
      height = meta.height ?? 0;
      hasTransparency = meta.hasAlpha ?? false;

      // Resize if needed
      if (autoResize && (width > MAX_DIMENSION || height > MAX_DIMENSION)) {
        finalBuffer = await sharp(buffer)
          .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
          .png() // always export to PNG to preserve transparency
          .toBuffer();
        ext = 'png';
        const newMeta = await sharp(finalBuffer).metadata();
        width = newMeta.width ?? width;
        height = newMeta.height ?? height;
        warnings.push('Logo was resized to fit max dimension');
      }

      // Warn if no transparency on a logo (probably not ideal)
      if (!hasTransparency && finalContentType !== 'image/jpeg') {
        warnings.push('Logo does not have transparency — may not composite well over backgrounds');
      }
    } catch (err) {
      throw new BrandUploadError(
        BUCKET.LOGOS,
        `Sharp failed to read image: ${(err as Error).message}`,
        err
      );
    }
  }

  // 5. Upload
  const path = buildLogoPath(orgId, ext, variant);
  const uploadResult = await uploadToStorage({
    supabase,
    bucket: BUCKET.LOGOS,
    path,
    buffer: finalBuffer,
    contentType: finalContentType,
  });

  return {
    publicUrl: uploadResult.publicUrl,
    storagePath: uploadResult.storagePath,
    width,
    height,
    contentType: finalContentType,
    sizeBytes: finalBuffer.byteLength,
    hasTransparency,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

function mimeToExt(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/svg+xml':
      return 'svg';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}
