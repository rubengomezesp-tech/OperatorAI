/**
 * Editor Pro — Type definitions
 *
 * The editor works on a Project (a single variant being edited).
 * A Project has Layers stacked from background to foreground.
 *
 * Layer 0 (background) is always the AI-generated image.
 * Other layers (text, logo, shapes) are overlaid on top and are
 * fully editable.
 */

import type { VerticalSlug } from '@/features/campaign-brain/types';

// ─────────────────────────────────────────────────────────────────
// Layer types
// ─────────────────────────────────────────────────────────────────

export type LayerKind = 'image' | 'text' | 'logo' | 'shape';

export interface BaseLayer {
  id: string;
  kind: LayerKind;
  /** position relative to canvas (0..1 normalized so it scales) */
  x: number;
  y: number;
  /** size in pixels at canvas-1024 reference */
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface ImageLayer extends BaseLayer {
  kind: 'image';
  src: string;
  /** if true, this is the background and cannot be moved */
  isBackground: boolean;
}

export interface TextLayer extends BaseLayer {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fill: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  /** stroke / outline */
  stroke?: string;
  strokeWidth?: number;
  /** drop shadow */
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface LogoLayer extends BaseLayer {
  kind: 'logo';
  src: string;
}

export interface ShapeLayer extends BaseLayer {
  kind: 'shape';
  shapeType: 'rect' | 'circle' | 'line';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export type Layer = ImageLayer | TextLayer | LogoLayer | ShapeLayer;

// ─────────────────────────────────────────────────────────────────
// Canvas / Project
// ─────────────────────────────────────────────────────────────────

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export const ASPECT_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number }
> = {
  '1:1': { width: 1024, height: 1024 },
  '4:5': { width: 1024, height: 1280 },
  '9:16': { width: 1024, height: 1820 },
  '16:9': { width: 1820, height: 1024 },
};

export interface EditorProject {
  variantId: string;
  draftId: string;
  vertical: VerticalSlug;
  aspectRatio: AspectRatio;
  layers: Layer[];
  /** undo/redo history */
  history: Layer[][];
  historyIndex: number;
}

// ─────────────────────────────────────────────────────────────────
// Auto-load from Brain output
// ─────────────────────────────────────────────────────────────────

export interface AutoLayoutInput {
  variantId: string;
  draftId: string;
  imageUrl: string;
  vertical: VerticalSlug;
  aspectRatio: AspectRatio;
  /** from brain output */
  headline?: string;
  body?: string;
  cta?: string;
  logoUrl?: string;
  /** brand colors */
  brandPrimary?: string;
  brandSecondary?: string;
}
