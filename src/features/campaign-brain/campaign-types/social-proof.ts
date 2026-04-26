/**
 * CAMPAIGN TYPE: Social Proof
 *
 * Goal: Convert undecided audiences via testimonials, reviews, case studies.
 * Psychology: "If others like me chose this and got results, I should too."
 */

import 'server-only';
import type { CampaignType } from '../types';

export const SocialProofType: CampaignType = {
  id: 'social-proof',
  displayName: 'Social Proof',
  description: 'Use testimonials, reviews, case studies to convert undecided',
  icon: '💬',

  psychology:
    'Trust transfer. The audience is on the fence — they need someone like them (peer, similar struggle, similar context) to validate the choice. Authenticity > polish. Real names, real numbers, real stories.',

  recommendedAngles: [
    'social-proof',
    'authority',
    'desire',
    'conversion',
    'pain-point',
  ],

  ctaPatterns: [
    'Read their story',
    'See the results',
    'Try it yourself',
    'Join them',
    'Únete a ellos',
    'Lee el caso completo',
  ],

  copyEmphasis: [
    'specific-customer-name-and-context',
    'specific-numbers-and-results',
    'before-and-after-of-the-customer',
    'quotation-marks-or-direct-testimony',
    'similar-audience-positioning',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'real customer aesthetic — not stock photo',
      'leave space for testimonial quote overlay',
      'authentic context (their workspace, their environment)',
    ],
  },
};
