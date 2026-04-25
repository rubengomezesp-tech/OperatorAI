/**
 * Operator AI — Brand OS
 * Phase 3 / Font Uploader
 *
 * Validates and uploads brand fonts (WOFF2/WOFF/TTF).
 *
 * Pipeline:
 * 1. Detect MIME and validate
 * 2. Parse font metadata (family, weight, style) from binary
 * 3. Upload to Supabase Storage
 * 4. Return public URL + detected metadata
 *
 * Why WOFF2 is preferred:
 * - Smallest file size (best compression)
 * - Universal browser support (2026)
 * - Sharp + librsvg can render WOFF2 via @font-face in SVG
 *
 * If the user uploads TTF or WOFF, we accept it but log a warning
 * recommending WOFF2 conversion.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FontUploadResult } from './types';
import { BUCKET, buildFontPath, uploadToStorage, fetchRemoteAsset } from './storage';
import { BrandUploadError } from './types';

// ────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = new Set([
  'font/woff2',
  'font/woff',
  'font/ttf',
  'application/font-woff2',
  'application/font-woff',
  'application/x-font-ttf',
  'application/x-font-woff',
  'application/octet-stream', // fallback when MIME is missing
]);

// Magic numbers for font format detection
const MAGIC_WOFF2 = Buffer.from('wOF2');
const MAGIC_WOFF = Buffer.from('wOFF');
const MAGIC_TTF_TRUE = Buffer.from([0x00, 0x01, 0x00, 0x00]); // TrueType
const MAGIC_TTF_OTTO = Buffer.from('OTTO'); // OpenType (CFF)

// ────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────

export interface UploadFontOptions {
  supabase: SupabaseClient;
  orgId: string;
  /** Font source: Buffer, ArrayBuffer, Uint8Array, or remote URL */
  source: Buffer | ArrayBuffer | Uint8Array | string;
  /** MIME type (required if source is binary, optional if URL) */
  contentType?: string;
  /** Manual override of family name (overrides auto-detection) */
  familyOverride?: string;
  /** Manual override of weight (overrides auto-detection) */
  weightOverride?: number;
  /** Whether to convert TTF/WOFF to WOFF2 (NOT IMPLEMENTED — adds dep) */
  convertToWoff2?: boolean;
}

/**
 * Upload a font file to brand-fonts bucket.
 * Returns public URL + detected metadata.
 */
