'use client';
import { AgentPicker } from '@/features/agents/components/agent-picker';
import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { ArrowUp, Square, Paperclip, X as XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MicButton } from '@/features/voice/components/mic-button';

interface Props {
  onSend: (text: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Composer({ onSend, onCancel, loading, disabled }: Props) {
  const [value, setValue] = useState('');
  const [agentType, setAgentType] = useState<'creative' | 'brand' | 'copy' | 'research' | 'analyst' | 'social'>('creative');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px';
  }, [value]);

  function handle() {
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle();
    }
  }

  function handleTranscript(text: string) {
    setValue((prev) => (prev ? prev + ' ' + text : text));
    setTimeout(() => ref.current?.focus(), 0);
  }

  return (
    <div className="border-t border-border glass">
      <div className="max-w-[760px] mx-auto px-6 py-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <AgentPicker value={agentType} onChange={setAgentType} />
        </div>
        <div className={cn(
          'relative flex items-end gap-2 rounded-xl border border-border bg-surface-2',
          'focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15 transition-colors',
        )}>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Message Operator..."
            rows={1}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent resize-none border-0 focus:outline-none',
              'px-4 py-3.5 text-[14.5px] text-fg placeholder:text-fg-subtle',
              'min-h-[48px] max-h-[200px]',
            )}
          />
          <div className="p-1.5 flex items-center gap-1.5">
            <MicButton onTranscript={handleTranscript} disabled={disabled || loading} size="md" />
            {loading ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 w-9 rounded-md bg-surface-3 text-fg border border-border hover:border-border-strong flex items-center justify-center"
                aria-label="Stop"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handle}
                disabled={!value.trim() || disabled}
                className={cn(
                  'h-9 w-9 rounded-md flex items-center justify-center transition-all',
                  value.trim() && !disabled
                    ? 'gold-grad text-bg shadow-[0_6px_20px_-6px_rgb(201_168_99_/_0.5)] hover:brightness-110 active:scale-[.98]'
                    : 'bg-surface-3 text-fg-subtle cursor-not-allowed',
                )}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle text-center">
          Operator AI — Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
