import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { autoDetectBrand } from '@/lib/brand-os';
import { ensureTrialSubscription } from '@/features/billing/server/ensure-trial-subscription';

export const runtime = 'nodejs';

const BodySchema = z.object({
  step: z.number().int().min(0).max(6),
  data: z.record(z.unknown()).optional(),
  completed: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string | null = null;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    // user hasn't created an org yet
  }

  // ── Save state (unchanged) ───────────────────────────────────
  const payload = {
    user_id: user.id,
    org_id: orgId,
    current_step: parsed.data.step,
    data: parsed.data.data ?? {},
    completed: parsed.data.completed ?? false,
    completed_at: parsed.data.completed ? new Date().toISOString() : null,
  };

  const { error } = await svc
    .from('onboarding_state')
    .upsert(payload as never, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── On completion: persist brand profile ─────────────────────
  if (parsed.data.completed && orgId && parsed.data.data) {
    const d = parsed.data.data as Record<string, unknown>;
    const brandName = typeof d.brand_name === 'string' ? d.brand_name : null;
    const description = typeof d.description === 'string' ? d.description : null;
    const vibe = typeof d.vibe === 'string' ? d.vibe : null;
    const userRole = typeof d.user_role === 'string' ? d.user_role : null;
    const firstPrompt = typeof d.first_prompt === 'string' ? d.first_prompt : null;
    const websiteUrl = typeof d.website_url === 'string' ? d.website_url : null;
    const detectedLogoUrl = typeof d.detected_logo_url === 'string' ? d.detected_logo_url : null;
    const detectedColors =
      d.detected_colors && typeof d.detected_colors === 'object' ? d.detected_colors : null;

    // Save manual fields immediately
    await svc.from('brand_profile').upsert({
      org_id: orgId,
      brand_name: brandName,
      description: description,
      vibe: vibe,
      user_role: userRole,
      first_prompt: firstPrompt,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: 'org_id' });

    // ── BRAND DNA AUTO-DETECT ────────────────────────────────
    // If user provided a website URL, run full extraction in background.
    // This uploads logo to our Storage and saves colors to brand_profile.
    //
    // We do this AFTER saving manual fields, so even if auto-detect
    // fails, the user's manual brand info is preserved.
    if (websiteUrl) {
      try {
        // Run in background — don't block onboarding completion.
        // Note: Vercel serverless does NOT keep promises alive after response.
        // For real background work we'd need a queue, but this is a
        // best-effort enhancement during onboarding (user is still on the
        // welcome screen for a few seconds while this runs).
        await autoDetectBrand({
          supabase: svc,
          orgId,
          url: websiteUrl,
          persist: true,
          downloadLogo: true,
        });
      } catch (err) {
        // Non-fatal — manual fields are already saved
        console.warn('[onboarding/save] auto-detect brand failed', {
          orgId,
          url: websiteUrl,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // ─── PHASE 1: TRIAL AUTO-PROVISION ─────────────────────────
  // Si el user completó onboarding y tiene org, garantizamos
  // que tenga subscription en estado 'trialing'. Esto desbloquea
  // connectors, image gen, y todo lo que pasa por checkUsage().
  // Idempotente: no crea duplicado si ya tiene subscription.
  if (parsed.data.completed && orgId) {
    try {
      const result = await ensureTrialSubscription(svc, orgId);
      if (result.created) {
        console.log('[onboarding/save] ✅ trial subscription created:', {
          orgId,
          subscriptionId: result.subscriptionId,
        });
      }
    } catch (err) {
      // Non-fatal — onboarding completed, user can manually upgrade later
      console.warn('[onboarding/save] trial provision failed (non-fatal)', {
        orgId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
