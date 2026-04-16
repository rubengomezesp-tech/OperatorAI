'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

const roles = [
  { id: 'founder', label: 'Founder', desc: 'Solo or small team' },
  { id: 'marketer', label: 'Marketer', desc: 'Brand, growth, content' },
  { id: 'creator', label: 'Creator', desc: 'Personal brand, social' },
  { id: 'agency', label: 'Agency', desc: 'Multiple brands/clients' },
  { id: 'other', label: 'Something else', desc: 'Custom use case' },
];

export function StepAbout({
  data, onNext, onBack,
}: { data: OnboardingData; onNext: (d: Partial<OnboardingData>) => void; onBack: () => void }) {
  const [name, setName] = useState(data.full_name ?? '');
  const [role, setRole] = useState(data.user_role ?? '');

  const canContinue = name.trim().length >= 2 && role.length > 0;

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Step 1 of 5</div>
        <h2 className="font-display text-[32px] lg:text-[38px] leading-tight mb-2">
          First, <span className="text-gold-grad">who are you</span>?
        </h2>
        <p className="text-[14px] text-fg-muted">
          This helps us personalize everything.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rubén"
            autoFocus
            className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[16px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />
        </div>

        <div>
          <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Your role</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={cn(
                  'text-left rounded-md border px-4 py-3 transition-all',
                  role === r.id
                    ? 'bg-gold/10 border-gold/50 text-fg'
                    : 'bg-surface-2 border-border text-fg-muted hover:text-fg hover:border-border/60',
                )}
              >
                <div className="text-[14px] font-medium">{r.label}</div>
                <div className="text-[11.5px] text-fg-subtle mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button
          onClick={() => onNext({ full_name: name.trim(), user_role: role })}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
