'use client';

/**
 * 📅 CALENDAR EVENT CARD
 *
 * Renderizada inline cuando el agente propone crear un evento.
 */

import { useState } from 'react';
import { Calendar as CalendarIcon, Check, Pencil, X, Loader2, AlertCircle, MapPin, Users } from 'lucide-react';

interface Props {
  summary: string;
  description?: string;
  startDatetime: string; // ISO 8601
  endDatetime: string;   // ISO 8601
  attendees?: string[];
  location?: string;
  onConfirm: (overrides?: Partial<Props>) => Promise<void>;
  onCancel?: () => void;
}

type CardState = 'pending' | 'editing' | 'sending' | 'created' | 'cancelled' | 'error';

function fmtDate(iso: string, locale = 'es'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function isoToInput(iso: string): string {
  // Convert ISO to datetime-local format
  try {
    const d = new Date(iso);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export function CalendarEventCard({
  summary,
  description,
  startDatetime,
  endDatetime,
  attendees,
  location,
  onConfirm,
  onCancel,
}: Props) {
  const [state, setState] = useState<CardState>('pending');
  const [editSummary, setEditSummary] = useState(summary);
  const [editStart, setEditStart] = useState(isoToInput(startDatetime));
  const [editEnd, setEditEnd] = useState(isoToInput(endDatetime));
  const [editLocation, setEditLocation] = useState(location ?? '');
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setState('sending');
    setError(null);
    try {
      const overrides = state === 'editing'
        ? {
            summary: editSummary,
            startDatetime: new Date(editStart).toISOString(),
            endDatetime: new Date(editEnd).toISOString(),
            location: editLocation || undefined,
          }
        : undefined;
      await onConfirm(overrides);
      setState('created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create event');
      setState('error');
    }
  }

  if (state === 'created') {
    return (
      <div className="my-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-3 max-w-md">
        <div className="h-7 w-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-fg">Evento creado</div>
          <div className="text-[11.5px] text-fg-muted truncate">{summary} · {fmtDate(startDatetime)}</div>
        </div>
      </div>
    );
  }

  if (state === 'cancelled') {
    return (
      <div className="my-3 rounded-xl border border-border bg-surface-2 px-4 py-2.5 flex items-center gap-2 max-w-md opacity-60">
        <X className="h-3.5 w-3.5 text-fg-subtle" />
        <span className="text-[12.5px] text-fg-muted">Evento cancelado</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="my-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-[13px] text-red-300">No se pudo crear el evento</span>
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

  const isEditing = state === 'editing';
  const isSending = state === 'sending';

  return (
    <div className="my-3 rounded-xl border border-gold/20 bg-surface-2 overflow-hidden max-w-md">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-gold/5">
        <CalendarIcon className="h-3.5 w-3.5 text-gold" />
        <span className="text-[11.5px] uppercase tracking-[0.12em] text-gold font-medium">
          Calendar event
        </span>
        <span className="text-[11px] text-fg-subtle ml-auto">Listo para crear</span>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Título</div>
          {isEditing ? (
            <input
              type="text"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              disabled={isSending}
              className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12.5px]"
            />
          ) : (
            <div className="text-[13px] text-fg font-medium">{summary}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Inicio</div>
            {isEditing ? (
              <input
                type="datetime-local"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                disabled={isSending}
                className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12px]"
              />
            ) : (
              <div className="text-[13px] text-fg">{fmtDate(startDatetime)}</div>
            )}
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Fin</div>
            {isEditing ? (
              <input
                type="datetime-local"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                disabled={isSending}
                className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12px]"
              />
            ) : (
              <div className="text-[13px] text-fg">{fmtDate(endDatetime)}</div>
            )}
          </div>
        </div>

        {(location || isEditing) && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5" />
              Ubicación
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Opcional (link Meet, Zoom, dirección)"
                disabled={isSending}
                className="w-full h-8 px-2 rounded bg-bg border border-border focus:border-gold/40 outline-none text-[12px]"
              />
            ) : location ? (
              <div className="text-[12.5px] text-fg-muted">{location}</div>
            ) : null}
          </div>
        )}

        {attendees && attendees.length > 0 && !isEditing && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1 flex items-center gap-1">
              <Users className="h-2.5 w-2.5" />
              Invitados
            </div>
            <div className="text-[12px] text-fg-muted truncate">{attendees.join(', ')}</div>
          </div>
        )}

        {description && !isEditing && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle mb-1">Notas</div>
            <div className="text-[12px] text-fg-muted whitespace-pre-wrap leading-relaxed">{description}</div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-border flex items-center gap-2 bg-surface-2/50">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gold text-bg font-medium text-[12.5px] hover:brightness-110 transition-all disabled:opacity-50"
        >
          {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarIcon className="h-3 w-3" />}
          {isSending ? 'Creando...' : 'Crear evento'}
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
          onClick={() => { setState('cancelled'); onCancel?.(); }}
          disabled={isSending}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-fg-subtle hover:text-fg text-[12.5px] transition-colors ml-auto disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
