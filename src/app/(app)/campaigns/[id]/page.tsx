'use client';

/**
 * /campaigns/[id] — saved campaign detail view
 *
 * Loads existing campaign and displays its variants with the same
 * editor-enabled UI as Stage Variants. User can re-edit any variant.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { ChevronLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { StageVariants } from '@/features/campaign-brain/components/stage-variants';
import type { BrainOutput } from '@/features/campaign-brain/types';

interface LoadedCampaign {
  id: string;
  brain_output: BrainOutput;
  intake_data: Record<string, unknown>;
  renderedImages: Record<string, string>;
  critiques: Record<string, unknown>;
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [campaign, setCampaign] = useState<LoadedCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(params.id)}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed: ${res.status}`);
        }
        const body = await res.json();
        const camp = body.campaign;
        if (!camp) {
          throw new Error('Campaign not found');
        }
        // brain_output may live under different shapes — normalise
        const brainOutput = camp.brain_output || camp.brainOutput || null;
        if (!brainOutput) {
          throw new Error('This campaign has no Strategy Brief yet');
        }
        if (!cancelled) {
          setCampaign({
            id: camp.id,
            brain_output: brainOutput,
            intake_data: camp.intake_data || camp.intake || {},
            renderedImages: camp.rendered_images || camp.renderedImages || {},
            critiques: camp.critiques || {},
          });
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
  }, [params.id]);

  function handleSaveCampaign() {
    router.push('/campaigns');
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <button
          type="button"
          onClick={() => router.push('/campaigns')}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('campaigns.detail.back')}
        </button>
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error ?? 'Campaign not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <button
          type="button"
          onClick={() => router.push('/campaigns')}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-fg"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {t('campaigns.detail.back')}
        </button>
      </div>
      <StageVariants
        draftId={campaign.id}
        brainOutput={campaign.brain_output}
        onSaveCampaign={handleSaveCampaign}
        preRenderedImages={campaign.renderedImages}
        preRenderedCritiques={campaign.critiques as Record<string, unknown>}
      />
    </>
  );
}
