'use client';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UploadDropzone } from './upload-dropzone';
import { DocumentRow, type DocumentRow as DocType } from './document-row';
import { useI18n } from '@/lib/i18n';

export function KnowledgeView() {
  const { t } = useI18n();
  const [docs, setDocs] = useState<DocType[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/list');
      const data = await res.json();
      setDocs(data.documents ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const inProgress = docs.some((d) => d.status === 'uploading' || d.status === 'processing');
    if (!inProgress) return;
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, [docs, refresh]);

  async function onDelete(id: string) {
    const res = await fetch('/api/knowledge/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body?.error ?? t('kb.delete_failed'));
      return;
    }
    toast.success(t('kb.deleted'));
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={refresh} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[18px]">{t('kb.documents')}</h2>
          <span className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            {docs.length} {docs.length === 1 ? t('kb.file_one') : t('kb.file_many')}
          </span>
        </div>
        {loading && (
          <div className="text-[13px] text-fg-muted py-6 text-center">{t('kb.loading')}</div>
        )}
        {!loading && docs.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-10 text-center">
            <p className="text-[13.5px] text-fg-muted">
              {t('kb.empty')}
            </p>
          </div>
        )}
        {!loading && docs.length > 0 && (
          <div className="space-y-2">
            {docs.map((d) => (
              <DocumentRow key={d.id} doc={d} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
