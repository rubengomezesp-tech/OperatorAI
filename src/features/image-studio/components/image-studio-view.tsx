'use client';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon, Grid2x2 } from 'lucide-react';
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

export function ImageStudioView() {
  const { t, locale } = useI18n();
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

  const refresh = useCallback(async () => {
    const res = await fetch('/api/images/list');
    const data = await res.json();
    setImages(data.images ?? []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    // Create placeholders for each image
    const tempIds = Array.from({ length: numImages }, (_, i) => 'temp-' + Date.now() + '-' + i);
    const placeholders: ImageItem[] = tempIds.map((id) => ({
      id,
      prompt,
      enhanced_prompt: null,
      preset,
      aspect_ratio: aspect,
      is_starred: false,
      status: 'processing' as const,
      display_urls: [],
      created_at: new Date().toISOString(),
      error_message: null,
    }));
    setImages((prev) => [...placeholders, ...prev]);

    try {
      // Generate images sequentially with delay to avoid rate limits
      for (let i = 0; i < numImages; i++) {
        if (i > 0) {
          toast.info(locale === 'es' ? 'Imagen ' + (i + 1) + ' de ' + numImages + '...' : 'Image ' + (i + 1) + ' of ' + numImages + '...');
          await new Promise(r => setTimeout(r, 12000));
        }
        const res = await fetch('/api/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            imageModel,
            preset: preset ?? undefined,
            aspectRatio: aspect,
            enhance,
            referenceUrls: references.length > 0 ? references.map((r) => r.url) : undefined,
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          const errMsg = body?.error ?? 'Generation failed';
          // Don't break on rate limit — just skip this one
          if (errMsg.includes('429') || errMsg.includes('throttled')) {
            toast.error(locale === 'es' ? 'Límite de API — esperando...' : 'API limit — waiting...');
            await new Promise(r => setTimeout(r, 15000));
            continue;
          }
          throw new Error(errMsg);
        }
      }

      toast.success(numImages > 1
        ? (locale === 'es' ? `${numImages} imágenes listas` : `${numImages} images ready`)
        : (locale === 'es' ? 'Imagen lista' : 'Image ready'));
      setPrompt('');
      setReferences([]);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
      setImages((prev) => prev.filter((img) => !tempIds.includes(img.id)));
    } finally {
      setGenerating(false);
    }
  }

  async function onStar(id: string, starred: boolean) {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: starred } : i)));
    await fetch('/api/images/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, starred }),
    }).catch(() => {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: !starred } : i)));
    });
  }

  async function onDelete(id: string) {
    if (!confirm(t('img.delete_confirm'))) return;
    setImages((prev) => prev.filter((i) => i.id !== id));
    await fetch('/api/images/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const visible = filter === 'starred' ? images.filter((i) => i.is_starred) : images;
  const placeholder = locale === 'es'
    ? 'Un bodegón minimalista con un frasco de perfume de cristal sobre mármol cálido, luz suave de mañana...'
    : 'A minimalist still life of a crystal perfume bottle on warm marble, soft morning light...';

  return (
    <div className="space-y-8">
      {/* Generator panel */}
      <div className="surface-raised p-6 space-y-5">
        {/* Prompt */}
        <div>
          <Label htmlFor="prompt">{t('img.what_to_generate')}</Label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-fg-subtle">
            <Wand2 className="h-3 w-3 text-gold" />
            <span>{enhance ? t('img.enhancer_on') : t('img.enhancer_off')}</span>
            <button type="button" onClick={() => setEnhance((v) => !v)} className="text-gold hover:underline">
              {enhance ? t('img.turn_off') : t('img.turn_on')}
            </button>
          </div>
        </div>

        {/* References */}
        <div>
          <Label>{t('img.references')} <span className="text-fg-subtle normal-case tracking-normal">{t('img.optional')}</span></Label>
          <ReferenceUploader value={references} onChange={setReferences} maxImages={10} />
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          <div>
            <Label>{t('img.preset')}</Label>
            <PresetPicker value={preset} onChange={setPreset} />
          </div>
          <div>
            <Label>{t('img.aspect_ratio')}</Label>
            <AspectPicker value={aspect} onChange={setAspect} />
          </div>
          <div>
            <Label><Grid2x2 className="inline h-3 w-3 mr-1" />{locale === 'es' ? 'Cantidad' : 'Count'}</Label>
            <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumImages(n)}
                  className={cn(
                    'flex-1 h-8 rounded text-[13px] font-medium transition-colors',
                    numImages === n ? 'bg-gold/15 text-gold border border-gold/30' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{locale === 'es' ? 'Modelo' : 'Model'}</Label>
            <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
              {([['flux-2-pro', 'Flux 2 Pro'], ['flux-1.1-pro', 'Flux 1.1 Pro']] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setImageModel(id as any)}
                  className={cn(
                    'flex-1 h-8 rounded text-[11px] font-medium transition-colors',
                    imageModel === id ? 'bg-gold/15 text-gold border border-gold/30' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
            <ImageIcon className="h-3 w-3 text-gold" />
            <span>{imageModel === 'flux-2-pro' ? 'Flux 2 Pro' : 'Flux 1.1 Pro'} &middot; {references.length > 0 ? t('img.with_refs') : t('img.no_refs')}{numImages > 1 ? ` × ${numImages}` : ''}</span>
          </div>
          <Button size="md" onClick={generate} disabled={!prompt.trim() || generating} loading={generating}>
            {!generating && <Sparkles className="h-4 w-4" />}
            <span>{generating ? t('img.generating') : t('img.generate')}</span>
          </Button>
        </div>
      </div>

      {/* Library */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">{t('img.library')}</h2>
        <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
          {(['all', 'starred'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                'h-7 px-3 rounded text-[12px] transition-colors',
                filter === f ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {f === 'all' ? t('img.all') : t('img.starred')}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <ImageIcon className="h-8 w-8 text-gold/40 mx-auto mb-3" />
          <p className="text-[13.5px] text-fg-muted">
            {filter === 'starred' ? t('img.empty_starred') : t('img.empty_all')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((img) => (
            <ImageCard key={img.id} img={img} onStar={onStar} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
