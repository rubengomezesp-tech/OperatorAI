'use client';
import { useRef, useState, useCallback } from 'react';
import {
  Upload,
  Loader2,
  X,
  Sparkles,
  Zap,
  Edit3,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  Shield,
  ImageIcon,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { VariantCard } from './variant-card';
import { AdEditor } from './ad-editor';
import {
  useCampaignMemory,
  type CampaignState,
} from '../hooks/use-campaign-memory';
import type {
  ProductBrief,
  Variant,
  CampaignIntent,
  AspectRatio,
  QualityReport,
  BrandAssets,
} from '../types';

type Step =
  | 'upload'
  | 'analyzing'
  | 'brief'
  | 'planning'
  | 'grid'
  | 'editor';

type VariantStatus = 'queued' | 'running' | 'done' | 'failed';

interface VariantRenderState {
  status: VariantStatus;
  errorCode?: string;
  errorMessage?: string;
}

interface UploadedImage {
  url: string;
  preview: string;
}

interface UploadedLogo {
  url: string;
  preview: string;
  width: number;
  height: number;
}

const RENDER_CONCURRENCY = 2;

// ═══════════════════════════════════════════════════════════

export function CreativeStudioView() {
  const { locale } = useI18n();
  const es = locale === 'es';

  const {
    campaign,
    loading: loadingCampaign,
    load,
    setCampaign,
    patchCampaign,
    reset,
  } = useCampaignMemory();

  const [step, setStep] = useState<Step>('upload');

  // SEPARATED UPLOAD STATE
  const [logo, setLogo] = useState<UploadedLogo | null>(null);
  const [brandName, setBrandName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);

  const [instructions, setInstructions] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [campaignIntent, setCampaignIntent] = useState<CampaignIntent>('launch');

  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [renderStates, setRenderStates] = useState<
    Record<string, VariantRenderState>
  >({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [briefEdit, setBriefEdit] = useState(false);

  const logoFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const campaignRef = useRef<CampaignState | null>(null);
  campaignRef.current = campaign;

  // Hydrate step from loaded campaign
  if (campaign && step === 'upload' && !loadingCampaign) {
    if (campaign.variants?.length > 0) {
      setStep('grid');
    } else if (campaign.brief) {
      setStep('brief');
      if (campaign.brief.campaignIntent)
        setCampaignIntent(campaign.brief.campaignIntent);
      setAspectRatio(campaign.aspectRatio);
    }
  }

  // ═══════════════════════════════════════════════════
  // Logo upload — single file, preserved exactly
  // ═══════════════════════════════════════════════════
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(es ? 'Logo demasiado grande (max 5MB)' : 'Logo too large (max 5MB)');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/images/upload-reference', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');

      // Get dimensions
      const preview = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setLogo({
          url: data.url,
          preview,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.src = preview;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    }

    if (logoFileRef.current) logoFileRef.current.value = '';
  }

  function removeLogo() {
    if (logo) URL.revokeObjectURL(logo.preview);
    setLogo(null);
  }

  // ═══════════════════════════════════════════════════
  // Product images upload
  // ═══════════════════════════════════════════════════
  async function handleProductUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const remaining = 8 - productImages.length;
    for (const file of Array.from(e.target.files).slice(0, remaining)) {
      if (file.size > 10 * 1024 * 1024) continue;
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await fetch('/api/images/upload-reference', {
          method: 'POST',
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setProductImages((prev) => [
            ...prev,
            { url: data.url, preview: URL.createObjectURL(file) },
          ]);
        }
      } catch {
        // silent
      }
    }
    if (productFileRef.current) productFileRef.current.value = '';
  }

  function removeProductImage(i: number) {
    setProductImages((prev) => {
      const n = [...prev];
      URL.revokeObjectURL(n[i].preview);
      n.splice(i, 1);
      return n;
    });
  }

  // ═══════════════════════════════════════════════════
  // Analyze
  // ═══════════════════════════════════════════════════
  async function runAnalyze() {
    if (!productImages.length) {
      toast.error(
        es
          ? 'Sube al menos una imagen de producto'
          : 'Upload at least one product image',
      );
      return;
    }

    setStep('analyzing');
    setAnalysisLog([]);

    const liveLogs = es
      ? [
          ...(logo ? ['Guardando logo y paleta de marca...'] : []),
          'Analizando imagenes del producto...',
          'Detectando categoria...',
          'Identificando escenarios publicitarios...',
          'Extrayendo texto (OCR)...',
          'Sintetizando brief...',
          'Derivando direccion creativa...',
        ]
      : [
          ...(logo ? ['Saving logo and brand palette...'] : []),
          'Analyzing product images...',
          'Detecting category...',
          'Identifying ad scenarios...',
          'Extracting text (OCR)...',
          'Synthesizing brief...',
          'Deriving creative direction...',
        ];

    let li = 0;
    const interval = setInterval(() => {
      if (li < liveLogs.length) {
        setAnalysisLog((prev) => [...prev, liveLogs[li]]);
        li++;
      }
    }, 1400);

    // Build BrandAssets payload if logo was uploaded
    const brandAssets: BrandAssets | undefined = logo
      ? {
          logoUrl: logo.url,
          brandName: brandName.trim() || undefined,
          slogan: slogan.trim() || undefined,
          defaultLogoPosition: 'top-right',
        }
      : undefined;

    try {
      const res = await fetch('/api/creative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: productImages.map((i) => i.url),
          brandAssets,
          instructions,
          locale,
          campaignIntent,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analyze failed');

      clearInterval(interval);

      const state: CampaignState = {
        id: data.campaignId,
        imageUrls: productImages.map((i) => i.url),
        brandAssets: data.brandAssets ?? brandAssets,
        instructions,
        aspectRatio,
        campaignIntent,
        locale,
        analyses: data.analyses,
        brief: data.brief,
        direction: data.direction,
        variants: [],
        memory: {
          previousVariants: [],
          rejectedVariantIds: [],
          userEdits: {},
          regenerationCount: 0,
        },
        renderedImages: {},
        qualityReports: {},
      };
      setCampaign(state);
      setTimeout(() => setStep('brief'), 600);
    } catch (err) {
      clearInterval(interval);
      toast.error(err instanceof Error ? err.message : 'Failed');
      setStep('upload');
    }
  }

  // ═══════════════════════════════════════════════════
  // Plan + render
  // ═══════════════════════════════════════════════════
  async function runPlanAndRender() {
    if (!campaign) return;
    setStep('planning');

    let variants: Variant[] = [];
    try {
      const planRes = await fetch('/api/creative/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      const planData = await planRes.json();
      if (!planRes.ok) throw new Error(planData.error || 'Plan failed');
      variants = planData.variants;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setStep('brief');
      return;
    }

    patchCampaign({ variants });
    setStep('grid');

    const initial: Record<string, VariantRenderState> = {};
    variants.forEach((v) => {
      initial[v.id] = { status: 'queued' };
    });
    setRenderStates(initial);

    await renderQueue(variants, RENDER_CONCURRENCY);
  }

  const renderQueue = useCallback(
    async (variants: Variant[], concurrency: number) => {
      const queue = [...variants];
      const worker = async () => {
        while (queue.length > 0) {
          const v = queue.shift();
          if (!v) break;
          await renderOneVariant(v);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(concurrency, variants.length) }, worker),
      );
    },
    [],
  );

  const renderOneVariant = useCallback(async (variant: Variant) => {
    const campaignId = campaignRef.current?.id;
    if (!campaignId) return;

    setRenderStates((prev) => ({
      ...prev,
      [variant.id]: { status: 'running' },
    }));

    try {
      const res = await fetch('/api/creative/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, variantId: variant.id }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (data.ok) {
        setRenderStates((prev) => ({
          ...prev,
          [variant.id]: { status: 'done' },
        }));
        patchCampaign({
          renderedImages: {
            ...(campaignRef.current?.renderedImages || {}),
            [variant.id]: data.imageUrl,
          },
          qualityReports: data.qualityReport
            ? {
                ...(campaignRef.current?.qualityReports || {}),
                [variant.id]: data.qualityReport,
              }
            : campaignRef.current?.qualityReports || {},
        });
      } else {
        setRenderStates((prev) => ({
          ...prev,
          [variant.id]: {
            status: 'failed',
            errorCode: data.code || 'UNKNOWN',
            errorMessage: data.error || 'Unknown error',
          },
        }));
      }
    } catch (err) {
      setRenderStates((prev) => ({
        ...prev,
        [variant.id]: {
          status: 'failed',
          errorCode: 'NETWORK',
          errorMessage: err instanceof Error ? err.message : 'Network error',
        },
      }));
    }
  }, [patchCampaign]);

  const retryVariant = useCallback(
    async (variant: Variant) => {
      await renderOneVariant(variant);
    },
    [renderOneVariant],
  );

  async function handleRegenerate(variant: Variant) {
    if (!campaign) return;
    setRenderStates((prev) => ({
      ...prev,
      [variant.id]: { status: 'running' },
    }));

    try {
      const res = await fetch('/api/creative/regenerate-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          variantId: variant.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regenerate failed');

      const newVariant: Variant = data.variant;
      const newImageUrl: string = data.imageUrl;
      const newReport: QualityReport | undefined = data.qualityReport;

      patchCampaign({
        variants: (campaignRef.current?.variants || []).map((v) =>
          v.id === variant.id ? newVariant : v,
        ),
        memory: data.memory || campaignRef.current?.memory,
        renderedImages: (() => {
          const next = { ...(campaignRef.current?.renderedImages || {}) };
          delete next[variant.id];
          if (newImageUrl) next[newVariant.id] = newImageUrl;
          return next;
        })(),
        qualityReports: (() => {
          const next = { ...(campaignRef.current?.qualityReports || {}) };
          delete next[variant.id];
          if (newReport) next[newVariant.id] = newReport;
          return next;
        })(),
      });

      setRenderStates((prev) => {
        const next = { ...prev };
        delete next[variant.id];
        next[newVariant.id] = { status: 'done' };
        return next;
      });

      toast.success(es ? 'Variante regenerada' : 'Variant regenerated');
    } catch (err) {
      setRenderStates((prev) => ({
        ...prev,
        [variant.id]: {
          status: 'failed',
          errorCode: 'REGEN_FAILED',
          errorMessage: err instanceof Error ? err.message : 'Failed',
        },
      }));
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  }

  function handleReset() {
    productImages.forEach((i) => URL.revokeObjectURL(i.preview));
    if (logo) URL.revokeObjectURL(logo.preview);
    setLogo(null);
    setBrandName('');
    setSlogan('');
    setProductImages([]);
    setInstructions('');
    setAnalysisLog([]);
    setRenderStates({});
    setSelectedVariant(null);
    setStep('upload');
    reset();
  }

  if (loadingCampaign) {
    return (
      <div className="px-4 lg:px-10 py-10 max-w-[560px] mx-auto">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-gold animate-spin" />
          <span className="text-[13px] text-fg-muted">
            {es ? 'Cargando campaña...' : 'Loading campaign...'}
          </span>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STEP: upload
  // ═════════════════════════════════════════════════════════════
  if (step === 'upload') {
    const canAnalyze = productImages.length > 0;

    return (
      <div className="px-4 lg:px-10 py-6 max-w-[760px] mx-auto space-y-5">
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
            <Sparkles className="h-3 w-3" />
            {es ? 'Crea campañas' : 'Create Campaigns'}
          </div>
          <h1 className="font-display text-[26px] lg:text-[34px]">
            {es ? (
              <>
                Sube. Analiza. <span className="text-gold">Publica.</span>
              </>
            ) : (
              <>
                Upload. Analyze. <span className="text-gold">Publish.</span>
              </>
            )}
          </h1>
          <p className="text-[13px] text-fg-muted mt-1.5 max-w-[420px] mx-auto">
            {es
              ? 'Separa tu marca del producto. Preservamos tu logo exacto.'
              : 'Separate your brand from your product. We preserve your logo exactly.'}
          </p>
        </div>

        {/* ═══ BRAND ASSETS (optional) ═══ */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
                {es ? 'Marca' : 'Brand'}
              </span>
              <span className="text-[10px] text-fg-subtle">
                {es ? '(opcional)' : '(optional)'}
              </span>
            </div>
            {logo && (
              <span className="text-[9px] text-gold/80">
                {es
                  ? 'Tu logo se preservará exacto'
                  : 'Your logo will be preserved exactly'}
              </span>
            )}
          </div>

          <div className="flex gap-3">
            {/* Logo dropzone */}
            {logo ? (
              <div className="relative h-[88px] w-[88px] rounded-lg overflow-hidden border border-gold/30 bg-surface-2 shrink-0 group">
                <img
                  src={logo.preview}
                  alt="logo"
                  className="w-full h-full object-contain p-1.5"
                />
                <button
                  onClick={removeLogo}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white text-center py-0.5">
                  {logo.width}×{logo.height}
                </div>
              </div>
            ) : (
              <button
                onClick={() => logoFileRef.current?.click()}
                className="h-[88px] w-[88px] shrink-0 rounded-lg border-2 border-dashed border-border hover:border-gold/40 bg-surface-2 flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <Plus className="h-4 w-4 text-fg-subtle" />
                <span className="text-[9px] text-fg-subtle">Logo</span>
                <span className="text-[8px] text-fg-subtle opacity-60">PNG/SVG</span>
              </button>
            )}

            {/* Brand fields */}
            <div className="flex-1 space-y-2 min-w-0">
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={es ? 'Nombre de marca (opcional)' : 'Brand name (optional)'}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-2 text-[12px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
              />
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                placeholder={es ? 'Slogan / tagline (opcional)' : 'Slogan / tagline (optional)'}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface-2 text-[12px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"
              />
            </div>
          </div>

          <input
            ref={logoFileRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            onChange={handleLogoUpload}
            className="hidden"
          />
        </div>

        {/* ═══ PRODUCT / CAMPAIGN ASSETS (required) ═══ */}
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-gold" />
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
                {es ? 'Producto / Campaña' : 'Product / Campaign'}
              </span>
              {productImages.length > 0 && (
                <span className="text-[10px] text-gold">
                  ({productImages.length}/8)
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-fg-subtle -mt-1">
            {es
              ? 'Fotos de producto, screenshots, packaging, referencias de escena'
              : 'Product photos, screenshots, packaging, scene references'}
          </p>

          <div className="flex flex-wrap gap-2">
            {productImages.map((img, i) => (
              <div
                key={i}
                className="relative group h-[72px] w-[72px] rounded-lg overflow-hidden border border-border"
              >
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeProductImage(i)}
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
            {productImages.length < 8 && (
              <button
                onClick={() => productFileRef.current?.click()}
                className={cn(
                  'rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1',
                  productImages.length === 0
                    ? 'w-full h-24 border-gold/30 bg-gold/5 hover:bg-gold/10'
                    : 'h-[72px] w-[72px] border-border hover:border-gold/40 bg-surface-2',
                )}
              >
                <Upload
                  className={cn(
                    'text-gold',
                    productImages.length === 0 ? 'h-5 w-5' : 'h-3.5 w-3.5',
                  )}
                />
                {productImages.length === 0 && (
                  <span className="text-[11px] text-gold">
                    {es ? 'Sube tus imágenes de producto' : 'Upload product images'}
                  </span>
                )}
              </button>
            )}
          </div>

          <input
            ref={productFileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleProductUpload}
            className="hidden"
          />
        </div>

        {/* Instructions */}
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={
            es
              ? 'Algo específico que contar... (opcional)'
              : 'Anything specific to tell... (optional)'
          }
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-[13px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">
              {es ? 'Intención' : 'Intent'}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ['launch', es ? 'Lanzar' : 'Launch'],
                  ['conversion', es ? 'Conversión' : 'Convert'],
                  ['branding', 'Branding'],
                  ['retargeting', es ? 'Retargeting' : 'Retarget'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setCampaignIntent(id as CampaignIntent)}
                  className={cn(
                    'h-7 rounded-md text-[10px] font-medium border',
                    campaignIntent === id
                      ? 'bg-gold/15 text-gold border-gold/30'
                      : 'bg-surface-2 text-fg-muted border-border',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">
              {es ? 'Formato' : 'Format'}
            </div>
            <div className="flex gap-1">
              {(['9:16', '1:1', '4:5'] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={cn(
                    'flex-1 h-7 rounded-md text-[10px] font-medium border',
                    aspectRatio === r
                      ? 'bg-gold/15 text-gold border-gold/30'
                      : 'bg-surface-2 text-fg-muted border-border',
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={runAnalyze}
          disabled={!canAnalyze}
          className="w-full h-12 rounded-xl gold-grad text-bg text-[14px] font-semibold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {es ? 'Analizar producto' : 'Analyze product'}
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STEP: analyzing
  // ═════════════════════════════════════════════════════════════
  if (step === 'analyzing') {
    return (
      <div className="px-4 lg:px-10 py-10 max-w-[560px] mx-auto">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-gold animate-spin" />
            <h2 className="font-display text-[18px]">
              {es ? 'Analizando tu producto' : 'Analyzing your product'}
            </h2>
          </div>
          <div className="space-y-2 pl-8">
            {analysisLog.map((log, i) => (
              <div
                key={i}
                className="text-[13px] text-fg-muted animate-in fade-in slide-in-from-left-2 duration-300"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STEP: brief
  // ═════════════════════════════════════════════════════════════
  if (step === 'brief' && campaign?.brief) {
    const b = campaign.brief;
    return (
      <div className="px-4 lg:px-10 py-6 max-w-[680px] mx-auto space-y-5">
        <div className="text-center">
          <h2 className="font-display text-[24px] mb-1">
            {es ? 'Tu producto' : 'Your product'}
          </h2>
          <p className="text-[12px] text-fg-subtle">
            {es ? 'Revisa antes de generar' : 'Review before generating'}
          </p>
        </div>

        <div className="rounded-xl border border-gold/20 bg-surface p-5 space-y-4">
          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
              {es ? 'Descripción' : 'Description'}
            </div>
            {briefEdit ? (
              <textarea
                value={b.oneLiner}
                onChange={(e) =>
                  patchCampaign({
                    brief: { ...b, oneLiner: e.target.value } as ProductBrief,
                  })
                }
                rows={2}
                className="w-full p-2 rounded border border-border bg-surface-2 text-[14px] focus:outline-none focus:border-gold/40"
              />
            ) : (
              <p className="text-[15px] font-display">{b.oneLiner}</p>
            )}
          </div>

          {b.features.length > 0 && (
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1.5">
                {es ? 'Funciones' : 'Features'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {b.features.map((f, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-[11px] text-gold"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
              {es ? 'Paleta' : 'Palette'}
            </div>
            <div className="flex gap-1.5">
              {b.palette.map((c, i) => (
                <div
                  key={i}
                  className="h-6 w-6 rounded border border-border"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {campaign.brandAssets?.logoUrl && (
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1.5">
                {es ? 'Logo (preservado)' : 'Logo (preserved)'}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded border border-gold/30 bg-surface-2 p-1">
                  <img
                    src={campaign.brandAssets.logoUrl}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] text-gold/80">
                  {es
                    ? 'Se insertará exacto en el editor'
                    : 'Will be inserted exactly in editor'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => setBriefEdit(!briefEdit)}
              className="h-10 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted flex items-center gap-1.5"
            >
              <Edit3 className="h-3 w-3" />
              {briefEdit ? (es ? 'Guardar' : 'Save') : es ? 'Editar' : 'Edit'}
            </button>
            <button
              onClick={() => runPlanAndRender()}
              className="flex-1 h-10 rounded-lg gold-grad text-bg text-[13px] font-medium flex items-center justify-center gap-2"
            >
              <Zap className="h-3.5 w-3.5" />
              {es ? 'Generar 5 anuncios' : 'Generate 5 ads'}
            </button>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="text-[11px] text-fg-subtle hover:text-fg-muted flex items-center gap-1 mx-auto"
        >
          <ArrowLeft className="h-3 w-3" />
          {es ? 'Empezar de nuevo' : 'Start over'}
        </button>
      </div>
    );
  }

  if (step === 'planning') {
    return (
      <div className="px-4 lg:px-10 py-16 max-w-[400px] mx-auto text-center space-y-4">
        <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
        <p className="text-[14px] text-fg-muted">
          {es ? 'Planificando campaña...' : 'Planning campaign...'}
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STEP: grid
  // ═════════════════════════════════════════════════════════════
  if (step === 'grid' && campaign) {
    const failedCount = Object.values(renderStates).filter(
      (s) => s.status === 'failed',
    ).length;

    return (
      <div className="px-4 lg:px-10 py-6 max-w-[1200px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[22px]">
              {es ? 'Tus 5 anuncios' : 'Your 5 ads'}
            </h2>
            <p className="text-[11px] text-fg-subtle">
              {es
                ? 'Cada variante tiene un ángulo distinto'
                : 'Each variant has a different angle'}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="h-9 px-3 rounded-lg border border-border bg-surface-2 text-[11px] text-fg-muted flex items-center gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            {es ? 'Nueva' : 'New'}
          </button>
        </div>

        {failedCount > 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-[12px] text-amber-200">
              {es
                ? failedCount + ' variantes fallaron. Pulsa reintentar.'
                : failedCount + ' variants failed. Click retry.'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaign.variants.map((v) => {
            const state = renderStates[v.id] || { status: 'queued' as VariantStatus };
            const imageUrl = campaign.renderedImages[v.id] || null;

            if (state.status === 'failed') {
              return (
                <FailedVariantCard
                  key={v.id}
                  variant={v}
                  locale={locale}
                  errorMessage={state.errorMessage}
                  onRetry={() => retryVariant(v)}
                />
              );
            }

            return (
              <VariantCard
                key={v.id}
                variant={v}
                imageUrl={imageUrl}
                loading={state.status === 'queued' || state.status === 'running'}
                qualityReport={campaign.qualityReports[v.id]}
                locale={locale}
                onSelect={() => {
                  setSelectedVariant(v);
                  setStep('editor');
                }}
                onRegenerate={() => handleRegenerate(v)}
                isSelected={campaign.memory.selectedVariantId === v.id}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // STEP: editor
  // ═════════════════════════════════════════════════════════════
  if (step === 'editor' && selectedVariant && campaign) {
    const imageUrl = campaign.renderedImages[selectedVariant.id];
    if (!imageUrl) {
      setStep('grid');
      return null;
    }

    return (
      <div className="px-4 lg:px-10 py-6 max-w-[1200px] mx-auto space-y-5">
        <AdEditor
          imageUrl={imageUrl}
          variant={selectedVariant}
          locale={locale}
          onBack={() => setStep('grid')}
          brandAssets={campaign.brandAssets}
        />
      </div>
    );
  }

  return null;
}

function FailedVariantCard({
  variant,
  locale,
  errorMessage,
  onRetry,
}: {
  variant: Variant;
  locale: 'en' | 'es';
  errorMessage?: string;
  onRetry: () => void;
}) {
  const es = locale === 'es';
  const aspect =
    variant.aspectRatio === '1:1'
      ? '1/1'
      : variant.aspectRatio === '4:5'
      ? '4/5'
      : '9/16';

  return (
    <div className="group relative rounded-xl overflow-hidden border-2 border-red-500/30 bg-surface">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.12em] text-red-400 font-medium truncate">
          {variant.layout.replace('_', ' ')}
        </span>
        <span className="text-[9px] text-fg-subtle uppercase tracking-wide">
          {variant.angle}
        </span>
      </div>

      <div
        className="relative bg-surface-2 flex flex-col items-center justify-center gap-3 p-6"
        style={{ aspectRatio: aspect }}
      >
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <p className="text-[11px] text-fg-muted text-center max-w-[180px] line-clamp-3">
          {errorMessage || (es ? 'Error al generar' : 'Generation failed')}
        </p>
        <button
          onClick={onRetry}
          className="h-8 px-3 rounded-lg bg-gold text-black text-[11px] font-medium flex items-center gap-1.5 hover:brightness-110"
        >
          <RefreshCw className="h-3 w-3" />
          {es ? 'Reintentar' : 'Retry'}
        </button>
      </div>
    </div>
  );
}
