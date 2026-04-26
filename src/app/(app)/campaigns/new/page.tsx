'use client';

/**
 * /campaigns/new — UNIFIED 4-stage flow
 *
 * Stage 1: intake     (form with auto-save)
 * Stage 2: strategy   (Brain output / Strategy Brief)
 * Stage 3: assets     (optional product photos)
 * Stage 4: variants   (rendered images)
 *
 * No more jumping to /creative-studio. Everything in one place.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { CampaignIntakeForm } from '@/features/campaign-brain/components/campaign-intake-form';
import { StrategyBriefView } from '@/features/campaign-brain/components/strategy-brief-view';
import { StageAssets } from '@/features/campaign-brain/components/stage-assets';
import { StageVariants } from '@/features/campaign-brain/components/stage-variants';
import type { BrainOutput } from '@/features/campaign-brain/types';

type Stage = 'intake' | 'strategizing' | 'brief' | 'assets' | 'variants';

export default function NewCampaignPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>('intake');
  const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────

  async function handleStrategize(id: string) {
    setDraftId(id);
    setStage('strategizing');
    setError(null);

    try {
      const draftRes = await fetch(`/api/campaigns/draft?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      if (!draftRes.ok) throw new Error('Could not load draft');
      const { draft } = await draftRes.json();

      const res = await fetch('/api/campaign/strategize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ draftId: id, intake: draft.intake }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Brain call failed: ${res.status}`);
      }

      const { brainOutput: output } = await res.json();
      setBrainOutput(output);
      setStage('brief');
    } catch (err) {
      setError((err as Error).message);
      setStage('intake');
    }
  }

  function handleEditBrief() {
    setStage('intake');
  }

  function handleProceedToAssets() {
    setStage('assets');
  }

  function handleAssetsContinue(_uploadedUrls: string[]) {
    // Future: persist visualReferences to draft if needed
    setStage('variants');
  }

  function handleAssetsSkip() {
    setStage('variants');
  }

  function handleSaveCampaign() {
    // Navigate to dashboard / campaigns list — keeping it simple
    router.push('/dashboard');
  }

  // ── Render ────────────────────────────────────────────────────

  if (stage === 'strategizing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold">
            {t('cb.brief.thinking_eyebrow')}
          </div>
          <h2 className="font-display text-[28px] leading-tight">
            {t('cb.brief.thinking_title_a')}{' '}
            <span className="text-gold-grad">{t('cb.brief.thinking_title_accent')}</span>…
          </h2>
          <p className="text-[13.5px] text-fg-muted">{t('cb.brief.thinking_subtitle')}</p>
          <div className="flex justify-center mt-6">
            <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'brief' && brainOutput) {
    return (
      <>
        {error && (
          <div className="max-w-3xl mx-auto px-4 pt-4">
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
              {error}
            </div>
          </div>
        )}
        <StrategyBriefView
          brainOutput={brainOutput}
          onEdit={handleEditBrief}
          onRenderVariants={handleProceedToAssets}
        />
      </>
    );
  }

  if (stage === 'assets' && draftId) {
    return (
      <StageAssets
        draftId={draftId}
        onContinue={handleAssetsContinue}
        onSkip={handleAssetsSkip}
      />
    );
  }

  if (stage === 'variants' && draftId && brainOutput) {
    return (
      <StageVariants
        draftId={draftId}
        brainOutput={brainOutput}
        onSaveCampaign={handleSaveCampaign}
      />
    );
  }

  // Default: intake stage
  return (
    <>
      {error && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
            {error}
          </div>
        </div>
      )}
      <CampaignIntakeForm onStrategize={handleStrategize} />
    </>
  );
}
