'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
} from 'lucide-react';
import { proxiedImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { Variant } from '../types';

type Alignment = 'left' | 'center' | 'right';

interface TextBlock {
  id: 'headline' | 'subheadline' | 'cta';
  text: string;
  color: string;
  fontSize: number; // as percentage of canvas height
  x: number; // 0-1 relative to canvas width
  y: number; // 0-1 relative to canvas height
  align: Alignment;
  weight: number;
  maxWidth: number; // 0-1 relative
}

interface Props {
  imageUrl: string;
  variant: Variant;
  locale: 'en' | 'es';
  onBack?: () => void;
}

/**
 * AD EDITOR v6
 *
 * Flow:
 * 1. Flux image is the fixed background (loaded via <img crossOrigin>).
 * 2. Three HTML text blocks overlay the image with absolute positioning.
 * 3. User edits inline (click to focus), adjusts color/size/align/position.
 * 4. Export: draws the image to a hidden canvas, then draws text blocks
 *    at the same relative coordinates, and downloads PNG.
 *
 * No dependency on canvas-spec-renderer, html2canvas, or any library.
 */
export function AdEditor({ imageUrl, variant, locale, onBack }: Props) {
  const es = locale === 'es';
  const aspect =
    variant.aspectRatio === '1:1'
      ? '1 / 1'
      : variant.aspectRatio === '4:5'
      ? '4 / 5'
      : '9 / 16';

  const [blocks, setBlocks] = useState<TextBlock[]>(() =>
    initialBlocks(variant),
  );
  const [activeId, setActiveId] = useState<TextBlock['id']>('headline');
  const [dragId, setDragId] = useState<TextBlock['id'] | null>(null);
  const [exporting, setExporting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const active = useMemo(
    () => blocks.find((b) => b.id === activeId) || blocks[0],
    [blocks, activeId],
  );

  function updateBlock(id: TextBlock['id'], patch: Partial<TextBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    );
  }

  function handlePointerDown(e: React.PointerEvent, id: TextBlock['id']) {
    setActiveId(id);
    setDragId(id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    updateBlock(dragId, { x, y });
  }

  function handlePointerUp() {
    setDragId(null);
  }

  async function handleExport() {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      const proxiedUrl = proxiedImageUrl(imageUrl) || imageUrl;
      const canvas = await renderToCanvas(proxiedUrl, blocks, variant.aspectRatio);
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error('toBlob null'))),
          'image/png',
          0.95,
        ),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = variant.layout + '-final.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[ad-editor] export failed:', err);
      alert(es ? 'Error al exportar' : 'Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Stage */}
      <div className="flex items-start justify-center">
        <div
          ref={stageRef}
          className="relative bg-black rounded-xl overflow-hidden border border-border shadow-2xl select-none"
          style={{
            aspectRatio: aspect,
            width: '100%',
            maxWidth: 520,
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={proxiedImageUrl(imageUrl) || imageUrl}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          {blocks.map((b) =>
            b.text ? (
              <div
                key={b.id}
                onPointerDown={(e) => handlePointerDown(e, b.id)}
                className={cn(
                  'absolute cursor-move px-1',
                  activeId === b.id
                    ? 'outline outline-1 outline-gold/60'
                    : 'hover:outline hover:outline-1 hover:outline-white/30',
                )}
                style={{
                  left: b.x * 100 + '%',
                  top: b.y * 100 + '%',
                  transform: computeAnchor(b.align),
                  fontSize: b.fontSize + 'cqh',
                  color: b.color,
                  fontWeight: b.weight,
                  textAlign: b.align,
                  maxWidth: b.maxWidth * 100 + '%',
                  lineHeight: 1.15,
                  fontFamily:
                    b.id === 'cta'
                      ? 'var(--font-inter), system-ui, sans-serif'
                      : 'var(--font-inter), system-ui, sans-serif',
                  textShadow:
                    '0 2px 24px rgba(0,0,0,0.6), 0 1px 2px rgba(0,0,0,0.5)',
                  containerType: 'size',
                }}
              >
                {b.id === 'cta' && b.text ? (
                  <span
                    className="inline-block rounded-full"
                    style={{
                      background: '#fff',
                      color: '#000',
                      padding: '0.5em 1.2em',
                      fontWeight: 700,
                      textShadow: 'none',
                    }}
                  >
                    {b.text}
                  </span>
                ) : (
                  <span style={{ display: 'inline-block' }}>{b.text}</span>
                )}
              </div>
            ) : null,
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-3 w-3" />
            {es ? 'Volver' : 'Back'}
          </button>
        )}

        <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
            {es ? 'Texto' : 'Text'}
          </div>
          <div className="flex gap-1">
            {(['headline', 'subheadline', 'cta'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setActiveId(id)}
                className={cn(
                  'flex-1 h-7 rounded-md text-[10px] font-medium border capitalize',
                  activeId === id
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : 'bg-surface-2 text-fg-muted border-border',
                )}
              >
                {id === 'headline'
                  ? es
                    ? 'Titular'
                    : 'Headline'
                  : id === 'subheadline'
                  ? es
                    ? 'Subtitulo'
                    : 'Subhead'
                  : 'CTA'}
              </button>
            ))}
          </div>

          <textarea
            value={active.text}
            onChange={(e) => updateBlock(active.id, { text: e.target.value })}
            rows={2}
            placeholder={es ? 'Escribe...' : 'Type...'}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface-2 text-[12px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium flex items-center gap-1.5">
            <Type className="h-3 w-3" />
            {es ? 'Estilo' : 'Style'}
          </div>

          <div>
            <label className="text-[9px] text-fg-subtle uppercase tracking-wide">
              {es ? 'Tamano' : 'Size'}
            </label>
            <input
              type="range"
              min={2}
              max={16}
              step={0.5}
              value={active.fontSize}
              onChange={(e) =>
                updateBlock(active.id, { fontSize: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[9px] text-fg-subtle uppercase tracking-wide">
              {es ? 'Grosor' : 'Weight'}
            </label>
            <input
              type="range"
              min={300}
              max={900}
              step={100}
              value={active.weight}
              onChange={(e) =>
                updateBlock(active.id, { weight: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="text-[9px] text-fg-subtle uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-1 mt-1">
              {['#ffffff', '#000000', '#c9a863', '#ff3b30', '#34c759'].map(
                (c) => (
                  <button
                    key={c}
                    onClick={() => updateBlock(active.id, { color: c })}
                    className={cn(
                      'h-7 w-7 rounded-md border-2',
                      active.color === c ? 'border-gold' : 'border-border',
                    )}
                    style={{ background: c }}
                  />
                ),
              )}
              <input
                type="color"
                value={active.color}
                onChange={(e) =>
                  updateBlock(active.id, { color: e.target.value })
                }
                className="h-7 w-7 rounded-md border-2 border-border cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] text-fg-subtle uppercase tracking-wide">
              {es ? 'Alineacion' : 'Align'}
            </label>
            <div className="flex gap-1 mt-1">
              {(
                [
                  ['left', AlignLeft],
                  ['center', AlignCenter],
                  ['right', AlignRight],
                ] as const
              ).map(([val, Icon]) => (
                <button
                  key={val}
                  onClick={() => updateBlock(active.id, { align: val })}
                  className={cn(
                    'flex-1 h-8 rounded-md border flex items-center justify-center',
                    active.align === val
                      ? 'bg-gold/15 border-gold/30 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full h-11 rounded-xl bg-gold text-black text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting
            ? es
              ? 'Exportando...'
              : 'Exporting...'
            : es
            ? 'Descargar PNG'
            : 'Download PNG'}
        </button>

        <p className="text-[10px] text-fg-subtle leading-relaxed">
          {es
            ? 'Arrastra los textos sobre la imagen para reposicionarlos.'
            : 'Drag text blocks on the image to reposition.'}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function initialBlocks(variant: Variant): TextBlock[] {
  const pos = variant.composition.logoPosition;
  // Reasonable defaults based on layout; user can drag to refine.
  const layoutDefaults: Record<
    string,
    { hX: number; hY: number; subY: number; ctaY: number; align: Alignment }
  > = {
    hero_app: { hX: 0.5, hY: 0.82, subY: 0.88, ctaY: 0.93, align: 'center' },
    feature_grid: { hX: 0.5, hY: 0.1, subY: 0.16, ctaY: 0.92, align: 'center' },
    story_ad: { hX: 0.5, hY: 0.42, subY: 0.56, ctaY: 0.78, align: 'center' },
    minimal_branding: {
      hX: 0.5,
      hY: 0.5,
      subY: 0.58,
      ctaY: 0.86,
      align: 'center',
    },
    ui_focus: { hX: 0.5, hY: 0.93, subY: 0.97, ctaY: 0.97, align: 'center' },
  };
  const d = layoutDefaults[variant.layout] || layoutDefaults.hero_app;

  return [
    {
      id: 'headline',
      text: variant.copy.headline || '',
      color: '#ffffff',
      fontSize: variant.layout === 'story_ad' ? 11 : 7.5,
      x: d.hX,
      y: d.hY,
      align: d.align,
      weight: 800,
      maxWidth: 0.85,
    },
    {
      id: 'subheadline',
      text: variant.copy.subheadline || '',
      color: 'rgba(255,255,255,0.8)',
      fontSize: 3.2,
      x: d.hX,
      y: d.subY,
      align: d.align,
      weight: 400,
      maxWidth: 0.8,
    },
    {
      id: 'cta',
      text: variant.copy.cta || '',
      color: '#000000',
      fontSize: 3.2,
      x: d.hX,
      y: d.ctaY,
      align: 'center',
      weight: 700,
      maxWidth: 0.6,
    },
  ];
}

function computeAnchor(align: Alignment): string {
  if (align === 'left') return 'translate(0%, -50%)';
  if (align === 'right') return 'translate(-100%, -50%)';
  return 'translate(-50%, -50%)';
}

async function renderToCanvas(
  imageUrl: string,
  blocks: TextBlock[],
  aspectRatio: Variant['aspectRatio'],
): Promise<HTMLCanvasElement> {
  const [W, H] =
    aspectRatio === '1:1'
      ? [1080, 1080]
      : aspectRatio === '4:5'
      ? [1080, 1350]
      : [1080, 1920];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // 1) Draw background
  const img = await loadImg(imageUrl);
  const s = Math.max(W / img.width, H / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);

  // 2) Draw text blocks
  for (const b of blocks) {
    if (!b.text) continue;
    const fontPx = (b.fontSize / 100) * H;
    ctx.font =
      b.weight +
      ' ' +
      fontPx +
      'px "Inter", -apple-system, system-ui, sans-serif';
    ctx.textAlign = b.align;
    ctx.textBaseline = 'middle';

    const cx = b.x * W;
    const cy = b.y * H;
    const maxW = b.maxWidth * W;

    if (b.id === 'cta') {
      // Pill CTA
      const metrics = ctx.measureText(b.text);
      const padX = fontPx * 0.9;
      const padY = fontPx * 0.55;
      const pillW = metrics.width + padX * 2;
      const pillH = fontPx + padY * 2;
      const px = cx - pillW / 2;
      const py = cy - pillH / 2;

      ctx.fillStyle = '#ffffff';
      roundRect(ctx, px, py, pillW, pillH, pillH / 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.fillText(b.text, cx, cy);
    } else {
      // Headline / subheadline with soft shadow
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = fontPx * 0.25;
      ctx.fillStyle = b.color;
      wrapText(ctx, b.text, cx, cy, maxW, fontPx * 1.15);
      ctx.shadowBlur = 0;
    }
  }

  return canvas;
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image load failed'));
    img.src = url;
  });
}

function roundRect(
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
