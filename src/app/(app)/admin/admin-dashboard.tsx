'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, ImageIcon, ThumbsUp, ThumbsDown, Heart, Flag, Shield, TrendingUp, Clock, Settings, Save, Loader2, Bell, Wrench, Mail, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BrandAssetsManager } from './brand-assets/manager';
import { AdminSidebar, AdminMenuButton, type AdminTabId } from './admin-sidebar';
import { SubscriptionsPanel } from './subscriptions/panel';
import { HomeContentEditor } from './home-content/editor';
import { SupportPanel } from './support/panel';
import { UsersPanel } from './users-panel/panel';
import { SystemPanel } from './system/panel';
import { LogsPanel } from './logs/panel';
import { ChatBehaviorPanel } from './chat-behavior/panel';
import { DnaCardsPanel } from './dna-cards/panel';
import { StatsPanel } from './stats/panel';

interface Stats { users: number; conversations: number; images: number }
interface FeedbackItem { id: string; feedback_type: string; message_preview: string | null; comment: string | null; created_at: string }
interface UserItem { id: string; email: string; full_name: string | null; created_at: string; last_sign_in: string | null; provider: string }
interface AppSettings {
  support_email: string;
  support_url: string;
  announcement: string;
  announcement_active: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  default_model: string;
  max_free_messages: number;
  max_free_images: number;
  welcome_message: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  support_email: 'rubengomezesp@gmail.com',
  support_url: 'https://www.operatoraiapp.com/support',
  announcement: '',
  announcement_active: false,
  maintenance_mode: false,
  maintenance_message: '',
  default_model: 'gpt-4o',
  max_free_messages: 50,
  max_free_images: 5,
  welcome_message: '',
};

