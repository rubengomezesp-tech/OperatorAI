'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, MessageSquare, Trash2, ChevronLeft, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ChatItem {
  id: string;
  title: string | null;
  updated_at: string;
}

export function ChatHistory({ onSelect, currentId }: { onSelect?: (id: string) => void; currentId?: string | null }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations/list');
      const data = await res.json();
      setChats(data.conversations ?? []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  function selectChat(id: string) {
    if (onSelect) onSelect(id);
    else router.push('/chat/' + id);
  }

  function newChat() {
    if (onSelect) onSelect('new');
    else router.push('/chat');
  }

  async function deleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(locale === 'es' ? '¿Eliminar esta conversación?' : 'Delete this conversation?')) return;
    setChats(prev => prev.filter(c => c.id !== id));
    await fetch('/api/conversations/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const filtered = search
    ? chats.filter(c => (c.title ?? '').toLowerCase().includes(search.toLowerCase()))
    : chats;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  function dateGroup(d: string) {
    const date = new Date(d).toDateString();
    if (date === today) return locale === 'es' ? 'Hoy' : 'Today';
    if (date === yesterday) return locale === 'es' ? 'Ayer' : 'Yesterday';
    return new Date(d).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' });
  }

  let lastGroup = '';

  return (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={newChat}
          className="w-full h-9 rounded-lg border border-border bg-surface-2 hover:border-gold/40 hover:bg-gold/5 text-[13px] text-fg-muted hover:text-gold flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{locale === 'es' ? 'Nueva conversación' : 'New conversation'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-fg-subtle" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={locale === 'es' ? 'Buscar...' : 'Search...'}
            className="w-full h-8 pl-7 pr-3 rounded-md border border-border bg-surface-2 text-[12px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {loading && <div className="py-8 text-center text-[12px] text-fg-muted">Loading...</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-8 text-center text-[12px] text-fg-muted">
            {locale === 'es' ? 'Sin conversaciones' : 'No conversations'}
          </div>
        )}
        {filtered.map((chat) => {
          const group = dateGroup(chat.updated_at);
          const showGroup = group !== lastGroup;
          lastGroup = group;
          const active = chat.id === currentId;

          return (
            <div key={chat.id}>
              {showGroup && (
                <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle px-2 pt-3 pb-1">{group}</div>
              )}
              <button
                onClick={() => selectChat(chat.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 group transition-all',
                  active
                    ? 'bg-gold/10 border border-gold/20 text-fg'
                    : 'hover:bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                <MessageSquare className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-gold' : 'text-fg-subtle')} />
                <span className="flex-1 text-[13px] truncate">{chat.title || (locale === 'es' ? 'Sin título' : 'Untitled')}</span>
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="h-6 w-6 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 text-fg-subtle hover:text-red-400 transition-all"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
