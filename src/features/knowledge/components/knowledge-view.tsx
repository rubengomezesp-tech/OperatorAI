'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { UploadDropzone } from './upload-dropzone';
import { DocumentRow, type DocumentRow as DocType } from './document-row';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  KNOWLEDGE_CATEGORIES,
  ALL_CATEGORY_IDS,
  getCategoryMeta,
  type DocumentCategory,
} from '@/lib/knowledge/categories';
import { Sparkles } from 'lucide-react';

type DocumentWithCategory = DocType & {
  category?: DocumentCategory;
  subcategory?: string | null;
  is_brand_asset?: boolean;
  importance?: number;
};

export function KnowledgeView() {
  const { t, locale } = useI18n();
  const [docs, setDocs] = useState<DocumentWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<DocumentCategory | 'all'>('all');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setDocs(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Polling while uploads in progress
  useEffect(() => {
    const inProgress = docs.some((d) => d.status === 'uploading' || d.status === 'processing');
    if (!inProgress) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [docs, refresh]);

  // ─── Counters by category ──────────────────────────────────
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: docs.length };
    for (const cat of ALL_CATEGORY_IDS) c[cat] = 0;
    for (const doc of docs) {
      const cat = (doc.category ?? 'other') as DocumentCategory;
      c[cat] = (c[cat] ?? 0) + 1;
    }
    return c;
  }, [docs]);

  // ─── Filtered docs ─────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    if (activeFilter === 'all') return docs;
    return docs.filter((d) => (d.category ?? 'other') === activeFilter);
  }, [docs, activeFilter]);

  async function onDelete(id: string) {
    const res = await fetch('/api/knowledge/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error ?? t('failed'));
      return;
    }
    toast.success(t('deleted'));
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function onUpdateCategory(id: string, category: DocumentCategory) {
    // Optimistic update
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, category } : d)));
    try {
      await fetch('/api/knowledge/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, category }),
      });
    } catch {
      // Revert on error
      refresh();
    }
  }

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={refresh} />

      {/* ─── Sidebar + Documents Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* CATEGORIES SIDEBAR */}
        <aside className="space-y-1.5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle px-3 py-2">
            {locale === 'es' ? 'Categorías' : 'Categories'}
          </div>

          {/* All */}
          <button
            onClick={() => setActiveFilter('all')}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors',
              activeFilter === 'all'
                ? 'bg-gold/15 border border-gold/40 text-gold'
                : 'hover:bg-surface-2/60 border border-transparent text-fg-soft'
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[13px] font-medium truncate">
                {locale === 'es' ? 'Todos' : 'All'}
              </span>
            </div>
            <span className="text-[11px] tabular-nums text-fg-subtle">
              {counts.all ?? 0}
            </span>
          </button>

          {/* Per-category */}
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = counts[cat.id] ?? 0;
            const isActive = activeFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors',
                  isActive
                    ? 'bg-gold/15 border border-gold/40 text-gold'
                    : 'hover:bg-surface-2/60 border border-transparent text-fg-soft'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? undefined : cat.color }} />
                  <span className="text-[13px] font-medium truncate">
                    {locale === 'es' ? cat.nameEs : cat.name}
                  </span>
                </div>
                <span className="text-[11px] tabular-nums text-fg-subtle">{count}</span>
              </button>
            );
          })}

          {/* Hint about active category */}
          {activeFilter !== 'all' && (
            <div className="mt-3 px-3 py-3 rounded-lg bg-surface-2/40 border border-border">
              <p className="text-[11.5px] text-fg-muted leading-relaxed">
                {locale === 'es'
                  ? getCategoryMeta(activeFilter).hintEs
                  : getCategoryMeta(activeFilter).hint}
              </p>
            </div>
          )}
        </aside>

        {/* DOCUMENTS LIST */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-[18px]">
              {activeFilter === 'all'
                ? t('kb.documents')
                : locale === 'es'
                  ? getCategoryMeta(activeFilter).nameEs
                  : getCategoryMeta(activeFilter).name}
            </h2>
            <span className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
              {filteredDocs.length} {filteredDocs.length === 1 ? t('kb.file_one') : t('kb.file_many')}
            </span>
          </div>

          {loading && (
            <div className="text-[13px] text-fg-muted py-6 text-center">{t('loading')}</div>
          )}

          {!loading && filteredDocs.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-10 px-4 text-center">
              <p className="text-[13.5px] text-fg-muted">
                {activeFilter === 'all'
                  ? t('kb.empty')
                  : locale === 'es'
                    ? `Sin documentos en ${getCategoryMeta(activeFilter).nameEs.toLowerCase()}`
                    : `No documents in ${getCategoryMeta(activeFilter).name.toLowerCase()}`}
              </p>
            </div>
          )}

          {!loading && filteredDocs.length > 0 && (
            <div className="space-y-2">
              {filteredDocs.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  onDelete={onDelete}
                  onUpdateCategory={onUpdateCategory}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
