'use client';
import { useRef } from 'react';
import { Loader2, RefreshCw, Download, Edit3, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CanvasSpecRenderer,
  type CanvasSpecRendererHandle,
} from './canvas-spec-renderer';
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
  onRendered?: (variantId: string, dataUrl: string) => void;
  isSelected?: boolean;
}

export function VariantCard({
  variant,
  imageUrl,
  loading,
  qualityReport,
  locale,
  onSelect,
  onRegenerate,
  onRendered,
  isSelected,
}: Props) {
  const rendererRef = useRef<CanvasSpecRendererHandle>(null);
  const label = LAYOUT_LABELS[variant.layout]?.[locale] || variant.layout;
  const aspect =
    variant.aspectRatio === '1:1'
      ? '1/1'
      : variant.aspectRatio === '4:5'
      ? '4/5'
      : '9/16';

  const qualityWarn = qualityReport && !qualityReport.passed;

  async function handleDownload() {
    if (!rendererRef.current) return;
    const filename = variant.layout + '-' + variant.id;
    await rendererRef.current.download(filename);
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
        <span className="text-[9px] text-fg-subtle">{variant.engine}</span>
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
        ) : imageUrl ? (
          <CanvasSpecRenderer
            ref={rendererRef}
            specUrl={imageUrl}
            onRendered={(dataUrl) => onRendered?.(variant.id, dataUrl)}
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-fg-subtle">
              {locale === 'es' ? 'Sin imagen' : 'No image'}
            </span>
          </div>
        )}

        {!loading && imageUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={onSelect}
              className="h-9 px-3 rounded-lg bg-gold text-black text-[11px] font-medium flex items-center gap-1.5 hover:brightness-110"
            >
              <Edit3 className="h-3 w-3" />
              {locale === 'es' ? 'Editar' : 'Edit'}
            </button>
            <button
              onClick={onRegenerate}
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

      <div className="px-3 py-2 text-[10px] text-fg-muted italic truncate">
        {variant.reasoningSummary}
      </div>
    </div>
  );
}
