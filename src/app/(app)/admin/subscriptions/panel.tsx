'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Users, AlertTriangle, TrendingUp, Loader2, Search, Crown, Sparkles, Zap, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Metrics {
  mrr: number;
  active: number;
  trialing: number;
  pastDue: number;
  canceledLast30d: number;
  conversionRate: number;
  churnRate: number;
  trialsExpiring24h: number;
  trialsExpiring7d: number;
}

interface Sub {
  id: string;
  orgId: string;
  orgName: string;
  planId: string;
  status: string;
  interval: string | null;
  trialEnd: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  stripeCustomerId: string | null;
}

const PLAN_ICONS: Record<string, typeof Sparkles> = {
  starter: Sparkles, pro: Zap, studio: Crown, agency: Gem,
};
const PLAN_COLORS: Record<string, string> = {
  starter: 'text-blue-400', pro: 'text-gold', studio: 'text-purple-400', agency: 'text-rose-400',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  trialing: 'bg-gold/15 text-gold border-gold/30',
  past_due: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  canceled: 'bg-red-500/15 text-red-400 border-red-500/30',
  incomplete: 'bg-fg-subtle/15 text-fg-subtle border-fg-subtle/30',
  unpaid: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function SubscriptionsPanel() {
  const [data, setData] = useState<{ metrics: Metrics; byPlan: Record<string, number>; subscriptions: Sub[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'trialing' | 'past_due' | 'canceled'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/admin/subscriptions')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="text-fg-muted">Error loading subscriptions</div>;

  const { metrics, byPlan, subscriptions } = data;

  const filtered = subscriptions
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => !search || s.orgName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] tracking-tight mb-1">Subscriptions</h2>
        <p className="text-[13px] text-fg-muted">Monitor MRR, trials, churn and individual subscriptions.</p>
      </div>

      {/* Top metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={DollarSign} label="MRR" value={`$${metrics.mrr.toFixed(0)}`} hint="Monthly recurring" color="text-gold" highlight />
        <MetricCard icon={Users} label="Active" value={metrics.active} hint="Paying customers" color="text-emerald-400" />
        <MetricCard icon={TrendingUp} label="Trialing" value={metrics.trialing} hint={`${metrics.trialsExpiring24h} expire <24h`} color="text-blue-400" />
        <MetricCard icon={AlertTriangle} label="Past due" value={metrics.pastDue} hint={`${metrics.canceledLast30d} canceled (30d)`} color="text-amber-400" />
      </div>

      {/* Secondary metrics + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-xl border border-border bg-surface-2">
          <h3 className="text-[13px] font-medium text-fg-soft mb-3 uppercase tracking-wider">Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] text-fg-subtle uppercase tracking-wider mb-1">Conversion</div>
              <div className="text-[24px] font-display tracking-tight text-emerald-400">{metrics.conversionRate}%</div>
              <div className="text-[11px] text-fg-subtle">Trials → paid</div>
            </div>
            <div>
              <div className="text-[11px] text-fg-subtle uppercase tracking-wider mb-1">Churn (30d)</div>
              <div className="text-[24px] font-display tracking-tight text-rose-400">{metrics.churnRate}%</div>
              <div className="text-[11px] text-fg-subtle">Cancelled rate</div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border bg-surface-2">
          <h3 className="text-[13px] font-medium text-fg-soft mb-3 uppercase tracking-wider">By plan</h3>
          <div className="space-y-2.5">
            {['starter', 'pro', 'studio', 'agency'].map((p) => {
              const count = byPlan[p] ?? 0;
              const total = Object.values(byPlan).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const Icon = PLAN_ICONS[p];
              const color = PLAN_COLORS[p];
              return (
                <div key={p}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5', color)} />
                      <span className="text-[12.5px] capitalize">{p}</span>
                    </div>
                    <span className="text-[12px] text-fg-muted">{count} <span className="text-fg-subtle">({pct}%)</span></span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-md bg-surface-2 border border-border w-fit overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'trialing', label: 'Trialing' },
            { id: 'past_due', label: 'Past due' },
            { id: 'canceled', label: 'Canceled' },
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
            placeholder="Search by org name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-md bg-surface-2 border border-border text-[13px] focus:outline-none focus:border-gold/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-border bg-surface-3/40">
                <th className="text-left p-3 font-medium text-fg-soft">Organization</th>
                <th className="text-left p-3 font-medium text-fg-soft">Plan</th>
                <th className="text-left p-3 font-medium text-fg-soft">Status</th>
                <th className="text-left p-3 font-medium text-fg-soft">Period end</th>
                <th className="text-left p-3 font-medium text-fg-soft">Created</th>
                <th className="text-right p-3 font-medium text-fg-soft">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-fg-muted text-[13px]">
                    No subscriptions match your filter
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const Icon = PLAN_ICONS[s.planId] ?? Sparkles;
                const planColor = PLAN_COLORS[s.planId] ?? 'text-fg';
                const statusColor = STATUS_COLORS[s.status] ?? 'bg-fg-subtle/15 text-fg-subtle border-fg-subtle/30';
                return (
                  <tr key={s.id} className="border-b border-border hover:bg-surface-3/30 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-fg">{s.orgName}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3 w-3', planColor)} />
                        <span className="capitalize">{s.planId}</span>
                        {s.interval && <span className="text-fg-subtle text-[11px]">· {s.interval === 'yearly' ? 'yr' : 'mo'}</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={cn('inline-flex h-5 px-2 rounded items-center text-[10.5px] uppercase tracking-wider border', statusColor)}>
                        {s.status === 'past_due' ? 'past due' : s.status}
                      </span>
                      {s.cancelAtPeriodEnd && (
                        <span className="ml-1.5 text-[10.5px] text-rose-400 uppercase">will cancel</span>
                      )}
                    </td>
                    <td className="p-3 text-fg-muted">
                      {s.status === 'trialing' && s.trialEnd
                        ? new Date(s.trialEnd).toLocaleDateString()
                        : s.periodEnd ? new Date(s.periodEnd).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3 text-fg-muted">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {s.stripeCustomerId ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${s.stripeCustomerId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gold hover:text-gold-soft text-[11.5px] uppercase tracking-wider"
                        >
                          View →
                        </a>
                      ) : (
                        <span className="text-fg-subtle">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11.5px] text-fg-subtle text-center">{filtered.length} of {subscriptions.length} subscriptions</p>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, color, highlight }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'p-4 rounded-xl border bg-surface-2',
      highlight ? 'border-gold/30 bg-gold/[0.03]' : 'border-border'
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('h-3.5 w-3.5', color ?? 'text-fg-muted')} />
        <span className="text-[11px] uppercase tracking-wider text-fg-muted">{label}</span>
      </div>
      <div className="text-[24px] font-display tracking-tight">{value}</div>
      {hint && <div className="text-[11px] text-fg-subtle mt-1">{hint}</div>}
    </div>
  );
}
