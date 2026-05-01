'use client';

import { useState, useCallback, useRef } from 'react';

export type AdStreamStage =
  | 'idle'
  | 'analysis'
  | 'brief'
  | 'prompt'
  | 'image'
  | 'finalize'
  | 'done'
  | 'error';

export interface AdStreamState {
  stage: AdStreamStage;
  message: string;
  /** Latest partial image as data URI, or null */
  partialDataUri: string | null;
  /** Final uploaded image URL */
  finalUrl: string | null;
  /** Brief returned at the end */
  brief: Record<string, unknown> | null;
  error: string | null;
}

export interface AdStreamPayload {
  userPrompt: string;
  images?: Array<{ base64: string; mimeType: string }>;
  logoUrl?: string;
  brandContext?: { brand_name?: string; description?: string; vibe?: string };
  formats?: Array<'9:16' | '1:1' | '4:5' | '16:9'>;
  partialImages?: number;
}

const INITIAL_STATE: AdStreamState = {
  stage: 'idle',
  message: '',
  partialDataUri: null,
  finalUrl: null,
  brief: null,
  error: null,
};

export function useAdStreamGeneration() {
  const [state, setState] = useState<AdStreamState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const generate = useCallback(async (payload: AdStreamPayload) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...INITIAL_STATE, stage: 'analysis', message: 'Analizando tu petición' });

    try {
      const res = await fetch('/api/ads/create-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          partialImages: payload.partialImages ?? 2,
          enableAudit: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'unknown');
        setState((s) => ({ ...s, stage: 'error', error: `HTTP ${res.status}: ${text.slice(0, 200)}` }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() ?? '';

        for (const block of blocks) {
          if (!block.trim()) continue;
          const eventLine = block.split('\n').find((l) => l.startsWith('event: '));
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.slice(7).trim();
          const dataStr = dataLine.slice(6).trim();

          let data: Record<string, unknown> = {};
          try {
            data = JSON.parse(dataStr) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (eventName === 'stage') {
            const stageVal = (data.stage ?? 'analysis') as AdStreamStage;
            const messageVal = String(data.message ?? '');
            setState((s) => ({ ...s, stage: stageVal, message: messageVal }));
          } else if (eventName === 'partial' && typeof data.b64 === 'string') {
            const fmt = String(data.format ?? 'jpeg');
            setState((s) => ({
              ...s,
              partialDataUri: `data:image/${fmt};base64,${data.b64 as string}`,
            }));
          } else if (eventName === 'result') {
            setState((s) => ({
              ...s,
              finalUrl: String(data.url ?? ''),
              brief: (data.brief as Record<string, unknown>) ?? null,
              stage: 'done',
              message: '',
            }));
          } else if (eventName === 'error') {
            setState((s) => ({
              ...s,
              stage: 'error',
              error: String(data.message ?? 'Error desconocido'),
            }));
          } else if (eventName === 'done') {
            setState((s) => (s.stage === 'error' ? s : { ...s, stage: 'done' }));
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState((s) => ({
        ...s,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Streaming failed',
      }));
    } finally {
      abortRef.current = null;
    }
  }, []);

  return { state, generate, reset };
}
