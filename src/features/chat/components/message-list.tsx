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
  userAvatarUrl?: string | null;
  userInitial?: string;
}

export function MessageList({ messages, onRegenerate, regenDisabled, userAvatarUrl, userInitial }: Props) {
  const { t } = useI18n();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    // Empty state handled by ChatView's EmptyState component (Sprint 3.1)
    return null;
  }

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  })();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            isLastAssistant={i === lastAssistantIdx}
            onRegenerate={onRegenerate}
            regenDisabled={regenDisabled}
            previousUserContent={i > 0 && messages[i - 1].role === "user" ? messages[i - 1].content : undefined}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
