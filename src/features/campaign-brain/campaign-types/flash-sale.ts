/**
 * CAMPAIGN TYPE: Flash Sale
 *
 * Goal: Drive immediate purchases via a time-limited discount.
 * Psychology: Scarcity, urgency, "act now or lose it forever".
 */

import 'server-only';
import type { CampaignType } from '../types';

export const FlashSaleType: CampaignType = {
  id: 'flash-sale',
  displayName: 'Flash Sale',
  description: 'Time-limited discount to drive immediate purchases',
  icon: '⚡',

  psychology:
    'Pure scarcity + urgency. The discount itself is not the value — the deadline is. Audience must feel "this offer disappears soon and I will regret missing it." Loss aversion is the primary lever.',

  recommendedAngles: [
    'urgency',
    'conversion',
    'desire',
    'pain-point',
    'social-proof',
  ],

  ctaPatterns: [
    'Shop the sale',
    'Save now',
    'Claim your discount',
    'Ends tonight',
    'Last chance',
    '48 hours only',
    'Compra ahora',
    'Aprovecha la oferta',
    'Solo hoy',
  ],

  copyEmphasis: [
    'specific-discount-percentage-or-amount',
    'specific-deadline-with-countdown',
    'before-after-price-comparison',
    'limited-stock-or-spots',
    'social-proof-numbers-already-claimed',
  ],

  visualModifiers: {
    intensifyMood: 'high',
    overlayElements: [
      'bold contrast composition',
      'leave space for prominent discount overlay',
      'create sense of decisive action',
    ],
    restrictions: [
      'avoid imagery that feels too premium/luxury (mismatch with sale energy)',
      'avoid overly serene or contemplative compositions',
    ],
  },
};
