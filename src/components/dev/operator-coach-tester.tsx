'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Floating dev panel to test the local OperatorAI coach.
 *
 * Only renders in development mode. Calls /api/operator/coach with the
 * current user's session. Useful to compare responses against the main
 * chat (Claude/GPT) side by side.
 */

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    elapsedMs: number;
    usage: { prompt: number; completion: number; total: number };
    toolCall: { name: string; arguments: Record<string, unknown> } | null;
  };
}

export function OperatorCoachTester() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Healthcheck on mount
  useEffect(() => {
    fetch('/api/operator/coach')
      .then((r) => r.json())
      .then((d) => setAvailable(Boolean(d.coachAvailable)))
      .catch(() => setAvailable(false));
  }, []);

  // Autoscroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    const message = input.trim();
    if (!message || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/operator/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `❌ Error: ${data.error || 'desconocido'} — ${data.message || ''}`,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data.text,
          meta: {
            elapsedMs: data.data.elapsedMs,
            usage: data.data.usage,
            toolCall: data.data.toolCall,
          },
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Network error: ${error instanceof Error ? error.message : 'unknown'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Closed state — floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="OperatorAI Coach Tester (dev)"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          background: available === false ? '#7f1d1d' : '#0ea5e9',
          color: 'white',
          border: 'none',
          borderRadius: 999,
          padding: '12px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        🧠 Coach {available === false ? '(offline)' : ''}
      </button>
    );
  }

  // Open state — panel
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 420,
        height: 560,
        background: '#0a0a0a',
        border: '1px solid #1f2937',
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        fontFamily: 'system-ui, sans-serif',
        color: '#e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid #1f2937',
          background: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🧠</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>OperatorAI Coach</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>
              {available === null ? 'verificando...' : available ? 'qwen14b · local' : 'offline'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMessages([])}
            title="Limpiar"
            style={{
              background: 'transparent',
              border: '1px solid #374151',
              color: '#9ca3af',
              borderRadius: 6,
              padding: '4px 8px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
          <button
            onClick={() => setOpen(false)}
            title="Cerrar"
            style={{
              background: 'transparent',
              border: '1px solid #374151',
              color: '#9ca3af',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: '#020617',
        }}
      >
        {messages.length === 0 && (
          <div style={{ opacity: 0.5, fontSize: 12, textAlign: 'center', marginTop: 40 }}>
            Escribe un mensaje para probar a tu coach.
            <br />
            Llama a <code>/api/operator/coach</code> con tu sesión.
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: m.role === 'user' ? '#1e3a8a' : '#1f2937',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {m.content}
            {m.meta && (
              <div style={{ marginTop: 6, fontSize: 10, opacity: 0.55 }}>
                ⚡ {m.meta.elapsedMs}ms · {m.meta.usage.completion} tokens
                {m.meta.toolCall && (
                  <span style={{ color: '#fbbf24', marginLeft: 6 }}>
                    🔧 {m.meta.toolCall.name}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '8px 12px',
              background: '#1f2937',
              borderRadius: 10,
              fontSize: 12,
              opacity: 0.6,
            }}
          >
            pensando...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: '1px solid #1f2937', background: '#0f172a' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Pregunta a tu coach... (Enter para enviar)"
          rows={2}
          disabled={loading}
          style={{
            width: '100%',
            background: '#020617',
            border: '1px solid #1f2937',
            color: '#e5e7eb',
            borderRadius: 8,
            padding: 10,
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Wrapper that only renders in development mode.
 * Drop this anywhere in a layout — it will be invisible in production.
 */
export function OperatorCoachTesterDevOnly() {
  if (process.env.NODE_ENV !== 'development') return null;
  return <OperatorCoachTester />;
}
