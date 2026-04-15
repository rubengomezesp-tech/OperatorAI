'use client';
import { cn } from '@/lib/utils';
import { IMAGE_PRESETS } from '../data/presets';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function PresetPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {IMAGE_PRESETS.map((p) => {
        const selected = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(selected ? null : p.id)}
            className={cn(
              'text-left p-3 rounded-md border transition-all',
              selected
                ? 'border-gold/60 bg-gold/5'
                : 'border-border bg-surface-2 hover:border-border-strong',
            )}
          >
            <div className={cn('text-[13px] font-medium', selected ? 'text-fg' : 'text-fg-soft')}>
              {p.label}
            </div>
            <div className="text-[11px] text-fg-muted mt-0.5 leading-relaxed line-clamp-2">
              {p.hint}
            </div>
          </button>
        );
      })}
    </div>
  );
}