export function AdminDashboard() {
  const [tab, setTab] = useState<AdminTabId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({ users: 0, conversations: 0, images: 0 });
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [ff, setFf] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, settingsRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/settings').then(r => r.json()),
      ]);
      setStats(statsRes.stats ?? { users: 0, conversations: 0, images: 0 });
      setFeedback(statsRes.feedback ?? []);
      setUsers(usersRes.users ?? []);
      if (settingsRes.settings && settingsRes.settings.id) {
        setSettings({ ...DEFAULT_SETTINGS, ...settingsRes.settings });
      }
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fc = {
    all: feedback.length,
    up: feedback.filter(f => f.feedback_type === 'up').length,
    down: feedback.filter(f => f.feedback_type === 'down').length,
    heart: feedback.filter(f => f.feedback_type === 'heart').length,
    report: feedback.filter(f => f.feedback_type === 'report').length,
  };
  const filtered = ff === 'all' ? feedback : feedback.filter(f => f.feedback_type === ff);

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Settings saved');
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        active={tab}
        onChange={setTab}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 px-4 lg:px-10 py-8 space-y-6 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-2">
          <AdminMenuButton onClick={() => setSidebarOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-red-500/15 border border-red-500/30 flex items-center justify-center"><Shield className="h-4 w-4 text-red-400" /></div>
            <span className="font-display text-[15px]">Admin</span>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center"><Shield className="h-5 w-5 text-red-400" /></div>
          <div><h1 className="font-display text-[28px]">Admin Panel</h1><p className="text-[12px] text-fg-muted">CEO access only — full control</p></div>
        </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SC icon={Users} label="Total Users" value={stats.users} color="text-blue-400" />
            <SC icon={MessageSquare} label="Conversations" value={stats.conversations} color="text-emerald-400" />
            <SC icon={ImageIcon} label="Images Generated" value={stats.images} color="text-purple-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: 'Positive', v: fc.up, c: 'text-emerald-400' },
              { l: 'Negative', v: fc.down, c: 'text-red-400' },
              { l: 'Loved', v: fc.heart, c: 'text-pink-400' },
              { l: 'Reports', v: fc.report, c: 'text-orange-400' },
            ].map(s => (
              <div key={s.l} className={cn('rounded-lg border p-3 text-center', s.l === 'Reports' && s.v > 0 ? 'border-orange-500/30 bg-orange-500/5' : 'border-border bg-surface')}>
                <div className={cn('text-[20px] font-display', s.c)}>{s.v}</div>
                <div className="text-[10.5px] text-fg-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback */}
      {tab === 'feedback' && <SupportPanel />}

      {tab === 'users' && <UsersPanel users={users} />}

      {tab === 'brand' && (
        <div className="mt-6">
          <BrandAssetsManager />
        </div>
      )}

      {tab === 'subscriptions' && <SubscriptionsPanel />}
      {tab === 'stats' && <StatsPanel />}
      {tab === 'logs' && <LogsPanel />}
      {tab === 'home-content' && <HomeContentEditor />}
      {tab === 'system' && <SystemPanel />}

      {tab === 'settings' && (
        <div className="space-y-6">
          {/* Support */}
          <SettingsSection icon={Mail} title="Support" desc="Contact information for users">
            <Field label="Support Email" value={settings.support_email} onChange={v => setSettings(s => ({ ...s, support_email: v }))} placeholder="support@operatorai.app" />
            <Field label="Support URL" value={settings.support_url} onChange={v => setSettings(s => ({ ...s, support_url: v }))} placeholder="https://..." />
          </SettingsSection>

          {/* Announcements */}
          <SettingsSection icon={Bell} title="Announcements" desc="Show a banner to all users">
            <Toggle label="Show announcement" checked={settings.announcement_active} onChange={v => setSettings(s => ({ ...s, announcement_active: v }))} />
            <Field label="Announcement text" value={settings.announcement} onChange={v => setSettings(s => ({ ...s, announcement: v }))} placeholder="New feature available..." />
          </SettingsSection>

          {/* Maintenance */}
          <SettingsSection icon={Wrench} title="Maintenance Mode" desc="Take the app offline temporarily">
            <Toggle label="Enable maintenance mode" checked={settings.maintenance_mode} onChange={v => setSettings(s => ({ ...s, maintenance_mode: v }))} danger />
            <Field label="Maintenance message" value={settings.maintenance_message} onChange={v => setSettings(s => ({ ...s, maintenance_message: v }))} placeholder="We are upgrading..." />
          </SettingsSection>

          {/* AI Config */}
          <SettingsSection icon={Zap} title="AI Configuration" desc="Default model and quotas">
            <div>
              <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">Default Model</label>
              <div className="flex gap-2">
                {['gpt-4o', 'claude-sonnet-4-5-20250929', 'gemini-2.5-flash-preview'].map(m => (
                  <button key={m} onClick={() => setSettings(s => ({ ...s, default_model: m }))} className={cn('h-8 px-3 rounded-md text-[11px] border transition', settings.default_model === m ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>
                    {m.includes('gpt') ? 'GPT-4o' : m.includes('claude') ? 'Claude' : 'Gemini'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Free messages/month" value={settings.max_free_messages} onChange={v => setSettings(s => ({ ...s, max_free_messages: v }))} />
              <NumberField label="Free images/month" value={settings.max_free_images} onChange={v => setSettings(s => ({ ...s, max_free_images: v }))} />
            </div>
          </SettingsSection>

          {/* Welcome */}
          <SettingsSection icon={Globe} title="Welcome Message" desc="Custom greeting for new users">
            <Field label="Welcome text" value={settings.welcome_message} onChange={v => setSettings(s => ({ ...s, welcome_message: v }))} placeholder="Welcome to Operator AI..." multiline />
          </SettingsSection>

          {/* Save */}
          <button onClick={saveSettings} disabled={saving} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

function SC({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('h-9 w-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center', color)}><Icon className="h-4 w-4" /></div>
        <span className="text-[12px] text-fg-muted uppercase tracking-[0.12em]">{label}</span>
      </div>
      <div className="font-display text-[32px]">{value.toLocaleString()}</div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, desc, children }: { icon: typeof Mail; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center"><Icon className="h-4 w-4 text-gold" /></div>
        <div><div className="font-display text-[15px]">{title}</div><div className="text-[11px] text-fg-muted">{desc}</div></div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className="w-full px-3 py-2 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40 resize-none" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" />
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{label}</label>
      <input type="number" value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" />
    </div>
  );
}

function Toggle({ label, checked, onChange, danger }: { label: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <button onClick={() => onChange(!checked)} className="flex items-center justify-between w-full py-2">
      <span className="text-[13px]">{label}</span>
      <div className={cn('h-6 w-11 rounded-full transition-colors relative', checked ? (danger ? 'bg-red-500' : 'bg-gold') : 'bg-surface-3 border border-border')}>
        <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </div>
    </button>
  );
}
