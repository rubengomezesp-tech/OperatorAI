/**
 * Operator AI — Model Router
 * Public API
 */

// Types
export * from './types';

// Catalog
export {
  CATALOG,
  getCatalogEntry,
  findModelsByCapability,
  getCheapestModelWithCapabilities,
  type CatalogEntry,
} from './catalog';

// Clients
export { fluxPro, fluxProUltra, fluxSchnell, fluxProKontext, fluxProKontextMax } from './flux';
export { ideogramV3, ideogramV3Turbo } from './ideogram';
export { recraftV3, recraftV3Svg } from './recraft';
export { gptImage15 } from './gpt-image';
export { realEsrgan, upscaleImage } from './upscale';

// Vendor clients (low-level escape hatch)
export { falCall, falHealthcheck, type FalCallParams, type FalCallResult } from './fal-client';
export { replicateCall, type ReplicateCallParams, type ReplicateCallResult } from './replicate-client';

// Router
export {
  ALL_CLIENTS,
  selectModel,
  getFallbackChain,
  renderWithFallback,
  explainRouting,
} from './router';
