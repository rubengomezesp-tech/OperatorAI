'use client';

/**
 * /campaigns/new
 *
 * Orchestrates the campaign creation flow:
 *   1. Intake form (auto-saves draft)
 *   2. User clicks "Generate Strategy"
 *   3. POST /api/campaign/strategize
 *   4. Show Strategy Brief
 *   5. User edits / proceeds to render
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampaignIntakeForm } from '@/features/campaign-brain/components/campaign-intake-form';
import { StrategyBriefView } from '@/features/campaign-brain/components/strategy-brief-view';
import type { BrainOutput } from '@/features/campaign-brain/types';

type Stage = 'intake' | 'strategizing' | 'brief';

export default function NewCampaignPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('intake');
  const [brainOutput, setBrainOutput] = useState<BrainOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  async function handleStrategize(id: string) {
    setDraftId(id);
    setStage('strategizing');
    setError(null);

    try {
      // Fetch the draft to get full intake
      const draftRes = await fetch(`/api/campaigns/draft?id=${encodeURIComponent(id)}`, {
        credentials: 'include',
      });
      if (!draftRes.ok) throw new Error('Could not load draft');
      const { draft } = await draftRes.json();

      // Run Brain
      const res = await fetch('/api/campaign/strategize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          draftId: id,
          intake: draft.intake,
        }),
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

  function handleEdit() {
    setStage('intake');
  }

  function handleRenderVariants() {
    if (!draftId) return;
    // Navigate to the renderer (existing creative-studio) with this draft
    router.push(`/creative-studio?draftId=${encodeURIComponent(draftId)}`);
  }

  if (stage === 'strategizing') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold">
            Brain is thinking
          </div>
          <h2 className="font-display text-[28px] leading-tight">
            Building your <span className="text-gold-grad">strategy</span>…
          </h2>
          <p className="text-[13.5px] text-fg-muted">
            Diagnosing audience, picking angles, drafting hooks. Usually 30-60 seconds.
          </p>
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
          onEdit={handleEdit}
          onRenderVariants={handleRenderVariants}
        />
      </>
    );
  }

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
