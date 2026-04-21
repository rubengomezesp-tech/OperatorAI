'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Classification { index: number; type: string; description: string; }
interface Props {
  imageUrls: string[];
  classifications: Classification[];
  aspectRatio: '9:16' | '1:1' | '4:5';
  onComposed: (dataUrl: string) => void;
}

const SIZES: Record<string, [number, number]> = {
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
};

export function ReferenceComposer({ imageUrls, classifications, aspectRatio, onComposed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => { compose(); }, [imageUrls, classifications, aspectRatio]);

  async function compose() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    const [W, H] = SIZES[aspectRatio] || [1080, 1920];
    const PAD = 40;

    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(201,168,99,0.06)');
    grad.addColorStop(1, 'rgba(201,168,99,0.03)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

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
        loaded.push({
          img,
          cls: classifications.find(c => c.index === i + 1) || {
            index: i + 1,
            type: 'support',
            description: '',
          },
        });
      } catch {}
    }

    const byType = (t: string) => loaded.filter(l => l.cls.type === t);

    byType('lifestyle').slice(0, 1).forEach(l => {
      const s = Math.max(W / l.img.width, H / l.img.height);
      ctx.globalAlpha = 0.25;
      ctx.drawImage(
        l.img,
        (W - l.img.width * s) / 2,
        (H - l.img.height * s) / 2,
        l.img.width * s,
        l.img.height * s
      );
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(10,10,11,0.7)';
      ctx.fillRect(0, 0, W, H);
    });

    byType('product').slice(0, 1).forEach(p => {
      const mw = W * 0.6;
      const mh = H * 0.35;
      const s = Math.min(mw / p.img.width, mh / p.img.height);
      const pw = p.img.width * s;
      const ph = p.img.height * s;

      ctx.shadowColor = 'rgba(201,168,99,0.2)';
      ctx.shadowBlur = 40;
      ctx.drawImage(p.img, (W - pw) / 2, (H - ph) / 2 - 40, pw, ph);
      ctx.shadowBlur = 0;
    });

    byType('logo').slice(0, 1).forEach(l => {
      const ms = W * 0.15;
      const s = Math.min(ms / l.img.width, ms / l.img.height);
      ctx.drawImage(
        l.img,
        W - l.img.width * s - PAD,
        PAD,
        l.img.width * s,
        l.img.height * s
      );
    });

    const uis = [...byType('ui'), ...byType('screenshot')].slice(0, 3);
    if (uis.length) {
      const gy = H * 0.7;
      const gh = H * 0.22;
      const cols = uis.length;
      const cw = (W - PAD * 2 - (cols - 1) * 12) / cols;

      uis.forEach((u, i) => {
        const s = Math.min(cw / u.img.width, gh / u.img.height);
        const uw = u.img.width * s;
        const uh = u.img.height * s;
        const ux = PAD + i * (cw + 12) + (cw - uw) / 2;
        const uy = gy + (gh - uh) / 2;

        ctx.save();
        rr(ctx, ux, uy, uw, uh, 12);
        ctx.clip();
        ctx.drawImage(u.img, ux, uy, uw, uh);
        ctx.restore();

        ctx.strokeStyle = 'rgba(201,168,99,0.2)';
        ctx.lineWidth = 1;
        rr(ctx, ux, uy, uw, uh, 12);
        ctx.stroke();
      });
    }

    const url = canvas.toDataURL('image/png', 0.9);
    setPreview(url);
    setLoading(false);
    onComposed(url);
  }

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      {loading ? (
        <div className="aspect-[9/16] max-h-[380px] rounded-xl border border-border bg-surface-2 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-gold animate-spin" />
        </div>
      ) : preview ? (
        <img
          src={preview}
          alt="Composed"
          className="w-full max-h-[380px] object-contain rounded-xl border border-border"
        />
      ) : null}
    </div>
  );
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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
