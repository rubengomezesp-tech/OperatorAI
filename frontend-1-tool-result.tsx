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
  if (part.status === 'running') return <ToolRunningCard kind={part.kind} input={part.input} />;
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
  const label = kind === 'image' ? '🎨 Generating image' : kind === 'video' ? '🎬 Rendering video' : kind === 'file_analysis' ? '📊 Analyzing file' : '📚 Searching knowledge';
  const subtitle = (input.prompt ?? input.question ?? input.query ?? '') as string;

  return (
    <div className="my-3 inline-flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 px-3.5 py-2.5 max-w-full">
      <Loader2 className="h-4 w-4 animate-spin text-gold shrink-0" />
      <div className="min-w-0">
        <div className="text-[12.5px] text-fg">{label}…</div>
        {subtitle && <div className="text-[11.5px] text-fg-muted truncate max-w-[420px]">{subtitle}</div>}
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
