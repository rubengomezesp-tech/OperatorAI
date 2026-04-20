'use client';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon, Send, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { PresetPicker } from './preset-picker';
import { AspectPicker } from './aspect-picker';
import { ImageCard, type ImageItem } from './image-card';
import { ReferenceUploader, type ReferenceImage } from './reference-uploader';
import type { AspectRatioId } from '../data/presets';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const NUM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ImageStudioView() {
  const { t, locale } = useI18n();
  const es = locale === 'es';

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState<string | null>('editorial');
  const [aspect, setAspect] = useState<AspectRatioId>('1:1');
  const [enhance, setEnhance] = useState(true);
  const [numImages, setNumImages] = useState(1);
  const [imageModel, setImageModel] = useState<'flux-2-pro' | 'flux-1.1-pro'>('flux-2-pro');
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  // Refinement chat
  const [lastPrompt, setLastPrompt] = useState('');
  const [refinement, setRefinement] = useState('');
  const [showRefine, setShowRefine] = useState(false);

  // Persist references in sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('operator.studio.refs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setReferences(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (references.length > 0) {
      try { sessionStorage.setItem('operator.studio.refs', JSON.stringify(references)); } catch {}
    }
  }, [references]);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/images/list');
    const data = await res.json();
    setImages(data.images ?? []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function generate(customPrompt?: string) {
    const thePrompt = customPrompt || prompt;
    if (!thePrompt.trim() && references.length === 0) {
      toast.error(es ? 'Escribe un prompt o sube referencias' : 'Enter a prompt or upload references');
      return;
    }
    setGenerating(true);
    setLastPrompt(thePrompt);

    const tempIds = Array.from({ length: numImages }, (_, i) => 'temp-' + Date.now() + '-' + i);
    setImages(prev => [...tempIds.map(id => ({ id, prompt: thePrompt, enhanced_prompt: null, preset, aspect_ratio: aspect, is_starred: false, status: 'processing' as const, display_urls: [], created_at: new Date().toISOString(), error_message: null })), ...prev]);

    try {
      for (let i = 0; i < numImages; i++) {
        if (numImages > 1) {
          toast.info(es ? 'Imagen ' + (i + 1) + ' de ' + numImages + '...' : 'Image ' + (i + 1) + ' of ' + numImages + '...');
        }
        const res = await fetch('/api/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: thePrompt,
            preset,
            aspectRatio: aspect,
            enhance,
            imageModel,
            referenceUrls: references.length > 0 ? references.map(r => r.url) : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setImages(prev => prev.map(img => img.id === tempIds[i] ? { ...img, ...data.image, status: 'complete' as const } : img));
        if (i < numImages - 1) await new Promise(r => setTimeout(r, 3000));
      }
      toast.success(numImages > 1
        ? (es ? numImages + ' imagenes listas' : numImages + ' images ready')
        : (es ? 'Imagen lista' : 'Image ready'));
      setShowRefine(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      toast.error(msg);
      setImages(prev => prev.filter(img => !tempIds.includes(img.id)));
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefine() {
    if (!refinement.trim()) return;
    const newPrompt = lastPrompt + '. ' + refinement;
    setRefinement('');
    await generate(newPrompt);
  }

  const filtered = filter === 'starred' ? images.filter(i => i.is_starred) : images;

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[1280px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-[24px]">Image Studio</h1>
            <p className="text-[11px] text-fg-muted">{es ? 'Genera imagenes profesionales con IA' : 'Generate professional AI images'}</p>
          </div>
        </div>
      </div>

      {/* Generation Panel */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        {/* Prompt */}
        <div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={es ? 'Describe la imagen que quieres crear...' : 'Describe the image you want to create...'}
            rows={2}
            className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-[14px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
          />
        </div>

        {/* Controls Row 1: Preset + Aspect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{es ? 'Estilo' : 'Style'}</Label>
            <PresetPicker value={preset} onChange={setPreset} />
          </div>
          <div>
            <Label>{es ? 'Formato' : 'Aspect Ratio'}</Label>
            <AspectPicker value={aspect} onChange={setAspect} />
          </div>
        </div>

        {/* Controls Row 2: Model + Count + Enhance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Model */}
          <div>
            <Label>{es ? 'Modelo' : 'Model'}</Label>
            <div className="flex gap-1 p-1 rounded-lg border border-border bg-surface-2">
              {([['flux-2-pro', 'Flux 2 Pro'], ['flux-1.1-pro', 'Flux 1.1 Pro']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setImageModel(id as any)}
                  className={cn(
                    'flex-1 h-8 rounded-md text-[11px] font-medium transition-all',
                    imageModel === id ? 'bg-gold/15 text-gold shadow-sm' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Count — modern slider style */}
          <div>
            <Label>{es ? 'Cantidad' : 'Count'} <span className="text-gold font-display">{numImages}</span></Label>
            <div className="flex items-center gap-1.5 p-1 rounded-lg border border-border bg-surface-2 overflow-x-auto">
              {NUM_OPTIONS.map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumImages(n)}
                  className={cn(
                    'h-8 w-8 rounded-md text-[12px] font-medium transition-all shrink-0',
                    numImages === n ? 'bg-gold/15 text-gold shadow-sm' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Enhance toggle */}
          <div>
            <Label>{es ? 'Auto-mejora' : 'Auto-enhance'}</Label>
            <button
              onClick={() => setEnhance(!enhance)}
              className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-border bg-surface-2"
            >
              <span className="text-[12px] text-fg-muted">{enhance ? (es ? 'Prompt optimizado por IA' : 'AI-optimized prompt') : (es ? 'Prompt original' : 'Original prompt')}</span>
              <div className={cn('h-5 w-9 rounded-full transition-colors relative', enhance ? 'bg-gold' : 'bg-surface-3 border border-border')}>
                <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', enhance ? 'translate-x-4' : 'translate-x-0.5')} />
              </div>
            </button>
          </div>
        </div>

        {/* References */}
        <div>
          <Label>
            {es ? 'Imagenes de referencia' : 'Reference images'}
            <span className="text-fg-subtle normal-case tracking-normal font-normal ml-1">
              {references.length > 0 ? `(${references.length}/10)` : (es ? '(opcional, hasta 10)' : '(optional, up to 10)')}
            </span>
          </Label>
          <ReferenceUploader value={references} onChange={setReferences} maxImages={10} />
          {references.length > 0 && (
            <button onClick={() => { setReferences([]); sessionStorage.removeItem('operator.studio.refs'); }} className="mt-1 text-[11px] text-fg-subtle hover:text-red-400 transition-colors">
              {es ? 'Limpiar referencias' : 'Clear references'}
            </button>
          )}
        </div>

        {/* Generate button */}
        <Button
          onClick={() => generate()}
          disabled={generating}
          className="w-full h-12 text-[14px] font-medium"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />{es ? 'Generando...' : 'Generating...'}</>
          ) : (
            <><Wand2 className="h-4 w-4 mr-2" />{es ? 'Generar' : 'Generate'} {numImages > 1 ? `(${numImages})` : ''}</>
          )}
        </Button>

        {/* Model badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-fg-subtle">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>{imageModel === 'flux-2-pro' ? 'Flux 2 Pro' : 'Flux 1.1 Pro'} &middot; {references.length > 0 ? (es ? 'con refs' : 'with refs') : (es ? 'sin refs' : 'no refs')}{numImages > 1 ? ' x ' + numImages : ''}</span>
        </div>
      </div>

      {/* Refinement Chat — appears after generation */}
      {showRefine && !generating && (
        <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-3.5 w-3.5 text-gold" />
            <span className="text-[12px] font-medium text-gold">{es ? 'Refinar resultado' : 'Refine result'}</span>
          </div>
          <p className="text-[11px] text-fg-muted">{es ? 'Dile que corregir o cambiar. Mantiene tus referencias y ajustes.' : 'Tell it what to fix or change. Keeps your references and settings.'}</p>
          <div className="flex gap-2">
            <input
              value={refinement}
              onChange={e => setRefinement(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRefine(); }}
              placeholder={es ? 'Ej: mas luminoso, sin texto, fondo negro...' : 'e.g. brighter, no text, black background...'}
              className="flex-1 h-10 px-3 rounded-lg border border-gold/20 bg-surface text-[13px] focus:outline-none focus:border-gold/40 placeholder:text-fg-subtle"
            />
            <button
              onClick={handleRefine}
              disabled={!refinement.trim()}
              className="h-10 w-10 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/25 transition-colors disabled:opacity-30"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-[18px]">{es ? 'Galeria' : 'Gallery'}</h2>
            <span className="text-[11px] text-fg-subtle">({filtered.length})</span>
          </div>
          <div className="flex gap-1 p-0.5 rounded-md border border-border bg-surface-2">
            {(['all', 'starred'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={cn('h-7 px-3 rounded text-[11px] transition-colors', filter === f ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg')}>
                {f === 'all' ? (es ? 'Todas' : 'All') : (es ? 'Favoritas' : 'Starred')}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <ImageIcon className="h-8 w-8 text-fg-subtle mx-auto mb-3" />
            <p className="text-[14px] text-fg-muted">{es ? 'Tus imagenes apareceran aqui' : 'Your images will appear here'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(img => (
              <ImageCard key={img.id} img={img} onStar={async (id, starred) => { await fetch("/api/images/star", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, starred }) }); refresh(); }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
