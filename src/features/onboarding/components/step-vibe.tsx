'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

const vibes = [
  { id: 'minimal', label: 'Minimal', desc: 'Clean, restrained, architectural', sample: 'Less is more.' },
  { id: 'editorial', label: 'Editorial', desc: 'Cultured, cinematic, considered', sample: 'A quiet kind of luxury.' },
  { id: 'bold', label: 'Bold', desc: 'Loud, confident, category-defining', sample: 'We don\'t whisper. We move.' },
  { id: 'playful', label: 'Playful', desc: 'Warm, fun, conversational', sample: 'Serious work. Fun people.' },
] as const;

export function StepVibe({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [vibe, setVibe] = useState(data.vibe ?? '');

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 3 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          Choose your <span className="text-gold-grad">vibe</span>.
        </h2>
        <p className="text-[14px] text-fg-muted">
          This sets the tone of everything Operator writes for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vibes.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVibe(v.id)}
            className={cn(
              'text-left rounded-lg border p-5 transition-all',
              vibe === v.id
                ? 'bg-gold/10 border-gold/50 shadow-[0_4px_24px_-8px_rgba(201,168,99,0.35)]'
                : 'bg-surface border-border hover:border-border/60',
            )}
          >
            <div className="font-display text-[20px] mb-1">{v.label}</div>
            <div className="text-[12.5px] text-fg-muted mb-3">{v.desc}</div>
            <div className="text-[13px] italic text-fg-soft border-l-2 border-gold/40 pl-3">
              "{v.sample}"
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ vibe: vibe as OnboardingData['vibe'] })}
          disabled={!vibe}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
