'use client';
import { useState } from 'react';
import { Rocket, Target, Zap, TrendingUp, Brain, Calendar, BarChart3, Mail, Bell, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const capabilities = [
  { icon: Target, color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20' },
  { icon: Brain, color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20' },
  { icon: Calendar, color: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20' },
  { icon: BarChart3, color: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/20' },
  { icon: Mail, color: 'from-pink-500/20 to-pink-500/5', border: 'border-pink-500/20' },
  { icon: Zap, color: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/20' },
];

const l: Record<string, Record<string, string>> = {
  kicker: { en: 'Coming soon', es: 'Próximamente' },
  h1_1: { en: 'Autonomous', es: 'Operaciones' },
  h1_2: { en: 'operations', es: 'autónomas' },
  h1_3: { en: 'are coming.', es: 'en camino.' },
  subtitle: {
    en: 'Define an objective. Operator deploys agents that generate content, run campaigns, track analytics, and adapt strategy — autonomously. You set the goal. AI executes the mission.',
    es: 'Define un objetivo. Operator despliega agentes que generan contenido, ejecutan campañas, miden analíticas y adaptan la estrategia — de forma autónoma. Tú pones la meta. La IA ejecuta la misión.',
  },
  cap1: { en: 'Autonomous campaign execution', es: 'Ejecución autónoma de campañas' },
  cap2: { en: 'Multi-agent orchestration', es: 'Orquestación multi-agente' },
  cap3: { en: 'Scheduled content generation', es: 'Generación de contenido programada' },
  cap4: { en: 'Real-time analytics & adaptation', es: 'Analíticas en tiempo real y adaptación' },
  cap5: { en: 'Email & social automation', es: 'Automatización email y redes sociales' },
  cap6: { en: 'Workflow chains with integrations', es: 'Cadenas de flujos con integraciones' },
  notify: { en: 'Notify me when it launches', es: 'Avisarme cuando se lance' },
  notified: { en: 'We will notify you at launch', es: 'Te avisaremos en el lanzamiento' },
  building: { en: 'What we are building', es: 'Lo que estamos construyendo' },
  timeline_title: { en: 'The most powerful AI operations engine ever built.', es: 'El motor de operaciones IA más potente jamás construido.' },
  phase1: { en: 'Mission templates', es: 'Plantillas de misión' },
  phase1d: { en: '30-day growth plans, campaign kits, content calendars — ready to deploy.', es: 'Planes de crecimiento de 30 días, kits de campaña, calendarios de contenido — listos para desplegar.' },
  phase2: { en: 'Agent orchestration', es: 'Orquestación de agentes' },
  phase2d: { en: 'Multiple specialized agents working together on one objective. Copy, design, strategy, analytics.', es: 'Múltiples agentes especializados trabajando juntos en un objetivo. Copy, diseño, estrategia, analítica.' },
  phase3: { en: 'Autonomous execution', es: 'Ejecución autónoma' },
  phase3d: { en: 'Set it and forget it. Missions run on schedule, generate outputs, measure results, and adapt.', es: 'Configúralo y olvídate. Las misiones se ejecutan programadas, generan resultados, miden y se adaptan.' },
  meanwhile: { en: 'Meanwhile, everything else is ready', es: 'Mientras tanto, todo lo demás está listo' },
  chat_cta: { en: 'Open Creative Agent', es: 'Abrir Agente Creativo' },
};

export function MissionsContent({ missions }: { missions: any[] }) {
  const { locale } = useI18n();
  const t = (key: string) => l[key]?.[locale] ?? l[key]?.en ?? key;
  const [notified, setNotified] = useState(false);

  function handleNotify() {
    setNotified(true);
    toast.success(t('notified'));
    // Could call an API to save the interest
  }

  const caps = [t('cap1'), t('cap2'), t('cap3'), t('cap4'), t('cap5'), t('cap6')];

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-12">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-surface via-bg to-surface-2 p-10 lg:p-14 text-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full gold-grad opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full gold-grad opacity-[0.04] blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gold mb-6">
            <div className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>{t('kicker')}</span>
          </div>

          <h1 className="font-display text-[44px] lg:text-[64px] leading-[0.95] mb-6">
            <span className="text-gold-grad">{t('h1_1')}</span>
            <br />
            {t('h1_2')}
            <br />
            <span className="text-fg-muted">{t('h1_3')}</span>
          </h1>

          <p className="text-[15px] lg:text-[16px] text-fg-muted max-w-[600px] mx-auto leading-relaxed mb-10">
            {t('subtitle')}
          </p>

          <button
            type="button"
            onClick={handleNotify}
            disabled={notified}
            className={cn(
              'inline-flex items-center gap-2 h-12 px-6 rounded-lg text-[14px] font-medium transition-all',
              notified
                ? 'bg-gold/15 text-gold border border-gold/30 cursor-default'
                : 'gold-grad text-bg hover:brightness-110 shadow-[0_8px_30px_-8px_rgb(201_168_99_/_0.4)]',
            )}
          >
            {notified ? <CheckCircle2 className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            <span>{notified ? t('notified') : t('notify')}</span>
          </button>
        </div>
      </div>

      {/* Capabilities grid */}
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-4 text-center">{t('building')}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {caps.map((cap, i) => {
            const Icon = capabilities[i].icon;
            return (
              <div key={i} className={cn('rounded-xl border bg-gradient-to-br p-5 flex items-start gap-3', capabilities[i].color, capabilities[i].border)}>
                <Icon className="h-5 w-5 text-fg-muted shrink-0 mt-0.5" />
                <span className="text-[13.5px] text-fg-soft leading-snug">{cap}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap / Phases */}
      <div className="rounded-xl border border-border bg-surface p-8 lg:p-10">
        <div className="text-center mb-10">
          <h2 className="font-display text-[28px] lg:text-[32px] leading-tight">{t('timeline_title')}</h2>
        </div>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-gold/60 via-gold/20 to-transparent" />
          <div className="space-y-8">
            {[
              { phase: '01', title: t('phase1'), desc: t('phase1d'), done: false },
              { phase: '02', title: t('phase2'), desc: t('phase2d'), done: false },
              { phase: '03', title: t('phase3'), desc: t('phase3d'), done: false },
            ].map((p) => (
              <div key={p.phase} className="flex gap-5 pl-1">
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full border-2 border-gold/40 bg-bg flex items-center justify-center text-[13px] font-display text-gold">
                    {p.phase}
                  </div>
                </div>
                <div className="pt-1.5">
                  <h3 className="font-display text-[18px] mb-1">{p.title}</h3>
                  <p className="text-[13px] text-fg-muted leading-relaxed max-w-[500px]">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA to existing features */}
      <div className="rounded-xl border border-dashed border-gold/20 bg-gold/5 p-6 text-center">
        <p className="text-[14px] text-fg-muted mb-4">{t('meanwhile')}</p>
        <a
          href="/chat"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md border border-gold/30 bg-surface text-[13px] text-gold font-medium hover:bg-gold/10 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{t('chat_cta')}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
