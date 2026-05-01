'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Loader2, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useVoiceRecorder } from '../hooks/use-voice-recorder';
import { useTTS } from '../hooks/use-tts';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

type Phase = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}

export function VoiceConversation() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  const { t } = useI18n();
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  const { speak, stop: stopTTS } = useTTS({
    voice: 'nova',
    onEnd: () => {
      setPhase('idle');
      if (autoMode) {
        setTimeout(() => {
          startListening();
        }, 300);
      }
    },
    onError: (msg) => {
      toast.error(msg);
      setPhase('idle');
    },
  });

  const sendToChat = useCallback(async (userText: string) => {
    setPhase('thinking');
    const userTurn: Turn = { id: 'u_' + Date.now(), role: 'user', text: userText, ts: Date.now() };
    setTurns((prev) => [...prev, userTurn]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, conversationId }),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? 'Chat failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';
      let assistantId: string | null = null;
      let convId: string | null = conversationId;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const evt of events) {
          const lines = evt.split('\n');
          let ev = 'message';
          let data = '';
          for (const ln of lines) {
            if (ln.startsWith('event:')) ev = ln.slice(6).trim();
            else if (ln.startsWith('data:')) data += ln.slice(5).trim();
          }
          if (!data) continue;
          try {
            const json = JSON.parse(data);
            if (ev === 'meta' && json.conversationId) {
              convId = json.conversationId;
              if (!conversationId) setConversationId(convId);
              if (json.assistantMessageId) assistantId = json.assistantMessageId;
            } else if (ev === 'delta' && typeof json.text === 'string') {
              fullText += json.text;
            }
          } catch { /* ignore */ }
        }
      }

      if (!fullText.trim()) throw new Error('Empty response');

      const asstTurn: Turn = { id: assistantId ?? ('a_' + Date.now()), role: 'assistant', text: fullText, ts: Date.now() };
      setTurns((prev) => [...prev, asstTurn]);

      setPhase('speaking');
      await speak(fullText);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      toast.error(msg);
      setPhase('idle');
    }
  }, [conversationId, speak]);

  const { state: recState, level, start, stop } = useVoiceRecorder({
    onTranscript: (text) => {
      setPhase('transcribing');
      sendToChat(text);
    },
    onError: (msg) => {
      toast.error(msg);
      setPhase('idle');
    },
    silenceTimeoutMs: autoMode ? 1800 : undefined,
  });

  const startListening = useCallback(async () => {
    if ((phaseRef.current as string) !== 'idle') return;
    setPhase('listening');
    await start();
  }, [start]);

  const stopAll = useCallback(() => {
    stopTTS();
    stop();
    setPhase('idle');
  }, [stop, stopTTS]);

  useEffect(() => {
    if (recState === 'recording' && phase === 'idle') setPhase('listening');
    // Don't reset to idle during auto-mode — let the flow continue
  }, [recState, phase]);

  const orbColor =
    phase === 'listening' ? 'rgba(201, 168, 99, 0.6)' :
    phase === 'thinking' ? 'rgba(180, 180, 200, 0.5)' :
    phase === 'transcribing' ? 'rgba(201, 168, 99, 0.4)' :
    phase === 'speaking' ? 'rgba(228, 200, 138, 0.6)' :
    'rgba(140, 140, 140, 0.3)';

  const orbScale = 1 + (phase === 'listening' ? level * 0.6 : phase === 'speaking' ? 0.15 : 0);

  const phaseLabel =
    phase === 'idle' ? 'Tap to talk' :
    phase === 'listening' ? t('voice.listening') :
    phase === 'transcribing' ? t('voice.transcribing') :
    phase === 'thinking' ? t('voice.thinking') :
    phase === 'speaking' ? t('voice.speaking') :
    'Ready';

  const isActive = phase !== 'idle';

  return (
    <div className="min-h-[calc(var(--vvh)-56px)] flex flex-col">
      <div className="px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-0.5">Voice mode</div>
          <h1 className="font-display text-[26px]">Conversation</h1>
        </div>
        <button
          type="button"
          onClick={() => setAutoMode((v) => !v)}
          className={cn(
            'h-7 px-3 rounded-full text-[11.5px] uppercase tracking-[0.1em] border transition',
            autoMode
              ? 'bg-gold/15 border-gold/50 text-gold'
              : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
          )}
        >
          {autoMode ? 'Auto-listen ON' : 'Auto-listen OFF'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-4">
        <div className="max-w-[680px] mx-auto space-y-4">
          {turns.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[14px] text-fg-muted">
                Press the orb and talk to your assistant.<br />
                It listens, thinks, and speaks back.
              </p>
            </div>
          ) : (
            turns.map((t) => (
              <div key={t.id} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'rounded-2xl px-4 py-2.5 max-w-[78%] text-[14px] leading-relaxed',
                  t.role === 'user'
                    ? 'bg-surface-3 text-fg'
                    : 'bg-gold/8 border border-gold/20 text-fg',
                )}>
                  {t.text}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pb-10 pt-4 flex flex-col items-center gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              if (phase === 'idle') startListening();
              else stopAll();
            }}
            className={cn(
              'h-28 w-28 rounded-full transition-all flex items-center justify-center',
              isActive ? 'scale-105' : 'hover:scale-105',
            )}
            style={{
              background: 'radial-gradient(circle at 30% 30%, ' + orbColor + ' 0%, rgba(11,11,12,0.95) 70%)',
              boxShadow: '0 0 80px ' + orbColor + ', inset 0 0 60px rgba(201, 168, 99, 0.15)',
              transform: 'scale(' + orbScale + ')',
              transition: 'transform 80ms linear, box-shadow 200ms ease',
            }}
          >
            {phase === 'thinking' || phase === 'transcribing' ? (
              <Loader2 className="h-8 w-8 text-gold animate-spin" />
            ) : phase === 'speaking' ? (
              <Volume2 className="h-9 w-9 text-gold" />
            ) : phase === 'listening' ? (
              <Square className="h-7 w-7 text-gold" fill="currentColor" />
            ) : (
              <Mic className="h-9 w-9 text-fg-muted" />
            )}
          </button>
        </div>
        <div className="text-center">
          <div className="text-[12.5px] uppercase tracking-[0.18em] text-fg-muted">{phaseLabel}</div>
          {isActive && (phase as string) !== 'idle' && (
            <button
              type="button"
              onClick={stopAll}
              className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-fg-subtle hover:text-fg transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
