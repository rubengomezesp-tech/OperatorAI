/**
 * /api/research/vision-analyze
 *
 * Body: { imageUrl: string, type: 'product' | 'logo' }
 * Returns: ProductAnalysis or LogoAnalysis
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  analyzeProductImage,
  analyzeLogoImage,
} from '@/features/campaign-brain/server/vision-analyzer';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      imageUrl?: string;
      type?: 'product' | 'logo';
    };

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 },
      );
    }

    if (body.type === 'logo') {
      const analysis = await analyzeLogoImage(body.imageUrl);
      return NextResponse.json({ analysis, type: 'logo' });
    }

    // Default to product
    const analysis = await analyzeProductImage(body.imageUrl);
    return NextResponse.json({ analysis, type: 'product' });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Vision analysis failed' },
      { status: 500 },
    );
  }
}
