// ═══════════════════════════════════════════════════════════════════
// Application Styles — print/embroidery/patch/vinyl
// ═══════════════════════════════════════════════════════════════════

import type { ApplicationStyle, ApplicationStyleSpec } from '../types';

export const APPLICATION_STYLES: Record<ApplicationStyle, ApplicationStyleSpec> = {
  print: {
    id: 'print',
    name: 'Print',
    description: 'Flat screen print, crisp edges, adapts to fabric color',
    tagColor: '#00d4ff',
    rendering: {
      fabricBlend: 0.25,
      surface: 'flat',
      shadowIntensity: 0.05,
      saturationBoost: 0,
      edgeSharpness: 'sharp',
      grainAmount: 0.08,
    },
  },
  embroidery: {
    id: 'embroidery',
    name: 'Embroidery',
    description: 'Raised stitching, textured surface, reduced detail',
    tagColor: '#c9a863',
    rendering: {
      fabricBlend: 0.15,
      surface: 'embossed',
      shadowIntensity: 0.35,
      saturationBoost: -0.1,
      edgeSharpness: 'medium',
      grainAmount: 0.35,
    },
  },
  patch: {
    id: 'patch',
    name: 'Patch',
    description: 'Sewn-on patch with visible edge, strong drop shadow',
    tagColor: '#ff9500',
    rendering: {
      fabricBlend: 0.05,
      surface: 'raised',
      shadowIntensity: 0.5,
      saturationBoost: 0.1,
      edgeSharpness: 'sharp',
      grainAmount: 0.1,
    },
  },
  vinyl: {
    id: 'vinyl',
    name: 'Vinyl / Heat transfer',
    description: 'Glossy plastic surface, saturated colors, slight sheen',
    tagColor: '#af52de',
    rendering: {
      fabricBlend: 0,
      surface: 'glossy',
      shadowIntensity: 0.15,
      saturationBoost: 0.2,
      edgeSharpness: 'sharp',
      grainAmount: 0,
    },
  },
};

export const ALL_APPLICATION_STYLES: ApplicationStyle[] = [
  'print', 'embroidery', 'patch', 'vinyl',
];

/** Prompt keywords for fal.ai */
export function styleToPromptKeywords(style: ApplicationStyle): string {
  switch (style) {
    case 'print':
      return 'screen printed design on fabric, flat finish, fabric texture showing through, crisp edges';
    case 'embroidery':
      return 'embroidered design with raised stitching, textured thread, matte finish, slightly soft edges from thread weave';
    case 'patch':
      return 'woven patch sewn onto fabric, visible border stitching, raised surface, sharp edges, fabric texture on the patch itself';
    case 'vinyl':
      return 'heat transfer vinyl print, slightly glossy plastic finish, saturated color, smooth surface, subtle sheen catching light';
    default:
      return 'printed on fabric';
  }
}
