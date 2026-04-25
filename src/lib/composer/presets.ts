/**
 * ════════════════════════════════════════════════════════════════
 * Operator AI — Premium Composer
 * Phase 1 / File 2 of 4 — Format presets & safe zones
 * ════════════════════════════════════════════════════════════════
 *
 * Sources for these specs (verified April 2026):
 * - Hootsuite Social Media Image Sizes Guide 2026
 * - Instagram aspect ratios reference
 * - Meta Business Help Center ad specs
 * - TikTok ad specs (in-feed + topview)
 *
 * Decision (CTO note):
 * - Safe zones are CONSERVATIVE — better to under-fill than have
 *   text cut off by UI overlays.
 * - For video platforms (Story, Reel, TikTok) the safe zone
 *   accounts for: top username/timer, bottom action buttons.
 */

import type { FormatPreset, Platform } from './types';

// ────────────────────────────────────────────────────────────────
// PRESETS
// ────────────────────────────────────────────────────────────────

export const FORMAT_PRESETS: Record<string, FormatPreset> = {
  // ── Instagram ──────────────────────────────────────────────
  instagram_feed_square: {
    id: 'instagram_feed_square',
    label: 'Instagram Feed (Square)',
    platform: 'instagram_feed',
    width: 1080,
    height: 1080,
    aspect: '1:1',
    safeZone: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
  },

  instagram_feed_portrait: {
    id: 'instagram_feed_portrait',
    label: 'Instagram Feed (Portrait)',
    platform: 'instagram_feed',
    width: 1080,
    height: 1350,
    aspect: '4:5',
    safeZone: {
      top: 80,
      right: 80,
      bottom: 80,
      left: 80,
    },
  },

  instagram_story: {
    id: 'instagram_story',
    label: 'Instagram Story',
    platform: 'instagram_story',
    width: 1080,
    height: 1920,
    aspect: '9:16',
    safeZone: {
      top: 250, // username, profile pic, timer
      right: 80,
      bottom: 270, // reaction buttons, send arrow
      left: 80,
    },
    uiOverlay: {
      top: 250,
      bottom: 270,
    },
  },

  instagram_reel: {
    id: 'instagram_reel',
    label: 'Instagram Reel',
    platform: 'instagram_reel',
    width: 1080,
    height: 1920,
    aspect: '9:16',
    safeZone: {
      top: 220,
      right: 220, // right side reactions/share/comments column
      bottom: 270,
      left: 80,
    },
    uiOverlay: {
      top: 220,
      bottom: 270,
    },
  },

  // ── TikTok ──────────────────────────────────────────────────
  tiktok_in_feed: {
    id: 'tiktok_in_feed',
    label: 'TikTok In-Feed Ad',
    platform: 'tiktok',
    width: 1080,
    height: 1920,
    aspect: '9:16',
    safeZone: {
      top: 200,
      right: 220, // right action column
      bottom: 350, // username + caption + audio info
      left: 80,
    },
    uiOverlay: {
      top: 200,
      bottom: 350,
    },
  },

  // ── Meta Ads (Facebook/Instagram paid) ────────────────────
  meta_ad_square: {
    id: 'meta_ad_square',
    label: 'Meta Ad (Square)',
    platform: 'meta_ad_square',
    width: 1080,
    height: 1080,
    aspect: '1:1',
    safeZone: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
  },

  meta_ad_landscape: {
    id: 'meta_ad_landscape',
    label: 'Meta Ad (Landscape)',
    platform: 'meta_ad_landscape',
    width: 1200,
    height: 628,
    aspect: '1.91:1',
    safeZone: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
  },

  // ── YouTube ──────────────────────────────────────────────
  youtube_short: {
    id: 'youtube_short',
    label: 'YouTube Short',
    platform: 'youtube_short',
    width: 1080,
    height: 1920,
    aspect: '9:16',
    safeZone: {
      top: 200,
      right: 200,
      bottom: 280,
      left: 80,
    },
  },

  // ── Twitter/X ────────────────────────────────────────────
  twitter_post: {
    id: 'twitter_post',
    label: 'Twitter/X Post',
    platform: 'twitter_post',
    width: 1600,
    height: 900,
    aspect: '16:9',
    safeZone: {
      top: 60,
      right: 60,
      bottom: 60,
      left: 60,
    },
  },
};

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────

/** Get all presets as array */
export function getAllPresets(): FormatPreset[] {
  return Object.values(FORMAT_PRESETS);
}

/** Get presets for a specific platform */
export function getPresetsForPlatform(platform: Platform): FormatPreset[] {
  return Object.values(FORMAT_PRESETS).filter((p) => p.platform === platform);
}

/** Get a preset by ID with fallback */
export function getPresetById(id: string): FormatPreset {
  const preset = FORMAT_PRESETS[id];
  if (!preset) {
    // eslint-disable-next-line no-console
    console.warn(`[composer] Unknown preset "${id}", falling back to instagram_feed_square`);
    return FORMAT_PRESETS.instagram_feed_square;
  }
  return preset;
}

/** Default preset by platform — used when user doesn't specify a format ID */
export function getDefaultPresetForPlatform(platform: Platform): FormatPreset {
  switch (platform) {
    case 'instagram_feed':
      return FORMAT_PRESETS.instagram_feed_portrait; // 4:5 has higher engagement
    case 'instagram_story':
      return FORMAT_PRESETS.instagram_story;
    case 'instagram_reel':
      return FORMAT_PRESETS.instagram_reel;
    case 'tiktok':
      return FORMAT_PRESETS.tiktok_in_feed;
    case 'meta_ad_square':
      return FORMAT_PRESETS.meta_ad_square;
    case 'meta_ad_landscape':
      return FORMAT_PRESETS.meta_ad_landscape;
    case 'youtube_short':
      return FORMAT_PRESETS.youtube_short;
    case 'twitter_post':
      return FORMAT_PRESETS.twitter_post;
  }
}

/**
 * Computes the inner safe area (the box where content can go).
 * Returns coords relative to canvas top-left.
 */
export function getSafeArea(preset: FormatPreset): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: preset.safeZone.left,
    y: preset.safeZone.top,
    width: preset.width - preset.safeZone.left - preset.safeZone.right,
    height: preset.height - preset.safeZone.top - preset.safeZone.bottom,
  };
}
