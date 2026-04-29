'use client';

/**
 * Sidebar — Modern Claude/ChatGPT style.
 *
 * Layout:
 *   - "+ New chat" button at top
 *   - Conversation history grouped by time (Today / Yesterday / 7 days / Older)
 *   - Bottom: secondary nav (Campaigns / Brand / Settings)
 *
 * Mobile-friendly. i18n preserved.
 */

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus,
  MessageSquare,
  Sparkles,
  Palette,
  Settings,
  Shield,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface Conversation {
  id: string;
  title: string | null;
  last_message_at: string | null;
}

interface SecondaryNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  isAdmin?: boolean;
  onClose?: () => void;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

type TimeGroup = 'today' | 'yesterday' | 'week' | 'older';

function groupByTime(convs: Conversation[]): Record<TimeGroup, Conversation[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const groups: Record<TimeGroup, Conversation[]> = {
    today: [],
    yesterday: [],
    week: [],
    older: [],
  };

  for (const c of convs) {
    if (!c.last_message_at) {
      groups.older.push(c);
      continue;
    }
    const t = new Date(c.last_message_at);
    if (t >= startOfToday) groups.today.push(c);
    else if (t >= startOfYesterday) groups.yesterday.push(c);
    else if (t >= startOfWeek) groups.week.push(c);
    else groups.older.push(c);
  }

  return groups;
}

// ─────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────

export function Sidebar({ isAdmin = false, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const isEs = locale === 'es';
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations/list', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setConvs(data.conversations ?? []);
    } catch {
      // silent — sidebar still renders
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-fetch when navigating between chats
  useEffect(() => {
    if (pathname?.startsWith('/chat/')) {
      const t = setTimeout(refresh, 800);
      return () => clearTimeout(t);
    }
  }, [pathname, refresh]);

  function handleNewChat() {
    router.push('/chat');
    onClose?.();
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(isEs ? '¿Borrar esta conversación?' : 'Delete this conversation?')) return;
    try {
      await fetch('/api/conversations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId: id }),
      });
      setConvs((prev) => prev.filter((c) => c.id !== id));
      // If we're viewing this chat, redirect to /chat
      if (pathname === `/chat/${id}`) {
        router.push('/chat');
      }
    } catch {
      // ignore
    }
  }

  const grouped = groupByTime(convs);
  const isOnChat = pathname?.startsWith('/chat');
  const activeChatId = isOnChat ? pathname?.split('/')[2] : null;

  const secondaryNav: SecondaryNavItem[] = [
    {
      href: '/campaigns',
      label: isEs ? 'Campañas' : 'Campaigns',
      icon: Sparkles,
    },
    {
      href: '/brand-os',
      label: isEs ? 'Marca' : 'Brand',
      icon: Palette,
    },
    {
      href: '/settings',
      label: isEs ? 'Configuración' : 'Settings',
      icon: Settings,
    },
    ...(isAdmin
      ? [
          {
            href: '/admin',
            label: 'Admin',
            icon: Shield,
          },
        ]
      : []),
  ];

  const groupLabels: Record<TimeGroup, string> = isEs
    ? {
        today: 'Hoy',
        yesterday: 'Ayer',
        week: 'Últimos 7 días',
        older: 'Anteriores',
      }
    : {
        today: 'Today',
        yesterday: 'Yesterday',
        week: 'Previous 7 days',
        older: 'Older',
      };

  return (
    <aside className="h-full w-[260px] shrink-0 border-r border-border bg-surface/60 backdrop-blur-md flex flex-col">
      {/* Brand + New Chat */}
      <div className="p-3 border-b border-border space-y-2">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2 px-2 py-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 rounded-md gold-grad flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-bg" />
          </div>
          <span className="font-display text-[15px] tracking-tight text-fg">
            Operator <span className="text-gold">AI</span>
          </span>
        </Link>

        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:border-gold/40 bg-surface-2 hover:bg-surface-3 text-[13px] text-fg-soft hover:text-fg transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isEs ? 'Nueva conversación' : 'New chat'}</span>
        </button>
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-fg-subtle" />
          </div>
        )}

        {!loading && convs.length === 0 && (
          <div className="px-3 py-6 text-center">
            <MessageSquare className="h-6 w-6 text-fg-subtle mx-auto mb-2" />
            <p className="text-[12px] text-fg-subtle leading-snug">
              {isEs
                ? 'Tus conversaciones aparecerán aquí'
                : 'Your conversations will appear here'}
            </p>
          </div>
        )}

        {!loading &&
          (Object.keys(grouped) as TimeGroup[]).map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            return (
              <div key={group}>
                <div className="px-2 mb-1.5 text-[10px] uppercase tracking-[0.16em] text-fg-subtle">
                  {groupLabels[group]}
                </div>
                <div className="space-y-0.5">
                  {items.map((c) => {
                    const isActive = activeChatId === c.id;
                    const isHovered = hoveredId === c.id;
                    return (
                      <Link
                        key={c.id}
                        href={`/chat/${c.id}`}
                        onClick={onClose}
                        onMouseEnter={() => setHoveredId(c.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={cn(
                          'group relative flex items-center gap-2 px-2.5 py-2 rounded-md text-[13px] transition-colors',
                          isActive
                            ? 'bg-gold/10 text-gold border border-gold/20'
                            : 'text-fg-soft hover:bg-surface-2 hover:text-fg border border-transparent',
                        )}
                      >
                        <span className="flex-1 truncate">
                          {c.title?.trim() || (isEs ? 'Sin título' : 'Untitled')}
                        </span>
                        {(isHovered || isActive) && (
                          <button
                            onClick={(e) => handleDelete(c.id, e)}
                            className="p-0.5 rounded hover:bg-surface-3 text-fg-subtle hover:text-red-400"
                            title={isEs ? 'Borrar' : 'Delete'}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Secondary nav (bottom) */}
      <div className="border-t border-border p-2 space-y-0.5">
        {secondaryNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
                active
                  ? 'bg-surface-2 text-fg'
                  : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
