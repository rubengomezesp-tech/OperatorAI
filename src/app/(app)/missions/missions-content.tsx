'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, Plus, CheckCircle2, Clock, AlertCircle, Play, ArrowRight, Target, Zap, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface Mission {
  id: string;
  title: string;
  objective: string;
  category: string | null;
  status: string;
  progress: number;
  created_at: string;
  due_at: string | null;
}

interface Template {
  id: string;
  icon: string;
  gradient: string;
  steps: number;
  duration: string;
  duration_es: string;
}

const templates: (Template & { title_en: string; title_es: string; desc_en: string; desc_es: string })[] = [
  {
    id: 'ig-growth',
    icon: '📈',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    steps: 12,
    duration: '30 days',
    duration_es: '30 días',
    title_en: 'Grow my Instagram',
    title_es: 'Crecer mi Instagram',
    desc_en: 'AI analyzes your profile, creates a 30-day content calendar, generates posts daily, tracks engagement, and adapts strategy weekly.',
    desc_es: 'La IA analiza tu perfil, crea un calendario de 30 días, genera posts diarios, mide engagement y adapta la estrategia semanalmente.',
  },
  {
    id: 'launch-campaign',
    icon: '🚀',
    gradient: 'from-blue-500/20 to-blue-500/5',
    steps: 8,
    duration: '7 days',
    duration_es: '7 días',
    title_en: 'Launch a campaign',
    title_es: 'Lanzar una campaña',
    desc_en: 'Full campaign in one mission: market research, audience targeting, copy variations, visual generation, A/B headlines, and scheduling.',
    desc_es: 'Campaña completa en una misión: investigación de mercado, audiencia, variaciones de copy, visuales, titulares A/B y programación.',
  },
  {
    id: 'content-week',
    icon: '📅',
    gradient: 'from-purple-500/20 to-purple-500/5',
    steps: 7,
    duration: '1 week',
    duration_es: '1 semana',
    title_en: '7 days of content',
    title_es: '7 días de contenido',
    desc_en: 'A full week of on-brand posts across Instagram, LinkedIn, and X — with images, copy, and hashtags. Pre-scheduled.',
    desc_es: 'Una semana completa de posts para Instagram, LinkedIn y X — con imágenes, copy y hashtags. Pre-programados.',
  },
  {
    id: 'brand-audit',
    icon: '🔍',
    gradient: 'from-amber-500/20 to-amber-500/5',
    steps: 5,
    duration: '48 hours',
    duration_es: '48 horas',
    title_en: 'Brand audit',
    title_es: 'Auditoría de marca',
    desc_en: 'Deep analysis of your current brand presence. Competitor benchmarking, tone consistency check, visual identity review, and actionable report.',
    desc_es: 'Análisis profundo de tu presencia de marca. Benchmarking competitivo, consistencia de tono, revisión visual e informe accionable.',
  },
  {
    id: 'email-sequence',
    icon: '✉️',
    gradient: 'from-pink-500/20 to-pink-500/5',
    steps: 6,
    duration: '3 days',
    duration_es: '3 días',
    title_en: 'Email nurture sequence',
    title_es: 'Secuencia de emails',
    desc_en: '5-email nurture sequence with subject lines, body copy, CTAs, and send timing. Optimized for your audience and brand voice.',
    desc_es: 'Secuencia de 5 emails con asuntos, cuerpo, CTAs y timing. Optimizada para tu audiencia y voz de marca.',
  },
  {
    id: 'product-launch',
    icon: '💎',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
    steps: 10,
    duration: '14 days',
    duration_es: '14 días',
    title_en: 'Product launch kit',
    title_es: 'Kit de lanzamiento',
    desc_en: 'Complete launch: landing page copy, social announcements, press release, email blast, ad creatives, and 10 product images.',
    desc_es: 'Lanzamiento completo: copy de landing, anuncios sociales, nota de prensa, email blast, creatividades y 10 imágenes de producto.',
  },
];

