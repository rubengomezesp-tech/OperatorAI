/**
 * Operator AI — Brand OS
 * Public API
 */

// Types
export * from './types';

// Storage
export {
  BUCKET,
  buildLogoPath,
  buildFontPath,
  buildReferencePath,
  uploadToStorage,
  deleteFromStorage,
  getPublicUrl,
  fetchRemoteAsset,
  type UploadParams,
  type UploadResult,
} from './storage';

// Color extraction
export { extractColors, type ExtractColorsOptions } from './color-extractor';

// URL extraction
export { extractBrandFromUrl, type ExtractFromUrlOptions } from './url-extractor';

// Logo upload
export { uploadLogo, type UploadLogoOptions } from './logo-uploader';

// Auto-detect pipeline
export {
  autoDetectBrand,
  type AutoDetectInput,
  type AutoDetectResult,
} from './auto-detect';
