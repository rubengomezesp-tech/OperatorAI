'use client';

/**
 * Mobile Menu V3 — Synced with sidebar (Chat / Campaigns / Brand / Settings)
 */

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquare,
  Sparkles,
  Palette,
  Settings,
  Shield,
  X,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface NavItem {
  href: string;
  labelEn: string;
  labelEs: string;
  icon: LucideIcon;
  primary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/chat',
    labelEn: 'Chat',
    labelEs: 'Chat',
    icon: MessageSquare,
    primary: true,
  },
  {
    href: '/campaigns',
    labelEn: 'Campaigns',
    labelEs: 'Campañas',
    icon: Sparkles,
  },
  {
    href: '/brand-os',
    labelEn: 'Brand',
    labelEs: 'Marca',
    icon: Palette,
  },
  {
    href: '/settings',
    labelEn: 'Settings',
    labelEs: 'Configuración',
    icon: Settings,
  },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileMenu({ open, onClose, isAdmin = false }: MobileMenuProps) {
  const pathname = usePathname();
  const { locale } = useI18n();
  const isEs = locale === 'es';

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const items = isAdmin
    ? [
        ...NAV_ITEMS,
        {
          href: '/admin',
          labelEn: 'Admin',
          labelEs: 'Admin',
          icon: Shield,
        },
      ]
    : NAV_ITEMS;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[280px] bg-surface border-r border-border flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <Link
            href="/chat"
            className="flex items-center gap-2 text-fg hover:opacity-80 transition-opacity"
            onClick={onClose}
          >
            <div className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-bg" />
            </div>
            <span className="font-display text-[15px] tracking-tight">Operator</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-fg-muted hover:text-fg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-md text-[14.5px] transition-colors',
                  active
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-fg-soft hover:bg-surface-2 hover:text-fg border border-transparent',
                  item.primary && !active && 'text-fg',
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1">{isEs ? item.labelEs : item.labelEn}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer hint */}
        <div className="p-4 border-t border-border">
          <p className="text-[11.5px] text-fg-subtle leading-relaxed">
            {isEs
              ? 'Operator es tu agencia AI dentro de tu bolsillo.'
              : 'Operator is your AI agency in your pocket.'}
          </p>
        </div>
      </div>
    </div>
  );
}

// MobileMenuButton — the hamburger trigger
interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 -ml-2 text-fg-muted hover:text-fg transition-colors"
      aria-label="Menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
