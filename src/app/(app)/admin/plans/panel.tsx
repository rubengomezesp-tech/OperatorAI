'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Save, Plus, Trash2, Edit3, Eye, EyeOff, DollarSign,
  Sparkles, Zap, Crown, Gem, Image, MessageSquare, Video, Star, X, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_monthly_usd: number | null;
  price_yearly_usd: number | null;
  entitlements: Record<string, number>;
  is_public: boolean;
  is_default: boolean;
  created_at: string;
}

const PLAN_ICONS: Record<string, typeof Sparkles> = {
  starter: Sparkles, pro: Zap, studio: Crown, agency: Gem,
};

const PLAN_COLORS: Record<string, string> = {
  starter: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  pro: 'text-gold bg-gold/10 border-gold/20',
  studio: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  agency: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const ENTITLEMENT_ICONS: Record<string, typeof MessageSquare> = {
  image_generations: Image,
  chat_messages: MessageSquare,
  video_generations: Video,
  brand_profiles: Star,
};

const ENTITLEMENT_LABELS: Record<string, string> = {
  image_generations: 'Image Generations',
  chat_messages: 'Chat Messages',
  video_generations: 'Video Generations',
  brand_profiles: 'Brand Profiles',
};

const COMMON_ENTITLEMENTS = ['image_generations', 'chat_messages', 'video_generations', 'brand_profiles'];

export function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/plans');
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch (err) {
      console.error('[plans] load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  async function savePlan(plan: Plan) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan', plan }),
      });
      if (res.ok) {
        toast.success('Plan saved');
        loadPlans();
        setEditingPlan(null);
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function togglePublic(plan: Plan) {
    await savePlan({ ...plan, is_public: !plan.is_public });
  }

  function updateEntitlement(plan: Plan, key: string, value: number) {
    setEditingPlan({
      ...plan,
      entitlements: { ...plan.entitlements, [key]: value },
    });
  }

  const IconFor = (id: string) => PLAN_ICONS[id] ?? Sparkles;
  const colorFor = (id: string) => PLAN_COLORS[id] ?? 'text-fg-muted bg-surface-3 border-border';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-[24px] tracking-tight mb-1">Plans & Pricing</h2>
          <p className="text-[13px] text-fg-muted">Manage subscription plans, pricing, and entitlements.</p>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const Icon = IconFor(plan.id);
          const colorClasses = colorFor(plan.id);

          if (editingPlan?.id === plan.id) {
            // Edit mode
            return (
              <div key={plan.id} className="rounded-xl border border-gold/30 bg-surface-2 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-gold tracking-wider">Editing</span>
                  <div className="flex gap-2">
                    <button onClick={() => savePlan(editingPlan)} disabled={saving} className="h-8 px-3 rounded-md bg-gold text-bg text-[12px] font-medium flex items-center gap-1">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
                    </button>
                    <button onClick={() => setEditingPlan(null)} className="h-8 w-8 rounded-md border border-border flex items-center justify-center">
                      <X className="h-3.5 w-3.5 text-fg-muted" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-fg-subtle block mb-1">Name</label>
                    <input value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-md border border-border bg-surface-3 text-[13px]" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-fg-subtle block mb-1">Plan ID</label>
                    <input value={editingPlan.id} disabled
                      className="w-full h-9 px-3 rounded-md border border-border bg-surface-3 text-[13px] opacity-60" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-fg-subtle block mb-1">Description</label>
                  <input value={editingPlan.description || ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })}
                    className="w-full h-9 px-3 rounded-md border border-border bg-surface-3 text-[13px]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase text-fg-subtle block mb-1">Monthly ($)</label>
                    <input type="number" value={editingPlan.price_monthly_usd ?? ''} onChange={e => setEditingPlan({ ...editingPlan, price_monthly_usd: parseFloat(e.target.value) || null })}
                      className="w-full h-9 px-3 rounded-md border border-border bg-surface-3 text-[13px]" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-fg-subtle block mb-1">Yearly ($)</label>
                    <input type="number" value={editingPlan.price_yearly_usd ?? ''} onChange={e => setEditingPlan({ ...editingPlan, price_yearly_usd: parseFloat(e.target.value) || null })}
                      className="w-full h-9 px-3 rounded-md border border-border bg-surface-3 text-[13px]" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase text-fg-subtle block mb-2">Entitlements</label>
                  <div className="space-y-2">
                    {COMMON_ENTITLEMENTS.map((key) => {
                      const EIcon = ENTITLEMENT_ICONS[key] ?? Star;
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <EIcon className="h-3.5 w-3.5 text-fg-muted" />
                          <span className="text-[12px] text-fg-muted flex-1">{ENTITLEMENT_LABELS[key]}</span>
                          <input type="number" value={editingPlan.entitlements?.[key] ?? 0}
                            onChange={e => updateEntitlement(editingPlan, key, parseInt(e.target.value) || 0)}
                            className="w-20 h-8 px-2 rounded-md border border-border bg-surface-3 text-[13px] text-center" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

          // View mode
          return (
            <div key={plan.id} className={cn('rounded-xl border bg-surface-2 p-5 transition-all', plan.is_public ? 'border-border' : 'border-border opacity-60')}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center border', colorClasses)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-[16px] text-fg">{plan.name}</span>
                      {plan.is_default && <span className="text-[9px] bg-gold/10 text-gold px-1.5 py-0.5 rounded">Default</span>}
                    </div>
                    <div className="text-[12px] text-fg-muted">{plan.description || 'No description'}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => togglePublic(plan)} className="h-7 w-7 rounded-md hover:bg-surface-3 flex items-center justify-center"
                    title={plan.is_public ? 'Public' : 'Hidden'}>
                    {plan.is_public ? <Eye className="h-3.5 w-3.5 text-gold" /> : <EyeOff className="h-3.5 w-3.5 text-fg-subtle" />}
                  </button>
                  <button onClick={() => setEditingPlan({ ...plan })} className="h-7 w-7 rounded-md hover:bg-surface-3 flex items-center justify-center">
                    <Edit3 className="h-3.5 w-3.5 text-fg-muted" />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mb-4">
                {plan.price_monthly_usd ? (
                  <>
                    <span className="text-[28px] font-display text-fg">${plan.price_monthly_usd}</span>
                    <span className="text-[12px] text-fg-subtle">/month</span>
                  </>
                ) : (
                  <span className="text-[28px] font-display text-fg">Free</span>
                )}
                {plan.price_yearly_usd && (
                  <span className="text-[11px] text-fg-subtle ml-2">${plan.price_yearly_usd}/year</span>
                )}
              </div>

              {/* Entitlements */}
              <div className="space-y-1.5">
                {COMMON_ENTITLEMENTS.map((key) => {
                  const val = plan.entitlements?.[key];
                  const EIcon = ENTITLEMENT_ICONS[key] ?? Star;
                  if (val === undefined) return null;
                  return (
                    <div key={key} className="flex items-center gap-2 text-[12px]">
                      <EIcon className="h-3 w-3 text-fg-muted" />
                      <span className="text-fg-muted flex-1">{ENTITLEMENT_LABELS[key]}</span>
                      <span className={cn('font-medium', val === 999999 ? 'text-gold' : 'text-fg')}>
                        {val === 999999 ? 'Unlimited' : val?.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="p-4 rounded-lg border border-border bg-surface-2">
        <h3 className="text-[13px] font-medium text-fg mb-2">How plans work</h3>
        <p className="text-[12px] text-fg-muted leading-relaxed">
          Plans define pricing and usage limits. Each plan has entitlements (image generations, chat messages, etc.)
          that are enforced by the usage tracking system. The pricing page shows all public plans.
          The default plan is assigned to new users. Changes take effect immediately.
        </p>
      </div>
    </div>
  );
}
