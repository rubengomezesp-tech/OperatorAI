'use client';
import { useState, useRef, useCallback } from 'react';
import { Loader2, Download, RotateCcw, Sparkles, Type, Image as ImageIcon, Wand2, Check, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

type AdFormat = 'story' | 'feed' | 'reel';
type AdStep = 'format' | 'brief' | 'generating' | 'preview';

interface AdCopy {
  headline: string;
  subheadline: string;
  cta: string;
  body: string;
}

interface AdResult {
  imageUrl: string;
  copy: AdCopy;
  format: AdFormat;
}

const FORMATS: { id: AdFormat; label: string; labelEs: string; w: number; h: number; desc: string; descEs: string }[] = [
  { id: 'story', label: 'Instagram Story', labelEs: 'Instagram Story', w: 1080, h: 1920, desc: '9:16 vertical', descEs: '9:16 vertical' },
  { id: 'feed', label: 'Instagram Feed', labelEs: 'Instagram Feed', w: 1080, h: 1080, desc: '1:1 square', descEs: '1:1 cuadrado' },
  { id: 'reel', label: 'Reel Cover', labelEs: 'Portada Reel', w: 1080, h: 1920, desc: '9:16 vertical', descEs: '9:16 vertical' },
];

const TEXT_STYLES = [
  { id: 'minimal', label: 'Minimal', font: 'font-sans', size: 'text-[28px]', weight: 'font-light', align: 'text-center', color: 'text-white' },
  { id: 'bold', label: 'Bold', font: 'font-sans', size: 'text-[36px]', weight: 'font-black', align: 'text-center', color: 'text-white' },
  { id: 'editorial', label: 'Editorial', font: 'font-serif', size: 'text-[32px]', weight: 'font-normal', align: 'text-left', color: 'text-white' },
  { id: 'luxury', label: 'Luxury', font: 'font-serif', size: 'text-[26px]', weight: 'font-light', align: 'text-center', color: 'text-amber-200' },
];

export function AdBuilder() {
  const { locale } = useI18n();
  const es = locale === 'es';
  const [step, setStep] = useState<AdStep>('format');
  const [format, setFormat] = useState<AdFormat>('story');
  const [brief, setBrief] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AdResult | null>(null);
  const [textStyle, setTextStyle] = useState('bold');
  const [editingCopy, setEditingCopy] = useState(false);
  const [copy, setCopy] = useState<AdCopy>({ headline: '', subheadline: '', cta: '', body: '' });
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [overlay, setOverlay] = useState(60);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Step 1 completed
  function selectFormat(f: AdFormat) {
    setFormat(f);
    setStep('brief');
  }

  // Step 2 — generate everything
  async function generate() {
    if (!brief.trim()) { toast.error(es ? 'Describe tu anuncio' : 'Describe your ad'); return; }
    setStep('generating');
    setGenerating(true);

    try {
      // LAYER 1: Generate copy with Claude
      const copyPrompt = es
        ? 'Genera copy publicitario para: "' + brief + '". Formato: ' + format + '. Responde SOLO con JSON exacto (sin markdown, sin backticks): {"headline":"max 8 palabras","subheadline":"max 15 palabras","cta":"max 4 palabras","body":"max 20 palabras"}'
        : 'Generate ad copy for: "' + brief + '". Format: ' + format + '. Respond ONLY with exact JSON (no markdown, no backticks): {"headline":"max 8 words","subheadline":"max 15 words","cta":"max 4 words","body":"max 20 words"}';

      const copyRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: copyPrompt, provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }),
      });

      let copyText = '';
      const reader1 = copyRes.body?.getReader();
      const decoder = new TextDecoder();
      if (reader1) {
        while (true) {
          const { done, value } = await reader1.read();
          if (done) break;
          for (const line of decoder.decode(value).split('\n')) {
            if (line.startsWith('data: ')) {
              try { const d = JSON.parse(line.slice(6)); if (d.t) copyText += d.t; } catch {}
            }
          }
        }
      }

      // Parse copy JSON
      let parsedCopy: AdCopy = { headline: 'Your Brand', subheadline: 'The future starts here', cta: 'Learn More', body: '' };
      try {
        const clean = copyText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsedCopy = JSON.parse(jsonMatch[0]);
      } catch { /* use defaults */ }

      setCopy(parsedCopy);

      // LAYER 2: Generate background image (NO TEXT)
      const aspectMap: Record<AdFormat, string> = { story: '9:16', feed: '1:1', reel: '9:16' };
      const imgPrompt = brief + '. Premium advertising background, cinematic lighting, no text, no letters, no words, no logos, text-free, clean composition, professional photography, ' + format + ' format';

      const imgRes = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imgPrompt,
          preset: 'editorial',
          aspectRatio: aspectMap[format],
          enhance: true,
          imageModel: 'flux-2-pro',
        }),
      });
      const imgData = await imgRes.json();
      if (!imgRes.ok) throw new Error(imgData.error || 'Image failed');

      const imageUrl = imgData.image?.display_urls?.[0] || imgData.image?.url || '';

      setResult({ imageUrl, copy: parsedCopy, format });
      setStep('preview');
      toast.success(es ? 'Anuncio listo' : 'Ad ready');

    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
      setStep('brief');
    } finally {
      setGenerating(false);
    }
  }

  // Export as PNG
  async function exportAd() {
    if (!canvasRef.current || !result) return;
    try {
      // Create canvas manually — no external lib needed
      const el = canvasRef.current;
      const rect = el.getBoundingClientRect();
      const scale = 3;
      const canvas = document.createElement('canvas');
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = result.imageUrl;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw overlay
      const grad = textPosition === 'bottom'
        ? ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.4)
        : textPosition === 'top'
        ? ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6)
        : null;
      if (grad) {
        grad.addColorStop(0, 'rgba(0,0,0,' + (overlay / 100) + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = 'rgba(0,0,0,' + (overlay / 100) + ')';
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      const px = 48 * scale;
      const headSize = currentStyle.id === 'bold' ? 36 * scale : currentStyle.id === 'minimal' ? 28 * scale : 32 * scale;
      const subSize = 14 * scale;
      const ctaSize = 13 * scale;
      const pad = 24 * scale;

      ctx.textAlign = currentStyle.align === 'text-center' ? 'center' : 'left';
      const tx = currentStyle.align === 'text-center' ? canvas.width / 2 : pad;
      const isLuxury = currentStyle.id === 'luxury';

      let ty = textPosition === 'top' ? pad + headSize
        : textPosition === 'center' ? canvas.height / 2 - headSize
        : canvas.height - pad - ctaSize - subSize - headSize - 40 * scale;

      // Headline
      ctx.fillStyle = isLuxury ? '#F5DEB3' : '#FFFFFF';
      ctx.font = (currentStyle.weight === 'font-black' ? 'bold ' : '') + headSize + 'px ' + (currentStyle.font === 'font-serif' ? 'Georgia, serif' : 'system-ui, sans-serif');
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8 * scale;
      wrapText(ctx, copy.headline, tx, ty, canvas.width - pad * 2, headSize * 1.1);
      ty += headSize * 1.3;

      // Subheadline
      if (copy.subheadline) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = subSize + 'px system-ui, sans-serif';
        ctx.shadowBlur = 4 * scale;
        wrapText(ctx, copy.subheadline, tx, ty, canvas.width - pad * 2, subSize * 1.3);
        ty += subSize * 2;
      }

      // CTA button
      if (copy.cta) {
        ty += 8 * scale;
        ctx.shadowBlur = 0;
        const ctaW = ctx.measureText(copy.cta).width + 40 * scale;
        const ctaH = ctaSize + 16 * scale;
        const ctaX = currentStyle.align === 'text-center' ? (canvas.width - ctaW) / 2 : pad;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        const r = ctaH / 2;
        ctx.moveTo(ctaX + r, ty); ctx.lineTo(ctaX + ctaW - r, ty); ctx.arc(ctaX + ctaW - r, ty + r, r, -Math.PI/2, Math.PI/2); ctx.lineTo(ctaX + r, ty + ctaH); ctx.arc(ctaX + r, ty + r, r, Math.PI/2, 3*Math.PI/2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold ' + ctaSize + 'px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(copy.cta, ctaX + ctaW / 2, ty + ctaH / 2 + ctaSize / 3);
      }

      const link = document.createElement('a');
      link.download = 'operator-ad-' + format + '-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png', 0.95);
      link.click();
      toast.success(es ? 'Descargado' : 'Downloaded');
    } catch (e) {
      console.error('Export failed:', e);
      toast.error(es ? 'Error al exportar' : 'Export failed');
    }
  }

  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line !== '') {
        ctx.fillText(line.trim(), x, cy);
        line = word + ' ';
        cy += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), x, cy);
  }

  const currentStyle = TEXT_STYLES.find(s => s.id === textStyle) || TEXT_STYLES[1];
  const formatInfo = FORMATS.find(f => f.id === format) || FORMATS[0];

  // ═══════════════════════════════════════
  // STEP 1: FORMAT SELECTION
  // ═══════════════════════════════════════
  if (step === 'format') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h2 className="font-display text-[22px]">Ad Builder</h2>
            <p className="text-[12px] text-fg-muted">{es ? 'De idea a anuncio publicable en 30 segundos' : 'From idea to publish-ready ad in 30 seconds'}</p>
          </div>
        </div>

        <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle mb-2">{es ? 'Elige formato' : 'Choose format'}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FORMATS.map(f => (
            <button
              key={f.id}
              onClick={() => selectFormat(f.id)}
              className="group text-left p-5 rounded-xl border border-border bg-surface hover:border-gold/40 hover:bg-surface-2 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  'rounded-lg border flex items-center justify-center',
                  f.id === 'feed' ? 'w-10 h-10' : 'w-7 h-12',
                  'border-fg-subtle/30 group-hover:border-gold/50 transition-colors'
                )} />
                <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-display text-[16px] group-hover:text-gold transition-colors">{es ? f.labelEs : f.label}</h3>
              <p className="text-[11px] text-fg-muted mt-0.5">{f.w}x{f.h} &middot; {es ? f.descEs : f.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 2: BRIEF INPUT
  // ═══════════════════════════════════════
  if (step === 'brief') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h2 className="font-display text-[22px]">{es ? formatInfo.labelEs : formatInfo.label}</h2>
            <p className="text-[12px] text-fg-muted">{formatInfo.w}x{formatInfo.h}</p>
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle mb-2">{es ? 'Describe tu anuncio' : 'Describe your ad'}</div>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder={es ? 'Ej: Anuncio para 7 dias gratis de Operator AI, estilo premium oscuro con dorado, CTA fuerte' : 'e.g. Ad for 7-day free trial of Operator AI, premium dark style with gold, strong CTA'}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-[14px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('format')} className="h-11 px-5 rounded-lg border border-border bg-surface-2 text-[13px] text-fg-muted hover:text-fg transition-colors">
            {es ? 'Atras' : 'Back'}
          </button>
          <button onClick={generate} className="flex-1 h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition flex items-center justify-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span>{es ? 'Crear anuncio' : 'Create ad'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 3: GENERATING
  // ═══════════════════════════════════════
  if (step === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-gold animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-[22px] mb-2">{es ? 'Creando tu anuncio...' : 'Creating your ad...'}</h2>
          <p className="text-[13px] text-fg-muted">{es ? 'Generando copy + imagen + layout' : 'Generating copy + image + layout'}</p>
        </div>
        <div className="flex items-center gap-8 text-[11px] text-fg-subtle">
          <div className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gold" /><span>{es ? 'Copy generado' : 'Copy generated'}</span></div>
          <div className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 text-gold animate-spin" /><span>{es ? 'Imagen...' : 'Image...'}</span></div>
          <div className="flex items-center gap-2"><div className="h-3.5 w-3.5 rounded-full border border-fg-subtle/30" /><span>Layout</span></div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 4: PREVIEW + EDIT + EXPORT
  // ═══════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-display text-[22px]">{es ? 'Anuncio listo' : 'Ad ready'}</h2>
            <p className="text-[12px] text-fg-muted">{es ? 'Edita el texto o descarga directamente' : 'Edit the text or download directly'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setStep('brief'); setResult(null); }} className="h-9 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center gap-2 transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />{es ? 'Nuevo' : 'New'}
          </button>
          <button onClick={exportAd} className="h-9 px-4 rounded-lg gold-grad text-bg text-[12px] font-medium flex items-center gap-2 hover:brightness-110 transition">
            <Download className="h-3.5 w-3.5" />{es ? 'Descargar PNG' : 'Download PNG'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Preview Canvas */}
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            className="relative overflow-hidden rounded-xl shadow-2xl"
            style={{
              width: format === 'feed' ? 360 : 270,
              height: format === 'feed' ? 360 : 480,
              maxWidth: '100%',
            }}
          >
            {/* Background Image */}
            {result?.imageUrl && (
              <img
                src={result.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            )}

            {/* Dark Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: textPosition === 'top'
                  ? `linear-gradient(180deg, rgba(0,0,0,${overlay/100}) 0%, transparent 60%)`
                  : textPosition === 'center'
                  ? `rgba(0,0,0,${overlay/100})`
                  : `linear-gradient(0deg, rgba(0,0,0,${overlay/100}) 0%, transparent 60%)`,
              }}
            />

            {/* Text Layer — RENDERED WITH CSS, NOT AI */}
            <div className={cn(
              'absolute left-0 right-0 px-6 flex flex-col gap-2',
              textPosition === 'top' ? 'top-8' : textPosition === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-8',
              currentStyle.align,
            )}>
              {editingCopy ? (
                <div className="space-y-2">
                  <input value={copy.headline} onChange={e => setCopy(c => ({...c, headline: e.target.value}))} className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-white text-[14px]" />
                  <input value={copy.subheadline} onChange={e => setCopy(c => ({...c, subheadline: e.target.value}))} className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-white text-[12px]" />
                  <input value={copy.cta} onChange={e => setCopy(c => ({...c, cta: e.target.value}))} className="w-full bg-black/40 border border-white/20 rounded px-2 py-1 text-white text-[12px]" />
                  <button onClick={() => setEditingCopy(false)} className="text-[10px] text-gold underline">Done</button>
                </div>
              ) : (
                <>
                  <h3 className={cn(currentStyle.font, currentStyle.size, currentStyle.weight, currentStyle.color, 'leading-tight drop-shadow-lg')}>
                    {copy.headline}
                  </h3>
                  {copy.subheadline && (
                    <p className={cn(currentStyle.font, 'text-[14px] font-normal text-white/80 drop-shadow-md leading-snug')}>
                      {copy.subheadline}
                    </p>
                  )}
                  {copy.cta && (
                    <div className="mt-2">
                      <span className="inline-block px-5 py-2 rounded-full bg-white text-black text-[13px] font-semibold shadow-lg">
                        {copy.cta}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="space-y-5">
          {/* Text Style */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{es ? 'Estilo de texto' : 'Text style'}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {TEXT_STYLES.map(s => (
                <button key={s.id} onClick={() => setTextStyle(s.id)} className={cn('h-9 rounded-lg text-[11px] font-medium border transition-all', textStyle === s.id ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border hover:text-fg')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Position */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{es ? 'Posicion del texto' : 'Text position'}</div>
            <div className="flex gap-1.5">
              {(['top', 'center', 'bottom'] as const).map(p => (
                <button key={p} onClick={() => setTextPosition(p)} className={cn('flex-1 h-9 rounded-lg text-[11px] font-medium border transition-all capitalize', textPosition === p ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>
                  {p === 'top' ? (es ? 'Arriba' : 'Top') : p === 'center' ? (es ? 'Centro' : 'Center') : (es ? 'Abajo' : 'Bottom')}
                </button>
              ))}
            </div>
          </div>

          {/* Overlay */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{es ? 'Oscuridad' : 'Overlay'} {overlay}%</div>
            <input type="range" min="0" max="90" value={overlay} onChange={e => setOverlay(Number(e.target.value))} className="w-full accent-[#C9A863]" />
          </div>

          {/* Edit Copy */}
          <button onClick={() => setEditingCopy(!editingCopy)} className="w-full h-10 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-2 transition-colors">
            <Type className="h-3.5 w-3.5" />
            {editingCopy ? (es ? 'Terminar edicion' : 'Finish editing') : (es ? 'Editar textos' : 'Edit texts')}
          </button>

          {/* Regenerate Image Only */}
          <button onClick={() => generate()} disabled={generating} className="w-full h-10 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            <ImageIcon className="h-3.5 w-3.5" />
            {generating ? (es ? 'Regenerando...' : 'Regenerating...') : (es ? 'Regenerar imagen' : 'Regenerate image')}
          </button>

          {/* Download */}
          <button onClick={exportAd} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium flex items-center justify-center gap-2 hover:brightness-110 transition">
            <Download className="h-4 w-4" />
            {es ? 'Descargar PNG' : 'Download PNG'}
          </button>
        </div>
      </div>
    </div>
  );
}
