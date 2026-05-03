'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { UserMenu } from './user-menu';
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
  const resolved = titleKey ? t(titleKey) : '';
  const title = resolved && resolved !== titleKey ? resolved : '';

  return (
    <>
      <header className="sticky top-0 z-20">
        <div className="flex items-center justify-between px-3 pt-3 pb-2 min-w-0">
          {/* Left: hamburguesa flotante */}
          <div className="lg:hidden">
            <MobileMenuButton onClick={() => setMenuOpen(true)} />
          </div>

          {/* Center: pill OperatorAI */}
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
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
