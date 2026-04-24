// Creative Studio — Ad Editor Templates
//
// Each template is a function that takes variant data and returns a layer set.
// Templates inject the variant's copy (headline, subhead, cta) into pre-designed layouts.
// User can then customize everything in the editor.

import type { EditorLayer, TextLayerData, Variant } from '../types';

export interface AdTemplate {
  id: string;
  name: string;
  description: string;
  /** Returns an array of layers ready to be placed on the canvas */
  build: (variant: Variant) => EditorLayer[];
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE BUILDERS
// ═══════════════════════════════════════════════════════════════════

let uidCounter = 0;
function uid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${uidCounter}`;
}

function textLayer(
  partial: Partial<TextLayerData> & Pick<TextLayerData, 'text'>,
): TextLayerData {
  return {
    id: partial.id || uid('text'),
    type: 'text',
    text: partial.text,
    color: partial.color ?? '#ffffff',
    fontSizePercent: partial.fontSizePercent ?? 6,
    fontFamily: partial.fontFamily ?? 'inter',
    fontWeight: partial.fontWeight ?? 700,
    align: partial.align ?? 'center',
    letterSpacing: partial.letterSpacing ?? 0,
    lineHeight: partial.lineHeight ?? 1.15,
    shadowEnabled: partial.shadowEnabled ?? true,
    shadowBlur: partial.shadowBlur ?? 8,
    shadowColor: partial.shadowColor ?? 'rgba(0,0,0,0.55)',
    isButton: partial.isButton ?? false,
    buttonBg: partial.buttonBg ?? '#ffffff',
    buttonTextColor: partial.buttonTextColor ?? '#000000',
    buttonRadius: partial.buttonRadius ?? 999,
    buttonPadding: partial.buttonPadding ?? 1.5,
    x: partial.x ?? 0.5,
    y: partial.y ?? 0.5,
    width: partial.width ?? 0.8,
    height: partial.height ?? 0.1,
    rotation: 0,
    opacity: partial.opacity ?? 1,
    zIndex: partial.zIndex ?? 10,
    visible: true,
    name: partial.name,
  };
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════

export const AD_TEMPLATES: AdTemplate[] = [
  // ────────────────────────────────────────────────────────────
  // 1. FASHION PRODUCT AD
  // Large clean headline at top, subtle subhead, CTA bottom
  // ────────────────────────────────────────────────────────────
  {
    id: 'fashion_product_ad',
    name: 'Fashion Product Ad',
    description: 'Clean fashion layout with top headline and bottom CTA',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'New Collection',
        x: 0.5,
        y: 0.08,
        width: 0.9,
        fontSizePercent: 7,
        fontFamily: 'serif',
        fontWeight: 400,
        align: 'center',
        letterSpacing: 0.02,
        color: '#ffffff',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Subheadline',
        text: v.copy.subheadline || '',
        x: 0.5,
        y: 0.16,
        width: 0.8,
        fontSizePercent: 2.5,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'center',
        letterSpacing: 0.1,
        color: 'rgba(255,255,255,0.85)',
        shadowEnabled: false,
        zIndex: 11,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Shop Now',
        x: 0.5,
        y: 0.92,
        width: 0.3,
        fontSizePercent: 2.8,
        fontFamily: 'inter',
        fontWeight: 600,
        align: 'center',
        letterSpacing: 0.05,
        color: '#ffffff',
        isButton: true,
        buttonBg: 'transparent',
        buttonTextColor: '#ffffff',
        buttonRadius: 0,
        buttonPadding: 1,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 2. STREETWEAR CAMPAIGN
  // Bold bottom-left headline, tag line beneath
  // ────────────────────────────────────────────────────────────
  {
    id: 'streetwear_campaign',
    name: 'Streetwear Campaign',
    description: 'Bold bottom-left statement with tag',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'DROP 03',
        x: 0.05,
        y: 0.78,
        width: 0.6,
        fontSizePercent: 11,
        fontFamily: 'display',
        fontWeight: 900,
        align: 'left',
        letterSpacing: -0.02,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 20,
        zIndex: 10,
      }),
      textLayer({
        name: 'Subhead',
        text: v.copy.subheadline || 'AVAILABLE FRIDAY',
        x: 0.05,
        y: 0.92,
        width: 0.6,
        fontSizePercent: 2.5,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'left',
        letterSpacing: 0.15,
        color: 'rgba(255,255,255,0.9)',
        shadowEnabled: false,
        zIndex: 11,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 3. E-COMMERCE PRODUCT HERO
  // Headline + price right, CTA
  // ────────────────────────────────────────────────────────────
  {
    id: 'ecommerce_hero',
    name: 'E-commerce Hero',
    description: 'Product hero with right-side headline and CTA',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Premium Quality',
        x: 0.78,
        y: 0.3,
        width: 0.4,
        fontSizePercent: 6,
        fontFamily: 'inter',
        fontWeight: 800,
        align: 'left',
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 12,
        zIndex: 10,
      }),
      textLayer({
        name: 'Subheadline',
        text: v.copy.subheadline || '',
        x: 0.78,
        y: 0.42,
        width: 0.4,
        fontSizePercent: 2.8,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'left',
        color: 'rgba(255,255,255,0.9)',
        shadowEnabled: true,
        shadowBlur: 6,
        zIndex: 11,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Shop Now',
        x: 0.78,
        y: 0.56,
        width: 0.25,
        fontSizePercent: 2.8,
        fontFamily: 'inter',
        fontWeight: 600,
        align: 'center',
        color: '#000000',
        isButton: true,
        buttonBg: '#ffffff',
        buttonTextColor: '#000000',
        buttonRadius: 6,
        buttonPadding: 1.2,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 4. SAAS CLEAN AD
  // Top headline, subhead, CTA button
  // ────────────────────────────────────────────────────────────
  {
    id: 'saas_clean',
    name: 'SaaS Clean',
    description: 'Minimal top layout with CTA button',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Work, simplified.',
        x: 0.5,
        y: 0.18,
        width: 0.8,
        fontSizePercent: 6.5,
        fontFamily: 'inter',
        fontWeight: 700,
        align: 'center',
        letterSpacing: -0.01,
        color: '#1a1a1a',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Subheadline',
        text: v.copy.subheadline || '',
        x: 0.5,
        y: 0.28,
        width: 0.7,
        fontSizePercent: 2.8,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'center',
        color: 'rgba(26,26,26,0.7)',
        shadowEnabled: false,
        zIndex: 11,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Get Started',
        x: 0.5,
        y: 0.92,
        width: 0.28,
        fontSizePercent: 2.8,
        fontFamily: 'inter',
        fontWeight: 600,
        align: 'center',
        color: '#ffffff',
        isButton: true,
        buttonBg: '#1a1a1a',
        buttonTextColor: '#ffffff',
        buttonRadius: 999,
        buttonPadding: 1.2,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 5. APP LAUNCH STORY
  // Vertical flow: logo space top, headline middle, CTA bottom
  // ────────────────────────────────────────────────────────────
  {
    id: 'app_launch_story',
    name: 'App Launch Story',
    description: 'Vertical flow for story format ads',
    build: (v) => [
      textLayer({
        name: 'Brand Tag',
        text: 'INTRODUCING',
        x: 0.5,
        y: 0.08,
        width: 0.6,
        fontSizePercent: 2.2,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'center',
        letterSpacing: 0.25,
        color: 'rgba(255,255,255,0.7)',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Made for focus.',
        x: 0.5,
        y: 0.5,
        width: 0.85,
        fontSizePercent: 10,
        fontFamily: 'display',
        fontWeight: 700,
        align: 'center',
        letterSpacing: -0.02,
        lineHeight: 1.05,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 16,
        zIndex: 11,
      }),
      textLayer({
        name: 'Subheadline',
        text: v.copy.subheadline || '',
        x: 0.5,
        y: 0.62,
        width: 0.75,
        fontSizePercent: 3,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'center',
        color: 'rgba(255,255,255,0.85)',
        shadowEnabled: true,
        shadowBlur: 6,
        zIndex: 12,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Download',
        x: 0.5,
        y: 0.9,
        width: 0.35,
        fontSizePercent: 3,
        fontFamily: 'inter',
        fontWeight: 600,
        align: 'center',
        color: '#000000',
        isButton: true,
        buttonBg: '#ffffff',
        buttonTextColor: '#000000',
        buttonRadius: 999,
        buttonPadding: 1.3,
        zIndex: 13,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 6. BOLD STARTUP
  // Chunky bottom headline, brand color block
  // ────────────────────────────────────────────────────────────
  {
    id: 'bold_startup',
    name: 'Bold Startup',
    description: 'Heavy bottom typography for startup launches',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Ship faster.',
        x: 0.05,
        y: 0.7,
        width: 0.9,
        fontSizePercent: 12,
        fontFamily: 'inter',
        fontWeight: 900,
        align: 'left',
        letterSpacing: -0.03,
        lineHeight: 0.95,
        color: '#ffffff',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Subheadline',
        text: v.copy.subheadline || '',
        x: 0.05,
        y: 0.88,
        width: 0.6,
        fontSizePercent: 2.5,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'left',
        color: 'rgba(255,255,255,0.9)',
        shadowEnabled: false,
        zIndex: 11,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Try it',
        x: 0.8,
        y: 0.88,
        width: 0.18,
        fontSizePercent: 2.5,
        fontFamily: 'inter',
        fontWeight: 700,
        align: 'center',
        color: '#000000',
        isButton: true,
        buttonBg: '#ffffff',
        buttonTextColor: '#000000',
        buttonRadius: 8,
        buttonPadding: 1,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 7. LUXURY EDITORIAL
  // Serif headline top, wide tracking, minimal
  // ────────────────────────────────────────────────────────────
  {
    id: 'luxury_editorial',
    name: 'Luxury Editorial',
    description: 'Elegant editorial with serif typography',
    build: (v) => [
      textLayer({
        name: 'Brand',
        text: 'MAISON',
        x: 0.5,
        y: 0.07,
        width: 0.5,
        fontSizePercent: 2,
        fontFamily: 'serif',
        fontWeight: 400,
        align: 'center',
        letterSpacing: 0.4,
        color: '#ffffff',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Quiet excellence.',
        x: 0.5,
        y: 0.5,
        width: 0.7,
        fontSizePercent: 6,
        fontFamily: 'serif',
        fontWeight: 300,
        align: 'center',
        letterSpacing: 0.02,
        lineHeight: 1.2,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 12,
        zIndex: 11,
      }),
      textLayer({
        name: 'Subhead',
        text: v.copy.subheadline || '',
        x: 0.5,
        y: 0.92,
        width: 0.6,
        fontSizePercent: 1.8,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'center',
        letterSpacing: 0.3,
        color: 'rgba(255,255,255,0.8)',
        shadowEnabled: false,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 8. OFFER / CONVERSION
  // Bold offer + urgency + CTA
  // ────────────────────────────────────────────────────────────
  {
    id: 'offer_conversion',
    name: 'Offer / Conversion',
    description: 'Promotional layout with urgency',
    build: (v) => [
      textLayer({
        name: 'Offer',
        text: v.copy.headline || '50% OFF',
        x: 0.5,
        y: 0.35,
        width: 0.85,
        fontSizePercent: 14,
        fontFamily: 'inter',
        fontWeight: 900,
        align: 'center',
        letterSpacing: -0.02,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 20,
        zIndex: 10,
      }),
      textLayer({
        name: 'Urgency',
        text: v.copy.subheadline || 'Limited time only',
        x: 0.5,
        y: 0.52,
        width: 0.7,
        fontSizePercent: 3,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'center',
        letterSpacing: 0.1,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 10,
        zIndex: 11,
      }),
      textLayer({
        name: 'CTA',
        text: v.copy.cta || 'Claim Offer',
        x: 0.5,
        y: 0.86,
        width: 0.4,
        fontSizePercent: 3.2,
        fontFamily: 'inter',
        fontWeight: 700,
        align: 'center',
        color: '#000000',
        isButton: true,
        buttonBg: '#ffcc00',
        buttonTextColor: '#000000',
        buttonRadius: 8,
        buttonPadding: 1.4,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 9. TESTIMONIAL / SOCIAL PROOF
  // Quote + attribution
  // ────────────────────────────────────────────────────────────
  {
    id: 'testimonial_social',
    name: 'Testimonial',
    description: 'Quote with attribution for social proof',
    build: (v) => [
      textLayer({
        name: 'Quote Mark',
        text: '"',
        x: 0.1,
        y: 0.2,
        width: 0.2,
        fontSizePercent: 20,
        fontFamily: 'serif',
        fontWeight: 700,
        align: 'left',
        color: 'rgba(255,255,255,0.4)',
        shadowEnabled: false,
        zIndex: 10,
      }),
      textLayer({
        name: 'Quote',
        text: v.copy.headline || 'Changed how we work.',
        x: 0.5,
        y: 0.48,
        width: 0.8,
        fontSizePercent: 5.5,
        fontFamily: 'serif',
        fontWeight: 400,
        align: 'center',
        letterSpacing: -0.01,
        lineHeight: 1.2,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 10,
        zIndex: 11,
      }),
      textLayer({
        name: 'Attribution',
        text: v.copy.subheadline || '— Customer Name',
        x: 0.5,
        y: 0.72,
        width: 0.6,
        fontSizePercent: 2.5,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'center',
        letterSpacing: 0.08,
        color: 'rgba(255,255,255,0.8)',
        shadowEnabled: false,
        zIndex: 12,
      }),
    ],
  },

  // ────────────────────────────────────────────────────────────
  // 10. MINIMAL PREMIUM
  // Tiny centered text, lots of space
  // ────────────────────────────────────────────────────────────
  {
    id: 'minimal_premium',
    name: 'Minimal Premium',
    description: 'Restrained minimal composition with small refined text',
    build: (v) => [
      textLayer({
        name: 'Headline',
        text: v.copy.headline || 'Form follows.',
        x: 0.5,
        y: 0.5,
        width: 0.5,
        fontSizePercent: 3.5,
        fontFamily: 'inter',
        fontWeight: 500,
        align: 'center',
        letterSpacing: 0.15,
        color: '#ffffff',
        shadowEnabled: true,
        shadowBlur: 8,
        zIndex: 10,
      }),
      textLayer({
        name: 'Tag',
        text: v.copy.cta || 'Available now',
        x: 0.5,
        y: 0.93,
        width: 0.5,
        fontSizePercent: 1.6,
        fontFamily: 'inter',
        fontWeight: 400,
        align: 'center',
        letterSpacing: 0.4,
        color: 'rgba(255,255,255,0.7)',
        shadowEnabled: false,
        zIndex: 11,
      }),
    ],
  },
];

/**
 * Returns default layers for a variant based on its layout.
 * This is used on initial editor load if no template is chosen.
 */
export function getDefaultLayers(variant: Variant): EditorLayer[] {
  const tpl = AD_TEMPLATES.find(
    (t) => t.id === layoutToTemplate(variant.layout),
  );
  if (tpl) return tpl.build(variant);
  return AD_TEMPLATES[0].build(variant);
}

function layoutToTemplate(layout: string): string {
  switch (layout) {
    case 'hero_app':
      return 'saas_clean';
    case 'feature_grid':
      return 'bold_startup';
    case 'story_ad':
      return 'app_launch_story';
    case 'minimal_branding':
      return 'minimal_premium';
    case 'ui_focus':
      return 'ecommerce_hero';
    default:
      return 'saas_clean';
  }
}
