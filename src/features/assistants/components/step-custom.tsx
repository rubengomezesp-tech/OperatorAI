'use client';
import { Label } from '@/components/ui/input';
import type { AssistantProfileInput } from '../types';
import { buildSystemPromptPreview } from '../data/preview';

interface Props {
  value: AssistantProfileInput;
  onChange: (patch: Partial<AssistantProfileInput>) => void;
}

export function StepCustom({ value, onChange }: Props) {
  const preview = buildSystemPromptPreview(value);
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="custom_instructions">Custom instructions <span className="text-fg-subtle normal-case tracking-normal">(optional)</span></Label>
        <textarea
          id="custom_instructions"
          value={value.custom_instructions ?? ''}
          onChange={(e) => onChange({ custom_instructions: e.target.value || null })}
          placeholder={[
            'Always ask clarifying questions before writing copy.',
            'When recommending a product, include the price range and target audience.',
            'Never use the words "amazing", "game-changer", or "unleash".',
          ].join('\n')}
          rows={6}
          className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[13.5px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none font-mono"
        />
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          Operator instructions take priority after safety. Write as direct commands.
        </p>
      </div>

      <div>
        <Label>System prompt preview</Label>
        <div className="rounded-md border border-border bg-surface/50 p-4 max-h-[300px] overflow-auto">
          <pre className="text-[11.5px] leading-relaxed text-fg-soft whitespace-pre-wrap font-mono">
            {preview}
          </pre>
        </div>
        <p className="mt-1.5 text-[11.5px] text-fg-subtle">
          This is the context your assistant receives on every message. Updates live as you edit.
        </p>
      </div>
    </div>
  );
}
