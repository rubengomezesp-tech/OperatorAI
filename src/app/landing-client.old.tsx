'use client';

/**
 * Landing V3 — Premium hero + cinematic sections
 *
 * Inspired by: Anthropic, Linear, Vercel, Lovable, Cursor
 *
 * Key principles:
 *   - Aurora intense as background (sets premium tone)
 *   - Display font for impact (Instrument Serif)
 *   - Magnetic CTAs (subtle but felt)
 *   - Scroll-triggered reveals
 *   - Animated chat mockup (the hero of the page)
 *   - Mobile-perfect
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Palette,
  Check,
  Star,
  MessageSquare,
} from 'lucide-react';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import { Aurora } from '@/components/ui/aurora';
import { OperatorBg } from '@/components/layout/operator-bg';
import { Magnetic } from '@/components/ui/magnetic';
import { fadeUp, staggerContainer, scaleIn } from '@/lib/motion';
import dynamic from 'next/dynamic';
import { BrandLogo } from '@/components/brand/brand-logo';

const GuestChat = dynamic(() => import('@/features/landing/components/guest-chat').then(m => m.GuestChat), {
  ssr: false,
  loading: () => <div className="h-[420px] rounded-2xl glass-subtle animate-pulse" />,
});


// ─────────────────────────────────────────────────────────────────
// i18n
// ─────────────────────────────────────────────────────────────────

const tx: Record<string, Record<string, string>> = {
  // Nav
  nav_pricing: { en: 'Pricing', es: 'Precios' },
  nav_login: { en: 'Log in', es: 'Entrar' },
  nav_signup: { en: 'Get started', es: 'Empezar' },

  // Badge
  hero_badge: { en: 'New · AI Operator for marketing', es: 'Nuevo · AI Operator para marketing' },

  // Hero
  hero_h1_a: { en: 'Stop creating campaigns.', es: 'Deja de crear campañas.' },
  hero_h1_b: { en: 'Start launching them.', es: 'Empieza a lanzarlas.' },
  hero_p: {
    en: 'Operator is your creative director, strategist, and designer — in one conversation. From idea to publish-ready in 5 minutes.',
    es: 'Operator es tu director creativo, estratega y diseñador — en una sola conversación. De idea a publicar en 5 minutos.',
  },
  hero_cta_primary: { en: 'Start free trial', es: 'Empezar gratis' },
  hero_cta_secondary: { en: 'See it in action', es: 'Ver demo' },
  hero_no_card: { en: 'No card required · 7-day trial', es: 'Sin tarjeta · 7 días gratis' },

  guest_section_kicker: { en: 'Try it now', es: 'Pruébalo ya' },
  guest_section_h2_a: { en: 'Talk to Operator. ', es: 'Habla con Operator. ' },
  guest_section_h2_b: { en: 'No signup needed.', es: 'Sin cuenta.' },
  guest_section_p: { en: '3 free messages. See how the agent thinks before you commit.', es: '3 mensajes gratis. Mira cómo piensa el agente antes de comprometerte.' },


  // Mockup chat
  mockup_user_msg: { en: 'I want to launch a fitness campaign for my new program', es: 'Quiero lanzar una campaña fitness para mi nuevo programa' },
  mockup_agent_typing: { en: 'Operator is thinking...', es: 'Operator está pensando...' },
  mockup_agent_msg: { en: 'Got it. Authority-led angle works best for fitness — show real transformation. I can build the full campaign with strategy + 4 visuals in ~5 min.', es: 'Entendido. El ángulo de autoridad funciona mejor en fitness — muestra transformación real. Puedo construir la campaña completa con estrategia + 4 visuales en ~5 min.' },
  mockup_action_card: { en: 'Generate full campaign · ~5 min', es: 'Generar campaña completa · ~5 min' },

  // Power section
  power_kicker: { en: 'Why Operator', es: 'Por qué Operator' },
  power_h2_a: { en: 'A creative team that ', es: 'Un equipo creativo que ' },
  power_h2_b: { en: 'never sleeps', es: 'nunca duerme' },
  power_1_t: { en: '5 minutes vs 5 days', es: '5 minutos vs 5 días' },
  power_1_d: { en: 'From brief to publish-ready assets in the time it takes to make coffee.', es: 'De brief a assets listos en lo que tardas en hacerte un café.' },
  power_2_t: { en: '17 industries · real DNA', es: '17 industrias · DNA real' },
  power_2_d: { en: 'Hotel campaigns look like hotels. Jewelry like jewelry. Fitness like fitness. Real visual language per industry.', es: 'Campañas de hotel parecen hoteles. Joyería como joyería. Fitness como fitness. Lenguaje visual real por industria.' },
  power_3_t: { en: 'Agency quality, instant', es: 'Calidad agencia, instante' },
  power_3_d: { en: 'AI vision critic iterates until quality passes. No more uncanny outputs.', es: 'AI vision critic itera hasta pasar calidad. Sin outputs raros.' },

  // How
  how_kicker: { en: 'How it works', es: 'Cómo funciona' },
  how_h2_a: { en: 'Three steps. ', es: 'Tres pasos. ' },
  how_h2_b: { en: 'No design skills.', es: 'Sin habilidades de diseño.' },
  how_1_t: { en: 'Chat naturally', es: 'Habla normal' },
  how_1_d: { en: 'Tell Operator what you need — like talking to your CMO.', es: 'Cuéntale qué necesitas — como hablar con tu CMO.' },
  how_2_t: { en: 'Approve direction', es: 'Aprueba dirección' },
  how_2_d: { en: 'Operator proposes strategy. You confirm. It executes.', es: 'Operator propone estrategia. Confirmas. Ejecuta.' },
  how_3_t: { en: 'Refine & launch', es: 'Refina & lanza' },
  how_3_d: { en: 'Edit details in our pro editor. Export ready for any platform.', es: 'Edita detalles en el editor pro. Exporta listo para cualquier plataforma.' },

  // Verticals
  verticals_kicker: { en: 'Built for your industry', es: 'Hecho para tu industria' },
  verticals_h2_a: { en: 'Real visual DNA per ', es: 'DNA visual real por ' },
  verticals_h2_b: { en: 'vertical', es: 'vertical' },

  // Final CTA
  final_h2_a: { en: 'Ready to ', es: '¿Listo para tener tu ' },
  final_h2_b: { en: 'have your AI agency inside?', es: 'agencia AI dentro?' },
  final_p: { en: 'Start free for 7 days. Plans from $29/month. Cancel anytime.', es: 'Empieza gratis 7 días. Planes desde 29 $/mes. Cancela cuando quieras.' },
  final_cta: { en: 'Start free trial', es: 'Empezar gratis' },
  final_pricing: { en: 'See pricing', es: 'Ver precios' },

  // Footer
  footer_privacy: { en: 'Privacy', es: 'Privacidad' },
  footer_terms: { en: 'Terms', es: 'Términos' },
  footer_support: { en: 'Support', es: 'Soporte' },
  footer_made: { en: 'Made with intention.', es: 'Hecho con intención.' },
};

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────

export function LandingPageClient() {
  const { locale } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasSession = document.cookie.split(';').some(c => c.trim().startsWith('sb-'));
    setIsAuthenticated(hasSession);
  }, []);
  const t = (key: string) => tx[key]?.[locale] ?? tx[key]?.en ?? key;

  return (
    <main className="relative overflow-hidden bg-bg">
      {/* Aurora as fixed background — stays as you scroll */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Aurora intensity="medium" />
      <OperatorBg variant="landing" />
      </div>

      {/* Top nav */}
      <nav className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-fg hover:opacity-80 transition-opacity">
          <BrandLogo slot="home" size={32} />
          <span className="font-display text-[18px] tracking-tight">Operator</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageToggle />
          <Link
            href="/pricing"
            className="hidden sm:inline-flex text-[13.5px] text-fg-muted hover:text-fg transition-colors px-3 py-1.5"
          >
            {t('nav_pricing')}
          </Link>
          <Link
            href="/login"
            className="text-[13.5px] text-fg-muted hover:text-fg transition-colors px-3 py-1.5"
          >
            {t('nav_login')}
          </Link>
          <Link
            href={isAuthenticated ? "/chat" : "/signup"}
            className="text-[13.5px] gold-grad text-bg px-3.5 py-1.5 rounded-md font-medium hover:brightness-110 transition-all shadow-[0_4px_20px_-4px_rgb(201_168_99_/_0.4)]"
          >
            {isAuthenticated ? (locale === 'es' ? 'Abrir app' : 'Open app') : t('nav_signup')}
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 pt-12 sm:pt-20 pb-24 sm:pb-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2/80 border border-border text-[11.5px] text-fg-muted backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
              {t('hero_badge')}
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-[44px] sm:text-[64px] lg:text-[80px] leading-[0.95] tracking-tight text-fg mb-5"
          >
            {t('hero_h1_a')}
            <br />
            <span className="text-gold-grad">{t('hero_h1_b')}</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={fadeUp}
            className="text-[15px] sm:text-[17px] text-fg-muted max-w-2xl mx-auto leading-relaxed mb-9"
          >
            {t('hero_p')}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Magnetic strength={0.25}>
              <Link
                href="/signup"
                className="group flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg font-medium text-[14.5px] hover:brightness-110 transition-all shadow-[0_8px_32px_-8px_rgb(201_168_99_/_0.5)]"
              >
                {t('hero_cta_primary')}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Magnetic>
            <Link
              href="#how"
              className="flex items-center gap-2 h-12 px-5 text-[14px] text-fg-soft hover:text-fg transition-colors"
            >
              <span className="border-b border-fg-soft/30 hover:border-fg/50 pb-0.5">
                {t('hero_cta_secondary')}
              </span>
            </Link>
          </motion.div>

          {/* No card */}
          <motion.p
            variants={fadeUp}
            className="text-[12.5px] text-fg-subtle"
          >
            {t('hero_no_card')}
          </motion.p>
        </motion.div>

        {/* Animated chat mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 sm:mt-20 max-w-3xl mx-auto"
        >
          <ChatMockup t={t} />
        </motion.div>
      </section>

      {/* GUEST CHAT — Try Operator now (no signup) */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 py-20 sm:py-28 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center mb-10"
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('guest_section_kicker')}
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="font-display text-[36px] sm:text-[48px] leading-[1.05] tracking-tight mb-3"
          >
            {t('guest_section_h2_a')}
            <span className="text-gold-grad">{t('guest_section_h2_b')}</span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[14.5px] text-fg-muted max-w-xl mx-auto"
          >
            {t('guest_section_p')}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <GuestChat />
        </motion.div>
      </section>

      {/* POWER SECTION */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('power_kicker')}
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-[36px] sm:text-[48px] leading-[1.05] tracking-tight">
            {t('power_h2_a')}
            <span className="text-gold-grad">{t('power_h2_b')}</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <PowerCard variants={fadeUp} icon={Zap} title={t('power_1_t')} desc={t('power_1_d')} />
          <PowerCard variants={fadeUp} icon={Target} title={t('power_2_t')} desc={t('power_2_d')} />
          <PowerCard variants={fadeUp} icon={Sparkles} title={t('power_3_t')} desc={t('power_3_d')} />
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('how_kicker')}
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-[36px] sm:text-[48px] leading-[1.05] tracking-tight">
            {t('how_h2_a')}
            <br />
            <span className="text-gold-grad">{t('how_h2_b')}</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
        >
          <HowStep variants={fadeUp} num="01" title={t('how_1_t')} desc={t('how_1_d')} icon={MessageSquare} />
          <HowStep variants={fadeUp} num="02" title={t('how_2_t')} desc={t('how_2_d')} icon={Sparkles} />
          <HowStep variants={fadeUp} num="03" title={t('how_3_t')} desc={t('how_3_d')} icon={Palette} />
        </motion.div>
      </section>

      {/* VERTICALS */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 py-24 sm:py-32 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <motion.div variants={fadeUp} className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">
            {t('verticals_kicker')}
          </motion.div>
          <motion.h2 variants={fadeUp} className="font-display text-[36px] sm:text-[48px] leading-[1.05] tracking-tight">
            {t('verticals_h2_a')}
            <span className="text-gold-grad">{t('verticals_h2_b')}</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5"
        >
          {[
            { en: 'Hotels & Travel', es: 'Hoteles y Viajes', emoji: '🏨' },
            { en: 'Jewelry & Luxury', es: 'Joyería y Lujo', emoji: '💎' },
            { en: 'Restaurants', es: 'Restaurantes', emoji: '🍽️' },
            { en: 'Fitness', es: 'Fitness', emoji: '💪' },
            { en: 'Beauty', es: 'Beauty', emoji: '✨' },
            { en: 'Fashion', es: 'Moda', emoji: '👗' },
            { en: 'Tech & SaaS', es: 'Tech y SaaS', emoji: '⚡' },
            { en: 'Real Estate', es: 'Inmobiliaria', emoji: '🏛️' },
            { en: 'Home Decor', es: 'Decoración', emoji: '🛋️' },
            { en: 'Health', es: 'Salud', emoji: '🩺' },
            { en: 'Education', es: 'Educación', emoji: '📚' },
            { en: 'Automotive', es: 'Automoción', emoji: '🚗' },
          ].map((v, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="px-4 py-3 rounded-md bg-surface-2 border border-border text-[13px] text-fg-soft hover:border-gold/40 transition-colors flex items-center gap-2"
            >
              <span className="text-lg">{v.emoji}</span>
              <span className="truncate">{locale === 'es' ? v.es : v.en}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 py-24 sm:py-32 border-t border-border">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="text-center"
        >
          <motion.h2 variants={fadeUp} className="font-display text-[36px] sm:text-[56px] leading-[1.05] tracking-tight mb-6">
            {t('final_h2_a')}
            <span className="text-gold-grad">{t('final_h2_b')}</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-fg-muted max-w-xl mx-auto mb-10 text-[15px]">
            {t('final_p')}
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Magnetic strength={0.25}>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 h-12 px-7 rounded-md gold-grad text-bg font-medium text-[14.5px] hover:brightness-110 transition-all shadow-[0_8px_32px_-8px_rgb(201_168_99_/_0.5)]"
              >
                {t('final_cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Magnetic>
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-transparent text-fg border border-border-strong hover:border-gold transition-colors text-[14px]"
            >
              {t('final_pricing')}
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────
// Reusable parts
// ─────────────────────────────────────────────────────────────────

function PowerCard({
  icon: Icon,
  title,
  desc,
  variants,
}: {
  icon: typeof Zap;
  title: string;
  desc: string;
  variants: any;
}) {
  return (
    <motion.div
      variants={variants}
      className="group relative p-6 rounded-lg bg-surface-2/60 backdrop-blur-sm border border-border hover:border-gold/40 transition-all"
    >
      <div className="h-10 w-10 rounded-md bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
        <Icon className="h-4.5 w-4.5 text-gold" />
      </div>
      <h3 className="text-[15.5px] font-medium text-fg mb-1.5 leading-tight">{title}</h3>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function HowStep({
  num,
  title,
  desc,
  icon: Icon,
  variants,
}: {
  num: string;
  title: string;
  desc: string;
  icon: typeof Zap;
  variants: any;
}) {
  return (
    <motion.div
      variants={variants}
      className="relative p-6 rounded-lg bg-surface-2/40 backdrop-blur-sm border border-border"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold font-mono">{num}</div>
        <Icon className="h-4 w-4 text-fg-muted" />
      </div>
      <h3 className="text-[16px] font-medium text-fg mb-2 leading-tight">{title}</h3>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Animated chat mockup
// ─────────────────────────────────────────────────────────────────

function ChatMockup({ t }: { t: (k: string) => string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-2xl bg-surface-2/80 backdrop-blur-md border border-border shadow-2xl overflow-hidden">
      {/* Mock header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface/50">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        </div>
        <div className="ml-3 text-[11.5px] text-fg-muted">Operator · Creative Agent</div>
      </div>

      {/* Mock conversation */}
      <div className="px-5 sm:px-7 py-7 space-y-4 min-h-[280px]">
        {/* User message */}
        {step >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-end"
          >
            <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-gold/15 border border-gold/20 text-[13.5px] text-fg">
              {t('mockup_user_msg')}
            </div>
          </motion.div>
        )}

        {/* Agent typing */}
        {step >= 2 && step < 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-[12px] text-fg-muted"
          >
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
            </div>
            <span>{t('mockup_agent_typing')}</span>
          </motion.div>
        )}

        {/* Agent message + action card */}
        {step >= 3 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-start"
            >
              <div className="max-w-[88%] rounded-xl px-4 py-3 bg-surface border border-border text-[13.5px] text-fg leading-relaxed">
                {t('mockup_agent_msg')}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex"
            >
              <button className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-gold/15 via-surface-2 to-surface-2 border border-gold/40 hover:border-gold/60 transition-colors">
                <div className="h-8 w-8 rounded-md bg-gold/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-gold" />
                </div>
                <div className="text-left">
                  <div className="text-[13px] font-medium text-fg">
                    {t('mockup_action_card')}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-fg-muted" />
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
