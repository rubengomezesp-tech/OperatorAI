'use client';

/**
 * Stage Variants — Agentic V1
 *
 * Triggers /api/campaign/render-batch (which now uses agentic renderer)
 * and shows each variant with:
 *   - Vision Critic score (0-100) + verdict badge
 *   - Iterations run
 *   - Click to expand: full critic summary + issues + suggestions
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  Download,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { BrainOutput } from '@/features/campaign-brain/types';
import { VariantEditor } from './variant-editor';

interface VariantCritique {
  score: number;
  verdict: 'pass' | 'iterate' | 'fail';
  summary: string;
  issues: string[];
  suggestions: string[];
  iterationsRun: number;
}

interface BatchVariantResult {
  id: string;
  imageUrl: string | null;
  composedV2: boolean;
  critique?: VariantCritique;
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

export function StageVariants({
  draftId,
  brainOutput,
  onSaveCampaign,
}: StageVariantsProps) {
  const { t } = useI18n();
  const [variants, setVariants] = useState<BatchVariantResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  function handleEditSave(variantId: string, newUrl: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, imageUrl: newUrl } : v)),
    );
  }

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
        if (!cancelled) setVariants(body.variants ?? []);
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
        <h1 className="font-display text-[34px] leading-tight">
          {t('cb.variants.title')}
        </h1>
        <p className="text-[14px] text-fg-muted mt-2">
          {t('cb.variants.subtitle')}
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-fg-muted text-[13.5px]">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            <span>{t('cb.variants.rendering')}</span>
            <span className="text-fg-subtle">·</span>
            <span className="text-fg-subtle text-[12px]">
              {t('cb.variants.agentic_hint')}
            </span>
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

      {!loading && variants.length > 0 && (() => {
        const passed = variants.filter((v) => v.critique && v.critique.verdict === 'pass').length;
        const total = variants.filter((v) => v.imageUrl).length;
        if (total === 0) return null;
        return (
          <div className={[
            'rounded-md border px-4 py-3 text-[12.5px] flex items-center gap-2',
            passed === total
              ? 'border-green-500/30 bg-green-500/5 text-green-300'
              : 'border-gold/30 bg-gold/5 text-gold',
          ].join(' ')}>
            {passed === total ? (
              <>
                <span>✓</span>
                <span>{t('cb.variants.all_premium')}</span>
              </>
            ) : (
              <>
                <span>★</span>
                <span>{passed}/{total} {t('cb.variants.partial_premium')}</span>
              </>
            )}
          </div>
        );
      })()}

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
                onEdit={() => setEditingVariantId(v.id)}
              />
            );
          })}
        </div>
      )}

      {!loading && variants.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-[11px] uppercase tracking-[0.18em] text-fg-subtle mb-2">
            {t('cb.variants.empty_title')}
          </div>
          <p className="text-[14px] text-fg-muted">
            {t('cb.variants.empty_subtitle')}
          </p>
        </div>
      )}

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
      {editingVariantId && (() => {
        const variant = variants.find((v) => v.id === editingVariantId);
        const brief = briefById.get(editingVariantId);
        if (!variant || !variant.imageUrl) return null;
        return (
          <VariantEditor
            draftId={draftId}
            variantId={editingVariantId}
            initialImageUrl={variant.imageUrl}
            briefHeadline={brief?.headline}
            briefAngle={brief?.angle ? humanize(brief.angle) : undefined}
            briefPlatform={brief?.platform}
            onClose={() => setEditingVariantId(null)}
            onSave={(newUrl) => handleEditSave(editingVariantId, newUrl)}
          />
        );
      })()}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Variant Card with critique
// ────────────────────────────────────────────────────────────────

interface VariantCardProps {
  variant: BatchVariantResult;
  briefAngle?: string;
  briefHeadline?: string;
  briefPlatform?: string;
  t: (k: string) => string;
  onEdit?: () => void;
}

function VariantCard({
  variant,
  briefAngle,
  briefHeadline,
  briefPlatform,
  t,
  onEdit,
}: VariantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isError = !!variant.error || !variant.imageUrl;
  const critique = variant.critique;

  return (
    <div className="rounded-lg border border-border bg-surface-2 overflow-hidden">
      {/* Image area */}
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
            <p className="text-[12.5px] text-fg-muted">
              {variant.error ?? 'Render failed'}
            </p>
          </div>
        )}

        {/* Top-left: angle */}
        {briefAngle && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-bg/80 backdrop-blur-sm text-[10.5px] uppercase tracking-[0.12em] text-gold border border-gold/30">
            {humanize(briefAngle)}
          </span>
        )}

        {/* Top-right: platform */}
        {briefPlatform && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-bg/80 backdrop-blur-sm text-[10.5px] uppercase tracking-[0.12em] text-fg-muted border border-border">
            {briefPlatform}
          </span>
        )}

        {/* Bottom-right: score badge */}
        {critique && (
          <ScoreBadge critique={critique} t={t} />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-3">
        {briefHeadline && (
          <p className="text-[13px] text-fg leading-snug line-clamp-2">
            {briefHeadline}
          </p>
        )}

        {/* Critique summary (collapsed) */}
        {critique && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full text-left rounded-md border border-border bg-surface px-3 py-2 hover:border-fg-muted transition-all"
          >
            <div className="flex items-center gap-2 text-[11.5px]">
              <Sparkles className="h-3 w-3 text-gold flex-shrink-0" />
              <span className="text-fg-muted truncate flex-1">
                {critique.summary || verdictLabel(critique.verdict, t)}
              </span>
              <ChevronDown className="h-3 w-3 text-fg-subtle flex-shrink-0" />
            </div>
          </button>
        )}

        {/* Critique expanded */}
        {critique && expanded && (
          <div className="rounded-md border border-border bg-surface px-3 py-3 space-y-3">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-full text-left flex items-center gap-2 text-[11.5px]"
            >
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="text-fg flex-1 truncate">
                {critique.summary}
              </span>
              <ChevronDown className="h-3 w-3 text-fg-subtle rotate-180" />
            </button>

            {critique.issues.length > 0 && (
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-1">
                  {t('cb.critique.issues')}
                </div>
                <ul className="space-y-0.5">
                  {critique.issues.slice(0, 3).map((iss, i) => (
                    <li
                      key={i}
                      className="text-[11.5px] text-fg-muted leading-snug"
                    >
                      · {iss}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {critique.suggestions.length > 0 && (
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-gold mb-1">
                  {t('cb.critique.suggestions')}
                </div>
                <ul className="space-y-0.5">
                  {critique.suggestions.slice(0, 3).map((sug, i) => (
                    <li
                      key={i}
                      className="text-[11.5px] text-fg leading-snug"
                    >
                      · {sug}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
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
              onClick={onEdit}
              className="flex-1 py-1.5 rounded-md border border-border bg-surface text-fg-muted hover:text-fg hover:border-fg-muted text-[12.5px] flex items-center justify-center gap-1.5 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('cb.variants.edit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Score Badge
// ────────────────────────────────────────────────────────────────

function ScoreBadge({
  critique,
  t,
}: {
  critique: VariantCritique;
  t: (k: string) => string;
}) {
  const color =
    critique.verdict === 'pass'
      ? 'bg-green-500/15 border-green-500/40 text-green-300'
      : critique.verdict === 'iterate'
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
      : 'bg-red-500/15 border-red-500/40 text-red-300';

  return (
    <div
      className={[
        'absolute bottom-3 right-3 px-2.5 py-1 rounded-md border backdrop-blur-md',
        'flex items-center gap-1.5 text-[11px] font-medium',
        color,
      ].join(' ')}
      title={`${critique.summary} · ${critique.iterationsRun} ${t('cb.critique.iterations')}`}
    >
      {critique.verdict === 'pass' && (
        <CheckCircle2 className="h-3 w-3" />
      )}
      <span className="font-semibold">{critique.score}</span>
      <span className="opacity-60">/100</span>
      {critique.iterationsRun > 1 && (
        <span className="opacity-60 text-[10px]">
          · {critique.iterationsRun}{t('cb.critique.iterations')}
        </span>
      )}
    </div>
  );
}

function verdictLabel(verdict: VariantCritique['verdict'], t: (k: string) => string): string {
  if (verdict === 'pass') return t('cb.critique.verdict_pass');
  if (verdict === 'iterate') return t('cb.critique.verdict_iterate');
  return t('cb.critique.verdict_fail');
}