export async function uploadFont(options: UploadFontOptions): Promise<FontUploadResult> {
  const {
    supabase,
    orgId,
    source,
    contentType: explicitContentType,
    familyOverride,
    weightOverride,
  } = options;

  // ── 1. Resolve source to Buffer ────────────────────────────────
  const { buffer, contentType: detectedContentType } = await resolveBuffer(
    source,
    explicitContentType
  );

  // ── 2. Validate size ──────────────────────────────────────────
  if (buffer.byteLength === 0) {
    throw new BrandUploadError(BUCKET.FONTS, 'Empty file');
  }
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new BrandUploadError(
      BUCKET.FONTS,
      `File too large: ${buffer.byteLength} bytes (max ${MAX_FILE_SIZE})`
    );
  }

  // ── 3. Detect actual format from magic bytes (don't trust MIME) ──
  const actualFormat = detectFontFormat(buffer);
  if (!actualFormat) {
    throw new BrandUploadError(
      BUCKET.FONTS,
      'File is not a recognized font format (WOFF2/WOFF/TTF/OTF)'
    );
  }

  // Validate provided MIME against actual format
  const finalContentType = mapFormatToMime(actualFormat);
  const warnings: string[] = [];

  if (
    explicitContentType &&
    !ALLOWED_MIME_TYPES.has(explicitContentType.toLowerCase().split(';')[0].trim())
  ) {
    warnings.push(
      `Provided MIME "${explicitContentType}" not in allowed list. Using detected format.`
    );
  }

  if (actualFormat !== 'woff2') {
    warnings.push(
      `Format is ${actualFormat.toUpperCase()}. WOFF2 is recommended for best performance.`
    );
  }

  // ── 4. Parse font metadata (best effort, never throws) ─────────
  let detectedFamily: string | undefined;
  let detectedWeight: number | undefined;
  let detectedStyle: 'normal' | 'italic' | undefined;

  try {
    const meta = parseFontMetadata(buffer, actualFormat);
    detectedFamily = meta.family;
    detectedWeight = meta.weight;
    detectedStyle = meta.style;
  } catch (err) {
    warnings.push(`Could not parse font metadata: ${(err as Error).message}`);
  }

  // Apply overrides
  const finalFamily = familyOverride ?? detectedFamily;
  const finalWeight = weightOverride ?? detectedWeight ?? 400;

  if (!finalFamily) {
    warnings.push('Font family could not be detected. You should provide one manually.');
  }

  // ── 5. Build storage path ──────────────────────────────────────
  const path = buildFontPath(orgId, finalFamily ?? 'unknown', finalWeight);

  // ── 6. Upload ─────────────────────────────────────────────────
  const uploadResult = await uploadToStorage({
    supabase,
    bucket: BUCKET.FONTS,
    path,
    buffer,
    contentType: finalContentType,
    cacheControl: '31536000', // 1 year — fonts are immutable per filename
  });

  return {
    publicUrl: uploadResult.publicUrl,
    storagePath: uploadResult.storagePath,
    detectedFamily: finalFamily,
    detectedWeight: finalWeight,
    detectedStyle: detectedStyle,
    sizeBytes: buffer.byteLength,
    contentType: finalContentType as FontUploadResult['contentType'],
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ────────────────────────────────────────────────────────────────
// SOURCE RESOLUTION
// ────────────────────────────────────────────────────────────────

async function resolveBuffer(
  source: Buffer | ArrayBuffer | Uint8Array | string,
  explicitContentType?: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // Remote URL
  if (typeof source === 'string') {
    const fetched = await fetchRemoteAsset(source);
    return {
      buffer: fetched.buffer,
      contentType: fetched.contentType,
    };
  }

  // Already a Buffer
  if (Buffer.isBuffer(source)) {
    return {
      buffer: source,
      contentType: explicitContentType ?? 'application/octet-stream',
    };
  }

  // ArrayBuffer
  if (source instanceof ArrayBuffer) {
    return {
      buffer: Buffer.from(new Uint8Array(source)),
      contentType: explicitContentType ?? 'application/octet-stream',
    };
  }

  // Uint8Array (or any TypedArray)
  if (source instanceof Uint8Array) {
    return {
      buffer: Buffer.from(source),
      contentType: explicitContentType ?? 'application/octet-stream',
    };
  }

  // Last resort: try generic conversion
  return {
    buffer: Buffer.from(source as Uint8Array),
    contentType: explicitContentType ?? 'application/octet-stream',
  };
}

// ────────────────────────────────────────────────────────────────
// FORMAT DETECTION (magic bytes)
// ────────────────────────────────────────────────────────────────

type FontFormat = 'woff2' | 'woff' | 'ttf' | 'otf';

function detectFontFormat(buffer: Buffer): FontFormat | null {
  if (buffer.length < 4) return null;

  if (buffer.subarray(0, 4).equals(MAGIC_WOFF2)) return 'woff2';
  if (buffer.subarray(0, 4).equals(MAGIC_WOFF)) return 'woff';
  if (buffer.subarray(0, 4).equals(MAGIC_TTF_TRUE)) return 'ttf';
  if (buffer.subarray(0, 4).equals(MAGIC_TTF_OTTO)) return 'otf';

  return null;
}

function mapFormatToMime(format: FontFormat): string {
  switch (format) {
    case 'woff2':
      return 'font/woff2';
    case 'woff':
      return 'font/woff';
    case 'ttf':
      return 'font/ttf';
    case 'otf':
      return 'font/otf';
  }
}

// ────────────────────────────────────────────────────────────────
// METADATA PARSER (best-effort, no extra dependencies)
// ────────────────────────────────────────────────────────────────

interface FontMetadata {
  family?: string;
  weight?: number;
  style?: 'normal' | 'italic';
}

/**
 * Parse font metadata from binary.
 *
 * For WOFF2: requires brotli decompression to read the SFNT name table.
 *   We skip detailed parsing for WOFF2 (would need wawoff2 dep).
 *   Family will fall back to filename hint or user override.
 *
 * For TTF/OTF: parse the 'name' table directly.
 * For WOFF: also parsable (it's just SFNT + zlib compression on individual tables).
 *
 * If parsing fails for any reason, return empty metadata —
 * the caller will use overrides or defaults.
 */
function parseFontMetadata(buffer: Buffer, format: FontFormat): FontMetadata {
  // For WOFF2, parsing requires brotli decompression which isn't in stdlib.
  // We return empty so caller uses overrides or filename hints.
  if (format === 'woff2') {
    return {};
  }

  // For TTF/OTF, parse the name table
  if (format === 'ttf' || format === 'otf') {
    return parseSfntNameTable(buffer);
  }

  // WOFF parsing skipped (rare format in practice)
  return {};
}

/**
 * Minimal SFNT name table parser.
 * Looks for nameID 1 (family) and nameID 2 (subfamily/style).
 *
 * Spec: https://learn.microsoft.com/en-us/typography/opentype/spec/name
 */
function parseSfntNameTable(buffer: Buffer): FontMetadata {
  try {
    // SFNT header: 12 bytes
    // - 4 bytes: scalerType
    // - 2 bytes: numTables
    // - 2 bytes: searchRange
    // - 2 bytes: entrySelector
    // - 2 bytes: rangeShift
    if (buffer.length < 12) return {};

    const numTables = buffer.readUInt16BE(4);
    if (numTables === 0 || numTables > 100) return {};

    // Each table directory entry is 16 bytes:
    // - 4 bytes: tag (e.g., 'name')
    // - 4 bytes: checksum
    // - 4 bytes: offset
    // - 4 bytes: length
    let nameTableOffset = -1;
    let nameTableLength = 0;

    for (let i = 0; i < numTables; i++) {
      const entryOffset = 12 + i * 16;
      if (entryOffset + 16 > buffer.length) return {};

      const tag = buffer.subarray(entryOffset, entryOffset + 4).toString('latin1');
      if (tag === 'name') {
        nameTableOffset = buffer.readUInt32BE(entryOffset + 8);
        nameTableLength = buffer.readUInt32BE(entryOffset + 12);
        break;
      }
    }

    if (nameTableOffset < 0 || nameTableOffset + nameTableLength > buffer.length) {
      return {};
    }

    // Name table header (6 bytes):
    // - 2 bytes: format (0 or 1)
    // - 2 bytes: count (number of name records)
    // - 2 bytes: stringOffset (offset to string storage from start of name table)
    const nameTable = buffer.subarray(nameTableOffset, nameTableOffset + nameTableLength);
    if (nameTable.length < 6) return {};

    const count = nameTable.readUInt16BE(2);
    const stringOffset = nameTable.readUInt16BE(4);

    if (count === 0 || count > 1000) return {};

    let family: string | undefined;
    let subfamily: string | undefined;

    // Each name record is 12 bytes:
    // - 2 bytes: platformID
    // - 2 bytes: platformSpecificID (encodingID)
    // - 2 bytes: languageID
    // - 2 bytes: nameID
    // - 2 bytes: length
    // - 2 bytes: offset (from stringOffset)
    for (let i = 0; i < count; i++) {
      const recordOffset = 6 + i * 12;
      if (recordOffset + 12 > nameTable.length) break;

      const platformID = nameTable.readUInt16BE(recordOffset);
      const encodingID = nameTable.readUInt16BE(recordOffset + 2);
      const nameID = nameTable.readUInt16BE(recordOffset + 6);
      const strLength = nameTable.readUInt16BE(recordOffset + 8);
      const strOffset = nameTable.readUInt16BE(recordOffset + 10);

      // Only nameID 1 (family) and 2 (subfamily) interest us
      if (nameID !== 1 && nameID !== 2) continue;

      const stringStart = stringOffset + strOffset;
      const stringEnd = stringStart + strLength;
      if (stringEnd > nameTable.length) continue;

      const stringBytes = nameTable.subarray(stringStart, stringEnd);
      const isUtf16 = (platformID === 0) || (platformID === 3 && encodingID === 1);

      let str: string;
      if (isUtf16) {
        // UTF-16 BE
        str = decodeUtf16Be(stringBytes);
      } else {
        // ASCII / Mac Roman — close enough for our purposes
        str = stringBytes.toString('latin1');
      }

      if (nameID === 1 && !family) family = str.trim();
      if (nameID === 2 && !subfamily) subfamily = str.trim();

      // Early exit if we have both
      if (family && subfamily) break;
    }

    return {
      family,
      weight: subfamilyToWeight(subfamily),
      style: subfamilyToStyle(subfamily),
    };
  } catch {
    return {};
  }
}

function decodeUtf16Be(bytes: Buffer): string {
  let result = '';
  for (let i = 0; i + 1 < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    result += String.fromCharCode(code);
  }
  return result;
}

function subfamilyToWeight(subfamily?: string): number {
  if (!subfamily) return 400;
  const lower = subfamily.toLowerCase();

  // Standard mappings
  if (/\bthin\b/.test(lower) || /\bhairline\b/.test(lower)) return 100;
  if (/\bextralight|ultralight\b/.test(lower)) return 200;
  if (/\blight\b/.test(lower)) return 300;
  if (/\bmedium\b/.test(lower)) return 500;
  if (/\bsemibold|demibold\b/.test(lower)) return 600;
  if (/\bextrabold|ultrabold\b/.test(lower)) return 800;
  if (/\bblack|heavy\b/.test(lower)) return 900;
  if (/\bbold\b/.test(lower)) return 700;

  return 400; // regular / normal
}

function subfamilyToStyle(subfamily?: string): 'normal' | 'italic' {
  if (!subfamily) return 'normal';
  if (/italic|oblique/i.test(subfamily)) return 'italic';
  return 'normal';
}
