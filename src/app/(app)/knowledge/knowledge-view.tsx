'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Upload, Trash2, Loader2, Search, Play,
  File, FileJson, FileSpreadsheet, Eye, Download, Plus,
  AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KnowledgeDoc {
  id: string;
  title: string | null;
  original_name: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  created_at: string;
  file_size: number | null;
  processing_error: string | null;
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  processing: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processing', spin: true },
  ready: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Ready' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
};

const FILE_ICONS: Record<string, typeof File> = {
  pdf: File,
  csv: FileSpreadsheet,
  json: FileJson,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
};

export function KnowledgeView() {
  const router = useRouter();
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/knowledge/list', { credentials: 'include' });
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch (err) {
      console.error('[knowledge] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDocs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDocs]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const file of Array.from(files)) {
      try {
        const signedRes = await fetch('/api/knowledge/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
          }),
        });
        const { signedUrl, filePath } = await signedRes.json();

        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error('Upload failed');

        const registerRes = await fetch('/api/knowledge/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            filePath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        if (!registerRes.ok) throw new Error('Register failed');

        success++;
      } catch (err) {
        console.error('[knowledge] upload error:', err);
        failed++;
      }
    }

    if (fileRef.current) fileRef.current.value = '';

    if (success > 0) {
      toast.success(`${success} document(s) uploaded`);
      loadDocs();
    }
    if (failed > 0) {
      toast.error(`${failed} upload(s) failed`);
    }

    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document?')) return;
    try {
      const res = await fetch('/api/knowledge/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'Delete failed');
      toast.success('Document deleted');
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete document');
    }
  }

  async function handleProcess(id: string) {
    try {
      const res = await fetch('/api/knowledge/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentId: id }),
      });
      if (res.ok) {
        toast.success('Processing started');
        loadDocs();
      } else {
        throw new Error('Process failed');
      }
    } catch {
      toast.error('Failed to start processing');
    }
  }

  function getFileExtension(name: string): string {
    return name.split('.').pop()?.toLowerCase() ?? '';
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  const filteredDocs = docs.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.original_name?.toLowerCase().includes(s) ||
      d.title?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display text-fg">Knowledge Base</h1>
          <p className="text-[13px] text-fg-muted mt-1">
            Upload documents so Operator AI learns about your brand.
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={cn(
            'h-10 px-4 rounded-md flex items-center gap-2 text-[13px] font-medium transition-all',
            'bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20',
            uploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.csv,.json,.txt,.md,.xlsx,.xls,.doc,.docx" multiple onChange={handleUpload} className="hidden" />
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle" />
        <input
          type="text" placeholder="Search documents..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-surface-2 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-gold animate-spin" />
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-fg-subtle mx-auto mb-4" />
          <h2 className="text-lg font-display text-fg mb-2">No documents yet</h2>
          <p className="text-[13px] text-fg-muted mb-6 max-w-md mx-auto">
            Upload PDFs, CSVs, brand guides, or any document. Operator AI will use this to create better campaigns.
          </p>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-surface-2 border border-border text-fg hover:bg-surface-3 text-[13px] transition-colors">
            <Plus className="h-4 w-4" /> Upload your first document
          </button>
        </div>
      )}

      {!loading && filteredDocs.length > 0 && (
        <div className="space-y-2">
          {filteredDocs.map((doc) => {
            const ext = getFileExtension(doc.original_name);
            const IconComponent = FILE_ICONS[ext] ?? FileText;
            const statusConfig = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;

            return (
              <div key={doc.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border bg-surface-2 hover:bg-surface-3 transition-colors">
                <div className="h-10 w-10 rounded-md bg-surface-3 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="h-5 w-5 text-fg-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-fg truncate font-medium">{doc.title || doc.original_name}</span>
                    <span className="text-[10px] uppercase text-fg-subtle bg-surface-3 px-1.5 py-0.5 rounded">{ext}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-fg-subtle">
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    <span className={cn('flex items-center gap-1', statusConfig.color)}>
                      <StatusIcon className={cn('h-3 w-3', statusConfig.label === "Processing" ? "animate-spin" : "")} />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {doc.status === 'pending' && (
                    <button onClick={() => handleProcess(doc.id)} className="h-8 w-8 rounded-md hover:bg-surface-3 flex items-center justify-center text-fg-muted hover:text-gold transition-colors" title="Process">
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(doc.id)} className="h-8 w-8 rounded-md hover:bg-surface-3 flex items-center justify-center text-fg-muted hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-lg border border-border bg-surface-2">
        <h3 className="text-[13px] font-medium text-fg mb-2">Supported formats</h3>
        <div className="flex flex-wrap gap-2">
          {['PDF', 'CSV', 'JSON', 'TXT', 'MD', 'XLSX', 'DOC', 'DOCX'].map((fmt) => (
            <span key={fmt} className="text-[11px] text-fg-muted bg-surface-3 px-2 py-1 rounded-md">.{fmt.toLowerCase()}</span>
          ))}
        </div>
        <p className="text-[11px] text-fg-subtle mt-3">Documents are processed and stored securely.</p>
      </div>
    </div>
  );
}
