'use client';

/**
 * Operator AI — Premium Landing v2 (interactive demo)
 *
 * Click en cualquier vertical → demo del chat se reproduce con esa industria.
 * Selector de verticales arriba del demo permite cambiar al vuelo.
 * Cada vertical muestra 3 ads PNG editables desde admin.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Sparkles, Target, Palette, Video, Brain, Zap,
  Check, MessageSquare,
  Dumbbell, Building2, UtensilsCrossed, ShoppingBag, Gem,
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

  // Vertical activo en el demo
  const [activeVerticalKey, setActiveVerticalKey] = useState(content.verticals[0]?.key ?? 'fitness');
  const [demoNonce, setDemoNonce] = useState(0); // fuerza re-mount del demo al cambiar
  const demoRef = useRef<HTMLDivElement>(null);

  const activeVertical = content.verticals.find((v) => v.key === activeVerticalKey) ?? content.verticals[0];

  const handleVerticalClick = useCallback((key: string) => {
    setActiveVerticalKey(key);
    setDemoNonce((n) => n + 1);
    // scroll al demo
    setTimeout(() => {
      demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <main className="relative min-h-screen bg-bg text-fg overflow-x-hidden">
      <Aurora intensity="medium" />

      {/* NAV */}
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

      {/* HERO */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-20 sm:pt-32 pb-16 sm:pb-24 px-5 sm:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeUp} className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 h-8 px-4 rounded-full border border-gold/30 bg-gold/[0.04] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
                <span className="text-[12px] uppercase tracking-[0.16em] text-gold-soft">
                  {tx(content.badge)}
                </span>
              </div>
            </motion.div>

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

            <motion.p
              variants={fadeUp}
              className="text-[16px] sm:text-[20px] text-fg-muted max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {tx(content.hero_subtitle)}
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6"
            >
              <Magnetic>
                <Link
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 rounded-lg gold-grad text-bg font-medium text-[15px] shadow-[0_8px_30px_rgb(201_168_99_/_0.4)] hover:shadow-[0_12px_40px_rgb(201_168_99_/_0.55)] transition-all w-full sm:w-auto px-8"
                  style={{ height: '52px' }}
                >
                  {tx(content.cta_primary)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Magnetic>

              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-2/60 backdrop-blur-md text-fg text-[14.5px] hover:bg-surface-3 hover:border-gold/30 transition-colors w-full sm:w-auto px-6"
                style={{ height: '52px' }}
              >
                {tx(content.cta_secondary)}
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-2 text-[12.5px] text-fg-subtle"
            >
              <Check className="h-3.5 w-3.5 text-gold/70" />
              <span>{tx(content.trial_badge)}</span>
            </motion.div>
          </motion.div>

          {/* DEMO INTERACTIVO */}
          <motion.div
            ref={demoRef}
            id="demo"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
            className="mt-16 sm:mt-24 max-w-3xl mx-auto"
          >
            {/* Selector de verticales */}
            <div className="mb-5 flex items-center justify-center">
              <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-border/60 bg-surface-2/40 backdrop-blur-md overflow-x-auto max-w-full">
                {content.verticals.slice(0, 5).map((v) => {
                  const Icon = VERTICAL_ICONS[v.key] ?? Sparkles;
                  const active = v.key === activeVerticalKey;
                  return (
                    <button
                      key={v.key}
                      onClick={() => handleVerticalClick(v.key)}
                      className={
                        'flex items-center gap-1.5 h-8 px-3 rounded-full text-[12.5px] whitespace-nowrap transition-all ' +
                        (active
                          ? 'bg-gold text-bg font-medium shadow-[0_0_18px_rgb(201_168_99_/_0.4)]'
                          : 'text-fg-muted hover:text-fg hover:bg-surface-3')
                      }
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tx(v.label)}
                    </button>
                  );
                })}
              </div>
            </div>

            <ChatDemo key={demoNonce} vertical={activeVertical} isEs={isEs} />
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-[13px] uppercase tracking-[0.18em] text-fg-subtle">
              {tx(content.manifesto)}
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
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

      {/* VERTICALS — clickables */}
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
              active={v.key === activeVerticalKey}
              onClick={() => handleVerticalClick(v.key)}
            />
          ))}
        </div>

        <div className="mt-8 text-center text-[13px] text-fg-subtle">
          {isEs ? '↑ Pulsa cualquier industria para ver el demo en vivo' : '↑ Tap any industry to see the live demo'}
        </div>
      </Section>

      {/* CAPABILITIES */}
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

      {/* FINAL CTA */}
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

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] text-fg-subtle">
          <div className="flex items-center gap-2.5">
            <BrandLogo slot="footer" size={28} />
            <span className="text-fg-muted">© {new Date().getFullYear()} Operator AI</span>
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
// Chat Demo — dinámico según vertical
// ════════════════════════════════════════════════════════════════════════════

interface VerticalLike {
  key: string;
  demo: {
    user: { es: string; en: string };
    operatorIntro: { es: string; en: string };
    items: Array<{ es: string; en: string }>;
  };
}

