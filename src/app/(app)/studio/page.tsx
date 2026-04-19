'use client';
import Link from 'next/link';
import { ImageIcon, Sparkles, Video } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function StudioPage() {
  const { t, locale } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[960px] mx-auto space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('operator')}</div>
        <h1 className="font-display text-[32px]">{t('studio.title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{t('studio.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/studio/image" className="group relative rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors"><ImageIcon className="h-7 w-7 text-gold" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><h2 className="font-display text-[20px] group-hover:text-gold transition-colors">{t('nav.image_studio')}</h2><span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold uppercase tracking-[0.12em]">Flux 2 Pro</span></div>
              <p className="text-[13px] text-fg-muted leading-relaxed">{t('studio.image_desc')}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-gold font-medium"><Sparkles className="h-3.5 w-3.5" /><span>{t('studio.create_image')}</span></div>
            </div>
          </div>
        </Link>
        <Link href="/studio/video" className="group relative rounded-xl border border-border bg-surface p-6 hover:border-gold/40 hover:bg-surface-2 transition-all">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors"><Video className="h-7 w-7 text-gold" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><h2 className="font-display text-[20px] group-hover:text-gold transition-colors">Video Studio</h2><span className="text-[9px] px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold uppercase tracking-[0.12em]">AI</span></div>
              <p className="text-[13px] text-fg-muted leading-relaxed">{locale === 'es' ? 'Genera vídeo cinematográfico con IA desde un prompt.' : 'Generate cinematic AI video from a single prompt.'}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-gold font-medium"><Sparkles className="h-3.5 w-3.5" /><span>{locale === 'es' ? 'Crear vídeo' : 'Create video'}</span></div>
            </div>
          </div>
        </Link>
      </div>
      <div className="rounded-lg border border-dashed border-border bg-surface-2/30 p-5 text-center">
        <p className="text-[13px] text-fg-muted">{t('studio.chat_hint')} <Link href="/chat" className="text-gold hover:underline">{t('studio.chat_link')}</Link> {t('studio.chat_suffix')}</p>
      </div>
    </div>
  );
}
