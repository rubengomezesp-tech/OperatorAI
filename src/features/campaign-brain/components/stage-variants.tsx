'use client';

/**
 * Stage Variants — render the variants and display them.
 *
 * On mount: triggers /api/campaign/render-batch
 * Shows skeleton while rendering
 * Shows grid of generated variants when ready
 * Each variant has actions: regenerate, download, edit (V3)
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Download, RotateCcw, Loader2, AlertTriangle } from 'lucide-react';
import type { BrainOutput } from '@/features/campaign-brain/types';

interface BatchVariantResult {
  id: string;
  imageUrl: string | null;
  composedV2: boolean;
  error?: string;
}

interface StageVariantsProps {
  draftId: string;
  brainOutput: BrainOutput;
  onSaveCampaign: () => void;
}

function humanize(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function StageVariants({ draftId, brainOutput, onSaveCampaign }: StageVariantsProps) {
  const { t } = useI18n();
  const [variants, setVariants] = useState<BatchVariantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial render
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/campaign/render-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ draftId, maxVariants: 4 }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Render failed: ${res.status}`);
        }

        const body = await res.json();
        if (!cancelled) {
          setVariants(body.variants ?? []);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  const briefById = new Map(brainOutput.variantBriefs.map((b) => [b.id, b]));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {t('cb.variants.eyebrow')}
        </div>
        <h1 className="font-display text-[34px] leading-tight">{t('cb.variants.title')}</h1>
        <p className="text-[14px] text-fg-muted mt-2">{t('cb.variants.subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-fg-muted text-[13.5px]">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <span>{t('cb.variants.rendering')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] rounded-lg bg-surface-2 border border-border animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Variants grid */}
      {!loading && variants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {variants.map((v) => {
            const brief = briefById.get(v.id);
            return (
              <VariantCard
                key={v.id}
                variant={v}
                briefAngle={brief?.angle}
                briefHeadline={brief?.headline}
                briefPlatform={brief?.platform}
                t={t}
              />
            );
          })}
        </div>
      )}

      {/* Sticky action bar */}
      {!loading && variants.length > 0 && (
        <div className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-border py-4 -mx-4 px-4 mt-8 flex gap-3">
          <button
            type="button"
            onClick={onSaveCampaign}
            className="w-full py-3 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px]"
          >
            {t('cb.variants.save_campaign')}
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant card
// ────────────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: BatchVariantResult;
  briefAngle?: string;
  briefHeadline?: string;
  briefPlatform?: string;
  t: (k: string) => string;
}

function VariantCard({ variant, briefAngle, briefHeadline, briefPlatform, t }: VariantCardProps) {
  const isError = !!variant.error || !variant.imageUrl;

  return (
    <div className="rounded-lg border border-border bg-surface-2 overflow-hidden">
      <div className="aspect-[4/5] bg-bg flex items-center justify-center relative overflow-hidden">
        {variant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={variant.imageUrl}
            alt={briefHeadline ?? 'variant'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-400 mb-2" />
            <p className="text-[12.5px] text-fg-muted">{variant.error ?? 'Render failed'}</p>
          </div>
        )}

        {/* Badge top-left: angle */}
        {briefAngle && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-bg/80 backdrop-blur-sm text-[10.5px] uppercase tracking-[0.12em] text-gold border border-gold/30">
            {humanize(briefAngle)}
          </span>
        )}

        {/* Badge top-right: platform */}
        {briefPlatform && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-bg/80 backdrop-blur-sm text-[10.5px] uppercase tracking-[0.12em] text-fg-muted border border-border">
            {briefPlatform}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-3">
        {briefHeadline && (
          <p className="text-[13px] text-fg leading-snug line-clamp-2">{briefHeadline}</p>
        )}

        {!isError && (
          <div className="flex items-center gap-2">
            <a
              href={variant.imageUrl ?? '#'}
              download
              className="flex-1 py-1.5 rounded-md border border-border bg-surface text-fg-muted hover:text-fg hover:border-fg-muted text-[12.5px] flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              {t('cb.variants.download')}
            </a>
            <button
              type="button"
              disabled
              title="Coming in V3"
              className="flex-1 py-1.5 rounded-md border border-border bg-surface text-fg-subtle text-[12.5px] flex items-center justify-center gap-1.5 cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('cb.variants.regenerate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
