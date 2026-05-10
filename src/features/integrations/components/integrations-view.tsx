'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Plug, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { INTEGRATION_CATALOG, findIntegration } from '../data/catalog';
import { useI18n } from '@/lib/i18n';

interface IntegrationRow {
  provider: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  connected_at: string | null;
  last_used_at: string | null;
}

export function IntegrationsView({ initialIntegrations }: { initialIntegrations: IntegrationRow[] }) {
  const { t } = useI18n();
  const search = useSearchParams();
  const [rows, setRows] = useState<IntegrationRow[]>(initialIntegrations);
  const [connecting, setConnecting] = useState<string | null>(null);

  // ─── Refresh on OAuth callback ─────────────────────────────
  useEffect(() => {
    const justConnected = search.get('connected');
    const connectedAccountId = search.get('connected_account_id');

    if (!justConnected) return;

    const provider = findIntegration(justConnected);
    if (!provider) return;

    // 1. Sync status with Composio (force update from pending → connected)
    fetch('/api/integrations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: justConnected,
        connectedAccountId: connectedAccountId || undefined,
      }),
    })
      .then((r) => r.json())
      .then((body) => {
        if (body.status === 'connected') {
          toast.success(`${provider.name} ${t('int.connected').toLowerCase()}.`);
        } else if (body.status === 'pending') {
          toast.info(`${provider.name}: ${t('int.pending')}...`);
        } else if (body.status === 'error') {
          toast.error(`${provider.name}: ${body.error || 'connection failed'}`);
        }
      })
      .catch((e) => {
        console.warn('Sync failed:', e);
      })
      .finally(() => {
        // Refresh rows list regardless
        fetch('/api/integrations/list')
          .then((r) => r.json())
          .then((b) => {
            if (Array.isArray(b.integrations)) setRows(b.integrations);
          })
          .catch(() => {});
      });
  }, [search, t]);

  // ─── Periodic refresh while pending ────────────────────────
  useEffect(() => {
    const hasPending = rows.some((r) => r.status === 'pending');
    if (!hasPending) return;

    const tick = async () => {
      // Sync each pending row with Composio
      const pending = rows.filter((r) => r.status === 'pending');
      for (const r of pending) {
        try {
          await fetch('/api/integrations/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: r.provider }),
          });
        } catch {}
      }
      // Then refresh list
      fetch('/api/integrations/list')
        .then((r) => r.json())
        .then((b) => {
          if (Array.isArray(b.integrations)) setRows(b.integrations);
        })
        .catch(() => {});
    };

    const interval = setInterval(tick, 4000);
    return () => clearInterval(interval);
  }, [rows]);

  function statusOf(providerId: string) {
    return rows.find((r) => r.provider === providerId);
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
        toast.error(body.error || t('int.looking_for'));
        setConnecting(null);
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? t('failed'));
      if (body.redirectUrl) {
        window.location.href = body.redirectUrl;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('failed'));
      setConnecting(null);
    }
  }

  async function disconnect(providerId: string) {
    if (!confirm(t('int.disconnect_confirm'))) return;
    try {
      const res = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      if (!res.ok) throw new Error(t('failed'));
      setRows((prev) =>
        prev.map((r) => (r.provider === providerId ? { ...r, status: 'disconnected' } : r)),
      );
      toast.success(t('deleted'));
    } catch {
      toast.error(t('failed'));
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('operator')}</div>
        <h1 className="font-display text-[32px]">{t('int.title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[620px]">{t('int.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATION_CATALOG.map((p) => {
          const row = statusOf(p.id);
          const isConnected = row?.status === 'connected';
          const isPending = row?.status === 'pending';
          return (
            <Card
              key={p.id}
              className={cn(isConnected && 'border-gold/40 bg-gold/5')}
            >
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
                        <h3
                          className={cn(
                            'font-display text-[16.5px]',
                            isConnected && 'text-gold',
                          )}
                        >
                          {p.name}
                        </h3>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-gold/15 border border-gold/40 text-[10px] uppercase tracking-[0.1em] text-gold">
                            <Check className="h-2.5 w-2.5" /> {t('int.connected')}
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-surface-3 border border-border text-[10px] uppercase tracking-[0.1em] text-fg-muted">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" /> {t('int.pending')}
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
                      <span>{t('int.connect')}</span>
                    </Button>
                  )}
                </div>
                {!isConnected && <p className="text-[12.5px] text-fg-soft leading-relaxed">{p.description}</p>}
                <div className="space-y-1.5">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                    {isConnected ? t('int.can_ask') : t('int.examples')}
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
          {t('int.looking_for')}{' '}
          <a href="mailto:hi@operatorai.app" className="text-gold hover:underline">
            {t('int.tell_us')}
          </a>
        </p>
      </div>
    </div>
  );
}
