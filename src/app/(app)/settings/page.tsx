'use client';
import Link from 'next/link';
import { User, Plug, Brain, CreditCard, ChevronRight, Trash2, Shield, FileText, HelpCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-8 max-w-[860px] w-full mx-auto space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('settings.kicker')}</div>
        <h1 className="font-display text-[32px]">{t('settings.title')}</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5">{t('settings.subtitle')}</p>
      </div>

      {/* Main settings */}
      <div className="space-y-2">
        <SettingsLink href="/settings/profile" icon={User} label={t('settings.profile')} desc={t('settings.profile_desc')} />
        <SettingsLink href="/settings/integrations" icon={Plug} label={t('settings.integrations')} desc={t('settings.integrations_desc')} />
        <SettingsLink href="/settings/memory" icon={Brain} label={t('settings.memory_voice')} desc={t('settings.memory_desc')} />
        <SettingsLink href="/settings/billing" icon={CreditCard} label={t('settings.billing')} desc={t('settings.billing_desc')} />
      </div>

      {/* Legal & support */}
      <div>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-2 px-1">{t('legal.support')}</div>
        <div className="space-y-2">
          <SettingsLink href="/privacy" icon={Shield} label={t('legal.privacy')} desc="" />
          <SettingsLink href="/terms" icon={FileText} label={t('legal.terms')} desc="" />
          <SettingsLink href="/support" icon={HelpCircle} label={t('legal.support')} desc="" />
        </div>
      </div>

      {/* Danger zone */}
      <div className="pt-4 border-t border-border">
        <Link
          href="/delete-account"
          className="group flex items-center gap-4 p-4 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/40 transition-all"
        >
          <div className="h-10 w-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/15 transition-colors">
            <Trash2 className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[16px] text-red-400">{t('settings.delete_account')}</div>
            <div className="text-[12.5px] text-fg-muted mt-0.5">{t('settings.delete_desc')}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400/50" />
        </Link>
      </div>
    </div>
  );
}

function SettingsLink({ href, icon: Icon, label, desc }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; desc: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:bg-surface-2 hover:border-gold/40 transition-all">
      <div className="h-10 w-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0 group-hover:bg-gold/15 transition-colors">
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display text-[16px] group-hover:text-gold transition-colors">{label}</div>
        {desc && <div className="text-[12.5px] text-fg-muted mt-0.5">{desc}</div>}
      </div>
      <ChevronRight className="h-4 w-4 text-fg-subtle group-hover:text-gold transition-colors" />
    </Link>
  );
}
