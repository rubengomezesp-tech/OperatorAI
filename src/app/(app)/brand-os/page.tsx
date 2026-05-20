'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Save, Palette, Plus, X, Loader2, Globe, RefreshCw, Plug, FileText, ArrowRight, Sparkles, Image as ImageIcon, Brain, Database, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
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
  source_url?: string;
  detected_logo_url?: string;
  logo_url?: string;
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

interface CompanyIntelResult {
  method: 'firecrawl' | 'scraper' | 'hybrid';
  firecrawlEnabled: boolean;
  pages: Array<{
    url: string;
    title?: string;
    method: 'firecrawl' | 'scraper' | 'hybrid';
    chars: number;
  }>;
  createdDocuments: Array<{
    id: string;
    title: string;
    status: 'ready' | 'failed';
    chunkCount: number;
    error?: string;
  }>;
  warnings: string[];
  requirements: {
    firecrawl: boolean;
    embeddings: boolean;
  };
}

const DEFAULT: BrandProfile = {
  brand_name: '', description: '', vibe: '', colors: [], fonts: [],
  target_audience: '', tone_keywords: [], visual_style: '', industry: '',
  content_pillars: [], avoid_keywords: [], instagram_handle: '', brand_values: [],
};

const PRESET_COLORS = ['#C9A863', '#1A1A1B', '#FFFFFF', '#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

function getProfileWebsite(profile: Partial<BrandProfile> | null | undefined): string {
  return profile?.website_url || profile?.source_url || '';
}

function getProfileLogo(profile: Partial<BrandProfile>): string | undefined {
  return profile.detected_logo_url || profile.logo_url || undefined;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function uniqueColors(values: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value || !/^#[0-9a-f]{6}$/i.test(value)) continue;
    const color = value.toLowerCase();
    if (seen.has(color)) continue;
    seen.add(color);
    out.push(color);
  }
  return out;
}

export default function BrandOSPage() {
  const { locale } = useI18n();
  const [bp, setBp] = useState<BrandProfile>(DEFAULT);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [extractMeta, setExtractMeta] = useState<{ confidence?: number; warnings?: string[] } | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelMaxPages, setIntelMaxPages] = useState(8);
  const [intelResult, setIntelResult] = useState<CompanyIntelResult | null>(null);
  const [newColor, setNewColor] = useState('#C9A863');

  useEffect(() => {
    Promise.all([
      fetch('/api/brand/get').then((r) => r.json()),
      fetch('/api/knowledge/list').then((r) => r.json()),
      fetch('/api/integrations/list').then((r) => r.json()),
    ])
      .then(([brandData, kbData, intData]) => {
        if (brandData.profile) {
          setBp({ ...DEFAULT, ...brandData.profile });
          setWebsiteUrl(getProfileWebsite(brandData.profile));
        }
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
        body: JSON.stringify({
          ...bp,
          website_url: websiteUrl,
          detected_logo_url: getProfileLogo(bp),
        }),
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
    await extractFromUrl();
  }

  async function extractFromUrl() {
    const url = normalizeUrl(websiteUrl);
    if (!url) {
      toast.error(locale === 'es' ? 'Sin URL configurada' : 'No URL configured');
      return;
    }
    setRescanning(true);
    setExtractMeta(null);
    try {
      const res = await fetch('/api/brand/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, persist: true, downloadLogo: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');

      const extracted = body.extracted ?? {};
      const brand = body.brand ?? {};
      const extractedColors = extracted.colors ?? {};
      const colors = uniqueColors([
        extractedColors.primary,
        extractedColors.secondary,
        extractedColors.accent,
        extractedColors.background,
        ...((extractedColors.palette ?? []) as Array<{ hex?: string }>).map((color) => color.hex),
      ]);
      const fonts = [
        extracted.fonts?.primary?.family,
        extracted.fonts?.display?.family,
        ...((extracted.fonts?.detected ?? []) as string[]),
      ].filter((font, index, list): font is string => Boolean(font) && list.indexOf(font) === index);

      setWebsiteUrl(url);
      setBp((prev) => ({
        ...prev,
        website_url: url,
        brand_name: extracted.name || brand.name || prev.brand_name,
        description: extracted.description || prev.description,
        industry: extracted.industry || prev.industry,
        colors: colors.length > 0 ? colors : prev.colors,
        fonts: fonts.length > 0 ? fonts : prev.fonts,
        detected_logo_url: brand.logoUrl || extracted.logoUrl || prev.detected_logo_url,
        logo_url: brand.logoUrl || extracted.logoUrl || prev.logo_url,
        detected_colors: extracted.colors || prev.detected_colors,
      }));
      setExtractMeta({
        confidence: body.meta?.confidence,
        warnings: body.meta?.warnings,
      });
      toast.success(locale === 'es' ? 'Contexto importado desde la web' : 'Website context imported');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setRescanning(false);
    }
  }

  async function refreshKnowledgeAssets() {
    const kbRes = await fetch('/api/knowledge/list');
    const kbData = await kbRes.json();
    const docs = (kbData.documents ?? []) as BrandAsset[];
    setAssets(docs.filter((d) => d.category === 'brand' || d.is_brand_asset));
  }

  async function buildCompanyKnowledge() {
    const url = normalizeUrl(websiteUrl);
    if (!url) {
      toast.error(locale === 'es' ? 'Sin URL configurada' : 'No URL configured');
      return;
    }
    setIntelLoading(true);
    setIntelResult(null);
    try {
      const res = await fetch('/api/brand/company-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          maxPages: intelMaxPages,
          createKnowledge: true,
          replaceExisting: true,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.details ?? body?.error ?? 'Failed');
      setWebsiteUrl(url);
      setIntelResult(body);
      await refreshKnowledgeAssets();

      const failed = (body.createdDocuments ?? []).filter((doc: { status: string }) => doc.status === 'failed').length;
      if (failed > 0) {
        toast.warning(locale === 'es' ? 'Conocimiento creado con avisos' : 'Knowledge created with warnings');
      } else {
        toast.success(locale === 'es' ? 'Base de conocimiento creada' : 'Knowledge base created');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setIntelLoading(false);
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
  const profileWebsite = websiteUrl || getProfileWebsite(bp);
  const profileLogo = getProfileLogo(bp);

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
              {profileWebsite && (
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
              {profileLogo ? (
                <img
                  src={profileLogo}
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
                {profileWebsite ? (
                  <a
                    href={profileWebsite}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[12px] text-fg-muted hover:text-gold inline-flex items-center gap-1 truncate"
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span className="truncate">{profileWebsite.replace(/^https?:\/\//, '')}</span>
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

      {/* URL IMPORT */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gold" />
                <h2 className="font-display text-[16px]">
                  {t('Import from website', 'Importar desde web')}
                </h2>
              </div>
              <p className="mt-1 text-[12.5px] text-fg-muted">
                {t(
                  'Paste the company URL and Operator will pull name, description, logo, colors and typography signals.',
                  'Pega la URL de la empresa y Operator extrae nombre, descripción, logo, colores y señales de tipografía.',
                )}
              </p>
            </div>
            {extractMeta?.confidence !== undefined && (
              <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                {t('Confidence', 'Confianza')}: {Math.round(extractMeta.confidence * 100)}%
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://empresa.com"
              className="min-h-10 flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-gold"
            />
            <Button onClick={extractFromUrl} loading={rescanning} disabled={!websiteUrl.trim()}>
              <RefreshCw className="h-3.5 w-3.5" />
              {t('Extract context', 'Extraer contexto')}
            </Button>
          </div>

          {(profileLogo || bp.colors.length > 0 || extractMeta?.warnings?.length) && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-2/40 p-3 sm:flex-row sm:items-center">
              {profileLogo && (
                <img
                  src={profileLogo}
                  alt=""
                  className="h-12 w-12 rounded-md border border-border bg-white object-contain p-1"
                />
              )}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="text-[12.5px] text-fg-soft">
                  {bp.brand_name || t('Detected brand context', 'Contexto de marca detectado')}
                </div>
                {bp.colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {bp.colors.slice(0, 8).map((color) => (
                      <span
                        key={color}
                        className="h-5 w-5 rounded border border-border-strong"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>
              {extractMeta?.warnings?.length ? (
                <div className="max-w-sm text-[11.5px] text-fg-subtle">
                  {extractMeta.warnings[0]}
                </div>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>

      {/* COMPANY INTELLIGENCE */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-gold" />
                <h2 className="font-display text-[16px]">
                  {t('Company knowledge extractor', 'Extractor de conocimiento')}
                </h2>
              </div>
              <p className="mt-1 text-[12.5px] text-fg-muted">
                {t(
                  'Build AI-ready company documents from the website and index them in Knowledge.',
                  'Crea documentos de empresa listos para agentes y los indexa en Knowledge.',
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-muted">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1">
                <Search className="h-3 w-3" />
                {intelResult?.method ?? t('auto crawler', 'crawler auto')}
              </span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1',
                intelResult?.requirements?.embeddings === false
                  ? 'border-danger/30 bg-danger/10 text-danger'
                  : 'border-border bg-surface-2',
              )}>
                <Database className="h-3 w-3" />
                {t('RAG index', 'Indice RAG')}
              </span>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_130px_auto]">
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://empresa.com"
              className="min-h-10 rounded-md border border-border bg-surface-2 px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle outline-none transition-colors focus:border-gold"
            />
            <select
              value={intelMaxPages}
              onChange={(e) => setIntelMaxPages(Number(e.target.value))}
              className="min-h-10 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg outline-none transition-colors focus:border-gold"
            >
              <option value={6}>{t('6 pages', '6 paginas')}</option>
              <option value={8}>{t('8 pages', '8 paginas')}</option>
              <option value={12}>{t('12 pages', '12 paginas')}</option>
              <option value={14}>{t('14 pages', '14 paginas')}</option>
            </select>
            <Button onClick={buildCompanyKnowledge} loading={intelLoading} disabled={!websiteUrl.trim()}>
              <Brain className="h-3.5 w-3.5" />
              {t('Build knowledge', 'Crear conocimiento')}
            </Button>
          </div>

          {intelResult && (
            <div className="space-y-3 rounded-lg border border-border bg-surface-2/40 p-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-border bg-bg/30 p-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                    {t('Pages', 'Paginas')}
                  </div>
                  <div className="mt-1 font-display text-[24px] text-gold">{intelResult.pages.length}</div>
                </div>
                <div className="rounded-md border border-border bg-bg/30 p-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                    {t('Docs', 'Docs')}
                  </div>
                  <div className="mt-1 font-display text-[24px] text-gold">{intelResult.createdDocuments.length}</div>
                </div>
                <div className="rounded-md border border-border bg-bg/30 p-3">
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
                    {t('Chunks', 'Chunks')}
                  </div>
                  <div className="mt-1 font-display text-[24px] text-gold">
                    {intelResult.createdDocuments.reduce((sum, doc) => sum + doc.chunkCount, 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {intelResult.createdDocuments.map((doc) => (
                  <div
                    key={doc.title}
                    className="flex items-center gap-3 rounded-md border border-border bg-bg/30 px-3 py-2"
                  >
                    {doc.status === 'ready' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-medium">{doc.title}</div>
                      <div className="text-[11px] text-fg-subtle">
                        {doc.status === 'ready'
                          ? t(`${doc.chunkCount} knowledge chunks`, `${doc.chunkCount} chunks de conocimiento`)
                          : doc.error}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {intelResult.warnings.length > 0 && (
                <div className="rounded-md border border-gold/20 bg-gold/5 px-3 py-2 text-[11.5px] text-fg-muted">
                  {intelResult.warnings[0]}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {intelResult.pages.slice(0, 5).map((page) => (
                  <a
                    key={page.url}
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[220px] truncate rounded-md border border-border bg-bg/30 px-2 py-1 text-[11px] text-fg-muted hover:border-gold/50 hover:text-gold"
                  >
                    {page.title || page.url.replace(/^https?:\/\//, '')}
                  </a>
                ))}
              </div>

              <Link href="/knowledge" className="inline-flex items-center gap-1 text-[12px] text-gold hover:underline">
                {t('Open Knowledge', 'Abrir Knowledge')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

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
