/**
 * Auto-layout from Brain output + Vertical DNA
 *
 * Given: imageUrl, headline, cta, logo, vertical
 * Returns: pre-positioned layers ready to render in the editor
 *
 * Each vertical has its own composition rule (where headline goes,
 * where logo goes, what fonts work). This function applies that
 * intelligence so the user opens the editor and sees a layout
 * that already looks intentional.
 */

import { nanoid } from 'nanoid';
import type {
  Layer,
  ImageLayer,
  TextLayer,
  LogoLayer,
  AutoLayoutInput,
  AspectRatio,
} from '../types';
import { ASPECT_DIMENSIONS } from '../types';

// ─────────────────────────────────────────────────────────────────
// Vertical-specific composition rules
// ─────────────────────────────────────────────────────────────────

interface CompositionRule {
  headlinePosition: 'top' | 'center' | 'bottom-left' | 'bottom-center' | 'lower-third';
  logoPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-center';
  ctaPosition: 'bottom-right' | 'bottom-center' | 'below-headline';
  headlineFont: string;
  headlineSize: number; // px at 1024 reference
  bodyFont: string;
  ctaFont: string;
  defaultColor: string; // text color that works with most images
}

const VERTICAL_LAYOUTS: Record<string, CompositionRule> = {
  'travel-hospitality': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Cormorant Garamond',
    headlineSize: 72,
    bodyFont: 'Source Sans Pro',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'jewelry-luxury': {
    headlinePosition: 'bottom-center',
    logoPosition: 'top-left',
    ctaPosition: 'bottom-center',
    headlineFont: 'Playfair Display',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'food-beverage': {
    headlinePosition: 'bottom-left',
    logoPosition: 'top-left',
    ctaPosition: 'bottom-right',
    headlineFont: 'Bebas Neue',
    headlineSize: 80,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'fitness-wellness': {
    headlinePosition: 'center',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-center',
    headlineFont: 'Anton',
    headlineSize: 96,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'beauty-cosmetics': {
    headlinePosition: 'bottom-left',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Playfair Display',
    headlineSize: 60,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'fashion-apparel': {
    headlinePosition: 'top',
    logoPosition: 'bottom-center',
    ctaPosition: 'bottom-right',
    headlineFont: 'Cormorant Garamond',
    headlineSize: 72,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'tech-saas-app': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-left',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'real-estate': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Playfair Display',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'home-decor': {
    headlinePosition: 'bottom-left',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Cormorant Garamond',
    headlineSize: 60,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'health-medical': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-left',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 56,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'education-online': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Playfair Display',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'automotive': {
    headlinePosition: 'bottom-left',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Bebas Neue',
    headlineSize: 88,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'pets': {
    headlinePosition: 'bottom-center',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'finance-fintech': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-left',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 60,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'services-coaching': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Playfair Display',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'ecommerce-physical': {
    headlinePosition: 'bottom-left',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
  'other': {
    headlinePosition: 'lower-third',
    logoPosition: 'top-right',
    ctaPosition: 'bottom-right',
    headlineFont: 'Inter',
    headlineSize: 64,
    bodyFont: 'Inter',
    ctaFont: 'Inter',
    defaultColor: '#FFFFFF',
  },
};

function resolvePosition(
  position: CompositionRule['headlinePosition'] | CompositionRule['logoPosition'] | CompositionRule['ctaPosition'],
  canvasWidth: number,
  canvasHeight: number,
  elementWidth: number,
  elementHeight: number,
): { x: number; y: number } {
  const margin = 60;
  switch (position) {
    case 'top':
      return { x: (canvasWidth - elementWidth) / 2, y: margin };
    case 'center':
      return {
        x: (canvasWidth - elementWidth) / 2,
        y: (canvasHeight - elementHeight) / 2,
      };
    case 'bottom-left':
      return { x: margin, y: canvasHeight - elementHeight - margin };
    case 'bottom-center':
      return {
        x: (canvasWidth - elementWidth) / 2,
        y: canvasHeight - elementHeight - margin,
      };
    case 'lower-third':
      return { x: margin, y: canvasHeight * 0.66 };
    case 'top-right':
      return { x: canvasWidth - elementWidth - margin, y: margin };
    case 'top-left':
      return { x: margin, y: margin };
    case 'bottom-right':
      return {
        x: canvasWidth - elementWidth - margin,
        y: canvasHeight - elementHeight - margin,
      };
    case 'below-headline':
      return { x: margin, y: canvasHeight * 0.78 };
    default:
      return { x: margin, y: margin };
  }
}

// ─────────────────────────────────────────────────────────────────
// Main: build initial layers from brain output
// ─────────────────────────────────────────────────────────────────

export function buildAutoLayout(input: AutoLayoutInput): Layer[] {
  const dimensions = ASPECT_DIMENSIONS[input.aspectRatio];
  const layout = VERTICAL_LAYOUTS[input.vertical] ?? VERTICAL_LAYOUTS['other'];
  const layers: Layer[] = [];

  // ─── Layer 0: Background image (always first, locked) ───────
  const background: ImageLayer = {
    id: nanoid(),
    kind: 'image',
    isBackground: true,
    src: input.imageUrl,
    x: 0,
    y: 0,
    width: dimensions.width,
    height: dimensions.height,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: true,
  };
  layers.push(background);

  // ─── Layer: Headline ────────────────────────────────────────
  if (input.headline) {
    const headlineWidth = Math.min(dimensions.width - 120, dimensions.width * 0.85);
    const estimatedHeight = layout.headlineSize * 1.3;
    const pos = resolvePosition(
      layout.headlinePosition,
      dimensions.width,
      dimensions.height,
      headlineWidth,
      estimatedHeight,
    );
    const headline: TextLayer = {
      id: nanoid(),
      kind: 'text',
      text: input.headline,
      fontFamily: layout.headlineFont,
      fontSize: layout.headlineSize,
      fontWeight: 700,
      fill: layout.defaultColor,
      textAlign: 'left',
      lineHeight: 1.1,
      letterSpacing: 0,
      shadow: {
        color: 'rgba(0,0,0,0.6)',
        blur: 8,
        offsetX: 0,
        offsetY: 2,
      },
      x: pos.x,
      y: pos.y,
      width: headlineWidth,
      height: estimatedHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    layers.push(headline);
  }

  // ─── Layer: CTA ─────────────────────────────────────────────
  if (input.cta) {
    const ctaSize = 28;
    const ctaWidth = 280;
    const ctaHeight = ctaSize * 1.5;
    const pos = resolvePosition(
      layout.ctaPosition,
      dimensions.width,
      dimensions.height,
      ctaWidth,
      ctaHeight,
    );
    const cta: TextLayer = {
      id: nanoid(),
      kind: 'text',
      text: input.cta,
      fontFamily: layout.ctaFont,
      fontSize: ctaSize,
      fontWeight: 600,
      fill: input.brandPrimary || '#000000',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 1.5,
      x: pos.x,
      y: pos.y,
      width: ctaWidth,
      height: ctaHeight,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    layers.push(cta);
  }

  // ─── Layer: Logo ────────────────────────────────────────────
  if (input.logoUrl) {
    const logoSize = 120;
    const pos = resolvePosition(
      layout.logoPosition,
      dimensions.width,
      dimensions.height,
      logoSize,
      logoSize,
    );
    const logo: LogoLayer = {
      id: nanoid(),
      kind: 'logo',
      src: input.logoUrl,
      x: pos.x,
      y: pos.y,
      width: logoSize,
      height: logoSize,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    layers.push(logo);
  }

  return layers;
}
