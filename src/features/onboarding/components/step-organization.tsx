'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { OnboardingData } from './wizard';

export function StepOrganization({
  data,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onNext: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
}) {
  const [workspaceName, setWorkspaceName] = useState(data.workspace_name ?? '');
  const [creating, setCreating] = useState(false);

  const canContinue = workspaceName.trim().length >= 2;

  async function handleContinue() {
    if (!canContinue) return;
    setCreating(true);
    try {
      // Create organization first (idempotent — returns existing if user has one)
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        // If user already has an org, that's fine — proceed
        if (res.status === 409 || body?.error?.includes('already')) {
          toast.info('Using your existing workspace');
        } else {
          toast.error(body?.error ?? 'Failed to create workspace');
          setCreating(false);
          return;
        }
      }

      // Set cookie so subsequent API calls have org context
      if (body.id) {
        const oneYear = 60 * 60 * 24 * 365;
        document.cookie = `operator.org_id=${body.id}; path=/; max-age=${oneYear}; samesite=lax`;
      }

      // Advance to next step
      onNext({ workspace_name: workspaceName.trim() });
    } catch (err) {
      toast.error('Network error. Please try again.');
      setCreating(false);
    }
  }

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          Step 1 of 6
        </div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          Create your <span className="text-gold-grad">workspace</span>
        </h2>
        <p className="text-[14px] text-fg-muted">
          This is your company or personal brand space. You can create more later.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">
            Workspace name
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="Aurora Studio"
            autoFocus
            disabled={creating}
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
          <p className="text-[11.5px] text-fg-subtle mt-1.5">
            Use your company name or how you call your brand internally.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack} disabled={creating}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue || creating}>
          {creating ? 'Creating…' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
