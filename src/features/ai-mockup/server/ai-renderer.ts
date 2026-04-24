import 'server-only';
import { falFluxFill, FalError, isFalAvailable } from './fal-client';
import { styleToPromptKeywords } from '../data/application-styles';
import { resolvePlacement } from '../data/garment-presets';
import type {
  MockupJobInput,
  GarmentType,
  PlacementZone,
  CustomPlacement,
  ApplicationStyle,
} from '../types';

export interface AiRenderOutput {
  imageUrl: string;
  engine: 'fal_flux_fill';
  promptUsed: string;
  costUsd: number;
}

export async function renderWithFalAi(
  input: MockupJobInput,
  maskUrl: string,
): Promise<AiRenderOutput> {
  if (!isFalAvailable()) {
    throw new FalError('NO_API_KEY', 'fal.ai not configured');
  }

  const prompt = buildMockupPrompt(
    input.applicationStyle,
    input.garmentType,
    input.placement,
    input.customPlacement,
  );

  const result = await falFluxFill({
    imageUrl: input.garmentUrl,
    maskUrl,
    prompt,
    strength: 0.85,
  });

  console.log('[ai-renderer] success', { cost: result.estimatedCostUsd });

  return {
    imageUrl: result.imageUrl,
    engine: 'fal_flux_fill',
    promptUsed: prompt,
    costUsd: result.estimatedCostUsd,
  };
}

function buildMockupPrompt(
  style: ApplicationStyle,
  garmentType: GarmentType,
  placement: PlacementZone,
  custom?: CustomPlacement,
): string {
  const styleKeywords = styleToPromptKeywords(style);
  const garmentDesc = garmentToPhrase(garmentType);
  const zoneDesc = custom ? 'specified area' : zoneToPhrase(placement);

  return [
    `Professional product photograph of ${garmentDesc}.`,
    `A logo design applied on the ${zoneDesc}.`,
    styleKeywords + '.',
    'The logo integrates naturally with the fabric: realistic fabric texture visible through the design, proper lighting consistent with the rest of the garment, subtle shadow where the design meets the fabric.',
    'The design matches the existing lighting direction and fabric shading of the garment.',
    'Photographic quality, commercial product photography, sharp detail, realistic depth.',
    'Do not distort the garment shape. Do not change the garment color. Do not add additional text or elements.',
  ].join(' ');
}

function garmentToPhrase(g: GarmentType): string {
  switch (g) {
    case 'tshirt_front': return 'a t-shirt shown from the front';
    case 'tshirt_back': return 'a t-shirt shown from the back';
    case 'hoodie': return 'a hoodie';
    case 'cap': return 'a cap';
    case 'tote': return 'a tote bag';
    default: return 'an apparel item';
  }
}

function zoneToPhrase(z: PlacementZone): string {
  switch (z) {
    case 'chest': return 'chest area';
    case 'sleeve': return 'sleeve';
    case 'back': return 'back';
    case 'front': return 'front panel';
    case 'side': return 'side panel';
    case 'center': return 'center';
    case 'custom': return 'specified area';
    default: return 'surface';
  }
}

/**
 * Server-side mask generation. Requires `sharp`.
 * Returns PNG buffer caller can upload to Supabase.
 */
export async function generateMaskBuffer(opts: {
  garmentWidth: number;
  garmentHeight: number;
  garmentType: GarmentType;
  placement: PlacementZone;
  customPlacement?: CustomPlacement;
}): Promise<Buffer> {
  const { garmentWidth: W, garmentHeight: H, garmentType, placement, customPlacement } = opts;

  const preset = customPlacement
    ? {
        x: customPlacement.x,
        y: customPlacement.y,
        width: customPlacement.width,
        height: customPlacement.height,
      }
    : resolvePlacement(garmentType, placement);

  const zoneCx = preset.x * W;
  const zoneCy = preset.y * H;
  const zoneW = preset.width * W;
  const zoneH = preset.height * H;

  const left = Math.max(0, Math.round(zoneCx - zoneW / 2));
  const top = Math.max(0, Math.round(zoneCy - zoneH / 2));
  const right = Math.min(W, Math.round(zoneCx + zoneW / 2));
  const bottom = Math.min(H, Math.round(zoneCy + zoneH / 2));

  try {
    const sharp = (await import('sharp')).default;

    const pixelCount = W * H;
    const raw = Buffer.alloc(pixelCount * 4);
    for (let i = 0; i < pixelCount; i++) {
      raw[i * 4 + 3] = 255;
    }
    for (let y = top; y < bottom; y++) {
      for (let x = left; x < right; x++) {
        const idx = (y * W + x) * 4;
        raw[idx] = 255;
        raw[idx + 1] = 255;
        raw[idx + 2] = 255;
      }
    }

    return await sharp(raw, { raw: { width: W, height: H, channels: 4 } })
      .png()
      .toBuffer();
  } catch (err) {
    throw new Error(
      'Mask generation requires sharp. Install: pnpm add sharp. Details: ' +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}
