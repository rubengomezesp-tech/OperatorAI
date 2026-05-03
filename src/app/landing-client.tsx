'use client';

/**
 * Operator AI — Premium Landing
 *
 * Sections:
 *   1. Hero (magnetic CTAs + animated chat demo)
 *   2. How it works (3 steps with timeline)
 *   3. Live chat demo extended
 *   4. Verticals (marquee + grid)
 *   5. Capabilities (your marketing team)
 *   6. CTA final
 *   7. Footer
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Sparkles, Target, Palette, Video, Brain, Zap,
  Check, MessageSquare, Lightbulb, Rocket,
  Dumbbell, Shirt, Building2, UtensilsCrossed, ShoppingBag, Gem,
  Code2, HeartPulse, Plane,
} from 'lucide-react';
import { useI18n, LanguageToggle } from '@/lib/i18n';
import { Aurora } from '@/components/ui/aurora';
import { Magnetic } from '@/components/ui/magnetic';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { BrandLogo } from '@/components/brand/brand-logo';
import type { HomeContent } from '@/lib/home-content/defaults';

interface Props {
  content: HomeContent;
}

export function LandingPageClient({ content }: Props) {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const tx = (k: { es: string; en: string }) => (isEs ? k.es : k.en);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <main className="relative min-h-screen bg-bg text-fg overflow-x-hidden">
      <Aurora intensity="medium" />

      {/* ───────────────────────── NAV ───────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-bg/70 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <BrandLogo slot="home" size={32} />
            <span className="font-display text-[19px] tracking-tight group-hover:text-gold transition-colors">
              Operator
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 px-4 items-center text-[13.5px] text-fg-muted hover:text-fg transition-colors"
            >
              {isEs ? 'Entrar' : 'Log in'}
            </Link>
            <Link
              href="/signup"
              className="h-9 px-4 inline-flex items-center rounded-md gold-grad text-bg font-medium text-[13.5px] hover:scale-[1.02] transition-transform"
            >
              {tx(content.cta_primary)}
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────────────────── HERO ───────────────────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-20 sm:pt-32 pb-24 sm:pb-40 px-5 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 h-8 px-4 rounded-full border border-gold/30 bg-gold/[0.04] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
                <span className="text-[12px] uppercase tracking-[0.16em] text-gold-soft">
                  {tx(content.badge)}
                </span>
              </div>
            </motion.div>

            {/* Title — magnético */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-[44px] sm:text-[80px] lg:text-[100px] leading-[0.95] tracking-tight mb-2"
            >
              {tx(content.hero_title)}
            </motion.h1>
            <motion.h1
              variants={fadeUp}
              className="font-display text-[44px] sm:text-[80px] lg:text-[100px] leading-[0.95] tracking-tight mb-8"
            >
              <span className="gold-grad-text">{tx(content.hero_title_accent)}</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="text-[16px] sm:text-[20px] text-fg-muted max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {tx(content.hero_subtitle)}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
            >
              <Magnetic>
                <Link
                  href="/signup"
                  className="group h-13 px-8 inline-flex items-center justify-center gap-2 rounded-lg gold-grad text-bg font-medium text-[15px] shadow-[0_8px_30px_rgb(201_168_99_/_0.4)] hover:shadow-[0_12px_40px_rgb(201_168_99_/_0.55)] transition-all w-full sm:w-auto"
                  style={{ height: '52px' }}
                >
                  {tx(content.cta_primary)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>

              <Link
                href="#demo"
                className="h-13 px-6 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/60 backdrop-blur-md text-fg text-[14.5px] hover:bg-surface-3 hover:border-gold/30 transition-colors w-full sm:w-auto"
                style={{ height: '52px' }}
              >
                {tx(content.cta_secondary)}
              </Link>
            </motion.div>

            {/* Trial badge */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-2 text-[12.5px] text-fg-subtle"
            >
              <Check className="h-3.5 w-3.5 text-gold/70" />
              <span>{tx(content.trial_badge)}</span>
            </motion.div>
          </motion.div>

          {/* Animated chat demo */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
            className="mt-20 sm:mt-28 max-w-3xl mx-auto"
          >
            <AnimatedChatDemo content={content} />
          </motion.div>

          {/* Manifesto */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <p className="text-[13px] uppercase tracking-[0.18em] text-fg-subtle">
              {tx(content.manifesto)}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* ───────────────────────── HOW IT WORKS ───────────────────────── */}
      <Section>
        <SectionHeader
          kicker={tx(content.how_kicker)}
          title={tx(content.how_title)}
          subtitle={tx(content.how_subtitle)}
        />
        <div className="mt-16 max-w-4xl mx-auto space-y-6">
          {content.steps.map((step, i) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={tx(step.title)}
              desc={tx(step.desc)}
              timing={tx(step.timing)}
              delay={i * 0.1}
            />
          ))}
        </div>
      </Section>

      {/* ───────────────────────── VERTICALS ───────────────────────── */}
      <Section>
        <SectionHeader
          kicker={tx(content.verticals_kicker)}
          title={tx(content.verticals_title)}
          subtitle={tx(content.verticals_subtitle)}
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {content.verticals.map((v, i) => (
            <VerticalCard
              key={v.key}
              icon={VERTICAL_ICONS[v.key] ?? Sparkles}
              label={tx(v.label)}
              pitch={tx(v.pitch)}
              delay={i * 0.05}
            />
          ))}
        </div>
      </Section>

      {/* ───────────────────────── CAPABILITIES ───────────────────────── */}
      <Section>
        <SectionHeader
          kicker={tx(content.capabilities_kicker)}
          title={tx(content.capabilities_title)}
          subtitle={tx(content.capabilities_subtitle)}
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {content.capabilities.map((cap, i) => (
            <CapabilityCard
              key={cap.title.es}
              icon={CAPABILITY_ICONS[cap.icon]}
              title={tx(cap.title)}
              desc={tx(cap.desc)}
              delay={i * 0.07}
            />
          ))}
        </div>
      </Section>

      {/* ───────────────────────── FINAL CTA ───────────────────────── */}
      <section className="relative py-32 px-5 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.04] to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <div className="text-[12px] uppercase tracking-[0.2em] text-gold mb-6">
            {tx(content.final_kicker)}
          </div>
          <h2 className="font-display text-[40px] sm:text-[64px] leading-[1.05] tracking-tight mb-6">
            {tx(content.final_title)}
          </h2>
          <p className="text-[16px] sm:text-[18px] text-fg-muted mb-10 max-w-xl mx-auto">
            {tx(content.final_subtitle)}
          </p>
          <Magnetic>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 rounded-lg gold-grad text-bg font-medium text-[15.5px] shadow-[0_12px_40px_rgb(201_168_99_/_0.5)] hover:shadow-[0_18px_60px_rgb(201_168_99_/_0.65)] transition-all"
              style={{ height: '56px' }}
            >
              {tx(content.final_cta)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Magnetic>
          <p className="mt-5 text-[12.5px] text-fg-subtle">{tx(content.final_note)}</p>
        </motion.div>
      </section>

      {/* ───────────────────────── FOOTER ───────────────────────── */}
      <footer className="border-t border-border/50 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-fg-subtle">
          <div className="flex items-center gap-2">
            <BrandLogo slot="home" size={20} />
            <span>© {new Date().getFullYear()} Operator AI</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-fg-muted transition-colors">
              {isEs ? 'Privacidad' : 'Privacy'}
            </Link>
            <Link href="/terms" className="hover:text-fg-muted transition-colors">
              {isEs ? 'Términos' : 'Terms'}
            </Link>
            <Link href="/support" className="hover:text-fg-muted transition-colors">
              {isEs ? 'Soporte' : 'Support'}
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Animated chat demo
// ════════════════════════════════════════════════════════════════════════════

function AnimatedChatDemo({ content }: { content: HomeContent }) {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const userMsg = isEs
    ? 'Quiero lanzar una campaña fitness para mi nuevo programa'
    : 'I want to launch a fitness campaign for my new program';

  const operatorReplyParts = isEs
    ? [
        'Perfecto. Vamos.',
        'He preparado tu campaña completa:',
      ]
    : [
        'Got it. Here we go.',
        "I've prepared your full campaign:",
      ];

  const items = isEs
    ? ['Estrategia de campaña', 'Copy y ángulos', '3 anuncios diseñados', 'CTA y segmentación']
    : ['Campaign strategy', 'Copy and angles', '3 designed ads', 'CTA and segmentation'];

  return (
    <div ref={ref} id="demo" className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-gradient-to-r from-gold/10 via-gold/[0.08] to-gold/10 blur-3xl rounded-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-gold/15 bg-surface-2/40 backdrop-blur-xl shadow-[0_30px_80px_rgb(0_0_0_/_0.4)] overflow-hidden">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border/40 bg-bg/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-3 text-[11.5px] text-fg-muted">Operator · Creative Agent</span>
        </div>

        <div className="p-5 sm:p-7 space-y-4 min-h-[320px]">
          {/* User msg */}
          <AnimatePresence>
            {isInView && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end"
              >
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-gold/10 border border-gold/20 text-fg text-[14px]">
                  {userMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing indicator → reply */}
          <AnimatePresence>
            {isInView && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0">
                  <BrandLogo slot="logo" size={28} />
                </div>
                <div className="flex-1 max-w-[90%]">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-surface-3/80 border border-border text-[14px] text-fg-soft leading-relaxed">
                    <Typewriter texts={operatorReplyParts} startDelay={1.7} />

                    {/* Animated checklist */}
                    <motion.ul
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.5, duration: 0.5 }}
                      className="mt-3 space-y-1.5"
                    >
                      {items.map((item, i) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 3.7 + i * 0.15 }}
                          className="flex items-center gap-2 text-[13.5px]"
                        >
                          <Check className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Typewriter({ texts, startDelay = 0 }: { texts: string[]; startDelay?: number }) {
  const [shown, setShown] = useState<string[]>(texts.map(() => ''));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => setTimeout(r, startDelay * 1000));
      for (let t = 0; t < texts.length && !cancelled; t++) {
        const target = texts[t];
        for (let i = 1; i <= target.length && !cancelled; i++) {
          setShown((prev) => {
            const copy = [...prev];
            copy[t] = target.slice(0, i);
            return copy;
          });
          await new Promise((r) => setTimeout(r, 18));
        }
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {shown.map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-1' : ''}>
          {line}
        </p>
      ))}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Reusable components
// ════════════════════════════════════════════════════════════════════════════

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="text-center max-w-3xl mx-auto"
    >
      <div className="inline-flex items-center gap-2 mb-5">
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        <span className="text-[11.5px] uppercase tracking-[0.2em] text-gold-soft">{kicker}</span>
      </div>
      <h2 className="font-display text-[36px] sm:text-[56px] lg:text-[64px] leading-[1.05] tracking-tight mb-5">
        {title}
      </h2>
      <p className="text-[15.5px] sm:text-[17px] text-fg-muted leading-relaxed">{subtitle}</p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  desc,
  timing,
  delay,
}: {
  number: number;
  title: string;
  desc: string;
  timing: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className="group relative flex flex-col sm:flex-row gap-5 p-6 sm:p-8 rounded-2xl border border-border/60 bg-surface-2/40 backdrop-blur-md hover:border-gold/30 hover:bg-surface-2/60 transition-all"
    >
      <div className="flex-shrink-0">
        <div className="h-14 w-14 rounded-xl border border-gold/30 bg-gold/[0.06] flex items-center justify-center font-display text-[22px] text-gold group-hover:bg-gold/10 group-hover:scale-105 transition-all">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-[22px] sm:text-[26px] mb-2 tracking-tight">{title}</h3>
        <p className="text-[15px] text-fg-muted leading-relaxed mb-3">{desc}</p>
        <div className="inline-flex items-center gap-1.5 text-[12px] text-gold-soft">
          <Zap className="h-3 w-3" />
          <span className="uppercase tracking-wider">{timing}</span>
        </div>
      </div>
    </motion.div>
  );
}

function VerticalCard({
  icon: Icon,
  label,
  pitch,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pitch: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="group relative p-5 rounded-xl border border-border/60 bg-surface-2/40 backdrop-blur-md hover:border-gold/40 hover:bg-surface-2/70 transition-colors"
    >
      <div className="h-10 w-10 rounded-lg border border-gold/25 bg-gold/[0.05] flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-colors">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <h4 className="font-display text-[18px] mb-1.5 tracking-tight">{label}</h4>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{pitch}</p>
    </motion.div>
  );
}

function CapabilityCard({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.6, delay }}
      className="group relative p-6 sm:p-7 rounded-2xl border border-border/60 bg-surface-2/40 backdrop-blur-md hover:border-gold/30 transition-all overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="h-11 w-11 rounded-xl gold-grad flex items-center justify-center mb-5 shadow-[0_8px_20px_rgb(201_168_99_/_0.25)]">
          <Icon className="h-4.5 w-4.5 text-bg" />
        </div>
        <h3 className="font-display text-[20px] sm:text-[22px] mb-2 tracking-tight">{title}</h3>
        <p className="text-[14px] text-fg-muted leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Icon maps
// ════════════════════════════════════════════════════════════════════════════

const VERTICAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fitness: Dumbbell,
  beauty: Sparkles,
  'real-estate': Building2,
  restaurants: UtensilsCrossed,
  ecommerce: ShoppingBag,
  jewelry: Gem,
  saas: Code2,
  health: HeartPulse,
  travel: Plane,
};

const CAPABILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  target: Target,
  palette: Palette,
  video: Video,
  brain: Brain,
  zap: Zap,
};
