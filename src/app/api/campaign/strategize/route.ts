/**
 * /api/campaign/strategize
 *
 * The main entry point for Campaign Brain V2.
 * Takes intake data, runs the Brain, returns a complete Strategy Brief.
 *
 * Flow:
 *   1. Authenticate user
 *   2. Validate intake
 *   3. Run Brain orchestrator (vertical + campaign-type + angles + Claude)
 *   4. Save brain_output to draft (if draft id provided)
 *   5. Return BrainOutput
 *
 * The user can then:
 *   - View the Strategy Brief
 *   - Trigger renderer for specific variant briefs
 *   - Edit hooks/CTAs/angles
 *   - Save as final campaign
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { runCampaignBrain } from '@/features/campaign-brain/core/brain';
import type { CampaignIntake } from '@/features/campaign-brain/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel limit
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const ssr = await createSupabaseServerClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse body
    const body = (await req.json().catch(() => ({}))) as {
      intake?: Partial<CampaignIntake>;
      draftId?: string;
    };

    if (!body.intake) {
      return NextResponse.json(
        { error: 'intake is required' },
        { status: 400 },
      );
    }

    // 3. Run Brain
    const brainOutput = await runCampaignBrain(body.intake);

    // 4. Save to draft if draftId provided
    if (body.draftId) {
      const svc = createSupabaseServiceClient();
      await svc
        .from('campaigns' as never)
        .update({
          brain_output: brainOutput,
          vertical_slug: brainOutput.detectedVertical,
          campaign_type_slug: brainOutput.detectedCampaignType,
        } as never)
        .eq('id' as never, body.draftId as never)
        .eq('user_id' as never, user.id as never);
    }

    // 5. Return
    return NextResponse.json({ brainOutput });
  } catch (err) {
    const message = (err as Error).message ?? 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
