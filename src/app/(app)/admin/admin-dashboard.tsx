'use client';
import { useState } from 'react';
import { Users, MessageSquare, ImageIcon, ThumbsUp, ThumbsDown, Heart, Flag, Shield, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats { users: number; conversations: number; images: number; }
interface FeedbackItem { id: string; feedback_type: string; message_preview: string | null; comment: string | null; created_at: string; }
interface UserItem { id: string; email: string; full_name: string | null; created_at: string; }

export function AdminDashboard({ stats, feedback, recentUsers }: { stats: Stats; feedback: FeedbackItem[]; recentUsers: UserItem[] }) {
  const [tab, setTab] = useState<'overview' | 'feedback' | 'users'>('overview');
  const [feedbackFilter, setFeedbackFilter] = useState<string>('all');

  const feedbackCounts = {
    all: feedback.length,
    up: feedback.filter(f => f.feedback_type === 'up').length,
    down: feedback.filter(f => f.feedback_type === 'down').length,
    heart: feedback.filter(f => f.feedback_type === 'heart').length,
    report: feedback.filter(f => f.feedback_type === 'report').length,
  };

  const filteredFeedback = feedbackFilter === 'all' ? feedback : feedback.filter(f => f.feedback_type === feedbackFilter);

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1100px] w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
          <Shield className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="font-display text-[28px]">Admin Panel</h1>
          <p className="text-[12px] text-fg-muted">CEO access only — rubengomezesp@gmail.com</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-surface-2 w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'feedback', label: 'Feedback', icon: MessageSquare },
          { id: 'users', label: 'Users', icon: Users },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={cn(
              'h-8 px-4 rounded-md text-[13px] flex items-center gap-2 transition-colors',
              tab === t.id ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.users} color="text-blue-400" />
            <StatCard icon={MessageSquare} label="Conversations" value={stats.conversations} color="text-emerald-400" />
            <StatCard icon={ImageIcon} label="Images Generated" value={stats.images} color="text-purple-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="👍 Positive" value={feedbackCounts.up} />
            <MiniStat label="👎 Negative" value={feedbackCounts.down} />
            <MiniStat label="❤️ Loved" value={feedbackCounts.heart} />
            <MiniStat label="🚩 Reports" value={feedbackCounts.report} alert={feedbackCounts.report > 0} />
          </div>
          {feedbackCounts.report > 0 && (
            <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flag className="h-4 w-4 text-orange-400" />
                <span className="text-[13px] font-medium text-orange-400">Recent Reports</span>
              </div>
              <div className="space-y-2">
                {feedback.filter(f => f.feedback_type === 'report').slice(0, 5).map(f => (
                  <div key={f.id} className="rounded-md bg-surface-2 border border-border p-3">
                    {f.comment && <p className="text-[13px] text-fg-soft mb-1 italic">&ldquo;{f.comment}&rdquo;</p>}
                    {f.message_preview && <p className="text-[11.5px] text-fg-muted line-clamp-2">{f.message_preview}</p>}
                    <span className="text-[10px] text-fg-subtle">{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK TAB */}
      {tab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['all', 'up', 'down', 'heart', 'report'].map(f => (
              <button
                key={f}
                onClick={() => setFeedbackFilter(f)}
                className={cn(
                  'h-8 px-3 rounded-md text-[12px] border transition-colors flex items-center gap-1.5',
                  feedbackFilter === f ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                <span>{f === 'all' ? '🔵' : f === 'up' ? '👍' : f === 'down' ? '👎' : f === 'heart' ? '❤️' : '🚩'}</span>
                <span>{feedbackCounts[f as keyof typeof feedbackCounts]}</span>
              </button>
            ))}
          </div>
          {filteredFeedback.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-fg-muted">No feedback yet</div>
          ) : (
            <div className="space-y-2">
              {filteredFeedback.map(f => {
                const colors: Record<string, string> = { up: 'border-emerald-500/20 bg-emerald-500/5', down: 'border-red-500/20 bg-red-500/5', heart: 'border-pink-500/20 bg-pink-500/5', report: 'border-orange-500/20 bg-orange-500/5' };
                return (
                  <div key={f.id} className={cn('rounded-lg border p-4', colors[f.feedback_type] ?? 'border-border bg-surface')}>
                    <div className="flex items-start gap-3">
                      <span className="text-[18px] shrink-0">{f.feedback_type === 'up' ? '👍' : f.feedback_type === 'down' ? '👎' : f.feedback_type === 'heart' ? '❤️' : '🚩'}</span>
                      <div className="flex-1 min-w-0">
                        {f.message_preview && <p className="text-[13px] text-fg-soft line-clamp-3">{f.message_preview}</p>}
                        {f.comment && (
                          <div className="mt-2 rounded-md bg-surface-2 border border-border px-3 py-2">
                            <p className="text-[12.5px] text-fg-muted italic">{f.comment}</p>
                          </div>
                        )}
                        <span className="text-[10.5px] text-fg-subtle mt-2 block">{new Date(f.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && (
        <div className="space-y-2">
          <div className="text-[12px] text-fg-muted mb-2">{recentUsers.length} most recent</div>
          {recentUsers.map(u => (
            <div key={u.id} className="rounded-lg border border-border bg-surface p-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[14px] font-display text-gold shrink-0">
                {(u.full_name ?? u.email)?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate">{u.full_name || 'No name'}</div>
                <div className="text-[12px] text-fg-muted truncate">{u.email}</div>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-fg-subtle shrink-0">
                <Clock className="h-3 w-3" />
                <span>{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('h-9 w-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-[12px] text-fg-muted uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="font-display text-[32px]">{value.toLocaleString()}</div>
    </div>
  );
}

function MiniStat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={cn('rounded-lg border p-3 text-center', alert ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-surface')}>
      <div className={cn('text-[20px] font-display', alert ? 'text-orange-400' : 'text-fg')}>{value}</div>
      <div className="text-[10.5px] text-fg-muted mt-0.5">{label}</div>
    </div>
  );
}
