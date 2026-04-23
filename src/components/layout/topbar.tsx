'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { UserMenu } from './user-menu';
import { LanguageToggle } from '@/lib/i18n';
import { MobileMenu, MobileMenuButton } from './mobile-menu';

const TITLES: Record<string, string> = {
  '/dashboard': 'Studio',
  '/chat': 'Creative Agent',
  '/creative-studio': 'Creative Studio',
  '/studio/image': 'Image Studio',
  '/studio/video': 'Video Studio',
  '/voice': 'Voice Mode',
  '/files': 'Files & Analysis',
  '/projects': 'Projects',
  '/knowledge': 'Knowledge',
  '/memory': 'Memory',
  '/assistants': 'Assistants',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/integrations': 'Integrations',
  '/settings/memory': 'Memory',
  '/settings/billing': 'Billing',
};

export function Topbar({ email, fullName }: { email: string; fullName: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const title = key ? TITLES[key] : '';

  return (
    <>
      <header className="sticky top-0 z-20 glass border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 lg:px-8 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <MobileMenuButton onClick={() => setMenuOpen(true)} />
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-fg-muted">
              <Sparkles className="h-3 w-3 text-gold" />
              Operator
            </div>

            <span className="hidden lg:inline text-fg-subtle">/</span>

            <h1 className="font-display text-[18px] truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageToggle />
            <UserMenu email={email} fullName={fullName} />
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
