/**
 * Operator AI — Premium Composer
 * Public API surface
 */

// Types
export * from './types';

// Format presets
export * from './presets';

// Brand kits (test fixtures)
export * from './brand-defaults';

// Brand adapter (DB integration)
export {
  getBrandKitForOrg,
  mapRowToBrandKit,
  type BrandProfileRow,
} from './brand-adapter';

// Feature flag
export {
  isComposerV2Enabled,
  explainFlagDecision,
  type ComposerFlagContext,
} from './flag';

// Prompt utilities
export {
  stripTextFromPrompt,
  buildNoTextNegativePrompt,
} from './prompt-cleanup';

// Sharp engine
export { composeAd, composeMultiFormat, type ComposeOptions } from './composer';

// Pipeline orchestrator (the main integration point)
export {
  runComposerPipeline,
  tryComposerV2,
  ComposerDisabledError,
  type CreativePipelineInput,
  type CreativePipelineOutput,
  type BackgroundRenderParams,
} from './pipeline';
