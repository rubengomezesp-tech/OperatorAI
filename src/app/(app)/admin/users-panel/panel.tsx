'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Search, Crown, Sparkles, Zap, Gem, X, AlertTriangle,
  Gift, RefreshCw, Ban, ShieldOff, Clock, Image, MessageSquare,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserItem {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in: string | null;
  provider: string;
  banned?: boolean;
}

interface UserMetrics {
  plan: { id: string; status: string; endsAt: string } | null;
  adsGenerated: number;
  conversations: number;
  lastActivity: string | null;
  recentErrors: number;
}

const PLAN_OPTIONS = [
  { id: 'starter', label: 'Starter', icon: Sparkles, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  { id: 'pro', label: 'Pro', icon: Zap, color: 'text-gold', bg: 'bg-gold/10' },
  { id: 'studio', label: 'Studio', icon: Crown, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'agency', label: 'Agency', icon: Gem, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

const PLAN_GRANT_OPTIONS = [
  { id: 'starter', label: 'Starter ($29/mo)', icon: Sparkles },
  { id: 'pro', label: 'Pro ($99/mo)', icon: Zap },
  { id: 'studio', label: 'Studio ($299/mo)', icon: Crown },
  { id: 'agency', label: 'Agency ($499/mo)', icon: Gem },
];

type FilterType = 'all' | 'google' | 'apple' | 'email' | 'banned' | 'starter' | 'pro' | 'studio' | 'agency';

export function UsersPanel({ users: initialUsers }: { users: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [metrics, setMetrics] = useState<Record<string, UserMetrics>>({});

  useEffect(() => { setUsers(initialUsers); }, [initialUsers]);

  const loadMetrics = useCallback(async (userId: string) => {
    if (metrics[userId]) return;
    try {
      const res = await fetch(`/api/admin/users/metrics?userId=${userId}`);
      const data = await res.json();
      if (!data.error) {
        setMetrics((prev) => ({ ...prev, [userId]: data }));
      }
    } catch {}
  }, [metrics]);

  useEffect(() => {
    if (selected) loadMetrics(selected.id);
  }, [selected, loadMetrics]);

  const filtered = users.filter((u) => {
    if (search) {
      const q = search.toLowerCase();
      if (!u.email.toLowerCase().includes(q) && !(u.full_name ?? '').toLowerCase().includes(q)) return false;
    }
    if (filter === 'banned') return u.banned;
    if (filter === 'google' || filter === 'apple' || filter === 'email') return u.provider === filter;
    return true;
  });

  const stats = {
    total: users.length,
    banned: users.filter((u) => u.banned).length,
    last7d: users.filter((u) => {
      return Date.now() - new Date(u.created_at).getTime() < 7 * 86400000;
    }).length,
  };

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'google', label: 'Google' },
    { id: 'apple', label: 'Apple' },
    { id: 'email', label: 'Email' },
    { id: 'banned', label: 'Banned' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">Users</h2>
        <p className="text-[13px] text-fg-muted">All registered users. Click for detail and actions.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="New (7d)" value={stats.last7d} highlight={stats.last7d > 0} />
        <Stat label="Banned" value={stats.banned} highlight={stats.banned > 0} negative />
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
          <input
            type="text" placeholder="Search by email or name..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md bg-surface-2 border border-border text-[13.5px] focus:outline-none focus:border-gold/40"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-2 rounded-md p-0.5 border border-border">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap',
                filter === f.id ? 'bg-gold/10 text-gold' : 'text-fg-muted hover:text-fg',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {filtered.map((u) => {
          const userMetrics = metrics[u.id];
          const planInfo = userMetrics?.plan ? PLAN_OPTIONS.find(p => p.id === userMetrics.plan!.id) : null;
          
          return (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className={cn(
                'w-full text-left rounded-lg border p-4 flex items-center gap-4 transition-colors',
                u.banned
                  ? 'border-rose-500/30 bg-rose-500/[0.03] hover:bg-rose-500/[0.06]'
                  : 'border-border bg-surface-2 hover:bg-surface-3/30 hover:border-gold/30'
              )}
            >
              <div className={cn(
                'h-9 w-9 rounded-full border flex items-center justify-center text-[14px] font-display shrink-0',
                u.banned ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-gold/10 border-gold/20 text-gold'
              )}>
                {(u.full_name ?? u.email)?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] truncate font-medium">
                    {u.full_name || 'No name'}
                  </span>
                  {planInfo && (
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1', planInfo.color, planInfo.bg)}>
                      <planInfo.icon className="h-2.5 w-2.5" />
                      {planInfo.label}
                    </span>
                  )}
                  {u.banned && (
                    <span className="text-[10px] uppercase tracking-wider text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/15">Banned</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[12px] text-fg-muted truncate">{u.email}</span>
                  {userMetrics && (
                    <span className="text-[11px] text-fg-subtle flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {userMetrics.conversations}
                      <Image className="h-3 w-3 ml-1" /> {userMetrics.adsGenerated}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0 text-[10px] text-fg-subtle">
                <span className="px-1.5 py-0.5 rounded bg-surface-3 uppercase">{u.provider}</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-fg-muted text-[13px]">No users match your criteria</div>
        )}
      </div>

      <p className="text-[11.5px] text-fg-subtle text-center">{filtered.length} of {users.length} users</p>

      {selected && (
        <UserDetailModal
          user={selected}
          metrics={metrics[selected.id] ?? null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, metrics, onClose }: { user: UserItem; metrics: UserMetrics | null; onClose: () => void }) {
  const [actioning, setActioning] = useState<string | null>(null);
  const [showGrant, setShowGrant] = useState(false);

  async function handleAction(action: string, payload: Record<string, unknown> = {}) {
    setActioning(action);
    try {
      const res = await fetch('/api/admin/users/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id, ...payload }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Action completed');
        onClose();
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(json.error ?? 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActioning(null);
    }
  }

  function handleBan() {
    const reason = prompt('Reason for ban (optional):');
    if (reason === null) return;
    handleAction('ban', { reason });
  }

  function handleGrant(planId: string) {
    if (!confirm(`Grant ${planId} plan to ${user.email}? 1 year.`)) return;
    handleAction('grant_plan', { planId });
  }

  const planInfo = metrics?.plan ? PLAN_OPTIONS.find(p => p.id === metrics.plan!.id) : null;
  const PlanIcon = planInfo?.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-w-md w-full bg-surface-2 border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'h-12 w-12 rounded-full border flex items-center justify-center text-[18px] font-display flex-shrink-0',
              user.banned ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-gold/10 border-gold/20 text-gold'
            )}>
              {(user.full_name ?? user.email)?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="font-display text-[18px] tracking-tight truncate flex items-center gap-2">
                {user.full_name || 'No name'}
                {planInfo && (
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1', planInfo.color, planInfo.bg)}>
                    {PlanIcon && <PlanIcon className="h-2.5 w-2.5" />}
                    {planInfo.label}
                  </span>
                )}
              </div>
              <div className="text-[12.5px] text-fg-muted truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-surface-3 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-fg-muted" />
          </button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="p-5 border-b border-border">
            <div className="text-[10.5px] uppercase tracking-wider text-fg-subtle mb-3">Activity</div>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={MessageSquare} label="Conversations" value={metrics.conversations} color="text-blue-400" />
              <MetricCard icon={Image} label="Ads Generated" value={metrics.adsGenerated} color="text-green-400" />
              {metrics.lastActivity && (
                <div className="col-span-2">
                  <div className="text-[10.5px] text-fg-subtle">Last activity</div>
                  <div className="text-[13px] text-fg mt-0.5">{new Date(metrics.lastActivity).toLocaleString()}</div>
                </div>
              )}
              {metrics.recentErrors > 0 && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 text-rose-400 text-[12px]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {metrics.recentErrors} error(s) in the last 24 hours
                  </div>
                </div>
              )}
              {metrics.plan && (
                <div className="col-span-2">
                  <div className="text-[10.5px] text-fg-subtle">Subscription</div>
                  <div className="text-[13px] text-fg mt-0.5 flex items-center gap-1">
                    <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium', metrics.plan.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400')}>
                      {metrics.plan.status}
                    </span>
                    {metrics.plan.endsAt && (
                      <span className="text-fg-muted">· ends {new Date(metrics.plan.endsAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="p-5 border-b border-border space-y-2 text-[12.5px]">
          <Row label="User ID" value={<span className="font-mono text-[11px]">{user.id}</span>} />
          <Row label="Provider" value={user.provider} />
          <Row label="Joined" value={new Date(user.created_at).toLocaleString()} />
          {user.last_sign_in && <Row label="Last sign in" value={new Date(user.last_sign_in).toLocaleString()} />}
          {user.banned && <Row label="Status" value={<span className="text-rose-400 font-medium">BANNED</span>} />}
        </div>

        {/* Actions */}
        <div className="p-5 space-y-2">
          {!showGrant && (
            <>
              <ActionButton icon={Gift} label="Grant plan manually" desc="Free plan for 1 year" onClick={() => setShowGrant(true)} loading={false} />
              <ActionButton icon={RefreshCw} label="Refund last charge" desc="Refund most recent Stripe charge" onClick={() => handleAction('refund_last')} loading={actioning === 'refund_last'} />
              {user.banned ? (
                <ActionButton icon={ShieldOff} label="Unban user" desc="Restore access" onClick={() => handleAction('unban')} loading={actioning === 'unban'} variant="warning" />
              ) : (
                <ActionButton icon={Ban} label="Ban user" desc="Block all access" onClick={handleBan} loading={actioning === 'ban'} variant="danger" />
              )}
            </>
          )}
          {showGrant && (
            <div className="space-y-2">
              <div className="text-[12px] text-fg-muted mb-2">Choose a plan:</div>
              {PLAN_GRANT_OPTIONS.map((p) => {
                const Icon = p.icon;
                return (
                  <button key={p.id} onClick={() => handleGrant(p.id)} disabled={actioning === 'grant_plan'}
                    className="w-full p-3 rounded-md border border-border hover:border-gold/30 bg-surface-3 hover:bg-gold/5 transition-colors text-left flex items-center gap-3">
                    <Icon className="h-4 w-4 text-gold" />
                    <span className="text-[13px] flex-1">{p.label}</span>
                  </button>
                );
              })}
              <button onClick={() => setShowGrant(false)} className="w-full h-9 rounded-md border border-border text-[12px] text-fg-muted hover:text-fg">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="bg-surface-3 rounded-lg p-3 text-center">
      <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
      <div className="text-lg font-display text-fg">{value}</div>
      <div className="text-[10px] text-fg-subtle">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-fg-subtle uppercase tracking-wider text-[10.5px]">{label}</span>
      <span className="text-fg-soft text-right truncate">{value}</span>
    </div>
  );
}

function ActionButton({ icon: Icon, label, desc, onClick, loading, variant = 'default' }: {
  icon: any; label: string; desc: string; onClick: () => void; loading: boolean; variant?: 'default' | 'danger' | 'warning';
}) {
  const colors = {
    default: 'border-border hover:border-gold/30 hover:bg-gold/5',
    danger: 'border-rose-500/30 hover:bg-rose-500/10 text-rose-400',
    warning: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400',
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={cn('w-full p-3 rounded-md border bg-surface-3 transition-colors text-left flex items-center gap-3 disabled:opacity-50', colors[variant])}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">{label}</div>
        <div className="text-[11.5px] opacity-70">{desc}</div>
      </div>
    </button>
  );
}

function Stat({ label, value, highlight, negative }: { label: string; value: string | number; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={cn('p-4 rounded-xl border bg-surface-2', highlight && !negative && 'border-emerald-500/30', highlight && negative && 'border-rose-500/30', !highlight && 'border-border')}>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle mb-1">{label}</div>
      <div className={cn('text-[22px] font-display tracking-tight', highlight && !negative && 'text-emerald-400', highlight && negative && 'text-rose-400')}>{value}</div>
    </div>
  );
}
