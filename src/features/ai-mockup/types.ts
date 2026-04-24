// ═══════════════════════════════════════════════════════════════════
// AI Mockup — Type System
// ═══════════════════════════════════════════════════════════════════

export type GarmentType = 'tshirt_front' | 'tshirt_back' | 'hoodie' | 'cap' | 'tote';

export type PlacementZone =
  | 'chest'
  | 'sleeve'
  | 'back'
  | 'front'
  | 'side'
  | 'center'
  | 'custom';

export type ApplicationStyle = 'print' | 'embroidery' | 'patch' | 'vinyl';

export type MockupMode = 'exact_overlay' | 'ai_integrated';

export type MockupStatus = 'pending' | 'processing' | 'done' | 'failed';

export type MockupEngine = 'overlay' | 'fal_flux_fill' | 'flux' | 'fallback_overlay';

/** Custom placement when user drags logo to specific coords */
export interface CustomPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PlacementPreset {
  id: string;
  name: string;
  zone: PlacementZone;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  curvature: number;
}

export interface GarmentPreset {
  id: GarmentType;
  name: string;
  category: 'apparel' | 'accessory' | 'bag';
  preferredAspectRatio: 'square' | 'portrait' | 'landscape';
  placements: PlacementPreset[];
}

export interface ApplicationStyleSpec {
  id: ApplicationStyle;
  name: string;
  description: string;
  tagColor: string;
  rendering: {
    fabricBlend: number;
    surface: 'flat' | 'raised' | 'embossed' | 'glossy';
    shadowIntensity: number;
    saturationBoost: number;
    edgeSharpness: 'soft' | 'medium' | 'sharp';
    grainAmount: number;
  };
}

export interface MockupControls {
  depth: number;
  integration: number;
  texture: number;
}

export interface MockupJobInput {
  logoUrl: string;
  garmentUrl: string;
  garmentType: GarmentType;
  placement: PlacementZone;
  customPlacement?: CustomPlacement;
  applicationStyle: ApplicationStyle;
  mode: MockupMode;
  controls: MockupControls;
}

export interface MockupJobResult {
  resultUrl: string;
  engineUsed: MockupEngine;
  fallbackUsed: boolean;
  preservationScore?: number;
  latencyMs: number;
}

export interface MockupJob extends MockupJobInput {
  id: string;
  userId: string;
  orgId: string;
  status: MockupStatus;
  result?: MockupJobResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreservationReport {
  score: number;
  passed: boolean;
  threshold: number;
  method: 'phash' | 'pixel_diff' | 'skipped';
}
