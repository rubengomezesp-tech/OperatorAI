'use client';
import { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, Gem, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface CurrentPlan {
  planId: string | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}

const plans = [
  {
    id: 'starter',
    icon: Sparkles,
    color: 'text-blue-400',
    price_en: '$29 / month', price_es: '29 $ / mes',
    name_en: 'Starter', name_es: 'Starter',
    tagline_en: 'For individuals', tagline_es: 'Para particulares',
    features_en: ['3 AI models (GPT-4o, Claude, Gemini)', '500 messages/mo', '50 AI images/mo', '10 AI videos/mo', '1 project', 'Voice mode + memory', 'Email support'],
    features_es: ['3 modelos IA (GPT-4o, Claude, Gemini)', '500 mensajes/mes', '50 imágenes IA/mes', '10 vídeos IA/mes', '1 proyecto', 'Modo voz + memoria', 'Soporte email'],
  },
  {
    id: 'pro',
    icon: Zap,
    color: 'text-gold',
    popular: true,
    price_en: '$99 / month', price_es: '99 $ / mes',
    name_en: 'Pro', name_es: 'Pro',
    tagline_en: 'For brands and pros', tagline_es: 'Para marcas y profesionales',
    features_en: ['Everything in Starter', '3,000 messages/mo', '300 AI images/mo', '100 AI videos/mo', '5 projects', '10 integrations', '6 specialized agents', 'Priority support'],
    features_es: ['Todo en Starter', '3.000 mensajes/mes', '300 imágenes IA/mes', '100 vídeos IA/mes', '5 proyectos', '10 integraciones', '6 agentes especializados', 'Soporte prioritario'],
  },
  {
    id: 'studio',
    icon: Crown,
    color: 'text-purple-400',
    price_en: '$299 / month', price_es: '299 $ / mes',
    name_en: 'Studio', name_es: 'Studio',
    tagline_en: 'For studios with multiple brands', tagline_es: 'Para estudios con varias marcas',
    features_en: ['Everything in Pro', '15,000 messages/mo', '1,500 AI images/mo', '500 AI videos/mo', '25 projects', '50 integrations', '5 team seats', 'Concierge onboarding'],
    features_es: ['Todo en Pro', '15.000 mensajes/mes', '1.500 imágenes IA/mes', '500 vídeos IA/mes', '25 proyectos', '50 integraciones', '5 miembros de equipo', 'Onboarding concierge'],
  },
  {
    id: 'agency',
    icon: Gem,
    color: 'text-emerald-400',
    price_en: '$999 / month', price_es: '999 $ / mes',
    name_en: 'Agency', name_es: 'Agency',
    tagline_en: 'White-label for agencies', tagline_es: 'White-label para agencias',
    features_en: ['Everything in Studio', '50,000 messages/mo', '5,000 AI images/mo', 'Unlimited videos', 'Unlimited projects', '25 team seats', 'White-label (your domain)', 'Dedicated account manager'],
    features_es: ['Todo en Studio', '50.000 mensajes/mes', '5.000 imágenes IA/mes', 'Vídeos ilimitados', 'Proyectos ilimitados', '25 miembros de equipo', 'White-label (tu dominio)', 'Account manager dedicado'],
  },
];

const labels: Record<string, Record<string, string>> = {
  title: { en: 'Choose your plan', es: 'Elige tu plan' },
  subtitle: { en: 'All plans include a 7-day free trial. Cancel anytime.', es: 'Todos los planes incluyen 7 días de prueba gratis. Cancela cuando quieras.' },
  current: { en: 'Current plan', es: 'Plan actual' },
  upgrade: { en: 'Upgrade', es: 'Mejorar' },
  contact: { en: 'Talk to sales', es: 'Hablar con ventas' },
  popular: { en: 'Most popular', es: 'Más popular' },
  manage: { en: 'Manage subscription', es: 'Gestionar suscripción' },
  manage_desc: { en: 'Update payment method, download invoices, or cancel.', es: 'Actualiza método de pago, descarga facturas o cancela.' },
  open_portal: { en: 'Open billing portal', es: 'Abrir portal de facturación' },
  cancel_note: { en: 'Cancel or change your plan anytime. No hidden fees.', es: 'Cancela o cambia tu plan cuando quieras. Sin costes ocultos.' },
  active: { en: 'Active', es: 'Activo' },
  canceling: { en: 'Canceling at period end', es: 'Se cancela al final del periodo' },
  no_plan: { en: 'No active plan', es: 'Sin plan activo' },
};

export default function BillingPage() {
  const { locale } = useI18n();
  const l = (key: string) => labels[key]?.[locale] ?? labels[key]?.en ?? key;
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch('/api/billing/current').then(r => r.json()).then(data => {
      if (data.planId) setCurrent(data);
    }).catch(() => {});
  }, []);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (body.url) window.location.href = body.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setPortalLoading(false);
    }
  }

  const currentPlanId = current?.planId;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1080px] mx-auto space-y-8">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator AI</div>
        <h1 className="font-display text-[32px]">{l('title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{l('subtitle')}</p>
      </div>

      {/* Current plan status */}
      {current && (
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-[12px] text-gold font-medium uppercase tracking-[0.12em]">
              {current.cancelAtPeriodEnd ? l('canceling') : l('active')}
            </span>
            <span className="text-[14px] text-fg ml-2 font-display">
              {plans.find(p => p.id === currentPlanId)?.name_en ?? currentPlanId}
            </span>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="h-8 px-3 rounded-md border border-gold/40 bg-gold/10 text-[12px] text-gold font-medium hover:bg-gold/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {portalLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
            <span>{l('open_portal')}</span>
          </button>
        </div>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const features = locale === 'es' ? plan.features_es : plan.features_en;
          const name = locale === 'es' ? plan.name_es : plan.name_en;
          const tagline = locale === 'es' ? plan.tagline_es : plan.tagline_en;
          const price = locale === 'es' ? plan.price_es : plan.price_en;
          const isCurrent = currentPlanId === plan.id;
          const isAgency = plan.id === 'agency';

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border p-5 space-y-4 transition-all flex flex-col',
                plan.popular
                  ? 'border-gold/50 bg-gold/5 shadow-[0_0_30px_-10px_rgb(201_168_99_/_0.15)]'
                  : isCurrent
                  ? 'border-gold/30 bg-surface'
                  : 'border-border bg-surface hover:border-gold/30',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.16em] px-3 py-1 rounded-full gold-grad text-bg font-bold">
                  {l('popular')}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <Icon className={cn('h-5 w-5', plan.color)} />
                  <span className="font-display text-[18px]">{name}</span>
                </div>
                <div className="text-[11px] text-fg-muted">{tagline}</div>
                <div className="font-display text-[22px] mt-2">{price}</div>
              </div>
              <div className="space-y-1.5 flex-1">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-[12.5px] text-fg-soft">
                    <Check className={cn('h-3 w-3 mt-0.5 shrink-0', plan.popular ? 'text-gold' : 'text-fg-subtle')} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => isAgency ? window.open('mailto:sales@operatorai.app') : !isCurrent && handleCheckout(plan.id)}
                disabled={isCurrent || loading === plan.id}
                className={cn(
                  'w-full h-10 rounded-md text-[13px] font-medium transition-all flex items-center justify-center gap-2',
                  isCurrent
                    ? 'bg-surface-2 border border-gold/30 text-gold cursor-default'
                    : plan.popular
                    ? 'gold-grad text-bg shadow-[0_6px_20px_-6px_rgb(201_168_99_/_0.5)] hover:brightness-110'
                    : 'bg-surface-2 border border-border text-fg hover:border-gold/40 hover:text-gold',
                  loading === plan.id && 'opacity-60',
                )}
              >
                {loading === plan.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isCurrent ? l('current') : isAgency ? l('contact') : l('upgrade')}
              </button>
            </div>
          );
        })}
      </div>

      {/* Manage subscription */}
      {current && (
        <div className="rounded-lg border border-border bg-surface p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-display text-[15px]">{l('manage')}</div>
            <div className="text-[12.5px] text-fg-muted mt-0.5">{l('manage_desc')}</div>
          </div>
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="h-9 px-4 rounded-md bg-surface-2 border border-border text-[13px] text-fg hover:border-gold/40 hover:text-gold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            <span>{l('open_portal')}</span>
          </button>
        </div>
      )}

      <p className="text-center text-[12px] text-fg-subtle">{l('cancel_note')}</p>
    </div>
  );
}
