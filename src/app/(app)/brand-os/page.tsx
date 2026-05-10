'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Palette, Type, Target, Eye, Shield, Plus, X, Loader2, Globe, RefreshCw, Plug, FileText, ArrowRight, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface BrandProfile {
  brand_name: string;
  description: string;
  vibe: string;
  colors: string[];
  fonts: string[];
  target_audience: string;
  tone_keywords: string[];
  visual_style: string;
  industry: string;
  content_pillars: string[];
  avoid_keywords: string[];
  instagram_handle: string;
  brand_values: string[];
  competitors?: string[];
  website_url?: string;
  detected_logo_url?: string;
  detected_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    palette?: Array<{ hex: string; weight: number }>;
  };
}

interface BrandAsset {
  id: string;
  title: string | null;
  original_name: string;
  mime_type: string;
  category: string;
  subcategory: string | null;
  is_brand_asset: boolean;
  importance: number;
  created_at: string;
}

interface IntegrationRow {
  provider: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
}

const DEFAULT: BrandProfile = {
  brand_name: '', description: '', vibe: '', colors: [], fonts: [],
  target_audience: '', tone_keywords: [], visual_style: '', industry: '',
  content_pillars: [], avoid_keywords: [], instagram_handle: '', brand_values: [],
};

const PRESET_COLORS = ['#C9A863', '#1A1A1B', '#FFFFFF', '#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function BrandOSPage() {
  const { locale } = useI18n();
  const [bp, setBp] = useState<BrandProfile>(DEFAULT);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [newColor, setNewColor] = useState('#C9A863');
  const [newTag, setNewTag] = useState('');
  const [tagField, setTagField] = useState<keyof BrandProfile | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/brand/get').then((r) => r.json()),
      fetch('/api/knowledge/list').then((r) => r.json()),
      fetch('/api/integrations/list').then((r) => r.json()),
    ])
      .then(([brandData, kbData, intData]) => {
        if (brandData.profile) setBp({ ...DEFAULT, ...brandData.profile });
        const docs = (kbData.documents ?? []) as BrandAsset[];
        setAssets(docs.filter((d) => d.category === 'brand' || d.is_brand_asset));
        if (Array.isArray(intData.integrations)) setIntegrations(intData.integrations);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/brand/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bp),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(locale === 'es' ? 'Marca guardada' : 'Brand saved');
    } catch {
      toast.error(locale === 'es' ? 'Error al guardar' : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function rescanUrl() {
    if (!bp.website_url?.trim()) {
      toast.error(locale === 'es' ? 'Sin URL configurada' : 'No URL configured');
      return;
    }
    setRescanning(true);
    try {
      const res = await fetch('/api/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: bp.website_url, persist: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      toast.success(locale === 'es' ? 'URL re-escaneada' : 'URL re-scanned');
      // Reload brand
      const brandData = await fetch('/api/brand/get').then((r) => r.json());
      if (brandData.profile) setBp({ ...DEFAULT, ...brandData.profile });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setRescanning(false);
    }
  }

  function addToArray(field: keyof BrandProfile, value: string) {
    if (!value.trim()) return;
    setBp((prev) => ({ ...prev, [field]: [...(prev[field] as string[]), value.trim()] }));
  }
  function removeFromArray(field: keyof BrandProfile, index: number) {
    setBp((prev) => ({ ...prev, [field]: (prev[field] as string[]).filter((_, i) => i !== index) }));
  }

  const t = (en: string, es: string) => (locale === 'es' ? es : en);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-gold animate-spin" />
      </div>
    );
  }

  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[1080px] w-full mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-end justify-between gap-4 mb-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">
            {t('Brand OS', 'Brand OS')}
          </div>
          <h1 className="font-display text-[32px] mb-1">
            {bp.brand_name || t('Your Brand', 'Tu marca')}
          </h1>
          <p className="text-[13.5px] text-fg-muted max-w-[620px]">
            {t(
              'Hub central donde Operator aprende quién eres. Identidad, assets, y conexiones.',
              'Hub central donde Operator aprende quién eres. Identidad, assets y conexiones.',
            )}
          </p>
        </div>
        <Button onClick={save} loading={saving}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {t('Save', 'Guardar')}
        </Button>
      </div>

      {/* OVERVIEW STRIP — 3 cards lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Logo + URL */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Identity', 'Identidad')}
              </span>
              {bp.website_url && (
                <button
                  onClick={rescanUrl}
                  disabled={rescanning}
                  className="text-[11px] text-fg-muted hover:text-gold inline-flex items-center gap-1 disabled:opacity-50"
                  title={t('Re-scan website', 'Re-escanear web')}
                >
                  {rescanning ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {t('re-scan', 're-escanear')}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {bp.detected_logo_url ? (
                <img
                  src={bp.detected_logo_url}
                  alt="Logo"
                  className="h-14 w-14 rounded-lg border border-border bg-white object-contain p-1.5"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg border border-dashed border-border bg-surface-2 flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-fg-subtle" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-display text-[14.5px] truncate">
                  {bp.brand_name || t('No name yet', 'Sin nombre')}
                </div>
                {bp.website_url ? (
                  <a
                    href={bp.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-fg-muted hover:text-gold inline-flex items-center gap-1 truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{bp.website_url.replace(/^https?:\/\//, '')}</span>
                  </a>
                ) : (
                  <div className="text-[12px] text-fg-subtle">{t('No URL', 'Sin URL')}</div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Brand Assets count */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Brand Assets', 'Assets de Marca')}
              </span>
              <Link
                href="/knowledge"
                className="text-[11px] text-fg-muted hover:text-gold inline-flex items-center gap-1"
              >
                {t('manage', 'gestionar')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[36px] text-gold">{assets.length}</span>
              <span className="text-[12px] text-fg-muted">
                {assets.length === 1 ? t('document', 'documento') : t('documents', 'documentos')}
              </span>
            </div>
            <div className="text-[11.5px] text-fg-muted leading-snug">
              {t(
                'Logos, brand book, fonts, tone guides — usados en cada generación.',
                'Logos, brand book, fuentes, guías de tono — usados en cada generación.',
              )}
            </div>
          </CardBody>
        </Card>

        {/* Connectors */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Connectors', 'Conectores')}
              </span>
              <Link
                href="/settings/integrations"
                className="text-[11px] text-fg-muted hover:text-gold inline-flex items-center gap-1"
              >
                {t('manage', 'gestionar')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[36px] text-gold">{connectedCount}</span>
              <span className="text-[12px] text-fg-muted">
                {connectedCount === 1 ? t('active', 'activa') : t('active', 'activas')}
              </span>
            </div>
            <div className="text-[11.5px] text-fg-muted leading-snug">
              {t(
                'Apps que Operator puede usar en tu nombre.',
                'Apps que Operator puede usar en tu nombre.',
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* BRAND ASSETS LIST */}
      {assets.length > 0 && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px]">{t('Brand Assets', 'Assets de Marca')}</h2>
              <Link
                href="/knowledge?cat=brand"
                className="text-[12px] text-gold hover:underline"
              >
                {t('See all', 'Ver todos')}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {assets.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-2.5 rounded-md bg-surface-2 border border-border"
                >
                  <div className="h-8 w-8 rounded shrink-0 bg-gold/10 border border-gold/30 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-gold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-medium truncate">
                      {a.title || a.original_name}
                    </div>
                    {a.subcategory && (
                      <div className="text-[10.5px] text-fg-subtle italic">{a.subcategory}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* IDENTITY EDIT (kept from v1) */}
      <Card>
        <CardBody className="space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[16px]">{t('Identity', 'Identidad')}</h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Brand name', 'Nombre de marca')}
              </label>
              <input
                type="text"
                value={bp.brand_name}
                onChange={(e) => setBp({ ...bp, brand_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-md bg-surface-2 border border-border focus:border-gold outline-none text-[14px]"
              />
            </div>
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Description', 'Descripción')}
              </label>
              <textarea
                rows={3}
                value={bp.description}
                onChange={(e) => setBp({ ...bp, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-md bg-surface-2 border border-border focus:border-gold outline-none text-[14px] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                  {t('Industry', 'Industria')}
                </label>
                <input
                  type="text"
                  value={bp.industry}
                  onChange={(e) => setBp({ ...bp, industry: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-md bg-surface-2 border border-border focus:border-gold outline-none text-[14px]"
                />
              </div>
              <div>
                <label className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                  {t('Vibe', 'Vibe')}
                </label>
                <select
                  value={bp.vibe}
                  onChange={(e) => setBp({ ...bp, vibe: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-md bg-surface-2 border border-border focus:border-gold outline-none text-[14px]"
                >
                  <option value="">—</option>
                  <option value="minimal">Minimal</option>
                  <option value="editorial">Editorial</option>
                  <option value="bold">Bold</option>
                  <option value="playful">Playful</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-3.5 w-3.5 text-gold" />
              <label className="text-[10.5px] uppercase tracking-[0.16em] text-fg-subtle">
                {t('Colors', 'Colores')}
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {bp.colors.map((c, i) => (
                <div
                  key={i}
                  className="group relative h-9 px-3 rounded-md border border-border bg-surface-2 flex items-center gap-2"
                >
                  <span
                    className="h-4 w-4 rounded border border-border-strong"
                    style={{ backgroundColor: c }}
                  />
                  <span className="text-[12px] tabular-nums">{c}</span>
                  <button
                    onClick={() => removeFromArray('colors', i)}
                    className="ml-1 text-fg-muted hover:text-danger"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-9 w-9 rounded-md border border-border cursor-pointer"
                />
                <button
                  onClick={() => {
                    addToArray('colors', newColor);
                  }}
                  className="h-9 px-2 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-fg-muted hover:text-gold"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* CONNECT PROMPT IF NO INTEGRATIONS */}
      {connectedCount === 0 && (
        <div className="rounded-lg border border-dashed border-gold/40 bg-gold/5 p-5">
          <div className="flex items-start gap-3">
            <Plug className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-display text-[15px] text-gold mb-1">
                {t('Conecta tus herramientas', 'Conecta tus herramientas')}
              </h3>
              <p className="text-[12.5px] text-fg-soft mb-3">
                {t(
                  'Operator puede actuar en tu nombre cuando conectas Gmail, Drive, Calendar o Slack.',
                  'Operator puede actuar en tu nombre cuando conectas Gmail, Drive, Calendar o Slack.',
                )}
              </p>
              <Link href="/settings/integrations">
                <Button size="sm" variant="outline">
                  {t('Connect now', 'Conectar ahora')}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
