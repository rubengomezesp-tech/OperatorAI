// ═══════════════════════════════════════════════════════════════════
// PATCH INSTRUCTIONS for src/features/creative-studio/types.ts
// ═══════════════════════════════════════════════════════════════════
//
// ADD these 3 interfaces to types.ts (anywhere after ImageAnalysis).
// They are ADDITIVE — nothing existing breaks.
//
// Then add ONE optional field to PersistedCampaign (see bottom).
//
// ═══════════════════════════════════════════════════════════════════

export interface BrandLogoAnalysis {
  /** Hex colors extracted from the logo */
  colors: string[];
  /** Whether the logo appears to have a transparent background */
  hasTransparentBackground: boolean;
  /** horizontal | vertical | square based on aspect ratio */
  orientation: 'horizontal' | 'vertical' | 'square';
  /** Short description from vision model */
  description: string;
}

export interface BrandAssets {
  /** Supabase URL of the logo file */
  logoUrl: string;
  /** Analysis result from vision layer */
  logoAnalysis?: BrandLogoAnalysis;
  /** Optional brand palette (overrides auto-extracted colors) */
  palette?: string[];
  /** Optional tagline / slogan */
  slogan?: string;
  /** Optional brand name */
  brandName?: string;
  /** Optional font / typography preferences */
  fontNotes?: string;
  /** Where to place logo by default in editor */
  defaultLogoPosition?: 'top-left' | 'top-right' | 'top-center' | 'bottom-center';
}

// ── Add to PersistedCampaign ──
//
// Find the PersistedCampaign interface and add ONE optional field:
//
//   brandAssets?: BrandAssets;
//
// That's all. Nothing else in types.ts needs to change.

export {}; // marker
