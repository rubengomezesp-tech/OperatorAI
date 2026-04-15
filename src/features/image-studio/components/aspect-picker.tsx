'use client';
import { cn } from '@/lib/utils';
import { ASPECT_RATIOS, type AspectRatioId } from '../data/presets';

interface Props {
  value: AspectRatioId;
  onChange: (id: AspectRatioId) => void;
}

export function AspectPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ASPECT_RATIOS.map((r) => {
        const selected = r.id === value;
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={cn(
              'h-8 px-3 rounded-md border text-[12px] transition-colors flex items-center gap-1.5',
              selected
                ? 'border-gold/60 bg-gold/10 text-gold'
                : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong',
            )}
          >
            <span className="font-medium">{r.id}</span>
            <span className="text-fg-subtle">·</span>
            <span>{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
