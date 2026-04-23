'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageIcon, Sparkles, ArrowRight } from 'lucide-react';

interface ImageRow {
  id: string;
  display_urls?: string[];
  output_urls?: string[];
  prompt?: string;
  created_at: string;
}

interface Props {
  locale: 'en' | 'es';
}

/**
 * Recent images on the dashboard.
 *
 * Uses the existing /api/images/list endpoint which already handles
 * signed URL generation for private storage. We do NOT duplicate that
 * logic server-side.
 *
 * Campaigns are intentionally omitted from the dashboard until the
 * campaigns table is present (see ROUTES_AUDIT.md section 9).
 */
export function DashboardRecentImages({ locale }: Props) {
  const es = locale === 'es';
  const [images, setImages] = useState<ImageRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/images/list')
      .then((res) => (res.ok ? res.json() : { images: [] }))
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.images) ? data.images.slice(0, 4) : [];
        setImages(list);
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-surface-2 border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/50 p-6 flex flex-col items-center text-center">
        <div className="h-10 w-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center mb-3">
          <ImageIcon className="h-4 w-4 text-fg-subtle" />
        </div>
        <div className="font-display text-[15px] mb-1">
          {es ? 'Sin imagenes todavia' : 'No images yet'}
        </div>
        <p className="text-[12px] text-fg-muted max-w-[320px] mb-4">
          {es
            ? 'Genera imagenes sueltas para redes, referencias o tests.'
            : 'Generate standalone images for social, references, or quick tests.'}
        </p>
        <Link
          href="/studio/image"
          className="h-9 px-4 rounded-lg bg-gold text-bg text-[12px] font-medium hover:brightness-110 transition-all flex items-center gap-1.5"
        >
          {es ? 'Generar imagen' : 'Generate image'}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((img) => {
        const url =
          (img.display_urls && img.display_urls[0]) ||
          (img.output_urls && img.output_urls[0]) ||
          null;
        return (
          <Link
            key={img.id}
            href="/studio/image"
            className="group rounded-lg overflow-hidden border border-border bg-surface-2 hover:border-gold/40 transition-colors"
          >
            <div className="aspect-square relative">
              {url ? (
                <img
                  src={url}
                  alt={img.prompt?.slice(0, 40) || ''}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-fg-subtle">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
