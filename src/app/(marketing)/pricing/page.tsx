'use client';

/**
 * Pricing V3 — Premium 3-tier pricing
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import { Aurora } from '@/components/ui/aurora';
import { Magnetic } from '@/components/ui/magnetic';
import { fadeUp, staggerContainer } from '@/lib/motion';

const tx: Record<string, Record<string, string>> = {
  back: { en: '← Home', es: '← Inicio' },
  nav_login: { en: 'Log in', es: 'Entrar' },
  nav_signup: { en: 'Get started', es: 'Empezar' },
  kicker: { en: 'Pricing', es: 'Precios' },
  h1_a: { en: 'Plans that ', es: 'Planes que ' },
  h1_b: { en: 'scale with you.', es: 'escalan contigo.' },
  sub: { en: 'Start free. Upgrade when you need more. Cancel anytime.', es: 'Empieza gratis. Sube cuando necesites más. Cancela cuando quieras.' },
  popular: { en: 'Most popular', es: 'Más popular' },
  per_month: { en: '/month', es: '/mes' },
  free_t: { en: 'Free', es: 'Gratis' },
  free_d: { en: 'See if Operator fits.', es: 'Prueba si Operator encaja.' },
  free_cta: { en: 'Start free', es: 'Empezar gratis' },
  pro_t: { en: 'Pro', es: 'Pro' },
  pro_d: { en: 'For solo founders & small teams.', es: 'Para founders & equipos pequeños.' },
  pro_cta: { en: 'Start Pro trial', es: 'Probar Pro' },
  studio_t: { en: 'Studio', es: 'Studio' },
  studio_d: { en: 'For agencies & power users.', es: 'Para agencias & power users.' },
  studio_cta: { en: 'Talk to sales', es: 'Hablar con ventas' },
  faq_kicker: { en: 'Questions', es: 'Preguntas' },
  faq_h2: { en: 'Frequently asked', es: 'Frecuentes' },
  faq_1_q: { en: 'Can I cancel anytime?', es: '¿Puedo cancelar cuando quiera?' },
  faq_1_a: { en: 'Yes. Cancel from settings, no questions asked.', es: 'Sí. Cancela desde ajustes, sin preguntas.' },
  faq_2_q: { en: 'What does ~5 minutes mean?', es: '¿Qué significa ~5 minutos?' },
  faq_2_a: { en: 'A full campaign — strategy, copy, 4 visuals — runs in ~5 minutes. Faster than describing it to a designer.', es: 'Una campaña completa — estrategia, copy, 4 visuales — corre en ~5 minutos. Más rápido que describirlo a un diseñador.' },
  faq_3_q: { en: 'Can I use my own brand?', es: '¿Puedo usar mi propia marca?' },
  faq_3_a: { en: 'Yes. Upload your logo, colors, and voice in Brand OS. Operator applies them to every output.', es: 'Sí. Sube logo, colores y tono en Brand OS. Operator los aplica en cada output.' },
  faq_4_q: { en: 'Does it work for my industry?', es: '¿Funciona para mi industria?' },
  faq_4_a: { en: '17 verticals with real visual DNA: hotels, jewelry, fitness, fashion, tech, real estate, beauty, food, and more.', es: '17 verticales con DNA visual real: hoteles, joyería, fitness, moda, tech, inmobiliaria, beauty, food, y más.' },
};

const PLANS = [
  {
    id: 'free',
    nameKey: 'free_t',
    descKey: 'free_d',
    price: '0',
    ctaKey: 'free_cta',
    ctaHref: '/signup',
    icon: Sparkles,
    highlighted: false,
    features: {
      en: ['10 chats / month', '1 brand', '1 campaign / month', 'Basic vertical DNA', 'Community support'],
      es: ['10 chats / mes', '1 marca', '1 campaña / mes', 'DNA vertical básico', 'Soporte comunidad'],
    },
  },
  {
    id: 'pro',
    nameKey: 'pro_t',
    descKey: 'pro_d',
    price: '29',
    ctaKey: 'pro_cta',
    ctaHref: '/signup?plan=pro',
    icon: Zap,
    highlighted: true,
    features: {
      en: [
        'Unlimited chats',
        '3 brands',
        '20 campaigns / month',
        'All 17 verticals (full DNA)',
        'Editor PRO with AI Rewrite',
        'Priority generation',
        'Email support',
      ],
      es: [
        'Chats ilimitados',
        '3 marcas',
        '20 campañas / mes',
        'Las 17 verticales (DNA completo)',
        'Editor PRO con AI Rewrite',
        'Generación prioritaria',
        'Soporte por email',
      ],
    },
  },
  {
    id: 'studio',
    nameKey: 'studio_t',
    descKey: 'studio_d',
    price: '99',
    ctaKey: 'studio_cta',
    ctaHref: '/signup?plan=studio',
    icon: Crown,
    highlighted: false,
    features: {
      en: [
        'Everything in Pro',
        'Unlimited brands',
        'Unlimited campaigns',
        'White label exports',
        'API access',
        'Priority support',
        'Custom verticals on request',
      ],
      es: [
        'Todo lo de Pro',
        'Marcas ilimitadas',
        'Campañas ilimitadas',
        'Exports white label',
        'Acceso API',
        'Soporte prioritario',
        'Verticales custom bajo petición',
      ],
    },
  },
];

export default function PricingPage() {
  const { locale } = useI18n();
  const t = (key: string) => tx[key]?.[locale] ?? tx[key]?.en ?? key;

  return (
    <main className="relative overflow-hidden bg-bg min-h-screen">
      {/* Aurora */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Aurora intensity="medium" />
      </div>

      {/* Top nav */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-fg-muted hover:text-fg transition-colors text-[13.5px]">
          {t('back')}
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />
          <Link href="/login" className="text-[13.5px] text-fg-muted hover:text-fg transition-colors px-3 py-1.5">
            {t('nav_login')}
          </Link>
          <Link
            href="/signup"
            className="text-[13.5px] gold-grad text-bg px-3.5 py-1.5 rounded-md font-medium hover:brightness-110 transition-all"
          >
            {t('nav_signup')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-12 pb-12 sm:pt-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('kicker')}
          </motion.div>
          <motion.h1 variants={fadeUp} className="font-display text-[44px] sm:text-[64px] leading-[0.95] tracking-tight mb-5">
            {t('h1_a')}
            <span className="text-gold-grad">{t('h1_b')}</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-[15px] sm:text-[16.5px] text-fg-muted max-w-xl mx-auto">
            {t('sub')}
          </motion.p>
        </motion.div>
      </section>

      {/* Plans grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const features = plan.features[locale === 'es' ? 'es' : 'en'];
            return (
              <motion.div
                key={plan.id}
                variants={fadeUp}
                className={`relative rounded-2xl p-7 backdrop-blur-md transition-all ${
                  plan.highlighted
                    ? 'border-2 border-gold/40 bg-gradient-to-br from-gold/10 via-surface-2 to-surface-2 shadow-[0_8px_40px_-8px_rgb(201_168_99_/_0.25)]'
                    : 'border border-border bg-surface-2/60'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] px-3 py-1 rounded-full gold-grad text-bg font-bold">
                    {t('popular')}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <div
                    className={`h-9 w-9 rounded-md flex items-center justify-center ${
                      plan.highlighted ? 'gold-grad' : 'bg-surface-3 border border-border'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${plan.highlighted ? 'text-bg' : 'text-fg-muted'}`} />
                  </div>
                  <h3 className="font-display text-[22px] tracking-tight">{t(plan.nameKey)}</h3>
                </div>

                <p className="text-[13px] text-fg-muted mb-6">{t(plan.descKey)}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-[44px] tracking-tight">${plan.price}</span>
                  {plan.price !== '0' && (
                    <span className="text-[13.5px] text-fg-muted">{t('per_month')}</span>
                  )}
                </div>

                <Magnetic strength={0.2}>
                  <Link
                    href={plan.ctaHref}
                    className={`flex items-center justify-center gap-2 h-11 px-5 rounded-md font-medium text-[14px] mb-7 w-full transition-all ${
                      plan.highlighted
                        ? 'gold-grad text-bg hover:brightness-110 shadow-[0_6px_24px_-6px_rgb(201_168_99_/_0.5)]'
                        : 'bg-transparent border border-border-strong text-fg hover:border-gold hover:text-gold'
                    }`}
                  >
                    {t(plan.ctaKey)}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Magnetic>

                <ul className="space-y-2.5">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-fg-soft">
                      <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-gold' : 'text-fg-muted'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 sm:px-8 py-20 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-12"
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('faq_kicker')}
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-[36px] sm:text-[48px] tracking-tight">
            {t('faq_h2')}
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-3"
        >
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="p-5 rounded-lg bg-surface-2/60 backdrop-blur-sm border border-border"
            >
              <h3 className="text-[14.5px] font-medium text-fg mb-2">
                {t(`faq_${i}_q`)}
              </h3>
              <p className="text-[13.5px] text-fg-muted leading-relaxed">
                {t(`faq_${i}_a`)}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
