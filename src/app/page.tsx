"use client";
import Link from 'next/link';
import { ArrowRight, Rocket, Target, Zap } from 'lucide-react';
import { useI18n, LanguageToggle } from '@/lib/i18n';

const t_landing: Record<string, Record<string, string>> = {
  badge: { en: 'Operator AI v1.1', es: 'Operator AI v1.1' },
  h1_1: { en: 'Deploy missions.', es: 'Despliega misiones.' },
  h1_2: { en: 'Not prompts.', es: 'No prompts.' },
  hero_p: {
    en: 'Operator AI is the autonomous operations platform for brands. Define an objective. Deploy a mission. Agents orchestrate the work. You review outcomes, not prompts.',
    es: 'Operator AI es la plataforma de operaciones autónomas para marcas. Define un objetivo. Despliega una misión. Los agentes orquestan el trabajo. Tú revisas resultados, no prompts.',
  },
  cta_trial: { en: 'Start 7-day free trial', es: 'Prueba gratis 7 días' },
  cta_pricing: { en: 'View pricing', es: 'Ver precios' },
  cta_login: { en: 'Log in', es: 'Iniciar sesion' },
  no_card: { en: 'No card required', es: 'Sin tarjeta' },
  from: { en: 'Starter from $29/mo', es: 'Starter desde 29 $/mes' },
  shift: { en: 'The shift', es: 'El cambio' },
  shift_h2_1: { en: 'From prompts to ', es: 'De prompts a ' },
  shift_h2_2: { en: 'operations', es: 'operaciones' },
  old_way: { en: 'The old way', es: 'La forma antigua' },
  old_title: { en: 'Write prompt. Copy. Edit. Repeat.', es: 'Escribe prompt. Copia. Edita. Repite.' },
  old_1: { en: 'Open 5 AI tools', es: 'Abrir 5 herramientas IA' },
  old_2: { en: 'Craft prompts for each', es: 'Escribir prompts para cada una' },
  old_3: { en: 'Manually copy outputs', es: 'Copiar resultados manualmente' },
  old_4: { en: 'Check every output for brand consistency', es: 'Revisar cada salida por consistencia de marca' },
  old_5: { en: 'No memory of what worked', es: 'Sin memoria de lo que funcionó' },
  new_way: { en: 'With Operator', es: 'Con Operator' },
  new_title: { en: 'Deploy mission. Review outcomes.', es: 'Despliega misión. Revisa resultados.' },
  new_1: { en: 'One objective, one click', es: 'Un objetivo, un click' },
  new_2: { en: 'Agents orchestrate automatically', es: 'Los agentes orquestan automáticamente' },
  new_3: { en: 'Brand OS enforces every output', es: 'Brand OS controla cada salida' },
  new_4: { en: 'Outcomes tracked, learning applied', es: 'Resultados medidos, aprendizaje aplicado' },
  new_5: { en: 'You approve. It executes.', es: 'Tú apruebas. Él ejecuta.' },
  pillars: { en: 'Three pillars', es: 'Tres pilares' },
  pillars_h2_1: { en: 'Everything runs on ', es: 'Todo funciona sobre ' },
  pillars_h2_2: { en: 'your brand', es: 'tu marca' },
  p_missions: { en: 'Missions', es: 'Misiones' },
  p_missions_d: { en: 'Deploy autonomous objectives. Agents generate, execute, and track for you.', es: 'Despliega objetivos autónomos. Los agentes generan, ejecutan y miden por ti.' },
  p_brand: { en: 'Brand OS', es: 'Brand OS' },
  p_brand_d: { en: 'Your colors, words, tone — enforced on every output. On-brand by default.', es: 'Tus colores, palabras, tono — aplicados en cada salida. Fiel a tu marca.' },
  p_workflows: { en: 'Workflows', es: 'Flujos' },
  p_workflows_d: { en: 'Multi-step automations with real integrations. Schedule, trigger, chain.', es: 'Automatizaciones multi-paso con integraciones reales. Programa, dispara, encadena.' },
  ready: { en: 'Ready when you are', es: 'Listo cuando tú lo estés' },
  ready_h2_1: { en: 'Run your brand like a ', es: 'Gestiona tu marca como un ' },
  ready_h2_2: { en: 'studio', es: 'estudio' },
  ready_p: { en: 'Start free for 7 days. No card required. Cancel anytime. Plans from $29/month.', es: 'Empieza gratis 7 días. Sin tarjeta. Cancela cuando quieras. Desde 29 $/mes.' },
  cta_free: { en: 'Start free trial', es: 'Prueba gratis' },
  cta_plans: { en: 'See plans', es: 'Ver planes' },
  nav_pricing: { en: 'Pricing', es: 'Precios' },
  nav_changelog: { en: 'Changelog', es: 'Cambios' },
  nav_login: { en: 'Log in', es: 'Entrar' },
  privacy: { en: 'Privacy', es: 'Privacidad' },
  terms: { en: 'Terms', es: 'Términos' },
  support: { en: 'Support', es: 'Soporte' },
};

