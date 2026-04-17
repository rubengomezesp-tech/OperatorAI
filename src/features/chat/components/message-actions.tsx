'use client';
import { useState } from 'react';
import { RotateCcw, Copy, Check, ThumbsUp, ThumbsDown, Heart, Flag, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SpeakButton } from '@/features/voice/components/speak-button';
import { useI18n } from '@/lib/i18n';

interface Props {
  content: string;
  messageId?: string;
  onRegenerate?: () => void;
  disabled?: boolean;
}

type Reaction = 'up' | 'down' | 'heart' | null;

export function MessageActions({ content, messageId, onRegenerate, disabled }: Props) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);

  function copy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  async function react(type: Reaction) {
    const next = reaction === type ? null : type;
    setReaction(next);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type: next ?? 'removed', content: content.substring(0, 500) }),
      });
    } catch {}
  }

  async function sendReport() {
    if (!reportText.trim()) return;
    setSending(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, type: 'report', content: content.substring(0, 500), comment: reportText.trim() }),
      });
      toast.success(locale === 'es' ? 'Reporte enviado' : 'Report sent');
      setShowReport(false);
      setReportText('');
    } catch {
      toast.error(locale === 'es' ? 'Error al enviar' : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
        <button type="button" onClick={copy} className="h-7 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 text-[11.5px] text-fg-muted hover:text-fg transition-colors flex items-center gap-1.5" aria-label="Copy">
          {copied ? <Check className="h-3 w-3 text-gold" /> : <Copy className="h-3 w-3" />}
          <span>{copied ? (locale === 'es' ? 'Copiado' : 'Copied') : (locale === 'es' ? 'Copiar' : 'Copy')}</span>
        </button>
        <div className="h-7 px-2 rounded-md border border-transparent hover:border-border hover:bg-surface-2 transition-colors flex items-center">
          <SpeakButton text={content} />
        </div>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => react('up')} className={cn('h-7 w-7 rounded-md border border-transparent flex items-center justify-center transition-all', reaction === 'up' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2')} aria-label="Good">
          <ThumbsUp className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => react('down')} className={cn('h-7 w-7 rounded-md border border-transparent flex items-center justify-center transition-all', reaction === 'down' ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2')} aria-label="Bad">
          <ThumbsDown className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => react('heart')} className={cn('h-7 w-7 rounded-md border border-transparent flex items-center justify-center transition-all', reaction === 'heart' ? 'bg-pink-500/15 border-pink-500/30 text-pink-400' : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2')} aria-label="Love">
          <Heart className={cn('h-3 w-3', reaction === 'heart' && 'fill-current')} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button type="button" onClick={() => setShowReport(!showReport)} className={cn('h-7 px-2 rounded-md border border-transparent text-[11.5px] transition-colors flex items-center gap-1.5', showReport ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2')} aria-label="Report">
          <Flag className="h-3 w-3" />
        </button>
        {onRegenerate && (
          <button type="button" onClick={onRegenerate} disabled={disabled} className={cn('h-7 px-2 rounded-md border border-transparent text-[11.5px] transition-colors flex items-center gap-1.5', disabled ? 'text-fg-subtle cursor-not-allowed' : 'text-fg-muted hover:text-fg hover:border-border hover:bg-surface-2')} aria-label="Regenerate">
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
      {showReport && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-orange-400 font-medium">{locale === 'es' ? 'Reportar un problema' : 'Report a problem'}</span>
            <button type="button" onClick={() => setShowReport(false)} className="text-fg-muted hover:text-fg"><X className="h-3.5 w-3.5" /></button>
          </div>
          <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder={locale === 'es' ? 'Describe el problema...' : 'Describe the issue...'} rows={2} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-orange-500/40 focus:ring-2 focus:ring-orange-500/10 resize-none" />
          <div className="flex justify-end">
            <button type="button" onClick={sendReport} disabled={!reportText.trim() || sending} className={cn('h-7 px-3 rounded-md text-[12px] font-medium flex items-center gap-1.5 transition-colors', reportText.trim() && !sending ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25' : 'bg-surface-2 text-fg-subtle border border-border cursor-not-allowed')}>
              <Send className="h-3 w-3" />
              <span>{sending ? '...' : (locale === 'es' ? 'Enviar' : 'Send')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
