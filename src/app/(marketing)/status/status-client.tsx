'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  latencyMs?: number;
  error?: string;
}

interface StatusResponse {
  status: 'operational' | 'degraded' | 'major_outage';
  timestamp: string;
  services: ServiceStatus[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  operational: { label: 'All systems operational', color: '#10B981' },
  degraded: { label: 'Some systems degraded', color: '#F59E0B' },
  major_outage: { label: 'Major outage', color: '#EF4444' },
};

function ServiceIcon({ status }: { status: string }) {
  if (status === 'operational') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === 'degraded') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (status === 'down') return <XCircle className="h-4 w-4 text-red-500" />;
  return <Loader2 className="h-4 w-4 animate-spin text-fg-muted" />;
}

export function StatusPageClient() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
      const body = (await res.json()) as StatusResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(true), 30_000);
    return () => clearInterval(interval);
  }, []);

  const globalLabel = data ? STATUS_LABELS[data.status] : null;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            Operator AI · Status
          </div>
          <h1 className="font-display text-[34px] mb-2">System status</h1>
          <p className="text-[14px] text-fg-muted">
            Real-time health of services powering Operator AI.
          </p>
        </div>

        {/* Global status */}
        {loading && !data && (
          <div className="rounded-xl border border-border bg-surface-2 p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold mx-auto mb-3" />
            <p className="text-[13px] text-fg-muted">Checking services...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-[13.5px] text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => fetchStatus()}
              className="mt-3 text-[12px] text-gold hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {data && globalLabel && (
          <>
            <div
              className="rounded-xl border p-6 mb-6"
              style={{
                borderColor: globalLabel.color + '40',
                background: globalLabel.color + '0D',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full animate-pulse"
                    style={{ background: globalLabel.color }}
                  />
                  <span
                    className="font-display text-[18px]"
                    style={{ color: globalLabel.color }}
                  >
                    {globalLabel.label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchStatus(true)}
                  disabled={refreshing}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-surface-3 transition-colors text-fg-muted disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Service list */}
            <div className="rounded-xl border border-border bg-surface-2 divide-y divide-border">
              {data.services.map((s) => (
                <div
                  key={s.name}
                  className="px-5 py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ServiceIcon status={s.status} />
                    <span className="text-[14px] text-fg">{s.name}</span>
                  </div>
                  <div className="text-[11.5px] text-fg-subtle font-mono">
                    {s.latencyMs !== undefined && s.status !== 'down' && (
                      <span>{s.latencyMs}ms</span>
                    )}
                    {s.status === 'down' && (
                      <span className="text-red-400">{s.error || 'unavailable'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-[11.5px] text-fg-subtle">
              Last updated {new Date(data.timestamp).toLocaleTimeString()} ·
              <span className="ml-1">
                Auto-refreshes every 30s.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
