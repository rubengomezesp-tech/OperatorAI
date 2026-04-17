'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet, Trash2, Send, Loader2, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface AnalysisFile { id: string; name: string; mime_type: string; size_bytes: number; row_count: number | null; column_count: number | null; columns: string[] | null; last_analyzed_at: string | null; created_at: string; }
function formatSize(bytes: number) { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / 1024 / 1024).toFixed(1) + ' MB'; }

export function FilesView() {
  const { t } = useI18n();
  const [files, setFiles] = useState<AnalysisFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<AnalysisFile | null>(null);
  const [question, setQuestion] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [answer, setAnswer] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchFiles = useCallback(async () => { try { const res = await fetch('/api/files/list'); if (!res.ok) return; const body = await res.json(); setFiles(body.files ?? []); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchFiles(); }, [fetchFiles]);
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) { const file = e.target.files?.[0]; if (!file) return; setUploading(true); try { const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/files/upload', { method: 'POST', body: fd }); const body = await res.json(); if (!res.ok) throw new Error(body?.error ?? 'Failed'); toast.success(t('updated')); fetchFiles(); } catch (e) { toast.error(e instanceof Error ? e.message : t('failed')); } finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; } }
  async function handleAnalyze() { if (!selected || !question.trim()) return; setAnalyzing(true); setAnswer(''); try { const res = await fetch('/api/files/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: selected.id, question: question.trim() }) }); const body = await res.json(); if (!res.ok) throw new Error(body?.error ?? t('failed')); setAnswer(body.answer); } catch (e) { toast.error(e instanceof Error ? e.message : t('failed')); } finally { setAnalyzing(false); } }
  async function handleDelete(id: string) { if (!confirm(t('files.delete_confirm'))) return; try { await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); setFiles((p) => p.filter((f) => f.id !== id)); if (selected?.id === id) { setSelected(null); setAnswer(''); } toast.success(t('deleted')); } catch { toast.error(t('failed')); } }
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('operator')}</div>
          <h1 className="font-display text-[32px]">{t('files.title')}</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">{t('files.subtitle')}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} loading={uploading}><Upload className="h-4 w-4" /><span>{t('files.upload')}</span></Button>
        <input ref={inputRef} type="file" accept=".csv,.xls,.xlsx,.json,.txt,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,text/plain" onChange={handleUpload} className="hidden" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="space-y-2">
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle px-2">{t('files.your_files')}</div>
          {loading ? <div className="py-8 text-center"><Loader2 className="h-5 w-5 text-gold animate-spin mx-auto" /></div> : files.length === 0 ? <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-10 text-center"><FileSpreadsheet className="h-7 w-7 text-fg-subtle mx-auto mb-2" /><p className="text-[12.5px] text-fg-muted">{t('files.none')}</p></div> : <div className="space-y-1">{files.map((f) => (<button key={f.id} type="button" onClick={() => { setSelected(f); setAnswer(''); }} className={cn('w-full text-left p-3 rounded-md border transition flex items-start gap-2.5 group', selected?.id === f.id ? 'bg-gold/10 border-gold/40' : 'bg-surface-2 border-border hover:border-gold/30')}><FileSpreadsheet className={cn('h-4 w-4 shrink-0 mt-0.5', selected?.id === f.id ? 'text-gold' : 'text-fg-muted')} /><div className="flex-1 min-w-0"><div className="text-[12.5px] truncate">{f.name}</div><div className="text-[10.5px] text-fg-subtle mt-0.5">{f.row_count ? f.row_count + ' ' + t('files.rows') + ' · ' : ''}{formatSize(f.size_bytes)}</div></div><span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(f.id); } }} className="opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-danger cursor-pointer"><Trash2 className="h-3 w-3" /></span></button>))}</div>}
        </div>
        <div className="space-y-4">
          {!selected ? <Card><CardBody className="py-16 text-center space-y-3"><div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center"><FileText className="h-5 w-5 text-gold" /></div><p className="font-display text-[16px]">{t('files.select_file')}</p><p className="text-[12px] text-fg-muted">{t('files.or_upload')}</p></CardBody></Card> : <>
            <Card><CardBody className="space-y-3"><div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-gold" /><span className="font-display text-[16px]">{selected.name}</span></div>{selected.columns && <div className="flex flex-wrap gap-1">{selected.columns.slice(0, 8).map((c) => <span key={c} className="px-1.5 h-5 text-[10.5px] uppercase tracking-[0.1em] rounded bg-surface-3 text-fg-muted flex items-center">{c}</span>)}{selected.columns.length > 8 && <span className="px-1.5 h-5 text-[10.5px] rounded bg-surface-3 text-fg-subtle flex items-center">+{selected.columns.length - 8}</span>}</div>}</CardBody></Card>
            <Card><CardBody className="space-y-3"><div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">{t('files.ask_question')}</div><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder={t('files.question_placeholder')} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none" /><div className="flex flex-wrap gap-1.5">{[t('files.suggest_summarize'), t('files.suggest_top5'), t('files.suggest_anomalies'), t('files.suggest_trends')].map((sug) => <button key={sug} type="button" onClick={() => setQuestion(sug)} className="h-6 px-2 rounded text-[11px] border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition">{sug}</button>)}</div><Button onClick={handleAnalyze} loading={analyzing} disabled={!question.trim()}><Send className="h-4 w-4" /><span>{t('files.analyze')}</span></Button></CardBody></Card>
            {answer && <Card><CardBody className="space-y-2"><div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-gold"><Sparkles className="h-3 w-3" /><span>{t('files.answer')}</span></div><pre className="whitespace-pre-wrap font-sans text-[13.5px] text-fg leading-relaxed">{answer}</pre></CardBody></Card>}
          </>}
        </div>
      </div>
    </div>
  );
}
