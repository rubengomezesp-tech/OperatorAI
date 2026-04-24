// ═══════════════════════════════════════════════════════════════════
// Garment Presets
// Normalized (0-1) placement coords for each garment type.
// Used by overlay engine and UI hotspot picker.
// ═══════════════════════════════════════════════════════════════════

import type { GarmentPreset, PlacementPreset } from '../types';

// ─── T-SHIRT FRONT ──────────────────────────────────────────
const TSHIRT_FRONT_PLACEMENTS: PlacementPreset[] = [
  {
    id: 'tshirt_front_chest',
    name: 'Chest',
    zone: 'chest',
    x: 0.5,
    y: 0.38,
    width: 0.24,
    height: 0.24,
    rotation: 0,
    curvature: 0.1,
  },
  {
    id: 'tshirt_front_chest_small',
    name: 'Chest (small logo)',
    zone: 'chest',
    x: 0.32,
    y: 0.32,
    width: 0.1,
    height: 0.1,
    rotation: 0,
    curvature: 0.05,
  },
  {
    id: 'tshirt_front_sleeve',
    name: 'Left sleeve',
    zone: 'sleeve',
    x: 0.17,
    y: 0.33,
    width: 0.08,
    height: 0.08,
    rotation: -8,
    curvature: 0.3,
  },
  {
    id: 'tshirt_front_center',
    name: 'Center full',
    zone: 'center',
    x: 0.5,
    y: 0.45,
    width: 0.38,
    height: 0.38,
    rotation: 0,
    curvature: 0.05,
  },
];

// ─── T-SHIRT BACK ───────────────────────────────────────────
const TSHIRT_BACK_PLACEMENTS: PlacementPreset[] = [
  {
    id: 'tshirt_back_upper',
    name: 'Upper back',
    zone: 'back',
    x: 0.5,
    y: 0.22,
    width: 0.28,
    height: 0.1,
    rotation: 0,
    curvature: 0.05,
  },
  {
    id: 'tshirt_back_center',
    name: 'Center back',
    zone: 'back',
    x: 0.5,
    y: 0.45,
    width: 0.42,
    height: 0.38,
    rotation: 0,
    curvature: 0.05,
  },
  {
    id: 'tshirt_back_neck',
    name: 'Neck label',
    zone: 'back',
    x: 0.5,
    y: 0.1,
    width: 0.12,
    height: 0.04,
    rotation: 0,
    curvature: 0,
  },
];

// ─── HOODIE ─────────────────────────────────────────────────
const HOODIE_PLACEMENTS: PlacementPreset[] = [
  {
    id: 'hoodie_chest',
    name: 'Chest',
    zone: 'chest',
    x: 0.5,
    y: 0.34,
    width: 0.2,
    height: 0.2,
    rotation: 0,
    curvature: 0.1,
  },
  {
    id: 'hoodie_chest_small',
    name: 'Chest (small)',
    zone: 'chest',
    x: 0.32,
    y: 0.3,
    width: 0.08,
    height: 0.08,
    rotation: 0,
    curvature: 0.05,
  },
  {
    id: 'hoodie_sleeve',
    name: 'Sleeve',
    zone: 'sleeve',
    x: 0.16,
    y: 0.38,
    width: 0.08,
    height: 0.08,
    rotation: -10,
    curvature: 0.3,
  },
  {
    id: 'hoodie_hood',
    name: 'Hood',
    zone: 'front',
    x: 0.5,
    y: 0.13,
    width: 0.1,
    height: 0.05,
    rotation: 0,
    curvature: 0.2,
  },
];

// ─── CAP ────────────────────────────────────────────────────
const CAP_PLACEMENTS: PlacementPreset[] = [
  {
    id: 'cap_front',
    name: 'Front panel',
    zone: 'front',
    x: 0.5,
    y: 0.52,
    width: 0.3,
    height: 0.2,
    rotation: 0,
    curvature: 0.2,
  },
  {
    id: 'cap_side',
    name: 'Side panel',
    zone: 'side',
    x: 0.28,
    y: 0.52,
    width: 0.15,
    height: 0.12,
    rotation: 0,
    curvature: 0.4,
  },
  {
    id: 'cap_back',
    name: 'Back strap',
    zone: 'back',
    x: 0.5,
    y: 0.62,
    width: 0.12,
    height: 0.05,
    rotation: 0,
    curvature: 0.15,
  },
];

// ─── TOTE BAG ───────────────────────────────────────────────
const TOTE_PLACEMENTS: PlacementPreset[] = [
  {
    id: 'tote_center',
    name: 'Center',
    zone: 'center',
    x: 0.5,
    y: 0.5,
    width: 0.4,
    height: 0.3,
    rotation: 0,
    curvature: 0.05,
  },
  {
    id: 'tote_large',
    name: 'Large center',
    zone: 'center',
    x: 0.5,
    y: 0.5,
    width: 0.6,
    height: 0.5,
    rotation: 0,
    curvature: 0.02,
  },
  {
    id: 'tote_top',
    name: 'Upper center',
    zone: 'center',
    x: 0.5,
    y: 0.3,
    width: 0.35,
    height: 0.12,
    rotation: 0,
    curvature: 0.02,
  },
];

// ─── GARMENT PRESETS EXPORT ─────────────────────────────────

export const GARMENT_PRESETS: Record<GarmentPreset['id'], GarmentPreset> = {
  tshirt_front: {
    id: 'tshirt_front',
    name: 'T-shirt (front)',
    category: 'apparel',
    preferredAspectRatio: 'portrait',
    placements: TSHIRT_FRONT_PLACEMENTS,
  },
  tshirt_back: {
    id: 'tshirt_back',
    name: 'T-shirt (back)',
    category: 'apparel',
    preferredAspectRatio: 'portrait',
    placements: TSHIRT_BACK_PLACEMENTS,
  },
  hoodie: {
    id: 'hoodie',
    name: 'Hoodie',
    category: 'apparel',
    preferredAspectRatio: 'portrait',
    placements: HOODIE_PLACEMENTS,
  },
  cap: {
    id: 'cap',
    name: 'Cap',
    category: 'accessory',
    preferredAspectRatio: 'landscape',
    placements: CAP_PLACEMENTS,
  },
  tote: {
    id: 'tote',
    name: 'Tote Bag',
    category: 'bag',
    preferredAspectRatio: 'square',
    placements: TOTE_PLACEMENTS,
  },
};

export const ALL_GARMENT_TYPES: Array<GarmentPreset['id']> = [
  'tshirt_front',
  'tshirt_back',
  'hoodie',
  'cap',
  'tote',
];

/** Given a garment + zone selection, return the best matching preset */
export function resolvePlacement(
  garmentType: GarmentPreset['id'],
  zone: PlacementPreset['zone'],
): PlacementPreset {
  const preset = GARMENT_PRESETS[garmentType];
  const match = preset.placements.find((p) => p.zone === zone);
  return match ?? preset.placements[0];
}
