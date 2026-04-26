/**
 * Campaign Types registry & smart selector.
 *
 * A CampaignType is the MODE of the campaign — what the user is trying
 * to accomplish (launch, sale, lead-gen, etc). It's orthogonal to the
 * vertical (industry).
 *
 * Brain combines: vertical + campaign-type + angle → specialized prompt.
 */

import 'server-only';
import type {
  CampaignType,
  CampaignTypeSlug,
  CampaignIntake,
} from '../types';
import { ProductLaunchType } from './product-launch';
import { FlashSaleType } from './flash-sale';
import { LeadGenerationType } from './lead-generation';
import { BrandAwarenessType } from './brand-awareness';
import { SeasonalType } from './seasonal';
import { SocialProofType } from './social-proof';
import { RetargetingType } from './retargeting';
import { WaitlistLaunchType } from './waitlist-launch';
import { WebinarEventType } from './webinar-event';

const REGISTRY: Record<CampaignTypeSlug, CampaignType> = {
  'product-launch': ProductLaunchType,
  'flash-sale': FlashSaleType,
  'lead-generation': LeadGenerationType,
  'brand-awareness': BrandAwarenessType,
  'seasonal': SeasonalType,
  'social-proof': SocialProofType,
  'retargeting': RetargetingType,
  'waitlist-launch': WaitlistLaunchType,
  'webinar-event': WebinarEventType,
};

export function getCampaignType(slug: CampaignTypeSlug): CampaignType {
  return REGISTRY[slug];
}

export function getAllCampaignTypes(): CampaignType[] {
  return Object.values(REGISTRY);
}

/**
 * Smart selector: analyze intake + pick best campaign type.
 *
 * Rules:
 *   1. If user explicitly chose → use that
 *   2. Else, scan goal + offer + audience for signals
 *   3. Default fallback: brand-awareness (safest)
 */
export function selectCampaignType(intake: CampaignIntake): {
  type: CampaignType;
  confidence: number;
  reasoning: string;
} {
  // 1. Explicit user choice
  if (intake.campaignType && REGISTRY[intake.campaignType]) {
    return {
      type: REGISTRY[intake.campaignType],
      confidence: 1.0,
      reasoning: 'User explicitly selected this campaign type',
    };
  }

  // 2. Combine intake signals
  const haystack = [
    intake.goalDescription,
    intake.offer ?? '',
    intake.callToAction ?? '',
    intake.campaignName,
  ]
    .join(' ')
    .toLowerCase();

  // Signal patterns (ordered by specificity — first match wins)
  const patterns: Array<{ slug: CampaignTypeSlug; signals: string[]; confidence: number }> = [
    {
      slug: 'flash-sale',
      signals: ['descuento', 'discount', 'off', 'oferta', 'sale', 'rebaja', '%', 'flash', 'limited time'],
      confidence: 0.9,
    },
    {
      slug: 'waitlist-launch',
      signals: ['waitlist', 'lista de espera', 'private beta', 'beta cerrada', 'pre-launch', 'pre-lanzamiento', 'sign up early'],
      confidence: 0.9,
    },
    {
      slug: 'product-launch',
      signals: ['launch', 'lanzar', 'lanzamiento', 'new product', 'nuevo producto', 'now live', 'introducing', 'presentamos'],
      confidence: 0.85,
    },
    {
      slug: 'webinar-event',
      signals: ['webinar', 'evento', 'event', 'masterclass', 'workshop', 'live', 'en vivo', 'register'],
      confidence: 0.85,
    },
    {
      slug: 'lead-generation',
      signals: ['lead', 'leads', 'demo', 'consulta', 'free call', 'discovery call', 'book a call', 'agendar', 'capturar emails'],
      confidence: 0.85,
    },
    {
      slug: 'seasonal',
      signals: ['black friday', 'navidad', 'christmas', 'holiday', 'cyber monday', 'verano', 'summer', 'spring', 'temporada'],
      confidence: 0.85,
    },
    {
      slug: 'social-proof',
      signals: ['testimonios', 'testimonials', 'reviews', 'case study', 'casos de exito', 'clientes felices'],
      confidence: 0.8,
    },
    {
      slug: 'retargeting',
      signals: ['retargeting', 'remarketing', 'carrito abandonado', 'abandoned cart', 'come back', 'regresa'],
      confidence: 0.8,
    },
  ];

  for (const pattern of patterns) {
    if (pattern.signals.some((s) => haystack.includes(s))) {
      return {
        type: REGISTRY[pattern.slug],
        confidence: pattern.confidence,
        reasoning: `Detected "${REGISTRY[pattern.slug].displayName}" from intake signals`,
      };
    }
  }

  // 3. Default fallback
  return {
    type: REGISTRY['brand-awareness'],
    confidence: 0.4,
    reasoning: 'No specific campaign type signal — defaulting to brand awareness',
  };
}
