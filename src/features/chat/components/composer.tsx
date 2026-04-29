'use client';
import { AgentPicker } from '@/features/agents/components/agent-picker';
import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { ArrowUp, Square, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { MicButton } from '@/features/voice/components/mic-button';

interface Attachment {
  file: File;
  preview: string | null;
  base64: string;
  mimeType: string;
}

interface Props {
  onSend: (text: string, attachment?: { base64: string; mimeType: string; fileName: string }) => void;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Composer({ onSend, onCancel, loading, disabled }: Props) {
  const { locale } = useI18n();
  const [value, setValue] = useState('');
  const [agentType, setAgentType] = useState<'creative' | 'brand' | 'copy' | 'research' | 'analyst' | 'social'>('creative');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + 'px';
  }, [value]);

  function handle() {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || loading || disabled) return;
    const msg = trimmed || (attachments.length > 0 ? 'Analyze this file' : '');
    const firstAtt = attachments.length > 0 ? {
        base64: attachments[0].base64,
        mimeType: attachments[0].mimeType,
        fileName: attachments[0].file.name,
      } : undefined;
    // Store all image previews for display
    if (attachments.length > 0) {
      (window as any).__pendingAttachmentUrls = attachments
        .filter(a => a.mimeType.startsWith('image/'))
        .map(a => 'data:' + a.mimeType + ';base64,' + a.base64);
    }
    onSend(msg, firstAtt);
    setValue('');
    setAttachments([]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle();
    }
  }

  function handleTranscript(text: string) {
    setValue((prev) => (prev ? prev + ' ' + text : text));
    setTimeout(() => ref.current?.focus(), 0);
  }

  async function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = 10 - attachments.length;
    const toProcess = Array.from(files).slice(0, remaining);
    for (const file of toProcess) {

    if (file.size > 20 * 1024 * 1024) continue;

    const base64 = await fileToBase64(file);
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : null;

    setAttachments(prev => [...prev, { file, preview, base64, mimeType: file.type }]);
    }

    if (fileRef.current) fileRef.current.value = '';
  }

  function removeAttachment(index: number) {
    setAttachments(prev => {
      const item = prev[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="border-t border-border glass">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <AgentPicker value={agentType} onChange={setAgentType} />
        </div>

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-border bg-surface-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative shrink-0 group">
                {att.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={att.preview} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-surface-3 flex items-center justify-center text-[10px] text-fg-muted uppercase">
                    {att.file.name.split('.').pop()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-bg border border-border text-fg-muted hover:text-fg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            <div className="shrink-0 flex items-center text-[10px] text-fg-subtle px-2">
              {attachments.length}/10
            </div>
          </div>
        )}

        <div className={cn(
          'relative flex items-end gap-2 rounded-xl border border-border bg-surface-2',
          'focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15 transition-colors',
        )}>
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={locale === "es" ? "Escribe tu idea, sube imagenes, pide lo que necesites..." : "Type your idea, upload images, ask for anything..."}
            rows={2}
            disabled={disabled}
            className={cn(
              'flex-1 bg-transparent resize-none border-0 focus:outline-none',
              'px-4 py-3.5 text-[14.5px] text-fg placeholder:text-fg-subtle',
              'min-h-[52px] max-h-[300px]',
            )}
          />
          <div className="p-1.5 flex items-center gap-1.5">
            {/* File/image attachment button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled || loading || attachments.length >= 10}
              className={cn(
                'h-9 w-9 rounded-md flex items-center justify-center transition-colors',
                attachments.length > 0
                  ? 'bg-gold/15 text-gold'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-3',
                (disabled || loading) && 'opacity-40 cursor-not-allowed',
              )}
              aria-label="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.xls,.json,.txt,.doc,.docx" multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            <MicButton onTranscript={handleTranscript} disabled={disabled || loading} size="md" />

            {loading ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 w-9 rounded-md bg-surface-3 text-fg border border-border hover:border-border-strong flex items-center justify-center"
                aria-label="Stop"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handle}
                disabled={(!value.trim() && attachments.length === 0) || disabled}
                className={cn(
                  'h-9 w-9 rounded-md flex items-center justify-center transition-all',
                  (value.trim() || attachments.length > 0) && !disabled
                    ? 'gold-grad text-bg shadow-[0_6px_20px_-6px_rgb(201_168_99_/_0.5)] hover:brightness-110 active:scale-[.98]'
                    : 'bg-surface-3 text-fg-subtle cursor-not-allowed',
                )}
                aria-label="Send"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle text-center">
Operator AI — Enter to send, Shift+Enter for new line        </div>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:mime;base64, prefix
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
