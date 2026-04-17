'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Play, Trash2, Loader2, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WORKFLOW_TEMPLATES } from '../data/templates';
import { useI18n } from '@/lib/i18n';

interface Workflow { id: string; name: string; description: string | null; trigger_type: string; is_active: boolean; last_run_at: string | null; last_run_status: string | null; total_runs: number; total_successes: number; created_at: string; }

export function WorkflowsView() {
  const { t } = useI18n();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => { try { const res = await fetch('/api/workflows/list'); if (!res.ok) return; const body = await res.json(); setWorkflows(body.workflows ?? []); } finally { setLoading(false); } }, []);
  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  async function createFromTemplate(templateId: string) {
    const tmpl = WORKFLOW_TEMPLATES.find((x) => x.id === templateId); if (!tmpl) return;
    try { const res = await fetch('/api/workflows/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tmpl.name, description: tmpl.description, triggerType: tmpl.triggerType, triggerConfig: tmpl.triggerConfig, steps: tmpl.steps, templateId: tmpl.id }) }); const body = await res.json(); if (res.status === 402) { toast.error(body.error ?? t('failed')); return; } if (!res.ok) throw new Error(body?.error ?? t('failed')); toast.success(t('updated')); setShowTemplates(false); fetchWorkflows(); } catch (e) { toast.error(e instanceof Error ? e.message : t('failed')); }
  }
  async function runWorkflow(id: string) {
    setRunning(id);
    try { const res = await fetch('/api/workflows/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); const body = await res.json(); if (!res.ok) throw new Error(body?.error ?? t('failed')); toast.success(t('updated') + ' — ' + (body.results?.length ?? 0) + ' ' + t('wf.steps')); fetchWorkflows(); } catch (e) { toast.error(e instanceof Error ? e.message : t('failed')); } finally { setRunning(null); }
  }
  async function toggleActive(w: Workflow) { try { await fetch('/api/workflows/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: w.id, isActive: !w.is_active }) }); fetchWorkflows(); } catch { toast.error(t('failed')); } }
  async function deleteWorkflow(id: string) { if (!confirm(t('wf.delete_confirm'))) return; try { await fetch('/api/workflows/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); setWorkflows((p) => p.filter((w) => w.id !== id)); toast.success(t('deleted')); } catch { toast.error(t('failed')); } }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('operator')}</div>
          <h1 className="font-display text-[32px]">{t('wf.title')}</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">{t('wf.subtitle')}</p>
        </div>
        <Button onClick={() => setShowTemplates(true)}><Plus className="h-4 w-4" /><span>{t('wf.from_template')}</span></Button>
      </div>
      {loading ? (<div className="rounded-lg border border-border bg-surface-2/30 py-16 text-center"><Loader2 className="h-6 w-6 text-gold animate-spin mx-auto" /></div>
      ) : workflows.length === 0 ? (
        <Card><CardBody className="py-16 text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center"><Zap className="h-5 w-5 text-gold" /></div>
          <div><p className="font-display text-[18px]">{t('wf.none')}</p><p className="text-[13px] text-fg-muted mt-1">{t('wf.none_hint')}</p></div>
          <Button onClick={() => setShowTemplates(true)}><Sparkles className="h-4 w-4" /><span>{t('wf.browse')}</span></Button>
        </CardBody></Card>
      ) : (
        <div className="space-y-3">{workflows.map((w) => (
          <Card key={w.id}><CardBody className="flex items-center gap-4">
            <button type="button" onClick={() => toggleActive(w)} className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition', w.is_active ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-surface-2 border-border text-fg-muted hover:text-fg')} title={w.is_active ? t('wf.none') : t('wf.none')}><Zap className="h-4 w-4" /></button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-display text-[16px] truncate">{w.name}</span><span className="px-1.5 h-4 text-[9.5px] tracking-[0.12em] uppercase rounded bg-surface-3 text-fg-muted flex items-center">{w.trigger_type}</span></div>
              {w.description && <p className="text-[12px] text-fg-muted truncate mt-0.5">{w.description}</p>}
              <div className="flex items-center gap-3 text-[10.5px] text-fg-subtle mt-1">
                <span>{w.total_runs} {t('wf.runs')}</span>
                {w.last_run_status && (<span className={cn('flex items-center gap-1', w.last_run_status === 'success' ? 'text-success' : 'text-danger')}>{w.last_run_status === 'success' ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}<span>{w.last_run_status}</span></span>)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => runWorkflow(w.id)} loading={running === w.id}><Play className="h-3 w-3" /><span>{t('wf.run_now')}</span></Button>
              <button type="button" onClick={() => deleteWorkflow(w.id)} className="h-7 w-7 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-danger hover:border-danger/40 flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
            </div>
          </CardBody></Card>
        ))}</div>
      )}
      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
          <div className="bg-surface border border-border rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><div><h2 className="font-display text-[22px]">{t('wf.templates_title')}</h2><p className="text-[12.5px] text-fg-muted mt-0.5">{t('wf.templates_hint')}</p></div><button onClick={() => setShowTemplates(false)} className="text-fg-muted hover:text-fg text-[20px]">&times;</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{WORKFLOW_TEMPLATES.map((tmpl) => (
              <button key={tmpl.id} type="button" onClick={() => createFromTemplate(tmpl.id)} className="text-left p-4 rounded-lg border border-border bg-surface-2 hover:border-gold/40 hover:bg-surface-3 transition group">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/20 transition"><Sparkles className="h-4 w-4 text-gold" /></div>
                  <div className="flex-1 min-w-0"><div className="font-display text-[15px] group-hover:text-gold transition">{tmpl.name}</div><div className="text-[11.5px] text-fg-muted mt-0.5 line-clamp-2">{tmpl.description}</div>
                    <div className="flex items-center gap-2 mt-2"><span className="text-[9.5px] tracking-[0.12em] uppercase px-1.5 h-4 rounded bg-surface-3 text-fg-subtle flex items-center">{tmpl.category}</span><span className="text-[9.5px] tracking-[0.12em] uppercase px-1.5 h-4 rounded bg-surface-3 text-fg-subtle flex items-center">{tmpl.steps.length} {t('wf.steps')}</span></div>
                  </div>
                </div>
              </button>
            ))}</div>
          </div>
        </div>
      )}
    </div>
  );
}
