'use client';
import { useState } from 'react';
import { FileText, FileIcon, Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';

export interface DocumentRow {
  id: string;
  title: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  chunk_count: number;
  extracted_text_preview: string | null;
  processing_error: string | null;
  created_at: string;
  processed_at: string | null;
}

interface Props {
  doc: DocumentRow;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentRow({ doc, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false);

  const statusChip = (() => {
    switch (doc.status) {
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-surface-3 border border-border text-fg-muted">
            <Loader2 className="h-3 w-3 animate-spin" /> Uploading
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-gold/10 border border-gold/30 text-gold">
            <Loader2 className="h-3 w-3 animate-spin" /> Indexing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-success/10 border border-success/30 text-success">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] bg-danger/10 border border-danger/30 text-danger">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        );
    }
  })();

  async function openFile() {
    const res = await fetch('/api/knowledge/signed-url?id=' + encodeURIComponent(doc.id));
    const data = await res.json();
    if (data.url) window.open(data.url, '_blank');
  }

  async function handleDelete() {
    if (!confirm('Delete ' + (doc.title || doc.original_name) + '?')) return;
    setDeleting(true);
    try { await onDelete(doc.id); } finally { setDeleting(false); }
  }

  const Icon = doc.mime_type === 'application/pdf' ? FileText : FileIcon;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-surface hover:border-border-strong transition-colors">
      <div className="h-10 w-10 rounded-md shrink-0 bg-surface-2 border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[14px] font-medium text-fg truncate">
            {doc.title || doc.original_name}
          </div>
          {statusChip}
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11.5px] text-fg-subtle">
          <span>{formatBytes(doc.size_bytes)}</span>
          <span>·</span>
          <span>{formatDate(doc.created_at)}</span>
          {doc.status === 'ready' && (
            <>
              <span>·</span>
              <span>{doc.chunk_count} chunks</span>
            </>
          )}
        </div>
        {doc.processing_error && (
          <div className="mt-1.5 text-[11.5px] text-danger line-clamp-1">{doc.processing_error}</div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={openFile}
          className="h-8 w-8 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center"
          aria-label="Open"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'h-8 w-8 rounded-md flex items-center justify-center',
            deleting ? 'text-fg-subtle' : 'text-fg-muted hover:text-danger hover:bg-danger/10',
          )}
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
