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

export function MessageList({ messages, onRegenerate, regenDisabled }: Props) {
  const { t } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-[520px] text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">{t('chat.kicker')}</div>
          <h2 className="font-display text-[36px] leading-[1.1] mb-4">
            {t('chat.empty_title_1')}<span className="text-gold-grad">{t('chat.empty_title_2')}</span>{t('chat.empty_title_3')}
          </h2>
          <p className="text-[14px] text-fg-muted">
            {t('chat.empty_desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              { key: 'chat.quick_image', emoji: '🎨' },
              { key: 'chat.quick_campaign', emoji: '🚀' },
              { key: 'chat.quick_copy', emoji: '✍️' },
              { key: 'chat.quick_strategy', emoji: '🎯' },
              { key: 'chat.quick_analyze', emoji: '📊' },
              { key: 'chat.quick_video', emoji: '🎬' },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => {
                  const input = document.querySelector('textarea');
                  if (input) { input.value = t(chip.key); input.focus(); input.dispatchEvent(new Event('input', { bubbles: true })); }
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all"
              >
                <span>{chip.emoji}</span>
                <span>{t(chip.key)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[760px] mx-auto px-6 py-10 space-y-8">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            isLastAssistant={i === lastAssistantIdx}
            onRegenerate={onRegenerate}
            regenDisabled={regenDisabled}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
