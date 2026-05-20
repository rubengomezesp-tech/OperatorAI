'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search, LayoutDashboard, MessageSquare, FolderOpen, ImageIcon,
  Mic, Zap, FileSpreadsheet, FileText, Brain, Plug, CreditCard,
  Settings, LogOut, Sparkles, User, Palette, Bell, Shield,
  ArrowRight, Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  category: string;
  keywords?: string[];
}

const items: NavItem[] = [
  // Workspace
  { id: 'dashboard', label: 'Go to Dashboard', href: '/dashboard', icon: LayoutDashboard, shortcut: ['G', 'D'], category: 'Navigation', keywords: ['home', 'overview'] },
  { id: 'chat', label: 'New Chat', href: '/chat', icon: MessageSquare, shortcut: ['⌘', 'N'], category: 'Navigation', keywords: ['creative agent', 'conversation', 'ask'] },
  { id: 'projects', label: 'Go to Projects', href: '/projects', icon: FolderOpen, category: 'Navigation', keywords: ['workspaces', 'brands'] },
  // Studio
  { id: 'image-studio', label: 'Image Studio', href: '/studio/image', icon: ImageIcon, category: 'Studio', keywords: ['generate image', 'flux', 'imagen'] },
  { id: 'voice', label: 'Voice Mode', href: '/voice', icon: Mic, category: 'Studio', keywords: ['speak', 'talk', 'microphone'] },
  // Automate
  { id: 'files', label: 'Files & Analysis', href: '/files', icon: FileSpreadsheet, category: 'Automate', keywords: ['csv', 'excel', 'data', 'code interpreter'] },
  // Intelligence
  { id: 'knowledge', label: 'Knowledge', href: '/knowledge', icon: FileText, category: 'Intelligence', keywords: ['documents', 'rag', 'search docs'] },
  { id: 'coding', label: 'Operator Codex', href: '/coding', icon: Terminal, category: 'Intelligence', keywords: ['repo', 'code', 'codex', 'terminal', 'github'] },
  { id: 'assistants', label: 'Assistants', href: '/assistants', icon: Sparkles, category: 'Intelligence' },
  // Settings
  { id: 'settings', label: 'All Settings', href: '/settings', icon: Settings, shortcut: ['G', 'S'], category: 'Settings' },
  { id: 'profile', label: 'Profile', href: '/settings/profile', icon: User, category: 'Settings' },
  { id: 'appearance', label: 'Appearance', href: '/settings/appearance', icon: Palette, category: 'Settings', keywords: ['theme', 'dark', 'light'] },
  { id: 'notifications', label: 'Notifications', href: '/settings/notifications', icon: Bell, category: 'Settings' },
  { id: 'security', label: 'Security', href: '/settings/security', icon: Shield, category: 'Settings', keywords: ['password', '2fa'] },
  { id: 'ai', label: 'AI Preferences', href: '/settings/ai', icon: Brain, category: 'Settings', keywords: ['model', 'temperature', 'gpt', 'claude'] },
  { id: 'integrations', label: 'Integrations', href: '/settings/integrations', icon: Plug, category: 'Settings', keywords: ['gmail', 'notion', 'slack', 'calendar'] },
  { id: 'billing', label: 'Billing', href: '/settings/billing', icon: CreditCard, category: 'Settings', keywords: ['plan', 'subscription', 'invoices'] },
  { id: 'memory', label: 'Memory', href: '/settings/memory', icon: Brain, category: 'Settings' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const runItem = useCallback((item: NavItem) => {
    onClose();
    setSearch('');
    router.push(item.href);
  }, [onClose, router]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = window.setTimeout(() => setSearch(''), 0);
      return () => {
        window.clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fadeIn" />
      <div
        className="relative w-full max-w-[620px] animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-xl border border-border bg-bg shadow-2xl overflow-hidden"
          filter={(value, search, keywords) => {
            const haystack = (value + ' ' + (keywords ?? []).join(' ')).toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 text-fg-subtle" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search commands, pages, settings..."
              autoFocus
              className="flex-1 bg-transparent py-4 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none"
            />
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono text-fg-subtle">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-4 py-10 text-center text-[13px] text-fg-muted">
              No results found.
            </Command.Empty>

            {Array.from(new Set(items.map((i) => i.category))).map((category) => (
              <Command.Group
                key={category}
                heading={
                  <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] text-fg-subtle">
                    {category}
                  </div>
                }
              >
                {items
                  .filter((i) => i.category === category)
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.id}
                        value={item.label}
                        keywords={item.keywords}
                        onSelect={() => runItem(item)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] cursor-pointer',
                          'data-[selected=true]:bg-gold/10 data-[selected=true]:text-fg',
                          'text-fg-muted'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 text-fg-subtle data-[selected=true]:text-gold" />
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                          <div className="flex items-center gap-0.5">
                            {item.shortcut.map((k, i) => (
                              <kbd
                                key={i}
                                className="min-w-[18px] h-4 px-1 rounded bg-surface-2 border border-border text-[9px] font-mono text-fg-subtle flex items-center justify-center"
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        )}
                        <ArrowRight className="h-3 w-3 text-fg-subtle opacity-0 data-[selected=true]:opacity-100" />
                      </Command.Item>
                    );
                  })}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface/40">
            <div className="text-[10.5px] text-fg-subtle flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="h-4 px-1 rounded bg-surface-2 border border-border text-[9px] font-mono">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="h-4 px-1 rounded bg-surface-2 border border-border text-[9px] font-mono">↵</kbd>
                <span>Select</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10.5px] text-fg-subtle">
              <Sparkles className="h-3 w-3 text-gold" />
              <span>Operator AI</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
