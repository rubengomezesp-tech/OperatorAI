'use client';
import { useState, useRef } from 'react';
import { Upload, Loader2, Play, Download, RotateCcw, X, Sparkles, Video, Type, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

type Step = 'upload' | 'generating' | 'result';
type Priority = 'fast' | 'balanced' | 'exact';

interface UploadedImage { url: string; preview: string; file: File; }
interface CampaignResult {
  copy: { hook: string; message: string; cta: string };
  video: { id: string; url: string; duration: number };
  model: string;
}

export function CreateView() {
  const { locale } = useI18n();
  const es = locale === 'es';
  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [objective, setObjective] = useState('');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [duration, setDuration] = useState(15);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [playing, setPlaying] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const remaining = 10 - images.length;
    for (const file of Array.from(e.target.files).slice(0, remaining)) {
      if (file.size > 10 * 1024 * 1024) continue;
      // Upload to Supabase via existing reference API
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages(prev => [...prev, { url: data.url, preview: URL.createObjectURL(file), file }]);
        }
      } catch {}
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(i: number) {
    setImages(prev => { const n = [...prev]; URL.revokeObjectURL(n[i].preview); n.splice(i, 1); return n; });
  }

  async function generate() {
    if (images.length === 0) { toast.error(es ? 'Sube al menos una imagen' : 'Upload at least one image'); return; }
    setStep('generating');
    setGenerating(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

    try {
      const res = await fetch('/api/create/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: images.map(i => i.url),
          objective: objective || undefined,
          priority,
          duration,
          format: '9:16',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setResult(data.campaign);
      setStep('result');
      toast.success(es ? 'Campana lista' : 'Campaign ready');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
      setStep('upload');
    } finally {
      setGenerating(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function reset() { setStep('upload'); setResult(null); setPlaying(false); }
  const fmt = (s: number) => { const m = Math.floor(s/60); return m > 0 ? m+'m '+s%60+'s' : s+'s'; };
  const est = priority === 'fast' ? 60 : priority === 'exact' ? 180 : 120;

  // ═══════ UPLOAD STEP ═══════
  if (step === 'upload') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-6">
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
          <Sparkles className="h-3 w-3" />Create
        </div>
        <h1 className="font-display text-[28px] lg:text-[36px]">
          {es ? (<>Sube. Crea. <span className="text-gold">Publica.</span></>) : (<>Upload. Create. <span className="text-gold">Publish.</span></>)}
        </h1>
        <p className="text-[13px] text-fg-muted mt-2 max-w-[400px] mx-auto">
          {es ? 'Sube tus imagenes y el sistema crea tu anuncio completo automaticamente.' : 'Upload your images and the system creates your complete ad automatically.'}
        </p>
      </div>

      {/* Images */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
          {es ? 'Imagenes' : 'Images'} {images.length > 0 && <span className="text-gold">({images.length}/10)</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-border">
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ))}
          {images.length < 10 && (
            <button onClick={() => fileRef.current?.click()} className={cn(
              'rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
              images.length === 0 ? 'w-full h-32 border-gold/30 bg-gold/5 hover:bg-gold/10' : 'h-20 w-20 border-border hover:border-gold/40 bg-surface-2',
            )}>
              <Upload className={cn('text-gold', images.length === 0 ? 'h-6 w-6' : 'h-4 w-4')} />
              {images.length === 0 && <span className="text-[12px] text-gold font-medium">{es ? 'Sube imagenes' : 'Upload images'}</span>}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
      </div>

      {/* Objective (optional) */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">{es ? 'Objetivo (opcional)' : 'Objective (optional)'}</div>
        <input
          value={objective} onChange={e => setObjective(e.target.value)}
          placeholder={es ? 'Ej: Lanzamiento de producto, 7 dias gratis, premium...' : 'e.g. Product launch, 7 days free, premium brand...'}
          className="w-full h-11 px-3 rounded-lg border border-border bg-surface-2 text-[13px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
        />
      </div>

      {/* Priority + Duration */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{es ? 'Modo' : 'Mode'}</div>
          <div className="flex gap-1.5">
            {([['fast', 'Fast'], ['balanced', 'Balanced'], ['exact', 'Exact']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setPriority(id)} className={cn('flex-1 h-8 rounded-md text-[10px] font-medium border transition-all', priority === id ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{es ? 'Duracion' : 'Duration'}</div>
          <div className="flex gap-1.5">
            {([5, 10, 15] as const).map(d => (
              <button key={d} onClick={() => setDuration(d)} className={cn('flex-1 h-8 rounded-md text-[11px] font-medium border transition-all', duration === d ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generate */}
      <button onClick={generate} disabled={images.length === 0} className="w-full h-13 rounded-xl gold-grad text-bg text-[15px] font-semibold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-3">
        <Zap className="h-5 w-5" />
        {es ? 'Crear campana' : 'Create Campaign'}
      </button>
    </div>
  );

  // ═══════ GENERATING STEP ═══════
  if (step === 'generating') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto">
      <div className="flex flex-col items-center justify-center py-16 space-y-8">
        <div className="h-20 w-20 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-gold animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-[24px] mb-2">{es ? 'Creando tu campana...' : 'Creating your campaign...'}</h2>
          <p className="text-[13px] text-fg-muted">{fmt(elapsed)} / ~{fmt(est)}</p>
        </div>
        <div className="w-full max-w-[400px] h-2 rounded-full bg-surface-3 overflow-hidden">
          <div className="h-full rounded-full gold-grad transition-all duration-1000" style={{ width: Math.min(95, (elapsed/est)*100) + '%' }} />
        </div>
        <div className="flex gap-6 text-[11px]">
          {[
            { label: 'Copy', done: elapsed > 5 },
            { label: es ? 'Video' : 'Video', done: elapsed > est * 0.8 },
            { label: 'Export', done: false },
          ].map(s => (
            <div key={s.label} className={cn('flex items-center gap-2', s.done ? 'text-gold' : 'text-fg-subtle')}>
              <div className={cn('h-2 w-2 rounded-full', s.done ? 'bg-gold' : 'bg-fg-subtle/30')} />
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══════ RESULT STEP ═══════
  if (!result) return null;

  const videoSrc = result.video.url.startsWith('http') && !result.video.url.includes('supabase')
    ? '/api/videos/stream?url=' + encodeURIComponent(result.video.url)
    : result.video.url;

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[22px]">{es ? 'Tu campana' : 'Your campaign'}</h2>
        <div className="flex gap-2">
          <button onClick={reset} className="h-9 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5" />{es ? 'Nueva' : 'New'}</button>
          <a href={result.video.url} download className="h-9 px-4 rounded-lg gold-grad text-bg text-[12px] font-medium flex items-center gap-2"><Download className="h-3.5 w-3.5" />{es ? 'Descargar' : 'Download'}</a>
        </div>
      </div>

      {/* Video */}
      <div className="rounded-xl border border-border overflow-hidden bg-black">
        <div className="relative" style={{ aspectRatio: '9/16', maxHeight: 480 }}>
          {playing ? (
            <video src={videoSrc} controls autoPlay playsInline className="w-full h-full object-contain" onEnded={() => setPlaying(false)} />
          ) : (
            <button onClick={() => setPlaying(true)} className="w-full h-full flex items-center justify-center bg-surface-2">
              <div className="h-16 w-16 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-gold ml-1" />
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Copy */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle flex items-center gap-2"><Type className="h-3 w-3" /> Ad Copy</div>
        <div className="space-y-2">
          <div><span className="text-[10px] text-fg-subtle uppercase">Hook:</span><p className="text-[15px] font-display">{result.copy.hook}</p></div>
          <div><span className="text-[10px] text-fg-subtle uppercase">Message:</span><p className="text-[13px] text-fg-muted">{result.copy.message}</p></div>
          <div className="pt-1"><span className="inline-block px-5 py-2 rounded-full bg-gold text-black text-[13px] font-semibold">{result.copy.cta}</span></div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-fg-subtle">
        <span>{result.model}</span>
        <span>{result.video.duration}s</span>
        <span>9:16</span>
      </div>
    </div>
  );
}
