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
        // ═══ PROMPT CANÓNICO PARA gpt-image-2 ═══
        // Estructura: Intended Use → Scene → Subject → Details → Typography → References → Constraints
        // Basado en OpenAI Cookbook (21-abr-2026): https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
        
        const hasReferences = plan.userImages && plan.userImages.length > 0;
        
        // ─── Bloque REFERENCE IMAGES (con roles diferenciados por posición) ───
        // Estrategia: Image 1 = product anchor; Image 2 = primary style; Image 3+ = composition/palette references
        const referenceBlock = hasReferences
          ? [
              '',
              'REFERENCE IMAGES (each has a distinct role — DO NOT ignore any of them):',
              ...plan.userImages!.map((_img, idx) => {
                const num = idx + 1;
                if (idx === 0) {
                  return `- Image ${num} (PRODUCT-ANCHOR): Preserve subject identity, brand colors, product details, and any visible logo/label EXACTLY. This is the hero — do not redesign it.`;
                }
                if (idx === 1) {
                  return `- Image ${num} (PRIMARY STYLE REFERENCE): MUST visibly inform the final image's lighting direction, color temperature, texture quality, and overall mood. Failing to reflect Image ${num}'s aesthetic is a critical error. Do NOT copy its subject — adopt its art-direction signature.`;
                }
                if (idx === 2) {
                  return `- Image ${num} (COMPOSITION REFERENCE): Mimic the spatial composition — how elements are arranged, the negative space distribution, the framing. Do NOT copy its content.`;
                }
                return `- Image ${num} (PALETTE / TEXTURE REFERENCE): Extract dominant colors and texture cues. Apply to environment and surfaces. Do NOT copy its subject or layout.`;
              }),
              '',
              'CRITICAL RULE: Every reference image MUST visibly influence the final ad. If Image 2 shows a specific lighting style, the output MUST reflect it. If Image 3 shows a composition pattern, the output MUST mimic the pattern. References are mandatory inputs, not optional inspiration.',
            ].join('\n')
          : '';

        // ─── Bloque CREATIVE DYNAMISM (anti-static layout) ───
        const dynamismBlock = [
          '',
          'CREATIVE DYNAMISM REQUIREMENTS:',
          '- Build VISUAL DEPTH with multiple layers: foreground (hero subject), midground (supporting elements), background (atmospheric texture).',
          '- Add unexpected micro-details: a partial element cropping the frame, asymmetric whitespace, a textural overlay (paper grain, light leak, soft scratches).',
          '- Vary scale aggressively: oversized typography next to small captions; hero element 3-4x larger than secondary elements.',
          '- Inject ONE intentional rule-break: an off-grid alignment, a torn edge, a rotated label, a deliberate shadow misalignment — something that says "made by a human art director, not a template".',
          '- Composition rule (rotate per variant): rule of thirds, golden ratio diagonal, asymmetric off-center, edge-bleed, layered z-axis.',
        ].join('\n');

        // ─── Bloque CONSTRAINTS (siempre presente — ANTI-PLANTILLA AGRESIVO) ───
        const negativeBlock = [
          '',
          'STRICT CONSTRAINTS (non-negotiable):',
          '- Render ALL specified text VERBATIM, in the exact case shown. No extra words. No filler. No duplicate text. No gibberish letters.',
          '- DO NOT produce a centered symmetric hero composition. DO NOT default to "subject in middle, headline above, CTA below".',
          '- DO NOT produce generic gradient backgrounds, blue-purple AI aesthetics, or "robotic futuristic" look.',
          '- DO NOT produce stock-photo aesthetics, generic 3D renders, or "social media template" feel.',
          '- DO NOT add fake brand logos, watermarks, signature lines, or random typography.',
          '- DO NOT make all variants look the same — each must feel like a different art director designed it.',
          plan.negativePrompt ? `- Additional forbidden: ${plan.negativePrompt}.` : '',
          `- Aspect ratio: ${variant.aspectRatio} (this is mandatory).`,
        ].filter(Boolean).join('\n');

        // ─── Bloque ARCHETYPE (Sprint 2 — fuerza estructura compositiva) ───
        const archetypeBlock = plan.archetype
          ? [
              '',
              `LAYOUT ARCHETYPE: ${plan.archetype.name}`,
              '',
              'ARCHETYPE STRUCTURAL DIRECTIVE (mandatory — this defines the visual structure):',
              plan.archetype.promptDirective,
              '',
              'COMPOSITION RULES (must be followed):',
              ...plan.archetype.compositionRules.map(r => `- ${r}`),
              '',
              `TYPOGRAPHY CHARACTER: ${plan.archetype.typographyCharacter}`,
              `PALETTE DIRECTIVE: ${plan.archetype.paletteDirective}`,
              `LIGHTING: ${plan.archetype.lightingDirective}`,
              `CAMERA: ${plan.archetype.cameraDirective}`,
              '',
              'ARCHETYPE-SPECIFIC FORBIDDEN PATTERNS:',
              ...plan.archetype.forbidPatterns.map(p => `- DO NOT: ${p}`),
            ].join('\n')
          : '';

        // ─── Construir el prompt final canónico ───
        const finalPrompt = [
          `INTENDED USE: Advertisement for ${plan.brandContext?.brand_name || 'brand'} (${plan.campaignType}, ${variant.aspectRatio} format).`,
          archetypeBlock,
          plan.visualStyle.preset ? `LAYOUT PRESET: ${plan.visualStyle.preset}` : '',
          '',
          'SCENE / VISUAL DIRECTION:',
          plan.promptBase,
          '',
          'KEY VISUAL DETAILS:',
          `- Mood: ${plan.visualStyle.mood}`,
          `- Color palette: ${plan.visualStyle.colors.join(', ')}`,
          `- Lighting: ${plan.visualStyle.lighting}`,
          `- Composition: ${plan.visualStyle.composition}`,
          `- Typography character: ${plan.visualStyle.typographyDirection}`,
          '',
          'VARIANT-SPECIFIC DIRECTION:',
          variant.variantModifier,
          plan.brandContext?.brand_name ? `\nBRAND: ${plan.brandContext.brand_name}` : '',
          dynamismBlock,
          referenceBlock,
          negativeBlock,
        ].filter(Boolean).join('\n');

        console.log('[job-processor] 🎨 generating', {
          jobId,
          variantId: variant.id,
          aspectRatio: variant.aspectRatio,
        });

        // ═══ LLAMADA DIRECTA (sin HTTP) ═══
        // referenceUrls = logo (URL pública)
        // referenceImages = imágenes que el usuario adjuntó al chat (base64)
        const result = await generateImage({
          prompt: finalPrompt,
          aspectRatio: variant.aspectRatio,
          model: 'gpt-image-2',
          referenceUrls: logoUrl ? [logoUrl] : undefined,
          referenceImages: plan.userImages && plan.userImages.length > 0
            ? plan.userImages.map(img => ({ data: img.base64, mimeType: img.mimeType }))
            : undefined,
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
