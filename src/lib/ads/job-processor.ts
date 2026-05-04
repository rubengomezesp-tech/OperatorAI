/**
 * ⚡ JOB PROCESSOR — Worker asíncrono con límite de concurrencia
 * 
 * Procesa variantes de un job sin bloquear la respuesta HTTP.
 * Máximo 2 generaciones simultáneas por job.
 * 
 * Usa image-generator.ts (función interna, sin HTTP).
 */

import 'server-only';
import { generateImage } from './image-generator';
import { updateJob } from './job-manager';
import { uploadToStorage } from './storage';
import type { CreativePlan, VariantSpec, VariantResult, StageLog } from './types';

// Semáforo simple: máximo 2 concurrencias
let activeGenerations = 0;
const MAX_CONCURRENT = 2;
const queue: Array<() => void> = [];

async function withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T> {
  while (activeGenerations >= MAX_CONCURRENT) {
    await new Promise<void>(resolve => {
      queue.push(resolve);
    });
  }
  
  activeGenerations++;
  try {
    return await fn();
  } finally {
    activeGenerations--;
    const next = queue.shift();
    if (next) next();
  }
}

// ═══ PROCESAR UN JOB COMPLETO ═══
export async function processJob(params: {
  jobId: string;
  plan: CreativePlan;
  orgId: string;
  userId: string;
  logoUrl?: string;
}): Promise<void> {
  const { jobId, plan, orgId, userId, logoUrl } = params;
  
  console.log('[job-processor] ⚡ starting job', {
    jobId,
    variants: plan.variants.length,
  });

  await updateJob({
    jobId,
    status: 'generating',
    currentStage: 'generating',
    progress: 0,
  });

  const results: VariantResult[] = [];

  // Procesar variantes con límite de concurrencia
  const promises = plan.variants.map(async (variant, i) => {
    return withConcurrencyLimit(async () => {
      const stageStart = Date.now();
      
      await updateJob({
        jobId,
        currentStage: `generating_${variant.id}`,
        progress: Math.round((i / plan.variants.length) * 80),
      });

      try {
        // Construir prompt final como en brain-bridge
        const finalPrompt = [
          plan.promptBase,
          '',
          'VISUAL STYLE:',
          `Mood: ${plan.visualStyle.mood}`,
          `Colors: ${plan.visualStyle.colors.join(', ')}`,
          `Lighting: ${plan.visualStyle.lighting}`,
          `Composition: ${plan.visualStyle.composition}`,
          `Typography: ${plan.visualStyle.typographyDirection}`,
          plan.visualStyle.preset ? `Preset: ${plan.visualStyle.preset}` : '',
          '',
          'VARIANT:',
          variant.variantModifier,
          '',
          plan.brandContext?.brand_name ? `BRAND: ${plan.brandContext.brand_name}` : '',
        ].filter(Boolean).join('\n');

        console.log('[job-processor] 🎨 generating', {
          jobId,
          variantId: variant.id,
          aspectRatio: variant.aspectRatio,
        });

        // ═══ LLAMADA DIRECTA (sin HTTP) ═══
        const result = await generateImage({
          prompt: finalPrompt,
          aspectRatio: variant.aspectRatio,
          model: 'gpt-image-2',
          referenceUrls: logoUrl ? [logoUrl] : undefined,
        });

        // Subir a Supabase Storage
        const fileName = `${jobId}/${variant.id}.png`;
        const storagePath = `${orgId}/${fileName}`;
        
        let publicUrl: string;
        try {
          publicUrl = await uploadToStorage({
            buffer: result.buffer,
            path: storagePath,
            contentType: 'image/png',
            orgId,
          });
        } catch (uploadErr) {
          console.error('[job-processor] upload failed:', uploadErr);
          return {
            variantId: variant.id,
            aspectRatio: variant.aspectRatio,
            status: 'failed' as const,
            error: `Upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown'}`,
            durationMs: Date.now() - stageStart,
          };
        }

        const variantResult: VariantResult = {
          variantId: variant.id,
          aspectRatio: variant.aspectRatio,
          status: 'completed',
          url: publicUrl,
          storagePath,
          durationMs: Date.now() - stageStart,
        };

        await updateJob({ jobId, result: variantResult });
        
        console.log('[job-processor] ✅ variant completed', {
          jobId,
          variantId: variant.id,
          durationMs: variantResult.durationMs,
        });

        return variantResult;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Generation failed';
        console.error('[job-processor] ❌ variant failed', {
          jobId,
          variantId: variant.id,
          error: msg,
        });

        const failedResult: VariantResult = {
          variantId: variant.id,
          aspectRatio: variant.aspectRatio,
          status: 'failed',
          error: msg,
          durationMs: Date.now() - stageStart,
        };

        await updateJob({ jobId, result: failedResult });
        return failedResult;
      }
    });
  });

  const settled = await Promise.allSettled(promises);
  
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(r.value);
    else results.push({
      variantId: 'unknown',
      aspectRatio: '1:1',
      status: 'failed',
      error: 'Promise rejected',
    });
  }

  // Final
  const completed = results.filter(r => r.status === 'completed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  await updateJob({
    jobId,
    status: completed > 0 ? 'completed' : 'failed',
    progress: 100,
    currentStage: 'completed',
  });

  console.log('[job-processor] 🏁 job finished', {
    jobId,
    completed,
    failed,
  });
}
