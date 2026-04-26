'use client';

/**
 * Campaign Intake Form (i18n)
 *
 * All user-visible strings go through useI18n.
 */

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
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

const VERTICAL_OPTIONS: Array<{ value: VerticalSlug; labelEn: string; labelEs: string }> = [
  { value: 'fashion-apparel', labelEn: 'Fashion & Apparel', labelEs: 'Moda y Ropa' },
  { value: 'fitness-wellness', labelEn: 'Fitness & Wellness', labelEs: 'Fitness y Bienestar' },
  { value: 'tech-saas-app', labelEn: 'Tech / SaaS / App', labelEs: 'Tech / SaaS / App' },
  { value: 'ecommerce-physical', labelEn: 'E-commerce — Physical', labelEs: 'E-commerce — Fisico' },
  { value: 'services-coaching', labelEn: 'Services & Coaching', labelEs: 'Servicios y Coaching' },
];

const TYPE_OPTIONS: Array<{ value: CampaignTypeSlug; labelEn: string; labelEs: string }> = [
  { value: 'product-launch', labelEn: 'Product Launch', labelEs: 'Lanzamiento de producto' },
  { value: 'flash-sale', labelEn: 'Flash Sale', labelEs: 'Oferta relampago' },
  { value: 'lead-generation', labelEn: 'Lead Generation', labelEs: 'Captacion de leads' },
  { value: 'brand-awareness', labelEn: 'Brand Awareness', labelEs: 'Notoriedad de marca' },
  { value: 'seasonal', labelEn: 'Seasonal', labelEs: 'Temporada' },
  { value: 'social-proof', labelEn: 'Social Proof', labelEs: 'Prueba social' },
  { value: 'retargeting', labelEn: 'Retargeting', labelEs: 'Retargeting' },
  { value: 'waitlist-launch', labelEn: 'Waitlist / Pre-Launch', labelEs: 'Lista de espera / Pre-lanzamiento' },
  { value: 'webinar-event', labelEn: 'Webinar / Event', labelEs: 'Webinar / Evento' },
];

interface CampaignIntakeFormProps {
  onStrategize: (draftId: string) => void;
}

export function CampaignIntakeForm({ onStrategize }: CampaignIntakeFormProps) {
  const { t, locale } = useI18n();
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
      await saveNow();
      await new Promise((r) => setTimeout(r, 200));
      if (draft?.id) onStrategize(draft.id);
    } finally {
      setStrategizing(false);
    }
  }

  function togglePlatform(p: Platform) {
    const current = (intake.platforms ?? []) as Platform[];
    const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
    updateIntake({ platforms: next });
  }

  const verticalLabel = (v: { labelEn: string; labelEs: string }) =>
    locale === 'es' ? v.labelEs : v.labelEn;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
            {t('cb.intake.eyebrow')}
          </div>
          <h1 className="font-display text-[34px] leading-tight">
            {t('cb.intake.title_a')}{' '}
            <span className="text-gold-grad">{t('cb.intake.title_accent')}</span>
          </h1>
          <p className="text-[14px] text-fg-muted mt-2">{t('cb.intake.subtitle')}</p>
        </div>
        <SaveIndicator status={status} t={t} />
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      <Section title={t('cb.intake.section_basics')} subtitle={t('cb.intake.section_basics_sub')}>
        <Field label={t('cb.intake.label.campaign_name')}>
          <Input
            value={intake.campaignName ?? ''}
            onChange={(v) => updateIntake({ campaignName: v })}
            placeholder={t('cb.intake.placeholder.campaign_name')}
          />
        </Field>

        <Field label={t('cb.intake.label.product')} required>
          <Input
            value={intake.productName ?? ''}
            onChange={(v) => updateIntake({ productName: v })}
            placeholder="Operator AI"
          />
        </Field>

        <Field label={t('cb.intake.label.description')} required>
          <Textarea
            value={intake.productDescription ?? ''}
            onChange={(v) => updateIntake({ productDescription: v })}
            placeholder={t('cb.intake.placeholder.description')}
            rows={4}
          />
        </Field>

        <Field label={t('cb.intake.label.goal')} required>
          <Textarea
            value={intake.goalDescription ?? ''}
            onChange={(v) => updateIntake({ goalDescription: v })}
            placeholder={t('cb.intake.placeholder.goal')}
            rows={3}
          />
        </Field>

        <Field label={t('cb.intake.label.audience')}>
          <Textarea
            value={intake.audienceDescription ?? ''}
            onChange={(v) => updateIntake({ audienceDescription: v })}
            placeholder={t('cb.intake.placeholder.audience')}
            rows={3}
          />
        </Field>
      </Section>

      <Section title={t('cb.intake.section_strategy')} subtitle={t('cb.intake.section_strategy_sub')}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('cb.intake.label.vertical')}>
            <Select
              value={intake.vertical ?? ''}
              onChange={(v) =>
                updateIntake({ vertical: (v || undefined) as VerticalSlug | undefined })
              }
              options={[
                { value: '', label: t('cb.intake.option_auto') },
                ...VERTICAL_OPTIONS.map((v) => ({ value: v.value, label: verticalLabel(v) })),
              ]}
            />
          </Field>

          <Field label={t('cb.intake.label.type')}>
            <Select
              value={intake.campaignType ?? ''}
              onChange={(v) =>
                updateIntake({ campaignType: (v || undefined) as CampaignTypeSlug | undefined })
              }
              options={[
                { value: '', label: t('cb.intake.option_auto') },
                ...TYPE_OPTIONS.map((v) => ({ value: v.value, label: verticalLabel(v) })),
              ]}
            />
          </Field>
        </div>

        <Field label={t('cb.intake.label.platforms')}>
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

      <Section title={t('cb.intake.section_voice')} subtitle={t('cb.intake.section_voice_sub')}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={t('cb.intake.label.tone')}>
            <Input
              value={intake.brandTone ?? ''}
              onChange={(v) => updateIntake({ brandTone: v })}
              placeholder={t('cb.intake.placeholder.tone')}
            />
          </Field>

          <Field label={t('cb.intake.label.cta')}>
            <Input
              value={intake.callToAction ?? ''}
              onChange={(v) => updateIntake({ callToAction: v })}
              placeholder={t('cb.intake.placeholder.cta')}
            />
          </Field>
        </div>

        <Field label={t('cb.intake.label.offer')}>
          <Input
            value={intake.offer ?? ''}
            onChange={(v) => updateIntake({ offer: v })}
            placeholder={t('cb.intake.placeholder.offer')}
          />
        </Field>

        <Field label={t('cb.intake.label.avoid')}>
          <Textarea
            value={intake.doNotInclude ?? ''}
            onChange={(v) => updateIntake({ doNotInclude: v })}
            placeholder={t('cb.intake.placeholder.avoid')}
            rows={2}
          />
        </Field>
      </Section>

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
          {strategizing
            ? t('cb.intake.cta_strategize_loading')
            : t('cb.intake.cta_strategize')}
        </button>
        {!canStrategize && (
          <p className="text-[11.5px] text-fg-subtle text-center mt-2">
            {t('cb.intake.cta_disabled_hint')}
          </p>
        )}
      </div>
    </div>
  );
}

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

function SaveIndicator({
  status,
  t,
}: {
  status: string;
  t: (k: string) => string;
}) {
  const label =
    status === 'saving'
      ? t('cb.intake.save.saving')
      : status === 'saved'
      ? t('cb.intake.save.saved')
      : status === 'error'
      ? t('cb.intake.save.error')
      : status === 'loading'
      ? t('cb.intake.save.loading')
      : t('cb.intake.save.idle');

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
