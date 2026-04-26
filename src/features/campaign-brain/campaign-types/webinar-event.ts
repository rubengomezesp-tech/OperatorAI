/**
 * CAMPAIGN TYPE: Webinar / Event
 *
 * Goal: Drive registrations for a live event (webinar, masterclass, workshop).
 * Psychology: Specific date + value + speaker authority + commitment momentum.
 */

import 'server-only';
import type { CampaignType } from '../types';

export const WebinarEventType: CampaignType = {
  id: 'webinar-event',
  displayName: 'Webinar / Event',
  description: 'Drive registrations for live events, masterclasses, workshops',
  icon: '📅',

  psychology:
    'Audience is committing time to be present at a specific moment. They need to feel: (a) the speaker is worth their time, (b) the topic solves a real problem, (c) attending live is better than waiting for replay.',

  recommendedAngles: [
    'authority',
    'curiosity',
    'desire',
    'urgency',
    'social-proof',
  ],

  ctaPatterns: [
    'Register now',
    'Save your seat',
    'Join us live',
    'Reserve free spot',
    'Regístrate gratis',
    'Aparta tu lugar',
    'Únete en vivo',
  ],

  copyEmphasis: [
    'specific-date-and-time-with-timezone',
    'speaker-authority-and-credibility',
    'specific-takeaways-attendees-will-leave-with',
    'live-only-bonus-or-Q-and-A',
    'free-or-priced-clearly',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'speaker portrait or event branding hero',
      'leave space for date/time overlay prominent',
      'feels like an invitation to a real event',
    ],
  },
};
