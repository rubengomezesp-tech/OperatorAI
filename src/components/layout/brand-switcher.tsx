'use client';

/**
 * 🎨 BRAND SWITCHER (Multi-brand v2)
 *
 * Replaces BrandPill with full multi-brand dropdown:
 *   - List all brands of org
 *   - Click brand → switch active
 *   - "Add new brand" → modal with URL extract or manual
 *   - Active brand highlighted (gold)
 *   - Recent brand thumbnail/initials
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  Plus,
  Check,
  Loader2,
  Settings,
  Sparkles,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

interface Brand {
  id: string;
  brand_name: string | null;
  description: string | null;
  logo_url: string | null;
  industry: string | null;
  is_active: boolean;
}

export function BrandSwitcher() {
  const router = useRouter();
  const { locale } = useI18n();
  const isEs = locale === 'es';
  const ref = useRef<HTMLDivElement>(null);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  // Add brand modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'manual'>('url');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands/list');
      if (res.ok) {
        const body = await res.json();
        setBrands(body.brands ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBrands();
  }, []);

  // Click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const activeBrand = brands.find((b) => b.is_active) ?? brands[0];

  async function handleSwitch(brandId: string) {
    if (brandId === activeBrand?.id) {
      setOpen(false);
      return;
    }
    setSwitching(brandId);
    try {
      const res = await fetch('/api/brands/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: brandId }),
      });
      if (!res.ok) throw new Error('Switch failed');
      await fetchBrands();
      setOpen(false);
      // Refresh page to pick up new brand context
      router.refresh();
      toast.success(isEs ? 'Marca cambiada' : 'Brand switched');
    } catch {
      toast.error(isEs ? 'Error al cambiar' : 'Switch failed');
    } finally {
      setSwitching(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      // If URL mode, extract first
      let extracted: { description?: string; logo_url?: string; industry?: string } = {};

      if (addMode === 'url' && newUrl.trim()) {
        try {
          const extRes = await fetch('/api/brand/extract-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: newUrl.trim() }),
          });
          if (extRes.ok) {
            const ext = await extRes.json();
            extracted = {
              description: ext.description ?? ext.brand?.description,
              logo_url: ext.logo_url ?? ext.brand?.logo_url,
              industry: ext.industry ?? ext.brand?.industry,
            };
          }
        } catch {
          // graceful: continue with manual
        }
      }

      const res = await fetch('/api/brands/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: newName.trim(),
          description: extracted.description || newDescription.trim() || undefined,
          logo_url: extracted.logo_url || undefined,
          industry: extracted.industry || undefined,
          set_active: true,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Create failed');

      await fetchBrands();
      setShowAddModal(false);
      setOpen(false);
      setNewName('');
      setNewUrl('');
      setNewDescription('');
      router.refresh();
      toast.success(isEs ? 'Marca creada' : 'Brand created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCreating(false);
    }
  }

  function brandInitials(b: Brand): string {
    const name = b.brand_name || 'B';
    return name.slice(0, 2).toUpperCase();
  }

  if (loading) {
    return (
      <div className="h-9 w-32 rounded-md bg-surface-2 border border-border animate-pulse" />
    );
  }

  if (!activeBrand) {
    // No brand at all → CTA to set up
    return (
      <Link
        href="/brand-os"
        className="h-9 inline-flex items-center gap-2 px-3 rounded-md bg-gold/10 border border-gold/30 hover:bg-gold/15 transition-all text-[12.5px] text-gold"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>{isEs ? 'Configurar marca' : 'Set up brand'}</span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 inline-flex items-center gap-2 pl-1.5 pr-3 rounded-md bg-surface-2 border border-border hover:border-gold/40 transition-all text-[12.5px] group"
      >
        {/* Avatar */}
        <div className="h-6 w-6 rounded shrink-0 flex items-center justify-center text-[10px] font-semibold overflow-hidden">
          {activeBrand.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeBrand.logo_url}
              alt={activeBrand.brand_name ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gold/15 text-gold flex items-center justify-center">
              {brandInitials(activeBrand)}
            </div>
          )}
        </div>
        <span className="font-medium text-fg max-w-[140px] truncate">
          {activeBrand.brand_name ?? '(unnamed)'}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 w-[280px] rounded-lg border border-border bg-surface-2 shadow-2xl overflow-hidden z-50">
          {/* Brand list */}
          <div className="max-h-[280px] overflow-y-auto py-1">
            {brands.map((b) => {
              const isActive = b.is_active;
              const isSwitchingThis = switching === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSwitch(b.id)}
                  disabled={isSwitchingThis}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-3 transition-colors text-left ${
                    isActive ? 'bg-gold/5' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="h-7 w-7 rounded shrink-0 overflow-hidden flex items-center justify-center text-[10.5px] font-semibold">
                    {b.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.logo_url}
                        alt={b.brand_name ?? ''}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`h-full w-full flex items-center justify-center ${
                          isActive ? 'bg-gold/20 text-gold' : 'bg-surface-3 text-fg-muted'
                        }`}
                      >
                        {brandInitials(b)}
                      </div>
                    )}
                  </div>

                  {/* Name + Industry */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] truncate ${
                        isActive ? 'text-gold font-medium' : 'text-fg'
                      }`}
                    >
                      {b.brand_name ?? '(unnamed)'}
                    </div>
                    {b.industry && (
                      <div className="text-[11px] text-fg-subtle truncate">{b.industry}</div>
                    )}
                  </div>

                  {/* Indicator */}
                  {isSwitchingThis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-muted" />
                  ) : isActive ? (
                    <Check className="h-3.5 w-3.5 text-gold" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Actions */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowAddModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-3 transition-colors text-[12.5px] text-fg"
            >
              <div className="h-7 w-7 rounded shrink-0 bg-surface-3 flex items-center justify-center">
                <Plus className="h-3.5 w-3.5 text-gold" />
              </div>
              <span>{isEs ? 'Añadir nueva marca' : 'Add new brand'}</span>
            </button>

            <Link
              href="/brand-os"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-3 transition-colors text-[12.5px] text-fg-muted"
            >
              <div className="h-7 w-7 rounded shrink-0 bg-surface-3 flex items-center justify-center">
                <Settings className="h-3.5 w-3.5" />
              </div>
              <span>{isEs ? 'Editar marca activa' : 'Edit active brand'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ADD BRAND MODAL */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !creating && setShowAddModal(false)}
        >
          <div
            className="max-w-md w-full rounded-xl border border-border bg-surface-2 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-display text-[20px] mb-1">
                {isEs ? 'Añadir nueva marca' : 'Add new brand'}
              </h3>
              <p className="text-[13px] text-fg-muted">
                {isEs
                  ? 'Conecta una nueva marca a tu workspace.'
                  : 'Connect a new brand to your workspace.'}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-bg border border-border">
              <button
                type="button"
                onClick={() => setAddMode('url')}
                disabled={creating}
                className={`h-8 rounded text-[12px] inline-flex items-center justify-center gap-1.5 transition-all ${
                  addMode === 'url'
                    ? 'bg-gold/15 text-gold'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                <Globe className="h-3 w-3" />
                {isEs ? 'Desde URL' : 'From URL'}
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                disabled={creating}
                className={`h-8 rounded text-[12px] inline-flex items-center justify-center gap-1.5 transition-all ${
                  addMode === 'manual'
                    ? 'bg-gold/15 text-gold'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {isEs ? 'Manual' : 'Manual'}
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] text-fg-muted mb-1.5">
                  {isEs ? 'Nombre de marca' : 'Brand name'}
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isEs ? 'Mi nueva marca' : 'My new brand'}
                  disabled={creating}
                  className="w-full h-10 px-3 rounded-md bg-bg border border-border focus:border-gold/40 outline-none text-[13.5px]"
                  autoFocus
                />
              </div>

              {addMode === 'url' ? (
                <div>
                  <label className="block text-[12px] text-fg-muted mb-1.5">
                    {isEs ? 'URL del sitio web' : 'Website URL'}
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                    disabled={creating}
                    className="w-full h-10 px-3 rounded-md bg-bg border border-border focus:border-gold/40 outline-none text-[13.5px]"
                  />
                  <p className="text-[11px] text-fg-subtle mt-1.5">
                    {isEs
                      ? 'Extraeremos colores, logo y descripción automáticamente.'
                      : 'We&apos;ll extract colors, logo, and description automatically.'}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[12px] text-fg-muted mb-1.5">
                    {isEs ? 'Descripción (opcional)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={
                      isEs
                        ? 'Qué hace esta marca, su voz, su audiencia...'
                        : 'What this brand does, its voice, its audience...'
                    }
                    rows={3}
                    disabled={creating}
                    className="w-full px-3 py-2 rounded-md bg-bg border border-border focus:border-gold/40 outline-none text-[13.5px] resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={creating}
                className="flex-1 h-10 rounded-md bg-surface-3 border border-border hover:border-fg-muted transition-all text-[13.5px]"
              >
                {isEs ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md bg-gold text-bg font-medium hover:brightness-110 transition-all text-[13.5px] disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{creating ? (isEs ? 'Creando...' : 'Creating...') : isEs ? 'Crear marca' : 'Create brand'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
