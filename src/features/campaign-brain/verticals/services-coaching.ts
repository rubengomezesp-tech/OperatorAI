/**
 * VERTICAL: Services & Coaching
 *
 * Domain expertise for service-based businesses, coaches, consultants,
 * agencies, freelancers, course creators, mentors, therapists, B2B
 * service providers.
 *
 * Distinct from tech-saas-app (no software product) and from
 * education-online (more 1:1 / high-touch).
 */

import 'server-only';
import type { Vertical, PromptContext } from '../types';

export const ServicesCoachingVertical: Vertical = {
  id: 'services-coaching',
  displayName: 'Services & Coaching',
  description: 'Coaches, consultants, agencies, freelancers, mentors, B2B services',
  icon: '🎯',

  matchKeywords: [
    // Spanish
    'coach', 'mentor', 'consultor', 'consultoria', 'asesor', 'asesoria',
    'servicio', 'servicios', 'agencia', 'freelance', 'freelancer',
    'curso', 'mentoria', 'sesion', 'masterclass', 'taller',
    'transformacion', 'cliente', 'clientes', 'b2b',
    'estrategia', 'estrategico', 'desarrollo personal',
    // English
    'coach', 'coaching', 'mentor', 'mentorship', 'consultant', 'consulting',
    'advisor', 'advisory', 'service', 'services', 'agency', 'agencies',
    'freelance', 'freelancer', 'consulting',
    'masterclass', 'workshop', 'session', 'cohort',
    'business coach', 'life coach', 'career coach', 'executive coach',
    'transformation', 'client', 'b2b', 'b2b service',
    'strategy', 'strategic', 'professional development',
    'therapy', 'therapist', 'counselor', 'counseling',
  ],

  matchSignals: {
    productCategories: [
      'coaching', 'consulting', 'agency service', 'freelance work',
      'mentorship', 'professional service',
    ],
    audiences: [
      'business owners', 'entrepreneurs', 'professionals', 'executives',
      'individuals', 'teams', 'companies',
    ],
    objectives: [
      'discovery call', 'free consultation', 'sales call',
      'lead capture', 'cohort enrollment',
    ],
  },

  visualCodes: {
    defaultAesthetic: 'documentary',
    references: [
      'Brené Brown speaker portraits',
      'Tony Robbins event photography',
      'Mel Robbins editorial portraits',
      'Vogue Business profile shots',
      'New York Times executive portraits',
      'Harvard Business Review imagery',
      'TED Talk speaker photography',
      'Inc. magazine founder shots',
    ],
    defaultLighting: 'soft-natural',
    defaultComposition: 'eye-level-portrait',
    moodKeywords: [
      'authoritative',
      'approachable',
      'expert',
      'transformative',
      'confident',
      'real',
      'trustworthy',
      'aspirational',
    ],
    colorTendencies:
      'warm professional palettes — earthy neutrals, deep blues for trust, single warm accent (terracotta, mustard) for human warmth, magazine-style portraiture lighting',
  },

  hookFrameworks: [
    {
      id: 'transformation-promise',
      name: 'Transformation Promise',
      template: '{audience} who {struggle} → {outcome} in {timeframe}.',
      example: 'Founders who can\'t close enterprise deals → 6-figure contracts in 90 days.',
      worksWithAngles: ['desire', 'authority'],
    },
    {
      id: 'authority-credibility',
      name: 'Authority Credibility',
      template: 'Helped {number} {audience} {result}. {invitation}.',
      example: 'Helped 84 SaaS founders raise their seed round. Now opening 5 spots.',
      worksWithAngles: ['authority', 'social-proof'],
    },
    {
      id: 'pain-of-stuck',
      name: 'Pain of Being Stuck',
      template: 'Stuck in {situation}? You don\'t need {what they think}. You need {real answer}.',
      example: 'Stuck at $20K/month? You don\'t need more leads. You need positioning.',
      worksWithAngles: ['pain-point', 'authority'],
    },
    {
      id: 'method-name',
      name: 'Named Method',
      template: 'The {method name}: {what it does}, in {time}.',
      example: 'The Quiet Authority Method: turn your expertise into inbound leads, in 60 days.',
      worksWithAngles: ['authority', 'curiosity'],
    },
    {
      id: 'free-value',
      name: 'Free Value Hook',
      template: 'Free {asset}: {what they\'ll get}.',
      example: 'Free 30-min strategy call: walk away with 3 specific moves for your business.',
      worksWithAngles: ['conversion', 'desire'],
    },
    {
      id: 'cohort-scarcity',
      name: 'Cohort Scarcity',
      template: '{number} spots. {date}. {entry barrier or qualification}.',
      example: '12 founders. Starts February 3rd. Application required.',
      worksWithAngles: ['urgency', 'authority'],
    },
    {
      id: 'before-this-realized',
      name: 'Before/After Insight',
      template: 'Before working with me: {before}. After: {after}.',
      example: 'Before: chaotic launches that flopped. After: campaigns that pre-sell themselves.',
      worksWithAngles: ['social-proof', 'desire'],
    },
  ],

  audienceTriggers: {
    'business-coaches': ['scale', 'systems', 'leverage', 'sustainable growth'],
    'life-coaches': ['transformation', 'break through', 'unstuck', 'aligned'],
    'executives': ['high-stakes', 'discreet', 'next-level', 'inflection point'],
    'creators': ['monetize expertise', 'audience', 'positioning', 'voice'],
    'agencies': ['margins', 'systemize', 'team', 'recurring revenue'],
    'b2b-services': ['enterprise', 'qualified leads', 'long sales cycle', 'positioning'],
    'therapists': ['safe', 'confidential', 'evidence-based', 'real change'],
  },

  restrictions: [
    'no fake "professional" stock imagery (suit + handshake clichés)',
    'no over-styled portraits that feel inauthentic',
    'avoid generic "thoughtful pose" coach shots',
    'no broken anatomy in posed portraits',
    'no exaggerated AI eyes or unnatural expressions',
    'avoid "cheesy success" imagery (champagne, sports cars, mansions)',
  ],

  extraNegativePrompt:
    'cliché stock business photo, suit handshake cheese, fake success imagery, AI-typical eyes, plastic skin, broken portrait anatomy',

  generateBackgroundPrompt(context: PromptContext): string {
    const { productName, productDescription, angle, campaignType, platform, audience, brandTone } = context;

    const platformHint = platform.includes('story') || platform.includes('reel') || platform.includes('tiktok')
      ? 'vertical 9:16 portrait format, person centered with breathing room'
      : platform === 'linkedin'
        ? 'professional landscape framing, B2B credibility'
        : 'magazine-style portrait composition';

    const aestheticHint = (() => {
      switch (angle) {
        case 'authority':
          return 'editorial portrait of expert/coach in their element, professional but warm, soft natural window light, considered styling, gravitas without stiffness';
        case 'desire':
          return 'aspirational lifestyle of transformation, calm confidence visible, "this is what success looks like for me" energy';
        case 'pain-point':
          return 'documentary-style image evoking the struggle (laptop late at night, cluttered desk, frustrated moment), turning toward resolution';
        case 'social-proof':
          return 'real client testimonial moment, two people in conversation, breakthrough captured, authentic warmth';
        case 'curiosity':
          return 'mysterious method tease, partial reveal of approach, creates "I want to know more" feeling';
        case 'urgency':
          return 'cohort/event aesthetic — calendar context, sense of upcoming, decisive moment';
        case 'conversion':
          return 'invitation feel — coach extending an offer, warm and inviting, clear value proposition implied';
        case 'luxury':
          return 'high-end advisory aesthetic, premium materials, executive portrait, considered minimalism';
        case 'viral':
          return 'attention-grabbing teaching moment, dynamic gesture, "wait this is interesting" energy';
        default:
          return 'editorial portrait, soft natural light, expert in their environment, professional but human';
      }
    })();

    const campaignHint = (() => {
      if (campaignType === 'lead-generation') {
        return 'invitation aesthetic — opens a door to working together, free value implied';
      }
      if (campaignType === 'webinar-event') {
        return 'event-promotion energy, professional speaker context';
      }
      if (campaignType === 'waitlist-launch' || campaignType === 'product-launch') {
        return 'cohort or program launch — beginning of a journey energy';
      }
      return '';
    })();

    return [
      aestheticHint,
      `Service/coaching: ${productName}. ${productDescription}.`,
      campaignHint,
      audience ? `Audience: ${audience} — they should see themselves in this image.` : '',
      brandTone ? `Brand tone: ${brandTone}.` : '',
      platformHint,
      'Real human warmth — not stiff corporate styling.',
      'Professional but approachable — gravitas without coldness.',
      'Soft natural light from window OR controlled studio.',
      'Composition leaves space for text overlay (no text in image).',
      'If portrait: eye contact OR slight off-camera gaze, never frozen.',
      'Color grading: warm editorial — Kodak Gold 200 or Portra 400 feel.',
      'Shot on Sony A7R IV, 85mm portrait, f/2.0, ISO 400.',
    ]
      .filter(Boolean)
      .join(' ');
  },
};
