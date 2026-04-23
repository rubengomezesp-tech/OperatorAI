'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ProductBrief,
  Variant,
  CampaignIntent,
  AspectRatio,
  QualityReport,
  ImageAnalysis,
  CampaignDirection,
  CampaignMemory,
} from '../types';

export interface CampaignState {
  id: string;
  imageUrls: string[];
  instructions: string;
  aspectRatio: AspectRatio;
  campaignIntent: CampaignIntent;
  locale: 'en' | 'es';
  analyses: ImageAnalysis[];
  brief?: ProductBrief;
  direction?: CampaignDirection;
  variants: Variant[];
  memory: CampaignMemory;
  renderedImages: Record<string, string>;
  qualityReports: Record<string, QualityReport>;
}

export interface UseCampaignMemoryResult {
  campaign: CampaignState | null;
  loading: boolean;
  error: string | null;
  load: (id: string) => Promise<CampaignState | null>;
  setCampaign: (c: CampaignState | null) => void;
  patchCampaign: (patch: Partial<CampaignState>) => void;
  reset: () => void;
}

/**
 * use-campaign-memory
 * - If campaignId is in URL (?campaignId=xxx), fetches GET /api/campaigns/:id
 *   and hydrates full state.
 * - Exposes setCampaign + patchCampaign for local updates between API calls.
 * - Keeps URL in sync with current campaign id (pushState, no reload).
 */
export function useCampaignMemory(): UseCampaignMemoryResult {
  const [campaign, setCampaignState] = useState<CampaignState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const load = useCallback(async (id: string): Promise<CampaignState | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/campaigns/' + encodeURIComponent(id));
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to load campaign');
      }
      const data = await res.json();
      const c = data.campaign as CampaignState;
      setCampaignState(c);
      return c;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load from URL on mount
  useEffect(() => {
    if (loadedOnceRef.current) return;
    loadedOnceRef.current = true;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('campaignId');
    if (id) {
      load(id);
    }
  }, [load]);

  // Sync URL when campaign id changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const current = params.get('campaignId');
    if (campaign?.id && current !== campaign.id) {
      params.set('campaignId', campaign.id);
      window.history.replaceState(
        {},
        '',
        window.location.pathname + '?' + params.toString(),
      );
    } else if (!campaign && current) {
      params.delete('campaignId');
      const q = params.toString();
      window.history.replaceState(
        {},
        '',
        window.location.pathname + (q ? '?' + q : ''),
      );
    }
  }, [campaign?.id]);

  const setCampaign = useCallback((c: CampaignState | null) => {
    setCampaignState(c);
  }, []);

  const patchCampaign = useCallback((patch: Partial<CampaignState>) => {
    setCampaignState((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const reset = useCallback(() => {
    setCampaignState(null);
    setError(null);
  }, []);

  return { campaign, loading, error, load, setCampaign, patchCampaign, reset };
}
