'use client';
import { cn } from '@/lib/utils';
import { LANGUAGE_OPTIONS } from '../data/constants';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function LanguageChips({ value, onChange }: Props) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((t) => t !== id) : [...value, id]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {LANGUAGE_OPTIONS.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              'h-8 px-3 rounded-md border text-[12.5px] transition-colors',
              selected
                ? 'border-gold/60 bg-gold/10 text-gold'
                : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
