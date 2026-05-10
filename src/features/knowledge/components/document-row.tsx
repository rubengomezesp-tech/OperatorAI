'use client';
import { useState } from 'react';
import { FileText, FileIcon, Loader2, CheckCircle2, AlertCircle, Trash2, ExternalLink, ChevronDown } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import {
  KNOWLEDGE_CATEGORIES,
  getCategoryMeta,
  type DocumentCategory,
} from '@/lib/knowledge/categories';

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
  category?: DocumentCategory;
  subcategory?: string | null;
  is_brand_asset?: boolean;
  importance?: number;
}

interface Props {
  doc: DocumentRow;
  onDelete: (id: string) => Promise<void>;
  onUpdateCategory?: (id: string, category: DocumentCategory) => void;
}

export function DocumentRow({ doc, onDelete, onUpdateCategory }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const category = (doc.category ?? 'other') as DocumentCategory;
  const catMeta = getCategoryMeta(category);
  const CatIcon = catMeta.icon;

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

  function handleCategoryChange(newCat: DocumentCategory) {
    setCategoryMenuOpen(false);
    if (newCat !== category && onUpdateCategory) {
      onUpdateCategory(doc.id, newCat);
    }
  }

  const Icon = doc.mime_type === 'application/pdf' ? FileText : FileIcon;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-lg border border-border bg-surface hover:border-border-strong transition-colors">
      {/* File icon */}
      <div className="h-10 w-10 rounded-md shrink-0 bg-surface-2 border border-border flex items-center justify-center">
        <Icon className="h-4 w-4 text-gold" />
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[14px] font-medium text-fg truncate">
            {doc.title || doc.original_name}
          </div>
          {doc.is_brand_asset && (
            <span className="inline-flex items-center px-1.5 h-4 rounded text-[9.5px] uppercase tracking-[0.1em] bg-gold/10 border border-gold/30 text-gold shrink-0">
              brand
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11.5px] text-fg-muted">
          <span>{formatDate(doc.created_at)}</span>
          <span>·</span>
          <span>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
          {doc.chunk_count > 0 && (
            <>
              <span>·</span>
              <span>{doc.chunk_count} chunks</span>
            </>
          )}
          {doc.subcategory && (
            <>
              <span>·</span>
              <span className="text-fg-subtle italic">{doc.subcategory}</span>
            </>
          )}
        </div>
      </div>

      {/* Category badge / dropdown */}
      {onUpdateCategory && (
        <div className="relative shrink-0">
          <button
            onClick={() => setCategoryMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[11.5px] bg-surface-2 border border-border hover:border-border-strong transition-colors"
          >
            <CatIcon className="h-3 w-3" style={{ color: catMeta.color }} />
            <span className="text-fg-soft">{catMeta.name}</span>
            <ChevronDown className="h-3 w-3 text-fg-muted" />
          </button>

          {categoryMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setCategoryMenuOpen(false)}
              />
              <div className="absolute right-0 top-9 z-50 w-44 py-1 rounded-lg border border-border bg-surface shadow-2xl">
                {KNOWLEDGE_CATEGORIES.map((c) => {
                  const I = c.icon;
                  const isActive = c.id === category;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleCategoryChange(c.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left text-[12.5px] transition-colors',
                        isActive ? 'bg-gold/10 text-gold' : 'hover:bg-surface-2 text-fg-soft'
                      )}
                    >
                      <I className="h-3.5 w-3.5" style={{ color: isActive ? undefined : c.color }} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Status chip */}
      <div className="shrink-0">{statusChip}</div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={openFile}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-fg-muted hover:bg-surface-2 hover:text-fg-soft transition-colors"
          title="Open"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-8 w-8 inline-flex items-center justify-center rounded text-fg-muted hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50"
          title="Delete"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
