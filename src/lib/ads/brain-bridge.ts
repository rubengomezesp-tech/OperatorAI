/**
 * 🧠 BRAIN BRIDGE — Sistema Nervioso Central de OperatorAI
 * 
 * Conecta TODOS los módulos existentes con sus firmas REALES:
 *   brain.ts → premium-prompt-builder.ts → vision-critic.ts
 *   vertical-knowledge.ts → creative-randomizer.ts → campaign-types/
 * 
 * NO modifica ningún archivo existente. Solo importa y orquesta.
 * 
 * @author OperatorAI + DeepSeek Co-CEO
 * @version 2.0.0 — Obra Maestra con tipos reales
 */

import 'server-only';
import type {
  CreativePlan,
  VariantSpec,
  AspectRatio,
  StageLog,
  VariantResult,
  BrandContext,
  CreateAdInput,
} from './types';
import { parseAspectRatios, priorityOrder } from './aspect-ratio';
import { createJob, updateJob, getJob } from './job-manager';
import { selectArchetype } from './layout-randomizer';
import type { LayoutArchetype } from './layout-archetypes';

// ═══ RE-EXPORT ═══
export { parseAspectRatios, normalizeAspectRatio } from './aspect-ratio';
export { createJob, updateJob, getJob } from './job-manager';
export type { CreativePlan, AspectRatio, VariantSpec, BrandContext, StageLog, VariantResult, CreateAdInput };

// ═══ TIPOS IMPORTADOS DE MÓDULOS EXISTENTES ═══
import type { CampaignIntake, BrainOutput, VariantBrief } from '@/features/campaign-brain/types';
import type { VerticalSlug, CampaignTypeSlug } from '@/features/campaign-brain/types';
import type { PremiumPromptInput, PremiumPromptResult, BrandKitForPrompt } from '@/features/campaign-brain/server/premium-prompt-builder';
import type { VisionCriticInput, VisionCritique } from '@/features/campaign-brain/server/vision-critic';
import type { VerticalDNA } from '@/features/campaign-brain/server/vertical-knowledge';

// Valores por defecto alineados con los tipos reales
const DEFAULT_VERTICAL: VerticalSlug = 'tech-saas-app';
const DEFAULT_CAMPAIGN_TYPE: CampaignTypeSlug = 'brand-awareness';

// ═══ MAPEO DE VERTICALES (creative-randomizer → campaign-brain) ═══
const VERTICAL_MAP: Record<string, VerticalSlug> = {
  'saas': 'tech-saas-app',
  'saas-b2b': 'tech-saas-app',
  'saas-consumer': 'tech-saas-app',
  'fashion': 'fashion-apparel',
  'fashion-streetwear': 'fashion-apparel',
  'fashion-luxury': 'jewelry-luxury',
  'fitness': 'fitness-wellness',
  'fitness-apparel': 'fitness-wellness',
  'fitness-app': 'fitness-wellness',
  'beauty': 'beauty-cosmetics',
  'food': 'food-beverage',
  'food-restaurant': 'food-beverage',
  'food-cpg': 'food-beverage',
  'ecommerce': 'ecommerce-physical',
  'ecommerce-product': 'ecommerce-physical',
  'coaching': 'services-coaching',
  'coaching-personal': 'services-coaching',
  'coaching-business': 'services-coaching',
  'finance': 'finance-fintech',
  'crypto': 'finance-fintech',
  'real-estate': 'real-estate',
  'health': 'health-medical',
  'education': 'education-online',
  'tech': 'tech-saas-app',
  'tech-hardware': 'tech-saas-app',
  'tech-app': 'tech-saas-app',
  'agency': 'services-coaching',
  'agency-creative': 'services-coaching',
  'luxury-goods': 'jewelry-luxury',
  'generic': 'other',
  'other': 'other',
};

function mapToVerticalSlug(crVertical: string): VerticalSlug {
  return VERTICAL_MAP[crVertical] || DEFAULT_VERTICAL;
}

