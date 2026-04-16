'use client';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { AGENTS, type AgentId } from '../data/catalog';

interface Props {
  value: AgentId;
  onChange: (id: AgentId) => void;
}

export function AgentPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = AGENTS.find((a) => a.id === value) ?? AGENTS[0];

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-2.5 h-8 rounded-md border text-[12px] transition',
          open
            ? 'bg-gold/10 border-gold/50 text-gold'
            : 'bg-surface-2 border-border text-fg-muted hover:text-fg hover:border-border/60'
        )}
      >
        <span className="text-[14px] leading-none">{selected.emoji}</span>
        <span className="font-medium">{selected.name}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[320px] surface-raised rounded-lg border border-border shadow-2xl overflow-hidden z-40 animate-fadeIn">
          <div className="p-1.5 max-h-[380px] overflow-y-auto">
            {AGENTS.map((agent) => {
              const isSelected = agent.id === value;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => { onChange(agent.id); setOpen(false); }}
                  className={cn(
                    'w-full text-left flex items-start gap-3 p-2.5 rounded-md transition',
                    isSelected
                      ? 'bg-gold/10'
                      : 'hover:bg-surface-2'
                  )}
                >
                  <span className="text-[20px] leading-none shrink-0 mt-0.5">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[13px] font-medium',
                        isSelected ? 'text-gold' : 'text-fg'
                      )}>{agent.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle uppercase tracking-[0.1em]">
                        {agent.provider}
                      </span>
                    </div>
                    <div className="text-[11.5px] text-fg-muted mt-0.5 leading-relaxed">
                      {agent.tagline}
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-gold shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
