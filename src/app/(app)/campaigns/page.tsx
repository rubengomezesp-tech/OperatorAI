'use client';

/**
 * /campaigns — list of saved campaigns
 *
 * Sprint 7 hotfix:
 *   - Card hover reveals delete button
 *   - Optimistic removal from UI
 *   - Confirm dialog before delete
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Plus, Loader2, ImageOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { StaggerList, StaggerItem } from '@/components/ui/page-transition';

interface CampaignSummary {
  id: string;
  name: string;
  vertical: string | null;
  campaignType: string | null;
  thumbnail: string | null;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

function humanize(s: string | null): string {
  if (!s) return '';
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(iso: string, locale: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CampaignsListPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/campaigns/list', {
          credentials: 'include',
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Failed: ${res.status}`);
        }
        const body = await res.json();
        if (!cancelled) setCampaigns(body.campaigns ?? []);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(locale === 'es' ? `¿Eliminar "${name}"? Esto no se puede deshacer.` : `Delete "${name}"? This cannot be undone.`)) return;

    setDeletingId(id);
    try {
      const res = await fetch('/api/campaigns/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast.success(locale === 'es' ? 'Campaña eliminada' : 'Campaign deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-2">
            {t('campaigns.list.eyebrow')}
          </div>
          <h1 className="font-display text-[34px] leading-tight">
            {t('campaigns.list.title')}
          </h1>
          <p className="text-[14px] text-fg-muted mt-2">
            {t('campaigns.list.subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/campaigns/new')}
          className="px-4 py-2 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('campaigns.list.cta_new')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] rounded-lg bg-surface-2 border border-border animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && campaigns.length === 0 && !error && (
        <div className="text-center py-16 space-y-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
            {t('campaigns.list.empty_eyebrow')}
          </div>
          <h2 className="font-display text-[22px]">
            {t('campaigns.list.empty_title')}
          </h2>
          <p className="text-[14px] text-fg-muted max-w-md mx-auto">
            {t('campaigns.list.empty_subtitle')}
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-gold text-black font-medium hover:bg-gold/90 transition-all text-[14px]"
          >
            <Plus className="h-4 w-4" />
            {t('campaigns.list.cta_new')}
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && campaigns.length > 0 && (
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <StaggerItem key={c.id}>
              <CampaignCard
                campaign={c}
                locale={locale}
                t={t}
                humanizeFn={humanize}
                onDelete={handleDelete}
                isDeleting={deletingId === c.id}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Card
// ────────────────────────────────────────────────────────────────

function CampaignCard({
  campaign,
  locale,
  t,
  humanizeFn,
  onDelete,
  isDeleting,
}: {
  campaign: CampaignSummary;
  locale: string;
  t: (k: string) => string;
  humanizeFn: (s: string | null) => string;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="relative group">
      {/* Delete button (hover-revealed, top-left to avoid variant badge) */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(campaign.id, campaign.name);
        }}
        disabled={isDeleting}
        title={locale === 'es' ? 'Eliminar campaña' : 'Delete campaign'}
        className="absolute top-3 left-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-md bg-bg/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 hover:bg-danger/20 hover:border-danger/40 hover:text-danger text-fg-muted transition-all disabled:opacity-50"
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      <Link
        href={`/campaigns/${campaign.id}`}
        className="block rounded-lg border border-border bg-surface-2 hover:border-gold/40 transition-all overflow-hidden border-light magnetic-hover"
      >
        <div className="aspect-[4/5] bg-bg flex items-center justify-center relative overflow-hidden">
          {campaign.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={campaign.thumbnail}
              alt={campaign.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <ImageOff className="h-10 w-10 text-fg-subtle" />
          )}

          {campaign.variantCount > 0 && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-bg/80 backdrop-blur-sm text-[11px] text-fg-muted border border-border">
              {campaign.variantCount} {t('campaigns.list.variants')}
            </span>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          <h3 className="font-display text-[15px] text-fg leading-snug line-clamp-2">
            {campaign.name}
          </h3>
          <div className="flex items-center gap-2 text-[11.5px] text-fg-subtle">
            {campaign.vertical && <span>{humanizeFn(campaign.vertical)}</span>}
            {campaign.vertical && campaign.campaignType && <span>·</span>}
            {campaign.campaignType && (
              <span>{humanizeFn(campaign.campaignType)}</span>
            )}
          </div>
          <div className="text-[11px] text-fg-subtle">
            {formatDate(campaign.updatedAt, locale)}
          </div>
        </div>
      </Link>
    </div>
  );
}