// ═══ MAPEO DE CAMPAIGN TYPES ═══
const CAMPAIGN_TYPE_MAP: Record<string, CampaignTypeSlug> = {
  'brand-awareness': 'brand-awareness',
  'awareness': 'brand-awareness',
  'product-launch': 'product-launch',
  'launch': 'product-launch',
  'flash-sale': 'flash-sale',
  'flash': 'flash-sale',
  'sale': 'flash-sale',
  'lead-generation': 'lead-generation',
  'lead': 'lead-generation',
  'seasonal': 'seasonal',
  'temporada': 'seasonal',
  'social-proof': 'social-proof',
  'testimonio': 'social-proof',
  'retargeting': 'retargeting',
  'retarget': 'retargeting',
  'waitlist-launch': 'waitlist-launch',
  'waitlist': 'waitlist-launch',
  'webinar-event': 'webinar-event',
  'webinar': 'webinar-event',
  'evento': 'webinar-event',
};

function mapToCampaignTypeSlug(type: string): CampaignTypeSlug {
  return CAMPAIGN_TYPE_MAP[type] || DEFAULT_CAMPAIGN_TYPE;
}

// ═══ 1. GENERAR CREATIVE PLAN (orquestador central) ═══

export async function generateCreativePlan(input: CreateAdInput): Promise<CreativePlan> {
  const startTime = Date.now();
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  console.log('[brain-bridge] 🧠 generating creative plan', {
    planId,
    userPrompt: input.userPrompt.slice(0, 80),
  });

  // Step 1: Detectar vertical usando creative-randomizer (su propio tipo Vertical)
  let crVertical = 'generic';
  let verticalSlug: VerticalSlug = DEFAULT_VERTICAL;
  try {
    const { detectVertical } = await import('@/lib/ads/creative-randomizer');
    crVertical = detectVertical(input.userPrompt, input.brandContext?.description);
    verticalSlug = mapToVerticalSlug(crVertical);
  } catch (e) {
    console.warn('[brain-bridge] detectVertical failed, using default');
  }

  // Step 2: Detectar campaign type
  let campaignTypeSlug: CampaignTypeSlug = DEFAULT_CAMPAIGN_TYPE;
  try {
    const { selectCampaignType } = await import('@/features/campaign-brain/campaign-types/_base');
    const intake: Partial<CampaignIntake> = {
      productName: input.brandContext?.brand_name || 'Product',
      productDescription: input.brandContext?.description || input.userPrompt,
      goalDescription: input.campaignGoal || input.userPrompt,
      audienceDescription: input.targetAudience || 'General audience',
      campaignName: input.userPrompt.slice(0, 50),
      vertical: verticalSlug,
    };
    const result = selectCampaignType(intake as CampaignIntake);
    campaignTypeSlug = result.type.id as CampaignTypeSlug;
    console.log('[brain-bridge] campaign type detected:', campaignTypeSlug);
  } catch (e) {
    console.warn('[brain-bridge] selectCampaignType failed, using default');
  }

  // ═══ STEP 2.5: SELECT LAYOUT ARCHETYPE (Sprint 2 — variedad estructural) ═══
  let selectedArchetype: LayoutArchetype | null = null;
  try {
    const orgId = (input.brandContext?.brand_name || 'default') as string;
    const result = selectArchetype({
      vertical: verticalSlug,
      campaignType: campaignTypeSlug,
      orgId,
      userPromptText: input.userPrompt,  // ← Sprint 3: detección de exploration intent
      hasMultipleImages: (input.images?.length ?? 0) >= 2,  // ← Sprint 3: detección SaaS launch
    });
    selectedArchetype = result.archetype;
    console.log('[brain-bridge] 🎨 archetype selected:', result.archetype.id, '|', result.reason);
  } catch (e) {
    console.warn('[brain-bridge] archetype selection failed:', e);
  }

  // Step 3: Cargar DNA vertical desde vertical-knowledge
  let verticalDNA: VerticalDNA | null = null;
  let verticalCue = '';
  try {
    const { getVerticalDNA, buildVerticalCue } = await import('@/features/campaign-brain/server/vertical-knowledge');
    verticalDNA = getVerticalDNA(verticalSlug);
    verticalCue = buildVerticalCue(verticalSlug);
    console.log('[brain-bridge] vertical DNA loaded:', verticalSlug);
  } catch (e) {
    console.warn('[brain-bridge] vertical-knowledge failed');
  }

  // Step 4: Generar dirección creativa desde DNA Cards
  let directionBlock = '';
  let creativePreset = '';
  let emotionalAngle = 'aspiration';
  let framework = 'direct-offer';
  let composition = 'hero centered, ample negative space';
  try {
    const { generateCreativeDirection, detectIntentHints, buildDirectionBlock } = await import('@/lib/ads/creative-randomizer');
    const hints = detectIntentHints(input.userPrompt);
    const direction = generateCreativeDirection([], hints, crVertical as any);
    directionBlock = buildDirectionBlock(direction);
    creativePreset = direction.preset || '';
    emotionalAngle = direction.emotionalAngle || 'aspiration';
    framework = direction.framework || 'direct-offer';
    composition = direction.composition || composition;
    console.log('[brain-bridge] creative direction generated:', direction.seedNote);
  } catch (e) {
    console.warn('[brain-bridge] creative-randomizer failed');
  }

  // Step 5: Ejecutar Campaign Brain (el cerebro pesado con Claude)
  let brainOutput: BrainOutput | null = null;
  try {
    const { runCampaignBrain } = await import('@/features/campaign-brain/core/brain');
    const intake: Partial<CampaignIntake> = {
      productName: input.brandContext?.brand_name || 'Product',
      productDescription: input.brandContext?.description || input.userPrompt,
      goalDescription: input.campaignGoal || input.userPrompt,
      audienceDescription: input.targetAudience || 'General audience',
      campaignName: input.userPrompt.slice(0, 50),
      vertical: verticalSlug,
      campaignType: campaignTypeSlug,
      brandName: input.brandContext?.brand_name,
    };
    brainOutput = await runCampaignBrain(intake);
    console.log('[brain-bridge] campaign brain executed:', brainOutput.detectedVertical);
  } catch (e) {
    console.warn('[brain-bridge] runCampaignBrain failed, using fallback');
  }

  // Step 6: Construir visual style combinando todas las fuentes
  const visualStyle: CreativePlan['visualStyle'] = {
    mood: emotionalAngle || 'premium cinematic modern',
    colors: input.brandContext?.vibe?.includes('gold') || creativePreset?.includes('luxury')
      ? ['#0A0A0B', '#C9A863', '#FFFFFF']
      : ['#0A0A0C', '#FFFFFF', '#1A1A1A'],
    lighting: verticalDNA?.lighting || 'soft cinematic glow, high contrast',
    composition,
    typographyDirection: 'bold sans-serif, clean hierarchy, premium feel',
    preset: creativePreset,
  };

  // Step 7: Construir promptBase con la mejor info disponible
  let promptBase = directionBlock;
  if (brainOutput?.reasoning && !promptBase) {
    promptBase = `Campaign for ${input.brandContext?.brand_name || 'brand'}.\n${brainOutput.reasoning}`;
  }
  if (!promptBase) {
    promptBase = `Premium campaign for ${input.brandContext?.brand_name || 'brand'}.\n${verticalCue}`;
  }

  // Step 8: Crear variantes por aspect ratio
  const requestedRatios = input.aspectRatios && input.aspectRatios.length > 0
    ? priorityOrder(input.aspectRatios)
    : priorityOrder(['9:16', '1:1', '4:5']);

  const variants: VariantSpec[] = requestedRatios.map((ratio, i) => ({
    id: `variant_${ratio.replace(':', '_')}_${i}`,
    aspectRatio: ratio,
    variantModifier: getVariantModifier(ratio),
    status: 'pending',
  }));

  const plan: CreativePlan = {
    creativePlanId: planId,
    campaignType: campaignTypeSlug as any,
    vertical: verticalSlug as any,
    concept: brainOutput?.diagnostic?.desire || `${input.brandContext?.brand_name || 'Brand'} campaign`,
    mainAngle: brainOutput?.selectedAngles?.primary || input.userPrompt.slice(0, 120),
    emotionalTrigger: emotionalAngle,
    framework,
    visualStyle,
    layout: {
      type: 'hero_ad',
      safeAreas: ['top', 'bottom'],
      elements: ['logo', 'headline area', 'cta area', 'product shot'],
    },
    promptBase,
    negativePrompt: 'blurry, low quality, watermark, text artifacts, fake logos, distorted faces, generic stock',
    variants,
    brandContext: input.brandContext,
    userImages: input.images,
    archetype: selectedArchetype ? {
      id: selectedArchetype.id,
      name: selectedArchetype.name,
      promptDirective: selectedArchetype.promptDirective,
      compositionRules: selectedArchetype.compositionRules,
      typographyCharacter: selectedArchetype.typographyCharacter,
      paletteDirective: selectedArchetype.paletteDirective,
      lightingDirective: selectedArchetype.lightingDirective,
      cameraDirective: selectedArchetype.cameraDirective,
      forbidPatterns: selectedArchetype.forbidPatterns,
    } : undefined,
    created_at: new Date().toISOString(),
  };

  console.log('[brain-bridge] ✅ creative plan created', {
    planId,
    vertical: verticalSlug,
    campaignType: campaignTypeSlug,
    preset: creativePreset,
    variants: variants.length,
    hasBrainOutput: !!brainOutput,
    durationMs: Date.now() - startTime,
  });

  return plan;
}

