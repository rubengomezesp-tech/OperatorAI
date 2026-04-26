/**
 * VERTICAL: E-commerce Physical Products
 *
 * Domain expertise for physical product brands that don't fit
 * other specialized verticals: home goods, gadgets, supplements,
 * generic D2C products, marketplace sellers.
 *
 * This is also the FALLBACK vertical when no specific match is found.
 */

import 'server-only';
import type { Vertical, PromptContext } from '../types';

export const EcommercePhysicalVertical: Vertical = {
  id: 'ecommerce-physical',
  displayName: 'E-commerce — Physical Products',
  description: 'Physical product brands, D2C, marketplace sellers, gadgets',
  icon: '📦',

  matchKeywords: [
    // Spanish
    'producto', 'tienda', 'tienda online', 'ecommerce', 'envio',
    'comprar', 'compra', 'vender', 'vendo', 'catalogo',
    'caja', 'paquete', 'unboxing', 'review', 'shopify',
    // English
    'product', 'store', 'shop', 'ecommerce', 'shipping',
    'buy', 'purchase', 'sell', 'catalog', 'inventory',
    'box', 'package', 'unboxing', 'review', 'shopify',
    'amazon', 'd2c', 'dtc', 'consumer goods', 'physical product',
    // Sub-categories that don't have own vertical yet
    'gadget', 'gizmo', 'home goods', 'kitchenware',
    'tools', 'office supplies', 'stationery', 'gift',
  ],

  matchSignals: {
    productCategories: [
      'physical product', 'consumer goods', 'home goods', 'gadgets',
      'office supplies', 'kitchenware', 'gifts',
    ],
    objectives: [
      'product sales', 'add to cart', 'first purchase', 'unboxing content',
    ],
  },

  visualCodes: {
    defaultAesthetic: 'product-studio',
    references: [
      'Apple product photography',
      'Aesop product imagery',
      'Muji catalog aesthetic',
      'Architectural Digest product shots',
      'Hodinkee watch photography',
      'Kinfolk magazine product styling',
      'Wirecutter review imagery',
    ],
    defaultLighting: 'soft-natural',
    defaultComposition: 'centered-symmetric',
    moodKeywords: [
      'considered',
      'tactile',
      'crafted',
      'inviting',
      'desirable',
      'real',
      'tangible',
      'magazine-worthy',
    ],
    colorTendencies:
      'product photography palettes — neutral backdrops (warm white, sage, terracotta, deep navy), product as hero with one supporting prop, kinfolk-style styling',
  },

  hookFrameworks: [
    {
      id: 'problem-solver',
      name: 'Problem Solver',
      template: 'For {audience} who {pain}. {product} that {solution}.',
      example: 'For people tired of tangled headphones. The MagDrop case that solves it forever.',
      worksWithAngles: ['pain-point', 'desire'],
    },
    {
      id: 'unboxing-tease',
      name: 'Unboxing Tease',
      template: 'What\'s in the box: {product}. {benefit}. {social proof}.',
      example: 'What\'s in the box: 14-piece travel kit. Fits in your pocket. Loved by 4,200 travelers.',
      worksWithAngles: ['curiosity', 'social-proof'],
    },
    {
      id: 'gift-positioning',
      name: 'Gift Positioning',
      template: 'The {gift type} for {recipient} who has {everything}.',
      example: 'The thoughtful gift for the friend who has everything.',
      worksWithAngles: ['desire', 'luxury'],
    },
    {
      id: 'comparison',
      name: 'Comparison',
      template: '{competitor} costs {high price}. We\'re {our price}. Same {quality}.',
      example: 'Designer kettles cost $400. Ours is $89. Same German engineering.',
      worksWithAngles: ['conversion', 'pain-point'],
    },
    {
      id: 'sustainability',
      name: 'Sustainability Angle',
      template: '{product} that {benefit} without {environmental cost}.',
      example: 'Cookware that lasts a lifetime — not a landfill.',
      worksWithAngles: ['authority', 'desire'],
    },
    {
      id: 'review-driven',
      name: 'Review Driven',
      template: '"{review quote}" — {customer}. {product}.',
      example: '"Genuinely changed my morning routine." — 4,800 verified buyers. The Espresso Mod.',
      worksWithAngles: ['social-proof', 'authority'],
    },
  ],

  audienceTriggers: {
    luxury: ['premium', 'crafted', 'heirloom', 'finest', 'handmade'],
    practical: ['durable', 'works', 'reliable', 'no-fuss', 'every-day'],
    'gift-giver': ['thoughtful', 'memorable', 'they\'ll love', 'unforgettable'],
    sustainable: ['responsibly-sourced', 'plastic-free', 'circular', 'long-lasting'],
    'value-seeker': ['better than', 'fraction of', 'why pay more', 'smart choice'],
    minimalist: ['essential', 'curated', 'enough', 'one good thing'],
  },

  restrictions: [
    'no fake-looking products with impossible details',
    'no AI products with unclear actual function',
    'no melting/warping product distortion',
    'avoid stock-photo product backgrounds',
    'no over-saturated unrealistic product colors',
    'no broken physics on product placement',
  ],

  extraNegativePrompt:
    'fake products, melted product details, impossible designs, oversaturated unrealistic colors, generic stock product photo',

  generateBackgroundPrompt(context: PromptContext): string {
    const { productName, productDescription, angle, campaignType, platform, audience, brandTone, hasOffer } = context;

    const platformHint = platform.includes('story') || platform.includes('reel') || platform.includes('tiktok')
      ? 'vertical 9:16 format, full-frame product hero or lifestyle context'
      : 'square or landscape framing, magazine-quality composition';

    const aestheticHint = (() => {
      switch (angle) {
        case 'desire':
          return 'aspirational lifestyle product shot, product in beautiful real-world context (kitchen counter, dressing table, desk), soft natural light';
        case 'authority':
          return 'product hero shot, single product center stage, clean studio backdrop, premium material textures emphasized';
        case 'pain-point':
          return 'before/after split feel — problem visualized on left, product solution on right, contrast between chaos and order';
        case 'luxury':
          return 'editorial product photography, museum-quality lighting, single product as art object, neutral backdrop, dramatic shadows';
        case 'curiosity':
          return 'partial product reveal, intriguing detail shot, makes you want to see more, mysterious framing';
        case 'urgency':
          return 'product with sense of decisive action, bold composition, clear focal point, "now or never" energy';
        case 'social-proof':
          return 'product in lived-in context, signs of real use, multiple instances suggesting popularity, authentic';
        case 'viral':
          return 'satisfying product detail or transformation, ASMR-worthy moment, attention-grabbing aesthetic';
        case 'conversion':
          return 'clean studio product shot, product as undisputed hero, neutral backdrop, ready to be the only thing on screen';
        default:
          return 'considered product photography, soft natural light, neutral backdrop, magazine-worthy';
      }
    })();

    const campaignHint = (() => {
      if (hasOffer) {
        return 'product feels current, in-demand, decisive moment for purchase';
      }
      if (campaignType === 'product-launch') {
        return 'product reveal energy, first-look feeling';
      }
      if (campaignType === 'seasonal') {
        return 'seasonal context — visual cues of the season (holiday lights, summer textures, autumn colors)';
      }
      return '';
    })();

    return [
      aestheticHint,
      `Product: ${productName}. ${productDescription}.`,
      campaignHint,
      audience ? `Context: feels at home in ${audience} life.` : '',
      brandTone ? `Brand tone: ${brandTone}.` : '',
      platformHint,
      'Real product textures — tactile, considered.',
      'Single hero product OR styled grouping — never cluttered.',
      'Composition leaves room for text overlay (no text in image).',
      'Soft directional light, controlled shadows.',
      'Background neutral or contextual — never competing with product.',
      'Shot on Hasselblad H6D-100c, 90mm macro, f/8, daylight.',
    ]
      .filter(Boolean)
      .join(' ');
  },
};