const statusConfig: Record<string, { icon: typeof Play; color: string; bg: string }> = {
  active: { icon: Play, color: 'text-gold', bg: 'bg-gold/15 border-gold/30' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  paused: { icon: Clock, color: 'text-fg-muted', bg: 'bg-surface-3 border-border' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
};

export function MissionsContent({ missions }: { missions: Mission[] }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [deploying, setDeploying] = useState<string | null>(null);

  function deployTemplate(tmpl: typeof templates[0]) {
    setDeploying(tmpl.id);
    const prompt = locale === 'es'
      ? `Despliega esta misión: ${tmpl.title_es}. ${tmpl.desc_es}`
      : `Deploy this mission: ${tmpl.title_en}. ${tmpl.desc_en}`;
    setTimeout(() => {
      router.push('/chat?prompt=' + encodeURIComponent(prompt));
    }, 600);
  }

  const activeMissions = missions.filter(m => m.status === 'active' || m.status === 'paused');
  const completedMissions = missions.filter(m => m.status === 'completed');

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-10">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-br from-surface via-surface-2 to-bg p-8 lg:p-10">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full gold-grad opacity-[0.08] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full gold-grad opacity-[0.05] blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-gold mb-4">
            <Rocket className="h-3 w-3" />
            <span>{locale === 'es' ? 'Centro de operaciones' : 'Operations center'}</span>
          </div>
          <h1 className="font-display text-[36px] lg:text-[44px] leading-tight mb-3">
            {locale === 'es' ? 'Despliega ' : 'Deploy '}
            <span className="text-gold-grad">{locale === 'es' ? 'misiones' : 'missions'}</span>.
            <br />
            {locale === 'es' ? 'No tareas.' : 'Not tasks.'}
          </h1>
          <p className="text-[14.5px] text-fg-muted max-w-[520px] leading-relaxed mb-6">
            {locale === 'es'
              ? 'Define un objetivo. Operator despliega agentes, genera contenido, ejecuta el plan y mide resultados. Tú apruebas. Él ejecuta.'
              : 'Define an objective. Operator deploys agents, generates content, executes the plan, and tracks outcomes. You approve. It executes.'}
          </p>
          <div className="flex items-center gap-4">
            <Button size="md" onClick={() => router.push('/chat')}>
              <Rocket className="h-4 w-4" />
              <span>{locale === 'es' ? 'Desplegar misión' : 'Deploy mission'}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <div className="flex items-center gap-6 text-[12px] text-fg-subtle">
              <div className="flex items-center gap-1.5"><Target className="h-3 w-3 text-gold" /><span>{locale === 'es' ? 'Autónomo' : 'Autonomous'}</span></div>
              <div className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-gold" /><span>{locale === 'es' ? 'Multi-agente' : 'Multi-agent'}</span></div>
              <div className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-gold" /><span>{locale === 'es' ? 'Con métricas' : 'Tracked'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-gold">{locale === 'es' ? 'Misiones activas' : 'Active missions'}</span>
            <span className="text-[10.5px] text-fg-subtle">({activeMissions.length})</span>
          </div>
          <div className="space-y-2">
            {activeMissions.map((m) => {
              const sc = statusConfig[m.status] ?? statusConfig.active;
              const Icon = sc.icon;
              return (
                <div key={m.id} className="group rounded-xl border border-border bg-surface hover:border-gold/30 transition-all p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-10 w-10 rounded-lg border flex items-center justify-center shrink-0', sc.bg)}>
                      <Icon className={cn('h-4 w-4', sc.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-[16px] truncate group-hover:text-gold transition-colors">{m.title}</div>
                      <p className="text-[12.5px] text-fg-muted truncate mt-0.5">{m.objective}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-[20px] text-gold">{m.progress}%</div>
                      <div className="w-24 h-1.5 rounded-full bg-border mt-1 overflow-hidden">
                        <div className="h-full gold-grad rounded-full transition-all" style={{ width: m.progress + '%' }} />
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold shrink-0 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedMissions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">{locale === 'es' ? 'Completadas' : 'Completed'}</span>
            <span className="text-[10.5px] text-fg-subtle">({completedMissions.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {completedMissions.slice(0, 4).map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-surface p-4 flex items-center gap-3 opacity-70">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0"><div className="text-[13.5px] truncate">{m.title}</div></div>
                <span className="text-[11px] text-emerald-400 shrink-0">100%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates */}
      <div className="space-y-4">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-1">{locale === 'es' ? 'Plantillas de misión' : 'Mission templates'}</div>
          <h2 className="font-display text-[24px]">{locale === 'es' ? 'Empieza con un objetivo' : 'Start with an objective'}</h2>
          <p className="text-[13px] text-fg-muted mt-1">{locale === 'es' ? 'Elige una plantilla. Operator hace el resto.' : 'Pick a template. Operator does the rest.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tmpl) => {
            const isDeploying = deploying === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => deployTemplate(tmpl)}
                disabled={isDeploying}
                className={cn(
                  'text-left rounded-xl border border-border bg-gradient-to-br p-5 hover:border-gold/40 transition-all group relative overflow-hidden',
                  tmpl.gradient,
                  isDeploying && 'opacity-60 scale-[0.98]',
                )}
              >
                {isDeploying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-bg/60 backdrop-blur-sm rounded-xl z-10">
                    <div className="flex items-center gap-2 text-gold text-[13px] font-medium">
                      <Rocket className="h-4 w-4 animate-bounce" />
                      <span>{locale === 'es' ? 'Desplegando...' : 'Deploying...'}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[28px]">{tmpl.icon}</span>
                  <div className="flex items-center gap-2 text-[10px] text-fg-subtle uppercase tracking-[0.1em]">
                    <span>{tmpl.steps} {locale === 'es' ? 'pasos' : 'steps'}</span>
                    <span>&middot;</span>
                    <span>{locale === 'es' ? tmpl.duration_es : tmpl.duration}</span>
                  </div>
                </div>
                <h3 className="font-display text-[17px] group-hover:text-gold transition-colors mb-1.5">
                  {locale === 'es' ? tmpl.title_es : tmpl.title_en}
                </h3>
                <p className="text-[12.5px] text-fg-muted leading-relaxed line-clamp-3">
                  {locale === 'es' ? tmpl.desc_es : tmpl.desc_en}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gold font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="h-3 w-3" />
                  <span>{locale === 'es' ? 'Desplegar misión' : 'Deploy mission'}</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-surface p-6 lg:p-8">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-gold mb-4">{locale === 'es' ? 'Cómo funciona' : 'How it works'}</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title_en: 'Choose', title_es: 'Elige', desc_en: 'Pick a template or describe your objective.', desc_es: 'Elige una plantilla o describe tu objetivo.' },
            { step: '02', title_en: 'Deploy', title_es: 'Despliega', desc_en: 'Operator assigns agents and plans the execution.', desc_es: 'Operator asigna agentes y planifica la ejecución.' },
            { step: '03', title_en: 'Execute', title_es: 'Ejecuta', desc_en: 'Agents generate content, run workflows, and adapt.', desc_es: 'Los agentes generan contenido, ejecutan flujos y se adaptan.' },
            { step: '04', title_en: 'Track', title_es: 'Mide', desc_en: 'Review outcomes, approve outputs, track performance.', desc_es: 'Revisa resultados, aprueba salidas, mide rendimiento.' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="inline-flex h-10 w-10 rounded-full border border-gold/30 bg-gold/10 items-center justify-center text-[14px] font-display text-gold mb-3">{s.step}</div>
              <div className="font-display text-[15px] mb-1">{locale === 'es' ? s.title_es : s.title_en}</div>
              <p className="text-[12px] text-fg-muted leading-relaxed">{locale === 'es' ? s.desc_es : s.desc_en}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
