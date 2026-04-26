/**
 * CAMPAIGN TYPE: Brand Awareness
 *
 * Goal: Build recognition + emotional connection without immediate sale ask.
 * Psychology: Storytelling, identity-association, "this is who we are and
 *             who you are when you choose us."
 */

import 'server-only';
import type { CampaignType } from '../types';

export const BrandAwarenessType: CampaignType = {
  id: 'brand-awareness',
  displayName: 'Brand Awareness',
  description: 'Build recognition and emotional connection with audience',
  icon: '✨',

  psychology:
    'Pure brand-building. No hard ask. The audience should feel the brand\'s personality, values, point of view. Goal is memory + future preference, not click-now. Patience over pressure.',

  recommendedAngles: [
    'desire',
    'authority',
    'luxury',
    'social-proof',
    'curiosity',
  ],

  ctaPatterns: [
    'Discover',
    'Explore',
    'Follow along',
    'See more',
    'Conoce más',
    'Descubre',
    'Síguenos',
  ],

  copyEmphasis: [
    'brand-philosophy-language',
    'distinctive-point-of-view',
    'aesthetic-over-conversion',
    'identity-association',
    'memorable-tagline',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'aesthetic excellence over conversion optimization',
      'editorial composition',
      'signature visual identity moments',
    ],
  },
};
