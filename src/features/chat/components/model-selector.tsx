'use client';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check, Sparkles, Zap, Brain, Cpu } from 'lucide-react';
import { MODEL_OPTIONS, useChatStore, type ModelId } from '../stores/chat-store';
import { cn } from '@/lib/utils';

const MODEL_ICONS: Record<ModelId, typeof Sparkles> = {
  'operator-coach': Cpu,
  'gpt-5.4': Zap,
  'claude-opus-4-7': Brain,
  'claude-sonnet-4-5-20250929': Brain,
  'gemini-3.1-pro': Sparkles,
};

export function ModelSelector() {
  const selected = useChatStore((s) => s.selectedModel);
  const setModel = useChatStore((s) => s.setModel);
  const current = MODEL_OPTIONS.find((m) => m.id === selected) ?? MODEL_OPTIONS[0];
  const Icon = MODEL_ICONS[current.id] ?? Sparkles;
  const isOperator = current.isOperator === true;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 px-3 h-8 rounded-lg border text-[12px] transition-all',
            isOperator
              ? 'border-gold/40 bg-gold/5 text-fg shadow-[0_0_0_1px_rgba(201,168,99,0.08)] hover:border-gold/60 hover:bg-gold/10'
              : 'border-border bg-surface-2 text-fg-muted hover:border-gold/30 hover:text-fg',
          )}
        >
          <Icon className={cn('h-3 w-3', isOperator ? 'text-gold' : 'text-gold')} />
          <span className="font-medium">{current.label}</span>
          {isOperator && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60 opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-fg-subtle" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="min-w-[300px] rounded-xl border border-border bg-surface p-2 shadow-2xl z-50 animate-fadeIn"
        >
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
            AI Model
          </div>
          {MODEL_OPTIONS.map((opt) => {
            const OptIcon = MODEL_ICONS[opt.id] ?? Sparkles;
            const isOpt = selected === opt.id;
            const isOpOption = opt.isOperator === true;
            return (
              <DropdownMenu.Item
                key={opt.id}
                onSelect={() => setModel(opt.id)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer outline-none transition-colors',
                  isOpt ? 'bg-gold/10' : 'hover:bg-surface-2',
                )}
              >
                <div
                  className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center border',
                    isOpt
                      ? 'bg-gold/15 border-gold/30'
                      : isOpOption
                      ? 'bg-gold/5 border-gold/20'
                      : 'bg-surface-2 border-border',
                  )}
                >
                  <OptIcon
                    className={cn(
                      'h-3.5 w-3.5',
                      isOpt ? 'text-gold' : isOpOption ? 'text-gold/80' : 'text-fg-muted',
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[13px] font-medium',
                        isOpt ? 'text-gold' : 'text-fg',
                      )}
                    >
                      {opt.label}
                    </span>
                    {isOpOption && !isOpt && (
                      <span className="text-[9px] uppercase tracking-[0.14em] text-gold/70 font-medium px-1.5 py-0.5 rounded border border-gold/20 bg-gold/5">
                        Tuyo
                      </span>
                    )}
                    {isOpt && <Check className="h-3 w-3 text-gold ml-auto" />}
                  </div>
                  <span className="text-[11px] text-fg-muted block mt-0.5 leading-snug">
                    {opt.hint}
                  </span>
                </div>
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
