'use client';

/**
 * GuestChat — Demo chat embedded in landing page.
 * - 3 messages free, no signup needed
 * - localStorage counter
 * - Calls /api/chat-guest (rate-limited backend)
 * - Premium glass UI
 * - Lock screen with CTAs when limit reached
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowUp, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const GUEST_LIMIT = 3;
const STORAGE_KEY = 'operator_guest_chat_count';
const SESSION_KEY = 'operator_guest_session_id';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const tx: Record<string, Record<string, string>> = {
  title: { en: 'Try Operator now', es: 'Prueba Operator ya' },
  subtitle: {
    en: 'No signup. 3 free messages. See what your AI operator does.',
    es: 'Sin cuenta. 3 mensajes gratis. Mira lo que hace tu operador AI.',
  },
  placeholder: {
    en: 'Ask Operator anything... e.g. "give me 3 hooks for a hotel campaign"',
    es: 'Pregúntale a Operator... ej: "dame 3 hooks para campaña de hotel"',
  },
  remaining: { en: 'messages left', es: 'mensajes restantes' },
  thinking: { en: 'Operator is thinking...', es: 'Operator está pensando...' },
  lock_title: { en: 'You saw what it can do.', es: 'Ya viste lo que puede hacer.' },
  lock_subtitle: {
    en: 'Now let it work for you. Create your account to continue — free for 7 days.',
    es: 'Ahora deja que trabaje para ti. Crea tu cuenta y continúa — 7 días gratis.',
  },
  lock_cta_primary: { en: 'Create my operator', es: 'Crear mi operador' },
  lock_cta_secondary: { en: "See what's included", es: 'Ver qué incluye' },
  err_generic: {
    en: 'Could not reach Operator. Try again.',
    es: 'No pudimos contactar Operator. Intenta de nuevo.',
  },
  err_limit: {
    en: 'Demo limit reached. Create an account to continue.',
    es: 'Límite demo alcanzado. Crea cuenta para continuar.',
  },
};

function genSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function trackEvent(name: string, props?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    interface PostHog { capture: (n: string, p?: Record<string, unknown>) => void }
    const ph = (window as unknown as { posthog?: PostHog }).posthog;
    if (ph) ph.capture(name, props);
  } catch {
    // silent
  }
}

export function GuestChat() {
  const { locale } = useI18n();
  const t = (k: string) => tx[k]?.[locale] ?? tx[k]?.en ?? k;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const sessionIdRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Init from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
      setCount(isNaN(savedCount) ? 0 : savedCount);
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = genSessionId();
        localStorage.setItem(SESSION_KEY, sid);
      }
      sessionIdRef.current = sid;
    } catch {
      sessionIdRef.current = genSessionId();
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const remaining = Math.max(0, GUEST_LIMIT - count);
  const isLocked = count >= GUEST_LIMIT;

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || isLocked) return;

    if (!hasStarted) {
      trackEvent('guest_chat_started');
      setHasStarted(true);
    }
    trackEvent('guest_message_sent', { msg_index: count });

    setError(null);
    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Optimistic counter increment
    const newCount = count + 1;
    setCount(newCount);
    try {
      localStorage.setItem(STORAGE_KEY, String(newCount));
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/chat-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          session_id: sessionIdRef.current,
        }),
      });

      if (res.status === 429) {
        setError(t('err_limit'));
        setMessages([...newMessages, { role: 'assistant', content: t('err_limit') }]);
        setLoading(false);
        return;
      }

      if (!res.ok || !res.body) {
        setError(t('err_generic'));
        setLoading(false);
        return;
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      // Add empty assistant message we'll fill
      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: assistantText };
                return next;
              });
            } else if (parsed.error) {
              setError(parsed.error);
            }
          } catch {
            // ignore partial JSON
          }
        }
      }
    } catch {
      setError(t('err_generic'));
    } finally {
      setLoading(false);
      if (newCount >= GUEST_LIMIT) {
        trackEvent('guest_limit_reached');
      }
    }
  }, [input, loading, isLocked, hasStarted, count, messages, t]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {t('title')}
        </div>
        <p className="text-[14px] text-fg-muted">{t('subtitle')}</p>
      </div>

      {/* Chat container */}
      <div className="relative rounded-2xl glass-strong floating overflow-hidden">
        {/* Messages area */}
        <div
          ref={scrollRef}
          className="min-h-[280px] max-h-[420px] overflow-y-auto px-5 py-5 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[240px]">
              <div className="text-center">
                <div className="h-10 w-10 rounded-md gold-grad flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-4 w-4 text-bg" />
                </div>
                <p className="text-[13px] text-fg-muted max-w-sm">
                  {locale === 'es'
                    ? 'Hazle una pregunta. Una idea. Un reto.'
                    : 'Ask a question. Drop an idea. Throw a challenge.'}
                </p>
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-[14.5px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gold/15 border border-gold/20 text-fg'
                        : 'bg-surface-2/60 border border-border text-fg'
                    }`}
                  >
                    {m.content || (loading && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1 items-center text-fg-muted text-[12px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot"
                          style={{ animationDelay: '0.2s' }}
                        />
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot"
                          style={{ animationDelay: '0.4s' }}
                        />
                      </span>
                    ) : null)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-border/50 px-3 py-3 bg-bg/40">
          <div className="flex items-end gap-2 rounded-2xl bg-surface-2/60 border border-border px-3 py-2 focus-within:border-gold/40 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('placeholder')}
              rows={1}
              disabled={isLocked || loading}
              className="flex-1 bg-transparent resize-none outline-none text-[15px] text-fg placeholder:text-fg-subtle disabled:opacity-50 max-h-24"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || loading || isLocked}
              className="h-8 w-8 flex-shrink-0 rounded-full gold-grad flex items-center justify-center hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Send"
            >
              <ArrowUp className="h-3.5 w-3.5 text-bg" strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-[11px] text-fg-subtle">
              {remaining} {t('remaining')}
            </span>
            {error && (
              <span className="text-[11px] text-red-400">{error}</span>
            )}
          </div>
        </div>

        {/* Lock overlay when limit reached */}
        {isLocked && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 backdrop-blur-md bg-bg/80 flex items-center justify-center p-6"
          >
            <div className="text-center max-w-sm">
              <div className="h-12 w-12 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-[26px] leading-tight tracking-tight mb-2">
                {t('lock_title')}
              </h3>
              <p className="text-[13.5px] text-fg-muted mb-5">
                {t('lock_subtitle')}
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/signup"
                  onClick={() => trackEvent('signup_clicked_from_guest_chat')}
                  className="flex items-center justify-center gap-2 h-11 rounded-md gold-grad text-bg font-medium text-[14px] hover:brightness-110 transition-all"
                >
                  {t('lock_cta_primary')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center h-11 rounded-md border border-border text-fg text-[13.5px] hover:border-gold/40 hover:text-gold transition-colors"
                >
                  {t('lock_cta_secondary')}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
