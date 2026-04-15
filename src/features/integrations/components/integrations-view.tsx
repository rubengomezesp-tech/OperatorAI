'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Plug, Loader2, X, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { INTEGRATION_CATALOG, findIntegration } from '../data/catalog';

interface IntegrationRow {
  provider: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  connected_at: string | null;
  last_used_at: string | null;
}

export function IntegrationsView({ initialIntegrations }: { initialIntegrations: IntegrationRow[] }) {
  const search = useSearchParams();
  const [rows, setRows] = useState<IntegrationRow[]>(initialIntegrations);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    const justConnected = search.get('connected');
    if (justConnected) {
      const provider = findIntegration(justConnected);
      if (provider) toast.success(provider.name + ' connected.');
      // Refresh list
      fetch('/api/integrations/list').then(r => r.json()).then(b => {
        if (Array.isArray(b.integrations)) setRows(b.integrations);
      });
    }
  }, [search]);

  function statusOf(providerId: string): IntegrationRow | undefined {
    return rows.find(r => r.provider === providerId);
  }

  async function connect(providerId: string) {
    setConnecting(providerId);
    try {
      const res = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      const body = await res.json();
      if (res.status === 503 && body.setup) {
        toast.error('Integrations not configured yet. Add COMPOSIO_API_KEY to your environment.');
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (body.redirectUrl) {
        window.location.href = body.redirectUrl;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to connect');
      setConnecting(null);
    }
  }

  async function disconnect(providerId: string) {
    if (!confirm('Disconnect this integration?')) return;
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      if (!res.ok) throw new Error('Failed');
      setRows(prev => prev.map(r => r.provider === providerId ? { ...r, status: 'disconnected' } : r));
      toast.success('Disconnected');
    } catch {
      toast.error('Failed to disconnect');
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
        <h1 className="font-display text-[32px]">Integrations</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[620px]">
          Give your assistant the keys to your stack. One AI that reads your inbox, books your calendar,
          updates your CRM, and works your docs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_CATALOG.map((p) => {
          const row = statusOf(p.id);
          const isConnected = row?.status === 'connected';
          const isPending = row?.status === 'pending';

          return (
            <Card key={p.id}>
              <CardBody className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center text-white font-semibold text-[14px]"
                      style={{ background: p.brandColor }}
                    >
                      {p.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-[16.5px]">{p.name}</h3>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-gold/15 border border-gold/40 text-[10px] uppercase tracking-[0.1em] text-gold">
                            <Check className="h-2.5 w-2.5" /> Connected
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-surface-3 border border-border text-[10px] uppercase tracking-[0.1em] text-fg-muted">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" /> Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-fg-muted mt-0.5">{p.tagline}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <Button size="sm" variant="ghost" onClick={() => disconnect(p.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => connect(p.id)}
                      loading={connecting === p.id}
                    >
                      <Plug className="h-3.5 w-3.5" />
                      <span>Connect</span>
                    </Button>
                  )}
                </div>

                {!isConnected && (
                  <p className="text-[12.5px] text-fg-soft leading-relaxed">{p.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                    {isConnected ? 'You can ask things like' : 'Examples'}
                  </div>
                  <div className="space-y-1">
                    {p.popularActions.slice(0, 3).map((a) => (
                      <div key={a} className="text-[12px] text-fg-soft">
                        <span className="text-gold">→</span> {a}
                      </div>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border border-dashed border-border bg-surface-2/30 p-5 text-center">
        <p className="text-[12.5px] text-fg-muted">
          Looking for another tool? <a href="mailto:hi@operatorai.app" className="text-gold hover:underline">Tell us what to integrate next.</a>
        </p>
      </div>
    </div>
  );
}
