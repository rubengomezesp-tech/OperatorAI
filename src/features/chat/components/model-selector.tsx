'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check, Sparkles } from 'lucide-react';
import { MODEL_OPTIONS, useChatStore } from '../stores/chat-store';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const selected = useChatStore((s) => s.selectedModel);
  const setModel = useChatStore((s) => s.setModel);
  const current = MODEL_OPTIONS.find((m) => m.id === selected) ?? MODEL_OPTIONS[0];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-surface-2 hover:border-border-strong text-[12.5px] text-fg-soft hover:text-fg transition-colors">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>{current.label}</span>
          <ChevronDown className="h-3 w-3 text-fg-subtle" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="min-w-[260px] rounded-md border border-border bg-surface p-1.5 shadow-xl z-50"
        >
          <div className="px-2.5 py-1.5 text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
            Model
          </div>
          {MODEL_OPTIONS.map((opt) => {
            const isSelected = opt.id === selected;
            return (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={() => setModel(opt.id)}
                className={cn(
                  'flex items-start gap-2.5 px-2.5 py-2 rounded-md cursor-pointer outline-none',
                  'hover:bg-surface-2',
                )}
              >
                <div className={cn(
                  'h-4 w-4 mt-0.5 rounded-full shrink-0 flex items-center justify-center',
                  isSelected ? 'gold-grad' : 'border border-border bg-surface-2',
                )}>
                  {isSelected && <Check className="h-2.5 w-2.5 text-bg" strokeWidth={3} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-fg font-medium">{opt.label}</div>
                  <div className="text-[11.5px] text-fg-muted leading-relaxed mt-0.5">{opt.hint}</div>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
