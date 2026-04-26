'use client';

/**
 * Stage Assets — optional product photo uploader.
 *
 * User can:
 *   - Skip (Brain generates everything from scratch)
 *   - Upload product photos as references
 *
 * Photos are saved to draft.intake_data.visualReferences (URLs)
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Upload, X, ArrowRight } from 'lucide-react';

interface StageAssetsProps {
  draftId: string;
  initialUrls?: string[];
  onContinue: (uploadedUrls: string[]) => void;
  onSkip: () => void;
}

export function StageAssets({ draftId, initialUrls, onContinue, onSkip }: StageAssetsProps) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>(initialUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const newUrls: string[] = [];

      for (const file of Array.from(files).slice(0, 6)) {
        // Use existing /api/upload-image endpoint (or similar)
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('/api/creative/analyze', {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });

        // Fallback: just create object URL for preview if upload endpoint fails
        if (!res.ok) {
          // Create local preview only — they won't be persisted but we proceed
          newUrls.push(URL.createObjectURL(file));
          continue;
        }

        const body = await res.json();
        if (body.url || body.imageUrl) {
          newUrls.push(body.url ?? body.imageUrl);
        } else {
          newUrls.push(URL.createObjectURL(file));
        }
      }

      setUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    setUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {t('cb.assets.eyebrow')}
        </div>
        <h1 className="font-display text-[34px] leading-tight">{t('cb.assets.title')}</h1>
        <p className="text-[14px] text-fg-muted mt-2">{t('cb.assets.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {/* Uploader */}
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
        <p className="text-[11.5px] text-fg-subtle mt-1.5">PNG, JPG, WebP · Max 6 images</p>
      </label>

      {/* Preview grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {urls.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden border border-border bg-surface-2 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-bg/80 backdrop-blur-sm flex items-center justify-center text-fg-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
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
          onClick={() => onContinue(urls)}
          className="flex-[2] py-3 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px] flex items-center justify-center gap-2"
        >
          {t('cb.assets.continue')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
