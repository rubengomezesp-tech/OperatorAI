'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OnboardingData } from './wizard';

export function StepBrand({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [brandName, setBrandName] = useState(data.brand_name ?? '');
  const [description, setDescription] = useState(data.description ?? '');

  const canContinue = brandName.trim().length >= 2 && description.trim().length >= 10;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 2 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          What's your <span className="text-gold-grad">brand</span>?
        </h2>
        <p className="text-[14px] text-fg-muted">
          Operator will keep this context in every conversation.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Brand or project name</label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Vesper Studio, Maison, Canal"
            autoFocus
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Describe it in one sentence</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A boutique branding studio for independent fashion labels in Madrid."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <p className="text-[11.5px] text-fg-subtle mt-1.5">
            Be specific — what you do, for whom, and how. Operator uses this as context forever.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ brand_name: brandName.trim(), description: description.trim() })}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
