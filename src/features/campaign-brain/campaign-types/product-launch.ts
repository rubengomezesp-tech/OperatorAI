/**
 * CAMPAIGN TYPE: Product Launch
 *
 * Goal: Announce a new product/service. Drive awareness + first sales/signups.
 * Psychology: Excitement, FOMO, "first to know", category-defining moment.
 */

import 'server-only';
import type { CampaignType } from '../types';

export const ProductLaunchType: CampaignType = {
  id: 'product-launch',
  displayName: 'Product Launch',
  description: 'Announce a new product or service to your audience',
  icon: '🚀',

  psychology:
    'Activates excitement and "first to know" status. Audience wants to feel they\'re early to something important. Tone is confident, decisive — "this is happening, you don\'t want to miss it."',

  recommendedAngles: [
    'desire',
    'authority',
    'curiosity',
    'social-proof',
    'viral',
  ],

  ctaPatterns: [
    'Get it now',
    'Be the first',
    'Try it today',
    'Start free',
    'Join the launch',
    'See it in action',
    'Pruébalo ahora',
    'Empieza gratis',
  ],

  copyEmphasis: [
    'introducing-language',
    'category-defining-claim',
    'transformation-promise',
    'specific-launch-date-or-timing',
    'first-100-or-early-access-positioning',
  ],

  visualModifiers: {
    intensifyMood: 'high',
    overlayElements: ['confident hero composition', 'sense of arrival'],
  },
};
