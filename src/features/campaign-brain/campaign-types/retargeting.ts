/**
 * CAMPAIGN TYPE: Retargeting
 *
 * Goal: Re-engage warm audience (cart abandoners, site visitors, past clicks).
 * Psychology: Reminder + objection handling + small nudge to convert.
 */

import 'server-only';
import type { CampaignType } from '../types';

export const RetargetingType: CampaignType = {
  id: 'retargeting',
  displayName: 'Retargeting',
  description: 'Re-engage warm audience — cart abandoners, past visitors',
  icon: '🔄',

  psychology:
    'Warm audience already knows you — you don\'t need to introduce yourself. Address the specific objection that made them hesitate. Small nudge (free shipping, 10% off, time-limit) often does it.',

  recommendedAngles: [
    'urgency',
    'pain-point',
    'social-proof',
    'conversion',
    'desire',
  ],

  ctaPatterns: [
    'Complete your order',
    'Come back',
    'Still thinking?',
    'Use code WELCOME10',
    'Termina tu compra',
    'Vuelve y completa',
    'Sigue ahí',
  ],

  copyEmphasis: [
    'reminder-language',
    'address-the-likely-objection',
    'small-nudge-discount-or-bonus',
    'social-proof-since-they-left',
    'low-pressure-friendly-tone',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'product they already showed interest in, hero shot',
      'feels like a friendly reminder, not pushy',
    ],
  },
};
