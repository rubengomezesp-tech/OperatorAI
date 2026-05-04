'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Users, CheckCircle, XCircle, Loader2, Clock,
  Globe, User, ChevronRight, RefreshCw, TrendingUp, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PushHistory {
  id: number;
  title: string;
  body: string | null;
  url: string | null;
  sent_to: 'single' | 'all';
  recipient_count: number;
  success_count: number;
  sent_by: string;
  created_at: string;
}

interface PushStats {
  totalSubscribers: number;
  history: PushHistory[];
}

export function PushPanel() {
  const [stats, setStats] = useState<PushStats>({ totalSubscribers: 0, history: [] });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [sendMode, setSendMode] = useState<'all' | 'single'>('all');
  const [targetUser, setTargetUser] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/push');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('[push] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  async function handleSend() {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (sendMode === 'single' && !targetUser.trim()) {
      toast.error('User ID is required for single push');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          url: url.trim() || undefined,
          userId: sendMode === 'single' ? targetUser.trim() : undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Sent to ${data.sent} users. ${data.success} delivered, ${data.failed} failed.`);
        setTitle('');
        setBody('');
        setUrl('');
        loadStats();
      } else {
        toast.error(data.error || 'Failed to send');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">Push Notifications</h2>
        <p className="text-[13px] text-fg-muted">Send push notifications to users and monitor delivery.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-surface-2 text-center">
          <Users className="h-5 w-5 text-blue-400 mx-auto mb-2" />
          <div className="text-[24px] font-display text-fg">{stats.totalSubscribers}</div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">Subscribers</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface-2 text-center">
          <Send className="h-5 w-5 text-gold mx-auto mb-2" />
          <div className="text-[24px] font-display text-fg">{stats.history.length}</div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">Total Sent</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface-2 text-center">
          <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <div className="text-[24px] font-display text-fg">
            {stats.history.reduce((sum, h) => sum + h.success_count, 0)}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-fg-subtle">Delivered</div>
        </div>
      </div>

      {/* Send form */}
      <div className="rounded-xl border border-gold/20 bg-surface-2 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Radio className="h-4 w-4 text-gold" />
          </div>
          <div>
            <div className="font-display text-[15px]">Send Notification</div>
            <div className="text-[11px] text-fg-muted">Delivered instantly via browser push</div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Send mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSendMode('all')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors',
                sendMode === 'all' ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-surface-3 text-fg-muted border border-border'
              )}
            >
              <Globe className="h-3.5 w-3.5" /> All subscribers
            </button>
            <button
              onClick={() => setSendMode('single')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] transition-colors',
                sendMode === 'single' ? 'bg-gold/10 text-gold border border-gold/20' : 'bg-surface-3 text-fg-muted border border-border'
              )}
            >
              <User className="h-3.5 w-3.5" /> Single user
            </button>
          </div>

          {sendMode === 'single' && (
            <input
              type="text" placeholder="User ID" value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-border bg-surface-3 text-[13px] focus:outline-none focus:border-gold/40"
            />
          )}

          <input
            type="text" placeholder="Notification title *" value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-surface-3 text-[13px] focus:outline-none focus:border-gold/40"
          />
          <input
            type="text" placeholder="Body (optional)" value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-surface-3 text-[13px] focus:outline-none focus:border-gold/40"
          />
          <input
            type="text" placeholder="URL to open on click (optional)" value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-surface-3 text-[13px] focus:outline-none focus:border-gold/40"
          />

          <button
            onClick={handleSend}
            disabled={sending || !title.trim()}
            className="w-full h-10 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Sending...' : sendMode === 'all' ? 'Send to all subscribers' : 'Send to user'}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="rounded-xl border border-border bg-surface-2 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-fg-muted" />
            <h3 className="font-display text-[15px]">Recent Notifications</h3>
          </div>
          <button onClick={loadStats} className="h-7 w-7 rounded-md hover:bg-surface-3 flex items-center justify-center">
            <RefreshCw className="h-3.5 w-3.5 text-fg-muted" />
          </button>
        </div>

        {stats.history.length === 0 ? (
          <div className="text-center py-8 text-fg-muted text-[13px]">
            No notifications sent yet
          </div>
        ) : (
          <div className="space-y-2">
            {stats.history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-3">
                <div className={cn(
                  'h-8 w-8 rounded-md flex items-center justify-center',
                  h.sent_to === 'all' ? 'bg-blue-500/10' : 'bg-gold/10'
                )}>
                  {h.sent_to === 'all' ? <Globe className="h-4 w-4 text-blue-400" /> : <User className="h-4 w-4 text-gold" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-fg truncate font-medium">{h.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-fg-muted mt-0.5">
                    <span>{h.recipient_count} recipients</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-400" /> {h.success_count}
                    </span>
                    {h.recipient_count - h.success_count > 0 && (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-400" /> {h.recipient_count - h.success_count}
                      </span>
                    )}
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-[10px] text-fg-subtle uppercase">{h.sent_to}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
