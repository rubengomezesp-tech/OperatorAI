'use client';

/**
 * AI Rewrite Modal
 *
 * Opens when user wants to rewrite a text layer with AI.
 * Shows 5 tone options. After selecting tone, calls /api/campaign/rewrite-text
 * which returns 3 variations from Claude. User picks one (or cancels).
 */

import { useState } from 'react';
import { Loader2, Sparkles, X, AlertTriangle } from 'lucide-react';
import type { VerticalSlug } from '@/features/campaign-brain/types';

interface AiRewriteModalProps {
  /** Original text being rewritten */
  originalText: string;
  /** What kind of text — affects length / format */
  kind: 'headline' | 'cta' | 'body';
  /** Vertical for vertical-aware voice */
  vertical?: VerticalSlug;
  /** Strategic angle of the variant (pain-point, luxury, etc) */
  angle?: string;
  /** Hook framework if available */
  framework?: string;
  /** Locale for output language */
  locale?: 'en' | 'es';
  onClose: () => void;
  onPick: (newText: string) => void;
}

interface ToneOption {
  id: 'urgent' | 'authority' | 'casual' | 'luxury' | 'curiosity';
  label: string;
  description: string;
}

const TONES: ToneOption[] = [
  {
    id: 'urgent',
    label: 'Urgent',
    description: 'Time-pressured, scarcity-driven.',
  },
  {
    id: 'authority',
    label: 'Authority',
    description: 'Expert voice, credibility-first.',
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Conversational, friendly.',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    description: 'Refined, restrained, confident.',
  },
  {
    id: 'curiosity',
    label: 'Curiosity',
    description: 'Opens a loop, makes them click.',
  },
];

export function AiRewriteModal({
  originalText,
  kind,
  vertical,
  angle,
  framework,
  locale = 'en',
  onClose,
  onPick,
}: AiRewriteModalProps) {
  const [selectedTone, setSelectedTone] = useState<ToneOption['id'] | null>(
    null,
  );
  const [variations, setVariations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRewrite(tone: ToneOption['id']) {
    setSelectedTone(tone);
    setLoading(true);
    setError(null);
    setVariations([]);
    try {
      const res = await fetch('/api/campaign/rewrite-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          originalText,
          kind,
          tone,
          vertical,
          angle,
          framework,
          locale,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Rewrite failed: ${res.status}`);
      }
      const body = await res.json();
      setVariations(body.variations ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-surface-2 border border-border rounded-lg shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[15px]">Rewrite with AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-3 text-fg-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Original text reminder */}
        <div className="px-4 py-3 border-b border-border bg-surface-3/30">
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">
            Original
          </div>
          <div className="text-[13px] text-fg italic">&ldquo;{originalText}&rdquo;</div>
        </div>

        {/* Tones */}
        {!loading && variations.length === 0 && (
          <div className="p-4 space-y-2">
            <div className="text-[11px] text-fg-muted mb-3">
              Pick a tone direction:
            </div>
            {TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => handleRewrite(tone.id)}
                className="w-full px-3 py-2.5 rounded-md bg-surface-3 hover:bg-surface-3/70 hover:border-gold/40 border border-border text-left transition-all"
              >
                <div className="text-[13px] text-fg font-medium">
                  {tone.label}
                </div>
                <div className="text-[11px] text-fg-muted">
                  {tone.description}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="p-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <div className="text-[12px] text-fg-muted">
              Claude is rewriting in {selectedTone} tone...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4">
            <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-[12px] text-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-3 text-[12px] text-fg-muted hover:text-fg underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Variations */}
        {!loading && variations.length > 0 && (
          <div className="p-4 space-y-2">
            <div className="text-[11px] text-fg-muted mb-3">
              Pick one (or change tone):
            </div>
            {variations.map((variation, i) => (
              <button
                key={i}
                onClick={() => onPick(variation)}
                className="w-full px-3 py-3 rounded-md bg-surface-3 hover:bg-gold/10 hover:border-gold/60 border border-border text-left transition-all"
              >
                <div className="text-[13px] text-fg leading-snug">
                  {variation}
                </div>
              </button>
            ))}

            <button
              onClick={() => {
                setVariations([]);
                setSelectedTone(null);
              }}
              className="w-full mt-3 px-3 py-2 rounded-md bg-surface-3/50 hover:bg-surface-3 text-fg-muted hover:text-fg text-[12px] border border-border"
            >
              Try a different tone
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
