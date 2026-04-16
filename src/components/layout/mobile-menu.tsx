'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video,
  Mic, Zap, FileSpreadsheet, FileText, Brain, Sparkles, Plug,
  CreditCard, X, Menu,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface NavSection {
  group: string;
  items: NavItem[];
}

const nav: NavSection[] = [
  { group: 'Workspace', items: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderOpen },
    { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
  ]},
  { group: 'Studio', items: [
    { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
    { href: '/studio/video', label: 'Video Studio', icon: Video, badge: 'NEW' },
    { href: '/voice', label: 'Voice Mode', icon: Mic },
  ]},
  { group: 'Automate', items: [
    { href: '/workflows', label: 'Workflows', icon: Zap },
    { href: '/files', label: 'Files & Analysis', icon: FileSpreadsheet },
  ]},
  { group: 'Intelligence', items: [
    { href: '/knowledge', label: 'Knowledge', icon: FileText },
  ]},
  { group: 'Manage', items: [
    { href: '/assistants', label: 'Assistants', icon: Sparkles },
    { href: '/settings/integrations', label: 'Integrations', icon: Plug },
    { href: '/settings/memory', label: 'Memory', icon: Brain },
    { href: '/settings/billing', label: 'Billing', icon: CreditCard },
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close menu on route change
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close menu"
      />

      {/* Panel */}
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
            <div key={section.group}>
              <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
                {section.group}
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
                        <span className="flex-1 truncate">{item.label}</span>
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
