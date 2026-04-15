'use client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_OPTIONS } from '../data/constants';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function ToneChips({ value, onChange }: Props) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((t) => t !== id) : [...value, id]);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {TONE_OPTIONS.map((opt) => {
        const selected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-md border text-left transition-all',
              selected
                ? 'border-gold/60 bg-gold/5'
                : 'border-border bg-surface-2 hover:border-border-strong',
            )}
          >
            <div className={cn(
              'h-5 w-5 rounded shrink-0 flex items-center justify-center mt-0.5 border',
              selected ? 'gold-grad border-transparent' : 'border-border bg-surface-3',
            )}>
              {selected && <Check className="h-3 w-3 text-bg" strokeWidth={3} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className={cn('text-[14px] font-medium', selected ? 'text-fg' : 'text-fg-soft')}>
                {opt.label}
              </div>
              <div className="text-[12px] text-fg-muted leading-relaxed mt-0.5">{opt.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
