'use client';
import { useCallback, useRef, useState } from 'react';
import { parseSSEStream } from '@/lib/chat/sse-client';
import type { ToolPart, ToolKind } from '@/features/chat/components/tool-result';

interface SendOptions {
  conversationId: string | null;
  message: string;
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  regenerate?: boolean;
  imageBase64?: string;
  imageMimeType?: string;
  onAssistantStart?: (meta: { conversationId: string; assistantMessageId: string; isNewConversation: boolean }) => void;
  onDelta?: (chunk: string) => void;
  onToolStart?: (part: ToolPart) => void;
  onToolResult?: (update: { toolUseId: string; tool: ToolKind; ok: boolean; result?: ToolPart['result']; error?: string }) => void;
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
          imageBase64: opts.imageBase64,
          imageMimeType: opts.imageMimeType,
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
          try { opts.onAssistantStart?.(JSON.parse(event.data)); } catch {}
        } else if (event.event === 'delta') {
          try { const { text } = JSON.parse(event.data); opts.onDelta?.(text); } catch {}
        } else if (event.event === 'tool_start') {
          try {
            const data = JSON.parse(event.data) as { toolUseId: string; tool: ToolKind; input: Record<string, unknown> };
            opts.onToolStart?.({ id: data.toolUseId, kind: data.tool, status: 'running', input: data.input, createdAt: new Date().toISOString() });
          } catch {}
        } else if (event.event === 'tool_result') {
          try { opts.onToolResult?.(JSON.parse(event.data)); } catch {}
        } else if (event.event === 'done') {
          try { opts.onDone?.(JSON.parse(event.data)); } catch {}
        } else if (event.event === 'error') {
          try { const { message } = JSON.parse(event.data); opts.onError?.(message); } catch { opts.onError?.('Unknown error'); }
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
