'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Search, Crown, Sparkles, Zap, Gem, X, AlertTriangle, Gift, RefreshCw, Ban, ShieldOff, Clock } from 'lucide-react';
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

const PLAN_OPTIONS = [
  { id: 'starter', label: 'Starter ($29/mo)', icon: Sparkles },
  { id: 'pro', label: 'Pro ($99/mo)', icon: Zap },
  { id: 'studio', label: 'Studio ($299/mo)', icon: Crown },
  { id: 'agency', label: 'Agency ($499/mo)', icon: Gem },
];

export function UsersPanel({ users: initialUsers }: { users: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UserItem | null>(null);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  });

  const stats = {
    total: users.length,
    banned: users.filter((u) => u.banned).length,
    last7d: users.filter((u) => {
      const created = new Date(u.created_at).getTime();
      return Date.now() - created < 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fg-subtle" />
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-md bg-surface-2 border border-border text-[13.5px] focus:outline-none focus:border-gold/40"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((u) => (
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
              <div className="text-[14px] truncate flex items-center gap-2">
                {u.full_name || 'No name'}
                {u.banned && <span className="text-[10px] uppercase tracking-wider text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/15">Banned</span>}
              </div>
              <div className="text-[12px] text-fg-muted truncate">{u.email}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0 text-[10px] text-fg-subtle">
              <span className="px-1.5 py-0.5 rounded bg-surface-3 uppercase">{u.provider}</span>
              <div className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(u.created_at).toLocaleDateString()}
              </div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-fg-muted text-[13px]">No users match your search</div>
        )}
      </div>

      <p className="text-[11.5px] text-fg-subtle text-center">{filtered.length} of {users.length} users</p>

      {selected && (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: UserItem; onClose: () => void }) {
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
    if (reason === null) return; // canceled
    handleAction('ban', { reason });
  }

  function handleGrant(planId: string) {
    if (!confirm(`Grant ${planId} plan to ${user.email}? This will create a manual subscription valid for 1 year.`)) return;
    handleAction('grant_plan', { planId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-w-md w-full bg-surface-2 border border-border rounded-2xl shadow-2xl overflow-hidden">
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
              <div className="font-display text-[18px] tracking-tight truncate">{user.full_name || 'No name'}</div>
              <div className="text-[12.5px] text-fg-muted truncate">{user.email}</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-md hover:bg-surface-3 flex items-center justify-center flex-shrink-0">
            <X className="h-4 w-4 text-fg-muted" />
          </button>
        </div>

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
              <ActionButton
                icon={Gift}
                label="Grant plan manually"
                desc="Give this user a free plan for 1 year"
                onClick={() => setShowGrant(true)}
                loading={false}
              />
              <ActionButton
                icon={RefreshCw}
                label="Refund last charge"
                desc="Refund their most recent Stripe charge"
                onClick={() => handleAction('refund_last')}
                loading={actioning === 'refund_last'}
              />
              {user.banned ? (
                <ActionButton
                  icon={ShieldOff}
                  label="Unban user"
                  desc="Restore access to the platform"
                  onClick={() => handleAction('unban')}
                  loading={actioning === 'unban'}
                  variant="warning"
                />
              ) : (
                <ActionButton
                  icon={Ban}
                  label="Ban user"
                  desc="Block all access (reversible)"
                  onClick={handleBan}
                  loading={actioning === 'ban'}
                  variant="danger"
                />
              )}
            </>
          )}
          {showGrant && (
            <div className="space-y-2">
              <div className="text-[12px] text-fg-muted mb-2">Choose a plan to grant:</div>
              {PLAN_OPTIONS.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleGrant(p.id)}
                    disabled={actioning === 'grant_plan'}
                    className="w-full p-3 rounded-md border border-border hover:border-gold/30 bg-surface-3 hover:bg-gold/5 transition-colors text-left flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 text-gold" />
                    <span className="text-[13px] flex-1">{p.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setShowGrant(false)}
                className="w-full h-9 rounded-md border border-border text-[12px] text-fg-muted hover:text-fg"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
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
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
  loading: boolean;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const colors = {
    default: 'border-border hover:border-gold/30 hover:bg-gold/5',
    danger: 'border-rose-500/30 hover:bg-rose-500/10 text-rose-400',
    warning: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'w-full p-3 rounded-md border bg-surface-3 transition-colors text-left flex items-center gap-3 disabled:opacity-50',
        colors[variant]
      )}
    >
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
    <div className={cn(
      'p-4 rounded-xl border bg-surface-2',
      highlight && !negative && 'border-emerald-500/30',
      highlight && negative && 'border-rose-500/30',
      !highlight && 'border-border'
    )}>
      <div className="text-[11px] uppercase tracking-wider text-fg-subtle mb-1">{label}</div>
      <div className={cn(
        'text-[22px] font-display tracking-tight',
        highlight && !negative && 'text-emerald-400',
        highlight && negative && 'text-rose-400'
      )}>{value}</div>
    </div>
  );
}
