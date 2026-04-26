/**
 * CAMPAIGN TYPE: Lead Generation
 *
 * Goal: Capture qualified contact information (email, phone, demo bookings).
 * Psychology: Free value exchange. Audience trades contact info for clear,
 *             specific value (asset, consultation, demo, free trial).
 */

import 'server-only';
import type { CampaignType } from '../types';

export const LeadGenerationType: CampaignType = {
  id: 'lead-generation',
  displayName: 'Lead Generation',
  description: 'Capture qualified leads (email, demo bookings, consultations)',
  icon: '🎯',

  psychology:
    'Value exchange psychology. Audience asks "what do I get and is it worth my email?" The offer must feel specific, valuable, and low-risk. "Free" works only when the value perception matches what they\'re giving up (their attention + contact).',

  recommendedAngles: [
    'authority',
    'desire',
    'pain-point',
    'curiosity',
    'social-proof',
  ],

  ctaPatterns: [
    'Get the guide',
    'Book your call',
    'Download free',
    'See a demo',
    'Get instant access',
    'Reserve your spot',
    'Agenda tu llamada',
    'Descarga gratis',
    'Solicita demo',
  ],

  copyEmphasis: [
    'specific-deliverable-the-user-gets',
    'time-to-consume-the-asset',
    'authority-credibility-of-creator',
    'quantified-results-or-outcome',
    'low-friction-language',
  ],

  visualModifiers: {
    intensifyMood: 'maintain',
    overlayElements: [
      'leave space for prominent CTA button',
      'composition implies "open door" or invitation',
    ],
  },
};
