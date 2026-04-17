'use client';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { PresetPicker } from './preset-picker';
import { AspectPicker } from './aspect-picker';
import { ImageCard, type ImageItem } from './image-card';
import { ReferenceUploader, type ReferenceImage } from './reference-uploader';
import type { AspectRatioId } from '../data/presets';
import { useI18n } from '@/lib/i18n';

export function ImageStudioView() {
  const [prompt, setPrompt] = useState('');
  const { t } = useI18n();
  const [preset, setPreset] = useState<string | null>('editorial');
  const [aspect, setAspect] = useState<AspectRatioId>('1:1');
  const [enhance, setEnhance] = useState(true);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/images/list');
    const data = await res.json();
    setImages(data.images ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    const tempId = 'temp-' + Date.now();
    const placeholder: ImageItem = {
      id: tempId,
      prompt,
      enhanced_prompt: null,
      preset,
      aspect_ratio: aspect,
      is_starred: false,
      status: 'processing',
      display_urls: [],
      created_at: new Date().toISOString(),
      error_message: null,
    };
    setImages((prev) => [placeholder, ...prev]);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          preset: preset ?? undefined,
          aspectRatio: aspect,
          enhance,
          referenceUrls: references.length > 0 ? references.map((r) => r.url) : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Generation failed');

      toast.success('Image ready');
      setPrompt('');
      setReferences([]);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
      setImages((prev) => prev.filter((i) => i.id !== tempId));
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

  return (
    <div className="space-y-8">
      <div className="surface-raised p-6 space-y-5">
        <div>
          <Label htmlFor="prompt">{t("img.what_to_generate")}</Label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A minimalist still life of a crystal perfume bottle on warm marble, soft morning light..."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-fg-subtle">
            <Wand2 className="h-3 w-3 text-gold" />
            <span>
              {enhance
                ? 'Prompt enhancer is on — your brief gets rewritten with expert detail.'
                : 'Prompt enhancer is off — your text is used raw.'}
            </span>
            <button
              type="button"
              onClick={() => setEnhance((v) => !v)}
              className="text-gold hover:underline"
            >
              {enhance ? 'Turn off' : 'Turn on'}
            </button>
          </div>
        </div>

        <div>
          <Label>
            Reference images <span className="text-fg-subtle normal-case tracking-normal">{t("img.optional")}</span>
          </Label>
          <ReferenceUploader
            value={references}
            onChange={setReferences}
            maxImages={4}
          />
        </div>

        <div>
          <Label>{t("img.preset")}</Label>
          <PresetPicker value={preset} onChange={setPreset} />
        </div>

        <div>
          <Label>{t("img.aspect_ratio")}</Label>
          <AspectPicker value={aspect} onChange={setAspect} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
            <ImageIcon className="h-3 w-3 text-gold" />
            <span>Flux 2 Pro · {references.length > 0 ? '~9 sec with references' : '~6 sec'}</span>
          </div>
          <Button
            size="md"
            onClick={generate}
            disabled={!prompt.trim() || generating}
            loading={generating}
          >
            {!generating && <Sparkles className="h-4 w-4" />}
            <span>{generating ? 'Generating...' : 'Generate'}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">{t("img.library")}</h2>
        <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
          {(['all', 'starred'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                'h-7 px-3 rounded text-[12px] transition-colors ' +
                (filter === f ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg')
              }
            >
              {f === 'all' ? 'All' : 'Starred'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <Loader2 className="h-8 w-8 text-gold/40 mx-auto mb-3" />
          <p className="text-[13.5px] text-fg-muted">
            {filter === 'starred' ? 'No starred images yet.' : 'No images yet. Your first generation takes ~6 seconds.'}
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
