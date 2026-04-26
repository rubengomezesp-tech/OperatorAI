/**
 * VERTICAL: Tech / SaaS / App
 *
 * Domain expertise for software companies, AI tools, mobile apps,
 * developer tools, B2B SaaS, productivity apps, no-code platforms.
 *
 * THIS IS THE VERTICAL OPERATOR AI WILL USE TO PROMOTE ITSELF.
 */

import 'server-only';
import type { Vertical, PromptContext } from '../types';

export const TechSaasAppVertical: Vertical = {
  id: 'tech-saas-app',
  displayName: 'Tech / SaaS / App',
  description: 'Software products, AI tools, mobile apps, developer tools, B2B SaaS',
  icon: '⚡',

  matchKeywords: [
    // Spanish
    'app', 'aplicacion', 'software', 'saas', 'plataforma', 'herramienta',
    'ia', 'inteligencia artificial', 'automatizacion', 'productividad',
    'startup', 'tech', 'tecnologia', 'sistema', 'dashboard', 'panel',
    'analytics', 'crm', 'gestion', 'optimizacion', 'workflow',
    'codigo', 'developer', 'api', 'integracion', 'no-code',
    // English
    'app', 'software', 'saas', 'platform', 'tool', 'tools',
    'ai', 'artificial intelligence', 'automation', 'productivity',
    'startup', 'tech', 'technology', 'system', 'dashboard', 'panel',
    'analytics', 'crm', 'management', 'optimization', 'workflow',
    'code', 'developer', 'api', 'integration', 'no-code', 'low-code',
    'machine learning', 'gpt', 'llm', 'agent', 'chatbot',
    'b2b', 'enterprise', 'team', 'collaboration', 'remote work',
    // Operator AI specific
    'operator ai', 'creative studio', 'brand os', 'ai marketing',
  ],

  matchSignals: {
    productCategories: [
      'software', 'app', 'web app', 'mobile app', 'ai tool',
      'productivity tool', 'analytics platform', 'developer tool',
    ],
    audiences: [
      'developers', 'founders', 'marketers', 'agencies', 'startups',
      'remote teams', 'product managers', 'designers',
    ],
    objectives: [
      'app downloads', 'free trial signups', 'demo bookings',
      'product launch', 'beta waitlist',
    ],
  },

  visualCodes: {
    defaultAesthetic: 'tech-modern',
    references: [
      'Linear product launches',
      'Stripe.com hero images',
      'Apple keynote aesthetics',
      'Notion product photography',
      'Figma showcase imagery',
      'Vercel product shots',
      'Raycast app marketing',
      'Arc browser visuals',
      'OpenAI brand photography',
      'Anthropic visual identity',
    ],
    defaultLighting: 'cool-cinematic',
    defaultComposition: 'centered-symmetric',
    moodKeywords: [
      'inevitable',
      'frictionless',
      'crafted',
      'powerful',
      'modern',
      'considered',
      'intelligent',
      'magical',
      'minimal',
      'deliberate',
    ],
    colorTendencies:
      'tech palettes — deep blacks with single accent (purple, electric blue, magenta, gradient washes), product chrome silver, soft pastel gradients, high contrast minimalism',
  },

  hookFrameworks: [
    {
      id: 'before-after-product',
      name: 'Before / After Workflow',
      template: 'Stop {old painful way}. Start {new effortless way}.',
      example: 'Stop juggling 6 tools to launch a campaign. Start with one prompt.',
      worksWithAngles: ['pain-point', 'desire'],
    },
    {
      id: 'demo-reveal',
      name: 'Demo Reveal',
      template: 'Watch what {audience} can do in {timeframe} with {product}.',
      example: 'Watch a solo founder ship a full brand campaign in 8 minutes.',
      worksWithAngles: ['curiosity', 'authority'],
    },
    {
      id: 'category-creator',
      name: 'Category Creator',
      template: 'The {category} category is broken. {product} is the answer.',
      example: 'AI marketing tools generate noise. Operator builds campaigns.',
      worksWithAngles: ['authority', 'desire'],
    },
    {
      id: 'numbers-credibility',
      name: 'Numbers Credibility',
      template: '{number} {users} use {product} to {outcome}.',
      example: '12,000 founders use Operator AI to launch campaigns without an agency.',
      worksWithAngles: ['social-proof', 'authority'],
    },
    {
      id: 'magic-moment',
      name: 'Magic Moment',
      template: 'One {input} → {valuable output} in {time}.',
      example: 'One paste of your URL → complete brand campaign in 90 seconds.',
      worksWithAngles: ['curiosity', 'desire'],
    },
    {
      id: 'beta-waitlist',
      name: 'Beta / Waitlist',
      template: 'Now in {access level}. {scarcity reason}.',
      example: 'Now in private beta. 200 founders only — first wave starts Tuesday.',
      worksWithAngles: ['urgency', 'desire'],
    },
    {
      id: 'tool-stack-replacement',
      name: 'Tool Stack Replacement',
      template: 'Replace {old tools} with {one product}. {benefit}.',
      example: 'Replace Canva + ChatGPT + Photoshop with one tool. Built for marketers.',
      worksWithAngles: ['conversion', 'authority'],
    },
  ],

  audienceTriggers: {
    developers: ['ship', 'API-first', 'documented', 'composable', 'no lock-in'],
    founders: ['unfair advantage', 'no team needed', 'ship faster', 'lean'],
    marketers: ['campaign in minutes', 'no design skills needed', 'on-brand always'],
    agencies: ['margin', 'scalable', 'white-label', 'client-ready', 'reusable'],
    enterprise: ['compliant', 'SOC 2', 'team management', 'audit logs', 'SLA'],
    creators: ['express vision', 'iterate fast', 'consistent quality'],
    startups: ['runway', 'first 1000 users', 'PMF', 'iterate'],
    'no-code': ['no setup', 'visual', 'instant', 'click not code'],
  },

  restrictions: [
    'no fake screenshots that look like real apps but are not the actual product',
    'no AI text on screens that pretends to be functional UI',
    'no broken UI elements or impossible button arrangements',
    'avoid generic "person looking at laptop" stock imagery',
    'no over-the-top tech glow that looks AI-generated',
    'no fake code that doesn\'t compile-look',
    'avoid the cliché "girl with headset" customer support shot',
  ],

  extraNegativePrompt:
    'fake screenshots, AI-typical product UI, broken interface, generic stock tech, fake code, oversaturated tech glow',

  generateBackgroundPrompt(context: PromptContext): string {
    const { productName, productDescription, angle, campaignType, platform, audience, brandTone, brandColors } = context;

    const platformHint = platform.includes('story') || platform.includes('reel') || platform.includes('tiktok')
      ? 'vertical 9:16 format, mobile-first composition'
      : platform === 'linkedin'
        ? 'professional landscape framing, B2B credibility'
        : 'square or magazine-style framing';

    const aestheticHint = (() => {
      switch (angle) {
        case 'curiosity':
          return 'mysterious tech reveal, partial UI glimpse, abstract data visualization, "what is this?" energy, gradient backgrounds with subtle motion';
        case 'authority':
          return 'product-forward hero shot, clean modern aesthetic, MacBook Pro silver from above OR clean office environment, expertise visible';
        case 'desire':
          return 'aspirational productivity scene, person in flow state working on the product, sunlight through window, clean modern desk, plants, considered minimalism';
        case 'pain-point':
          return 'cluttered "before" feel — chaos of too many browser tabs, sticky notes, Slack notifications, evolving into clean focused "after"';
        case 'luxury':
          return 'premium tech aesthetic — Apple-grade product photography, materials that feel expensive, soft directional light, considered minimalism';
        case 'viral':
          return 'magic moment screen recording feel, dynamic UI animations, "wait what?" reveal, attention-grabbing tech';
        case 'conversion':
          return 'clean hero product shot, product UI clearly visible (abstract/non-readable), value proposition implied through visual';
        case 'urgency':
          return 'beta access feel, exclusivity vibes, countdown energy, limited spots aesthetic';
        case 'social-proof':
          return 'community of users moment, multiple devices showing the product, real workspace shots, "everyone is using this" feel';
        default:
          return 'modern tech product photography, considered minimalism, single accent color, soft directional light';
      }
    })();

    const campaignHint = (() => {
      if (campaignType === 'product-launch' || campaignType === 'waitlist-launch') {
        return 'launch energy — sense of arrival, day-one excitement, "this changes things" feel';
      }
      if (campaignType === 'lead-generation') {
        return 'invitation aesthetic — opens a door to value, demo-ready feel';
      }
      if (campaignType === 'webinar-event') {
        return 'event-promotion feel, professional speaker context, calendar-block energy';
      }
      if (campaignType === 'flash-sale') {
        return 'limited-time aesthetic — countdown timer energy, decisive action moment';
      }
      return '';
    })();

    const colorHint = brandColors?.primary
      ? `Brand color accent: subtle use of ${brandColors.primary} as a single accent in lighting or gradient.`
      : 'tech palette: deep black with single bold accent color (electric blue, purple, magenta, or gradient).';

    return [
      aestheticHint,
      `Product: ${productName}. ${productDescription}.`,
      campaignHint,
      audience ? `Audience: ${audience} — feels like their natural workspace.` : '',
      brandTone ? `Brand tone: ${brandTone}.` : '',
      colorHint,
      platformHint,
      'Soft directional light from window or clean studio.',
      'Composition keeps strong negative space for text overlay (no text in image).',
      'Modern minimalism — no clutter, no fake UI elements.',
      'If showing devices: real MacBook Pro silver, real iPhone — not AI-generated tech.',
      'Subtle depth of field — blurred background, sharp foreground.',
      'Shot on Phase One XF IQ4 OR Sony A7R IV, 50mm, f/2.8, daylight.',
    ]
      .filter(Boolean)
      .join(' ');
  },
};