// ═══ 2. GENERAR IMAGEN DESDE PLAN ═══

export async function generateImageFromPlan(params: {
  plan: CreativePlan;
  variant: VariantSpec;
  logoUrl?: string;
  origin: string;
  cookieHeader: string;
}): Promise<VariantResult> {
  const startTime = Date.now();
  const { plan, variant, origin, cookieHeader } = params;
  
  console.log('[brain-bridge] 🎨 generating variant', {
    planId: plan.creativePlanId,
    variantId: variant.id,
    aspectRatio: variant.aspectRatio,
  });

  try {
    // Construir prompt final combinando todo el plan
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
      plan.brandContext?.description ? `DESCRIPTION: ${plan.brandContext.description}` : '',
    ].filter(Boolean).join('\n');

    const body: Record<string, unknown> = {
      prompt: finalPrompt,
      aspectRatio: variant.aspectRatio,
      model: 'gpt-image-2',
      enhance: false,
    };

    if (params.logoUrl) {
      body.referenceUrls = [params.logoUrl];
    }

    const res = await fetch(`${origin}/api/images/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: cookieHeader,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'unknown');
      throw new Error(`Image generation failed (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = await res.json() as { url?: string; urls?: string[] };
    const url = data.url || data.urls?.[0];

    if (!url) throw new Error('No image URL returned');

    return {
      variantId: variant.id,
      aspectRatio: variant.aspectRatio,
      status: 'completed',
      url,
      durationMs: Date.now() - startTime,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generation failed';
    console.error('[brain-bridge] ❌ variant failed', {
      planId: plan.creativePlanId,
      variantId: variant.id,
      error: msg,
    });
    return {
      variantId: variant.id,
      aspectRatio: variant.aspectRatio,
      status: 'failed',
      error: msg,
      durationMs: Date.now() - startTime,
    };
  }
}

// ═══ 3. AUDITAR IMAGEN CON VISION CRITIC ═══

export async function auditImage(
  imageUrl: string,
  variantBrief: VariantBrief,
  brainOutput: BrainOutput,
): Promise<VisionCritique | null> {
  try {
    const { critiqueImage } = await import('@/features/campaign-brain/server/vision-critic');
    const input: VisionCriticInput = {
      imageUrl,
      variantBrief,
      brainOutput,
    };
    return await critiqueImage(input);
  } catch (e) {
    console.warn('[brain-bridge] vision-critic audit failed:', e);
    return null;
  }
}

// ═══ 4. EJECUTAR PIPELINE COMPLETO ═══

export async function executeFullPipeline(input: CreateAdInput & {
  orgId: string;
  userId: string;
  origin: string;
  cookieHeader: string;
}): Promise<{ jobId: string; creativePlanId: string }> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  console.log('[brain-bridge] 🚀 pipeline started', { jobId });

  // Stage 1: Planning
  const plan = await generateCreativePlan(input);

  // Crear job
  await createJob({
    jobId,
    creativePlanId: plan.creativePlanId,
    orgId: input.orgId,
    userId: input.userId,
    creativePlan: plan,
  });

  // Stage 2: Generation
  const results = await Promise.allSettled(
    plan.variants.map(async (variant, i) => {
      await updateJob({
        jobId,
        currentStage: `generating_${variant.id}`,
        progress: Math.round((i / plan.variants.length) * 80),
      });

      const result = await generateImageFromPlan({
        plan,
        variant,
        logoUrl: input.logoUrl,
        origin: input.origin,
        cookieHeader: input.cookieHeader,
      });

      await updateJob({ jobId, result });
      return result;
    })
  );

  const variantResults = results.map(r =>
    r.status === 'fulfilled' ? r.value : { 
      variantId: 'unknown', aspectRatio: '1:1' as AspectRatio, 
      status: 'failed' as const, error: 'Promise rejected' 
    }
  );

  // Final update
  await updateJob({
    jobId,
    status: 'completed',
    progress: 100,
    currentStage: 'completed',
  });

  const completed = variantResults.filter(r => r.status === 'completed').length;
  const failed = variantResults.filter(r => r.status === 'failed').length;

  console.log('[brain-bridge] ✅ pipeline completed', {
    jobId,
    completed,
    failed,
  });

  return { jobId, creativePlanId: plan.creativePlanId };
}

// ═══ 5. RETRY INDIVIDUAL ═══

export async function retryVariant(params: {
  jobId: string;
  variantId: string;
  plan: CreativePlan;
  origin: string;
  cookieHeader: string;
  logoUrl?: string;
}): Promise<VariantResult> {
  const variant = params.plan.variants.find(v => v.id === params.variantId);
  if (!variant) throw new Error(`Variant ${params.variantId} not found`);

  const result = await generateImageFromPlan({
    plan: params.plan,
    variant,
    logoUrl: params.logoUrl,
    origin: params.origin,
    cookieHeader: params.cookieHeader,
  });

  result.retryCount = 1;
  return result;
}

// ═══ 6. EXPORTAR PLAN COMO PROMPT PREMIUM ═══

export async function exportAsPremiumPrompt(
  plan: CreativePlan,
  variant: VariantSpec,
  brandKit?: BrandKitForPrompt,
): Promise<PremiumPromptResult | null> {
  try {
    const { buildPremiumImagePrompt } = await import('@/features/campaign-brain/server/premium-prompt-builder');
    
    const variantBrief: VariantBrief = {
      id: variant.id,
      angle: plan.framework as any,
      platform: 'instagram_story' as any,
      aspectRatio: variant.aspectRatio as any,
      headline: plan.concept,
      cta: 'Learn more',
      backgroundPrompt: plan.promptBase,
      negativePrompt: plan.negativePrompt,
      reasoning: plan.mainAngle,
    };

    const brainOutput: BrainOutput = {
      detectedVertical: plan.vertical as VerticalSlug,
      detectedCampaignType: plan.campaignType as CampaignTypeSlug,
      confidence: 0.8,
      reasoning: plan.mainAngle,
      diagnostic: {
        pain: "",
        desire: plan.concept,
        objection: "",
        hiddenDesire: plan.emotionalTrigger,
      },
      audience: {
        primaryPersona: "",
        secondaryPersonas: [],
        triggers: [],
        barriers: [],
      },
      selectedAngles: {
        primary: plan.framework as any,
        alternatives: [],
        reasoning: plan.mainAngle,
      },
      visualDirection: {
        aesthetic: "editorial" as any,
        lighting: "dramatic-studio" as any,
        composition: "centered-symmetric" as any,
        moodDescription: plan.visualStyle.mood,
      },
      hooks: [],
      ctas: ["Learn more"],
      variantBriefs: [],
    };

    const input: PremiumPromptInput = {
      variantBrief,
      brainOutput,
      vertical: plan.vertical as VerticalSlug,
      brandKit,
    };

    return buildPremiumImagePrompt(input);
  } catch (e) {
    console.warn('[brain-bridge] exportAsPremiumPrompt failed:', e);
    return null;
  }
}

// ═══ HELPERS ═══

function getVariantModifier(ratio: AspectRatio): string {
  const modifiers: Record<AspectRatio, string> = {
    '9:16': 'vertical story ad, mobile-first, strong central composition, Instagram Story / TikTok format',
    '1:1': 'square feed post, balanced composition, Instagram Post / Facebook format',
    '4:5': 'vertical feed ad, premium product focus, Instagram Feed optimal format',
    '16:9': 'wide hero shot, cinematic composition, YouTube / Display / LinkedIn format',
    '3:2': 'classic photo ratio, editorial composition, versatile format for multiple platforms',
  };
  return modifiers[ratio] || modifiers['1:1'];
}
