'use client';

import { useState } from 'react';
import { X, Loader2, Wand2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditAdModalProps {
  imageUrl: string;
  onClose: () => void;
}

const QUICK_ACTIONS: Array<{ label: string; prompt: string }> = [
  { label: 'Más agresiva',  prompt: 'Hazla más agresiva, alto contraste, energía fuerte' },
  { label: 'Más minimal',   prompt: 'Hazla más minimalista, menos elementos, más espacio negativo' },
  { label: 'Más luxury',    prompt: 'Hazla más luxury, elegante, premium' },
  { label: 'CTA más fuerte',prompt: 'CTA más potente y directo, más visible' },
  { label: 'Centra todo',   prompt: 'Centra mejor la composición, simétrica' },
  { label: 'Story 9:16',    prompt: 'Conviértela en formato story vertical 9:16' },
  { label: 'Más texto',     prompt: 'Añade más texto descriptivo y un subheadline más claro' },
  { label: 'Menos texto',   prompt: 'Reduce el texto al mínimo, solo headline y CTA' },
];

async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/png';
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      resolve(dataUrl.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
  return { base64, mimeType };
}

export function EditAdModal({ imageUrl, onClose }: EditAdModalProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrls, setResultUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function submit(promptText: string) {
    const finalPrompt = promptText.trim();
    if (!finalPrompt) return;
    setLoading(true);
    setError(null);
    setResultUrls([]);

    try {
      const { base64, mimeType } = await urlToBase64(imageUrl);

      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: finalPrompt,
          images: [{ base64, mimeType }],
          enableAudit: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown');
        throw new Error(`Edit failed (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json() as {
        results?: Array<{ url?: string }>;
        variants?: Array<{ url: string }>;
      };
      const main = (data.results ?? []).map((r) => r.url).filter(Boolean) as string[];
      const variants = (data.variants ?? []).map((v) => v.url).filter(Boolean);
      const all = [...main, ...variants];
      if (all.length === 0) throw new Error('No images returned');
      setResultUrls(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Edit failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] bg-bg/95 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-surface border border-border rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-surface-2 border border-border flex items-center justify-center text-fg-muted hover:text-fg z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-semibold">Editar anuncio</h2>
          </div>

          {/* Original image preview */}
          <div className="rounded-xl overflow-hidden border border-border bg-surface-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Original" className="w-full max-h-[300px] object-contain" />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                type="button"
                onClick={() => submit(qa.prompt)}
                disabled={loading}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[12px] border transition-colors',
                  'bg-surface-2 border-border text-fg-muted hover:border-gold/40 hover:text-fg',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* Free-text input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && text.trim()) {
                  submit(text);
                }
              }}
              placeholder="Describir ediciones..."
              disabled={loading}
              className="flex-1 h-11 px-4 rounded-lg bg-surface-2 border border-border text-fg text-[14px] outline-none focus:border-gold/40 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => submit(text)}
              disabled={loading || !text.trim()}
              className={cn(
                'h-11 px-5 rounded-lg bg-gold text-black font-semibold text-[13px] flex items-center gap-2',
                'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              <span>Generar</span>
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-fg-muted text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generando edición... (15-30s)</span>
            </div>
          )}

          {/* Results */}
          {resultUrls.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[13px] font-medium text-fg-muted">Resultado:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resultUrls.map((url) => (
                  <div key={url} className="relative group rounded-xl overflow-hidden border border-border bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full object-cover" loading="lazy" />
                    <a
                      href={url}
                      download
                      className="absolute bottom-2 right-2 h-8 px-3 rounded-md bg-bg/80 border border-border text-[12px] text-fg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="h-3 w-3" />
                      <span>Save</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
