[README-composer.md](https://github.com/user-attachments/files/27082705/README-composer.md)
# Composer — Premium Image Composition Engine

> **Phase 1 — Foundation (types & presets only)**
> No image compositing yet. That comes in File 4.

## What is this?

The Composer is Operator AI's premium output engine. Instead of letting the AI generate text/logo/CTA inside the image (where quality is unreliable), we:

1. **AI generates only the background image** (Flux/Imagen/etc)
2. **Sharp + SVG overlays the headline, subhead, CTA, and logo** with pixel-perfect typography and exact brand colors

This is the architecture used by Canva, AdCreative.ai, and Smartly.io to deliver professional-grade ad creatives.

## Folder structure

```
src/lib/composer/
├── types.ts            ← TypeScript types (this phase)
├── presets.ts          ← Format presets & safe zones (this phase)
├── brand-defaults.ts   ← Test brand kits (this phase)
├── README.md           ← This file
│
├── svg-text.ts         ← (Phase 1 / File 2 of next message)
├── svg-cta.ts          ← (Phase 1 / File 2 of next message)
├── svg-logo.ts         ← (Phase 1 / File 2 of next message)
│
├── composer.ts         ← (Phase 1 / File 3 — Sharp engine)
└── brand-adapter.ts    ← (Phase 3 — reads from brand_profile DB)
```

## Quickstart (when complete)

```typescript
import { composeAd } from '@/lib/composer';
import { OPERATOR_BRAND_KIT } from '@/lib/composer/brand-defaults';
import { FORMAT_PRESETS } from '@/lib/composer/presets';

const result = await composeAd({
  brandKit: OPERATOR_BRAND_KIT,
  preset: FORMAT_PRESETS.instagram_feed_portrait,
  plan: {
    platform: 'instagram_feed',
    background: { imageUrl: 'https://...' },
    headline: {
      text: 'Launch in 10 minutes',
      fontRole: 'display',
      sizePct: 8,
      colorRole: 'onDark',
      position: 'top',
      align: 'left',
    },
    cta: {
      text: 'Try free',
      style: 'pill',
      bgColorRole: 'primary',
      textColorRole: 'onLight',
    },
    logo: {
      position: 'bottom-right',
      paddingPct: 5,
      maxWidthPct: 18,
    },
  },
});

// result.buffer is a PNG ready to upload
```

## Supported formats

- **Instagram Feed**: 1:1 (1080×1080), 4:5 (1080×1350)
- **Instagram Story**: 9:16 (1080×1920) with 250px top + 270px bottom safe zones
- **Instagram Reel**: 9:16 (1080×1920) with right-side action column safe zone
- **TikTok In-Feed**: 9:16 (1080×1920) with 350px bottom safe zone
- **Meta Ads**: 1:1 (1080×1080), 1.91:1 (1200×628)
- **YouTube Short**: 9:16 (1080×1920)
- **Twitter/X**: 16:9 (1600×900)

## Architectural notes

### Why is `BrandKit` independent from `brand_profile` (DB)?

Decoupling. The `brand-adapter.ts` (Phase 3) translates `brand_profile` → `BrandKit`. This means:
- Schema migrations don't break composer logic
- We can add support for `brand_os_rules` later without changing composer
- We can use synthetic brand kits in tests

### Why are safe zones static per platform?

Because UI overlays (Story bars, TikTok actions) are deterministic. Verified specs from Hootsuite 2026 and platform-specific guidance.

### Why is `sizePct` a percentage rather than absolute pixels?

So a single `CreativePlan` can render correctly across all formats (1:1, 4:5, 9:16) without recomputing layout coords.

## Status

| File | Status | Phase |
|------|--------|-------|
| `types.ts` | ✅ Complete | Phase 1.1 |
| `presets.ts` | ✅ Complete | Phase 1.1 |
| `brand-defaults.ts` | ✅ Complete | Phase 1.1 |
| `svg-text.ts` | ⏳ Next message | Phase 1.2 |
| `svg-cta.ts` | ⏳ Next message | Phase 1.2 |
| `svg-logo.ts` | ⏳ Next message | Phase 1.2 |
| `composer.ts` | ⏳ Message 3 | Phase 1.3 |
| `brand-adapter.ts` | ⏳ Phase 3 | Phase 3 |
