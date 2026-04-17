'use client';
import { useI18n } from '@/lib/i18n';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  const { t } = useI18n();
  return (
    <div className="px-6 lg:px-10 py-12 max-w-[860px] mx-auto">
      <div className="text-center space-y-4">
        <div className="h-14 w-14 rounded-xl bg-gold/10 border border-gold/20 mx-auto flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-gold" />
        </div>
        <h1 className="font-display text-[28px]">{t('billing.title')}</h1>
        <p className="text-[14px] text-fg-muted">{t('billing.arrives')}</p>
      </div>
    </div>
  );
}
