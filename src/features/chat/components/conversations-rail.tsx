'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Plus, MessageSquare, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConversationSummary } from '@/lib/chat/types';

export function ConversationsRail({ activeId }: { activeId?: string | null }) {
  const [convs, setConvs] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch('/api/conversations/list')
      .then((r) => r.json())
      .then((data) => setConvs(data.conversations ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [activeId, refresh]);

  async function toggleStar(id: string, starred: boolean) {
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, is_starred: starred } : c)));
    await fetch('/api/conversations/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id, starred }),
    }).catch(() => {
      setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, is_starred: !starred } : c)));
    });
  }

  const starred = convs.filter((c) => c.is_starred);
  const rest = convs.filter((c) => !c.is_starred);

  return (
    <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-r border-border bg-bg">
      <div className="px-4 py-4 border-b border-border">
        <Link
          href="/chat"
          className="flex items-center gap-2 px-3 h-9 rounded-md border border-border bg-surface-2 hover:border-gold/50 text-[13px] text-fg transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-gold" />
          <span>New chat</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {loading && <div className="px-3 py-2 text-[12.5px] text-fg-subtle">Loading...</div>}
        {!loading && convs.length === 0 && (
          <div className="px-3 py-2 text-[12.5px] text-fg-subtle">No conversations yet.</div>
        )}

        {starred.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-gold">Starred</div>
            <ul className="space-y-0.5">
              {starred.map((c) => (
                <ConversationItem key={c.id} c={c} active={activeId === c.id} onStar={toggleStar} />
              ))}
            </ul>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle">Recent</div>
            <ul className="space-y-0.5">
              {rest.map((c) => (
                <ConversationItem key={c.id} c={c} active={activeId === c.id} onStar={toggleStar} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function ConversationItem({
  c, active, onStar,
}: {
  c: ConversationSummary;
  active: boolean;
  onStar: (id: string, starred: boolean) => void;
}) {
  return (
    <li className="group relative">
      <Link
        href={`/chat/${c.id}`}
        className={cn(
          'flex items-center gap-2.5 px-3 h-9 rounded-md text-[13px] transition-colors pr-8',
          active ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg',
        )}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{c.title || 'Untitled chat'}</span>
      </Link>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); onStar(c.id, !c.is_starred); }}
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center transition-all',
          c.is_starred
            ? 'opacity-100 text-gold'
            : 'opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-gold',
        )}
        aria-label={c.is_starred ? 'Unstar' : 'Star'}
      >
        <Star className={cn('h-3 w-3', c.is_starred && 'fill-current')} />
      </button>
    </li>
  );
}
