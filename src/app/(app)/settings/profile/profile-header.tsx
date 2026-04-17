'use client';
import { useI18n } from '@/lib/i18n';

export function ProfileHeader() {
  const { t } = useI18n();
  return (
    <div className="mb-8">
      <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">{t('profile.kicker')}</div>
      <h1 className="font-display text-[32px]">{t('profile.title')}</h1>
      <p className="text-[13.5px] text-fg-muted mt-1.5">{t('profile.subtitle')}</p>
    </div>
  );
}
