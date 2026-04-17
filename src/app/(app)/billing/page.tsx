'use client';
import { useI18n } from '@/lib/i18n';

export default function BillingPage() {
  const { t } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-12 max-w-[860px] mx-auto text-center">
      <div className="font-display text-[28px] mb-2">{t('billing.title')}</div>
      <p className="text-[14px] text-fg-muted">{t('billing.arrives')}</p>
    </div>
  );
}
