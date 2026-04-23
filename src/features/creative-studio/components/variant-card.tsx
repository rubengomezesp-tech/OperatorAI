'use client';
import { memo } from 'react';
import {
  Loader2,
  RefreshCw,
  Download,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Variant, QualityReport } from '../types';

const LAYOUT_LABELS: Record<string, { en: string; es: string }> = {
  hero_app: { en: 'Hero App', es: 'Hero App' },
  feature_grid: { en: 'Feature Showcase', es: 'Vitrina de funciones' },
  story_ad: { en: 'Story Ad', es: 'Anuncio Story' },
  minimal_branding: { en: 'Minimal Branding', es: 'Branding minimal' },
  ui_focus: { en: 'UI Focus', es: 'UI en foco' },
};

interface Props {
  variant: Variant;
  imageUrl: string | null;
  loading: boolean;
  qualityReport?: QualityReport;
  locale: 'en' | 'es';
  onSelect: () => void;
  onRegenerate: () => void;
  isSelected?: boolean;
}

function VariantCardInner({
  variant,
  imageUrl,
  loading,
  qualityReport,
  locale,
  onSelect,
  onRegenerate,
  isSelected,
}: Props) {
  const label = LAYOUT_LABELS[variant.layout]?.[locale] || variant.layout;
  const aspect =
    variant.aspectRatio === '1:1'
      ? '1/1'
      : variant.aspectRatio === '4:5'
      ? '4/5'
      : '9/16';

  const qualityWarn = qualityReport && !qualityReport.passed;
  const hasRenderableImage =
    !!imageUrl &&
    (imageUrl.startsWith('http') || imageUrl.startsWith('data:image/'));

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!imageUrl) return;

    try {
      if (imageUrl.startsWith('data:image/')) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = variant.layout + '-' + variant.id + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = variant.layout + '-' + variant.id + '.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (imageUrl.startsWith('http')) {
        window.open(imageUrl, '_blank', 'noopener');
      }
    }
  }

  function handleRegenerate(e: React.MouseEvent) {
    e.stopPropagation();
    onRegenerate();
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden border-2 bg-surface transition-all',
        isSelected
          ? 'border-gold'
          : qualityWarn
          ? 'border-amber-500/40'
          : 'border-border hover:border-gold/40',
      )}
    >
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.12em] text-gold font-medium truncate">
          {label}
        </span>
        <span className="text-[9px] text-fg-subtle uppercase tracking-wide">
          {variant.angle}
        </span>
      </div>

      <div className="relative bg-black" style={{ aspectRatio: aspect }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
              <span className="text-[10px] text-fg-subtle">
                {locale === 'es' ? 'Generando...' : 'Generating...'}
              </span>
            </div>
          </div>
        ) : hasRenderableImage ? (
          <img
            src={imageUrl!}
            alt={variant.copy.headline || variant.layout}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
  console.error('[VariantCard] image failed to load:', imageUrl);
  console.error(
    '[VariantCard] current src:',
    (e.currentTarget as HTMLImageElement).currentSrc,
  );
  (e.currentTarget as HTMLImageElement).style.display = 'none';
}}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-fg-subtle">
              {locale === 'es' ? 'Sin imagen' : 'No image'}
            </span>
          </div>
        )}

        {!loading && hasRenderableImage && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={onSelect}
              className="h-9 px-3 rounded-lg bg-gold text-black text-[11px] font-medium flex items-center gap-1.5 hover:brightness-110"
            >
              <Edit3 className="h-3 w-3" />
              {locale === 'es' ? 'Editar' : 'Edit'}
            </button>
            <button
              onClick={handleRegenerate}
              className="h-9 w-9 rounded-lg bg-surface-2 border border-border text-fg flex items-center justify-center hover:border-gold/40"
              title={locale === 'es' ? 'Regenerar' : 'Regenerate'}
            >
              <RefreshCw className="h-3 w-3" />
            </button>
            <button
              onClick={handleDownload}
              className="h-9 w-9 rounded-lg bg-surface-2 border border-border text-fg flex items-center justify-center hover:border-gold/40"
              title={locale === 'es' ? 'Descargar' : 'Download'}
            >
              <Download className="h-3 w-3" />
            </button>
          </div>
        )}

        {qualityWarn && !loading && (
          <div
            className="absolute top-2 left-2 h-6 px-2 rounded-md bg-amber-500/90 text-black text-[9px] font-semibold flex items-center gap-1"
            title={qualityReport?.issues.join(' ')}
          >
            <AlertTriangle className="h-2.5 w-2.5" />
            {locale === 'es' ? 'Revisar' : 'Review'}
          </div>
        )}
      </div>

      <div className="px-3 py-2">
        <p className="text-[11px] text-fg font-medium truncate">
          {variant.copy.headline || (locale === 'es' ? 'Sin titular' : 'No headline')}
        </p>
        {variant.reasoningSummary && (
          <p className="text-[10px] text-fg-muted italic truncate mt-0.5">
            {variant.reasoningSummary}
          </p>
        )}
      </div>
    </div>
  );
}

export const VariantCard = memo(VariantCardInner, (prev, next) => {
  return (
    prev.variant.id === next.variant.id &&
    prev.imageUrl === next.imageUrl &&
    prev.loading === next.loading &&
    prev.qualityReport?.score === next.qualityReport?.score &&
    prev.qualityReport?.passed === next.qualityReport?.passed &&
    prev.isSelected === next.isSelected &&
    prev.locale === next.locale
  );
});
