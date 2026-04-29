'use client';
import { useState } from 'react';
import { Download, FileText, BookOpen, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';

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
  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-surface-2 group">
      {!loaded && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-4 w-4 text-fg-muted animate-spin" /></div>}
      <img src={url} alt="" onLoad={() => setLoaded(true)} className="w-full h-auto block" />
      <a href={url} target="_blank" rel="noopener noreferrer" download className="absolute bottom-2 right-2 h-7 w-7 rounded-md bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80">
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
