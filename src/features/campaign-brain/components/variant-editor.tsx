'use client';

/**
 * Variant Editor Modal (EN-4)
 *
 * Premium agency-style image editor.
 * Layout:
 *   - Top bar: Back, title, Save
 *   - Left: image preview
 *   - Right: AI editor chat
 *   - Bottom: version history
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronLeft,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface VersionEntry {
  url: string;
  label: string;
  version: number;
  instruction?: string;
}

interface VariantEditorProps {
  draftId: string;
  variantId: string;
  initialImageUrl: string;
  briefHeadline?: string;
  briefAngle?: string;
  briefPlatform?: string;
  onClose: () => void;
  onSave: (newUrl: string) => void;
}

const SUGGESTIONS = [
  { en: 'Make it more cinematic', es: 'Mas cinematografico' },
  { en: 'Change background to sunset beach', es: 'Cambia fondo a playa al atardecer' },
  { en: 'Warmer color palette', es: 'Paleta de colores mas calida' },
  { en: 'Remove all text', es: 'Quita todo el texto' },
  { en: 'More dramatic lighting', es: 'Iluminacion mas dramatica' },
  { en: 'Studio white background', es: 'Fondo blanco de estudio' },
];

export function VariantEditor({
  draftId,
  variantId,
  initialImageUrl,
  briefHeadline,
  briefAngle,
  briefPlatform,
  onClose,
  onSave,
}: VariantEditorProps) {
  const { t, locale } = useI18n();
  const [versions, setVersions] = useState<VersionEntry[]>([
    { url: initialImageUrl, label: 'Original', version: 0 },
  ]);
  const [activeVersion, setActiveVersion] = useState(0);
  const [instruction, setInstruction] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentImage = versions[activeVersion]?.url ?? initialImageUrl;

  async function handleEdit() {
    if (!instruction.trim() || editing) return;
    setEditing(true);
    setError(null);
    try {
      const res = await fetch('/api/campaign/edit-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          draftId,
          variantId,
          currentImageUrl: currentImage,
          instruction: instruction.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Edit failed: ${res.status}`);
      }

      const body = await res.json();
      const newVersion: VersionEntry = {
        url: body.imageUrl,
        label: `v${versions.length}`,
        version: body.version ?? Date.now(),
        instruction: instruction.trim(),
      };
      setVersions((prev) => [...prev, newVersion]);
      setActiveVersion(versions.length); // jump to new version
      setInstruction('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEditing(false);
    }
  }

  function handleSave() {
    onSave(currentImage);
    onClose();
  }

  function pickSuggestion(s: { en: string; es: string }) {
    setInstruction(locale === 'es' ? s.es : s.en);
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-surface px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="h-8 w-8 rounded-md flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-2"
          aria-label="Close"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.16em] text-gold">
            {t('cb.editor.title')}
          </div>
          <div className="text-[13.5px] text-fg truncate">
            {briefHeadline ?? variantId}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {briefAngle && (
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10.5px] uppercase tracking-[0.12em] text-fg-muted">
              {briefAngle}
            </span>
          )}
          {briefPlatform && (
            <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10.5px] uppercase tracking-[0.12em] text-fg-muted">
              {briefPlatform}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 rounded-md bg-gold text-black text-[13px] font-medium hover:bg-gold/90 transition-all"
        >
          {t('cb.editor.save')}
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">
        {/* Image area */}
        <div className="relative bg-bg flex items-center justify-center p-6 overflow-auto">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt="variant"
              className="max-w-full max-h-full object-contain rounded-md shadow-2xl"
            />
          ) : (
            <div className="text-fg-subtle">{t('cb.editor.no_image')}</div>
          )}

          {editing && (
            <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto" />
                <p className="text-[12.5px] text-fg-muted">
                  {t('cb.editor.editing')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* AI editor panel */}
        <aside className="border-t lg:border-t-0 lg:border-l border-border bg-surface flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <h3 className="font-display text-[15px]">{t('cb.editor.ai_panel')}</h3>
            </div>
            <p className="text-[11.5px] text-fg-subtle mt-1">
              {t('cb.editor.ai_subtitle')}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggestions */}
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-2">
                {t('cb.editor.suggestions')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => {
                  const label = locale === 'es' ? s.es : s.en;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickSuggestion(s)}
                      className="px-2.5 py-1 rounded-md text-[11.5px] bg-surface-2 border border-border text-fg-muted hover:text-fg hover:border-fg-muted transition-all"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent edits log */}
            {versions.length > 1 && (
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-2">
                  {t('cb.editor.history')}
                </div>
                <div className="space-y-1.5">
                  {versions.slice(1).map((v, i) => (
                    <div
                      key={v.version}
                      className="text-[11.5px] text-fg-muted bg-surface-2 border border-border rounded px-2 py-1.5"
                    >
                      <span className="text-gold">{v.label}</span>
                      {v.instruction && ` · ${v.instruction}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 space-y-2">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                }
              }}
              placeholder={t('cb.editor.input_placeholder')}
              rows={3}
              disabled={editing}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 resize-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleEdit}
              disabled={!instruction.trim() || editing}
              className={[
                'w-full py-2 rounded-md text-[13px] font-medium flex items-center justify-center gap-1.5 transition-all',
                instruction.trim() && !editing
                  ? 'bg-gold text-black hover:bg-gold/90'
                  : 'bg-surface-2 text-fg-subtle cursor-not-allowed border border-border',
              ].join(' ')}
            >
              {editing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t('cb.editor.editing')}
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {t('cb.editor.send')}
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* Bottom: versions strip */}
      {versions.length > 1 && (
        <footer className="border-t border-border bg-surface px-4 py-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle whitespace-nowrap">
              {t('cb.editor.versions')}
            </span>
            {versions.map((v, i) => (
              <button
                key={v.version}
                type="button"
                onClick={() => setActiveVersion(i)}
                className={[
                  'h-14 w-14 shrink-0 rounded-md overflow-hidden border-2 transition-all',
                  i === activeVersion
                    ? 'border-gold'
                    : 'border-border hover:border-fg-muted',
                ].join(' ')}
                title={v.label}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.url}
                  alt={v.label}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
