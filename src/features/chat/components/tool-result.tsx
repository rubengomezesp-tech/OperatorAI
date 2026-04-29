'use client';
import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Send, Download, FileText, BookOpen, Image as ImageIcon, Video, Loader2, AlertCircle, X } from 'lucide-react';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search';
export type ToolStatus = 'running' | 'done' | 'failed';

export interface ToolPart {
  id: string;
  kind: ToolKind;
  status: ToolStatus;
  input: Record<string, unknown>;
  result?: {
    urls?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    sources?: Array<{ title: string; id: string }>;
  };
  error?: string;
  createdAt: string;
}

export function ToolResult({ part }: { part: ToolPart }) {
  if (part.status === 'running') {
    // Premium skeleton for image generation (no boring text — show the canvas forming)
    if (part.kind === 'image') {
      return <ImageGeneratingSkeleton aspectRatio={(part.input.aspect_ratio as string) || '1:1'} />;
    }
    return <ToolRunningCard kind={part.kind} input={part.input} />;
  }
  if (part.status === 'failed') return <ToolFailedCard kind={part.kind} error={part.error} />;

  if (part.kind === 'image') {
    const urls = part.result?.urls ?? [];
    return (
      <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {urls.map((url, i) => (
          <ImageTile key={url + i} url={url} />
        ))}
      </div>
    );
  }

  if (part.kind === 'video') {
    const url = part.result?.videoUrl;
    const poster = part.result?.thumbnailUrl;
    if (!url) return null;
    return (
      <div className="my-3 rounded-lg border border-border overflow-hidden bg-surface-2 max-w-[520px]">
        <video src={url} poster={poster ?? undefined} controls playsInline className="w-full aspect-video bg-black" />
        <div className="flex items-center justify-between px-3 py-2 text-[11.5px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><Video className="h-3 w-3 text-gold" />Generated video</span>
          <a href={url} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 hover:text-gold transition-colors">
            <Download className="h-3 w-3" />Download
          </a>
        </div>
      </div>
    );
  }

  if (part.kind === 'file_analysis') {
    return (
      <div className="my-3 rounded-lg border border-border bg-surface-2/60 p-3.5 max-w-[640px]">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-gold mb-1.5">
          <FileText className="h-3 w-3" />File analysis
        </div>
        <p className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{part.result?.text ?? ''}</p>
      </div>
    );
  }

  if (part.kind === 'knowledge_search') {
    const sources = part.result?.sources ?? [];
    return (
      <div className="my-3 rounded-lg border border-border bg-surface-2/60 p-3.5 max-w-[640px]">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-gold mb-1.5">
          <BookOpen className="h-3 w-3" />Knowledge base
        </div>
        <p className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{part.result?.text ?? ''}</p>
        {sources.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {sources.map((s) => (
              <span key={s.id} className="h-5 px-1.5 rounded bg-surface-3 border border-border text-[10.5px] text-fg-muted flex items-center">{s.title}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ToolRunningCard({ kind, input }: { kind: ToolKind; input: Record<string, unknown> }) {
  // Contextual labels — Operator-style, no generic "Generating..."
  const labels: Record<ToolKind, { label: string; sub: string }> = {
    image: { label: 'Componiendo visual', sub: 'Generating image' },
    video: { label: 'Renderizando vídeo', sub: 'Rendering video' },
    file_analysis: { label: 'Leyendo tu documento', sub: 'Analyzing file' },
    knowledge_search: { label: 'Buscando contexto', sub: 'Searching knowledge' },
  };
  const { label } = labels[kind] ?? { label: 'Procesando', sub: '' };
  const subtitle = (input.prompt ?? input.question ?? input.query ?? '') as string;

  return (
    <div className="my-3 inline-flex items-center gap-3 rounded-2xl glass-strong floating px-4 py-3 max-w-full overflow-hidden relative">
      {/* Animated gold dots */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
        <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
      </div>
      <div className="min-w-0 relative">
        <div className="text-[13px] text-fg font-medium relative inline-block">
          <span className="relative z-10">{label}</span>
          {/* Shimmer gold overlay */}
          <span
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/40 to-transparent bg-[length:200%_100%] animate-shimmer pointer-events-none"
            style={{ WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
          >
            {label}
          </span>
        </div>
        {subtitle && (
          <div className="text-[11.5px] text-fg-muted truncate max-w-[420px] mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolFailedCard({ kind, error }: { kind: ToolKind; error?: string }) {
  const label = kind === 'image' ? 'Image failed' : kind === 'video' ? 'Video failed' : kind === 'file_analysis' ? 'Analysis failed' : 'Search failed';
  return (
    <div className="my-3 inline-flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5">
      <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
      <div><div className="text-[12.5px] text-fg">{label}</div>{error && <div className="text-[11.5px] text-fg-muted mt-0.5">{error}</div>}</div>
    </div>
  );
}

function ImageGeneratingSkeleton({ aspectRatio }: { aspectRatio: string }) {
  // Aspect ratio → padding-bottom %
  const ratioMap: Record<string, string> = {
    '1:1': '100%',
    '16:9': '56.25%',
    '9:16': '177.78%',
    '4:5': '125%',
    '3:2': '66.67%',
  };
  const padBottom = ratioMap[aspectRatio] ?? '100%';
  
  return (
    <div className="my-3 max-w-[420px]">
      <div
        className="relative w-full rounded-2xl overflow-hidden glass-strong floating border border-gold/15"
        style={{ paddingBottom: padBottom }}
      >
        {/* Base shimmer layer — gold sweep */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface-3 to-surface-2" />
        
        {/* Diagonal shimmer animation */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/15 to-transparent bg-[length:200%_200%] animate-shimmer"
          style={{ backgroundPosition: '0% 0%' }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/40 animate-pulse-dot"
              style={{
                left: `${(i * 13 + 7) % 90 + 5}%`,
                top: `${(i * 19 + 11) % 80 + 10}%`,
                animationDelay: `${(i * 0.18) % 2}s`,
                animationDuration: `${1.2 + (i % 3) * 0.4}s`,
              }}
            />
          ))}
        </div>
        
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gold/10 blur-2xl animate-pulse-dot" />
        </div>
        
        {/* Status text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="text-[11.5px] text-fg-muted/80 font-medium tracking-wide uppercase">
            Componiendo visual
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageTile({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  
  return (
    <div className="relative rounded-2xl overflow-hidden glass-subtle group">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <Loader2 className="h-4 w-4 text-fg-muted animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        className="w-full h-auto block cursor-pointer"
        onClick={() => setEditOpen(true)}
      />
      
      {/* Static bottom bar with actions */}
      {loaded && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[12px] font-medium hover:bg-white/20 transition-colors"
          >
            <Pencil className="h-3 w-3" strokeWidth={2.5} />
            Editar
          </button>
<a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
      
      <ImageEditModal open={editOpen} onClose={() => setEditOpen(false)} imageUrl={url} />
    </div>
  );
}

function ImageEditModal({ open, onClose, imageUrl }: { open: boolean; onClose: () => void; imageUrl: string }) {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  function handleSubmit() {
    const text = prompt.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    
    // Build iteration message — references the previous image
    const iterationMessage = `Regenera la imagen con estos cambios: ${text}`;
    
    // Pre-fill the chat composer via window event + value injection
    if (typeof window !== 'undefined') {
      const composer = document.querySelector('textarea[data-composer]') as HTMLTextAreaElement | null;
      if (composer) {
        composer.value = iterationMessage;
        composer.focus();
        composer.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    setPrompt('');
    setSubmitting(false);
    onClose();
  }
  
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }
  
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg/80 backdrop-blur-md z-40 animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[92vw] max-w-3xl max-h-[92vh] flex flex-col rounded-3xl glass-strong floating-strong overflow-hidden">
          <Dialog.Title className="sr-only">Editar imagen</Dialog.Title>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5 text-gold" />
              <span className="text-[13px] font-medium text-fg">Editar imagen</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Image preview */}
          <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center bg-bg/40 min-h-0">
            <img
              src={imageUrl}
              alt=""
              className="max-w-full max-h-[55vh] rounded-2xl shadow-xl"
            />
          </div>
          
          {/* Prompt input */}
          <div className="p-4 border-t border-border/40">
            <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle mb-2">
              ¿Qué quieres cambiar?
            </div>
            <div className="flex items-end gap-2 rounded-2xl glass-subtle px-3 py-2 focus-within:ring-2 focus-within:ring-gold/30 transition-all">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ej: cambia el fondo a azul oscuro, añade más luz dramática..."
                rows={2}
                className="flex-1 bg-transparent resize-none outline-none text-[14.5px] text-fg placeholder:text-fg-subtle max-h-32"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim() || submitting}
                className="h-9 px-4 rounded-full gold-grad flex items-center gap-2 text-bg text-[13px] font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
                Regenerar
              </button>
            </div>
            <div className="text-[11px] text-fg-subtle mt-2">
              Se enviará al chat para iterar la imagen
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
