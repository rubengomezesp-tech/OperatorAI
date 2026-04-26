'use client';

/**
 * useCampaignDraft — auto-save and recovery hook for campaign composition.
 *
 * SOLVES: bug where users lose all progress when leaving the screen.
 *
 * BEHAVIOR:
 *   - On mount, attempts to load existing draft for current user
 *   - Auto-saves to /api/campaigns/draft on every change (debounced 1.5s)
 *   - Returns: draftId, intake, brainOutput, status flags, save/clear actions
 *   - State persists across refreshes, sessions, and devices
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { CampaignIntake, BrainOutput } from '@/features/campaign-brain/types';

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface CampaignDraft {
  id: string;
  intake: Partial<CampaignIntake>;
  brainOutput?: BrainOutput;
  vertical_slug?: string | null;
  campaign_type_slug?: string | null;
  last_edited_at: string;
  is_draft: boolean;
}

export type DraftStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

interface UseCampaignDraftOptions {
  /** If provided, loads/edits this specific draft. If omitted, loads most recent or creates new. */
  draftId?: string;
  /** Auto-save debounce in ms. Default: 1500. */
  debounceMs?: number;
  /** If true, loads existing draft on mount. Default: true. */
  autoLoad?: boolean;
}

interface UseCampaignDraftReturn {
  /** The current draft */
  draft: CampaignDraft | null;
  /** Convenient access to intake field */
  intake: Partial<CampaignIntake>;
  /** Status of save/load operations */
  status: DraftStatus;
  /** Last error message, if any */
  error: string | null;
  /** Update intake fields (auto-saves after debounce) */
  updateIntake: (patch: Partial<CampaignIntake>) => void;
  /** Set the brain output (after Brain runs) */
  setBrainOutput: (output: BrainOutput) => Promise<void>;
  /** Mark draft as completed (no longer is_draft=true) */
  markCompleted: () => Promise<void>;
  /** Force-save now (returns when done) */
  saveNow: () => Promise<void>;
  /** Clear draft (delete it) */
  clearDraft: () => Promise<void>;
}

// ────────────────────────────────────────────────────────────────
// Hook
// ────────────────────────────────────────────────────────────────

export function useCampaignDraft(
  options: UseCampaignDraftOptions = {},
): UseCampaignDraftReturn {
  const { draftId: initialDraftId, debounceMs = 1500, autoLoad = true } = options;

  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<CampaignIntake>>({});

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    if (!autoLoad) return;

    let cancelled = false;
    (async () => {
      setStatus('loading');
      setError(null);

      try {
        const url = initialDraftId
          ? `/api/campaigns/draft?id=${encodeURIComponent(initialDraftId)}`
          : '/api/campaigns/draft';

        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
          // 404 is OK — just means no draft yet
          if (res.status !== 404) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error ?? `Load failed: ${res.status}`);
          }
        } else {
          const body = await res.json();
          if (!cancelled && body.draft) {
            setDraft(body.draft);
          }
        }

        if (!cancelled) setStatus('idle');
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialDraftId, autoLoad]);

  // ── Save function ───────────────────────────────────────────
  const save = useCallback(
    async (patch: Partial<CampaignIntake>) => {
      setStatus('saving');
      setError(null);

      try {
        const res = await fetch('/api/campaigns/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: draft?.id,
            intake_patch: patch,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Save failed: ${res.status}`);
        }

        const body = await res.json();
        if (body.draft) {
          setDraft(body.draft);
        }
        setStatus('saved');

        // Reset to idle after 1.5s
        setTimeout(() => {
          setStatus((s) => (s === 'saved' ? 'idle' : s));
        }, 1500);
      } catch (err) {
        setError((err as Error).message);
        setStatus('error');
      }
    },
    [draft?.id],
  );

  // ── Update with debounce ────────────────────────────────────
  const updateIntake = useCallback(
    (patch: Partial<CampaignIntake>) => {
      // Optimistic UI update
      setDraft((prev) =>
        prev
          ? { ...prev, intake: { ...prev.intake, ...patch } }
          : { id: '', intake: patch, last_edited_at: new Date().toISOString(), is_draft: true },
      );

      // Accumulate pending patches
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };

      // Reset debounce
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const patchToSave = pendingPatchRef.current;
        pendingPatchRef.current = {};
        void save(patchToSave);
      }, debounceMs);
    },
    [debounceMs, save],
  );

  // ── Force save now ──────────────────────────────────────────
  const saveNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const patch = pendingPatchRef.current;
    pendingPatchRef.current = {};
    if (Object.keys(patch).length > 0) {
      await save(patch);
    }
  }, [save]);

  // ── Set brain output ────────────────────────────────────────
  const setBrainOutput = useCallback(
    async (output: BrainOutput) => {
      if (!draft?.id) {
        // Need to save first to get an ID
        await saveNow();
      }

      setStatus('saving');
      try {
        const res = await fetch('/api/campaigns/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: draft?.id,
            brain_output: output,
            vertical_slug: output.detectedVertical,
            campaign_type_slug: output.detectedCampaignType,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Save brain output failed: ${res.status}`);
        }

        const body = await res.json();
        if (body.draft) setDraft(body.draft);
        setStatus('saved');
      } catch (err) {
        setError((err as Error).message);
        setStatus('error');
      }
    },
    [draft?.id, saveNow],
  );

  // ── Mark completed ──────────────────────────────────────────
  const markCompleted = useCallback(async () => {
    if (!draft?.id) return;

    setStatus('saving');
    try {
      const res = await fetch('/api/campaigns/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: draft.id,
          is_draft: false,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Mark complete failed: ${res.status}`);
      }

      const body = await res.json();
      if (body.draft) setDraft(body.draft);
      setStatus('saved');
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }, [draft?.id]);

  // ── Clear draft ─────────────────────────────────────────────
  const clearDraft = useCallback(async () => {
    if (!draft?.id) {
      setDraft(null);
      return;
    }

    try {
      await fetch(`/api/campaigns/draft?id=${encodeURIComponent(draft.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setDraft(null);
      setStatus('idle');
    } catch (err) {
      setError((err as Error).message);
    }
  }, [draft?.id]);

  // ── Save on unmount (best effort) ───────────────────────────
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        // Fire-and-forget save (page is unmounting)
        const patch = pendingPatchRef.current;
        if (Object.keys(patch).length > 0 && navigator.sendBeacon) {
          const blob = new Blob(
            [JSON.stringify({ id: draft?.id, intake_patch: patch })],
            { type: 'application/json' },
          );
          navigator.sendBeacon('/api/campaigns/draft', blob);
        }
      }
    };
  }, [draft?.id]);

  return {
    draft,
    intake: draft?.intake ?? {},
    status,
    error,
    updateIntake,
    setBrainOutput,
    markCompleted,
    saveNow,
    clearDraft,
  };
}
