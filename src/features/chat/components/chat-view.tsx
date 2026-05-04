'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { ChatTopbar } from './chat-topbar';
import { ChatDrawer } from './chat-drawer';
import { useSendMessage } from '../hooks/use-send-message';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { EmptyState } from './empty-state';
import { useChatStore, MODEL_OPTIONS } from '../stores/chat-store';
import type { UiMessage } from '@/lib/chat/types';
import { OperatorBg } from '@/components/layout/operator-bg';
import { AdLiveGenerator } from './ad-live-generator';
import type { ToolPart } from './tool-result';

interface Props {
  initialConversationId: string | null;
  initialMessages?: UiMessage[];
  initialTitle?: string | null;
  currentUserName?: string;
  currentUserAvatarUrl?: string | null;
}

export function ChatView({
  initialConversationId,
  initialMessages = [],
  initialTitle = null,
  currentUserName,
  currentUserAvatarUrl,
}: Props) {
  const router = useRouter();

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
  const userInitial = (currentUserName || 'U').trim().charAt(0).toUpperCase() || 'U';
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const { send, cancel, loading, consecutiveFailures } = useSendMessage();

  // Fix iOS keyboard: actualiza --vvh cuando el teclado aparece/desaparece
  useVisualViewport();

  useEffect(() => {
    if (consecutiveFailures === 0) setRecoveryDismissed(false);
  }, [consecutiveFailures]);

  const selectedModel = useChatStore((s) => s.selectedModel);

  const providerForModel = useMemo(() => {
    const opt = MODEL_OPTIONS.find((m) => m.id === selectedModel);
    return opt?.provider ?? 'openai';
  }, [selectedModel]);

  const streamInto = useCallback(
    (
      userText: string | null,
      regenOfAssistantId: string | null,
      attachment?: { base64: string; mimeType: string; fileName: string },
    ) => {
      const assistantPlaceholderId = nanoid();

      setMessages((prev) => {
        let next = prev;

        if (regenOfAssistantId) {
          next = prev.map((m) =>
            m.id === regenOfAssistantId
              ? {
                  ...m,
                  id: assistantPlaceholderId,
                  content: '',
                  status: 'streaming' as const,
                  error: undefined,
                  toolParts: [],
                }
              : m,
          );
        } else {
          if (userText) {
            const allUrls = (window as any).__pendingAttachmentUrls as string[] | undefined;
            delete (window as any).__pendingAttachmentUrls;

            const userMsg: UiMessage = {
              id: nanoid(),
              role: 'user',
              content: userText,
              createdAt: new Date().toISOString(),
              status: 'complete',
              attachmentUrls:
                allUrls && allUrls.length > 0
                  ? allUrls
                  : attachment
                    ? [`data:${attachment.mimeType};base64,${attachment.base64}`]
                    : undefined,
            };

            next = [...prev, userMsg];
          }

          const assistantMsg: UiMessage = {
            id: assistantPlaceholderId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            status: 'streaming',
            toolParts: [],
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
        imageBase64: attachment?.base64,
        imageMimeType: attachment?.mimeType,
        onAssistantStart: (meta) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantPlaceholderId ? { ...m, id: meta.assistantMessageId } : m,
            ),
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
                  ? {
                      ...p,
                      status: update.ok ? ('done' as const) : ('failed' as const),
                      result: update.result,
                      error: update.error,
                    }
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
            prev.map((m) => (m.status === 'streaming' ? { ...m, status: 'failed', error: msg } : m)),
          );
          toast.error(msg);
        },
      });
    },
    [conversationId, providerForModel, selectedModel, send, router],
  );

  const [adStreamPayload, setAdStreamPayload] = useState<null | {
    userPrompt: string;
    images?: Array<{ base64: string; mimeType: string }>;
    logoUrl?: string;
    brandContext?: {
      brand_name?: string;
      description?: string;
      vibe?: string;
    };
  }>(null);

  const fetchBrandPayload = async () => {
    try {
      const res = await fetch('/api/brand/get', { cache: 'no-store' });
      const json = await res.json();
      const bp = json?.data ?? json?.brandProfile ?? json;

      return {
        logoUrl: bp?.logo_url || bp?.logoUrl || undefined,
        brandContext: {
          brand_name: bp?.name || bp?.brand_name || 'Operator AI',
          description: bp?.description || '',
          vibe: bp?.vibe || bp?.tone || '',
        },
      };
    } catch (e) {
      console.error('[chat] brand profile fetch failed', e);
      return {};
    }
  };

  const handleSend = useCallback(
    async (text: string, attachment?: { base64: string; mimeType: string; fileName: string }) => {
      const isAd = /\b(publicidad|anuncio|advertisement|advert)\b/i.test(text);
      console.log('[chat] handleSend text:', text, 'isAd:', isAd, 'attachment:', !!attachment);

      if (isAd) {
        console.log('[chat] → routing to AdLiveGenerator');

        const brandPayload = await fetchBrandPayload();

        setAdStreamPayload({
          userPrompt: text,
          images: attachment ? [{ base64: attachment.base64, mimeType: attachment.mimeType }] : undefined,
          ...brandPayload,
        });

        return;
      }

      streamInto(text, null, attachment);
    },
    [streamInto],
  );

  const handleRegenerate = useCallback(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;
    streamInto(null, lastAssistant.id);
  }, [messages, streamInto]);

  function handleChatSelect(id: string) {
    if (id === 'new') router.push('/chat');
    else router.push(`/chat/${id}`);
  }

  return (
    <div className="flex overflow-hidden fixed inset-0" style={{ top: 0, bottom: "var(--kbh, 0px)" }}>
      <OperatorBg variant="chat" />

      <div className="flex-1 flex flex-col min-w-0">
        

        {consecutiveFailures >= 2 && !recoveryDismissed && (
          <div className="mx-4 mt-3 mb-1 p-3 rounded-xl glass border border-amber-500/30 flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse-dot mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] text-fg leading-snug">
                <span className="font-medium">Estamos teniendo problemas.</span>{' '}
                <span className="text-fg-muted">
                  Tu conversación está guardada. Reportado al equipo.
                </span>
              </p>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-[12px] px-3 py-1 rounded-md bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 transition-colors"
                >
                  Reintentar
                </button>

                <button
                  type="button"
                  onClick={() => router.push('/chat')}
                  className="text-[12px] px-3 py-1 rounded-md bg-surface-2 text-fg-muted hover:text-fg hover:bg-surface-3 transition-colors"
                >
                  Nueva conversación
                </button>

                <button
                  type="button"
                  onClick={() => setRecoveryDismissed(true)}
                  className="text-[12px] px-2 py-1 rounded-md text-fg-subtle hover:text-fg-muted transition-colors ml-auto"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {messages.length === 0 ? (
            <EmptyState
              onSuggestion={(prompt) => {
                const composer = document.querySelector(
                  'textarea[data-composer]',
                ) as HTMLTextAreaElement | null;

                if (!composer) return;

                composer.value = prompt;
                composer.dispatchEvent(new Event('input', { bubbles: true }));

                // iOS Safari jumps when focusing a textarea while the visual viewport is changing.
                // Keep auto-focus only for desktop/tablet wide screens.
                if (window.innerWidth >= 768) {
                  composer.focus();
                }
              }}
            />
          ) : (
            <MessageList
              messages={messages}
              onRegenerate={handleRegenerate}
              regenDisabled={loading}
              userAvatarUrl={currentUserAvatarUrl}
              userInitial={userInitial}
            />
          )}
        </div>

        <div className="flex-shrink-0" style={{ paddingBottom: "var(--kbh, 0px)" }}>
          {adStreamPayload && (
            <div className="px-4 pt-3">
              <AdLiveGenerator
                payload={adStreamPayload}
                onComplete={(url) => {
                  setAdStreamPayload(null);
                  streamInto(`![Ad](${url})`, null);
                }}
                onCancel={() => setAdStreamPayload(null)}
              />
            </div>
          )}

          <Composer onSend={handleSend} onCancel={cancel} loading={loading} />
        </div>
      </div>
    </div>
  );
}
