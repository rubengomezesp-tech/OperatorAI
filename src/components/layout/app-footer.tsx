'use client';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

export function AppFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border px-6 py-4">
      <div className="max-w-[960px] mx-auto flex items-center justify-between text-[11px] text-fg-subtle">
        <span>&copy; {new Date().getFullYear()} Operator AI</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-gold transition-colors">{t('legal.privacy')}</Link>
          <Link href="/terms" className="hover:text-gold transition-colors">{t('legal.terms')}</Link>
          <Link href="/support" className="hover:text-gold transition-colors">{t('legal.support')}</Link>
        </div>
      </div>
    </footer>
  );
}
