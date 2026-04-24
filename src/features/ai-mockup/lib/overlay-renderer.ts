// ═══════════════════════════════════════════════════════════════════
// Overlay Renderer — client-side Canvas 2D
// ═══════════════════════════════════════════════════════════════════

import type {
  GarmentType,
  PlacementZone,
  CustomPlacement,
  ApplicationStyle,
  MockupControls,
} from '../types';
import { resolvePlacement } from '../data/garment-presets';
import { APPLICATION_STYLES } from '../data/application-styles';

export interface OverlayInput {
  garmentUrl: string;
  logoUrl: string;
  garmentType: GarmentType;
  placement: PlacementZone;
  customPlacement?: CustomPlacement;
  applicationStyle: ApplicationStyle;
  controls: MockupControls;
}

export async function renderOverlay(input: OverlayInput): Promise<HTMLCanvasElement> {
  const [garment, logo] = await Promise.all([
    loadImg(input.garmentUrl),
    loadImg(input.logoUrl),
  ]);

  const W = garment.naturalWidth;
  const H = garment.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.drawImage(garment, 0, 0, W, H);

  const preset = input.customPlacement
    ? {
        id: 'custom',
        name: 'Custom',
        zone: 'custom' as PlacementZone,
        x: input.customPlacement.x,
        y: input.customPlacement.y,
        width: input.customPlacement.width,
        height: input.customPlacement.height,
        rotation: input.customPlacement.rotation,
        curvature: 0.1,
      }
    : resolvePlacement(input.garmentType, input.placement);

  const zoneX = preset.x * W;
  const zoneY = preset.y * H;
  const zoneW = preset.width * W;
  const zoneH = preset.height * H;

  const styleSpec = APPLICATION_STYLES[input.applicationStyle];
  const processedLogo = await processLogo(logo, styleSpec, input.controls);

  const logoAspect = processedLogo.width / processedLogo.height;
  const zoneAspect = zoneW / zoneH;
  let drawW = zoneW;
  let drawH = zoneH;
  if (logoAspect > zoneAspect) drawH = zoneW / logoAspect;
  else drawW = zoneH * logoAspect;

  const sampleData = sampleZoneLighting(ctx, zoneX, zoneY, zoneW, zoneH);

  ctx.save();
  ctx.translate(zoneX, zoneY);
  if (preset.rotation !== 0) ctx.rotate((preset.rotation * Math.PI) / 180);
  if (preset.curvature > 0) ctx.transform(1, preset.curvature * 0.05, 0, 1, 0, 0);

  const { surface, shadowIntensity } = styleSpec.rendering;
  const { depth, integration, texture } = input.controls;

  // Drop shadow for raised / embossed / glossy
  if (shadowIntensity > 0.05 && (surface === 'raised' || surface === 'glossy' || surface === 'embossed')) {
    ctx.save();
    ctx.shadowColor = `rgba(0,0,0,${shadowIntensity * (0.6 + depth * 0.4)})`;
    ctx.shadowBlur = 6 + depth * 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 + depth * 4;
    ctx.drawImage(processedLogo, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // Main logo
  ctx.save();
  if (surface === 'flat') {
    ctx.globalCompositeOperation = integration > 0.3 ? 'multiply' : 'source-over';
    ctx.globalAlpha = 0.92 - integration * 0.15;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = surface === 'embossed' ? 0.95 : 1;
  }
  ctx.drawImage(processedLogo, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Glossy sheen for vinyl
  if (surface === 'glossy') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.12 + texture * 0.1;
    const sheen = ctx.createLinearGradient(-drawW / 2, -drawH / 2, drawW / 2, drawH / 2);
    sheen.addColorStop(0, 'rgba(255,255,255,0)');
    sheen.addColorStop(0.5, 'rgba(255,255,255,0.7)');
    sheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  // Embroidery emboss
  if (surface === 'embossed') {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.3 * (0.5 + depth * 0.5);
    ctx.drawImage(processedLogo, -drawW / 2 - 1, -drawH / 2 - 1, drawW, drawH);
    ctx.restore();
  }

  // Fabric-color integration tint
  if (integration > 0.4 && surface !== 'raised' && surface !== 'glossy') {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = (integration - 0.4) * 0.6;
    ctx.fillStyle = `rgb(${Math.round(sampleData.avgR)}, ${Math.round(sampleData.avgG)}, ${Math.round(sampleData.avgB)})`;
    ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  ctx.restore();

  if (texture > 0.1) {
    applyTextureOverlay(
      ctx,
      zoneX - drawW / 2,
      zoneY - drawH / 2,
      drawW,
      drawH,
      texture,
      styleSpec.rendering.grainAmount,
    );
  }

  return canvas;
}

async function processLogo(
  logo: HTMLImageElement,
  styleSpec: typeof APPLICATION_STYLES[keyof typeof APPLICATION_STYLES],
  controls: MockupControls,
): Promise<HTMLCanvasElement> {
  const c = document.createElement('canvas');
  c.width = logo.naturalWidth;
  c.height = logo.naturalHeight;
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.drawImage(logo, 0, 0);

  if (styleSpec.rendering.saturationBoost !== 0) {
    const img = ctx.getImageData(0, 0, c.width, c.height);
    adjustSaturation(img.data, styleSpec.rendering.saturationBoost);
    ctx.putImageData(img, 0, 0);
  }

  if (styleSpec.rendering.edgeSharpness === 'medium') {
    const b = document.createElement('canvas');
    b.width = c.width;
    b.height = c.height;
    const bctx = b.getContext('2d');
    if (bctx) {
      bctx.filter = 'blur(0.5px)';
      bctx.drawImage(c, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(b, 0, 0);
    }
  }

  if (styleSpec.rendering.grainAmount > 0.05) {
    applyGrain(ctx, c.width, c.height, styleSpec.rendering.grainAmount * (0.5 + controls.texture * 0.5));
  }

  return c;
}

function adjustSaturation(data: Uint8ClampedArray, amount: number) {
  const factor = 1 + amount;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
    data[i] = clamp(gray + (r - gray) * factor);
    data[i + 1] = clamp(gray + (g - gray) * factor);
    data[i + 2] = clamp(gray + (b - gray) * factor);
  }
}

function applyGrain(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const intensity = amount * 25;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (Math.random() - 0.5) * intensity;
    d[i] = clamp(d[i] + n);
    d[i + 1] = clamp(d[i + 1] + n);
    d[i + 2] = clamp(d[i + 2] + n);
  }
  ctx.putImageData(img, 0, 0);
}

function applyTextureOverlay(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  intensity: number, grainBase: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = intensity * 0.3;
  const step = 3;
  ctx.strokeStyle = `rgba(255,255,255,${grainBase})`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i < w; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + h);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(0,0,0,${grainBase * 0.5})`;
  for (let j = 0; j < h; j += step) {
    ctx.beginPath();
    ctx.moveTo(x, y + j);
    ctx.lineTo(x + w, y + j);
    ctx.stroke();
  }
  ctx.restore();
}

function sampleZoneLighting(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
) {
  const sx = Math.max(0, Math.floor(cx - w / 2));
  const sy = Math.max(0, Math.floor(cy - h / 2));
  const sw = Math.min(w, ctx.canvas.width - sx);
  const sh = Math.min(h, ctx.canvas.height - sy);
  if (sw <= 0 || sh <= 0) return { avgR: 128, avgG: 128, avgB: 128, avgBrightness: 0.5 };

  try {
    const img = ctx.getImageData(sx, sy, Math.floor(sw), Math.floor(sh));
    let r = 0, g = 0, b = 0, n = 0;
    const data = img.data;
    for (let i = 0; i < data.length; i += 16) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (n === 0) return { avgR: 128, avgG: 128, avgB: 128, avgBrightness: 0.5 };
    return {
      avgR: r / n,
      avgG: g / n,
      avgB: b / n,
      avgBrightness: (r / n + g / n + b / n) / (3 * 255),
    };
  } catch {
    return { avgR: 128, avgG: 128, avgB: 128, avgBrightness: 0.5 };
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
    setTimeout(() => reject(new Error('Image timeout')), 15000);
  });
}

export async function renderOverlayToBlob(input: OverlayInput): Promise<Blob> {
  const canvas = await renderOverlay(input);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/png',
      0.95,
    );
  });
}

export async function renderOverlayToDataUrl(input: OverlayInput): Promise<string> {
  const canvas = await renderOverlay(input);
  return canvas.toDataURL('image/png', 0.95);
}
