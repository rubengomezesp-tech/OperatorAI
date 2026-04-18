'use client';
import { useCallback, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { ChatTopbar } from './chat-topbar';
import { ChatSidebar } from './chat-sidebar';
import { ChatDrawer } from './chat-drawer';
import { useSendMessage } from '../hooks/use-send-message';
import { useChatStore, MODEL_OPTIONS } from '../stores/chat-store';
import type { UiMessage } from '@/lib/chat/types';
import type { ToolPart } from './tool-result';

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
    (userText: string | null, regenOfAssistantId: string | null, attachment?: { base64: string; mimeType: string; fileName: string }) => {
      const assistantPlaceholderId = nanoid();

      setMessages((prev) => {
        let next = prev;
        if (regenOfAssistantId) {
          next = prev.map((m) =>
            m.id === regenOfAssistantId
              ? { ...m, id: assistantPlaceholderId, content: '', status: 'streaming' as const, error: undefined, toolParts: [] }
              : m,
          );
        } else {
          if (userText) {
            const displayText = attachment
              ? userText + '\n\n📎 ' + attachment.fileName
              : userText;
            const userMsg: UiMessage = { id: nanoid(), role: 'user', content: displayText, createdAt: new Date().toISOString(), status: 'complete' };
            next = [...prev, userMsg];
          }
          const assistantMsg: UiMessage = { id: assistantPlaceholderId, role: 'assistant', content: '', createdAt: new Date().toISOString(), status: 'streaming', toolParts: [] };
          next = [...next, assistantMsg];
        }
        return next;
      });

      send({
        conversationId,
        message: userText ?? '__regenerate__',
        provider: providerForModel,
        model: selectedModel,
        imageBase64: attachment?.base64,
        imageMimeType: attachment?.mimeType,
        onAssistantStart: (meta) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, id: meta.assistantMessageId } : m)),
          );
          if (meta.isNewConversation) {
            setConversationId(meta.conversationId);
            window.history.replaceState(null, '', '/chat/' + meta.conversationId);
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
        onToolStart: (part: ToolPart) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.role === 'assistant' && m.status === 'streaming'
                ? { ...m, toolParts: [...(m.toolParts ?? []), part] }
                : m,
            ),
          );
        },
        onToolResult: (update) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.role !== 'assistant' || m.status !== 'streaming') return m;
              const parts = (m.toolParts ?? []).map((p) =>
                p.id === update.toolUseId
                  ? { ...p, status: update.ok ? ('done' as const) : ('failed' as const), result: update.result, error: update.error }
                  : p,
              );
              return { ...m, toolParts: parts };
            }),
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

  const handleSend = useCallback(
    (text: string, attachment?: { base64: string; mimeType: string; fileName: string }) =>
      streamInto(text, null, attachment),
    [streamInto],
  );

  const handleRegenerate = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    streamInto(null, lastAssistant.id);
  }, [messages, streamInto]);

  void title;
  void setTitle;

  const router = useRouter();

  function handleChatSelect(id: string) {
    if (id === 'new') router.push('/chat');
    else router.push('/chat/' + id);
  }

  return (
    <div className="h-[calc(100vh-56px)] flex">
      <ChatSidebar currentId={conversationId} onSelect={handleChatSelect} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <ChatDrawer currentId={conversationId} onSelect={handleChatSelect} />
          <ChatTopbar title={initialTitle} conversationId={conversationId} />
        </div>
        <MessageList messages={messages} onRegenerate={handleRegenerate} regenDisabled={loading} />
        <Composer onSend={handleSend} onCancel={cancel} loading={loading} />
      </div>
    </div>
  );
}
