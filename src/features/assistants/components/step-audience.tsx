'use client';
import { Label } from '@/components/ui/input';
import { TagInput } from './tag-input';
import type { AssistantProfileInput } from '../types';

interface Props {
  value: AssistantProfileInput;
  onChange: (patch: Partial<AssistantProfileInput>) => void;
}

export function StepAudience({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="audience">Who is your audience?</Label>
        <textarea
          id="audience"
          value={value.audience ?? ''}
          onChange={(e) => onChange({ audience: e.target.value || null })}
          placeholder="Women 28-45, urban, culturally curious, who value craft and provenance..."
          rows={3}
          className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          Write freely. The assistant uses this to shape examples, references, and register.
        </p>
      </div>

      <div>
        <Label>Services / products</Label>
        <TagInput
          value={value.services}
          onChange={(services) => onChange({ services })}
          placeholder="Type and press Enter..."
          suggestions={['Consulting', 'Strategy', 'Branding', 'Content creation', 'Coaching']}
        />
      </div>

      <div>
        <Label>Current goals</Label>
        <TagInput
          value={value.goals}
          onChange={(goals) => onChange({ goals })}
          placeholder="e.g. Launch new product Q2, grow newsletter to 10k..."
          suggestions={['Launch new product', 'Grow community', 'Improve retention', 'Open new market']}
        />
      </div>
    </div>
  );
}
