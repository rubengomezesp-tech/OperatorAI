'use client';
import { useState } from 'react';
import { Sparkles, Crown, Pen, Search, BarChart3, Megaphone, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AGENTS, type AgentDefinition } from '../data/catalog';

const ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  crown: Crown,
  pen: Pen,
  search: Search,
  chart: BarChart3,
  megaphone: Megaphone,
};

interface Props {
  value: AgentDefinition['id'];
  onChange: (id: AgentDefinition['id']) => void;
  compact?: boolean;
}

export function AgentPicker({ value, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const current = AGENTS.find(a => a.id === value) ?? AGENTS[0];
  const Icon = ICONS[current.icon] ?? Sparkles;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 hover:bg-surface-3 transition',
          compact ? 'h-7 px-2 text-[11.5px]' : 'h-8 px-2.5 text-[12px]',
        )}
      >
        <Icon className={cn('text-gold', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <span className="font-medium">{current.name}</span>
        <ChevronDown className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 mt-1 w-[320px] rounded-lg border border-border bg-surface shadow-2xl z-50 p-1.5">
            {AGENTS.map((a) => {
              const I = ICONS[a.icon] ?? Sparkles;
              const active = a.id === value;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { onChange(a.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-md hover:bg-surface-2 transition flex items-start gap-2.5',
                    active && 'bg-gold/8',
                  )}
                >
                  <I className={cn('h-4 w-4 mt-0.5 shrink-0', active ? 'text-gold' : 'text-fg-muted')} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[12.5px] font-medium', active ? 'text-gold' : 'text-fg')}>
                      {a.name}
                    </div>
                    <div className="text-[11px] text-fg-muted mt-0.5 leading-snug">{a.tagline}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
