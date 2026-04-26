/**
 * CAMPAIGN TYPE: Seasonal
 *
 * Goal: Capitalize on seasonal moments (Black Friday, Holidays, Summer drops).
 * Psychology: Cultural moment alignment + seasonal urgency.
 */

import 'server-only';
import type { CampaignType } from '../types';

export const SeasonalType: CampaignType = {
  id: 'seasonal',
  displayName: 'Seasonal Campaign',
  description: 'Black Friday, holidays, summer launches — moment-driven marketing',
  icon: '🎁',

  psychology:
    'Audiences are already in a buying mindset during these moments — your job is to be visible and aligned with their seasonal context. Cultural relevance > clever copy. The season is the hook.',

  recommendedAngles: [
    'urgency',
    'desire',
    'social-proof',
    'conversion',
    'viral',
  ],

  ctaPatterns: [
    'Shop the sale',
    'Holiday gifts',
    'Black Friday only',
    'Summer drop',
    'Winter collection',
    'Compras navideñas',
    'Solo Black Friday',
  ],

  copyEmphasis: [
    'seasonal-context-and-mood',
    'gift-for-someone-or-treat-yourself',
    'specific-event-deadline',
    'seasonal-urgency-without-being-tacky',
  ],

  visualModifiers: {
    intensifyMood: 'high',
    overlayElements: [
      'visual cues of the season (lights, snow, sun, flowers, etc — depending on context)',
      'leave space for prominent date/discount overlay',
    ],
    restrictions: [
      'avoid clichéd seasonal imagery (santa hat on product, etc)',
      'no oversaturated holiday colors',
    ],
  },
};
