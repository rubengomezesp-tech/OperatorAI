'use client';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Loader2 } from 'lucide-react';
import { downloadCanvasAsPng, canvasToPngDataUrl } from '../utils/canvas-export';

const SIZES: Record<string, [number, number]> = {
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
};

interface CanvasSpec {
  type: 'canvas_spec';
  layout:
    | 'hero_app'
    | 'feature_grid'
    | 'story_ad'
    | 'minimal_branding'
    | 'ui_focus';
  aspectRatio: '9:16' | '1:1' | '4:5';
  palette: string[];
  mockupType: 'iphone' | 'laptop' | 'none';
  heroUrl?: string;
  supportUrls: string[];
  logoUrl?: string;
  logoPosition: 'top-left' | 'top-right' | 'top-center' | 'bottom-center';
  backgroundUrl?: string;
  isHybrid?: boolean;
  copy: {
    headline: string;
    subheadline: string;
    cta: string;
    bullets?: string[];
  };
}

export interface CanvasSpecRendererHandle {
  download: (filename: string) => Promise<void>;
  toDataUrl: () => Promise<string | null>;
}

interface Props {
  specUrl: string;
  onRendered?: (dataUrl: string) => void;
  className?: string;
}

/**
 * Renders a canvas-spec:// URL using real screenshots.
 * Exposes download + toDataUrl via ref for export/validation.
 * If the URL is http (flux-only), it just renders <img>.
 */
export const CanvasSpecRenderer = forwardRef<CanvasSpecRendererHandle, Props>(
  function CanvasSpecRenderer({ specUrl, onRendered, className }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [isPlainImage, setIsPlainImage] = useState(false);

    const render = useCallback(async () => {
      if (!specUrl) {
        setLoading(false);
        return;
      }

      // If it's a plain http URL, just show it
      if (specUrl.startsWith('http')) {
        setIsPlainImage(true);
        setPreview(specUrl);
        setLoading(false);
        onRendered?.(specUrl);
        return;
      }

      if (!specUrl.startsWith('canvas-spec://')) {
        setError(true);
        setLoading(false);
        return;
      }

      let spec: CanvasSpec;
      try {
        spec = JSON.parse(
          decodeURIComponent(specUrl.replace('canvas-spec://', '')),
        );
      } catch {
        setError(true);
        setLoading(false);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setLoading(true);
      setError(false);
      setIsPlainImage(false);

      const [W, H] = SIZES[spec.aspectRatio] || [1080, 1920];
      canvas.width = W;
      canvas.height = H;

      // Background
      if (spec.backgroundUrl) {
        const bg = await loadImg(spec.backgroundUrl);
        if (bg) {
          const s = Math.max(W / bg.width, H / bg.height);
          ctx.drawImage(
            bg,
            (W - bg.width * s) / 2,
            (H - bg.height * s) / 2,
            bg.width * s,
            bg.height * s,
          );
          // Soft dark overlay to help legibility
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(0, 0, W, H);
        }
      } else {
        ctx.fillStyle = spec.palette?.[0] || '#0a0a0b';
        ctx.fillRect(0, 0, W, H);
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgba(201,168,99,0.08)');
        grad.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      try {
        switch (spec.layout) {
          case 'hero_app':
            await drawHeroApp(ctx, spec, W, H);
            break;
          case 'feature_grid':
            await drawFeatureGrid(ctx, spec, W, H);
            break;
          case 'story_ad':
            await drawStoryAd(ctx, spec, W, H);
            break;
          case 'minimal_branding':
            await drawMinimal(ctx, spec, W, H);
            break;
          case 'ui_focus':
            await drawUIFocus(ctx, spec, W, H);
            break;
          default:
            await drawHeroApp(ctx, spec, W, H);
        }
      } catch (err) {
        console.error('[canvas-spec] draw error:', err);
      }

      const dataUrl = canvas.toDataURL('image/png', 0.9);
      setPreview(dataUrl);
      setLoading(false);
      onRendered?.(dataUrl);
    }, [specUrl, onRendered]);

    useEffect(() => {
      render();
    }, [render]);

    useImperativeHandle(ref, () => ({
      async download(filename: string) {
        if (isPlainImage && preview) {
          // Fetch through anchor (works for public URLs)
          const a = document.createElement('a');
          a.href = preview;
          a.download = filename.endsWith('.png') ? filename : filename + '.png';
          a.rel = 'noopener';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return;
        }
        if (canvasRef.current) {
          await downloadCanvasAsPng(canvasRef.current, filename);
        }
      },
      async toDataUrl() {
        if (isPlainImage) return preview;
        if (canvasRef.current) return canvasToPngDataUrl(canvasRef.current);
        return null;
      },
    }));

    if (error) {
      return (
        <div
          className={className}
          style={{ aspectRatio: '9/16' }}
        >
          <div className="w-full h-full rounded-xl bg-surface-2 flex items-center justify-center text-[10px] text-fg-subtle">
            Render error
          </div>
        </div>
      );
    }

    if (isPlainImage && preview) {
      return (
        <img
          src={preview}
          alt=""
          className={'w-full h-full object-contain rounded-xl ' + (className || '')}
        />
      );
    }

    return (
      <div className={className}>
        <canvas ref={canvasRef} className="hidden" />
        {loading && (
          <div
            className="w-full h-full rounded-xl bg-surface-2 flex items-center justify-center"
            style={{ aspectRatio: '9/16' }}
          >
            <Loader2 className="h-6 w-6 text-gold animate-spin" />
          </div>
        )}
        {!loading && preview && (
          <img
            src={preview}
            alt=""
            className="w-full h-full object-contain rounded-xl"
          />
        )}
      </div>
    );
  },
);

// ═══════════════════════════════════════════════════════════
// Draw helpers
// ═══════════════════════════════════════════════════════════

async function loadImg(url: string): Promise<HTMLImageElement | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('load failed'));
      img.src = url;
    });
    return img;
  } catch {
    return null;
  }
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

