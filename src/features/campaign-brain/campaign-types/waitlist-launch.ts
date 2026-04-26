/**
 * CAMPAIGN TYPE: Waitlist / Pre-Launch
 *
 * Goal: Build anticipation and capture early-access signups before launch.
 * Psychology: Exclusivity + curiosity + "first to know" status.
 *
 * Critical for SaaS, AI products, fashion drops, course launches.
 */

import 'server-only';
import type { CampaignType } from '../types';

export const WaitlistLaunchType: CampaignType = {
  id: 'waitlist-launch',
  displayName: 'Waitlist / Pre-Launch',
  description: 'Build anticipation and capture early-access signups',
  icon: '⏳',

  psychology:
    'Pure exclusivity + curiosity. The product isn\'t available yet — that\'s the point. Audience signs up because they want to be early, want priority access, or are intrigued. Tease the product without revealing everything.',

  recommendedAngles: [
    'curiosity',
    'desire',
    'authority',
    'social-proof',
    'urgency',
  ],

  ctaPatterns: [
    'Join the waitlist',
    'Get early access',
    'Reserve your spot',
    'Be first',
    'Sign up early',
    'Únete a la lista',
    'Acceso anticipado',
    'Reserva tu lugar',
  ],

  copyEmphasis: [
    'invitation-language-not-sale',
    'specific-launch-window-or-soon-date',
    'priority-access-positioning',
    'limited-spots-if-applicable',
    'partial-product-reveal-curiosity',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'partial product reveal — tease without showing all',
      'sense of "coming soon" without being cliché',
      'considered minimalism that signals premium',
    ],
  },
};
