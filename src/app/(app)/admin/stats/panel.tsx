'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Users, CreditCard, ImageIcon, MessageSquare,
  DollarSign, Activity, RefreshCw, ArrowUp, ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardStats {
  users: { total: number; newToday: number; newThisWeek: number; active24h: number };
  revenue: { mrr: number; today: number; thisMonth: number };
  usage: {
    chats: number; chatsToday: number;
    images: number; imagesToday: number;
    ads: number; adsToday: number;
  };
  subscriptions: { total: number; active: number; trialing: number };
  daily: Array<{ day: string; users: number; chats: number; images: number; revenue: number }>;
}

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'];

export function StatsPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?range=${timeRange}`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setStats(data.stats || data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 text-[13px]">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, change, color }: {
    icon: any; label: string; value: string; change?: { value: string; positive: boolean }; color: string;
  }) => (
    <div className="bg-surface-2 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-fg-subtle">{label}</span>
        <div className={cn('h-8 w-8 rounded-md flex items-center justify-center', color)}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </div>
      <div className="text-2xl font-display text-fg">{value}</div>
      {change && (
        <div className="flex items-center gap-1 mt-1">
          {change.positive ? <ArrowUp className="h-3 w-3 text-green-400" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
          <span className={cn('text-[11px]', change.positive ? 'text-green-400' : 'text-red-400')}>
            {change.value}
          </span>
        </div>
      )}
    </div>
  );

  const subscriptionData = [
    { name: 'Active', value: stats.subscriptions.active },
    { name: 'Trialing', value: stats.subscriptions.trialing },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-display">Stats & Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                'px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors',
                timeRange === range
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : 'text-fg-muted hover:text-fg border border-transparent'
              )}
            >
              {range}
            </button>
          ))}
          <button onClick={loadStats} className="h-9 w-9 rounded-md border border-border bg-surface-2 hover:bg-surface-3 flex items-center justify-center">
            <RefreshCw className="h-3.5 w-3.5 text-fg-muted" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={DollarSign} label="MRR" value={`€${(stats.revenue.mrr || 0).toLocaleString()}`} color="bg-green-500"
          change={{ value: `€${stats.revenue.today} today`, positive: true }} />
        <StatCard icon={Users} label="Total Users" value={String(stats.users.total)} color="bg-blue-500"
          change={{ value: `+${stats.users.newToday} today`, positive: true }} />
        <StatCard icon={Activity} label="Active (24h)" value={String(stats.users.active24h)} color="bg-purple-500" />
        <StatCard icon={CreditCard} label="Subs" value={String(stats.subscriptions.active)} color="bg-gold"
          change={{ value: `${stats.subscriptions.trialing} trialing`, positive: true }} />
      </div>

      {/* Usage cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface-2 border border-border rounded-lg p-4 text-center">
          <MessageSquare className="h-5 w-5 text-blue-400 mx-auto mb-2" />
          <div className="text-xl font-display text-fg">{stats.usage.chats.toLocaleString()}</div>
          <div className="text-[11px] text-fg-subtle">Chats</div>
          <div className="text-[10px] text-fg-subtle/60">{stats.usage.chatsToday} today</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-4 text-center">
          <ImageIcon className="h-5 w-5 text-green-400 mx-auto mb-2" />
          <div className="text-xl font-display text-fg">{stats.usage.images.toLocaleString()}</div>
          <div className="text-[11px] text-fg-subtle">Images</div>
          <div className="text-[10px] text-fg-subtle/60">{stats.usage.imagesToday} today</div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg p-4 text-center">
          <TrendingUp className="h-5 w-5 text-gold mx-auto mb-2" />
          <div className="text-xl font-display text-fg">{stats.usage.ads.toLocaleString()}</div>
          <div className="text-[11px] text-fg-subtle">Ads</div>
          <div className="text-[10px] text-fg-subtle/60">{stats.usage.adsToday} today</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-2 border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-medium text-fg mb-4">Usage Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats.daily}>
              <defs>
                <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="chats" stroke="#3B82F6" fill="url(#colorChats)" strokeWidth={2} />
              <Area type="monotone" dataKey="images" stroke="#10B981" fill="url(#colorImages)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-[11px] text-fg-subtle">Chats</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-[11px] text-fg-subtle">Images</span></div>
          </div>
        </div>

        <div className="bg-surface-2 border border-border rounded-lg p-5">
          <h3 className="text-[13px] font-medium text-fg mb-4">Subscriptions</h3>
          {subscriptionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {subscriptionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} />
                <Legend formatter={(value: string) => <span className="text-[11px] text-fg-muted">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-fg-subtle text-[13px]">No subscription data yet</div>
          )}
        </div>

        <div className="bg-surface-2 border border-border rounded-lg p-5 lg:col-span-2">
          <h3 className="text-[13px] font-medium text-fg mb-4">Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} formatter={(value) => [`€${value}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
