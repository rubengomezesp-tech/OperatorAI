'use client';
import { Label } from '@/components/ui/input';
import { ToneChips } from './tone-chips';
import { TagInput } from './tag-input';
import type { AssistantProfileInput } from '../types';

interface Props {
  value: AssistantProfileInput;
  onChange: (patch: Partial<AssistantProfileInput>) => void;
}

export function StepVoice({ value, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Tone <span className="text-fg-subtle normal-case tracking-normal">(pick as many as fit)</span></Label>
        <ToneChips value={value.tone} onChange={(tone) => onChange({ tone })} />
      </div>

      <div>
        <Label htmlFor="writing_style">Writing style notes <span className="text-fg-subtle normal-case tracking-normal">(optional)</span></Label>
        <textarea
          id="writing_style"
          value={value.writing_style ?? ''}
          onChange={(e) => onChange({ writing_style: e.target.value || null })}
          placeholder="Short sentences. Never use em-dashes. Prefer metaphors over adjectives. Literary references welcome..."
          rows={3}
          className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
        />
      </div>

      <div>
        <Label>Banned words <span className="text-fg-subtle normal-case tracking-normal">(optional)</span></Label>
        <TagInput
          value={value.banned_words}
          onChange={(banned_words) => onChange({ banned_words })}
          placeholder="Type a word the assistant should never use..."
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          Useful for brand-unsafe terms, cliches, or competitor names.
        </p>
      </div>
    </div>
  );
}
