'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

const previewCache = new Map<string, PreviewData | 'failed'>();

export function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<PreviewData | null>(() => {
    const cached = previewCache.get(url);
    if (cached && cached !== 'failed') return cached;
    return null;
  });
  const [loading, setLoading] = useState(!previewCache.has(url));
  const [failed, setFailed] = useState(previewCache.get(url) === 'failed');

  useEffect(() => {
    if (previewCache.has(url)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/link-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) throw new Error(`Preview ${res.status}`);
        const d = (await res.json()) as PreviewData;
        if (!d.title && !d.description && !d.image) throw new Error('Empty preview');
        if (!cancelled) {
          previewCache.set(url, d);
          setData(d);
        }
      } catch {
        if (!cancelled) {
          previewCache.set(url, 'failed');
          setFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [url]);

  // Failed → fallback to plain link
  if (failed) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-gold underline break-all text-[13px] inline-flex items-center gap-1">
        {url}
        <ExternalLink className="h-3 w-3 inline" />
      </a>
    );
  }

  // Loading skeleton
  if (loading || !data) {
    return (
      <div className="my-2 max-w-[420px] rounded-xl border border-border/60 bg-surface-2/40 overflow-hidden animate-pulse">
        <div className="h-32 bg-surface-3" />
        <div className="p-3 space-y-2">
          <div className="h-3 w-2/3 rounded bg-surface-3" />
          <div className="h-2 w-full rounded bg-surface-3" />
          <div className="h-2 w-1/2 rounded bg-surface-3" />
        </div>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'my-2 max-w-[420px] block rounded-xl overflow-hidden border border-border/60 bg-surface-2/40',
        'hover:border-gold/40 hover:bg-surface-2/60 transition-colors group',
      )}
    >
      {data.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt=""
          className="w-full h-32 object-cover"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
          {data.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.favicon} alt="" className="h-3 w-3 rounded" loading="lazy" />
          )}
          <span className="truncate">{data.siteName ?? new URL(url).hostname.replace(/^www\./, '')}</span>
        </div>
        {data.title && (
          <div className="text-[13px] font-semibold text-fg leading-snug line-clamp-2 group-hover:text-gold transition-colors">
            {data.title}
          </div>
        )}
        {data.description && (
          <div className="text-[12px] text-fg-muted leading-snug line-clamp-2">
            {data.description}
          </div>
        )}
      </div>
    </a>
  );
}
