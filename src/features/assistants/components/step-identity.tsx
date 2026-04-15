'use client';
import { Input, Label } from '@/components/ui/input';
import { IndustrySelect } from './industry-select';
import { LanguageChips } from './language-chips';
import type { AssistantProfileInput } from '../types';

interface Props {
  value: AssistantProfileInput;
  onChange: (patch: Partial<AssistantProfileInput>) => void;
}

export function StepIdentity({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="business_name">Business name</Label>
        <Input
          id="business_name"
          value={value.business_name}
          onChange={(e) => onChange({ business_name: e.target.value })}
          placeholder="Aurora Studio"
          required
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          The business your assistant represents. Shown nowhere public, used in context.
        </p>
      </div>

      <div>
        <Label htmlFor="industry">Industry</Label>
        <IndustrySelect
          value={value.industry}
          onChange={(industry) => onChange({ industry })}
        />
      </div>

      <div>
        <Label htmlFor="website">Website <span className="text-fg-subtle normal-case tracking-normal">(optional)</span></Label>
        <Input
          id="website"
          value={value.website ?? ''}
          onChange={(e) => onChange({ website: e.target.value || null })}
          placeholder="https://aurorastudio.com"
          type="url"
        />
      </div>

      <div>
        <Label htmlFor="languages">Languages</Label>
        <LanguageChips
          value={value.languages}
          onChange={(languages) => onChange({ languages })}
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          The assistant will detect the user&apos;s language and respond in it.
        </p>
      </div>
    </div>
  );
}
