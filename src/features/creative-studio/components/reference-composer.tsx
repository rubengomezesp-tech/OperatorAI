'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Classification { index: number; type: string; description: string; }
interface Props {
  imageUrls: string[];
  classifications: Classification[];
  onComposed: (dataUrl: string) => void;
}

const W = 1080;
const H = 1920;
const PAD = 40;
const BG = '#0A0A0B';
const SIZES: Record<string, [number, number]> = {
 '9:16': [1080, 1920],
 '1:1': [1080, 1080],
 '4:5': [1080, 1350],
};

/**
 * Deterministic canvas composer.
 * Positions real images based on classification:
 * - logo → top-right, small
 * - product → center, large
 * - ui/screenshot → bottom grid
 * - lifestyle → background fill
 * - support → small accents
 */
export function ReferenceComposer({ imageUrls, classifications, aspectRatio, onComposed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    compose();
  }, [imageUrls, classifications]);

  async function compose() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CW, CH);

    // Subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, 'rgba(201,168,99,0.06)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(201,168,99,0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    // Load all images
    const loaded: { img: HTMLImageElement; cls: Classification }[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej();
          img.src = imageUrls[i];
        });
        const cls = classifications.find(c => c.index === i + 1) || { index: i+1, type: 'support', description: '' };
        loaded.push({ img, cls });
      } catch {}
    }

    // Sort by type priority
    const logos = loaded.filter(l => l.cls.type === 'logo');
    const products = loaded.filter(l => l.cls.type === 'product');
    const uis = loaded.filter(l => ['ui', 'screenshot'].includes(l.cls.type));
    const lifestyles = loaded.filter(l => l.cls.type === 'lifestyle');
    const supports = loaded.filter(l => l.cls.type === 'support');

    // LIFESTYLE → background fill (if any)
    if (lifestyles.length > 0) {
      const bg = lifestyles[0].img;
      const scale = Math.max(CW / bg.width, CH / bg.height);
      const sw = bg.width * scale;
      const sh = bg.height * scale;
      ctx.globalAlpha = 0.3;
      ctx.drawImage(bg, (CW - sw) / 2, (CH - sh) / 2, sw, sh);
      ctx.globalAlpha = 1;
      // Darken overlay
      ctx.fillStyle = 'rgba(10,10,11,0.7)';
      ctx.fillRect(0, 0, CW, CH);
    }

    // PRODUCT → center, 60% width
    if (products.length > 0) {
      const p = products[0].img;
      const maxW = CW * 0.6;
      const maxH = CH * 0.4;
      const scale = Math.min(maxW / p.width, maxH / p.height);
      const pw = p.width * scale;
      const ph = p.height * scale;
      const px = (CW - pw) / 2;
      const py = (CH - ph) / 2 - 60;

      // Subtle shadow
      ctx.shadowColor = 'rgba(201,168,99,0.2)';
      ctx.shadowBlur = 40;
      ctx.drawImage(p, px, py, pw, ph);
      ctx.shadowBlur = 0;
    }

    // LOGO → top-right
    if (logos.length > 0) {
      const l = logos[0].img;
      const maxS = CW * 0.15;
      const scale = Math.min(maxS / l.width, maxS / l.height);
      const lw = l.width * scale;
      const lh = l.height * scale;
      ctx.drawImage(l, CW - lw - PAD, PAD, lw, lh);
    }

    // UI/SCREENSHOTS → bottom grid
    if (uis.length > 0) {
      const gridY = CH * 0.72;
      const gridH = CH * 0.22;
      const cols = Math.min(uis.length, 3);
      const cellW = (CW - PAD * 2 - (cols - 1) * 12) / cols;
      const cellH = gridH;

      uis.slice(0, 3).forEach((u, i) => {
        const scale = Math.min(cellW / u.img.width, cellH / u.img.height);
        const uw = u.img.width * scale;
        const uh = u.img.height * scale;
        const ux = PAD + i * (cellW + 12) + (cellW - uw) / 2;
        const uy = gridY + (cellH - uh) / 2;

        // Rounded clip
        ctx.save();
        roundedRect(ctx, ux, uy, uw, uh, 12);
        ctx.clip();
        ctx.drawImage(u.img, ux, uy, uw, uh);
        ctx.restore();

        // Border
        ctx.strokeStyle = 'rgba(201,168,99,0.2)';
        ctx.lineWidth = 1;
        roundedRect(ctx, ux, uy, uw, uh, 12);
        ctx.stroke();
      });
    }

    // SUPPORT → small accents, top-left area
    supports.slice(0, 2).forEach((s, i) => {
      const maxS = CW * 0.1;
      const scale = Math.min(maxS / s.img.width, maxS / s.img.height);
      const sw2 = s.img.width * scale;
      const sh2 = s.img.height * scale;
      ctx.globalAlpha = 0.7;
      ctx.drawImage(s.img, PAD + i * (sw2 + 8), PAD, sw2, sh2);
      ctx.globalAlpha = 1;
    });

    // Export
    const url = canvas.toDataURL('image/png', 0.9);
    setPreviewUrl(url);
    setLoading(false);
    onComposed(url);
  }

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="hidden" />
      {loading ? (
        <div className="aspect-[9/16] max-h-[400px] rounded-xl border border-border bg-surface-2 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-gold animate-spin" />
        </div>
      ) : previewUrl ? (
        <img src={previewUrl} alt="Composed" className="w-full max-h-[400px] object-contain rounded-xl border border-border" />
      ) : null}
    </div>
  );
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
