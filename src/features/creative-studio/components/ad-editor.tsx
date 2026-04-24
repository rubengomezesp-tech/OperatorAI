'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { proxiedImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type { Variant } from '../types';

type Alignment = 'left' | 'center' | 'right';

interface TextBlock {
  id: 'headline' | 'subheadline' | 'cta';
  text: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
  align: Alignment;
  weight: number;
  maxWidth: number;
  fontFamily: 'inter' | 'system' | 'serif' | 'mono';
  opacity: number;
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
  letterSpacing: number;
  lineHeight: number;
  zIndex: number;
}

const FONT_FAMILIES = {
  inter: { name: 'Inter', class: 'var(--font-inter)' },
  system: { name: 'System', class: 'system-ui' },
  serif: { name: 'Serif', class: 'Georgia, serif' },
  mono: { name: 'Mono', class: 'Courier, monospace' },
} as const;

interface Props {
  imageUrl: string;
  variant: Variant;
  locale: 'en' | 'es';
  onBack?: () => void;
}

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
  const originalOverflow = useRef<string>('');

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
    e.preventDefault();
    e.stopPropagation();
    
    setActiveId(id);
    setDragId(id);
    
    // Lock body scroll
    originalOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragId || !stageRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    updateBlock(dragId, { x, y });
  }

  function handlePointerUp(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    setDragId(null);
    
    // Restore body scroll
    document.body.style.overflow = originalOverflow.current;
    
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  function handleDuplicate() {
    const block = active;
    const newId = (block.id + '_dup') as any;
    const newBlock: TextBlock = {
      ...block,
      id: newId,
      x: Math.min(1, block.x + 0.05),
      y: Math.min(1, block.y + 0.05),
    };
    setBlocks((prev) => [...prev, newBlock]);
  }

  function handleDelete() {
    if (blocks.length <= 1) {
      alert(es ? 'No puedes eliminar la última capa' : 'Cannot delete last layer');
      return;
    }
    setBlocks((prev) => prev.filter((b) => b.id !== activeId));
    setActiveId('headline');
  }

  function handleBringForward() {
    const idx = blocks.findIndex((b) => b.id === activeId);
    if (idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      setBlocks(newBlocks);
    }
  }

  function handleSendBackward() {
    const idx = blocks.findIndex((b) => b.id === activeId);
    if (idx > 0) {
      const newBlocks = [...blocks];
      [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
      setBlocks(newBlocks);
    }
  }

  function handleReset() {
    const defaults = initialBlocks(variant).find((b) => b.id === activeId);
    if (defaults) {
      updateBlock(activeId, {
        x: defaults.x,
        y: defaults.y,
        fontSize: defaults.fontSize,
      });
    }
  }

  async function handleExport() {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      const proxiedUrl = proxiedImageUrl(imageUrl) || imageUrl;
      const canvas = await renderToCanvas(
        proxiedUrl,
        blocks,
        variant.aspectRatio,
      );
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
    <div className="w-full h-full overflow-hidden overscroll-contain bg-surface-2">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 h-full p-4">
        {/* Stage */}
        <div className="flex flex-col items-start justify-start overflow-hidden">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] text-fg-muted hover:text-fg mb-3"
            >
              <ArrowLeft className="h-3 w-3" />
              {es ? 'Volver' : 'Back'}
            </button>
          )}

          <div className="flex items-center justify-center w-full flex-1 overflow-hidden">
            <div
              ref={stageRef}
              className="relative bg-black rounded-xl overflow-hidden border border-border shadow-2xl select-none touch-action-none"
              style={{
                aspectRatio: aspect,
                width: '100%',
                maxWidth: 520,
                touchAction: 'none',
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
                      'absolute cursor-move px-1 select-none',
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
                      lineHeight: b.lineHeight,
                      fontFamily: FONT_FAMILIES[b.fontFamily].class,
                      opacity: b.opacity,
                      letterSpacing: b.letterSpacing + 'em',
                      textShadow: b.shadowEnabled
                        ? `0 2px ${b.shadowBlur}px ${b.shadowColor}`
                        : 'none',
                      containerType: 'size',
                      zIndex: b.zIndex,
                      touchAction: 'none',
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
        </div>

        {/* Controls Panel */}
        <div className="overflow-y-auto overscroll-contain space-y-4 pr-2">
          {/* Layer Tabs */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
              {es ? 'Capas' : 'Layers'}
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
                      ? 'Subtítulo'
                      : 'Subhead'
                    : 'CTA'}
                </button>
              ))}
            </div>
          </div>

          {/* Text Content */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
              {es ? 'Contenido' : 'Content'}
            </div>
            <textarea
              value={active.text}
              onChange={(e) => updateBlock(active.id, { text: e.target.value })}
              rows={2}
              placeholder={es ? 'Escribe...' : 'Type...'}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-2 text-[12px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
            />
          </div>

          {/* Font & Typography */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium flex items-center gap-1.5">
              <Type className="h-3 w-3" />
              {es ? 'Tipografía' : 'Typography'}
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-2">
                {es ? 'Fuente' : 'Font'}
              </label>
              <div className="grid grid-cols-2 gap-1">
                {(Object.entries(FONT_FAMILIES) as any[]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => updateBlock(active.id, { fontFamily: key })}
                    className={cn(
                      'h-7 rounded-md text-[10px] font-medium border',
                      active.fontFamily === key
                        ? 'bg-gold/15 text-gold border-gold/30'
                        : 'bg-surface-2 text-fg-muted border-border',
                    )}
                  >
                    {val.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                {es ? 'Tamaño' : 'Size'}: {active.fontSize.toFixed(1)}
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
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                {es ? 'Grosor' : 'Weight'}: {active.weight}
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
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                {es ? 'Espaciado' : 'Letter Spacing'}: {(active.letterSpacing * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={active.letterSpacing}
                onChange={(e) =>
                  updateBlock(active.id, { letterSpacing: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                {es ? 'Altura línea' : 'Line Height'}: {active.lineHeight.toFixed(2)}
              </label>
              <input
                type="range"
                min={0.8}
                max={2.5}
                step={0.1}
                value={active.lineHeight}
                onChange={(e) =>
                  updateBlock(active.id, { lineHeight: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Color & Appearance */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
              {es ? 'Apariencia' : 'Appearance'}
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-2">
                {es ? 'Color' : 'Color'}
              </label>
              <div className="flex gap-1 mb-2">
                {['#ffffff', '#000000', '#c9a863', '#ff3b30', '#34c759'].map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => updateBlock(active.id, { color: c })}
                      className={cn(
                        'h-6 w-6 rounded-md border-2',
                        active.color === c ? 'border-gold' : 'border-border',
                      )}
                      style={{ background: c }}
                    />
                  ),
                )}
              </div>
              <input
                type="color"
                value={active.color}
                onChange={(e) =>
                  updateBlock(active.id, { color: e.target.value })
                }
                className="w-full h-8 rounded-md border border-border cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                {es ? 'Opacidad' : 'Opacity'}: {(active.opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={active.opacity}
                onChange={(e) =>
                  updateBlock(active.id, { opacity: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] text-fg">
                <input
                  type="checkbox"
                  checked={active.shadowEnabled}
                  onChange={(e) =>
                    updateBlock(active.id, { shadowEnabled: e.target.checked })
                  }
                  className="w-3 h-3"
                />
                {es ? 'Sombra' : 'Shadow'}
              </label>

              {active.shadowEnabled && (
                <>
                  <div>
                    <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
                      {es ? 'Desenfoque' : 'Blur'}: {active.shadowBlur}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={1}
                      value={active.shadowBlur}
                      onChange={(e) =>
                        updateBlock(active.id, {
                          shadowBlur: Number(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <input
                    type="color"
                    value={active.shadowColor}
                    onChange={(e) =>
                      updateBlock(active.id, { shadowColor: e.target.value })
                    }
                    className="w-full h-8 rounded-md border border-border"
                  />
                </>
              )}
            </div>
          </div>

          {/* Layout */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
              {es ? 'Diseño' : 'Layout'}
            </div>

            <div>
              <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-2">
                {es ? 'Alineación' : 'Align'}
              </label>
              <div className="flex gap-1">
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

          {/* Layer Actions */}
          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
              {es ? 'Capas' : 'Layers'}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleBringForward}
                className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 text-[10px] flex items-center justify-center gap-1"
                title={es ? 'Traer adelante' : 'Bring forward'}
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={handleSendBackward}
                className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 text-[10px] flex items-center justify-center gap-1"
                title={es ? 'Enviar atrás' : 'Send backward'}
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                onClick={handleDuplicate}
                className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 text-[10px] flex items-center justify-center gap-1"
                title={es ? 'Duplicar' : 'Duplicate'}
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={handleReset}
                className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 text-[10px] flex items-center justify-center gap-1"
                title={es ? 'Resetear' : 'Reset'}
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {blocks.length > 1 && (
              <button
                onClick={handleDelete}
                className="w-full h-8 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:border-red-500/60 text-[10px] font-medium flex items-center justify-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                {es ? 'Eliminar' : 'Delete'}
              </button>
            )}
          </div>

          {/* Export */}
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
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function initialBlocks(variant: Variant): TextBlock[] {
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
      fontFamily: 'inter',
      opacity: 1,
      shadowEnabled: true,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.6)',
      letterSpacing: 0,
      lineHeight: 1.15,
      zIndex: 2,
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
      fontFamily: 'inter',
      opacity: 0.9,
      shadowEnabled: true,
      shadowBlur: 4,
      shadowColor: 'rgba(0,0,0,0.5)',
      letterSpacing: 0,
      lineHeight: 1.35,
      zIndex: 1,
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
      fontFamily: 'inter',
      opacity: 1,
      shadowEnabled: false,
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0)',
      letterSpacing: 0,
      lineHeight: 1.2,
      zIndex: 3,
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

  const img = await loadImg(imageUrl);
  const s = Math.max(W / img.width, H / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);

  const sorted = [...blocks].sort((a, b) => a.zIndex - b.zIndex);

  for (const b of sorted) {
    if (!b.text) continue;
    const fontPx = (b.fontSize / 100) * H;
    ctx.font = `${b.weight} ${fontPx}px "${FONT_FAMILIES[b.fontFamily].name}", -apple-system, system-ui, sans-serif`;
    ctx.textAlign = b.align;
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = b.opacity;

    const cx = b.x * W;
    const cy = b.y * H;
    const maxW = b.maxWidth * W;

    if (b.id === 'cta') {
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

      ctx.fillStyle = b.color;
      ctx.fillText(b.text, cx, cy);
    } else {
      if (b.shadowEnabled) {
        ctx.shadowColor = b.shadowColor;
        ctx.shadowBlur = b.shadowBlur;
      }
      ctx.fillStyle = b.color;
      ctx.letterSpacing = b.letterSpacing + 'em';
      wrapText(
        ctx,
        b.text,
        cx,
        cy,
        maxW,
        fontPx * b.lineHeight,
      );
      ctx.shadowBlur = 0;
    }
  }

  ctx.globalAlpha = 1;
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
