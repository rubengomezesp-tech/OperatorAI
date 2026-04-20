'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check, Sparkles, Zap, Brain } from 'lucide-react';
import { MODEL_OPTIONS, useChatStore } from '../stores/chat-store';
import { cn } from '@/lib/utils';

const MODEL_ICONS: Record<string, typeof Sparkles> = {
  'gpt-4o': Zap,
  'claude-sonnet-4-5-20250929': Brain,
  'gemini-2.5-flash-preview': Sparkles,
};

export function ModelSelector() {
  const selected = useChatStore((s) => s.selectedModel);
  const setModel = useChatStore((s) => s.setModel);
  const current = MODEL_OPTIONS.find((m) => m.id === selected) ?? MODEL_OPTIONS[0];
  const Icon = MODEL_ICONS[current.id] ?? Sparkles;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 h-8 rounded-lg border border-border bg-surface-2 hover:border-gold/30 text-[12px] text-fg-muted hover:text-fg transition-all">
          <Icon className="h-3 w-3 text-gold" />
          <span className="font-medium">{current.label}</span>
          <ChevronDown className="h-3 w-3 text-fg-subtle" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="min-w-[280px] rounded-xl border border-border bg-surface p-2 shadow-2xl z-50 animate-fadeIn"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
            AI Model
          </div>
          {MODEL_OPTIONS.map((opt) => {
            const OptIcon = MODEL_ICONS[opt.id] ?? Sparkles;
            return (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={() => setModel(opt.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer outline-none transition-colors',
                  selected === opt.id ? 'bg-gold/10' : 'hover:bg-surface-2',
                )}
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center border', selected === opt.id ? 'bg-gold/15 border-gold/30' : 'bg-surface-2 border-border')}>
                  <OptIcon className={cn('h-3.5 w-3.5', selected === opt.id ? 'text-gold' : 'text-fg-muted')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-[13px] font-medium', selected === opt.id ? 'text-gold' : 'text-fg')}>{opt.label}</span>
                    {selected === opt.id && <Check className="h-3 w-3 text-gold" />}
                  </div>
                  <span className="text-[11px] text-fg-muted">{opt.hint}</span>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
