'use client';
import { useRef, useState } from 'react';
import {
  Upload,
  Loader2,
  X,
  Sparkles,
  Zap,
  Edit3,
  RotateCcw,
  ArrowLeft,
  Compass,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { VariantCard } from './variant-card';
import { AdEditor } from './ad-editor';
import { useCampaignMemory, type CampaignState } from '../hooks/use-campaign-memory';
import type {
  ProductBrief,
  Variant,
  CampaignIntent,
  AspectRatio,
  QualityReport,
  CampaignDirection,
} from '../types';

type Step =
  | 'upload'
  | 'analyzing'
  | 'brief'
  | 'planning'
  | 'grid'
  | 'editor';

interface UploadedImage {
  url: string;
  preview: string;
}

export function CreativeStudioView() {
  const { locale } = useI18n();
  const es = locale === 'es';

  const { campaign, loading: loadingCampaign, load, setCampaign, patchCampaign, reset } =
    useCampaignMemory();

  // Local UI state
  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [instructions, setInstructions] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [campaignIntent, setCampaignIntent] = useState<CampaignIntent>('launch');

  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [renderLoading, setRenderLoading] = useState<Record<string, boolean>>({});
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [briefEdit, setBriefEdit] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  // If a campaign loaded from URL, hydrate step/grid
  if (campaign && step === 'upload' && !loadingCampaign) {
    // Decide where to land
    if (campaign.variants?.length > 0) {
      setStep('grid');
    } else if (campaign.brief) {
      setStep('brief');
      if (campaign.brief.campaignIntent) setCampaignIntent(campaign.brief.campaignIntent);
      setAspectRatio(campaign.aspectRatio);
    }
  }

  // ═════════════════════════════════════════════════════
  // Upload
  // ═════════════════════════════════════════════════════
  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    for (const file of Array.from(e.target.files).slice(0, 10 - images.length)) {
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
          setImages((prev) => [
            ...prev,
            { url: data.url, preview: URL.createObjectURL(file) },
          ]);
        }
      } catch {}
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function rmImg(i: number) {
    setImages((prev) => {
      const n = [...prev];
      URL.revokeObjectURL(n[i].preview);
      n.splice(i, 1);
      return n;
    });
  }

  // ═════════════════════════════════════════════════════
  // Step 2: analyze
  // ═════════════════════════════════════════════════════
  async function runAnalyze() {
    if (!images.length) return;
    setStep('analyzing');
    setAnalysisLog([]);

    const liveLogs = es
      ? [
          'Analizando imagenes...',
          'Detectando logo...',
          'Identificando pantallas...',
          'Extrayendo texto (OCR)...',
          'Sintetizando producto...',
        ]
      : [
          'Analyzing images...',
          'Detecting logo...',
          'Identifying screens...',
          'Extracting text (OCR)...',
          'Synthesizing product...',
        ];

    let li = 0;
    const interval = setInterval(() => {
      if (li < liveLogs.length) {
        setAnalysisLog((prev) => [...prev, liveLogs[li]]);
        li++;
      }
    }, 1400);

    try {
      const res = await fetch('/api/creative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: images.map((i) => i.url),
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
        imageUrls: images.map((i) => i.url),
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

  // ═════════════════════════════════════════════════════
  // Step 3: plan + render (parallel)
  // ═════════════════════════════════════════════════════
  async function runPlanAndRender(briefOverride?: ProductBrief) {
  if (!campaign) return;
  const campaignId = campaign.id;
  const briefToUse = briefOverride || campaign.brief;
  if (!briefToUse) return;

  setStep('planning');

  try {
    const planRes = await fetch('/api/creative/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId }),
    });

    const planData = await planRes.json();
    if (!planRes.ok) throw new Error(planData.error || 'Plan failed');

    const variants: Variant[] = planData.variants;
    patchCampaign({ variants });
    setStep('grid');

    const initial: Record<string, boolean> = {};
    variants.forEach((v) => {
      initial[v.id] = true;
    });
    setRenderLoading(initial);

    const concurrency = 2;

    async function renderOne(v: Variant) {
      try {
        const res = await fetch('/api/creative/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            variantId: v.id,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error('[render] failed', v.id, data);
          throw new Error(data?.error || 'Render failed');
        }

        if (!data?.imageUrl) {
          console.error('[render] missing imageUrl', v.id, data);
          throw new Error('Render returned no imageUrl');
        }

        patchCampaign({
          renderedImages: {
            ...(campaignRef.current?.renderedImages || {}),
            [v.id]: data.imageUrl,
          },
          qualityReports: data.qualityReport
            ? {
                ...(campaignRef.current?.qualityReports || {}),
                [v.id]: data.qualityReport,
              }
            : campaignRef.current?.qualityReports || {},
        });
      } catch (err) {
        console.error('[render] variant', v.id, err);
        toast.error(
          es
            ? `Falló el render de la variante ${v.id}`
            : `Render failed for variant ${v.id}`,
        );
      } finally {
        setRenderLoading((prev) => ({ ...prev, [v.id]: false }));
      }
    }

    for (let i = 0; i < variants.length; i += concurrency) {
      const batch = variants.slice(i, i + concurrency);
      await Promise.all(batch.map(renderOne));
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed');
    setStep('brief');
  }
}

  // We need a ref to campaign for parallel callbacks (setCampaign batching)
  const campaignRef = useRef<CampaignState | null>(null);
  campaignRef.current = campaign;

  // ═════════════════════════════════════════════════════
  // Regenerate single variant
  // ═════════════════════════════════════════════════════
  async function handleRegenerate(variant: Variant) {
    if (!campaign) return;
    setRegenerating((prev) => ({ ...prev, [variant.id]: true }));

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

      // Swap in state
      patchCampaign({
        variants: (campaignRef.current?.variants || []).map((v) =>
          v.id === variant.id ? newVariant : v,
        ),
        memory: data.memory || campaignRef.current?.memory,
        renderedImages: (() => {
          const next = { ...(campaignRef.current?.renderedImages || {}) };
          delete next[variant.id];
          next[newVariant.id] = newImageUrl;
          return next;
        })(),
        qualityReports: (() => {
          const next = { ...(campaignRef.current?.qualityReports || {}) };
          delete next[variant.id];
          if (newReport) next[newVariant.id] = newReport;
          return next;
        })(),
      });

      toast.success(es ? 'Variante regenerada' : 'Variant regenerated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setRegenerating((prev) => {
        const next = { ...prev };
        delete next[variant.id];
        return next;
      });
    }
  }

  // ═════════════════════════════════════════════════════
  // Canvas render -> validate
  // ═════════════════════════════════════════════════════
  async function handleRendered(variantId: string, dataUrl: string) {
    if (!campaign) return;
    // Do not re-validate if we already have a report
    if (campaign.qualityReports[variantId]) return;
    // Do not validate http URLs (those were evaluated server-side already)
    if (campaign.renderedImages[variantId]?.startsWith('http')) return;

    try {
      const res = await fetch('/api/creative/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          variantId,
          dataUrl,
        }),
      });
      const data = await res.json();
      if (res.ok && data.qualityReport) {
        patchCampaign({
          qualityReports: {
            ...(campaignRef.current?.qualityReports || {}),
            [variantId]: data.qualityReport,
          },
        });
      }
    } catch {
      // Validation is informative, not blocking
    }
  }

  // ═════════════════════════════════════════════════════
  // Reset full flow
  // ═════════════════════════════════════════════════════
  function handleReset() {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setImages([]);
    setInstructions('');
    setAnalysisLog([]);
    setRenderLoading({});
    setRegenerating({});
    setSelectedVariant(null);
    setStep('upload');
    reset();
  }

  // ═════════════════════════════════════════════════════
  // Loading campaign from URL
  // ═════════════════════════════════════════════════════
  if (loadingCampaign) {
    return (
      <div className="px-4 lg:px-10 py-10 max-w-[560px] mx-auto">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-gold animate-spin" />
          <span className="text-[13px] text-fg-muted">
            {es ? 'Cargando campana...' : 'Loading campaign...'}
          </span>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // STEP: upload
  // ═════════════════════════════════════════════════════
  if (step === 'upload') {
    return (
      <div className="px-4 lg:px-10 py-6 max-w-[760px] mx-auto space-y-5">
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3">
            <Sparkles className="h-3 w-3" />
            {es ? 'Crea campanas' : 'Create Campaigns'}
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
              ? 'El sistema entiende tu producto y genera 5 anuncios distintos.'
              : 'The system understands your product and generates 5 different ads.'}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
            {es ? 'Imagenes' : 'Images'}{' '}
            {images.length > 0 && (
              <span className="text-gold">({images.length}/10)</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div
                key={i}
                className="relative group h-[72px] w-[72px] rounded-lg overflow-hidden border border-border"
              >
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => rmImg(i)}
                  className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
            {images.length < 10 && (
              <button
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1',
                  images.length === 0
                    ? 'w-full h-24 border-gold/30 bg-gold/5 hover:bg-gold/10'
                    : 'h-[72px] w-[72px] border-border hover:border-gold/40 bg-surface-2',
                )}
              >
                <Upload
                  className={cn(
                    'text-gold',
                    images.length === 0 ? 'h-5 w-5' : 'h-3.5 w-3.5',
                  )}
                />
                {images.length === 0 && (
                  <span className="text-[11px] text-gold">
                    {es
                      ? 'Logo, producto, screenshots...'
                      : 'Logo, product, screenshots...'}
                  </span>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="hidden"
          />
        </div>

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={
            es
              ? 'Algo especifico que contar... (opcional)'
              : 'Anything specific to tell... (optional)'
          }
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-[13px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">
              {es ? 'Intencion' : 'Intent'}
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  ['launch', es ? 'Lanzar' : 'Launch'],
                  ['conversion', es ? 'Conversion' : 'Convert'],
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
          disabled={!images.length}
          className="w-full h-12 rounded-xl gold-grad text-bg text-[14px] font-semibold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {es ? 'Analizar mi producto' : 'Analyze my product'}
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // STEP: analyzing
  // ═════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════
  // STEP: brief
  // ═════════════════════════════════════════════════════
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
              {es ? 'Descripcion' : 'Description'}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                {es ? 'Tono' : 'Tone'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10px] capitalize">
                  {b.tone}
                </span>
                {b.voiceCues.slice(0, 2).map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10px] text-fg-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
                Target
              </div>
              <p className="text-[11px] text-fg-muted">{b.target}</p>
            </div>
          </div>

          <div>
            <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">
              {es ? 'CTA sugerida' : 'Suggested CTA'}
            </div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-gold text-black text-[12px] font-semibold">
              {b.suggestedCTA}
            </span>
          </div>

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

          {campaign.direction && (
            <DirectionPanel
              direction={campaign.direction}
              locale={locale}
            />
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

  // ═════════════════════════════════════════════════════
  // STEP: planning
  // ═════════════════════════════════════════════════════
  if (step === 'planning') {
    return (
      <div className="px-4 lg:px-10 py-16 max-w-[400px] mx-auto text-center space-y-4">
        <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto" />
        <p className="text-[14px] text-fg-muted">
          {es ? 'Planificando campana...' : 'Planning campaign...'}
        </p>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // STEP: grid
  // ═════════════════════════════════════════════════════
  if (step === 'grid' && campaign) {
    return (
      <div className="px-4 lg:px-10 py-6 max-w-[1200px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[22px]">
              {es ? 'Tus 5 anuncios' : 'Your 5 ads'}
            </h2>
            <p className="text-[11px] text-fg-subtle">
              {es
                ? 'Cada variante tiene un angulo distinto'
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaign.variants.map((v) => (
            <VariantCard
  key={v.id}
  variant={v}
  imageUrl={campaign.renderedImages[v.id] || null}
  loading={renderLoading[v.id] || regenerating[v.id] || false}
  qualityReport={campaign.qualityReports[v.id]}
  locale={locale}
  onSelect={() => {
    setSelectedVariant(v);
    setStep('editor');
  }}
  onRegenerate={() => handleRegenerate(v)}
  isSelected={campaign.memory.selectedVariantId === v.id}
/>
          ))}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════
  // STEP: editor
  // ═════════════════════════════════════════════════════
  if (step === 'editor' && selectedVariant && campaign) {
    const imageUrl = campaign.renderedImages[selectedVariant.id];
    if (!imageUrl) {
      setStep('grid');
      return null;
    }

    return (
      <div className="px-4 lg:px-10 py-6 max-w-[1200px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep('grid')}
            className="flex items-center gap-2 text-[12px] text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {es ? 'Volver a variantes' : 'Back to variants'}
          </button>
        </div>
        <AdEditor
  imageUrl={imageUrl.startsWith('http') ? imageUrl : (campaign.renderedImages[selectedVariant.id] || '')}
  variant={selectedVariant}
  locale={locale}
  onBack={() => setStep('grid')}
/>
      </div>
    );
  }

  return null;
}

function DirectionPanel({
  direction,
  locale,
}: {
  direction: CampaignDirection;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';
  const labels = (en: string, esL: string) => (es ? esL : en);

  const chips: Array<{ label: string; value: string }> = [
    { label: labels('Archetype', 'Arquetipo'), value: direction.archetype },
    { label: labels('Register', 'Registro'), value: direction.visualRegister },
    { label: labels('Hero', 'Hero'), value: direction.heroStrategy.replace('_', ' ') },
    { label: labels('Copy', 'Texto'), value: direction.copyStrategy.replace('_', ' ') },
    { label: labels('Lighting', 'Luz'), value: direction.lightingDirection.replace('_', ' ') },
    { label: labels('Motion', 'Energia'), value: direction.motionEnergy },
  ];

  return (
    <div className="rounded-xl border border-gold/20 bg-surface-2/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Compass className="h-3.5 w-3.5 text-gold" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-gold font-medium">
          {labels('Creative direction', 'Direccion creativa')}
        </span>
      </div>

      <p className="text-[13px] text-fg font-display italic leading-snug">
        &ldquo;{direction.directionStatement}&rdquo;
      </p>

      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <div
            key={c.label}
            className="px-2 py-0.5 rounded bg-surface border border-border text-[10px]"
          >
            <span className="text-fg-subtle">{c.label}:</span>{' '}
            <span className="text-fg capitalize">{c.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border/60">
        <span className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">
          {labels('Palette', 'Paleta')}
        </span>
        <div className="flex gap-1">
          <div
            className="h-4 w-4 rounded border border-border"
            style={{ background: direction.paletteDirection.dominant }}
            title={direction.paletteDirection.dominant}
          />
          <div
            className="h-4 w-4 rounded border border-border"
            style={{ background: direction.paletteDirection.accent }}
            title={direction.paletteDirection.accent}
          />
          {direction.paletteDirection.support.slice(0, 3).map((c, i) => (
            <div
              key={i}
              className="h-4 w-4 rounded border border-border"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      <details className="text-[11px] text-fg-muted">
        <summary className="cursor-pointer text-fg-subtle hover:text-fg">
          {labels('Why this direction', 'Por que esta direccion')}
        </summary>
        <p className="mt-1.5 leading-snug">{direction.rationale}</p>
      </details>
    </div>
  );
}
