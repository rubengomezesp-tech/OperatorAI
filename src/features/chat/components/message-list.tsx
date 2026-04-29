'use client';
import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { UiMessage } from '@/lib/chat/types';
import { SpeakButton } from '@/features/voice/components/speak-button';
import { useI18n } from '@/lib/i18n';

interface Props {
  messages: UiMessage[];
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "w-full py-6",
            msg.role === 'assistant' ? 'bg-zinc-50 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-950'
          )}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A863] to-[#0A0A0B] flex items-center justify-center text-white text-sm font-medium">
                {msg.role === 'assistant' ? 'O' : 'U'}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <MessageContent content={msg.content} />
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="w-full py-6 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A863] to-[#0A0A0B] flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-500">Pensando...</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  );
}

2. src/features/chat/components/composer.tsx
export function Composer({ onSend, disabled }: ComposerProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Escribe tu mensaje..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A863] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex-shrink-0 rounded-xl bg-[#C9A863] px-5 py-3 text-sm font-medium text-[#0A0A0B] hover:bg-[#d4b574] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
