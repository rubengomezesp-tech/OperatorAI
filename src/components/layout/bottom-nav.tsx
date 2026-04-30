'use client';

/**
 * BottomNav — Mobile only navigation bar.
 * Fixed at bottom, glass-strong, 4 main destinations.
 * Hidden on desktop (lg+).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Sparkles, Palette, Settings } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useBrandAssets } from '@/lib/brand-assets-context';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { locale } = useI18n();
  const { navChatUrl, navCampaignsUrl, navBrandUrl, navSettingsUrl } = useBrandAssets();
  const isEs = locale === 'es';

  const items = [
    { href: '/chat', label: isEs ? 'Chat' : 'Chat', icon: MessageSquare, customUrl: navChatUrl },
    { href: '/campaigns', label: isEs ? 'Campañas' : 'Campaigns', icon: Sparkles, customUrl: navCampaignsUrl },
    { href: '/brand-os', label: isEs ? 'Marca' : 'Brand', icon: Palette, customUrl: navBrandUrl },
    { href: '/settings', label: isEs ? 'Ajustes' : 'Settings', icon: Settings, customUrl: navSettingsUrl },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-strong border-t border-border/40">
      <div className="flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors',
                isActive ? 'text-gold' : 'text-fg-muted hover:text-fg',
              )}
            >
              {item.customUrl ? (
                <div className={cn('h-[18px] w-[18px] flex items-center justify-center', isActive && 'opacity-100', !isActive && 'opacity-70')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.customUrl} alt={item.label} className="h-full w-full object-contain" />
                </div>
              ) : (
                <Icon className={cn('h-[18px] w-[18px]', isActive && 'text-gold')} strokeWidth={2} />
              )}
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