interface TextOpts {
  size: number;
  weight: number;
  color: string;
  align: CanvasTextAlign;
  maxWidth?: number;
  family?: string;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  o: TextOpts,
) {
  if (!text) return;
  const family = o.family || 'system-ui, -apple-system, sans-serif';
  ctx.font = o.weight + ' ' + o.size + 'px ' + family;
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 12;
  if (o.maxWidth) wrapText(ctx, text, x, y, o.maxWidth, o.size * 1.15);
  else ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = w + ' ';
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function drawCTA(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  big?: boolean,
) {
  if (!text) return;
  const size = big ? 30 : 22;
  ctx.font = '700 ' + size + 'px system-ui, -apple-system, sans-serif';
  const metrics = ctx.measureText(text);
  const padX = size * 1.4;
  const padY = size * 0.7;
  const w = metrics.width + padX * 2;
  const h = size + padY * 2;
  ctx.fillStyle = '#fff';
  rr(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

async function drawLogo(
  ctx: CanvasRenderingContext2D,
  spec: CanvasSpec,
  W: number,
  H: number,
  size: number = 0.1,
) {
  if (!spec.logoUrl) return;
  const logo = await loadImg(spec.logoUrl);
  if (!logo) return;
  const lw = W * size;
  const ls = lw / logo.width;
  const lh = logo.height * ls;
  const pad = 50;
  const positions: Record<string, [number, number]> = {
    'top-right': [W - lw - pad, pad],
    'top-left': [pad, pad],
    'top-center': [(W - lw) / 2, pad],
    'bottom-center': [(W - lw) / 2, H - lh - pad],
  };
  const [lx, ly] = positions[spec.logoPosition] || positions['top-right'];
  ctx.drawImage(logo, lx, ly, lw, lh);
}

async function drawHeroApp(
  ctx: CanvasRenderingContext2D,
  s: CanvasSpec,
  W: number,
  H: number,
) {
  if (s.heroUrl) {
    const hero = await loadImg(s.heroUrl);
    if (hero) {
      const phoneW = W * 0.55;
      const phoneH = phoneW * 2.16;
      const px = (W - phoneW) / 2;
      const py = H * 0.18;

      // Phone body
      ctx.fillStyle = '#1a1a1a';
      rr(ctx, px - 16, py - 16, phoneW + 32, phoneH + 32, 48);
      ctx.fill();

      // Screen content (clip + draw)
      ctx.save();
      rr(ctx, px, py, phoneW, phoneH, 32);
      ctx.clip();
      const hs = Math.max(phoneW / hero.width, phoneH / hero.height);
      ctx.drawImage(
        hero,
        px + (phoneW - hero.width * hs) / 2,
        py + (phoneH - hero.height * hs) / 2,
        hero.width * hs,
        hero.height * hs,
      );
      ctx.restore();

      // Glow outline
      ctx.shadowColor = 'rgba(201,168,99,0.3)';
      ctx.shadowBlur = 60;
      ctx.strokeStyle = 'rgba(201,168,99,0.3)';
      ctx.lineWidth = 2;
      rr(ctx, px - 16, py - 16, phoneW + 32, phoneH + 32, 48);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  await drawLogo(ctx, s, W, H, 0.12);

  drawText(ctx, s.copy.headline, W / 2, H * 0.82, {
    size: 54,
    weight: 900,
    color: '#fff',
    align: 'center',
    maxWidth: W * 0.85,
  });
  if (s.copy.subheadline) {
    drawText(ctx, s.copy.subheadline, W / 2, H * 0.88, {
      size: 22,
      weight: 400,
      color: 'rgba(255,255,255,0.75)',
      align: 'center',
      maxWidth: W * 0.8,
    });
  }
  if (s.copy.cta) drawCTA(ctx, s.copy.cta, W / 2, H * 0.93);
}

async function drawFeatureGrid(
  ctx: CanvasRenderingContext2D,
  s: CanvasSpec,
  W: number,
  H: number,
) {
  drawText(ctx, s.copy.headline, W / 2, H * 0.1, {
    size: 50,
    weight: 900,
    color: '#fff',
    align: 'center',
    maxWidth: W * 0.85,
  });

  const assets = [s.heroUrl, ...s.supportUrls]
    .filter((u): u is string => Boolean(u))
    .slice(0, 3);
  const gridY = H * 0.2;
  const gridH = H * 0.45;
  const cols = Math.max(assets.length, 1);
  const sidePad = 60;
  const gap = 20;
  const cellW = (W - sidePad * 2 - (cols - 1) * gap) / cols;

  for (let i = 0; i < assets.length; i++) {
    const img = await loadImg(assets[i]);
    if (!img) continue;
    const cx = sidePad + i * (cellW + gap);
    const cy = gridY;
    ctx.save();
    rr(ctx, cx, cy, cellW, gridH, 20);
    ctx.clip();
    const sc = Math.min(cellW / img.width, gridH / img.height);
    const iw = img.width * sc;
    const ih = img.height * sc;
    ctx.drawImage(img, cx + (cellW - iw) / 2, cy + (gridH - ih) / 2, iw, ih);
    ctx.restore();
    ctx.strokeStyle = 'rgba(201,168,99,0.3)';
    ctx.lineWidth = 2;
    rr(ctx, cx, cy, cellW, gridH, 20);
    ctx.stroke();

    if (s.copy.bullets?.[i]) {
      drawText(ctx, s.copy.bullets[i], cx + cellW / 2, gridY + gridH + 36, {
        size: 20,
        weight: 600,
        color: '#fff',
        align: 'center',
      });
    }
  }

  await drawLogo(ctx, s, W, H, 0.09);
  if (s.copy.cta) drawCTA(ctx, s.copy.cta, W / 2, H * 0.92);
}

async function drawStoryAd(
  ctx: CanvasRenderingContext2D,
  s: CanvasSpec,
  W: number,
  H: number,
) {
  drawText(ctx, s.copy.headline, W / 2, H * 0.42, {
    size: 78,
    weight: 900,
    color: '#fff',
    align: 'center',
    maxWidth: W * 0.85,
  });
  if (s.copy.subheadline) {
    drawText(ctx, s.copy.subheadline, W / 2, H * 0.56, {
      size: 26,
      weight: 400,
      color: 'rgba(255,255,255,0.85)',
      align: 'center',
      maxWidth: W * 0.8,
    });
  }
  if (s.copy.cta) drawCTA(ctx, s.copy.cta, W / 2, H * 0.78, true);
  await drawLogo(ctx, s, W, H, 0.1);
}

async function drawMinimal(
  ctx: CanvasRenderingContext2D,
  s: CanvasSpec,
  W: number,
  H: number,
) {
  drawText(ctx, s.copy.headline, W / 2, H / 2, {
    size: 62,
    weight: 300,
    color: '#fff',
    align: 'center',
    maxWidth: W * 0.7,
    family: 'Georgia, serif',
  });
  await drawLogo(ctx, s, W, H, 0.1);
  if (s.copy.cta) drawCTA(ctx, s.copy.cta, W / 2, H * 0.86);
}

async function drawUIFocus(
  ctx: CanvasRenderingContext2D,
  s: CanvasSpec,
  W: number,
  H: number,
) {
  if (s.heroUrl) {
    const hero = await loadImg(s.heroUrl);
    if (hero) {
      const mw = W * 0.85;
      const mh = H * 0.72;
      const sc = Math.min(mw / hero.width, mh / hero.height);
      const hw = hero.width * sc;
      const hh = hero.height * sc;
      ctx.save();
      rr(ctx, (W - hw) / 2, (H - hh) / 2 - H * 0.03, hw, hh, 20);
      ctx.clip();
      ctx.drawImage(hero, (W - hw) / 2, (H - hh) / 2 - H * 0.03, hw, hh);
      ctx.restore();
      ctx.shadowColor = 'rgba(201,168,99,0.3)';
      ctx.shadowBlur = 80;
      ctx.strokeStyle = 'rgba(201,168,99,0.2)';
      ctx.lineWidth = 2;
      rr(ctx, (W - hw) / 2, (H - hh) / 2 - H * 0.03, hw, hh, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  if (s.copy.headline) {
    drawText(ctx, s.copy.headline, W / 2, H * 0.93, {
      size: 22,
      weight: 400,
      color: 'rgba(255,255,255,0.7)',
      align: 'center',
      maxWidth: W * 0.8,
    });
  }
  await drawLogo(ctx, s, W, H, 0.08);
}
