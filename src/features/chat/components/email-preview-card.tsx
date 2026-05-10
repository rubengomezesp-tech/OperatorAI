'use client';

/**
 * 📧 EMAIL PREVIEW CARD
 *
 * Renderizada inline en el chat cuando el agente propone enviar un email.
 * NO es modal. NO bloquea. Es un mensaje más con botones de acción.
 *
 * Estados:
 *   pending — preview con [Enviar][Editar][Cancelar]
 *   sending — loading state mientras envía
 *   sent    — confirmación con timestamp + opción undo (5s)
 *   cancelled — collapsed con "Cancelado"
 *   error   — mensaje de error + retry
 */

import { useState } from 'react';
import { Mail, Send, Pencil, X, Check, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  to: string;
  subject: string;
  body: string;
  /** Send callback — llamará al endpoint que invoque gmail_send_email */
  onSend: (overrides?: { to?: string; subject?: string; body?: string }) => Promise<void>;
  /** Cancel callback — opcional, default colapsa la card */
  onCancel?: () => void;
}

type CardState = 'pending' | 'editing' | 'sending' | 'sent' | 'cancelled' | 'error';

export function EmailPreviewCard({ to, subject, body, onSend, onCancel }: Props) {
  const [state, setState] = useState<CardState>('pending');
  const [editTo, setEditTo] = useState(to);
  const [editSubject, setEditSubject] = useState(subject);
  const [editBody, setEditBody] = useState(body);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setState('sending');
    setError(null);
    try {
      await onSend(
        state === 'editing'
          ? { to: editTo, subject: editSubject, body: editBody }
          : undefined,
      );
      setState('sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
      setState('error');
    }
  }

  function handleCancel() {
    setState('cancelled');
    onCancel?.();
  }

  // ─── SENT STATE ───
  if (state === 'sent') {
    return (
      <div className="my-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-3 max-w-md">
        <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-fg">Email enviado</div>
          <div className="text-[11.5px] text-fg-muted truncate">a {to}</div>
        </div>
      </div>
    );
  }

  // ─── CANCELLED STATE ───
  if (state === 'cancelled') {
    return (
      <div className="my-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 flex items-center gap-2 max-w-md opacity-60">
        <X className="h-3.5 w-3.5 text-fg-subtle" />
        <span className="text-[12.5px] text-fg-muted">Email cancelado</span>
      </div>
    );
  }

  // ─── ERROR STATE ───
  if (state === 'error') {
    return (
      <div className="my-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-[13px] text-red-300">No se pudo enviar</span>
        </div>
        <p className="text-[12px] text-fg-muted mb-3">{error}</p>
        <button
          type="button"
          onClick={() => setState('pending')}
          className="text-[12px] text-gold hover:underline"
        >
          Reintentar →
        </button>
      </div>
    );
  }

  // ─── PENDING / EDITING / SENDING (interactive states) ───
  const isEditing = state === 'editing';
  const isSending = state === 'sending';
  const displayTo = isEditing ? editTo : to;
  const displaySubject = isEditing ? editSubject : subject;
  const displayBody = isEditing ? editBody : body;

  return (
    <div className="my-3 rounded-xl border border-gold/20 bg-surface-2 overflow-hidden max-w-md">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-gold/5">
        <Mail className="h-3.5 w-3.5 text-gold" />
        <span className="text-[11.5px] uppercase tracking-[0.12em] text-gold font-medium">
          Email
        </span>
        <span className="text-[11px] text-fg-subtle ml-auto">Listo para enviar</span>
      </div>

      {/* Fields */}
      <div className="px-4 py-3 space-y-2.5">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Para</div>
          {isEditing ? (
            <input
              type="email"
              value={editTo}
              onChange={(e) => setEditTo(e.target.value)}
              disabled={isSending}
              className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12.5px]"
            />
          ) : (
            <div className="text-[13px] text-fg">{displayTo}</div>
          )}
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Asunto</div>
          {isEditing ? (
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              disabled={isSending}
              className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12.5px]"
            />
          ) : (
            <div className="text-[13px] text-fg font-medium">{displaySubject}</div>
          )}
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Cuerpo</div>
          {isEditing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              disabled={isSending}
              rows={6}
              className="w-full px-2 py-1.5 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12.5px] resize-none"
            />
          ) : (
            <div className="text-[12.5px] text-fg-muted whitespace-pre-wrap leading-relaxed">
              {displayBody}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 bg-surface-2/50">
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gold text-bg font-medium text-[12.5px] hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          {isSending ? 'Enviando...' : 'Enviar'}
        </button>
        {!isEditing && !isSending && (
          <button
            type="button"
            onClick={() => setState('editing')}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border hover:border-fg-muted text-fg-muted text-[12.5px] transition-all"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
        )}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-fg-subtle hover:text-fg text-[12.5px] transition-colors ml-auto disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