function ChatDemo({ vertical, isEs }: { vertical: VerticalLike; isEs: boolean }) {
  const tx = (k: { es: string; en: string }) => (isEs ? k.es : k.en);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: '-100px' });
  const [showAds, setShowAds] = useState(false);

  useEffect(() => {
    setShowAds(false);
    const t = setTimeout(() => setShowAds(true), 4000);
    return () => clearTimeout(t);
  }, [vertical.key]);

  // URLs de los 3 ads desde admin
  const adKeys = [`demo-${vertical.key}-1`, `demo-${vertical.key}-2`, `demo-${vertical.key}-3`];

  return (
    <div ref={ref} className="relative">
      <div className="absolute -inset-6 bg-gradient-to-r from-gold/10 via-gold/[0.08] to-gold/10 blur-3xl rounded-3xl pointer-events-none" />

      <div className="relative rounded-2xl border border-gold/15 bg-surface-2/40 backdrop-blur-xl shadow-[0_30px_80px_rgb(0_0_0_/_0.4)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border/40 bg-bg/40">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="ml-3 text-[11.5px] text-fg-muted">Operator · {vertical.key}</span>
        </div>

        <div className="p-5 sm:p-7 space-y-4 min-h-[420px]">
          {/* User msg */}
          <AnimatePresence mode="wait">
            {isInView && (
              <motion.div
                key={`user-${vertical.key}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex justify-end"
              >
                <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-gold/10 border border-gold/20 text-fg text-[14px]">
                  {tx(vertical.demo.user)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Operator reply */}
          <AnimatePresence mode="wait">
            {isInView && (
              <motion.div
                key={`op-${vertical.key}`}
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
                    <Typewriter text={tx(vertical.demo.operatorIntro)} startDelay={1.7} />

                    <motion.ul
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3, duration: 0.5 }}
                      className="mt-3 space-y-1.5"
                    >
                      {vertical.demo.items.map((item, i) => (
                        <motion.li
                          key={`${vertical.key}-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 3.2 + i * 0.15 }}
                          className="flex items-center gap-2 text-[13.5px]"
                        >
                          <Check className="h-3.5 w-3.5 text-gold flex-shrink-0" />
                          <span>{tx(item)}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ads grid */}
          <AnimatePresence mode="wait">
            {isInView && showAds && (
              <motion.div
                key={`ads-${vertical.key}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-3 gap-2 pt-2"
              >
                {adKeys.map((adKey, i) => (
                  <DemoAd key={adKey} adKey={adKey} delay={i * 0.1} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DemoAd({ adKey, delay }: { adKey: string; delay: number }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/brand-assets/public?key=${adKey}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.url) setUrl(d.url); })
      .catch(() => {});
  }, [adKey]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="aspect-[4/5] rounded-lg overflow-hidden border border-gold/20 bg-surface-3 relative group"
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Demo ad" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-gold/5">
          <Sparkles className="h-6 w-6 text-gold/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/5 transition-colors" />
    </motion.div>
  );
}

function Typewriter({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await new Promise((r) => setTimeout(r, startDelay * 1000));
      for (let i = 1; i <= text.length && !cancelled; i++) {
        setShown(text.slice(0, i));
        await new Promise((r) => setTimeout(r, 18));
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <p>{shown}</p>;
}

// ════════════════════════════════════════════════════════════════════════════
// Reusable
// ════════════════════════════════════════════════════════════════════════════

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative py-24 sm:py-32 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

function SectionHeader({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
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

function StepCard({ number, title, desc, timing, delay }: { number: number; title: string; desc: string; timing: string; delay: number }) {
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
  icon: Icon, label, pitch, delay, active, onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; pitch: string; delay: number; active?: boolean; onClick?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={
        'group relative p-5 rounded-xl border backdrop-blur-md transition-all text-left ' +
        (active
          ? 'border-gold/60 bg-gold/[0.04] shadow-[0_0_30px_rgb(201_168_99_/_0.15)]'
          : 'border-border/60 bg-surface-2/40 hover:border-gold/40 hover:bg-surface-2/70')
      }
    >
      <div className={
        'h-10 w-10 rounded-lg flex items-center justify-center mb-4 transition-colors ' +
        (active ? 'bg-gold/20 border border-gold/40' : 'border border-gold/25 bg-gold/[0.05] group-hover:bg-gold/10')
      }>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <h4 className="font-display text-[18px] mb-1.5 tracking-tight">{label}</h4>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{pitch}</p>
      {active && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          Live
        </div>
      )}
    </motion.button>
  );
}

function CapabilityCard({ icon: Icon, title, desc, delay }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; delay: number }) {
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
          <Icon className="h-4 w-4 text-bg" />
        </div>
        <h3 className="font-display text-[20px] sm:text-[22px] mb-2 tracking-tight">{title}</h3>
        <p className="text-[14px] text-fg-muted leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

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
