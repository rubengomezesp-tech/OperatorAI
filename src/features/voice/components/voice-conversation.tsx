(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle''use client';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { useCallback, useEffect, useRef, useState } from 'react';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { Mic, Square, Loader2, Volume2, X } from 'lucide-react';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { toast } from 'sonner';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { useVoiceRecorder } from '../hooks/use-voice-recorder';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { useTTS } from '../hooks/use-tts';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'import { cn } from '@/lib/utils';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'type Phase = 'idle' | 'listening' | 'transcribing' | 'thinking' | 'speaking' | 'error';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'interface Turn {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  id: string;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  role: 'user' | 'assistant';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  text: string;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  ts: number;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'export function VoiceConversation() {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const [phase, setPhase] = useState<Phase>('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const [turns, setTurns] = useState<Turn[]>([]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const [conversationId, setConversationId] = useState<string | null>(null);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const [autoMode, setAutoMode] = useState(true);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const phaseRef = useRef(phase);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  phaseRef.current = phase;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const { speak, stop: stopTTS, state: ttsState } = useTTS({
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    voice: 'nova',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    onEnd: () => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      // After assistant finishes speaking, in auto mode start listening again
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      if (autoMode && phaseRef.current === 'speaking') {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        setTimeout(() => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          if if ((phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle') {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            startListening();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        }, 500);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      } else {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    },
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    onError: (msg) => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      toast.error(msg);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    },
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  });
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const sendToChat = useCallback(async (userText: string) => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    setPhase('thinking');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    const userTurn: Turn = { id: 'u_' + Date.now(), role: 'user', text: userText, ts: Date.now() };
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    setTurns((prev) => [...prev, userTurn]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    try {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      const res = await fetch('/api/chat', {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        method: 'POST',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        headers: { 'Content-Type': 'application/json' },
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        body: JSON.stringify({ message: userText, conversationId }),
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      });
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      if (!res.ok || !res.body) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        const body = await res.json().catch(() => ({}));
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        throw new Error(body?.error ?? 'Chat failed');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      const reader = res.body.getReader();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      const decoder = new TextDecoder();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      let fullText = '';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      let buffer = '';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      let assistantId: string | null = null;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      let convId: string | null = conversationId;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      while (true) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        const { value, done } = await reader.read();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        if (done) break;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        buffer += decoder.decode(value, { stream: true });
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        const events = buffer.split('\n\n');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        buffer = events.pop() ?? '';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        for (const evt of events) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          const lines = evt.split('\n');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          let ev = 'message';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          let data = '';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          for (const ln of lines) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            if (ln.startsWith('event:')) ev = ln.slice(6).trim();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            else if (ln.startsWith('data:')) data += ln.slice(5).trim();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          if (!data) continue;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          try {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            const json = JSON.parse(data);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            if (ev === 'meta' && json.conversationId) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              convId = json.conversationId;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              if (!conversationId) setConversationId(convId);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              if (json.assistantMessageId) assistantId = json.assistantMessageId;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            } else if (ev === 'delta' && typeof json.text === 'string') {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              fullText += json.text;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          } catch { /* ignore */ }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      if (!fullText.trim()) throw new Error('Empty response');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      const asstTurn: Turn = { id: assistantId ?? ('a_' + Date.now()), role: 'assistant', text: fullText, ts: Date.now() };
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setTurns((prev) => [...prev, asstTurn]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      // Speak the response
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setPhase('speaking');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      await speak(fullText);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    } catch (e) {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      const msg = e instanceof Error ? e.message : 'Failed';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      toast.error(msg);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    }
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  }, [conversationId, speak]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const { state: recState, level, start, stop } = useVoiceRecorder({
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    onTranscript: (text) => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setPhase('transcribing');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      sendToChat(text);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    },
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    onError: (msg) => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      toast.error(msg);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    },
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    silenceTimeoutMs: autoMode ? 1800 : undefined,
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  });
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const startListening = useCallback(async () => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    if (phaseRef.current !== 'idle') return;
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    setPhase('listening');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    await start();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  }, [start]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const stopAll = useCallback(() => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    stopTTS();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    stop();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  }, [stop, stopTTS]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  // Sync recorder state into our phase
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  useEffect(() => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    if (recState === 'recording' && phase === 'idle') setPhase('listening');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    if (recState === 'idle' && phase === 'listening') setPhase('idle');
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  }, [recState, phase]);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const orbColor =
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'listening' ? 'rgba(201, 168, 99, 0.6)' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'thinking' ? 'rgba(180, 180, 200, 0.5)' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'transcribing' ? 'rgba(201, 168, 99, 0.4)' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'speaking' ? 'rgba(228, 200, 138, 0.6)' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    'rgba(140, 140, 140, 0.3)';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const orbScale = 1 + (phase === 'listening' ? level * 0.6 : phase === 'speaking' ? 0.15 : 0);
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const phaseLabel =
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'idle' ? 'Tap to talk' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'listening' ? 'Listening...' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'transcribing' ? 'Transcribing...' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'thinking' ? 'Thinking...' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    phase === 'speaking' ? 'Speaking...' :
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    'Ready';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  const isActive = phase !== 'idle';
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  return (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    <div className="min-h-[calc(100vh-56px)] flex flex-col">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      {/* Header */}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      <div className="px-6 lg:px-10 pt-6 pb-2 flex items-center justify-between">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        <div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-0.5">Voice mode</div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          <h1 className="font-display text-[26px]">Conversation</h1>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        <button
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          type="button"
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          onClick={() => setAutoMode((v) => !v)}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          className={cn(
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            'h-7 px-3 rounded-full text-[11.5px] uppercase tracking-[0.1em] border transition',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            autoMode
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              ? 'bg-gold/15 border-gold/50 text-gold'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          )}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        >
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          {autoMode ? 'Auto-listen ON' : 'Auto-listen OFF'}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        </button>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      {/* Transcript area */}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-4">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        <div className="max-w-[680px] mx-auto space-y-4">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          {turns.length === 0 ? (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            <div className="text-center py-16">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <p className="text-[14px] text-fg-muted">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                Press the orb and talk to your assistant.<br />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                It listens, thinks, and speaks back.
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              </p>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          ) : (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            turns.map((t) => (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <div key={t.id} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                <div className={cn(
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                  'rounded-2xl px-4 py-2.5 max-w-[78%] text-[14px] leading-relaxed',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                  t.role === 'user'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                    ? 'bg-surface-3 text-fg'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                    : 'bg-gold/8 border border-gold/20 text-fg',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                )}>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                  {t.text}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'                </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            ))
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          )}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      {/* Orb / control */}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      <div className="pb-10 pt-4 flex flex-col items-center gap-5">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        <div className="relative">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          <button
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            type="button"
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            onClick={() => {
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              if (phase === 'idle') startListening();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              else stopAll();
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            }}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            className={cn(
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              'h-28 w-28 rounded-full transition-all flex items-center justify-center',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              isActive ? 'scale-105' : 'hover:scale-105',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            )}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            style={{
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              background: 'radial-gradient(circle at 30% 30%, ' + orbColor + ' 0%, rgba(11,11,12,0.95) 70%)',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              boxShadow: '0 0 80px ' + orbColor + ', inset 0 0 60px rgba(201, 168, 99, 0.15)',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              transform: 'scale(' + orbScale + ')',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              transition: 'transform 80ms linear, box-shadow 200ms ease',
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            }}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          >
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            {phase === 'thinking' || phase === 'transcribing' ? (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <Loader2 className="h-8 w-8 text-gold animate-spin" />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            ) : phase === 'speaking' ? (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <Volume2 className="h-9 w-9 text-gold" />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            ) : phase === 'listening' ? (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <Square className="h-7 w-7 text-gold" fill="currentColor" />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            ) : (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <Mic className="h-9 w-9 text-fg-muted" />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            )}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          </button>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        <div className="text-center">
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          <div className="text-[12.5px] uppercase tracking-[0.18em] text-fg-muted">{phaseLabel}</div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          {isActive && phase !== 'idle' && (
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            <button
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              type="button"
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              onClick={stopAll}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              className="mt-2 inline-flex items-center gap-1.5 text-[11.5px] text-fg-subtle hover:text-fg transition-colors"
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            >
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <X className="h-3 w-3" />
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'              <span>Stop</span>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'            </button>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'          )}
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'        </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'      </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'    </div>
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'  );
(phaseRef.current as string) === 'speaking' || (phaseRef.current as string) === 'idle'}
