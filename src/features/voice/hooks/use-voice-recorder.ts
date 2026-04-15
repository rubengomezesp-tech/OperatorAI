'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'processing';

interface Options {
  onTranscript?: (text: string) => void;
  onError?: (msg: string) => void;
  language?: string;
  silenceTimeoutMs?: number; // for VAD-style auto-stop
}

export function useVoiceRecorder(opts: Options = {}) {
  const [state, setState] = useState<RecorderState>('idle');
  const [level, setLevel] = useState(0); // 0..1 audio level for visualizer
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // Audio level visualizer
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastVoice = Date.now();
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 4));
        if (rms > 0.04) lastVoice = Date.now();

        // Silence detection auto-stop (only if option set)
        if (optsRef.current.silenceTimeoutMs && Date.now() - lastVoice > optsRef.current.silenceTimeoutMs) {
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();

      // Recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setState('processing');
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        try {
          if (blob.size < 1000) {
            optsRef.current.onError?.('Recording too short.');
            setState('idle');
            return;
          }
          const form = new FormData();
          const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
          form.append('audio', blob, 'recording.' + ext);
          if (optsRef.current.language) form.append('language', optsRef.current.language);
          const res = await fetch('/api/voice/transcribe', { method: 'POST', body: form });
          const body = await res.json();
          if (!res.ok) throw new Error(body?.error ?? 'Transcription failed');
          const text = (body.text ?? '').trim();
          if (text) optsRef.current.onTranscript?.(text);
          else optsRef.current.onError?.('No speech detected.');
        } catch (err) {
          optsRef.current.onError?.(err instanceof Error ? err.message : 'Transcription failed');
        } finally {
          setState('idle');
        }
      };
      recorder.start(250);
      setState('recording');
    } catch (err) {
      cleanup();
      setState('idle');
      const msg = err instanceof Error ? err.message : 'Microphone permission denied';
      optsRef.current.onError?.(msg);
    }
  }, [state, cleanup]);

  const stop = useCallback(() => {
    const r = mediaRecorderRef.current;
    if (r && r.state !== 'inactive') {
      r.stop();
    }
  }, []);

  const cancel = useCallback(() => {
    chunksRef.current = [];
    const r = mediaRecorderRef.current;
    if (r && r.state !== 'inactive') {
      r.onstop = null as never;
      r.stop();
    }
    cleanup();
    setState('idle');
  }, [cleanup]);

  return { state, level, start, stop, cancel };
}
