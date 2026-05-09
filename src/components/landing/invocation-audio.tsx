'use client';

/**
 * 🔊 INVOCATION AUDIO v3
 *
 * FIXES v3:
 *   ✅ AudioContext closed twice → check state antes de close
 *   ✅ Try/catch en cada operación crítica
 *   ✅ Closed flag para evitar dobles operaciones
 *
 * Sonidos:
 *   - Ambient: drone bajo (55Hz hum) sutil
 *   - Engagement: click sutil al aparecer logo
 */

import { useCallback, useEffect, useRef } from 'react';

interface InvocationAudio {
  startAmbient: () => void;
  playEngagement: () => void;
  stop: () => void;
}

const MAX_VOLUME = 0.15;

export function useInvocationAudio(): InvocationAudio {
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientOscillatorRef = useRef<OscillatorNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const closedRef = useRef(false);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (closedRef.current) return null;

    const w = window as unknown as { OPERATOR_AUDIO_MUTED?: boolean };
    if (w.OPERATOR_AUDIO_MUTED) return null;

    if (!audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        audioContextRef.current = new AudioCtx();
      } catch (e) {
        console.warn('[invocation-audio] AudioContext unavailable:', e);
        return null;
      }
    }

    // Check si ya cerrado externamente
    if (audioContextRef.current.state === 'closed') {
      audioContextRef.current = null;
      closedRef.current = true;
      return null;
    }

    return audioContextRef.current;
  }, []);

  const startAmbient = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    try {
      if (ambientOscillatorRef.current) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (ctx.state === 'closed') return;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(55, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);
      filter.Q.setValueAtTime(0.7, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(MAX_VOLUME * 0.3, ctx.currentTime + 1.2);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();

      ambientOscillatorRef.current = oscillator;
      ambientGainRef.current = gain;
    } catch (e) {
      console.warn('[invocation-audio] startAmbient failed:', e);
    }
  }, [getCtx]);

  const playEngagement = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      if (ctx.state === 'closed') return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(MAX_VOLUME * 0.5, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn('[invocation-audio] playEngagement failed:', e);
    }
  }, [getCtx]);

  /**
   * FIX v3: Cleanup robusto que previene "Cannot close a closed AudioContext"
   */
  const stop = useCallback(() => {
    if (closedRef.current) return; // Ya cerrado, idempotente
    closedRef.current = true;

    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      // Fade out ambient
      if (ambientOscillatorRef.current && ambientGainRef.current && ctx.state === 'running') {
        const now = ctx.currentTime;
        try {
          ambientGainRef.current.gain.cancelScheduledValues(now);
          ambientGainRef.current.gain.setValueAtTime(
            ambientGainRef.current.gain.value,
            now
          );
          ambientGainRef.current.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          ambientOscillatorRef.current.stop(now + 0.7);
        } catch {
          // Oscilador puede haber sido stopped ya
        }
      }

      ambientOscillatorRef.current = null;
      ambientGainRef.current = null;

      // Close context con check de state robusto
      setTimeout(() => {
        try {
          // FIX v3: Verificar state antes de close
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {
              // Silently ignore - context may already be closing
            });
          }
        } catch {
          // Silently ignore — context may have been closed by browser
        }
        audioContextRef.current = null;
      }, 1000);
    } catch (e) {
      console.warn('[invocation-audio] stop error:', e);
    }
  }, []);

  // Cleanup on unmount — solo si no se cerró ya
  useEffect(() => {
    return () => {
      if (!closedRef.current) {
        stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { startAmbient, playEngagement, stop };
}
