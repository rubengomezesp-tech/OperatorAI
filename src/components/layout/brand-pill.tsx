'use client';

/**
 * BrandPill — shows active brand context in topbar.
 *
 * Click → dropdown with:
 *   - Active brand info
 *   - "Edit brand" → /brand-os
 *   - "Add brand" (disabled until multi-brand supported)
 *
 * If no brand exists → "Set up brand" CTA.
 *
 * Reads from /api/brand/get on mount.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Sparkles, Settings, Plus, Building2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface BrandData {
  id?: string;
  brand_name?: string | null;
  industry?: string | null;
  primary_color?: string | null;
  logo_url?: string | null;
}

export function BrandPill() {
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const [brand, setBrand] = useState<BrandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/brand/get', { credentials: 'include' });
        if (res.ok) {
          const body = await res.json();
          if (!cancelled) {
            setBrand(body.data ?? body.brand ?? body ?? null);
          }
        }
      } catch {
        // ignore — render unset state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (loading) {
    return (
      <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-surface-2 opacity-60">
        <div className="h-3 w-20 rounded bg-surface-3 animate-pulse" />
      </div>
    );
  }

  // No brand yet → CTA to set it up
  if (!brand?.brand_name) {
    return (
      <Link
        href="/brand-os"
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-dashed border-border hover:border-gold/50 text-fg-muted hover:text-fg text-[12px] transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>{isEs ? 'Configurar marca' : 'Set up brand'}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-surface-2 hover:border-gold/40 transition-colors text-[12px] text-fg max-w-[180px]"
      >
        {brand.logo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={brand.logo_url}
            alt=""
            className="h-4 w-4 rounded object-cover flex-shrink-0"
          />
        ) : (
          <Building2 className="h-3.5 w-3.5 text-fg-muted flex-shrink-0" />
        )}
        <span className="truncate">{brand.brand_name}</span>
        <ChevronDown
          className={`h-3 w-3 text-fg-muted transition-transform flex-shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 w-64 rounded-md border border-border bg-surface-2 shadow-xl py-1 z-50">
          {/* Active brand section */}
          <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-1">
              {isEs ? 'Marca activa' : 'Active brand'}
            </div>
            <div className="flex items-center gap-2">
              {brand.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={brand.logo_url}
                  alt=""
                  className="h-7 w-7 rounded object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="h-7 w-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: brand.primary_color ?? 'rgb(var(--surface-3))',
                  }}
                >
                  <Building2 className="h-3.5 w-3.5 text-white/80" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] text-fg font-medium truncate">
                  {brand.brand_name}
                </div>
                {brand.industry && (
                  <div className="text-[11px] text-fg-muted truncate">
                    {brand.industry}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <Link
            href="/brand-os"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-[12.5px] text-fg-soft hover:bg-surface-3 hover:text-fg transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            {isEs ? 'Editar marca' : 'Edit brand'}
          </Link>

          <button
            disabled
            className="flex items-center gap-2 w-full px-3 py-2 text-[12.5px] text-fg-subtle cursor-not-allowed"
            title={isEs ? 'Próximamente' : 'Coming soon'}
          >
            <Plus className="h-3.5 w-3.5" />
            {isEs ? 'Añadir marca' : 'Add brand'}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-fg-subtle">
              {isEs ? 'Pronto' : 'Soon'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
