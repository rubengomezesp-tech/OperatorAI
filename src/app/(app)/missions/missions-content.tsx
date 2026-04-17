'use client';
import Link from 'next/link';
import { Rocket, Plus, CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  title_en: string;
  title_es: string;
  desc_en: string;
  desc_es: string;
  category: string;
  icon: string;
}

const templates: Template[] = [
  { id: 'ig-growth', title_en: 'Grow my Instagram', title_es: 'Crecer mi Instagram', desc_en: '30-day plan with weekly content generation and engagement tracking.', desc_es: 'Plan de 30 días con generación de contenido semanal y seguimiento.', category: 'growth', icon: '📈' },
  { id: 'launch-campaign', title_en: 'Launch a campaign', title_es: 'Lanzar una campaña', desc_en: 'Full campaign: research, copy, visuals, and scheduling in one mission.', desc_es: 'Campaña completa: investigación, copy, visuales y programación en una misión.', category: 'campaign', icon: '🚀' },
  { id: 'content-week', title_en: '7 days of content', title_es: '7 días de contenido', desc_en: 'A week of on-brand posts across channels, pre-scheduled.', desc_es: 'Una semana de publicaciones fieles a tu marca, pre-programadas.', category: 'content', icon: '📅' },
  { id: 'brand-audit', title_en: 'Brand audit', title_es: 'Auditoría de marca', desc_en: 'Analyze your current brand presence and get actionable insights.', desc_es: 'Analiza tu presencia de marca actual y obtén insights accionables.', category: 'strategy', icon: '🔍' },
];

const statusIcon: Record<string, React.ReactNode> = {
  active: <Play className="h-3 w-3 text-gold" />,
  completed: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
  paused: <Clock className="h-3 w-3 text-fg-muted" />,
  failed: <AlertCircle className="h-3 w-3 text-red-400" />,
};

export function MissionsContent({ missions }: { missions: Mission[] }) {
  const { t, locale } = useI18n();

  const statusLabel = (s: string) => {
    if (s === 'active') return t('missions.status_active');
    if (s === 'completed') return t('missions.status_completed');
    if (s === 'paused') return t('missions.status_paused');
    return s;
  };

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('missions.kicker')}</div>
          <h1 className="font-display text-[32px]">{t('missions.title')}</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5">{t('missions.subtitle')}</p>
        </div>
        <Button size="md"><Plus className="h-4 w-4" /><span>{t('missions.new')}</span></Button>
      </div>

      {/* Active missions */}
      {missions.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">{t('missions.active')}</div>
          {missions.map((m) => (
            <Card key={m.id}>
              <CardBody className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Rocket className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[16px] truncate">{m.title}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 h-4 rounded text-[9.5px] tracking-[0.1em] uppercase bg-surface-3 text-fg-muted">
                      {statusIcon[m.status]}{statusLabel(m.status)}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-fg-muted truncate mt-0.5">{m.objective}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[14px] font-display text-gold">{m.progress}%</div>
                  <div className="text-[10.5px] text-fg-subtle">{t('missions.progress')}</div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {missions.length === 0 && (
        <Card>
          <CardBody className="text-center py-16">
            <Rocket className="h-10 w-10 text-gold mx-auto mb-4" />
            <h3 className="font-display text-[20px] mb-2">{t('missions.none')}</h3>
            <p className="text-[13.5px] text-fg-muted mb-5">{t('missions.none_desc')}</p>
          </CardBody>
        </Card>
      )}

      {/* Templates */}
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">{t('missions.templates')}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className="text-left p-4 rounded-lg border border-border bg-surface hover:border-gold/40 hover:bg-surface-2 transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-[24px]">{tmpl.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[15px] group-hover:text-gold transition">{locale === 'es' ? tmpl.title_es : tmpl.title_en}</div>
                  <div className="text-[12px] text-fg-muted mt-0.5 line-clamp-2">{locale === 'es' ? tmpl.desc_es : tmpl.desc_en}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
