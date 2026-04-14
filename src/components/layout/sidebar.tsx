'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, MessageSquare, ImageIcon, Megaphone, Type,
  FileText, Brain, Library, Users, BarChart3, Settings, Mic,
  type LucideIcon,
} from 'lucide-react';

type Item = { href: string; label: string; icon: LucideIcon; badge?: string };
type Section = { group: string; items: Item[] };

const nav: Section[] = [
  { group: 'Workspace', items: [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/chat', label: 'Creative Agent', icon: MessageSquare, badge: 'AI' },
  ]},
  { group: 'Studio', items: [
    { href: '/studio/image', label: 'Image Studio', icon: ImageIcon },
    { href: '/studio/campaign', label: 'Campaigns', icon: Megaphone },
    { href: '/studio/copy', label: 'Copywriter', icon: Type },
  ]},
  { group: 'Intelligence', items: [
    { href: '/knowledge', label: 'Knowledge', icon: FileText },
    { href: '/memory', label: 'Memory', icon: Brain },
    { href: '/library', label: 'Library', icon: Library },
  ]},
  { group: 'Manage', items: [
    { href: '/assistants', label: 'Assistants', icon: Mic },
    { href: '/team', label: 'Team', icon: Users },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-bg">
      <div className="px-5 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-md gold-grad flex items-center justify-center">
            <span className="font-display text-[17px] text-bg leading-none">O</span>
          </span>
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
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 px-3 h-9 rounded-md text-[13.5px] transition-colors',
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

      <div className="p-4 border-t border-border">
        <div className="surface-raised p-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-gold mb-1">Plan - Free</div>
          <div className="text-[12.5px] text-fg-muted leading-snug">Explore Operator AI.</div>
          <Link href="/billing" className="mt-2 inline-block text-[12px] text-fg hover:text-gold transition-colors">
            Upgrade
          </Link>
        </div>
      </div>
    </aside>
  );
}
