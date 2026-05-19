'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export function AppFooter() {
  const { t } = useI18n();
  const pathname = usePathname();

  if (pathname?.startsWith('/chat')) return null;

  return (
    <footer className="border-t border-border/60 px-6 py-5 bg-bg/80 backdrop-blur-sm">
      <div className="max-w-[960px] mx-auto flex items-center justify-between text-[12.5px]">
        <span className="text-fg-soft">&copy; {new Date().getFullYear()} Operator AI</span>
        <div className="flex items-center gap-5">
          <Link href="/privacy" className="text-fg hover:text-gold transition-colors font-medium">
            {t('legal.privacy')}
          </Link>
          <Link href="/terms" className="text-fg hover:text-gold transition-colors font-medium">
            {t('legal.terms')}
          </Link>
          <Link href="/support" className="text-fg hover:text-gold transition-colors font-medium">
            {t('legal.support')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
