'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Star, Trash2, Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ImageItem {
  id: string;
  prompt: string;
  enhanced_prompt: string | null;
  preset: string | null;
  aspect_ratio: string;
  is_starred: boolean;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  display_urls: string[];
  created_at: string;
  error_message: string | null;
}

interface Props {
  img: ImageItem;
  onStar: (id: string, starred: boolean) => void;
  onDelete: (id: string) => void;
}

export function ImageCard({ img, onStar, onDelete }: Props) {
  const url = img.display_urls[0];
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(img.enhanced_prompt || img.prompt);
    setCopiedPrompt(true);
    toast.success('Prompt copied');
    setTimeout(() => setCopiedPrompt(false), 1400);
  }

  async function download() {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'operator-' + img.id + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error('Download failed');
    }
  }

  const [w, h] = img.aspect_ratio.split(':').map(Number);
  const aspectCss = { aspectRatio: (w / h).toString() };

  return (
    <div className="group relative rounded-lg overflow-hidden border border-border bg-surface-2">
      <div className="relative w-full" style={aspectCss}>
        {img.status === 'complete' && url && (
          <Image
            src={url}
            alt={img.prompt.slice(0, 60)}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        )}
        {(img.status === 'pending' || img.status === 'processing') && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-2 shimmer">
            <div className="text-[11px] uppercase tracking-[0.16em] text-fg-muted">Generating...</div>
          </div>
        )}
        {img.status === 'failed' && (
          <div className="absolute inset-0 flex items-center justify-center bg-danger/5 border border-danger/20">
            <div className="text-center px-4">
              <div className="text-[11px] uppercase tracking-[0.16em] text-danger mb-1">Failed</div>
              <div className="text-[11.5px] text-fg-muted line-clamp-3">
                {img.error_message ?? 'Unknown error'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onStar(img.id, !img.is_starred)}
          className={cn(
            'h-8 w-8 rounded-md border flex items-center justify-center backdrop-blur-md',
            img.is_starred
              ? 'bg-gold/20 border-gold/50 text-gold'
              : 'bg-bg/70 border-border text-fg-muted hover:text-gold',
          )}
          aria-label="Star"
        >
          <Star className={cn('h-3.5 w-3.5', img.is_starred && 'fill-current')} />
        </button>
        <button
          type="button"
          onClick={download}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-fg flex items-center justify-center backdrop-blur-md"
          aria-label="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={copyPrompt}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-fg flex items-center justify-center backdrop-blur-md"
          aria-label="Copy prompt"
        >
          {copiedPrompt ? <Check className="h-3.5 w-3.5 text-gold" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(img.id)}
          className="h-8 w-8 rounded-md border border-border bg-bg/70 text-fg-muted hover:text-danger flex items-center justify-center backdrop-blur-md"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Permanent star indicator (bottom-left) */}
      {img.is_starred && (
        <div className="absolute top-2 left-2 h-6 px-1.5 rounded text-[10px] uppercase tracking-[0.12em] bg-gold/20 backdrop-blur-md border border-gold/30 text-gold flex items-center gap-1">
          <Star className="h-2.5 w-2.5 fill-current" />
          Starred
        </div>
      )}

      {/* Prompt preview footer */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[11.5px] text-fg-muted line-clamp-2 leading-snug">
          {img.prompt}
        </p>
      </div>
    </div>
  );
}
