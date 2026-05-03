'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Loader2, ExternalLink, AlertCircle, Sparkles, Zap, Crown, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PLANS, type PlanDefinition } from '@/features/billing/data/plans';

interface UsageData {
  plan: { id: string; name: string; priceDisplay: string; quotas: PlanDefinition['quotas'] } | null;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
  } | null;
  usage: {
    chat_messages: number;
    image_generations: number;
    video_generations: number;
  };
}

const PLAN_ICONS: Record<string, typeof Sparkles> = {
  starter: Sparkles,
  pro: Zap,
  studio: Crown,
  agency: Gem,
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'text-blue-400',
  pro: 'text-gold',
  studio: 'text-purple-400',
  agency: 'text-rose-400',
};

export default function BillingPage() {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    fetch('/api/billing/usage')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const trialDaysRemaining = useMemo(() => {
    if (!data?.subscription?.trialEnd) return null;
    if (data.subscription.status !== 'trialing') return null;
    const end = new Date(data.subscription.trialEnd).getTime();
    const ms = end - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [data]);

  async function handleCheckout(planId: string) {
    setCheckingOut(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast.error(json.error ?? 'Error');
      }
    } catch {
      toast.error(isEs ? 'Error al iniciar checkout' : 'Checkout error');
    } finally {
      setCheckingOut(null);
    }
  }

  async function handlePortal() {
    setOpeningPortal(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        toast.error(json.error ?? 'Error');
      }
    } catch {
      toast.error(isEs ? 'Error abriendo portal' : 'Portal error');
    } finally {
      setOpeningPortal(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-12 max-w-5xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-fg-muted" />
        </div>
      </div>
    );
  }

  const hasPlan = !!data?.plan;
  const sub = data?.subscription;
  const plan = data?.plan;
  const usage = data?.usage ?? { chat_messages: 0, image_generations: 0, video_generations: 0 };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto pb-24">
      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
          {isEs ? 'Cuenta · Facturación' : 'Account · Billing'}
        </div>
        <h1 className="font-display text-[34px] sm:text-[42px] tracking-tight mb-2">
          {isEs ? 'Plan y facturación' : 'Plan and billing'}
        </h1>
        <p className="text-[14.5px] text-fg-muted max-w-2xl">
          {isEs
            ? 'Gestiona tu plan, ve tu uso del mes y administra el método de pago.'
            : 'Manage your plan, see this month usage and update your payment method.'}
        </p>
      </div>

      {/* Trial alert */}
      {trialDaysRemaining !== null && trialDaysRemaining > 0 && (
        <div className="mb-8 p-4 rounded-xl border border-gold/30 bg-gold/[0.05]">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-gold flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[14.5px] text-fg font-medium">
                {isEs
                  ? `Estás en periodo de prueba — ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'día restante' : 'días restantes'}`
                  : `Trial period active — ${trialDaysRemaining} ${trialDaysRemaining === 1 ? 'day' : 'days'} left`}
              </div>
              <div className="text-[13px] text-fg-muted mt-0.5">
                {isEs
                  ? 'Cuando termine tu trial, se cobrará automáticamente. Cancela cuando quieras.'
                  : 'When your trial ends you will be charged automatically. Cancel anytime.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current plan card */}
      {hasPlan && plan && sub && (
        <div className="mb-12 p-6 sm:p-8 rounded-2xl border border-border bg-surface-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="text-[12px] uppercase tracking-wider text-fg-subtle mb-1">
                {isEs ? 'Tu plan actual' : 'Your current plan'}
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-display text-[28px] tracking-tight">{plan.name}</h2>
                <span className="text-[14px] text-fg-muted">{plan.priceDisplay}/mo</span>
                {sub.cancelAtPeriodEnd && (
                  <span className="text-[12px] uppercase tracking-wider text-rose-400">
                    {isEs ? 'Se cancelará' : 'Will cancel'}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={openingPortal}
              className="h-10 px-5 rounded-md border border-border bg-surface-3 text-[13.5px] hover:border-gold/30 transition-colors flex items-center gap-2"
            >
              {openingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
              {isEs ? 'Gestionar facturación' : 'Manage billing'}
            </button>
          </div>

          {/* Usage bars */}
          <div className="space-y-4">
            <UsageBar
              label={isEs ? 'Mensajes de chat' : 'Chat messages'}
              used={usage.chat_messages}
              limit={plan.quotas.chatMessages}
            />
            <UsageBar
              label={isEs ? 'Imágenes generadas' : 'Images generated'}
              used={usage.image_generations}
              limit={plan.quotas.imageGenerations}
            />
            <UsageBar
              label={isEs ? 'Videos generados' : 'Videos generated'}
              used={usage.video_generations}
              limit={plan.quotas.videoGenerations}
            />
          </div>

          {sub.currentPeriodEnd && (
            <p className="mt-5 text-[12.5px] text-fg-subtle">
              {isEs ? 'Próxima renovación: ' : 'Next renewal: '}
              {new Date(sub.currentPeriodEnd).toLocaleDateString(isEs ? 'es-ES' : 'en-US')}
            </p>
          )}
        </div>
      )}

      {/* Plans grid */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-[24px] tracking-tight">
          {hasPlan
            ? (isEs ? 'Cambia de plan' : 'Change plan')
            : (isEs ? 'Elige tu plan' : 'Choose your plan')}
        </h2>
        <div className="flex items-center gap-1 p-1 rounded-md bg-surface-2 border border-border">
          <button
            onClick={() => setInterval('monthly')}
            className={cn(
              'h-8 px-4 rounded-sm text-[12.5px] transition-all',
              interval === 'monthly' ? 'bg-surface-3 text-fg font-medium' : 'text-fg-muted hover:text-fg'
            )}
          >
            {isEs ? 'Mensual' : 'Monthly'}
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={cn(
              'h-8 px-4 rounded-sm text-[12.5px] transition-all flex items-center gap-1.5',
              interval === 'yearly' ? 'bg-surface-3 text-fg font-medium' : 'text-fg-muted hover:text-fg'
            )}
          >
            {isEs ? 'Anual' : 'Yearly'}
            <span className="text-[10.5px] uppercase tracking-wider text-gold">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const Icon = PLAN_ICONS[p.id] ?? Sparkles;
          const colorCls = PLAN_COLORS[p.id] ?? 'text-fg';
          const isCurrent = plan?.id === p.id;
          const yearlyPrice = Math.round((p.priceCents * 12 * 0.8) / 100);
          const monthlyEquiv = Math.round((p.priceCents * 0.8) / 100);

          return (
            <div
              key={p.id}
              className={cn(
                'relative p-5 rounded-xl border bg-surface-2 flex flex-col',
                p.highlight ? 'border-gold/40' : 'border-border',
                isCurrent && 'ring-2 ring-gold/60'
              )}
            >
              {p.highlight && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gold text-bg text-[10px] uppercase tracking-wider font-medium">
                  {isEs ? 'Recomendado' : 'Popular'}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-fg text-bg text-[10px] uppercase tracking-wider font-medium">
                  {isEs ? 'Actual' : 'Current'}
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Icon className={cn('h-4 w-4', colorCls)} />
                <h3 className="font-display text-[18px] tracking-tight">{p.name}</h3>
              </div>
              <p className="text-[12.5px] text-fg-muted mb-4">{p.tagline}</p>

              <div className="mb-5">
                {interval === 'monthly' ? (
                  <>
                    <div className="text-[28px] font-display tracking-tight">{p.priceDisplay}</div>
                    <div className="text-[11.5px] text-fg-subtle">/{isEs ? 'mes' : 'month'}</div>
                  </>
                ) : (
                  <>
                    <div className="text-[28px] font-display tracking-tight">${monthlyEquiv}</div>
                    <div className="text-[11.5px] text-fg-subtle">
                      /{isEs ? 'mes' : 'month'} · ${yearlyPrice}/{isEs ? 'año' : 'year'}
                    </div>
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {p.features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-fg-soft">
                    <Check className="h-3 w-3 text-gold mt-1 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(p.id)}
                disabled={isCurrent || checkingOut === p.id}
                className={cn(
                  'h-10 w-full rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-2',
                  isCurrent
                    ? 'bg-surface-3 text-fg-muted cursor-default'
                    : p.highlight
                      ? 'gold-grad text-bg hover:scale-[1.02]'
                      : 'border border-border bg-surface-3 hover:border-gold/40'
                )}
              >
                {checkingOut === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isCurrent
                  ? (isEs ? 'Plan actual' : 'Current plan')
                  : (hasPlan
                    ? (isEs ? 'Cambiar' : 'Switch')
                    : (isEs ? 'Probar 3 días' : 'Try 3 days'))}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[12px] text-fg-subtle">
        {isEs
          ? '3 días gratis · Cancela cuando quieras · Soporte por email'
          : '3 days free · Cancel anytime · Email support'}
      </p>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const isUnlimited = limit >= 999999;
  const pct = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
  const isHigh = pct >= 80;
  const isFull = pct >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] text-fg-soft">{label}</span>
        <span className={cn(
          'text-[12px]',
          isFull ? 'text-rose-400 font-medium' : isHigh ? 'text-amber-400' : 'text-fg-muted'
        )}>
          {used.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isFull ? 'bg-rose-400' : isHigh ? 'bg-amber-400' : 'bg-gold'
          )}
          style={{ width: `${isUnlimited ? 100 : pct}%`, opacity: isUnlimited ? 0.3 : 1 }}
        />
      </div>
    </div>
  );
}
