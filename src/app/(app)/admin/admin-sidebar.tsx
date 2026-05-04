'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, MessageSquare, ImageIcon, Settings,
  CreditCard, Bell, FileText, BarChart3, Shield, Zap,
  Palette, Globe, AlertTriangle, X, Menu, Mail, Database,
} from 'lucide-react';

export type AdminTabId =
  | 'overview' | 'feedback' | 'users' | 'brand' | 'settings'
  | 'subscriptions' | 'home-content' | 'chat-behavior' | 'plans'
  | 'dna-cards' | 'push' | 'emails' | 'system' | 'logs' | 'stats';

interface AdminSidebarProps {
  active: AdminTabId;
  onChange: (tab: AdminTabId) => void;
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  comingSoon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'stats', label: 'Stats', icon: BarChart3 },
    ],
  },
  {
    title: 'USERS & BILLING',
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      { id: 'brand', label: 'Brand Assets', icon: ImageIcon },
      { id: 'home-content', label: 'Home Content', icon: FileText },
      { id: 'dna-cards', label: 'DNA Cards', icon: Palette, comingSoon: true },
    ],
  },
  {
    title: 'PRODUCT',
    items: [
      { id: 'chat-behavior', label: 'Chat Behavior', icon: Zap, comingSoon: true },
      { id: 'plans', label: 'Plans & Pricing', icon: CreditCard, comingSoon: true },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { id: 'push', label: 'Push Notifications', icon: Bell, comingSoon: true },
      { id: 'emails', label: 'Email Templates', icon: Mail, comingSoon: true },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'system', label: 'Maintenance', icon: AlertTriangle },
      { id: 'logs', label: 'Error Logs', icon: Database },
    ],
  },
];

export function AdminSidebar({ active, onChange, open, onClose }: AdminSidebarProps) {
  // Lock body scroll when drawer open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-72 bg-surface-2 border-r border-border z-50',
          'transition-transform duration-200 ease-out',
          'lg:transform-none lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'flex flex-col',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md gold-grad flex items-center justify-center">
              <Shield className="h-4 w-4 text-bg" />
            </div>
            <div>
              <div className="font-display text-[15px] tracking-tight leading-tight">Admin</div>
              <div className="text-[10.5px] uppercase tracking-wider text-fg-subtle">Operator AI</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 rounded-md hover:bg-surface-3 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-4 w-4 text-fg-muted" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {section.title}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          if (item.comingSoon) return;
                          onChange(item.id);
                          onClose();
                        }}
                        disabled={item.comingSoon}
                        className={cn(
                          'w-full h-9 px-3 rounded-md text-[13.5px] flex items-center gap-2.5 transition-colors text-left',
                          isActive
                            ? 'bg-gold/10 text-fg border border-gold/20'
                            : item.comingSoon
                              ? 'text-fg-subtle cursor-not-allowed opacity-50'
                              : 'text-fg-muted hover:text-fg hover:bg-surface-3 border border-transparent'
                        )}
                      >
                        <Icon className={cn('h-4 w-4 flex-shrink-0', isActive && 'text-gold')} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.comingSoon && (
                          <span className="text-[9.5px] uppercase tracking-wider text-fg-subtle bg-surface-3 px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          <div className="text-[11.5px] text-fg-subtle">Admin Panel v2</div>
          <div className="text-[10.5px] text-fg-subtle/60 mt-0.5">operatoraiapp.com</div>
        </div>
      </aside>
    </>
  );
}

// Botón hamburguesa standalone para usar en topbar móvil
export function AdminMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden h-10 w-10 rounded-md border border-border bg-surface-2 hover:bg-surface-3 flex items-center justify-center"
      aria-label="Open menu"
    >
      <Menu className="h-4 w-4 text-fg" />
    </button>
  );
}
