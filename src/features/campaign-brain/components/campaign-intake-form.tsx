'use client';

/**
 * Campaign Intake Form
 *
 * Premium form for entering campaign brief.
 * Uses useCampaignDraft for auto-save with 1.5s debounce.
 * Shows save status indicator.
 */

import { useState } from 'react';
import { useCampaignDraft } from '@/features/campaign-brain/hooks/use-campaign-draft';
import type { Platform, VerticalSlug, CampaignTypeSlug } from '@/features/campaign-brain/types';

const PLATFORM_OPTIONS: Array<{ value: Platform; label: string }> = [
  { value: 'instagram-feed', label: 'Instagram Feed' },
  { value: 'instagram-story', label: 'Instagram Story' },
  { value: 'instagram-reel', label: 'Instagram Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'meta-ads', label: 'Meta Ads' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'twitter', label: 'Twitter / X' },
];

const VERTICAL_OPTIONS: Array<{ value: VerticalSlug; label: string }> = [
  { value: 'fashion-apparel', label: 'Fashion & Apparel' },
  { value: 'fitness-wellness', label: 'Fitness & Wellness' },
  { value: 'tech-saas-app', label: 'Tech / SaaS / App' },
  { value: 'ecommerce-physical', label: 'E-commerce — Physical' },
  { value: 'services-coaching', label: 'Services & Coaching' },
];

const TYPE_OPTIONS: Array<{ value: CampaignTypeSlug; label: string }> = [
  { value: 'product-launch', label: 'Product Launch' },
  { value: 'flash-sale', label: 'Flash Sale' },
  { value: 'lead-generation', label: 'Lead Generation' },
  { value: 'brand-awareness', label: 'Brand Awareness' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'social-proof', label: 'Social Proof' },
  { value: 'retargeting', label: 'Retargeting' },
  { value: 'waitlist-launch', label: 'Waitlist / Pre-Launch' },
  { value: 'webinar-event', label: 'Webinar / Event' },
];

interface CampaignIntakeFormProps {
  /** Called when user clicks "Generate Strategy" with the current draft id */
  onStrategize: (draftId: string) => void;
}

export function CampaignIntakeForm({ onStrategize }: CampaignIntakeFormProps) {
  const { draft, intake, status, error, updateIntake, saveNow } = useCampaignDraft();
  const [strategizing, setStrategizing] = useState(false);

  const canStrategize =
    !!intake.productName?.trim() &&
    !!intake.productDescription?.trim() &&
    !!intake.goalDescription?.trim();

  async function handleStrategize() {
    if (!canStrategize || strategizing) return;
    setStrategizing(true);
    try {
      // Force save first
      await saveNow();
      // Wait a tiny bit so the draft id propagates
      await new Promise((r) => setTimeout(r, 200));
      if (draft?.id) {
        onStrategize(draft.id);
      }
    } finally {
      setStrategizing(false);
    }
  }

  function togglePlatform(p: Platform) {
    const current = (intake.platforms ?? []) as Platform[];
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    updateIntake({ platforms: next });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header + save status */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
            New Campaign
          </div>
          <h1 className="font-display text-[34px] leading-tight">
            Brief us like an <span className="text-gold-grad">agency</span>
          </h1>
          <p className="text-[14px] text-fg-muted mt-2">
            Fill in what you know — Brain handles the rest. Your work auto-saves.
          </p>
        </div>
        <SaveIndicator status={status} />
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {/* Section: The basics */}
      <Section title="The basics" subtitle="Required to run the Brain">
        <Field label="Campaign name">
          <Input
            value={intake.campaignName ?? ''}
            onChange={(v) => updateIntake({ campaignName: v })}
            placeholder="Spring Drop Launch"
          />
        </Field>

        <Field label="Product / Service" required>
          <Input
            value={intake.productName ?? ''}
            onChange={(v) => updateIntake({ productName: v })}
            placeholder="Operator AI"
          />
        </Field>

        <Field label="What is it?" required>
          <Textarea
            value={intake.productDescription ?? ''}
            onChange={(v) => updateIntake({ productDescription: v })}
            placeholder="An AI-powered brand and campaign system that turns your URL into a complete strategic brief in 60 seconds."
            rows={4}
          />
        </Field>

        <Field label="Goal of this campaign" required>
          <Textarea
            value={intake.goalDescription ?? ''}
            onChange={(v) => updateIntake({ goalDescription: v })}
            placeholder="Drive 1000 free trial signups in week 1"
            rows={3}
          />
        </Field>

        <Field label="Audience">
          <Textarea
            value={intake.audienceDescription ?? ''}
            onChange={(v) => updateIntake({ audienceDescription: v })}
            placeholder="Founders, marketing leads at startups, agency owners. They juggle Canva + ChatGPT + Photoshop."
            rows={3}
          />
        </Field>
      </Section>

      {/* Section: Strategy hints */}
      <Section title="Strategy" subtitle="Optional — Brain auto-detects if blank">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Vertical (industry)">
            <Select
              value={intake.vertical ?? ''}
              onChange={(v) => updateIntake({ vertical: (v || undefined) as VerticalSlug | undefined })}
              options={[{ value: '', label: 'Auto-detect' }, ...VERTICAL_OPTIONS]}
            />
          </Field>

          <Field label="Campaign type">
            <Select
              value={intake.campaignType ?? ''}
              onChange={(v) => updateIntake({ campaignType: (v || undefined) as CampaignTypeSlug | undefined })}
              options={[{ value: '', label: 'Auto-detect' }, ...TYPE_OPTIONS]}
            />
          </Field>
        </div>

        <Field label="Platforms (where this campaign runs)">
          <div className="flex flex-wrap gap-2">
            {PLATFORM_OPTIONS.map((p) => {
              const selected = (intake.platforms ?? []).includes(p.value as never);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePlatform(p.value)}
                  className={[
                    'px-3 py-1.5 rounded-full text-[12.5px] border transition-all',
                    selected
                      ? 'bg-gold/15 border-gold/50 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted hover:border-fg-muted',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </Field>
      </Section>

      {/* Section: Voice & offer */}
      <Section title="Voice & offer" subtitle="Help Brain match your tone">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Brand tone">
            <Input
              value={intake.brandTone ?? ''}
              onChange={(v) => updateIntake({ brandTone: v })}
              placeholder="confident, modern, considered"
            />
          </Field>

          <Field label="Preferred CTA">
            <Input
              value={intake.callToAction ?? ''}
              onChange={(v) => updateIntake({ callToAction: v })}
              placeholder="Try free"
            />
          </Field>
        </div>

        <Field label="Offer (if any)">
          <Input
            value={intake.offer ?? ''}
            onChange={(v) => updateIntake({ offer: v })}
            placeholder="50% off, 14-day trial, free first month"
          />
        </Field>

        <Field label="Things to avoid">
          <Textarea
            value={intake.doNotInclude ?? ''}
            onChange={(v) => updateIntake({ doNotInclude: v })}
            placeholder="No 'revolutionary'. No countdown timers. No fake testimonials."
            rows={2}
          />
        </Field>
      </Section>

      {/* Submit */}
      <div className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-border py-4 -mx-4 px-4 mt-8">
        <button
          type="button"
          onClick={handleStrategize}
          disabled={!canStrategize || strategizing}
          className={[
            'w-full py-3.5 rounded-md font-medium text-[15px] transition-all',
            canStrategize
              ? 'bg-gold text-black hover:bg-gold/90'
              : 'bg-surface-2 text-fg-subtle cursor-not-allowed border border-border',
          ].join(' ')}
        >
          {strategizing ? 'Brain is thinking…' : 'Generate Strategy →'}
        </button>
        {!canStrategize && (
          <p className="text-[11.5px] text-fg-subtle text-center mt-2">
            Fill product name, description, and goal to enable.
          </p>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-[20px]">{title}</h2>
        {subtitle && <p className="text-[12.5px] text-fg-subtle mt-0.5">{subtitle}</p>}
      </div>
      <div className="space-y-4 pl-0 sm:pl-2 border-l-0 sm:border-l-2 sm:border-border/50">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-1.5">
        {label}
        {required && <span className="text-gold ml-1">·</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 transition-all"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 transition-all resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SaveIndicator({ status }: { status: string }) {
  const label =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
      ? 'Saved'
      : status === 'error'
      ? 'Error'
      : status === 'loading'
      ? 'Loading…'
      : 'Auto-save on';

  const color =
    status === 'error'
      ? 'text-red-400'
      : status === 'saving'
      ? 'text-fg-muted'
      : status === 'saved'
      ? 'text-green-400'
      : 'text-fg-subtle';

  return (
    <div className={`text-[11px] uppercase tracking-[0.14em] ${color}`}>
      <span className="inline-flex items-center gap-1.5">
        <span
          className={[
            'inline-block w-1.5 h-1.5 rounded-full',
            status === 'saving'
              ? 'bg-fg-muted animate-pulse'
              : status === 'saved'
              ? 'bg-green-400'
              : status === 'error'
              ? 'bg-red-400'
              : 'bg-fg-subtle',
          ].join(' ')}
        />
        {label}
      </span>
    </div>
  );
}
