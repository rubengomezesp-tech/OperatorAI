'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Upload,
  Shirt,
  Sparkles,
  Loader2,
  Download,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Zap,
  Layers,
  Palette as PaletteIcon,
  X,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  renderOverlayToBlob,
  renderOverlayToDataUrl,
} from '../lib/overlay-renderer';
import { GARMENT_PRESETS, ALL_GARMENT_TYPES } from '../data/garment-presets';
import { APPLICATION_STYLES, ALL_APPLICATION_STYLES } from '../data/application-styles';
import type {
  GarmentType,
  PlacementZone,
  ApplicationStyle,
  MockupMode,
  MockupControls,
} from '../types';

type Step = 'upload' | 'configure' | 'generating' | 'result';

interface UploadedFile {
  url: string;
  preview: string;
  width: number;
  height: number;
}

export function MockupStudioView() {
  const { locale } = useI18n();
  const es = locale === 'es';

  const [step, setStep] = useState<Step>('upload');
  const [logo, setLogo] = useState<UploadedFile | null>(null);
  const [garment, setGarment] = useState<UploadedFile | null>(null);
  const [garmentType, setGarmentType] = useState<GarmentType>('tshirt_front');
  const [placement, setPlacement] = useState<PlacementZone>('chest');
  const [applicationStyle, setApplicationStyle] = useState<ApplicationStyle>('print');
  const [mode, setMode] = useState<MockupMode>('exact_overlay');
  const [controls, setControls] = useState<MockupControls>({ depth: 0.5, integration: 0.5, texture: 0.4 });
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [livePreview, setLivePreview] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);

  // ─── UPLOADS ────────────────────────────────────────────────
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, kind: 'logo' | 'garment') => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error(es ? 'Archivo demasiado grande (max 10MB)' : 'File too large (max 10MB)');
        return;
      }

      const fd = new FormData();
      fd.append('file', file);

      try {
        const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');

        const preview = URL.createObjectURL(file);
        const img = new window.Image();
        img.onload = () => {
          const payload = {
            url: data.url,
            preview,
            width: img.naturalWidth,
            height: img.naturalHeight,
          };
          if (kind === 'logo') setLogo(payload);
          else setGarment(payload);
        };
        img.src = preview;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Upload failed');
      }
      e.target.value = '';
    },
    [es],
  );

  // ─── LIVE PREVIEW (overlay only) ───────────────────────────
  useEffect(() => {
    if (step !== 'configure') return;
    if (!logo || !garment) return;

    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await renderOverlayToDataUrl({
          logoUrl: logo.preview,
          garmentUrl: garment.preview,
          garmentType,
          placement,
          applicationStyle,
          controls,
        });
        if (!cancelled) setLivePreview(dataUrl);
      } catch {
        if (!cancelled) setLivePreview(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, logo, garment, garmentType, placement, applicationStyle, controls]);

  // ─── GENERATE ───────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!logo || !garment) return;
    setGenerating(true);
    setStep('generating');
    setEngineNote(null);
    setFallbackUsed(false);

    try {
      if (mode === 'exact_overlay') {
        const blob = await renderOverlayToBlob({
          logoUrl: logo.preview,
          garmentUrl: garment.preview,
          garmentType,
          placement,
          applicationStyle,
          controls,
        });
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setStep('result');
      } else {
        const res = await fetch('/api/mockup/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logoUrl: logo.url,
            garmentUrl: garment.url,
            garmentWidth: garment.width,
            garmentHeight: garment.height,
            garmentType,
            placement,
            applicationStyle,
            mode,
            controls,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Generation failed');

        if (data.useOverlay) {
          setFallbackUsed(true);
          setEngineNote(data.note || (es ? 'IA no disponible, usando overlay exacto' : 'AI unavailable, using exact overlay'));
          const blob = await renderOverlayToBlob({
            logoUrl: logo.preview,
            garmentUrl: garment.preview,
            garmentType,
            placement,
            applicationStyle,
            controls,
          });
          setResultUrl(URL.createObjectURL(blob));
        } else {
          setResultUrl(data.imageUrl);
          setEngineNote(es ? 'Generado con IA integrada' : 'Generated with AI integration');
        }
        setStep('result');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setStep('configure');
    } finally {
      setGenerating(false);
    }
  }, [logo, garment, garmentType, placement, applicationStyle, mode, controls, es]);

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `mockup-${garmentType}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl, garmentType]);

  const handleReset = useCallback(() => {
    if (logo) URL.revokeObjectURL(logo.preview);
    if (garment) URL.revokeObjectURL(garment.preview);
    if (resultUrl && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
    setLogo(null);
    setGarment(null);
    setResultUrl(null);
    setLivePreview(null);
    setStep('upload');
  }, [logo, garment, resultUrl]);

  const canProceedFromUpload = !!logo && !!garment;
  const currentPlacements = useMemo(() => GARMENT_PRESETS[garmentType].placements, [garmentType]);

  // Ensure the selected placement is valid for the current garment
  useEffect(() => {
    const valid = currentPlacements.find((p) => p.zone === placement);
    if (!valid) setPlacement(currentPlacements[0].zone);
  }, [garmentType, currentPlacements, placement]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="w-full min-h-screen bg-surface-2">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-10 py-6">
        <StepHeader step={step} locale={locale} onReset={handleReset} />

        {step === 'upload' && (
          <UploadStep
            locale={locale}
            logo={logo}
            garment={garment}
            onLogoClick={() => logoInputRef.current?.click()}
            onGarmentClick={() => garmentInputRef.current?.click()}
            onLogoRemove={() => {
              if (logo) URL.revokeObjectURL(logo.preview);
              setLogo(null);
            }}
            onGarmentRemove={() => {
              if (garment) URL.revokeObjectURL(garment.preview);
              setGarment(null);
            }}
            onNext={() => setStep('configure')}
            canProceed={canProceedFromUpload}
          />
        )}

        {step === 'configure' && logo && garment && (
          <ConfigureStep
            locale={locale}
            logo={logo}
            garment={garment}
            livePreview={livePreview}
            garmentType={garmentType}
            setGarmentType={setGarmentType}
            placement={placement}
            setPlacement={setPlacement}
            applicationStyle={applicationStyle}
            setApplicationStyle={setApplicationStyle}
            mode={mode}
            setMode={setMode}
            controls={controls}
            setControls={setControls}
            onBack={() => setStep('upload')}
            onGenerate={handleGenerate}
          />
        )}

        {step === 'generating' && <GeneratingStep locale={locale} mode={mode} />}

        {step === 'result' && resultUrl && (
          <ResultStep
            locale={locale}
            resultUrl={resultUrl}
            originalGarmentUrl={garment?.preview || null}
            engineNote={engineNote}
            fallbackUsed={fallbackUsed}
            onBack={() => setStep('configure')}
            onDownload={handleDownload}
            onReset={handleReset}
          />
        )}
      </div>

      <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'logo')} />
      <input ref={garmentInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, 'garment')} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP HEADER
// ═══════════════════════════════════════════════════════════════════

function StepHeader({ step, locale, onReset }: { step: Step; locale: 'en' | 'es'; onReset: () => void }) {
  const es = locale === 'es';
  const steps: Array<{ id: Step; label: string }> = [
    { id: 'upload', label: es ? 'Subir' : 'Upload' },
    { id: 'configure', label: es ? 'Configurar' : 'Configure' },
    { id: 'generating', label: es ? 'Generar' : 'Generate' },
    { id: 'result', label: es ? 'Resultado' : 'Result' },
  ];
  const currentIdx = steps.findIndex((s) => s.id === step);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-2">
            <Sparkles className="h-3 w-3" />
            {es ? 'Módulo AI' : 'AI Module'}
          </div>
          <h1 className="font-display text-[26px] lg:text-[32px] leading-tight">
            {es ? (
              <>AI <span className="text-gold">Mockup</span></>
            ) : (
              <>AI <span className="text-gold">Mockup</span></>
            )}
          </h1>
          <p className="text-[12px] text-fg-muted mt-1">
            {es
              ? 'Aplica tu logo a prendas con profundidad y textura realistas'
              : 'Apply your logo to garments with realistic depth and texture'}
          </p>
        </div>
        {step !== 'upload' && (
          <button
            onClick={onReset}
            className="h-9 px-3 rounded-lg border border-border bg-surface-2 text-[11px] text-fg-muted hover:text-fg flex items-center gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            {es ? 'Nuevo' : 'New'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border transition-colors shrink-0',
                  i < currentIdx
                    ? 'bg-gold text-black border-gold'
                    : i === currentIdx
                    ? 'bg-gold/15 text-gold border-gold/40'
                    : 'bg-surface border-border text-fg-subtle',
                )}
              >
                {i < currentIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium truncate',
                  i === currentIdx ? 'text-fg' : 'text-fg-subtle',
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-px flex-1 mx-2', i < currentIdx ? 'bg-gold/60' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: UPLOAD
// ═══════════════════════════════════════════════════════════════════

function UploadStep({
  locale, logo, garment,
  onLogoClick, onGarmentClick,
  onLogoRemove, onGarmentRemove,
  onNext, canProceed,
}: {
  locale: 'en' | 'es';
  logo: UploadedFile | null;
  garment: UploadedFile | null;
  onLogoClick: () => void;
  onGarmentClick: () => void;
  onLogoRemove: () => void;
  onGarmentRemove: () => void;
  onNext: () => void;
  canProceed: boolean;
}) {
  const es = locale === 'es';
  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UploadZone
          label={es ? 'Logo / Diseño' : 'Logo / Design'}
          description={es ? 'PNG transparente recomendado' : 'Transparent PNG recommended'}
          icon={<PaletteIcon className="h-6 w-6 text-gold" />}
          file={logo}
          onClick={onLogoClick}
          onRemove={onLogoRemove}
        />
        <UploadZone
          label={es ? 'Prenda / Producto' : 'Garment / Product'}
          description={es ? 'Foto frontal sobre fondo neutro' : 'Front-facing shot, neutral background'}
          icon={<Shirt className="h-6 w-6 text-gold" />}
          file={garment}
          onClick={onGarmentClick}
          onRemove={onGarmentRemove}
        />
      </div>

      <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-gold mt-0.5 shrink-0" />
        <div className="text-[11px] text-fg-muted leading-relaxed">
          <span className="text-gold font-medium">{es ? 'Consejo: ' : 'Tip: '}</span>
          {es
            ? 'Tu logo se preservará exacto. El sistema lo aplica con técnicas realistas de impresión, bordado, parche o vinilo.'
            : 'Your logo is preserved exactly. The system applies it with realistic print, embroidery, patch or vinyl techniques.'}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full h-12 rounded-xl gold-grad text-bg text-[14px] font-semibold hover:brightness-110 disabled:opacity-40 transition flex items-center justify-center gap-2"
      >
        {es ? 'Continuar' : 'Continue'}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function UploadZone({
  label, description, icon, file, onClick, onRemove,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  file: UploadedFile | null;
  onClick: () => void;
  onRemove: () => void;
}) {
  if (file) {
    return (
      <div className="relative rounded-xl border-2 border-gold/40 bg-surface p-4 group">
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <X className="h-3.5 w-3.5 text-white" />
        </button>
        <div className="aspect-[4/5] rounded-lg overflow-hidden bg-surface-2 mb-3 flex items-center justify-center">
          <img src={file.preview} alt="" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <Check className="h-3.5 w-3.5 text-gold shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-fg truncate">{label}</div>
            <div className="text-[9px] text-fg-subtle">{file.width} × {file.height}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="rounded-xl border-2 border-dashed border-border hover:border-gold/40 bg-surface hover:bg-gold/5 p-4 transition-colors group"
    >
      <div className="aspect-[4/5] rounded-lg bg-surface-2 flex flex-col items-center justify-center gap-3 mb-3 group-hover:bg-gold/5 transition-colors">
        {icon}
        <Upload className="h-5 w-5 text-fg-subtle group-hover:text-gold transition-colors" />
      </div>
      <div className="text-[12px] font-medium text-fg">{label}</div>
      <div className="text-[10px] text-fg-subtle mt-0.5">{description}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2: CONFIGURE
// ═══════════════════════════════════════════════════════════════════

function ConfigureStep({
  locale, logo, garment, livePreview,
  garmentType, setGarmentType,
  placement, setPlacement,
  applicationStyle, setApplicationStyle,
  mode, setMode,
  controls, setControls,
  onBack, onGenerate,
}: {
  locale: 'en' | 'es';
  logo: UploadedFile;
  garment: UploadedFile;
  livePreview: string | null;
  garmentType: GarmentType;
  setGarmentType: (v: GarmentType) => void;
  placement: PlacementZone;
  setPlacement: (v: PlacementZone) => void;
  applicationStyle: ApplicationStyle;
  setApplicationStyle: (v: ApplicationStyle) => void;
  mode: MockupMode;
  setMode: (v: MockupMode) => void;
  controls: MockupControls;
  setControls: (v: MockupControls) => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const es = locale === 'es';
  const placements = GARMENT_PRESETS[garmentType].placements;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
      {/* PREVIEW */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
            {es ? 'Vista previa en vivo' : 'Live preview'}
          </div>
          <div className="text-[9px] text-gold">
            {APPLICATION_STYLES[applicationStyle].name}
          </div>
        </div>
        <div className="aspect-[4/5] bg-surface-2 flex items-center justify-center p-4">
          {livePreview ? (
            <img src={livePreview} alt="preview" className="max-w-full max-h-full object-contain rounded" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-fg-subtle">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-[11px]">{es ? 'Calculando vista previa...' : 'Computing preview...'}</span>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="space-y-3">
        {/* Garment type */}
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
            {es ? 'Tipo de prenda' : 'Garment type'}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {ALL_GARMENT_TYPES.map((g) => (
              <button
                key={g}
                onClick={() => setGarmentType(g)}
                className={cn(
                  'h-12 rounded-lg text-[9px] font-medium border transition-all flex flex-col items-center justify-center gap-0.5',
                  garmentType === g
                    ? 'bg-gold/15 text-gold border-gold/40'
                    : 'bg-surface-2 text-fg-muted border-border hover:border-gold/20',
                )}
                title={GARMENT_PRESETS[g].name}
              >
                <GarmentIcon type={g} />
                <span className="truncate max-w-full px-1">
                  {g === 'tshirt_front' ? 'Tee' : g === 'tshirt_back' ? 'Back' : g === 'hoodie' ? 'Hoodie' : g === 'cap' ? 'Cap' : 'Tote'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Placement */}
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
            {es ? 'Ubicación' : 'Placement'}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {placements.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlacement(p.zone)}
                className={cn(
                  'h-8 rounded-md text-[10px] font-medium border transition-all',
                  placement === p.zone
                    ? 'bg-gold/15 text-gold border-gold/40'
                    : 'bg-surface-2 text-fg-muted border-border hover:border-gold/20',
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Application style */}
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
            {es ? 'Estilo de aplicación' : 'Application style'}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_APPLICATION_STYLES.map((s) => {
              const spec = APPLICATION_STYLES[s];
              return (
                <button
                  key={s}
                  onClick={() => setApplicationStyle(s)}
                  className={cn(
                    'p-2.5 rounded-lg text-left border transition-all',
                    applicationStyle === s
                      ? 'bg-gold/10 border-gold/40'
                      : 'bg-surface-2 border-border hover:border-gold/20',
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: spec.tagColor }} />
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        applicationStyle === s ? 'text-gold' : 'text-fg',
                      )}
                    >
                      {spec.name}
                    </span>
                  </div>
                  <div className="text-[9px] text-fg-subtle line-clamp-2">{spec.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode */}
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
            {es ? 'Modo' : 'Mode'}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setMode('exact_overlay')}
              className={cn(
                'p-2.5 rounded-lg text-left border transition-all',
                mode === 'exact_overlay'
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-surface-2 border-border hover:border-gold/20',
              )}
            >
              <div className={cn('text-[11px] font-medium mb-0.5', mode === 'exact_overlay' ? 'text-gold' : 'text-fg')}>
                {es ? 'Overlay exacto' : 'Exact overlay'}
              </div>
              <div className="text-[9px] text-fg-subtle">{es ? 'Logo preservado 100%' : '100% logo preservation'}</div>
            </button>
            <button
              onClick={() => setMode('ai_integrated')}
              className={cn(
                'p-2.5 rounded-lg text-left border transition-all',
                mode === 'ai_integrated'
                  ? 'bg-gold/10 border-gold/40'
                  : 'bg-surface-2 border-border hover:border-gold/20',
              )}
            >
              <div className={cn('text-[11px] font-medium mb-0.5 flex items-center gap-1', mode === 'ai_integrated' ? 'text-gold' : 'text-fg')}>
                {es ? 'IA integrada' : 'AI integrated'}
                <Sparkles className="h-2.5 w-2.5" />
              </div>
              <div className="text-[9px] text-fg-subtle">{es ? 'Más realista, premium' : 'More realistic, premium'}</div>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
            {es ? 'Controles' : 'Controls'}
          </div>
          <ControlSlider
            label={es ? 'Profundidad' : 'Depth'}
            value={controls.depth}
            onChange={(v) => setControls({ ...controls, depth: v })}
          />
          <ControlSlider
            label={es ? 'Integración' : 'Integration'}
            value={controls.integration}
            onChange={(v) => setControls({ ...controls, integration: v })}
          />
          <ControlSlider
            label={es ? 'Textura' : 'Texture'}
            value={controls.texture}
            onChange={(v) => setControls({ ...controls, texture: v })}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onBack}
            className="h-11 px-4 rounded-xl border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {es ? 'Atrás' : 'Back'}
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 h-11 rounded-xl gold-grad text-bg text-[13px] font-semibold hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {es ? 'Generar mockup' : 'Generate mockup'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ControlSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-fg-muted font-medium">{label}</span>
        <span className="text-[10px] text-fg font-mono tabular-nums">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full accent-gold"
      />
    </div>
  );
}

function GarmentIcon({ type }: { type: GarmentType }) {
  return <Shirt className="h-4 w-4" />;
}

// ═══════════════════════════════════════════════════════════════════
// STEP 3: GENERATING
// ═══════════════════════════════════════════════════════════════════

function GeneratingStep({ locale, mode }: { locale: 'en' | 'es'; mode: MockupMode }) {
  const es = locale === 'es';
  const [phase, setPhase] = useState(0);
  const phases = mode === 'ai_integrated'
    ? (es
        ? ['Analizando prenda...', 'Preparando máscara...', 'Aplicando IA integrada...', 'Validando preservación...', 'Finalizando...']
        : ['Analyzing garment...', 'Preparing mask...', 'Applying AI integration...', 'Validating preservation...', 'Finalizing...'])
    : (es
        ? ['Analizando prenda...', 'Adaptando al tejido...', 'Aplicando textura...', 'Finalizando...']
        : ['Analyzing garment...', 'Adapting to fabric...', 'Applying texture...', 'Finalizing...']);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => Math.min(p + 1, phases.length - 1));
    }, 900);
    return () => clearInterval(id);
  }, [phases.length]);

  return (
    <div className="max-w-[480px] mx-auto py-16 text-center space-y-6">
      <div className="relative inline-flex">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
          <Loader2 className="h-7 w-7 text-gold animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-gold/20 animate-ping" />
      </div>
      <div>
        <h2 className="font-display text-[22px] mb-2">
          {es ? 'Creando tu mockup' : 'Creating your mockup'}
        </h2>
        <p className="text-[12px] text-fg-muted">
          {mode === 'ai_integrated'
            ? (es ? 'Esto puede tomar 30-60 segundos' : 'This may take 30-60 seconds')
            : (es ? 'Solo tomará un momento' : 'Only a moment')}
        </p>
      </div>
      <div className="space-y-1.5 text-left max-w-[320px] mx-auto">
        {phases.map((p, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 text-[12px] transition-opacity',
              i < phase ? 'text-fg-muted opacity-60' : i === phase ? 'text-fg opacity-100' : 'text-fg-subtle opacity-30',
            )}
          >
            {i < phase ? (
              <Check className="h-3.5 w-3.5 text-gold" />
            ) : i === phase ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-border" />
            )}
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STEP 4: RESULT
// ═══════════════════════════════════════════════════════════════════

function ResultStep({
  locale, resultUrl, originalGarmentUrl,
  engineNote, fallbackUsed,
  onBack, onDownload, onReset,
}: {
  locale: 'en' | 'es';
  resultUrl: string;
  originalGarmentUrl: string | null;
  engineNote: string | null;
  fallbackUsed: boolean;
  onBack: () => void;
  onDownload: () => void;
  onReset: () => void;
}) {
  const es = locale === 'es';
  const [sliderValue, setSliderValue] = useState(100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 max-w-[1200px] mx-auto">
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
            {es ? 'Antes / Después' : 'Before / After'}
          </div>
          <div className="text-[9px] text-fg-subtle tabular-nums">{sliderValue}%</div>
        </div>

        <div className="relative aspect-[4/5] bg-surface-2 overflow-hidden">
          {originalGarmentUrl && (
            <img src={originalGarmentUrl} alt="original" className="absolute inset-0 w-full h-full object-contain" />
          )}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderValue}% 0 0)` }}
          >
            <img src={resultUrl} alt="mockup" className="w-full h-full object-contain" />
          </div>
          {originalGarmentUrl && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gold pointer-events-none"
              style={{ left: `${sliderValue}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gold border-2 border-black flex items-center justify-center">
                <div className="w-3 h-0.5 bg-black" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full accent-gold"
          />
        </div>
      </div>

      <div className="space-y-3">
        {engineNote && (
          <div
            className={cn(
              'rounded-xl p-3 text-[11px] flex items-start gap-2',
              fallbackUsed
                ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                : 'border border-gold/30 bg-gold/10 text-gold',
            )}
          >
            {fallbackUsed ? (
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>{engineNote}</span>
          </div>
        )}

        <button
          onClick={onDownload}
          className="w-full h-12 rounded-xl bg-gold text-black text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-gold/20"
        >
          <Download className="h-4 w-4" />
          {es ? 'Descargar PNG' : 'Download PNG'}
        </button>

        <button
          onClick={onBack}
          className="w-full h-11 rounded-xl border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-1.5"
        >
          <Layers className="h-3.5 w-3.5" />
          {es ? 'Ajustar configuración' : 'Adjust settings'}
        </button>

        <button
          onClick={onReset}
          className="w-full h-11 rounded-xl border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {es ? 'Nuevo mockup' : 'New mockup'}
        </button>
      </div>
    </div>
  );
}
