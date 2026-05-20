'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { UserMenu } from './user-menu';
import { MobileMenu, MobileMenuButton } from './mobile-menu';
import { BrandSwitcher } from './brand-switcher';

const TITLES: Record<string, string> = {
  '/chat': 'Creative Agent',
  '/coding': 'Operator Codex',
  '/memory': 'Memory',
  '/campaigns/new': 'Create Campaign',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/integrations': 'Integrations',
  '/settings/memory': 'Memory',
  '/settings/billing': 'Billing',
  '/settings/team': 'Team',
  '/settings/privacy': 'Privacy',
};

export function Topbar({ email, fullName }: { email: string; fullName: string | null }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const titleKey = key ? TITLES[key] : '';
  const resolved = titleKey ? t(titleKey) : '';
  const title = resolved && resolved !== titleKey ? resolved : '';

  return (
    <>
      <header className="sticky top-0 z-50">
        <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-2 min-w-0">
          {/* Left: brand switcher (desktop) + hamburguesa (mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="lg:hidden">
              <MobileMenuButton onClick={() => setMenuOpen(true)} />
            </div>
            <div className="hidden lg:block">
              <BrandSwitcher />
            </div>
          </div>

          {/* Center: pill con título de página */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            <div className="px-4 h-9 rounded-full bg-surface-2/80 backdrop-blur-md border border-border/50 flex items-center gap-2 max-w-[60vw]">
              <span className="font-display text-[14px] tracking-tight text-fg truncate">
                {title || 'OperatorAI'}
              </span>
            </div>
          </div>

          {/* Right: avatar */}
          <div className="shrink-0">
            <UserMenu email={email} fullName={fullName} />
          </div>
        </div>

        {/* Mobile: brand switcher en segunda fila */}
        <div className="lg:hidden px-3 pb-2">
          <BrandSwitcher />
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
