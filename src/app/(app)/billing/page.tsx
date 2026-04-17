'use client';
import { useI18n } from '@/lib/i18n';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'free',
    icon: Sparkles,
    color: 'text-fg-muted',
    features_en: ['5 AI conversations/day', 'Basic image generation', '1 project', 'Community support'],
    features_es: ['5 conversaciones IA/día', 'Generación de imagen básica', '1 proyecto', 'Soporte comunidad'],
  },
  {
    id: 'pro',
    icon: Zap,
    color: 'text-gold',
    popular: true,
    features_en: ['Unlimited conversations', 'HD image & video generation', '10 projects', 'Priority support', 'Voice mode', 'Integrations'],
    features_es: ['Conversaciones ilimitadas', 'Imagen y vídeo HD', '10 proyectos', 'Soporte prioritario', 'Modo voz', 'Integraciones'],
  },
  {
    id: 'agency',
    icon: Crown,
    color: 'text-purple-400',
    features_en: ['Everything in Pro', 'Unlimited projects', 'White-label options', 'API access', 'Dedicated support', 'Custom workflows'],
    features_es: ['Todo en Pro', 'Proyectos ilimitados', 'White-label', 'Acceso API', 'Soporte dedicado', 'Flujos personalizados'],
  },
];

const labels: Record<string, { en: string; es: string }> = {
  title: { en: 'Choose your plan', es: 'Elige tu plan' },
  subtitle: { en: 'Start free. Upgrade when you need more.', es: 'Empieza gratis. Mejora cuando necesites más.' },
  free: { en: 'Free', es: 'Gratis' },
  pro: { en: 'Pro', es: 'Pro' },
  agency: { en: 'Agency', es: 'Agencia' },
  free_price: { en: '$0 / month', es: '0 € / mes' },
  pro_price: { en: '$29 / month', es: '29 € / mes' },
  agency_price: { en: '$99 / month', es: '99 € / mes' },
  current: { en: 'Current plan', es: 'Plan actual' },
  upgrade: { en: 'Upgrade', es: 'Mejorar' },
  contact: { en: 'Contact us', es: 'Contáctanos' },
  popular: { en: 'Most popular', es: 'Más popular' },
  cancel_note: { en: 'You can cancel or change your plan at any time from this page.', es: 'Puedes cancelar o cambiar tu plan en cualquier momento desde esta página.' },
};

export default function BillingPage() {
  const { locale } = useI18n();
  const l = (key: string) => labels[key]?.[locale] ?? labels[key]?.en ?? key;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] mx-auto space-y-8">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator AI</div>
        <h1 className="font-display text-[32px]">{l('title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{l('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => {
          const Icon = plan.icon;
          const features = locale === 'es' ? plan.features_es : plan.features_en;
          const isFree = plan.id === 'free';
          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border p-6 space-y-5 transition-all',
                plan.popular
                  ? 'border-gold/50 bg-gold/5 shadow-[0_0_30px_-10px_rgb(201_168_99_/_0.15)]'
                  : 'border-border bg-surface hover:border-gold/30',
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.16em] px-3 py-1 rounded-full gold-grad text-bg font-bold">
                  {l('popular')}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg border flex items-center justify-center', plan.popular ? 'bg-gold/15 border-gold/30' : 'bg-surface-2 border-border')}>
                  <Icon className={cn('h-5 w-5', plan.color)} />
                </div>
                <div>
                  <div className="font-display text-[20px]">{l(plan.id)}</div>
                  <div className="text-[13px] text-fg-muted">{l(plan.id + '_price')}</div>
                </div>
              </div>
              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-[13px] text-fg-soft">
                    <Check className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', plan.popular ? 'text-gold' : 'text-fg-subtle')} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button
                className={cn(
                  'w-full h-10 rounded-md text-[13.5px] font-medium transition-all',
                  isFree
                    ? 'bg-surface-2 border border-border text-fg-muted'
                    : plan.popular
                    ? 'gold-grad text-bg shadow-[0_6px_20px_-6px_rgb(201_168_99_/_0.5)] hover:brightness-110'
                    : 'bg-surface-2 border border-border text-fg hover:border-gold/40 hover:text-gold',
                )}
              >
                {isFree ? l('current') : plan.id === 'agency' ? l('contact') : l('upgrade')}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[12px] text-fg-subtle">{l('cancel_note')}</p>
    </div>
  );
}
