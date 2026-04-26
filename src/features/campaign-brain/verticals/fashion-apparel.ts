/**
 * VERTICAL: Fashion & Apparel
 *
 * Domain expertise for clothing, accessories, footwear, streetwear,
 * luxury fashion, sustainable fashion, athletic wear.
 */

import 'server-only';
import type { Vertical, PromptContext } from '../types';

export const FashionApparelVertical: Vertical = {
  id: 'fashion-apparel',
  displayName: 'Fashion & Apparel',
  description: 'Clothing, accessories, footwear, and fashion brands',
  icon: '👗',

  matchKeywords: [
    // Spanish
    'moda', 'ropa', 'vestido', 'camiseta', 'jeans', 'pantalon',
    'zapatos', 'zapatillas', 'sneakers', 'bolso', 'chaqueta',
    'streetwear', 'lookbook', 'coleccion', 'temporada', 'drop',
    'prenda', 'tendencia', 'estilo',
    // English
    'fashion', 'apparel', 'clothing', 'dress', 'shirt', 'tshirt',
    'pants', 'shoes', 'sneakers', 'bag', 'jacket', 'hoodie',
    'streetwear', 'lookbook', 'collection', 'season', 'drop',
    'garment', 'trend', 'style', 'wardrobe', 'outfit',
    // Sub-niches
    'athleisure', 'activewear', 'lingerie', 'swimwear', 'denim',
    'luxury fashion', 'fast fashion', 'sustainable fashion',
    'capsule', 'minimalist', 'avant-garde',
  ],

  matchSignals: {
    productCategories: [
      'clothing', 'apparel', 'accessories', 'footwear', 'jewelry-fashion',
    ],
    audiences: [
      'fashion enthusiasts', 'gen-z', 'millennials', 'streetwear lovers',
    ],
  },

  visualCodes: {
    defaultAesthetic: 'editorial',
    references: [
      'i-D Magazine',
      'AnOther Magazine',
      'Vogue Italia',
      'Self Service Magazine',
      'Aperture',
      'Helmut Newton',
      'Tim Walker',
      'Petra Collins',
      'Tyler Mitchell',
      'Fashion Week street style',
    ],
    defaultLighting: 'soft-natural',
    defaultComposition: 'rule-of-thirds',
    moodKeywords: [
      'effortless',
      'curated',
      'intentional',
      'considered',
      'magnetic',
      'unmissable',
      'sophisticated',
      'raw',
    ],
    colorTendencies:
      'editorial palettes — muted neutrals, single bold accents, monochrome studies, washed pastels',
  },

  hookFrameworks: [
    {
      id: 'statement-piece',
      name: 'Statement Piece Reveal',
      template: 'Built for {audience} who {desire}. {product} — now in {drop}.',
      example: 'Built for those who refuse uniform. The Vesper Coat — Spring \'26 drop.',
      worksWithAngles: ['luxury', 'desire', 'authority'],
    },
    {
      id: 'before-after-style',
      name: 'Style Transformation',
      template: '{old way} → {new way}. {product} changes how you {action}.',
      example: 'Crumpled basics → quietly tailored. The Daily Set changes how you dress for nothing.',
      worksWithAngles: ['desire', 'pain-point'],
    },
    {
      id: 'drop-hype',
      name: 'Drop Hype',
      template: '{number} pieces. {time}. Once they\'re gone, they\'re gone.',
      example: '120 pieces. Friday at noon. Once they\'re gone, they\'re gone.',
      worksWithAngles: ['urgency', 'social-proof'],
    },
    {
      id: 'philosophy',
      name: 'Brand Philosophy',
      template: 'For {audience}. Made {how}. Wear it {when}.',
      example: 'For people who travel light. Made in Porto. Wear it forever.',
      worksWithAngles: ['authority', 'luxury'],
    },
    {
      id: 'occasion',
      name: 'Occasion-Driven',
      template: 'For {occasion}. Without trying. {product}.',
      example: 'For dinner you didn\'t plan. Without trying. The Wrap Dress.',
      worksWithAngles: ['desire', 'curiosity'],
    },
  ],

  audienceTriggers: {
    luxury: ['rare', 'crafted', 'archive', 'limited', 'numbered', 'heritage', 'made-to-order'],
    streetwear: ['drop', 'cop', 'release', 'exclusive', 'collab', 'OG', 'grail'],
    minimal: ['curated', 'essential', 'timeless', 'considered', 'enough'],
    sustainable: ['responsibly made', 'low-impact', 'circular', 'repairable', 'small-batch'],
    bold: ['statement', 'unapologetic', 'iconic', 'standout', 'eye-catching'],
    athleisure: ['performance', 'movement', 'engineered', 'breathable', 'every-day'],
  },

  restrictions: [
    'no awkward AI hands holding hangers',
    'fabric must drape naturally — no plastic-looking texture',
    'avoid generic mannequin poses',
    'no over-saturated colors that misrepresent the actual garment',
    'no fake / synthetic-looking bokeh',
    'avoid stock-photo aesthetics',
    'no AI-typical waxy skin on models',
  ],

  extraNegativePrompt:
    'plastic fabric, synthetic shine, mannequin stiffness, tourist pose, generic stock photo, oversaturated colors',

  generateBackgroundPrompt(context: PromptContext): string {
    const { productName, productDescription, angle, campaignType, platform, brandTone, audience } = context;

    const platformHint = platform.includes('story') || platform.includes('reel') || platform.includes('tiktok')
      ? 'vertical 9:16 format, full body composition'
      : 'aspect-aware composition, magazine-style framing';

    // Aesthetic varies by angle
    const aestheticHint = (() => {
      switch (angle) {
        case 'luxury':
          return 'editorial fashion photography in style of Vogue Italia, soft window light, model in considered pose, neutral palette, archival mood';
        case 'viral':
          return 'energetic street-style fashion shot, candid movement, urban backdrop, golden hour, kinetic feel';
        case 'authority':
          return 'documentary-style fashion editorial, behind-the-scenes craftsmanship feel, raw, intentional';
        case 'desire':
          return 'aspirational lifestyle fashion shot, intimate moment, soft natural light, slight nostalgia';
        case 'urgency':
          return 'bold statement shot, dramatic lighting, single hero piece highlighted, sense of scarcity';
        case 'social-proof':
          return 'real-feeling community shot, multiple bodies, candid moment, authentic';
        case 'pain-point':
          return 'before/after transformation feel, contrasting moods, problem→solution visual narrative';
        case 'curiosity':
          return 'partial reveal, mysterious framing, hint of what\'s coming, unfinished feeling';
        case 'conversion':
          return 'clean product-forward shot, hero garment center stage, minimal distractions, clear focal point';
        default:
          return 'editorial fashion photography, considered framing, soft natural light';
      }
    })();

    // Special handling for specific campaign types
    const campaignHint = (() => {
      if (campaignType === 'product-launch' || campaignType === 'waitlist-launch') {
        return 'sense of arrival, hero piece introduction, campaign-launch energy';
      }
      if (campaignType === 'flash-sale' || campaignType === 'seasonal') {
        return 'high-energy fashion editorial, dynamic composition, product clearly visible';
      }
      if (campaignType === 'social-proof') {
        return 'community feel, real bodies, lived-in';
      }
      return '';
    })();

    const audienceHint = audience
      ? `targeted at ${audience}, evoking their lifestyle and aspirations`
      : '';

    return [
      aestheticHint,
      `Product: ${productName}. ${productDescription}.`,
      campaignHint,
      audienceHint,
      brandTone ? `Brand tone: ${brandTone}.` : '',
      platformHint,
      'Shot on Hasselblad H6D-100c, medium format, f/4.0, ISO 200.',
      'Composition leaves space for text overlay (no text in image).',
      'No people staring directly at camera unless intentional eye contact serves the angle.',
      'Color grading: cinematic film stock — Kodak Portra 400 or Cinestill 800T feel.',
    ]
      .filter(Boolean)
      .join(' ');
  },
};
