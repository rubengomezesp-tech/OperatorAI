'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, Heart, Flag, Check, Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FeedbackItem {
  id: string;
  kind: string;
  comment: string | null;
  rating: number | null;
  categories: string[];
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
  userId: string | null;
  conversationId: string | null;
  messageId: string | null;
}

interface Stats {
  total: number;
  open: number;
  resolved: number;
  positive: number;
  negative: number;
  positivePct: number;
}

const KIND_ICONS: Record<string, typeof ThumbsUp> = {
  up: ThumbsUp, down: ThumbsDown, love: Heart, flag: Flag,
};

const KIND_COLORS: Record<string, string> = {
  up: 'text-emerald-400', down: 'text-rose-400', love: 'text-pink-400', flag: 'text-amber-400',
};

export function SupportPanel() {
  const [data, setData] = useState<{ stats: Stats; items: FeedbackItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved' | 'up' | 'down' | 'love' | 'flag'>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feedback');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleResolved(id: string, current: boolean) {
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: !current }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(current ? 'Reopened' : 'Marked resolved');
        load();
      } else {
        toast.error(json.error ?? 'Failed');
      }
    } catch {
      toast.error('Failed');
    }
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>;
  }

  const filtered = data.items
    .filter((i) => {
      if (filter === 'all') return true;
      if (filter === 'open') return !i.resolved;
      if (filter === 'resolved') return i.resolved;
      return i.kind === filter;
    })
    .filter((i) => !search || (i.comment ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">Support / Feedback</h2>
        <p className="text-[13px] text-fg-muted">All user feedback, support requests, bug reports.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={data.stats.total} />
        <Stat label="Open" value={data.stats.open} highlight={data.stats.open > 0} />
        <Stat label="Resolved" value={data.stats.resolved} />
        <Stat label="Positive" value={`${data.stats.positivePct}%`} subtext={`${data.stats.positive} of ${data.stats.total}`} />
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-md bg-surface-2 border border-border w-fit overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'open', label: 'Open' },
            { id: 'resolved', label: 'Resolved' },
            { id: 'up', label: '👍' },
            { id: 'down', label: '👎' },
            { id: 'love', label: '♡' },
            { id: 'flag', label: '⚑' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                'h-8 px-3 rounded text-[12.5px] whitespace-nowrap transition-colors',
                filter === f.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
          <input
            type="text"
            placeholder="Search comments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-2 border border-border text-[13px] focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-fg-muted text-[13px]">No feedback matches your filter</div>
        )}
        {filtered.map((f) => {
          const Icon = KIND_ICONS[f.kind] ?? MessageSquare;
          const color = KIND_COLORS[f.kind] ?? 'text-fg-muted';
          return (
            <div key={f.id} className={cn(
              'rounded-lg border bg-surface-2 p-4',
              f.resolved ? 'border-border opacity-60' : 'border-border'
            )}>
              <div className="flex items-start gap-3">
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', color)} />
                <div className="flex-1 min-w-0">
                  {f.comment && <p className="text-[13.5px] text-fg-soft whitespace-pre-wrap">{f.comment}</p>}
                  {!f.comment && <p className="text-[13px] text-fg-subtle italic">No comment provided</p>}
                  {f.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {f.categories.map((c) => (
                        <span key={c} className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-3 text-fg-subtle">{c}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-fg-subtle">
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                    {f.conversationId && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span className="font-mono">{f.conversationId.slice(0, 8)}</span>
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => toggleResolved(f.id, f.resolved)}
                  className={cn(
                    'h-8 px-3 rounded-md text-[11.5px] flex items-center gap-1.5 transition-colors flex-shrink-0',
                    f.resolved
                      ? 'border border-border text-fg-muted hover:text-fg hover:border-fg-muted'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                  )}
                >
                  <Check className="h-3 w-3" />
                  {f.resolved ? 'Reopen' : 'Resolve'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px] text-fg-subtle text-center">{filtered.length} of {data.items.length} items</p>
    </div>
  );
}

function Stat({ label, value, subtext, highlight }: { label: string; value: string | number; subtext?: string; highlight?: boolean }) {
  return (
    <div className={cn('p-4 rounded-xl border bg-surface-2', highlight ? 'border-amber-500/30 bg-amber-500/[0.03]' : 'border-border')}>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle mb-1">{label}</div>
      <div className="text-[22px] font-display tracking-tight">{value}</div>
      {subtext && <div className="text-[11px] text-fg-subtle mt-0.5">{subtext}</div>}
    </div>
  );
}