export default function LandingPage() {
  const { locale } = useI18n();
  const l = (key: string) => t_landing[key]?.[locale] ?? t_landing[key]?.en ?? key;

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* Nav */}
      <header className="sticky top-0 z-30 glass border-b border-border">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between h-14 px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
            <div className="flex items-center gap-2">
              <span className="font-display text-[16px] tracking-tight">Operator</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-gold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20">AI</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold transition-colors">{l('nav_pricing')}</Link>
            <LanguageToggle />
            <Link href="/login" className="h-9 px-4 rounded-md border border-gold/30 bg-gold/10 text-gold text-[13px] font-medium flex items-center hover:bg-gold/20 transition-colors">{l('cta_login')}</Link>
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <LanguageToggle />
            <Link href="/login" className="h-9 px-4 rounded-md border border-gold/30 bg-gold/10 text-gold text-[13px] font-medium flex items-center hover:bg-gold/20 transition-colors">{l('cta_login')}</Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md gold-grad text-bg text-[12px] font-medium hover:brightness-110 transition"
            >
              <span>{l('cta_trial')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 lg:px-8 pt-20 lg:pt-28 pb-20 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[700px] rounded-full gold-grad opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="relative max-w-[920px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3.5 py-1 text-[11px] uppercase tracking-[0.14em] text-gold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>{l('badge')}</span>
          </div>
          <h1 className="font-display text-[52px] lg:text-[80px] leading-[0.98] mb-6">
            {l('h1_1')}<br />
            <span className="text-gold-grad">{l('h1_2')}</span>
          </h1>
          <p className="text-[16px] lg:text-[18px] text-fg-muted max-w-[620px] mx-auto leading-relaxed mb-10">
            {l('hero_p')}
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>{l('cta_trial')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              {l('cta_pricing')}
            </Link>
          </div>
          <p className="text-[11.5px] text-fg-subtle uppercase tracking-[0.14em]">
            {l('no_card')} &middot; {l('from')}
          </p>
        </div>
      </section>

      {/* Compare */}
      <section className="px-5 lg:px-8 pb-20">
        <div className="max-w-[920px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">{l('shift')}</div>
            <h2 className="font-display text-[32px] lg:text-[40px] leading-tight">
              {l('shift_h2_1')}<span className="text-gold-grad">{l('shift_h2_2')}</span>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-6 opacity-80">
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">{l('old_way')}</div>
              <div className="text-[16px] font-display mb-4">{l('old_title')}</div>
              <ul className="space-y-2 text-[13px] text-fg-muted">
                <li>&bull; {l('old_1')}</li>
                <li>&bull; {l('old_2')}</li>
                <li>&bull; {l('old_3')}</li>
                <li>&bull; {l('old_4')}</li>
                <li>&bull; {l('old_5')}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gold-grad opacity-[0.12] blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-3">{l('new_way')}</div>
                <div className="text-[16px] font-display mb-4">{l('new_title')}</div>
                <ul className="space-y-2 text-[13px] text-fg">
                  <li>&bull; {l('new_1')}</li>
                  <li>&bull; {l('new_2')}</li>
                  <li>&bull; {l('new_3')}</li>
                  <li>&bull; {l('new_4')}</li>
                  <li>&bull; {l('new_5')}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core pillars */}
      <section className="px-5 lg:px-8 pb-24">
        <div className="max-w-[1020px] mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">{l('pillars')}</div>
            <h2 className="font-display text-[32px] lg:text-[44px] leading-tight">
              {l('pillars_h2_1')}<span className="text-gold-grad">{l('pillars_h2_2')}</span>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Pillar icon={Rocket} title={l('p_missions')} description={l('p_missions_d')} />
            <Pillar icon={Target} title={l('p_brand')} description={l('p_brand_d')} />
            <Pillar icon={Zap} title={l('p_workflows')} description={l('p_workflows_d')} />
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="relative px-5 lg:px-8 py-24 border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-[500px] rounded-full gold-grad opacity-[0.05] blur-3xl pointer-events-none" />
        <div className="relative max-w-[720px] mx-auto text-center">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-3">{l('ready')}</div>
          <h2 className="font-display text-[40px] lg:text-[56px] leading-tight mb-5">
            {l('ready_h2_1')}<span className="text-gold-grad">{l('ready_h2_2')}</span>.
          </h2>
          <p className="text-[15px] text-fg-muted max-w-[500px] mx-auto mb-8">{l('ready_p')}</p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-md gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition"
            >
              <span>{l('cta_free')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 h-12 px-5 rounded-md border border-border bg-surface-2 text-fg text-[14px] hover:border-gold/40 transition"
            >
              {l('cta_plans')}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-5">
        <div className="max-w-[1020px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Operator AI" className="h-6 w-6 rounded" />
            <span className="text-[12px] text-fg-muted">&copy; {new Date().getFullYear()} Operator AI</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-fg-muted">
            <Link href="/pricing" className="hover:text-gold">{l('nav_pricing')}</Link>
            <Link href="/privacy" className="hover:text-gold">{l('privacy')}</Link>
            <Link href="/terms" className="hover:text-gold">{l('terms')}</Link>
            <Link href="/support" className="hover:text-gold">{l('support')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon: Icon, title, description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 hover:border-gold/40 transition-all">
      <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <h3 className="font-display text-[20px] mb-2">{title}</h3>
      <p className="text-[13.5px] text-fg-muted leading-relaxed">{description}</p>
    </div>
  );
}
