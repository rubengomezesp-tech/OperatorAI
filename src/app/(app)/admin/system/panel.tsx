'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Database, Megaphone, Power, Save, Activity, RefreshCw, FileText, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tab = 'maintenance' | 'audit' | 'health';

interface MaintenanceState {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  announcementActive: boolean;
  chatDisabled: boolean;
  adsDisabled: boolean;
}

interface AuditEntry {
  id: string;
  admin_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface HealthService {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  error?: string;
}

export function SystemPanel() {
  const [tab, setTab] = useState<Tab>('maintenance');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">System</h2>
        <p className="text-[13px] text-fg-muted">Maintenance mode, audit log and infrastructure health.</p>
      </div>

      <div className="flex gap-1 p-1 rounded-md bg-surface-2 border border-border w-fit">
        {[
          { id: 'maintenance', label: 'Maintenance', icon: AlertTriangle },
          { id: 'audit', label: 'Audit Log', icon: FileText },
          { id: 'health', label: 'Health', icon: Activity },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                'h-9 px-4 rounded text-[12.5px] flex items-center gap-1.5 transition-colors',
                tab === t.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'maintenance' && <MaintenanceTab />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'health' && <HealthTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Maintenance
// ════════════════════════════════════════════════════════════════════════════

function MaintenanceTab() {
  const [state, setState] = useState<MaintenanceState | null>(null);
  const [original, setOriginal] = useState<MaintenanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then((r) => r.json())
      .then((d) => { setState(d); setOriginal(d); setLoading(false); });
  }, []);

  const dirty = JSON.stringify(state) !== JSON.stringify(original);

  async function save() {
    if (!state) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Saved — live in production');
        setOriginal(state);
      } else {
        toast.error(json.error ?? 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !state) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-gold animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Kill switches */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Power className="h-4 w-4 text-rose-400" />
          <h3 className="font-display text-[16px]">Kill switches</h3>
        </div>
        <p className="text-[12px] text-fg-muted mb-4">Disable specific features instantly</p>

        <Toggle
          label="Maintenance mode (full app down)"
          desc="Shows a maintenance page to all non-admin users"
          checked={state.maintenanceMode}
          onChange={(v) => setState({ ...state, maintenanceMode: v })}
          danger
        />
        <Toggle
          label="Disable chat"
          desc="Block /api/chat for non-admin users"
          checked={state.chatDisabled}
          onChange={(v) => setState({ ...state, chatDisabled: v })}
          danger
        />
        <Toggle
          label="Disable ads generation"
          desc="Block /api/ads/* for non-admin users"
          checked={state.adsDisabled}
          onChange={(v) => setState({ ...state, adsDisabled: v })}
          danger
        />

        <div className="mt-4">
          <label className="block text-[10.5px] uppercase tracking-wider text-fg-subtle mb-1.5">
            Maintenance message (shown to users when active)
          </label>
          <textarea
            rows={2}
            value={state.maintenanceMessage}
            onChange={(e) => setState({ ...state, maintenanceMessage: e.target.value })}
            placeholder="We're performing scheduled maintenance. Back in 10 minutes."
            className="w-full bg-bg/40 border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {/* Announcement */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="h-4 w-4 text-gold" />
          <h3 className="font-display text-[16px]">Global banner</h3>
        </div>
        <p className="text-[12px] text-fg-muted mb-4">Shows a banner at the top of every page</p>

        <Toggle
          label="Show announcement banner"
          desc="Display the message below to all users"
          checked={state.announcementActive}
          onChange={(v) => setState({ ...state, announcementActive: v })}
        />

        <div className="mt-3">
          <label className="block text-[10.5px] uppercase tracking-wider text-fg-subtle mb-1.5">
            Announcement message
          </label>
          <textarea
            rows={2}
            value={state.announcement}
            onChange={(e) => setState({ ...state, announcement: e.target.value })}
            placeholder="✨ New feature: AI video ads launching this week!"
            className="w-full bg-bg/40 border border-border rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {dirty && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={save}
            disabled={saving}
            className="h-12 px-6 rounded-full gold-grad text-bg font-medium text-[13.5px] flex items-center gap-2 shadow-[0_8px_30px_rgb(201_168_99_/_0.5)]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, danger }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px]">{label}</div>
        <div className="text-[11.5px] text-fg-subtle">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'h-6 w-11 rounded-full transition-colors flex-shrink-0 relative',
          checked
            ? danger ? 'bg-rose-500/80' : 'bg-emerald-500/80'
            : 'bg-surface-3 border border-border'
        )}
      >
        <div className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0.5'
        )} />
      </button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Audit
