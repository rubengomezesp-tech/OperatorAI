'use client';
import { useCallback, useRef, useState } from 'react';

interface UseTTSOptions {
  voice?: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer';
  speed?: number;
  onError?: (msg: string) => void;
  onEnd?: () => void;
}

export type TTSState = 'idle' | 'loading' | 'playing' | 'paused';

export function useTTS(opts: UseTTSOptions = {}) {
  const [state, setState] = useState<TTSState>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const stop = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.currentTime = 0;
    }
    setState('idle');
  }, []);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (a && !a.paused) {
      a.pause();
      setState('paused');
    }
  }, []);

  const resume = useCallback(() => {
    const a = audioRef.current;
    if (a && a.paused) {
      a.play().catch(() => {});
      setState('playing');
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;
    try {
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setState('loading');

      const cacheKey = (opts.voice ?? 'nova') + '::' + text.slice(0, 200);
      let url = cacheRef.current.get(cacheKey);

      if (!url) {
        const res = await fetch('/api/voice/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice: opts.voice ?? 'nova',
            speed: opts.speed ?? 1.0,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'TTS failed');
        }
        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        cacheRef.current.set(cacheKey, url);
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setState('idle');
        opts.onEnd?.();
      };
      audio.onerror = () => {
        setState('idle');
        opts.onError?.('Playback failed');
      };
      audio.onplay = () => setState('playing');
      audio.onpause = () => {
        if (audio.currentTime < audio.duration) setState('paused');
      };
      await audio.play();
    } catch (e) {
      setState('idle');
      opts.onError?.(e instanceof Error ? e.message : 'TTS failed');
    }
  }, [opts.voice, opts.speed, opts.onError, opts.onEnd]);

  return { state, speak, stop, pause, resume };
}
