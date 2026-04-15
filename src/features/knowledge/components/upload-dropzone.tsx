'use client';
import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ACCEPT = '.pdf,.docx,.txt,.md,.markdown,.csv,.json';
const MAX_SIZE = 25 * 1024 * 1024;

interface Props {
  onUploaded: () => void;
}

export function UploadDropzone({ onUploaded }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(0);

  const handleFiles = useCallback(async (files: File[]) => {
    const valid = files.filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(f.name + ': too large (max 25 MB)');
        return false;
      }
      return true;
    });
    if (valid.length === 0) return;

    setUploading((n) => n + valid.length);

    for (const file of valid) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/knowledge/upload', { method: 'POST', body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(file.name + ': ' + (body?.error ?? 'upload failed'));
        } else {
          toast.success(file.name + ' uploaded');
          // Fire processing (fire-and-forget, UI polls status)
          fetch('/api/knowledge/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: body.id }),
          }).catch(() => {});
        }
      } catch (e) {
        toast.error(file.name + ': ' + (e instanceof Error ? e.message : 'failed'));
      } finally {
        setUploading((n) => n - 1);
        onUploaded();
      }
    }
  }, [onUploaded]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'relative block rounded-xl border-2 border-dashed transition-all cursor-pointer',
        'px-6 py-12 text-center',
        dragOver
          ? 'border-gold bg-gold/5'
          : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
      )}
    >
      <input type="file" multiple accept={ACCEPT} onChange={onChange} className="sr-only" />
      <div className="flex flex-col items-center gap-3">
        {uploading > 0 ? (
          <>
            <Loader2 className="h-8 w-8 text-gold animate-spin" />
            <div className="text-[14px] text-fg">Uploading {uploading} file{uploading !== 1 ? 's' : ''}...</div>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-surface-3 border border-border flex items-center justify-center">
              <UploadCloud className="h-5 w-5 text-gold" />
            </div>
            <div>
              <div className="text-[14.5px] text-fg font-medium">
                Drop files here or <span className="text-gold">click to browse</span>
              </div>
              <div className="text-[12px] text-fg-muted mt-1.5">
                PDF, DOCX, TXT, MD, CSV, JSON · up to 25 MB each
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mt-1">
              <FileText className="h-3 w-3" />
              <span>Files are extracted, chunked, and indexed for semantic search.</span>
            </div>
          </>
        )}
      </div>
    </label>
  );
}
