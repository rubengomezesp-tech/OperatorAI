'use client';

import { useEffect, useState } from 'react';
import { Plug, Check, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { INTEGRATION_CATALOG } from '@/features/integrations/data/catalog';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

interface IntegrationRow {
  provider: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
}

// Curated subset for onboarding (don't overwhelm)
const ONBOARDING_FEATURED_PROVIDERS = ['gmail', 'gcal', 'gdrive', 'slack'];

export function StepConnectTools({
  data,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onNext: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<IntegrationRow[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/integrations/list')
      .then((r) => r.json())
      .then((b) => {
        if (Array.isArray(b.integrations)) setRows(b.integrations);
      })
      .catch(() => {});
  }, []);

  const featured = INTEGRATION_CATALOG.filter((p) =>
    ONBOARDING_FEATURED_PROVIDERS.includes(p.id),
  );

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
      if (!res.ok) {
        toast.error(body?.error ?? 'Failed to connect');
        setConnecting(null);
        return;
      }
      if (body.redirectUrl) {
        // OAuth redirect — browser will leave; will return to onboarding via callback
        window.location.href = body.redirectUrl;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
      setConnecting(null);
    }
  }

  const connectedCount = rows.filter((r) => r.status === 'connected').length;

  return (
    <div className="w-full max-w-[820px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">
          Step 5 — Connect Tools
        </div>
        <h1 className="font-display text-[32px] mb-2">
          Conecta lo que ya usas
        </h1>
        <p className="text-[13.5px] text-fg-muted max-w-[560px]">
          Operator puede actuar en tu nombre cuando lo conectas con tus herramientas.
          Todo es opcional — puedes hacerlo después desde Settings.
        </p>
      </div>

      {/* Integrations grid */}
      <div className="space-y-2.5 mb-8">
        {featured.map((p) => {
          const row = statusOf(p.id);
          const isConnected = row?.status === 'connected';
          return (
            <div
              key={p.id}
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border transition-colors',
                isConnected
                  ? 'border-gold/40 bg-gold/5'
                  : 'border-border bg-surface hover:border-border-strong',
              )}
            >
              <div
                className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center text-white font-semibold text-[14px]"
                style={{ background: p.brandColor }}
              >
                {p.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-[15px]">{p.name}</h3>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded bg-gold/15 border border-gold/40 text-[10px] uppercase tracking-[0.1em] text-gold">
                      <Check className="h-2.5 w-2.5" /> conectado
                    </span>
                  )}
                </div>
                <p className="text-[12.5px] text-fg-muted mt-0.5">{p.tagline}</p>
              </div>
              {!isConnected && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connect(p.id)}
                  loading={connecting === p.id}
                >
                  <Plug className="h-3.5 w-3.5 mr-1" />
                  Conectar
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint */}
      <div className="rounded-lg border border-dashed border-border bg-surface-2/30 p-4 mb-6 text-center">
        <p className="text-[12px] text-fg-muted">
          Más integraciones disponibles después en{' '}
          <span className="text-gold">Settings → Integrations</span>
        </p>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          ← Atrás
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onNext({ tools_connected_count: connectedCount })}
            className="text-fg-muted"
          >
            Saltar por ahora
          </Button>
          <Button onClick={() => onNext({ tools_connected_count: connectedCount })}>
            {connectedCount > 0
              ? `Continuar con ${connectedCount} conectada(s)`
              : 'Continuar'}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
