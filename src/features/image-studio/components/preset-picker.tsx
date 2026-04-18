'use client';
import { cn } from '@/lib/utils';
import { IMAGE_PRESETS } from '../data/presets';
import { useI18n } from '@/lib/i18n';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

const CATEGORIES: Record<string, { en: string; es: string; ids: string[] }> = {
  photo: { en: 'Photo', es: 'Foto', ids: ['editorial', 'luxury', 'minimal', 'product', 'lifestyle'] },
  social: { en: 'Social', es: 'Social', ids: ['ig-feed', 'ig-story', 'ig-reel', 'linkedin'] },
  brand: { en: 'Brand', es: 'Marca', ids: ['campaign', 'branding'] },
};

export function PresetPicker({ value, onChange }: Props) {
  const { locale } = useI18n();
  return (
    <div className="space-y-2">
      {Object.entries(CATEGORIES).map(([catKey, cat]) => (
        <div key={catKey}>
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-1">{locale === 'es' ? cat.es : cat.en}</div>
          <div className="flex flex-wrap gap-1.5">
            {cat.ids.map((id) => {
              const preset = IMAGE_PRESETS.find(p => p.id === id);
              if (!preset) return null;
              const selected = id === value;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange(selected ? null : id)}
                  className={cn(
                    'h-8 px-3 rounded-md text-[12px] font-medium border transition-all',
                    selected
                      ? 'border-gold/60 bg-gold/10 text-gold'
                      : 'border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-border-strong',
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
