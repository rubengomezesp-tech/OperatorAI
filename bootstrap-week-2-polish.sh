#!/usr/bin/env bash
#
# Operator AI - Week 2 polish
# Adds: model selector, regenerate, copy code blocks, star conversations
#
set -euo pipefail

echo ">>> Operator AI - Week 2 polish"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Creating chat store for model preference..."

cat > src/features/chat/stores/chat-store.ts <<'TS'
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'gpt-4o' | 'claude-3-5-sonnet-latest';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, reliable, general-purpose' },
  { id: 'claude-3-5-sonnet-latest', label: 'Claude Sonnet 3.5', provider: 'anthropic', hint: 'Nuanced reasoning, longer outputs' },
];

interface ChatState {
  selectedModel: ModelId;
  setModel: (id: ModelId) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedModel: 'gpt-4o',
      setModel: (id) => set({ selectedModel: id }),
    }),
    { name: 'operator.chat' },
  ),
);
TS

mkdir -p src/features/chat/stores

cat > src/features/chat/stores/chat-store.ts <<'TS'
'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ModelId = 'gpt-4o' | 'claude-3-5-sonnet-latest';

export interface ModelOption {
  id: ModelId;
  label: string;
  provider: 'openai' | 'anthropic';
  hint: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', hint: 'Fast, reliable, general-purpose' },
  { id: 'claude-3-5-sonnet-latest', label: 'Claude Sonnet 3.5', provider: 'anthropic', hint: 'Nuanced reasoning, longer outputs' },
];

interface ChatState {
  selectedModel: ModelId;
  setModel: (id: ModelId) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedModel: 'gpt-4o',
      setModel: (id) => set({ selectedModel: id }),
    }),
    { name: 'operator.chat' },
  ),
);
TS

echo ">>> Writing model selector component..."

cat > src/features/chat/components/model-selector.tsx <<'TSX'
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
TSX

echo ">>> Enhancing MarkdownBody with copy-to-clipboard on code blocks..."

cat > src/features/chat/components/markdown-body.tsx <<'TSX'
'use client';
import { useState, useCallback, type ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    const el = (props as { 'data-original-ref'?: unknown })['data-original-ref'];
    void el;
    const text = typeof children === 'object' && children && 'props' in children
      ? (children as { props: { children: unknown } }).props.children
      : children;
    const str = typeof text === 'string' ? text : Array.isArray(text) ? text.join('') : String(text ?? '');
    navigator.clipboard.writeText(str).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  }, [children, props]);

  return (
    <div className="relative group my-4">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className={cn(
          'absolute top-2.5 right-2.5 h-7 w-7 rounded-md border flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          copied
            ? 'bg-gold/20 border-gold/50 text-gold'
            : 'bg-surface border-border text-fg-muted hover:text-fg hover:border-border-strong',
        )}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}

const components: Components = {
  pre: (props) => <CodeBlock {...props} />,
};