// ════════════════════════════════════════════════════════════════════════════

function AuditTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/audit');
    const json = await res.json();
    setEntries(json.entries ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const uniqueActions = Array.from(new Set(entries.map((e) => e.action))).sort();
  const filtered = actionFilter === 'all' ? entries : entries.filter((e) => e.action === actionFilter);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 text-gold animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-fg-subtle" />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-8 px-3 bg-surface-2 border border-border rounded-md text-[12.5px] focus:outline-none focus:border-gold/40"
        >
          <option value="all">All actions ({entries.length})</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="h-8 px-3 border border-border rounded-md text-[12px] hover:bg-surface-3 flex items-center gap-1.5 ml-auto"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-fg-muted text-[13px]">No audit entries</div>
        )}
        <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {filtered.map((e) => (
            <div key={e.id} className="p-3 hover:bg-surface-3/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-[11px] px-1.5 py-0.5 rounded bg-gold/10 text-gold border border-gold/20">{e.action}</code>
                    <span className="text-[12px] text-fg-soft">{e.admin_email}</span>
                  </div>
                  {e.entity_type && (
                    <div className="text-[11px] text-fg-subtle mt-1">
                      {e.entity_type} · <span className="font-mono">{e.entity_id}</span>
                    </div>
                  )}
                  {Object.keys(e.details ?? {}).length > 0 && (
                    <pre className="mt-2 text-[10.5px] text-fg-subtle bg-bg/40 rounded p-2 overflow-x-auto max-w-full">
                      {JSON.stringify(e.details, null, 2)}
                    </pre>
                  )}
                </div>
                <span className="text-[10.5px] text-fg-subtle whitespace-nowrap flex-shrink-0">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Health
// ════════════════════════════════════════════════════════════════════════════

function HealthTab() {
  const [services, setServices] = useState<HealthService[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const check = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/health');
    const json = await res.json();
    setServices(json.services ?? []);
    setCheckedAt(json.checkedAt);
    setLoading(false);
  }, []);

  useEffect(() => { check(); }, [check]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-fg-muted">
          {checkedAt && `Last checked: ${new Date(checkedAt).toLocaleTimeString()}`}
        </p>
        <button
          onClick={check}
          disabled={loading}
          className="h-8 px-3 border border-border rounded-md text-[12px] hover:bg-surface-3 flex items-center gap-1.5"
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          Recheck
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {services.map((s) => (
          <ServiceCard key={s.name} service={s} />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: HealthService }) {
  const config = {
    ok: { color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Operational' },
    degraded: { color: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Degraded' },
    down: { color: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Down' },
  }[service.status];

  return (
    <div className={cn('p-4 rounded-xl border bg-surface-2', config.border)}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-display text-[15px]">{service.name}</div>
        <div className="flex items-center gap-1.5">
          <div className={cn('h-2 w-2 rounded-full', config.color, 'animate-pulse')} />
          <span className={cn('text-[11px] uppercase tracking-wider', config.text)}>{config.label}</span>
        </div>
      </div>
      {service.latencyMs !== undefined && (
        <div className="text-[12px] text-fg-muted">Latency: <span className="font-mono">{service.latencyMs}ms</span></div>
      )}
      {service.error && (
        <div className="text-[11px] text-rose-400 mt-2 break-all">{service.error}</div>
      )}
    </div>
  );
}
