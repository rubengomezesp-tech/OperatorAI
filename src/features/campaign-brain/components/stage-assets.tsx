'use client';

/**
 * Stage Assets (Vision-Aware EN-3)
 *
 * Flow:
 *   1. User uploads product photos
 *   2. Each photo:
 *      a. Uploaded to /api/images/upload-reference -> public URL
 *      b. Analyzed by /api/research/vision-analyze -> structured analysis
 *   3. Analysis displayed inline (so user sees what Gemini detected)
 *   4. Both URLs and analyses persisted to draft.intake_data via PATCH
 *   5. Stage Variants picks them up as referenceImages -> Nano Banana
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Upload, X, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProductAnalysis {
  productType: string;
  shape: string;
  materials: string[];
  colors: string[];
  branding: string;
  generationDescription: string;
  fromLiveAnalysis: boolean;
}

interface AssetItem {
  url: string;
  analyzing: boolean;
  analysis: ProductAnalysis | null;
  error?: string;
}

interface StageAssetsProps {
  draftId: string;
  initialUrls?: string[];
  onContinue: (uploadedUrls: string[]) => void;
  onSkip: () => void;
}

export function StageAssets({
  draftId,
  initialUrls,
  onContinue,
  onSkip,
}: StageAssetsProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<AssetItem[]>(
    (initialUrls ?? []).map((url) => ({ url, analyzing: false, analysis: null })),
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/images/upload-reference', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) return null;
      const body = await res.json();
      return body.url ?? body.imageUrl ?? null;
    } catch {
      return null;
    }
  }

  async function analyzeOne(imageUrl: string): Promise<ProductAnalysis | null> {
    try {
      const res = await fetch('/api/research/vision-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageUrl, type: 'product' }),
      });
      if (!res.ok) return null;
      const body = await res.json();
      return (body.analysis as ProductAnalysis) ?? null;
    } catch {
      return null;
    }
  }

  async function persistToDraft(allItems: AssetItem[]) {
    try {
      await fetch('/api/campaigns/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: draftId,
          intake_patch: {
            visualReferences: allItems.filter((i) => i.url).map((i) => i.url),
            productAnalyses: allItems
              .filter((i) => i.analysis)
              .map((i) => i.analysis),
          },
        }),
      });
    } catch (err) {
      console.warn('[stage-assets] persist failed', err);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    const filesArray = Array.from(files).slice(0, 6);
    // Add placeholder items for visual feedback
    const placeholders: AssetItem[] = filesArray.map(() => ({
      url: '',
      analyzing: true,
      analysis: null,
    }));
    setItems((prev) => [...prev, ...placeholders]);

    try {
      const finalItems: AssetItem[] = [];
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const url = await uploadOne(file);
        if (!url) {
          finalItems.push({
            url: URL.createObjectURL(file),
            analyzing: false,
            analysis: null,
            error: 'Upload failed (using local preview)',
          });
          continue;
        }

        // Show URL immediately, analysis in next pass
        const item: AssetItem = { url, analyzing: true, analysis: null };
        finalItems.push(item);

        // Update items so user sees image while we analyze
        setItems((prev) => {
          const next = [...prev];
          // Replace the corresponding placeholder
          const placeholderStart = next.length - placeholders.length;
          next[placeholderStart + i] = item;
          return next;
        });

        // Analyze in parallel-ish (fire and update)
        analyzeOne(url).then((analysis) => {
          setItems((prev) => {
            const next = [...prev];
            const idx = next.findIndex((it) => it.url === url);
            if (idx >= 0) {
              next[idx] = { ...next[idx], analyzing: false, analysis };
            }
            return next;
          });
        });
      }

      // Persist final state
      await persistToDraft(finalItems);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Persist after removal (best-effort)
      persistToDraft(next);
      return next;
    });
  }

  function handleContinue() {
    onContinue(items.filter((i) => i.url).map((i) => i.url));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {t('cb.assets.eyebrow')}
        </div>
        <h1 className="font-display text-[34px] leading-tight">
          {t('cb.assets.title')}
        </h1>
        <p className="text-[14px] text-fg-muted mt-2">{t('cb.assets.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      <label
        className={[
          'block rounded-lg border-2 border-dashed border-border bg-surface-2/30',
          'hover:border-gold/40 hover:bg-surface-2/60 transition-all cursor-pointer',
          'p-12 text-center',
          uploading && 'opacity-60 pointer-events-none',
        ].join(' ')}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        <Upload className="h-10 w-10 mx-auto text-fg-subtle mb-3" />
        <p className="text-[14px] text-fg-muted">
          {uploading ? t('cb.intake.save.saving') : t('cb.assets.upload')}
        </p>
        <p className="text-[11.5px] text-fg-subtle mt-1.5">
          PNG, JPG, WebP · Max 6 images
        </p>
      </label>

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <AssetCard
              key={`${item.url}-${i}`}
              item={item}
              onRemove={() => removeImage(i)}
              t={t}
            />
          ))}
        </div>
      )}

      <div className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-border py-4 -mx-4 px-4 mt-8 flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="flex-1 py-3 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-fg-muted transition-all text-[14px]"
        >
          {t('cb.assets.skip')}
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="flex-[2] py-3 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px] flex items-center justify-center gap-2"
        >
          {t('cb.assets.continue')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Asset Card (image + Gemini analysis inline)
// ────────────────────────────────────────────────────────────────

function AssetCard({
  item,
  onRemove,
  t,
}: {
  item: AssetItem;
  onRemove: () => void;
  t: (k: string) => string;
}) {
  return (
    <div className="rounded-md overflow-hidden border border-border bg-surface-2 group">
      <div className="relative aspect-[4/3] bg-bg">
        {item.url && !item.url.startsWith('blob:') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="w-full h-full object-cover" />
        ) : item.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-fg-subtle" />
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-bg/80 backdrop-blur-sm flex items-center justify-center text-fg-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Analysis */}
      <div className="p-3 space-y-1.5">
        {item.analyzing && (
          <div className="flex items-center gap-2 text-[11.5px] text-fg-muted">
            <Loader2 className="h-3 w-3 animate-spin text-gold" />
            <span>{t('cb.assets.analyzing')}</span>
          </div>
        )}

        {item.analysis && item.analysis.fromLiveAnalysis && (
          <>
            <div className="flex items-start gap-1.5 text-[11.5px]">
              <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-fg-muted">
                <span className="text-fg font-medium">
                  {item.analysis.productType}
                </span>
                {item.analysis.shape && ` · ${item.analysis.shape}`}
              </span>
            </div>
            {item.analysis.colors.length > 0 && (
              <div className="flex items-center gap-1.5">
                {item.analysis.colors.slice(0, 4).map((c, i) => {
                  // Try to extract hex if present
                  const hex = c.match(/#[0-9A-Fa-f]{3,6}/)?.[0];
                  return hex ? (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-sm border border-border"
                      style={{ backgroundColor: hex }}
                      title={c}
                    />
                  ) : null;
                })}
              </div>
            )}
            {item.analysis.generationDescription && (
              <p className="text-[11px] text-fg-subtle italic line-clamp-2">
                <Sparkles className="h-2.5 w-2.5 inline-block mr-1 text-gold" />
                {item.analysis.generationDescription}
              </p>
            )}
          </>
        )}

        {item.error && (
          <p className="text-[11.5px] text-red-400">{item.error}</p>
        )}
      </div>
    </div>
  );
}
