'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { UserMenu } from './user-menu';
import { BrandPill } from './brand-pill';
import { LanguageToggle, useI18n } from '@/lib/i18n';
import { MobileMenu, MobileMenuButton } from './mobile-menu';

const TITLES: Record<string, string> = {
  '/chat': 'Creative Agent',
  '/memory': 'Memory',
  '/campaigns/new': 'Create Campaign',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/integrations': 'Integrations',
  '/settings/memory': 'Memory',
  '/settings/billing': 'Billing',
};

export function Topbar({ email, fullName }: { email: string; fullName: string | null }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const titleKey = key ? TITLES[key] : '';
  // Fall back to the literal key if i18n doesn't have a translation
  const resolved = titleKey ? t(titleKey) : '';
  const title = resolved && resolved !== titleKey ? resolved : '';

  return (
    <>
      <header className="sticky top-0 z-20 glass border-b border-border glass">
        <div className="flex items-center justify-between h-14 px-4 lg:px-8 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <MobileMenuButton onClick={() => setMenuOpen(true)} />
            </div>

            {/* Title only — brand 'Operator AI' lives in sidebar */}
            <h1 className="font-display text-[18px] truncate text-fg">{title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <BrandPill />
            <UserMenu email={email} fullName={fullName} />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
