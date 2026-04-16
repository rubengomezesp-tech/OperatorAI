import { LanguageToggle } from '@/lib/i18n';
'use client';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { UserMenu } from './user-menu';

const TITLES: Record<string, string> = {
  '/dashboard': 'Studio',
  '/chat': 'Creative Agent',
  '/studio/image': 'Image Studio',
  '/studio/campaign': 'Campaigns',
  '/studio/copy': 'Copywriter',
  '/knowledge': 'Knowledge',
  '/memory': 'Memory',
  '/library': 'Library',
  '/assistants': 'Assistants',
  '/team': 'Team',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/billing': 'Billing',
};

export function Topbar({ email, fullName }: { email: string; fullName: string | null }) {
  const pathname = usePathname();
  const key = Object.keys(TITLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
  const title = key ? TITLES[key] : '';
  return (
    <header className="sticky top-0 z-20 glass border-b border-border">
      <div className="flex items-center justify-between h-14 px-5 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
            <Sparkles className="h-3 w-3 text-gold" />
            Operator
          </div>
          <span className="text-fg-subtle">/</span>
          <h1 className="font-display text-[18px] truncate">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
              <UserMenu email={email} fullName={fullName} />
        </div>
      </div>
    </header>
  );
}
