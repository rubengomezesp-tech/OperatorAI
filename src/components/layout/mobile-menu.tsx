'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video,
  Mic, Zap, FileSpreadsheet, FileText, Brain, Sparkles, Plug,
  CreditCard, X, Menu,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  groupKey: string;
  items: NavItem[];
}

const nav: NavSection[] = [
  { groupKey: 'nav.workspace', items: [
    { href: '/dashboard', labelKey: 'nav.overview', icon: LayoutDashboard },
    { href: '/projects', labelKey: 'nav.projects', icon: FolderOpen },
    { href: '/chat', labelKey: 'nav.creative_agent', icon: MessageSquare, badge: 'AI' },
  ]},
  { groupKey: 'nav.studio', items: [
    { href: '/studio/image', labelKey: 'nav.image_studio', icon: ImageIcon },
    { href: '/studio/video', labelKey: 'nav.video_studio', icon: Video, badge: 'NEW' },
    { href: '/voice', labelKey: 'nav.voice_mode', icon: Mic },
  ]},
  { groupKey: 'nav.automate', items: [
    { href: '/workflows', labelKey: 'nav.workflows', icon: Zap },
    { href: '/files', labelKey: 'nav.files', icon: FileSpreadsheet },
  ]},
  { groupKey: 'nav.intelligence', items: [
    { href: '/knowledge', labelKey: 'nav.knowledge', icon: FileText },
  ]},
  { groupKey: 'nav.manage', items: [
    { href: '/assistants', labelKey: 'nav.assistants', icon: Sparkles },
    { href: '/settings/integrations', labelKey: 'nav.integrations', icon: Plug },
    { href: '/settings/memory', labelKey: 'nav.memory', icon: Brain },
    { href: '/settings/billing', labelKey: 'nav.billing', icon: CreditCard },
  ]},
];

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lg:hidden flex items-center gap-2 group"
      aria-label="Open menu"
    >
      <img src="/logo.png" alt="Operator AI" className="h-7 w-7 rounded-md" />
      <span className="text-[11px] uppercase tracking-[0.18em] text-fg-muted group-hover:text-gold transition-colors">
        Operator
      </span>
      <Menu className="h-3.5 w-3.5 text-fg-subtle group-hover:text-gold transition-colors" />
    </button>
  );
}

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close menu"
      />

      <div className="relative w-[85%] max-w-[320px] h-full bg-bg border-r border-border shadow-2xl overflow-y-auto flex flex-col animate-slideInLeft">
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <img src="/logo.png" alt="Operator" className="h-8 w-8 rounded-md" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[17px] tracking-tight">Operator</span>
              <span className="text-[10.5px] uppercase tracking-[0.2em] text-fg-muted mt-1">AI</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-md flex items-center justify-center text-fg-muted hover:text-gold hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5">
          {nav.map((section) => (
            <div key={section.groupKey}>
              <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
                {t(section.groupKey as any)}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'relative flex items-center gap-3 px-3 h-10 rounded-md text-[14px] transition-colors',
                          active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                        )}
                      >
                        {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />}
                        <Icon className={cn('h-4 w-4 shrink-0', active && 'text-gold')} aria-hidden />
                        <span className="flex-1 truncate">{t(item.labelKey as any)}</span>
                        {item.badge && (
                          <span className="px-1.5 h-4 text-[9.5px] tracking-[0.12em] uppercase rounded bg-gold/15 text-gold flex items-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
