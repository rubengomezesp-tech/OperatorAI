'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { OnboardingData } from './wizard';

function suggestionFor(role?: string, brand?: string): string {
  const name = brand || 'my brand';
  switch (role) {
    case 'founder':
      return `Help me pitch ${name} to an investor in 3 short paragraphs.`;
    case 'marketer':
      return `Draft a launch campaign plan for ${name} with 5 channels.`;
    case 'creator':
      return `Write 7 Instagram captions for ${name}, consistent with my voice.`;
    case 'agency':
      return `Propose a tone-of-voice guide for a new client similar to ${name}.`;
    default:
      return `Give me a 60-second brand diagnosis for ${name}: what works, what doesn't, what to fix first.`;
  }
}

export function StepFirstPrompt({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const suggestion = suggestionFor(data.user_role, data.brand_name);
  const [prompt, setPrompt] = useState(data.first_prompt ?? suggestion);

  useEffect(() => {
    if (!data.first_prompt) setPrompt(suggestion);
  }, [suggestion, data.first_prompt]);

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 4 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          Ask Operator your <span className="text-gold-grad">first question</span>.
        </h2>
        <p className="text-[14px] text-fg-muted">
          We pre-filled one based on your profile. Edit it freely.
        </p>
      </div>

      <div>
        <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your first prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          autoFocus
          className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
        />
        <div className="flex items-center gap-2 mt-2 text-[11.5px] text-fg-subtle">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>Operator already knows your brand, role, and vibe. Skip the setup talk.</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ first_prompt: prompt.trim() })}
          disabled={prompt.trim().length < 5}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
