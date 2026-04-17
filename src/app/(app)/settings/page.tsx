'use client';
import Link from 'next/link';
import { Plug, Brain, CreditCard, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function SettingsPage() {
  const { t } = useI18n();
  const sections = [
    { href: '/settings/integrations', label: t('settings.integrations'), description: t('settings.integrations_desc'), icon: Plug },
    { href: '/settings/memory', label: t('settings.memory_voice'), description: t('settings.memory_desc'), icon: Brain },
    { href: '/settings/billing', label: t('settings.billing'), description: t('settings.billing_desc'), icon: CreditCard },
  ];
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[860px] w-full mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('settings.kicker')}</div>
        <h1 className="font-display text-[32px]">{t('settings.title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{t('settings.subtitle')}</p>
      </div>
      <div className="space-y-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href} className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-gold/40 transition-all">
              <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors"><Icon className="h-4 w-4 text-gold" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[16px] group-hover:text-gold transition-colors">{s.label}</div>
                <div className="text-[12.5px] text-fg-muted mt-0.5">{s.description}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
