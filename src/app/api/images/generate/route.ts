import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateWithFlux, enhancePrompt } from '@/features/image-studio/server/flux-client';
import { IMAGE_PRESETS } from '@/features/image-studio/data/presets';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(2).max(2000),
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
  // Imagery model. Default to gpt-image-1 (premium quality + ref images)
  // Falls back to Flux if gpt-image-1 fails
  model: z.enum(['gpt-image-1', 'flux-2-pro']).optional().default('gpt-image-1'),
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
    provider: 'replicate',
    model: (body as any)?.model ?? 'flux-2-pro',
    status: 'processing',
  } as never;

  const { data: created, error: insErr } = await svc
    .from('image_generations')
    .insert(pendingRow)
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
      const gptAspect: '9:16' | '1:1' | '4:5' = 
        body.aspectRatio === '16:9' ? '1:1' :   // landscape→square (closest)
        body.aspectRatio === '3:2' ? '1:1' :    // landscape→square
        body.aspectRatio as '9:16' | '1:1' | '4:5';
      
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
      // GPT-image failed → fall through to Flux as fallback
      console.warn('[gpt-image-1] failed, falling back to Flux:', gptErr instanceof Error ? gptErr.message : gptErr);
      // Update record to indicate fallback
      await svc
        .from('image_generations')
        .update({ provider: 'replicate', model: 'flux-2-pro' } as never)
        .eq('id', imageId);
      // Continue to Flux block below
    }
  }
  
  // ═══ FLUX PATH (default fallback) ═══
  try {
    const selectedModel = (body as any).imageModel ?? 'flux-2-pro';
    const result = await generateWithFlux({
      prompt: fullPrompt,
      aspectRatio: body.aspectRatio,
      model: selectedModel,
      seed: body.seed,
    });

    const storagePaths: string[] = [];

    for (let i = 0; i < result.urls.length; i++) {
      const url = result.urls[i];
      try {
        const res = await fetch(url);
        if (!res.ok) continue;

        const buffer = Buffer.from(await res.arrayBuffer());
        const path = orgId + '/' + imageId + '-' + i + '.png';

        const { error: upErr } = await svc.storage
          .from('image-outputs')
          .upload(path, buffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: true,
          });

        if (!upErr) storagePaths.push(path);
      } catch {
        // continue with remote URL only
      }
    }

    const baseCost = hasReferences ? 0.06 : 0.03;
    const costUsd = baseCost * result.urls.length;

    await svc
      .from('image_generations')
      .update({
        status: 'complete',
        output_urls: result.urls,
        output_storage_paths: storagePaths,
        seed: result.seed,
        latency_ms: result.latencyMs,
        cost_usd: costUsd,
      } as never)
      .eq('id', imageId);

    await svc.rpc('increment_usage', {
      p_org_id: orgId,
      p_kind: 'image_generation',
      p_quantity: 1,
      p_cost: costUsd,
    });

    return NextResponse.json({
      id: imageId,
      urls: result.urls,
      storagePaths,
      seed: result.seed,
      enhancedPrompt: enhanced,
      latencyMs: result.latencyMs,
      costUsd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';

    await svc
      .from('image_generations')
      .update({ status: 'failed', error_message: message } as never)
      .eq('id', imageId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
