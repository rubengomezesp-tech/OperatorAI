'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, MessageSquare, FolderOpen, ImageIcon, Video,
  Mic, Zap, FileSpreadsheet, FileText, Brain, Sparkles, Plug,
  CreditCard, Settings, ChevronDown,
  type LucideIcon,
} from 'lucide-react';

type SubItem = { href: string; label: string; icon: LucideIcon };
type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: SubItem[];
};
type Section = { group: string; items: Item[] };

const nav: Section[] = [
  {
    group: 'Workspace',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderOpen },
      { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
    ],
  },
  {
    group: 'Studio',
    items: [
      { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
      { href: '/studio/video', label: 'Video Studio', icon: Video, badge: 'NEW' },
      { href: '/voice', label: 'Voice Mode', icon: Mic },
    ],
  },
  {
    group: 'Automate',
    items: [
      { href: '/workflows', label: 'Workflows', icon: Zap },
      { href: '/files', label: 'Files & Analysis', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { href: '/knowledge', label: 'Knowledge', icon: FileText },
    ],
  },
  {
    group: 'Manage',
    items: [
      { href: '/assistants', label: 'Assistants', icon: Sparkles },
      {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        children: [
          { href: '/settings/integrations', label: 'Integrations', icon: Plug },
          { href: '/settings/memory', label: 'Memory', icon: Brain },
          { href: '/settings/billing', label: 'Billing', icon: CreditCard },
        ],
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSettings, setOpenSettings] = useState(
    pathname.startsWith('/settings'),
  );

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-bg">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Operator AI" className="h-9 w-9 rounded-md" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[17px] tracking-tight">Operator</span>
            <span className="text-[10.5px] uppercase tracking-[0.2em] text-fg-muted mt-1">AI</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section) => (
          <div key={section.group}>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">
              {section.group}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isSettings = item.href === '/settings';
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' &&
                    !isSettings &&
                    pathname.startsWith(item.href));
                const Icon = item.icon;

                if (item.children) {
                  const someChildActive = item.children.some((c) =>
                    pathname.startsWith(c.href),
                  );
                  const expanded = openSettings || someChildActive;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => setOpenSettings((v) => !v)}
                        className={cn(
                          'w-full relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                          someChildActive
                            ? 'bg-surface-2 text-fg'
                            : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                        )}
                      >
                        {someChildActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                        )}
                        <Icon
                          className={cn('h-4 w-4 shrink-0', someChildActive && 'text-gold')}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown
                          className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
                        />
                      </button>
                      {expanded && (
                        <ul className="mt-0.5 ml-4 pl-3 border-l border-border space-y-0.5">
                          {item.children.map((c) => {
                            const subActive = pathname === c.href || pathname.startsWith(c.href + '/');
                            const SubIcon = c.icon;
                            return (
                              <li key={c.href}>
                                <Link
                                  href={c.href}
                                  className={cn(
                                    'flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[12.5px] transition-colors',
                                    subActive
                                      ? 'text-gold bg-gold/8'
                                      : 'text-fg-muted hover:text-fg hover:bg-surface-2/40',
                                  )}
                                >
                                  <SubIcon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{c.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
                        active
                          ? 'bg-surface-2 text-fg'
                          : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full gold-grad" />
                      )}
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

      <div className="p-4 border-t border-border">
        <div className="surface-raised p-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-gold mb-1">Plan</div>
          <div className="text-[12.5px] text-fg-muted leading-snug">Explore Operator AI.</div>
          <Link
            href="/pricing"
            className="mt-2 inline-block text-[12px] text-fg hover:text-gold transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </aside>
  );
}
