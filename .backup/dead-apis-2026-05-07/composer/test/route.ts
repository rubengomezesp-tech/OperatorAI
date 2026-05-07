/**
 * Test endpoint for the Composer.
 * Only available in development.
 *
 * Usage:
 *   GET /api/composer/test                    → default Operator brand
 *   GET /api/composer/test?brand=red          → red test brand
 *   GET /api/composer/test?format=instagram_story
 *   GET /api/composer/test?brand=blue&format=tiktok_in_feed
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  composeAd,
  OPERATOR_BRAND_KIT,
  TEST_BRAND_RED,
  TEST_BRAND_BLUE,
  TEST_BRAND_GREEN,
  FORMAT_PRESETS,
} from '@/lib/composer';
import type { BrandKit, CreativePlan } from '@/lib/composer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SAMPLE_BG_URL =
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=2000&q=90';

const BRAND_KITS: Record<string, BrandKit> = {
  operator: OPERATOR_BRAND_KIT,
  red: TEST_BRAND_RED,
  blue: TEST_BRAND_BLUE,
  green: TEST_BRAND_GREEN,
};

export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production' && process.env.COMPOSER_TEST_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Composer test is disabled in production' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const brandParam = searchParams.get('brand') ?? 'operator';
  const formatParam = searchParams.get('format') ?? 'instagram_feed_portrait';
  const bgParam = searchParams.get('bg') ?? SAMPLE_BG_URL;

  const brandKit = BRAND_KITS[brandParam] ?? OPERATOR_BRAND_KIT;
  const preset = FORMAT_PRESETS[formatParam] ?? FORMAT_PRESETS.instagram_feed_portrait;

  const plan: CreativePlan = {
    platform: preset.platform,
    formatId: preset.id,
    background: {
      imageUrl: bgParam,
      darken: { amount: 0.4, region: 'bottom' },
    },
    headline: {
      text: 'Launch your campaign in 10 minutes.',
      fontRole: 'display',
      sizePct: 7,
      colorRole: 'onDark',
      position: 'top',
      align: 'left',
    },
    subhead: {
      text: 'Built for solopreneurs who ship.',
      fontRole: 'primary',
      sizePct: 3.2,
      colorRole: 'onDark',
      align: 'left',
    },
    cta: {
      text: 'Try free →',
      style: 'pill',
      bgColorRole: 'primary',
      textColorRole: 'onLight',
    },
    logo: {
      position: 'bottom-left',
      paddingPct: 5,
      maxWidthPct: 18,
    },
  };

  try {
    const result = await composeAd({ brandKit, plan, preset });
    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'no-store',
        'X-Composer-Version': result.meta.composerVersion,
        'X-Generation-Ms': String(result.meta.durationMs),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Composer failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
