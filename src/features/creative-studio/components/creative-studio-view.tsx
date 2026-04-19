'use client';
import { useState } from 'react';
import { Megaphone, BookOpen, Palette, Flame, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { CampaignGenerator } from './campaign-generator';
import { StoryPackGenerator } from './story-pack-generator';
import { BrandKitGenerator } from './brand-kit-generator';
import { ViralContentGenerator } from './viral-content-generator';

type Tool = 'campaign' | 'stories' | 'brand-kit' | 'viral' | null;

const TOOLS = [
  {
    id: 'campaign' as const,
    icon: Megaphone,
    title: { en: 'Instagram Ads Campaign', es: 'Campana Instagram Ads' },
    desc: { en: 'Complete ad campaign with creative concept, copies, hooks, CTAs and A/B variations', es: 'Campana publicitaria completa con concepto creativo, copies, hooks, CTAs y variaciones A/B' },
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/20',
    time: '~30s',
  },
  {
    id: 'stories' as const,
    icon: BookOpen,
    title: { en: 'Story Pack Generator', es: 'Generador de Story Packs' },
    desc: { en: '3-5 Instagram Stories with narrative arc, hooks, visuals and CTA', es: '3-5 Instagram Stories con arco narrativo, hooks, visuales y CTA' },
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    time: '~20s',
  },
  {
    id: 'brand-kit' as const,
    icon: Palette,
    title: { en: 'Brand Kit Generator', es: 'Generador de Brand Kit' },
    desc: { en: 'Complete brand identity: tone, visual style, content ideas, post examples', es: 'Identidad de marca completa: tono, estilo visual, ideas de contenido, ejemplos' },
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    time: '~25s',
  },
  {
    id: 'viral' as const,
    icon: Flame,
    title: { en: 'Viral Content Engine', es: 'Motor de Contenido Viral' },
    desc: { en: 'Viral ideas, optimized hooks, Reel scripts, trending formats', es: 'Ideas virales, hooks optimizados, scripts para Reels, formatos trending' },
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    time: '~15s',
  },
];

export function CreativeStudioView() {
  const { locale } = useI18n();
  const [activeTool, setActiveTool] = useState<Tool>(null);
  const l = (obj: { en: string; es: string }) => locale === 'es' ? obj.es : obj.en;

  if (activeTool) {
    return (
      <div className="px-4 lg:px-10 py-6 max-w-[960px] mx-auto">
        <button
          onClick={() => setActiveTool(null)}
          className="flex items-center gap-2 text-[13px] text-fg-muted hover:text-gold mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{locale === 'es' ? 'Volver al estudio' : 'Back to studio'}</span>
        </button>
        {activeTool === 'campaign' && <CampaignGenerator />}
        {activeTool === 'stories' && <StoryPackGenerator />}
        {activeTool === 'brand-kit' && <BrandKitGenerator />}
        {activeTool === 'viral' && <ViralContentGenerator />}
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[960px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
          <Sparkles className="h-3 w-3" />
          <span>Creative Studio</span>
        </div>
        <h1 className="font-display text-[36px] leading-tight">
          {locale === 'es' ? (
            <>Crea campanas <span className="text-gold">que convierten</span></>
          ) : (
            <>Create campaigns <span className="text-gold">that convert</span></>
          )}
        </h1>
        <p className="text-[14px] text-fg-muted max-w-[480px] mx-auto">
          {locale === 'es'
            ? 'Genera campanas, stories, branding y contenido viral en segundos. Listo para publicar.'
            : 'Generate campaigns, stories, branding and viral content in seconds. Ready to publish.'}
        </p>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="group text-left rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className={cn('h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform', tool.bg)}>
                <tool.icon className={cn('h-5 w-5', tool.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-[17px] group-hover:text-gold transition-colors">{l(tool.title)}</h3>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle">{tool.time}</span>
                </div>
                <p className="text-[12.5px] text-fg-muted leading-relaxed line-clamp-2">{l(tool.desc)}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
