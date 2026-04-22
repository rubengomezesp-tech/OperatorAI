'use client';
import { useState, useRef, useEffect } from 'react';
import { Layers, Palette, Type, Download, Check, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEMPLATES, ASSET_ICONS, COLOR_MAP, type TextBlock } from '../data/templates';

interface Props {
  imageUrl: string;
  copy: { hook: string; message: string; cta: string; headline?: string };
  aspectRatio: '9:16' | '1:1' | '4:5';
  onExport: (dataUrl: string) => void;
}

type Panel = 'templates' | 'text' | 'assets' | null;

const SIZES: Record<string, [number, number]> = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350] };

export function AdEditor({ imageUrl, copy, aspectRatio, onExport }: Props) {
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>('templates');
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 320, h: 569 });

  // Apply template
  function applyTemplate(id: string) {
    const t = TEMPLATES.find(t => t.id === id);
    if (!t) return;
    setBlocks(t.blocks(copy));
    setActiveTemplate(id);
    setSelectedId(null);
  }

  // Apply luxury template on mount
  useEffect(() => {
    if (blocks.length === 0) applyTemplate('luxury');
  }, []);

  // Compute canvas display size
  useEffect(() => {
    const [aw, ah] = SIZES[aspectRatio] || [1080, 1920];
    const maxW = 360;
    const maxH = 640;
    const ratio = aw / ah;
    let w = maxW;
    let h = maxW / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    setCanvasSize({ w, h });
  }, [aspectRatio]);

  // Update block
  function updateBlock(id: string, patch: Partial<TextBlock>) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedId(null);
  }

  function addIcon(emoji: string) {
    const id = 'icon-' + Date.now();
    setBlocks(prev => [...prev, {
      id, type: 'highlight', text: emoji,
      x: 50, y: 50, align: 'center', fontSize: 48,
      fontFamily: 'sans', fontWeight: 'normal', color: 'white',
    }]);
    setSelectedId(id);
  }

  // Drag
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  function onMouseDown(e: React.MouseEvent, b: TextBlock) {
    e.stopPropagation();
    setSelectedId(b.id);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragging({ id: b.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top });
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    updateBlock(dragging.id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  function onMouseUp() { setDragging(null); }

  // Touch support
  function onTouchStart(e: React.TouchEvent, b: TextBlock) {
    e.stopPropagation();
    setSelectedId(b.id);
    const t = e.touches[0];
    setDragging({ id: b.id, offsetX: 0, offsetY: 0 });
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragging || !canvasRef.current) return;
    const t = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((t.clientX - rect.left) / rect.width) * 100;
    const y = ((t.clientY - rect.top) / rect.height) * 100;
    updateBlock(dragging.id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  }

  // Export
  async function exportPng() {
    const [aw, ah] = SIZES[aspectRatio] || [1080, 1920];
    const canvas = document.createElement('canvas');
    canvas.width = aw; canvas.height = ah;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej();
      img.src = imageUrl;
    });
    const scale = Math.max(aw / img.width, ah / img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;
    ctx.drawImage(img, (aw - sw) / 2, (ah - sh) / 2, sw, sh);

    // Draw text blocks
    for (const b of blocks) {
      const x = (b.x / 100) * aw;
      const y = (b.y / 100) * ah;
      const fontFamily = b.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, -apple-system, sans-serif';
      const fontWeight = b.fontWeight === 'black' ? '900' : b.fontWeight === 'bold' ? '700' : b.fontWeight === 'light' ? '300' : '400';
      const scaled = b.fontSize * (aw / canvasSize.w);
      ctx.font = fontWeight + ' ' + scaled + 'px ' + fontFamily;
      ctx.textAlign = b.align as CanvasTextAlign;
      ctx.textBaseline = 'middle';

      // Button/pill background
      if (b.style === 'button' || b.style === 'pill') {
        const metrics = ctx.measureText(b.text);
        const padX = 40 * (aw / canvasSize.w);
        const padY = 20 * (aw / canvasSize.w);
        const bw = metrics.width + padX * 2;
        const bh = scaled + padY * 2;
        const bx = b.align === 'center' ? x - bw/2 : b.align === 'right' ? x - bw : x;
        const by = y - bh / 2;
        ctx.fillStyle = b.style === 'pill' ? 'transparent' : '#FFFFFF';
        if (b.style === 'pill') { ctx.strokeStyle = COLOR_MAP[b.color]; ctx.lineWidth = 2; }
        const r = bh / 2;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + bw - r, by);
        ctx.arc(bx + bw - r, by + r, r, -Math.PI/2, Math.PI/2);
        ctx.lineTo(bx + r, by + bh);
        ctx.arc(bx + r, by + r, r, Math.PI/2, 3*Math.PI/2);
        if (b.style === 'pill') ctx.stroke(); else ctx.fill();
      }

      if (b.style === 'badge') {
        const metrics = ctx.measureText(b.text);
        const padX = 12 * (aw / canvasSize.w);
        const padY = 6 * (aw / canvasSize.w);
        const bw = metrics.width + padX * 2;
        const bh = scaled + padY * 2;
        const bx = x;
        ctx.fillStyle = 'rgba(201,168,99,0.15)';
        ctx.strokeStyle = COLOR_MAP.gold;
        ctx.lineWidth = 1;
        ctx.fillRect(bx, y - bh/2, bw, bh);
        ctx.strokeRect(bx, y - bh/2, bw, bh);
      }

      // Text
      ctx.fillStyle = b.style === 'button' ? '#000000' : COLOR_MAP[b.color];
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = b.style ? 0 : 12;
      ctx.fillText(b.text, x, y);

      // Underline style
      if (b.style === 'underline') {
        const w = ctx.measureText(b.text).width;
        const ux = b.align === 'center' ? x - w/2 : b.align === 'right' ? x - w : x;
        ctx.strokeStyle = COLOR_MAP[b.color];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ux, y + scaled/2 + 4);
        ctx.lineTo(ux + w, y + scaled/2 + 4);
        ctx.stroke();
      }
    }

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    onExport(dataUrl);

    // Auto download
    const link = document.createElement('a');
    link.download = 'ad-' + Date.now() + '.png';
    link.href = dataUrl;
    link.click();
  }

  const selected = blocks.find(b => b.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Panel toggles */}
      <div className="flex gap-1 p-1 rounded-lg border border-border bg-surface-2 w-fit">
        {([['templates', Layers, 'Templates'], ['text', Type, 'Text'], ['assets', Palette, 'Assets']] as const).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setPanel(panel === id ? null : id as Panel)} className={cn('h-8 px-3 rounded-md text-[11px] flex items-center gap-1.5 transition-all', panel === id ? 'bg-surface-3 text-gold' : 'text-fg-muted hover:text-fg')}>
            <Icon className="h-3 w-3" />{label}
          </button>
        ))}
        <button onClick={exportPng} className="h-8 px-3 rounded-md text-[11px] gold-grad text-bg font-medium flex items-center gap-1.5 ml-1">
          <Download className="h-3 w-3" />Export
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
        {/* Canvas */}
        <div
          ref={canvasRef}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onMouseUp}
          onClick={() => setSelectedId(null)}
          className="relative mx-auto rounded-xl overflow-hidden border border-border select-none"
          style={{ width: canvasSize.w, height: canvasSize.h }}
        >
          <img ref={imgRef} src={imageUrl} alt="" crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" />

          {/* Text blocks */}
          {blocks.map(b => (
            <div
              key={b.id}
              onMouseDown={e => onMouseDown(e, b)}
              onTouchStart={e => onTouchStart(e, b)}
              className={cn(
                'absolute cursor-move select-none whitespace-nowrap',
                selectedId === b.id && 'ring-2 ring-gold ring-offset-2 ring-offset-transparent',
              )}
              style={{
                left: b.x + '%',
                top: b.y + '%',
                transform: b.align === 'center' ? 'translate(-50%, -50%)' : b.align === 'right' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
                fontSize: b.fontSize + 'px',
                fontFamily: b.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif',
                fontWeight: b.fontWeight === 'black' ? 900 : b.fontWeight === 'bold' ? 700 : b.fontWeight === 'light' ? 300 : 400,
                textShadow: b.style ? 'none' : '0 2px 8px rgba(0,0,0,0.5)',
                padding: b.style === 'button' ? '10px 20px' : b.style === 'pill' ? '8px 18px' : b.style === 'badge' ? '3px 8px' : '0',
                borderRadius: b.style === 'button' || b.style === 'pill' ? '9999px' : b.style === 'badge' ? '4px' : '0',
                background: b.style === 'button' ? '#FFFFFF' : b.style === 'badge' ? 'rgba(201,168,99,0.15)' : 'transparent',
                border: b.style === 'pill' ? '2px solid ' + COLOR_MAP[b.color] : b.style === 'badge' ? '1px solid ' + COLOR_MAP.gold : 'none',
                color: b.style === 'button' ? '#000000' : COLOR_MAP[b.color],
                textDecoration: b.style === 'underline' ? 'underline' : 'none',
                textUnderlineOffset: '4px',
              }}
            >
              {b.text}
            </div>
          ))}
        </div>

        {/* Side Panel */}
        {panel && (
          <div className="w-full lg:w-[280px] rounded-xl border border-border bg-surface p-3 space-y-3 max-h-[600px] overflow-y-auto">
            {/* TEMPLATES */}
            {panel === 'templates' && (
              <>
                <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">Templates</div>
                <div className="space-y-1.5">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => applyTemplate(t.id)} className={cn('w-full p-2.5 rounded-lg border text-left transition-all', activeTemplate === t.id ? 'bg-gold/10 border-gold/30' : 'bg-surface-2 border-border hover:border-gold/20')}>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[12px] font-medium', activeTemplate === t.id ? 'text-gold' : 'text-fg')}>{t.name}</span>
                        {activeTemplate === t.id && <Check className="h-3 w-3 text-gold" />}
                      </div>
                      <div className="text-[10px] text-fg-subtle">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* TEXT EDITOR */}
            {panel === 'text' && (
              <>
                <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{selected ? 'Edit block' : 'Select a block'}</div>
                {selected ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Text</label>
                      <textarea value={selected.text} onChange={e => updateBlock(selected.id, { text: e.target.value })} rows={2} className="w-full mt-1 px-2 py-1.5 rounded border border-border bg-surface-2 text-[11px] focus:outline-none focus:border-gold/40" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Size: {selected.fontSize}px</label>
                      <input type="range" min="10" max="80" value={selected.fontSize} onChange={e => updateBlock(selected.id, { fontSize: Number(e.target.value) })} className="w-full accent-[#C9A863]" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Color</label>
                      <div className="flex gap-1 mt-1">
                        {(['white', 'gold', 'muted', 'black'] as const).map(c => (
                          <button key={c} onClick={() => updateBlock(selected.id, { color: c })} className={cn('flex-1 h-7 rounded border', selected.color === c ? 'border-gold/50' : 'border-border')} style={{ background: COLOR_MAP[c] }} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Align</label>
                      <div className="flex gap-1 mt-1">
                        {(['left', 'center', 'right'] as const).map(a => (
                          <button key={a} onClick={() => updateBlock(selected.id, { align: a })} className={cn('flex-1 h-7 rounded text-[10px] border', selected.align === a ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 border-border text-fg-muted')}>{a}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Font</label>
                      <div className="flex gap-1 mt-1">
                        {(['sans', 'serif'] as const).map(f => (
                          <button key={f} onClick={() => updateBlock(selected.id, { fontFamily: f })} className={cn('flex-1 h-7 rounded text-[10px] border', selected.fontFamily === f ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 border-border text-fg-muted')}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Weight</label>
                      <div className="flex gap-1 mt-1">
                        {(['light', 'normal', 'bold', 'black'] as const).map(w => (
                          <button key={w} onClick={() => updateBlock(selected.id, { fontWeight: w })} className={cn('flex-1 h-6 rounded text-[9px] border', selected.fontWeight === w ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 border-border text-fg-muted')}>{w[0].toUpperCase()}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-fg-subtle">Style</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        {(['none', 'button', 'pill', 'underline', 'badge'] as const).map(s => (
                          <button key={s} onClick={() => updateBlock(selected.id, { style: s === 'none' ? undefined : s as any })} className={cn('h-7 rounded text-[9px] border', (selected.style || 'none') === s ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 border-border text-fg-muted')}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteBlock(selected.id)} className="w-full h-8 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-[11px] hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5">
                      <X className="h-3 w-3" />Delete
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-fg-subtle italic">Click a block on the canvas to edit it.</p>
                )}
              </>
            )}

            {/* ASSETS */}
            {panel === 'assets' && (
              <>
                <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">Icons & Emojis</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {ASSET_ICONS.map(a => (
                    <button key={a.emoji} onClick={() => addIcon(a.emoji)} className="aspect-square rounded border border-border bg-surface-2 hover:border-gold/40 hover:bg-surface-3 flex items-center justify-center text-[24px] transition-colors">
                      {a.emoji}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-fg-subtle italic pt-2 border-t border-border">Tap to add. Drag on canvas. Select to edit.</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
