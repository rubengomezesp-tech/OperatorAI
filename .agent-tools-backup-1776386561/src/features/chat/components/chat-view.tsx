'use client';
import { useCallback, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { ChatTopbar } from './chat-topbar';
import { useSendMessage } from '../hooks/use-send-message';
import { useChatStore, MODEL_OPTIONS } from '../stores/chat-store';
import type { UiMessage } from '@/lib/chat/types';

interface Props {
  initialConversationId: string | null;
  initialMessages?: UiMessage[];
  initialTitle?: string | null;
}

export function ChatView({ initialConversationId, initialMessages = [], initialTitle = null }: Props) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const [title, setTitle] = useState<string | null>(initialTitle);
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const { send, cancel, loading } = useSendMessage();
  const selectedModel = useChatStore((s) => s.selectedModel);

  const providerForModel = useMemo(() => {
    const opt = MODEL_OPTIONS.find((m) => m.id === selectedModel);
    return opt?.provider ?? 'openai';
  }, [selectedModel]);

  const streamInto = useCallback(
    (userText: string | null, regenOfAssistantId: string | null) => {
      const assistantPlaceholderId = nanoid();

      setMessages((prev) => {
        let next = prev;

        if (regenOfAssistantId) {
          // Replace the existing assistant message with a fresh streaming one
          next = prev.map((m) =>
            m.id === regenOfAssistantId
              ? { ...m, id: assistantPlaceholderId, content: '', status: 'streaming' as const, error: undefined }
              : m,
          );
        } else {
          if (userText) {
            const userMsg: UiMessage = {
              id: nanoid(),
              role: 'user',
              content: userText,
              createdAt: new Date().toISOString(),
              status: 'complete',
            };
            next = [...prev, userMsg];
          }
          const assistantMsg: UiMessage = {
            id: assistantPlaceholderId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            status: 'streaming',
          };
          next = [...next, assistantMsg];
        }

        return next;
      });

      send({
        conversationId,
        message: userText ?? '__regenerate__',
        provider: providerForModel,
        model: selectedModel,
        onAssistantStart: (meta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, id: meta.assistantMessageId } : m)),
          );
          if (meta.isNewConversation) {
            setConversationId(meta.conversationId);
            window.history.replaceState(null, '', `/chat/${meta.conversationId}`);
          }
        },
        onDelta: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.status === 'streaming'
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => (m.status === 'streaming' ? { ...m, status: 'complete' } : m)),
          );
          router.refresh();
        },
        onError: (msg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.status === 'streaming' ? { ...m, status: 'failed', error: msg } : m,
            ),
          );
          toast.error(msg);
        },
      });
    },
    [conversationId, providerForModel, selectedModel, send, router],
  );

  const handleSend = useCallback((text: string) => streamInto(text, null), [streamInto]);

  const handleRegenerate = useCallback(() => {
    // Find the last assistant message to replace
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    streamInto(null, lastAssistant.id);
  }, [messages, streamInto]);

  void title;
  void setTitle;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      <ChatTopbar title={initialTitle} />
      <MessageList
        messages={messages}
        onRegenerate={handleRegenerate}
        regenDisabled={loading}
      />
      <Composer onSend={handleSend} onCancel={cancel} loading={loading} />
    </div>
  );
}
