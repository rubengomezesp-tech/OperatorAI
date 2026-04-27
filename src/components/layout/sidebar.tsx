'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Sparkles,
  Palette,
  Settings,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface NavItem {
  href: string;
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  badge?: string;
  primary?: boolean;
}

interface NavGroup {
  id: string;
  labelKey: string;
  fallback: string;
  items: NavItem[];
}

interface Props {
  isAdmin?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isAdmin = false, onClose }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();

  const groups: NavGroup[] = [
    {
      id: 'main',
      labelKey: 'nav.main',
      fallback: 'Main',
      items: [
        {
          href: '/chat',
          labelKey: 'nav.creative_agent',
          fallback: 'Chat',
          icon: MessageSquare,
          primary: true,
        },
        {
          href: '/campaigns',
          labelKey: 'nav.my_campaigns',
          fallback: 'Campaigns',
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'context',
      labelKey: 'nav.context',
      fallback: 'Context',
      items: [
        {
          href: '/brand-os',
          labelKey: 'nav.brand_os',
          fallback: 'Brand',
          icon: Palette,
        },
      ],
    },
    {
      id: 'system',
      labelKey: 'nav.system',
      fallback: 'System',
      items: [
        {
          href: '/settings',
          labelKey: 'nav.settings',
          fallback: 'Settings',
          icon: Settings,
        },
        ...(isAdmin
          ? [
              {
                href: '/admin',
                labelKey: 'nav.admin',
                fallback: 'Admin',
                icon: Shield,
              } as NavItem,
            ]
          : []),
      ],
    },
  ];

  const isActive = (href: string): boolean => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  const tr = (key: string, fallback: string): string => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  return (
    <aside className="h-full w-[240px] shrink-0 border-r border-border bg-surface flex flex-col">
      {/* Brand */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border">
        <Link
          href="/chat"
          className="flex items-center gap-2 text-fg hover:opacity-80 transition-opacity"
          onClick={onClose}
        >
          <div className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-bg" />
          </div>
          <span className="font-display text-[15px] tracking-tight">Operator</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.id}>
            <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
              {tr(group.labelKey, group.fallback)}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] transition-colors',
                      active
                        ? 'bg-gold/10 text-gold border border-gold/20'
                        : 'text-fg-soft hover:bg-surface-2 hover:text-fg border border-transparent',
                      item.primary && !active && 'text-fg',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">
                      {tr(item.labelKey, item.fallback)}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/30">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
