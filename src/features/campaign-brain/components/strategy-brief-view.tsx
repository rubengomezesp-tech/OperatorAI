'use client';

/**
 * Strategy Brief View (i18n)
 */

import { useI18n } from '@/lib/i18n';
import type { BrainOutput } from '@/features/campaign-brain/types';

interface StrategyBriefViewProps {
  brainOutput: BrainOutput;
  onRenderVariants: () => void;
  onEdit: () => void;
}

function humanize(s: string): string {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function StrategyBriefView({
  brainOutput,
  onRenderVariants,
  onEdit,
}: StrategyBriefViewProps) {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <div className="space-y-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold">
          {t('cb.brief.eyebrow')}
        </div>
        <h1 className="font-display text-[34px] leading-tight">
          {humanize(brainOutput.detectedVertical)} ·{' '}
          <span className="text-gold-grad">{humanize(brainOutput.detectedCampaignType)}</span>
        </h1>
        <p className="text-[14px] text-fg-muted">{brainOutput.reasoning}</p>
        <div className="flex items-center gap-3 text-[11.5px] text-fg-subtle">
          <span>
            {t('cb.brief.confidence')}: {Math.round(brainOutput.confidence * 100)}%
          </span>
          <span>·</span>
          <span>
            {brainOutput.variantBriefs.length} {t('cb.brief.variants_ready')}
          </span>
        </div>
      </div>

      <Section title={t('cb.brief.section_diagnostic')} emoji="🔍">
        <div className="grid sm:grid-cols-2 gap-4">
          <DiagnosticCard label={t('cb.brief.diag_pain')} value={brainOutput.diagnostic.pain} />
          <DiagnosticCard label={t('cb.brief.diag_desire')} value={brainOutput.diagnostic.desire} />
          <DiagnosticCard
            label={t('cb.brief.diag_objection')}
            value={brainOutput.diagnostic.objection}
          />
          <DiagnosticCard
            label={t('cb.brief.diag_hidden')}
            value={brainOutput.diagnostic.hiddenDesire}
            highlight
          />
        </div>
      </Section>

      <Section title={t('cb.brief.section_audience')} emoji="👥">
        <div className="space-y-4">
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-1">
              {t('cb.brief.audience_primary')}
            </div>
            <p className="text-[15px] text-fg">{brainOutput.audience.primaryPersona}</p>
          </div>

          {brainOutput.audience.secondaryPersonas.length > 0 && (
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-1">
                {t('cb.brief.audience_also')}
              </div>
              <ul className="space-y-1">
                {brainOutput.audience.secondaryPersonas.map((p, i) => (
                  <li key={i} className="text-[14px] text-fg-muted">
                    · {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">
                {t('cb.brief.audience_triggers')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {brainOutput.audience.triggers.map((tx, i) => (
                  <Chip key={i}>{tx}</Chip>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">
                {t('cb.brief.audience_barriers')}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {brainOutput.audience.barriers.map((tx, i) => (
                  <Chip key={i} variant="muted">
                    {tx}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t('cb.brief.section_angles')} emoji="🎯">
        <div className="space-y-3">
          <p className="text-[13.5px] text-fg-muted">{brainOutput.selectedAngles.reasoning}</p>
          <div className="flex flex-wrap gap-2">
            <AngleBadge primary>{humanize(brainOutput.selectedAngles.primary)}</AngleBadge>
            {brainOutput.selectedAngles.alternatives.map((a, i) => (
              <AngleBadge key={i}>{humanize(a)}</AngleBadge>
            ))}
          </div>
        </div>
      </Section>

      <Section title={t('cb.brief.section_hooks')} emoji="🎣">
        <div className="space-y-2.5">
          {brainOutput.hooks.map((h, i) => (
            <div key={i} className="rounded-md border border-border bg-surface-2 px-4 py-3">
              <p className="text-[14.5px] text-fg leading-snug">{h.text}</p>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-fg-subtle">
                <span className="uppercase tracking-[0.12em]">{h.framework}</span>
                <span>·</span>
                <span>{humanize(h.targetAngle)}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('cb.brief.section_ctas')} emoji="✨">
        <div className="flex flex-wrap gap-2">
          {brainOutput.ctas.map((c, i) => (
            <span
              key={i}
              className="px-3.5 py-1.5 rounded-md bg-surface-2 border border-border text-[13.5px] text-fg"
            >
              {c}
            </span>
          ))}
        </div>
      </Section>

      <Section title={t('cb.brief.section_visual')} emoji="🎨">
        <div className="grid sm:grid-cols-3 gap-3">
          <VisualSpec
            label={t('cb.brief.visual_aesthetic')}
            value={brainOutput.visualDirection.aesthetic}
          />
          <VisualSpec
            label={t('cb.brief.visual_lighting')}
            value={brainOutput.visualDirection.lighting}
          />
          <VisualSpec
            label={t('cb.brief.visual_composition')}
            value={brainOutput.visualDirection.composition}
          />
        </div>
        <p className="text-[12.5px] text-fg-muted mt-3 italic">
          {t('cb.brief.visual_mood')}: {brainOutput.visualDirection.moodDescription}
        </p>
      </Section>

      <Section
        title={`${brainOutput.variantBriefs.length} ${t('cb.brief.section_variants')}`}
        emoji="📦"
      >
        <div className="space-y-2">
          {brainOutput.variantBriefs.slice(0, 4).map((v) => (
            <div
              key={v.id}
              className="rounded-md border border-border bg-surface-2 px-4 py-3 flex items-center gap-3 text-[13px]"
            >
              <span className="px-2 py-0.5 rounded bg-gold/15 text-gold text-[10.5px] uppercase tracking-[0.12em]">
                {humanize(v.angle)}
              </span>
              <span className="text-fg-muted">{v.platform}</span>
              <span className="text-fg-subtle">·</span>
              <span className="text-fg-muted">{v.aspectRatio}</span>
              <span className="text-fg flex-1 truncate ml-2">&ldquo;{v.headline}&rdquo;</span>
            </div>
          ))}
          {brainOutput.variantBriefs.length > 4 && (
            <p className="text-[12px] text-fg-subtle pl-1 pt-1">
              + {brainOutput.variantBriefs.length - 4} {t('cb.brief.variants_more')}
            </p>
          )}
        </div>
      </Section>

      {brainOutput.launchPlan && brainOutput.launchPlan.posts.length > 0 && (
        <Section
          title={`${brainOutput.launchPlan.durationDays} ${t('cb.brief.section_launch')}`}
          emoji="📅"
        >
          <div className="space-y-2">
            {brainOutput.launchPlan.posts.map((post, i) => (
              <div key={i} className="rounded-md border border-border bg-surface-2 px-4 py-3">
                <div className="flex items-center gap-2 text-[11.5px] text-fg-subtle mb-1.5 uppercase tracking-[0.12em]">
                  <span>
                    {t('cb.brief.day')} {post.day}
                  </span>
                  {post.time && (
                    <>
                      <span>·</span>
                      <span>{post.time}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{post.platform}</span>
                  <span>·</span>
                  <span className="text-gold">{humanize(post.angle)}</span>
                </div>
                <p className="text-[13.5px] text-fg">{post.copyHint}</p>
                <p className="text-[12px] text-fg-muted italic mt-1">
                  {t('cb.brief.visual_label')}: {post.visualHint}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="sticky bottom-0 bg-surface/80 backdrop-blur-md border-t border-border py-4 -mx-4 px-4 mt-8 flex gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-3 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-fg hover:border-fg-muted transition-all text-[14px]"
        >
          {t('cb.brief.cta_edit')}
        </button>
        <button
          type="button"
          onClick={onRenderVariants}
          className="flex-[2] py-3 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px]"
        >
          {t('cb.brief.cta_render')}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="text-[18px]">{emoji}</span>
        <h2 className="font-display text-[20px]">{title}</h2>
      </div>
      <div className="pl-0 sm:pl-9">{children}</div>
    </section>
  );
}

function DiagnosticCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-md px-4 py-3 border',
        highlight ? 'bg-gold/5 border-gold/30' : 'bg-surface-2 border-border',
      ].join(' ')}
    >
      <div
        className={[
          'text-[10.5px] uppercase tracking-[0.14em] mb-1.5',
          highlight ? 'text-gold' : 'text-fg-subtle',
        ].join(' ')}
      >
        {label}
      </div>
      <p className="text-[14px] text-fg leading-snug">{value}</p>
    </div>
  );
}

function VisualSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 px-3.5 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{label}</div>
      <div className="text-[13.5px] text-fg mt-0.5">{value}</div>
    </div>
  );
}

function Chip({ children, variant }: { children: React.ReactNode; variant?: 'muted' }) {
  return (
    <span
      className={[
        'px-2.5 py-0.5 rounded-full text-[11.5px] border',
        variant === 'muted'
          ? 'bg-surface-2 border-border text-fg-muted'
          : 'bg-gold/10 border-gold/30 text-gold',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

function AngleBadge({
  children,
  primary,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <span
      className={[
        'px-3 py-1 rounded-md text-[12.5px] uppercase tracking-[0.12em] border',
        primary
          ? 'bg-gold text-black border-gold font-medium'
          : 'bg-surface-2 border-border text-fg-muted',
      ].join(' ')}
    >
      {primary && '★ '}
      {children}
    </span>
  );
}
