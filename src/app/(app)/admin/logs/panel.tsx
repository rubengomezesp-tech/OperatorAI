'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw, Search, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: number;
  created_at: string;
  severity: 'error' | 'warning' | 'info';
  path: string;
  message: string;
  user_email?: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

const SEVERITY_CONFIG = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Warning' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Info' },
};

export function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlMessage, setSqlMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (filter !== 'all') params.set('severity', filter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      
      if (data.sql) {
        setSqlMessage(data.sql);
        setLogs([]);
      } else if (data.error) {
        setError(data.error);
        setLogs([]);
      } else {
        setLogs(data.logs || []);
        setSqlMessage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 30000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.message?.toLowerCase().includes(s) ||
      log.path?.toLowerCase().includes(s) ||
      log.user_email?.toLowerCase().includes(s)
    );
  });

  const counts = {
    all: logs.length,
    error: logs.filter(l => l.severity === 'error').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    info: logs.filter(l => l.severity === 'info').length,
  };

  if (sqlMessage) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-display">Error Logs</h2>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-6">
          <p className="text-fg-muted mb-4">
            La tabla <code className="text-gold bg-gold/10 px-1.5 py-0.5 rounded">audit_log</code> no existe.
            Ejecuta este SQL en Supabase:
          </p>
          <div className="bg-bg rounded-md p-4 overflow-x-auto">
            <pre className="text-[12px] text-fg-muted font-mono whitespace-pre-wrap">{sqlMessage}</pre>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(sqlMessage)}
            className="mt-3 text-[12px] text-gold hover:underline"
          >
            Copiar SQL
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <h2 className="text-lg font-display">Error Logs</h2>
          <span className="text-[11px] text-fg-subtle bg-surface-2 px-2 py-0.5 rounded-full">
            {logs.length} entries
          </span>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="h-9 px-3 rounded-md border border-border bg-surface-2 hover:bg-surface-3 text-fg-muted hover:text-fg flex items-center gap-2 text-[13px] transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-2 rounded-md p-0.5 border border-border">
          {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={cn(
                'px-3 py-1.5 rounded text-[12px] font-medium transition-colors',
                filter === sev
                  ? 'bg-bg text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              {sev === 'all' ? 'All' : SEVERITY_CONFIG[sev].label}
              <span className="ml-1.5 text-[10px] opacity-60">{counts[sev]}</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search path, message, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-fg-subtle hover:text-fg" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-[13px]">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        {filteredLogs.length === 0 && !loading && (
          <div className="text-center py-12 text-fg-subtle text-[13px]">
            {search ? 'No logs match your search' : 'No logs yet — errors will appear here'}
          </div>
        )}

        {filteredLogs.map((log) => {
          const config = SEVERITY_CONFIG[log.severity];
          const Icon = config.icon;
          const isExpanded = expandedId === log.id;

          return (
            <div
              key={log.id}
              className={cn(
                'rounded-lg border transition-colors',
                config.bg, config.border,
                isExpanded && 'ring-1 ring-gold/20'
              )}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-fg truncate font-medium">
                    {log.message?.slice(0, 100) || 'No message'}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-fg-subtle">
                    <span className="font-mono text-[10.5px] opacity-70">{log.path || '/'}</span>
                    {log.user_email && <span className="opacity-60">{log.user_email}</span>}
                    <span className="opacity-50">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <ChevronRight className={cn('h-3.5 w-3.5 text-fg-subtle flex-shrink-0 transition-transform', isExpanded && 'rotate-90')} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-inherit mx-4">
                  <div className="grid grid-cols-2 gap-3 mt-3 text-[12px]">
                    <div><span className="text-fg-subtle">Path: </span><span className="text-fg font-mono text-[11px]">{log.path}</span></div>
                    <div><span className="text-fg-subtle">IP: </span><span className="text-fg font-mono text-[11px]">{log.ip || '—'}</span></div>
                    <div><span className="text-fg-subtle">User: </span><span className="text-fg">{log.user_email || 'anonymous'}</span></div>
                    <div><span className="text-fg-subtle">Time: </span><span className="text-fg">{new Date(log.created_at).toLocaleString()}</span></div>
                  </div>
                  {log.message && (
                    <div className="mt-3">
                      <div className="text-[11px] text-fg-subtle mb-1">Full message:</div>
                      <div className="bg-bg rounded-md p-3 text-[12px] text-fg font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto">{log.message}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-5 w-5 text-gold animate-spin" />
        </div>
      )}
    </div>
  );
}
