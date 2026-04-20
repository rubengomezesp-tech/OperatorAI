'use client';
import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ReferenceImage {
  url: string;
  path: string;
}

interface Props {
  value: ReferenceImage[];
  onChange: (next: ReferenceImage[]) => void;
  maxImages?: number;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE = 10 * 1024 * 1024;

export function ReferenceUploader({ value, onChange, maxImages = 10 }: Props) {
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error('Max ' + maxImages + ' reference images');
      return;
    }
    const toUpload = files.slice(0, remaining).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(f.name + ': too large (max 10 MB)');
        return false;
      }
      return true;
    });
    if (toUpload.length === 0) return;

    setUploading((n) => n + toUpload.length);

    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(body?.error ?? 'Upload failed');
        } else {
          onChange([...value, { url: body.url, path: body.path }]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }, [maxImages, value, onChange]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  }

  function removeAt(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  }

  const canAddMore = value.length < maxImages;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {value.map((img, i) => (
          <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-surface-2">
            <Image
              src={img.url}
              alt={'Reference ' + (i + 1)}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-md bg-bg/80 backdrop-blur-md border border-border text-fg-muted hover:text-danger hover:border-danger/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 left-1 h-5 px-1.5 rounded bg-bg/80 backdrop-blur-md border border-border text-[9.5px] uppercase tracking-[0.12em] text-fg-muted flex items-center">
              Ref {i + 1}
            </div>
          </div>
        ))}

        {canAddMore && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'relative aspect-square rounded-md border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5',
              dragOver
                ? 'border-gold bg-gold/5'
                : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
            )}
          >
            <input
              type="file"
              multiple
              accept={ACCEPT}
              onChange={onInputChange}
              className="sr-only"
            />
            {uploading > 0 ? (
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-gold" />
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-fg-muted">
                  Add
                </span>
              </>
            )}
          </label>
        )}

        {/* Pad empty slots up to maxImages for visual balance */}
        {Array.from({ length: Math.max(0, maxImages - value.length - (canAddMore ? 1 : 0)) }).map((_, i) => (
          <div key={'pad-' + i} className="aspect-square rounded-md border border-dashed border-border/40 bg-surface-2/30" />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-fg-subtle">
        <span>
          {value.length}/{maxImages} references · Flux 2 Pro uses them for style, subject, and composition.
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-fg-muted hover:text-fg"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
