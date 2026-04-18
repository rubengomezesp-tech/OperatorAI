'use client';
import Link from 'next/link';
import { Rocket, MessageSquare, Sparkles, Zap, Target, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
export default function DashboardPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen">
      <section className="relative px-6 lg:px-10 pt-10 lg:pt-14 pb-10 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-[600px] rounded-full gold-grad opacity-[0.04] blur-3xl pointer-events-none" />
        <div className="relative max-w-[960px] mx-auto">
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">Operator AI</div>
          <h1 className="font-display text-[40px] lg:text-[52px] leading-[1.02] mb-4">{t('dash.hero1')} <span className="text-gold-grad">{t('dash.hero2')}</span></h1>
          <p className="text-[15px] text-fg-muted max-w-[540px] leading-relaxed mb-8">{t('dash.sub')}</p>
        </div>
      </section>
      <section className="px-6 lg:px-10 pb-6">
        <div className="max-w-[960px] mx-auto">
          <Link href="/missions" className="group block relative rounded-2xl border border-gold/30 bg-gradient-to-br from-surface via-surface-2 to-bg p-8 lg:p-10 overflow-hidden hover:border-gold/60 transition-all">
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full gold-grad opacity-[0.10] blur-3xl pointer-events-none group-hover:opacity-[0.18] transition-opacity" />
            <div className="relative flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-gold bg-gold/10 border border-gold/20 rounded px-2 py-0.5 mb-3"><span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" /><span>{t('dash.paradigm')}</span></div>
                <h2 className="font-display text-[28px] lg:text-[34px] leading-tight mb-2.5">{t('dash.first')} <span className="text-gold-grad">{t('dash.mission')}</span>.</h2>
                <p className="text-[14px] text-fg-muted leading-relaxed max-w-[440px] mb-5">{t('dash.mission_desc')}</p>
                <div className="inline-flex items-center gap-2 h-9 px-4 rounded-md gold-grad text-bg text-[13px] font-medium group-hover:brightness-110 transition"><Rocket className="h-3.5 w-3.5" /><span>{t('dash.deploy')}</span><ArrowRight className="h-3 w-3 ml-1" /></div>
              </div>
              <div className="hidden lg:flex shrink-0 h-28 w-28 rounded-2xl border border-gold/30 bg-gold/5 items-center justify-center"><Rocket className="h-12 w-12 text-gold" /></div>
            </div>
          </Link>
        </div>
      </section>
      <section className="px-6 lg:px-10 pb-12">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">{t('dash.core')}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <T href="/chat" icon={MessageSquare} l={t('dash.chat')} d={t('dash.chat_d')} k="G+C" b={t('dash.new')} />
            <T href="/studio" icon={Sparkles} l={t('dash.stud')} d={t('dash.stud_d')} k="G+I" b={t('dash.new')} />
            
            <T href="/brand-os" icon={Target} l={t('dash.bos')} d={t('dash.bos_d')} k="G+B" b={t('dash.new')} n />
          </div>
        </div>
      </section>
      <section className="px-6 lg:px-10 pb-16">
        <div className="max-w-[960px] mx-auto">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">{t('dash.also')}</div>
          <div className="flex flex-wrap gap-2">
            {[{h:'/projects',k:'nav.projects'},{h:'/knowledge',k:'nav.knowledge'},{h:'/files',k:'dash.files'},{h:'/voice',k:'dash.voice'},{h:'/assistants',k:'dash.agents'},{h:'/settings/integrations',k:'nav.integrations'},{h:'/settings/memory',k:'nav.memory'},{h:'/settings/billing',k:'nav.billing'}].map(l=>(
              <Link key={l.h} href={l.h} className="inline-flex items-center h-8 px-3 rounded-full border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition"><span>{t(l.k)}</span></Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
function T({href,icon:I,l,d,k,b,n}:{href:string;icon:React.ComponentType<{className?:string}>;l:string;d:string;k?:string;b:string;n?:boolean}){
  return(
    <Link href={href} className="group relative rounded-xl border border-border bg-surface p-5 hover:border-gold/40 hover:bg-surface-2 transition-all">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors"><I className="h-5 w-5 text-gold"/></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1"><span className="font-display text-[17px] group-hover:text-gold transition-colors">{l}</span>{n&&<span className="text-[9px] px-1.5 py-0.5 rounded bg-gold text-bg font-bold uppercase tracking-[0.1em]">{b}</span>}</div>
          <p className="text-[12.5px] text-fg-muted leading-relaxed">{d}</p>
        </div>
        {k&&<div className="hidden lg:flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{k.split('+').map((c,i)=>(<kbd key={i} className="min-w-[18px] h-5 px-1 rounded bg-surface-3 border border-border text-[9.5px] font-mono text-fg-subtle flex items-center justify-center">{c}</kbd>))}</div>}
      </div>
    </Link>
  );
}
