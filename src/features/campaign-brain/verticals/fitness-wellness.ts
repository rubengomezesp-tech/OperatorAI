/**
 * VERTICAL: Fitness & Wellness
 *
 * Domain expertise for gyms, personal trainers, yoga studios,
 * supplements, fitness apps, nutrition coaches, recovery brands.
 */

import 'server-only';
import type { Vertical, PromptContext } from '../types';

export const FitnessWellnessVertical: Vertical = {
  id: 'fitness-wellness',
  displayName: 'Fitness & Wellness',
  description: 'Gyms, trainers, yoga, supplements, fitness apps, nutrition',
  icon: '💪',

  matchKeywords: [
    // Spanish
    'gimnasio', 'gym', 'fitness', 'entrenamiento', 'entrenador', 'pesas',
    'cardio', 'crossfit', 'yoga', 'pilates', 'running', 'correr',
    'nutricion', 'dieta', 'suplementos', 'proteina', 'creatina',
    'salud', 'bienestar', 'wellness', 'mindfulness', 'meditacion',
    'transformacion', 'perder peso', 'ganar musculo', 'tonificar',
    // English
    'gym', 'fitness', 'workout', 'training', 'trainer', 'coach',
    'weights', 'strength', 'cardio', 'crossfit', 'hiit', 'yoga',
    'pilates', 'running', 'marathon', 'cycling', 'spinning',
    'nutrition', 'diet', 'supplements', 'protein', 'creatine', 'whey',
    'health', 'wellness', 'mindfulness', 'meditation', 'recovery',
    'transformation', 'fat loss', 'muscle gain', 'lean', 'shredded',
    'mobility', 'stretching', 'biohacking', 'longevity',
  ],

  matchSignals: {
    productCategories: [
      'fitness app', 'workout program', 'supplements', 'gym membership',
      'yoga studio', 'personal training', 'nutrition coaching',
    ],
    audiences: [
      'gym goers', 'athletes', 'beginners', 'weight loss', 'muscle building',
      'mom fitness', 'senior fitness', 'yoga practitioners',
    ],
    objectives: [
      'transformation', 'first signup', 'subscription', 'app downloads',
    ],
  },

  visualCodes: {
    defaultAesthetic: 'energetic',
    references: [
      'Nike Training campaigns',
      'lululemon athleisure photography',
      'Crossfit Games coverage',
      'Vogue Wellness editorials',
      'Whoop performance imagery',
      'Peloton lifestyle',
      'AllTrails outdoor photography',
      'documentary athlete portraiture',
    ],
    defaultLighting: 'dramatic-studio',
    defaultComposition: 'low-angle-hero',
    moodKeywords: [
      'powerful',
      'transformative',
      'authentic',
      'sweat-honest',
      'committed',
      'in-the-moment',
      'unstoppable',
      'grounded',
    ],
    colorTendencies:
      'warm tones for transformation (oranges, golden hour) — cool tones for performance (steel blue, gym chrome) — earthy tones for wellness (sage, terracotta)',
  },

  hookFrameworks: [
    {
      id: 'transformation-promise',
      name: 'Transformation Promise',
      template: '{audience}. {timeframe}. {result}.',
      example: 'Busy parents. 12 weeks. Visible change without giving up your life.',
      worksWithAngles: ['desire', 'authority'],
    },
    {
      id: 'pain-recognition',
      name: 'Pain Recognition',
      template: 'Tired of {pain}? You\'re not weak — you\'re {missing}.',
      example: 'Tired of starting over every Monday? You\'re not weak — you\'re missing structure.',
      worksWithAngles: ['pain-point', 'desire'],
    },
    {
      id: 'method-difference',
      name: 'The Method',
      template: 'The way most {audience} train is {wrong}. Here\'s what actually works.',
      example: 'The way most beginners train is too random to work. Here\'s the system that actually does.',
      worksWithAngles: ['authority', 'curiosity'],
    },
    {
      id: 'no-bs-truth',
      name: 'No-BS Truth',
      template: 'Forget {myth}. {truth}.',
      example: 'Forget 30-day shreds. Real change takes 90 days of small wins.',
      worksWithAngles: ['authority', 'pain-point'],
    },
    {
      id: 'commitment-call',
      name: 'Commitment Call',
      template: 'You don\'t need {excuse}. You need {commitment}.',
      example: 'You don\'t need motivation. You need a system that runs without it.',
      worksWithAngles: ['authority', 'urgency'],
    },
    {
      id: 'social-proof-results',
      name: 'Social Proof Results',
      template: '{number} {audience} have already {result}. {invitation}.',
      example: '847 women in their 40s have rebuilt their strength here. Your turn?',
      worksWithAngles: ['social-proof', 'desire'],
    },
  ],

  audienceTriggers: {
    transformation: ['change', 'before/after', 'results', 'commit', 'finally'],
    performance: ['power', 'speed', 'recovery', 'optimize', 'edge'],
    beginners: ['start', 'simple', 'manageable', 'no judgment', 'first step'],
    luxury: ['premium', 'concierge', 'private', 'tailored', 'expert'],
    'mom-fitness': ['busy', 'real life', '20 minutes', 'home workout', 'energy'],
    athletes: ['compete', 'PR', 'edge', 'rivalry', 'win'],
    longevity: ['aging well', 'mobility', 'longevity', 'decades', 'long-term'],
  },

  restrictions: [
    'no overly photoshopped impossible bodies',
    'no exploitative gym shots',
    'avoid clichéd "fit influencer" poses',
    'no AI hands holding dumbbells incorrectly',
    'no broken anatomy in workout poses',
    'avoid medical-looking white-coat imagery (unless explicitly clinical)',
    'no fake-looking sweat',
  ],

  extraNegativePrompt:
    'photoshopped abs, plastic skin, broken anatomy in workout poses, fake sweat, generic stock fitness',

  generateBackgroundPrompt(context: PromptContext): string {
    const { productName, productDescription, angle, campaignType, platform, audience, brandTone } = context;

    const platformHint = platform.includes('story') || platform.includes('reel') || platform.includes('tiktok')
      ? 'vertical 9:16, energetic motion, action-oriented framing'
      : 'magazine-style framing, dramatic but considered';

    const aestheticHint = (() => {
      switch (angle) {
        case 'pain-point':
          return 'documentary-style fitness photography, real person mid-effort, sweat visible, raw moment of struggle that turns into resolve';
        case 'desire':
          return 'aspirational fitness lifestyle, soft golden hour light, person in flow state, transformation visible in posture';
        case 'authority':
          return 'editorial trainer/coach portrait, neutral expression, gym environment, expertise visible without being stiff';
        case 'luxury':
          return 'high-end wellness studio, premium materials, soft natural light, considered minimalism, spa-like serenity';
        case 'viral':
          return 'high-energy action shot, motion blur on movement, dynamic angle, kinetic energy, social-media optimized framing';
        case 'conversion':
          return 'clean product-forward shot if product, OR clear lifestyle moment that says "this is the result you want"';
        case 'curiosity':
          return 'mysterious behind-the-scenes feel, partial reveal of method, intriguing setup, makes you want to know more';
        case 'urgency':
          return 'high-stakes feel, dramatic lighting, sense of "now or never" energy, bold contrast';
        case 'social-proof':
          return 'community/group shot, multiple real bodies, shared moment of effort or celebration, lived-in gym authenticity';
        default:
          return 'editorial fitness photography, dramatic lighting, real person in motion, authentic';
      }
    })();

    const campaignHint = (() => {
      if (campaignType === 'product-launch' || campaignType === 'waitlist-launch') {
        return 'sense of beginning, first day energy, transformation just starting';
      }
      if (campaignType === 'flash-sale' || campaignType === 'seasonal') {
        return 'high-energy, decisive moment, "right now" feeling';
      }
      if (campaignType === 'lead-generation') {
        return 'invitation feel — like opening a door to a transformation';
      }
      return '';
    })();

    return [
      aestheticHint,
      `Subject: ${productName}. ${productDescription}.`,
      campaignHint,
      audience ? `Audience: ${audience} — visual cues should resonate with their reality.` : '',
      brandTone ? `Brand tone: ${brandTone}.` : '',
      platformHint,
      'Lighting suggests transformation potential — golden hour OR dramatic gym lighting depending on angle.',
      'Real bodies — not over-photoshopped. Authentic sweat if present. Real effort visible.',
      'Composition leaves space for text overlay (no text in image).',
      'Color palette: warm transformation tones OR cool performance tones based on angle.',
      'Shot on Sony A7R IV, 85mm, f/2.8, ISO 400.',
    ]
      .filter(Boolean)
      .join(' ');
  },
};
