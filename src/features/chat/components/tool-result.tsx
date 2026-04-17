'use client';
import { useState } from 'react';
import { Download, FileText, BookOpen, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';
import type { ToolPart } from '@/lib/chat/types';

/**
 * Renders an inline tool invocation inside an assistant message.
 * Four kinds: image, video, file_analysis, knowledge_search.
 */
export function ToolResult({ part }: { part: ToolPart }) {
  const kind = part.kind;

  if (part.status === 'running') {
    return <ToolRunningCard kind={kind} input={part.input} />;
  }
  if (part.status === 'failed') {
    return <ToolFailedCard kind={kind} error={part.error} />;
  }

  if (kind === 'image') {
    const urls = part.result?.urls ?? [];
    return (
      <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {urls.map((url, i) => (
          <ImageTile key={url + i} url={url} />
        ))}
      </div>
    );
  }

  if (kind === 'video') {
    const url = part.result?.videoUrl;
    const poster = part.result?.thumbnailUrl;
    if (!url) return null;
    return (
      <div className="my-3 rounded-lg border border-border overflow-hidden bg-surface-2 max-w-[520px]">
        <video
          src={url}
          poster={poster}
          controls
          playsInline
          className="w-full aspect-video bg-black"
        />
        <div className="flex items-center justify-between px-3 py-2 text-[11.5px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <Video className="h-3 w-3 text-gold" />
            Generated video
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-1 hover:text-gold transition-colors"
          >
            <Download className="h-3 w-3" />
            Download
          </a>
        </div>
      </div>
    );
  }

  if (kind === 'file_analysis') {
    const text = part.result?.text ?? '';
    return (
      <div className="my-3 rounded-lg border border-border bg-surface-2/60 p-3.5 max-w-[640px]">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-gold mb-1.5">
          <FileText className="h-3 w-3" />
          File analysis
        </div>
        <p className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{text}</p>
      </div>
    );
  }

  if (kind === 'knowledge_search') {
    const text = part.result?.text ?? '';
    const sources = part.result?.sources ?? [];
    return (
      <div className="my-3 rounded-lg border border-border bg-surface-2/60 p-3.5 max-w-[640px]">
        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-gold mb-1.5">
          <BookOpen className="h-3 w-3" />
          Knowledge base
        </div>
        <p className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{text}</p>
        {sources.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {sources.map((s) => (
              <span
                key={s.id}
                className="h-5 px-1.5 rounded bg-surface-3 border border-border text-[10.5px] text-fg-muted flex items-center"
              >
                {s.title}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

function ToolRunningCard({ kind, input }: { kind: ToolPart['kind']; input: Record<string, unknown> }) {
  const label =
    kind === 'image' ? 'Generating image'
    : kind === 'video' ? 'Rendering video'
    : kind === 'file_analysis' ? 'Analyzing file'
    : 'Searching knowledge base';
  const subtitle =
    kind === 'image' ? (typeof input.prompt === 'string' ? input.prompt : '')
    : kind === 'video' ? (typeof input.prompt === 'string' ? input.prompt : '')
    : kind === 'file_analysis' ? (typeof input.question === 'string' ? input.question : '')
    : (typeof input.query === 'string' ? input.query : '');

  const Icon =
    kind === 'image' ? ImageIcon
    : kind === 'video' ? Video
    : kind === 'file_analysis' ? FileText
    : BookOpen;

  return (
    <div className="my-3 inline-flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 px-3.5 py-2.5 max-w-full">
      <div className="h-7 w-7 rounded-md bg-gold/15 flex items-center justify-center shrink-0">
        <Icon className="h-3.5 w-3.5 text-gold" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[12.5px] text-fg">
          <Loader2 className="h-3 w-3 animate-spin text-gold" />
          <span>{label}…</span>
        </div>
        {subtitle && (
          <div className="text-[11.5px] text-fg-muted truncate max-w-[420px]">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

function ToolFailedCard({ kind, error }: { kind: ToolPart['kind']; error?: string }) {
  const label =
    kind === 'image' ? 'Image generation failed'
    : kind === 'video' ? 'Video generation failed'
    : kind === 'file_analysis' ? 'File analysis failed'
    : 'Knowledge search failed';
  return (
    <div className="my-3 inline-flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5">
      <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
      <div className="min-w-0">
        <div className="text-[12.5px] text-fg">{label}</div>
        {error && <div className="text-[11.5px] text-fg-muted mt-0.5">{error}</div>}
      </div>
    </div>
  );
}

function ImageTile({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative rounded-lg overflow-hidden border border-border bg-surface-2 group">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-fg-muted animate-spin" />
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        className="w-full h-auto block"
      />
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="absolute bottom-2 right-2 h-7 w-7 rounded-md bg-black/60 backdrop-blur text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
        aria-label="Download image"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
