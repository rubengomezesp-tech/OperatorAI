'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { BrandLogo } from '@/components/brand/brand-logo';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface PublicChatHandle {
  setInput: (text: string) => void;
  focus: () => void;
}

export const PublicChat = forwardRef<PublicChatHandle>((_props, ref) => {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockMsg, setBlockMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    setInput: (text: string) => {
      setInput(text);
      inputRef.current?.focus();
    },
    focus: () => inputRef.current?.focus(),
  }));

  // Cargar uso restante
  useEffect(() => {
    fetch('/api/public-chat')
      .then((r) => r.json())
      .then((d) => {
        setRemaining(d.remaining ?? 3);
        if ((d.remaining ?? 3) <= 0) {
          setBlocked(true);
          setBlockMsg(isEs
            ? 'Has usado tus 3 mensajes gratis. Crea cuenta para seguir hablando con Operator.'
            : 'You have used your 3 free messages. Sign up to keep talking with Operator.');
        }
      })
      .catch(() => setRemaining(3));
  }, [isEs]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || blocked) return;

    const newUserMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, newUserMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    // Añadir mensaje vacío de assistant que se va llenando
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/public-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, locale }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setBlocked(true);
        setBlockMsg(data.message ?? '');
        setMessages((prev) => prev.slice(0, -1)); // quitar el placeholder
        setStreaming(false);
        return;
      }

      if (!res.ok || !res.body) throw new Error('Bad response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const obj = JSON.parse(json);
            if (obj.delta) {
              acc += obj.delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: 'assistant', content: acc };
                return copy;
              });
            } else if (obj.done) {
              setRemaining(obj.remaining ?? 0);
              if ((obj.remaining ?? 0) <= 0) {
                setTimeout(() => {
                  setBlocked(true);
                  setBlockMsg(isEs
                    ? 'Has usado tus 3 mensajes gratis. Crea cuenta para seguir.'
                    : 'You have used your 3 free messages. Sign up to keep going.');
                }, 1500);
              }
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          content: isEs
            ? 'Vaya, algo ha fallado. Inténtalo de nuevo.'
            : 'Oops, something failed. Try again.',
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, blocked, locale, isEs]);

  return (
    <div className="relative">
      <div className="absolute -inset-6 bg-gradient-to-r from-gold/10 via-gold/[0.08] to-gold/10 blur-3xl rounded-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-gold/15 bg-surface-2/40 backdrop-blur-xl shadow-[0_30px_80px_rgb(0_0_0_/_0.4)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 h-11 border-b border-border/40 bg-bg/40">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="ml-2 text-[12px] text-fg-muted">Operator</span>
            <span className="h-1 w-1 rounded-full bg-fg-subtle" />
            <span className="text-[11px] text-gold-soft">
              {isEs ? 'Modo demo' : 'Demo mode'}
            </span>
          </div>
          {remaining !== null && !blocked && (
            <span className="text-[11px] text-fg-subtle">
              {isEs ? `${remaining} gratis restantes` : `${remaining} free left`}
            </span>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="px-5 sm:px-7 py-5 min-h-[280px] max-h-[420px] overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <BrandLogo slot="logo" size={28} />
              </div>
              <div className="flex-1 max-w-[90%]">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface-3/80 border border-border text-[14px] text-fg-soft leading-relaxed">
                  {isEs
                    ? '¿En qué puedo ayudarte hoy? Cuéntame de tu marca o tu próxima campaña.'
                    : 'How can I help you today? Tell me about your brand or your next campaign.'}
                </div>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}
            >
              {m.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <BrandLogo slot="logo" size={28} />
                </div>
              )}
              <div className={m.role === 'user' ? 'max-w-[85%]' : 'flex-1 max-w-[90%]'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'px-4 py-2.5 rounded-2xl rounded-br-sm bg-gold/10 border border-gold/20 text-fg text-[14px]'
                      : 'px-4 py-3 rounded-2xl rounded-bl-sm bg-surface-3/80 border border-border text-[14px] text-fg-soft leading-relaxed whitespace-pre-wrap'
                  }
                >
                  {m.content || (m.role === 'assistant' && streaming ? (
                    <span className="inline-flex gap-1 items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.15s' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" style={{ animationDelay: '0.3s' }} />
                    </span>
                  ) : '')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-border/40 bg-bg/30 p-3 relative">
          <div className="flex items-end gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={streaming || blocked}
              placeholder={
                blocked
                  ? (isEs ? 'Crea cuenta para seguir...' : 'Sign up to continue...')
                  : (isEs ? 'Pregúntale a Operator...' : 'Ask Operator...')
              }
              className="flex-1 h-11 bg-surface-2/60 border border-border rounded-lg px-4 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || streaming || blocked}
              className="h-11 w-11 rounded-lg gold-grad flex items-center justify-center text-bg disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              aria-label={isEs ? 'Enviar' : 'Send'}
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Overlay bloqueado */}
        <AnimatePresence>
          {blocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg/85 backdrop-blur-md flex items-center justify-center p-6 z-20"
            >
              <div className="text-center max-w-sm">
                <div className="h-14 w-14 rounded-full gold-grad mx-auto mb-5 flex items-center justify-center shadow-[0_0_30px_rgb(201_168_99_/_0.5)]">
                  <Lock className="h-5 w-5 text-bg" />
                </div>
                <h3 className="font-display text-[22px] mb-3 tracking-tight">
                  {isEs ? 'Sigue con tu Operator' : 'Continue with your Operator'}
                </h3>
                <p className="text-[14px] text-fg-muted mb-6 leading-relaxed">{blockMsg}</p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-lg gold-grad text-bg font-medium text-[14px] hover:scale-[1.02] transition-transform"
                >
                  {isEs ? 'Crear cuenta gratis' : 'Sign up free'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-[12px] text-fg-subtle">
                  {isEs ? '3 días gratis · Cancela cuando quieras' : '3 days free · Cancel anytime'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

PublicChat.displayName = 'PublicChat';