export function MarkdownBody({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn(
      'prose prose-invert max-w-none',
      'prose-p:my-3 prose-p:leading-relaxed prose-p:text-fg-soft',
      'prose-headings:font-display prose-headings:text-fg prose-headings:tracking-tight',
      'prose-h1:text-[22px] prose-h2:text-[18px] prose-h3:text-[16px]',
      'prose-strong:text-fg prose-strong:font-semibold',
      'prose-em:text-fg-soft',
      'prose-a:text-gold prose-a:no-underline hover:prose-a:underline',
      'prose-code:text-gold-soft prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none',
      'prose-pre:bg-surface-2 prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:my-0',
      'prose-blockquote:border-l-gold/40 prose-blockquote:text-fg-muted prose-blockquote:not-italic',
      'prose-ul:my-3 prose-li:my-1 prose-li:text-fg-soft prose-li:marker:text-gold/60',
      'prose-hr:border-border',
      'prose-table:text-[13.5px]',
      'prose-th:text-fg prose-th:border-border',
      'prose-td:text-fg-soft prose-td:border-border',
      className,
    )}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
TSX

echo ">>> Adding regenerate button + action row to MessageBubble..."

cat > src/features/chat/components/message-actions.tsx <<'TSX'
'use client';
import { useState } from 'react';
import { RotateCcw, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

export function MessageActions({ content, onRegenerate, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <div className="flex items-center gap-1 mt-2 opacity-60 hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={copy}
        className="h-7 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5"
        aria-label="Copy message"
      >
        {copied ? <Check className="h-3 w-3 text-gold" /> : <Copy className="h-3 w-3" />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>
      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          disabled={disabled}
          className={cn(
            'h-7 px-2 rounded-md border border-transparent text-[11.5px] transition-colors flex items-center gap-1.5',
            disabled
              ? 'text-fg-subtle cursor-not-allowed'
              : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2',
          )}
          aria-label="Regenerate"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
}
TSX

cat > src/features/chat/components/message-bubble.tsx <<'TSX'
'use client';
import { MarkdownBody } from './markdown-body';
import { MessageActions } from './message-actions';
import type { UiMessage } from '@/lib/chat/types';

interface Props {
  message: UiMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}

export function MessageBubble({ message, isLastAssistant, onRegenerate, regenDisabled }: Props) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-surface-2 border border-border rounded-2xl rounded-br-md px-4 py-3 text-[14.5px] text-fg leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  const showActions = message.status === 'complete' && message.content.length > 0;

  return (
    <div className="flex gap-4">
      <div className="h-8 w-8 rounded-md shrink-0 gold-grad flex items-center justify-center mt-1">
        <span className="font-display text-[15px] text-bg leading-none">O</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {message.content ? (
          <MarkdownBody content={message.content} />
        ) : (
          <div className="flex gap-1.5 pt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '160ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold/60 animate-pulse-dot" style={{ animationDelay: '320ms' }} />
          </div>
        )}
        {message.status === 'streaming' && message.content && (
          <span className="inline-block ml-0.5 w-[2px] h-[1em] bg-gold align-middle animate-pulse" />
        )}
        {message.status === 'failed' && (
          <div className="mt-2 text-[12.5px] text-danger">{message.error ?? 'Request failed'}</div>
        )}
        {showActions && (
          <MessageActions
            content={message.content}
            onRegenerate={isLastAssistant ? onRegenerate : undefined}
            disabled={regenDisabled}
          />
        )}
      </div>
    </div>
  );
}
TSX

echo ">>> Updating MessageList to pass regenerate handler..."

cat > src/features/chat/components/message-list.tsx <<'TSX'
'use client';
import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import type { UiMessage } from '@/lib/chat/types';

interface Props {
  messages: UiMessage[];
  onRegenerate?: () => void;
  regenDisabled?: boolean;
}

export function MessageList({ messages, onRegenerate, regenDisabled }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-[520px] text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">Creative Agent</div>
          <h2 className="font-display text-[36px] leading-[1.1] mb-4">
            What are we <span className="text-gold-grad">building</span> today?
          </h2>
          <p className="text-[14px] text-fg-muted">
            Ask me anything about your brand, strategy, campaigns, or writing.
            I know your business and adapt to your voice.
          </p>
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
TSX

echo ">>> Writing chat topbar (model selector + title)..."

cat > src/features/chat/components/chat-topbar.tsx <<'TSX'
'use client';
import { ModelSelector } from './model-selector';

export function ChatTopbar({ title }: { title?: string | null }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border">
      <div className="min-w-0">
        <div className="font-display text-[16px] truncate">
          {title || 'New conversation'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModelSelector />
      </div>
    </div>
  );
}
TSX

echo ">>> Rewriting ChatView with selector + regenerate..."

cat > src/features/chat/components/chat-view.tsx <<'TSX'
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
TSX

echo ">>> Extending use-send-message to support regenerate flag..."

cat > src/features/chat/hooks/use-send-message.ts <<'TS'
'use client';
import { useCallback, useRef, useState } from 'react';
import { parseSSEStream } from '@/lib/chat/sse-client';

interface SendOptions {
  conversationId: string | null;
  message: string;
  provider?: 'openai' | 'anthropic';
  model?: string;
  regenerate?: boolean;
  onAssistantStart?: (meta: { conversationId: string; assistantMessageId: string; isNewConversation: boolean }) => void;
  onDelta?: (chunk: string) => void;
  onDone?: (meta: { latencyMs: number; inputTokens: number; outputTokens: number; costUsd: number }) => void;
  onError?: (message: string) => void;
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (opts: SendOptions) => {
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const isRegen = opts.message === '__regenerate__';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: opts.conversationId,
          message: isRegen ? null : opts.message,
          regenerate: isRegen,
          provider: opts.provider,
          model: opts.model,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        opts.onError?.(body?.error ?? `HTTP ${res.status}`);
        setLoading(false);
        return;
      }

      for await (const event of parseSSEStream(res.body)) {
        if (event.event === 'meta') {
          try {
            const meta = JSON.parse(event.data);
            opts.onAssistantStart?.(meta);
          } catch {}
        } else if (event.event === 'delta') {
          try {
            const { text } = JSON.parse(event.data);
            opts.onDelta?.(text);
          } catch {}
        } else if (event.event === 'done') {
          try {
            const meta = JSON.parse(event.data);
            opts.onDone?.(meta);
          } catch {}
        } else if (event.event === 'error') {
          try {
            const { message } = JSON.parse(event.data);
            opts.onError?.(message);
          } catch {
            opts.onError?.('Unknown error');
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        opts.onError?.(err instanceof Error ? err.message : 'Network error');
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  }, []);

  return { send, cancel, loading };
}
TS

echo ">>> Upgrading /api/chat to support regenerate..."

cat > src/app/api/chat/route.ts <<'TS'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sseEncode, sseComment } from '@/lib/sse/encoder';
import { runChat } from '@/lib/orchestrator/run-chat';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { ensureDefaultAssistant } from '@/features/chat/server/ensure-assistant';
import { getOrCreateConversation } from '@/features/chat/server/get-or-create-conversation';
import type { ChatMessage } from '@/lib/providers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1).max(10_000).optional().nullable(),
  regenerate: z.boolean().optional().default(false),
  provider: z.enum(['openai', 'anthropic']).optional(),
  model: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  if (!body.regenerate && (!body.message || !body.message.trim())) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();

  let orgId: string;
  let orgName: string;
  try {
    const ctx = await resolveOrgContext(svc, user.id);
    orgId = ctx.orgId;
    orgName = ctx.orgName;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const assistantId = await ensureDefaultAssistant(svc, orgId, orgName);

  // Regenerate mode requires existing conversation
  if (body.regenerate && !body.conversationId) {
    return NextResponse.json({ error: 'conversationId required for regenerate' }, { status: 400 });
  }

  const { id: conversationId, isNew } = await getOrCreateConversation({
    svc, orgId, userId: user.id, assistantId, conversationId: body.conversationId,
  });

  let userMessageId: string | null = null;

  if (body.regenerate) {
    // Soft-delete the last assistant message(s) after the last user turn
    const { data: lastUserRows } = await svc
      .from('messages')
      .select('id, created_at')
      .eq('conversation_id', conversationId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1);

    const lastUserRow = lastUserRows?.[0] as { id: string; created_at: string } | undefined;
    if (!lastUserRow) {
      return NextResponse.json({ error: 'Nothing to regenerate' }, { status: 400 });
    }
    userMessageId = lastUserRow.id;

    // Hard-delete assistant messages after that user message (since we haven't added soft-delete column yet)
    await svc
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('role', 'assistant')
      .gt('created_at', lastUserRow.created_at);
  } else {
    // Persist new user message
    const userMsgInsert = {
      org_id: orgId,
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: body.message,
      status: 'complete',
    } as never;
    const { data: userMsgRow, error: userMsgErr } = await svc
      .from('messages')
      .insert(userMsgInsert)
      .select('id')
      .single();
    if (userMsgErr || !userMsgRow) {
      return NextResponse.json({ error: userMsgErr?.message ?? 'Failed to persist message' }, { status: 500 });
    }
    userMessageId = (userMsgRow as { id: string }).id;
  }

  // Load recent history (last 30 messages) for context
  const { data: history } = await svc
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(30);

  const messages: ChatMessage[] = (history ?? []).map((m) => ({
    role: (m as { role: string }).role as ChatMessage['role'],
    content: (m as { content: string }).content ?? '',
  }));

  // Load assistant profile
  const { data: assistantRow } = await svc
    .from('assistants')
    .select('business_name, industry, audience, services, goals, tone, writing_style, languages, custom_instructions, banned_words')
    .eq('id', assistantId)
    .single();

  // Create pending assistant message
  const pendingInsert = {
    org_id: orgId,
    conversation_id: conversationId,
    user_id: user.id,
    role: 'assistant',
    content: '',
    status: 'streaming',
    provider: body.provider ?? 'openai',
    model: body.model ?? null,
    parent_message_id: userMessageId,
  } as never;
  const { data: pendingRow, error: pendingErr } = await svc
    .from('messages')
    .insert(pendingInsert)
    .select('id')
    .single();
  if (pendingErr || !pendingRow) {
    return NextResponse.json({ error: pendingErr?.message ?? 'Failed to create pending message' }, { status: 500 });
  }
  const pendingMessageId = (pendingRow as { id: string }).id;

  const started = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(sseComment('stream start'));
        controller.enqueue(sseEncode('meta', {
          conversationId,
          assistantMessageId: pendingMessageId,
          isNewConversation: isNew,
        }));

        let fullText = '';
        let inputTokens = 0;
        let outputTokens = 0;
        let costUsd = 0;
        let failed = false;
        let errorMessage = '';

        for await (const delta of runChat({
          messages,
          assistant: assistantRow as Parameters<typeof runChat>[0]['assistant'],
          provider: body.provider,
          model: body.model,
          signal: req.signal,
        })) {
          if (delta.type === 'text') {
            fullText += delta.value;
            controller.enqueue(sseEncode('delta', { text: delta.value }));
          } else if (delta.type === 'done') {
            inputTokens = delta.inputTokens ?? 0;
            outputTokens = delta.outputTokens ?? 0;
            costUsd = delta.costUsd ?? 0;
          } else if (delta.type === 'error') {
            failed = true;
            errorMessage = delta.message;
            controller.enqueue(sseEncode('error', { message: delta.message }));
          }
        }

        const latencyMs = Date.now() - started;

        await svc
          .from('messages')
          .update({
            content: fullText,
            status: failed ? 'failed' : 'complete',
            error_message: failed ? errorMessage : null,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            latency_ms: latencyMs,
            cost_usd: costUsd,
          } as never)
          .eq('id', pendingMessageId);

        if (isNew) {
          const title = fullText.slice(0, 60).replace(/\s+/g, ' ').trim() || (body.message ?? '').slice(0, 60);
          await svc.from('conversations').update({ title } as never).eq('id', conversationId);
        }

        await svc.rpc('increment_usage', {
          p_org_id: orgId,
          p_kind: 'chat_message',
          p_quantity: 1,
          p_cost: costUsd,
        });

        controller.enqueue(sseEncode('done', {
          latencyMs, inputTokens, outputTokens, costUsd,
        }));
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(sseEncode('error', { message: msg }));
        await svc
          .from('messages')
          .update({ status: 'failed', error_message: msg } as never)
          .eq('id', pendingMessageId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
TS

echo ">>> Adding star conversations API + rail UI..."

cat > src/app/api/conversations/star/route.ts <<'TS'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';

const BodySchema = z.object({
  conversationId: z.string().min(1),
  starred: z.boolean(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const { error } = await svc
    .from('conversations')
    .update({ is_starred: parsed.data.starred } as never)
    .eq('id', parsed.data.conversationId)
    .eq('org_id', orgId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
TS

echo ">>> Rewriting ConversationsRail with starring + grouping..."

cat > src/features/chat/components/conversations-rail.tsx <<'TSX'
'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Plus, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/lib/chat/types';

export function ConversationsRail({ activeId }: { activeId?: string | null }) {
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/api/conversations/list')
      .then((r) => r.json())
      .then((data) => setConvs(data.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [activeId, refresh]);

  async function toggleStar(id: string, starred: boolean) {
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, is_starred: starred } : c)));
    await fetch('/api/conversations/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id, starred }),
    }).catch(() => {
      setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, is_starred: !starred } : c)));
    });
  }

  const starred = convs.filter((c) => c.is_starred);
  const rest = convs.filter((c) => !c.is_starred);

  return (
    <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-r border-border bg-bg">
      <div className="px-4 py-4 border-b border-border">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface-2 hover:border-gold/50 text-[13px] text-fg transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-gold" />
          <span>New chat</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {loading && <div className="px-3 py-2 text-[12.5px] text-fg-subtle">Loading...</div>}
        {!loading && convs.length === 0 && (
          <div className="px-3 py-2 text-[12.5px] text-fg-subtle">No conversations yet.</div>
        )}

        {starred.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-gold">Starred</div>
            <ul className="space-y-0.5">
              {starred.map((c) => (
                <ConversationItem key={c.id} c={c} active={activeId === c.id} onStar={toggleStar} />
              ))}
            </ul>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">Recent</div>
            <ul className="space-y-0.5">
              {rest.map((c) => (
                <ConversationItem key={c.id} c={c} active={activeId === c.id} onStar={toggleStar} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function ConversationItem({
  c, active, onStar,
}: {
  c: ConversationSummary;
  active: boolean;
  onStar: (id: string, starred: boolean) => void;
}) {
  return (
    <li className="group relative">
      <Link
        href={`/chat/${c.id}`}
        className={cn(
          'flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] transition-colors pr-8',
          active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
        )}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{c.title || 'Untitled chat'}</span>
      </Link>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onStar(c.id, !c.is_starred); }}
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center transition-all',
          c.is_starred
            ? 'opacity-100 text-gold'
            : 'opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-gold',
        )}
        aria-label={c.is_starred ? 'Unstar' : 'Star'}
      >
        <Star className={cn('h-3 w-3', c.is_starred && 'fill-current')} />
      </button>
    </li>
  );
}
TSX

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -20

echo ""
echo "========================================"
echo "  Week 2 polish complete."
echo "========================================"
echo ""
echo "What's new:"
echo "  * Model selector in chat topbar (GPT-4o / Claude 3.5 Sonnet)"
echo "  * Regenerate button on last assistant message"
echo "  * Copy button on messages"
echo "  * Copy button on code blocks (hover)"
echo "  * Star conversations + starred group in sidebar"
echo ""
echo "Restart pnpm dev if running, then go to http://localhost:3000/chat"
echo ""
