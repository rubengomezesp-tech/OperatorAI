import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { enhancePrompt } from '@/features/image-studio/server/flux-client';
import { IMAGE_PRESETS } from '@/features/image-studio/data/presets';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(2).max(8000),
  preset: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).default('1:1'),
  seed: z.number().int().optional(),
  enhance: z.boolean().default(true),
  referenceUrls: z.array(z.string().url()).max(8).optional(),
  // Reference images as base64 (used by chat — uploads come this way)
  referenceImages: z.array(z.object({
    data: z.string().min(10),       // base64 (no data: prefix)
    mimeType: z.string().min(3),    // e.g. 'image/png'
  })).max(8).optional(),
  // Optional inpainting mask: PNG base64 (white pixels = edit zone, transparent = keep)
  mask: z.string().min(10).optional(),
  // Imagery model. Default to gpt-image-1 (premium quality + ref images)
  // Falls back to Flux if gpt-image-1 fails
  model: z.enum(['gpt-image-1']).optional().default('gpt-image-1'),
});

type PromptHint = 'editorial' | 'startup' | 'luxury';

function coercePromptHint(value: unknown): PromptHint {
  if (value === 'startup' || value === 'luxury') return value;
  return 'editorial';
}

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const ssr = await createSupabaseServerClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  let orgId: string;

  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const preset = IMAGE_PRESETS.find((p) => p.id === body.preset);
  const hasReferences = Array.isArray(body.referenceUrls) && body.referenceUrls.length > 0;

  let enhanced = body.prompt;
  if (body.enhance) {
    try {
      const hint = coercePromptHint(preset?.hint);
      enhanced = await enhancePrompt(body.prompt, hint);
    } catch {
      enhanced = body.prompt;
    }
  }

  const fullPrompt = preset
    ? preset.promptPrefix + enhanced + preset.promptSuffix
    : enhanced;

  const pendingRow = {
    org_id: orgId,
    user_id: user.id,
    prompt: body.prompt,
    enhanced_prompt: enhanced,
    negative_prompt: preset?.negativePrompt ?? null,
    preset: body.preset ?? null,
    aspect_ratio: body.aspectRatio,
    seed: body.seed ?? null,
    reference_storage_path: hasReferences ? body.referenceUrls!.join(',') : null,
    is_edit: hasReferences,
    edit_prompt: hasReferences ? body.prompt : null,
    provider: 'replicate',
    model: (body as any)?.model ?? 'flux-2-pro',
    status: 'processing',
  } as never;

  // Lookup parent image (for edit history chain)
  let parentId: string | null = null;
  if (hasReferences && body.referenceUrls?.[0]) {
    const refUrl = body.referenceUrls[0].split('?')[0];
    const { data: parent } = await svc
      .from('image_generations')
      .select('id')
      .eq('org_id', orgId)
      .filter('output_urls', 'cs', `{${refUrl}}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (parent) parentId = (parent as { id: string }).id;
  }
  const pendingRowWithParent = { ...(pendingRow as Record<string, unknown>), parent_image_id: parentId } as never;

  const { data: created, error: insErr } = await svc
    .from('image_generations')
    .insert(pendingRowWithParent)
    .select('id')
    .single();

  if (insErr || !created) {
    return NextResponse.json(
      { error: insErr?.message ?? 'Failed to create record' },
      { status: 500 }
    );
  }

  const imageId = (created as { id: string }).id;

  // ═══ GPT-IMAGE-1 PATH (priority — premium quality, supports ref images) ═══
  if (body.model === 'gpt-image-1') {
    try {
      const { generateWithGptImage, GptImageError } = await import('@/features/creative-studio/server/gpt-image-client');
      
      // GPT-image AspectRatio type: '9:16' | '1:1' | '4:5'
      // Map schema values to supported set
      const gptAspect = body.aspectRatio;
      
      // Convert referenceImages (base64) → data: URIs (cliente acepta string[])
      const refDataUris = (body.referenceImages || []).map(
        (ref) => `data:${ref.mimeType};base64,${ref.data}`
      );
      // Combine with any external URL refs
      const allRefUrls = [...(body.referenceUrls || []), ...refDataUris];
      
      const gptResult = await generateWithGptImage({
        prompt: fullPrompt,
        aspectRatio: gptAspect,
        quality: (process.env.GPT_IMAGE_QUALITY as 'low'|'medium'|'high'|'auto'|undefined) ?? 'high',
        referenceUrls: allRefUrls.length > 0 ? allRefUrls : undefined,
        mask: body.mask,
      });
      
      // Upload buffer to Supabase Storage
      const fileName = `${imageId}.png`;
      const storagePath = `${orgId}/${fileName}`;
      const { error: uploadErr } = await svc.storage
        .from('generated-images')
        .upload(storagePath, gptResult.buffer, {
          contentType: 'image/png',
          upsert: true,
        });
      
      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);
      
      const { data: pub } = svc.storage
        .from('generated-images')
        .getPublicUrl(storagePath);
      
      const publicUrl = pub.publicUrl;
      
      await svc
        .from('image_generations')
        .update({
          status: 'complete',
          provider: 'openai',
          model: 'gpt-image-1',
          output_urls: [publicUrl],
          output_storage_paths: [storagePath],
          latency_ms: 0,
          cost_usd: gptResult.estimatedCostUsd,
        } as never)
        .eq('id', imageId);
      
      await svc.rpc('increment_usage', {
        p_org_id: orgId,
        p_kind: 'image_generation',
        p_quantity: 1,
        p_cost: gptResult.estimatedCostUsd,
      });
      
      return NextResponse.json({
        id: imageId,
        urls: [publicUrl],
        url: publicUrl,
        storagePaths: [storagePath],
        provider: 'openai',
        model: 'gpt-image-1',
      });
    } catch (gptErr) {
      const message = gptErr instanceof Error ? gptErr.message : 'gpt-image-1 generation failed';
      console.error('[gpt-image-1] failed:', message);
      await svc
        .from('image_generations')
        .update({ status: 'failed', error_message: message } as never)
        .eq('id', imageId);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
}
