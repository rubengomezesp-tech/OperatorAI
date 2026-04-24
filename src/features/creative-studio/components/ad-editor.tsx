'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Download,
  Type,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Layers,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  LayoutGrid,
  Upload,
} from 'lucide-react';
import { proxiedImageUrl } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
import type {
  Variant,
  EditorLayer,
  TextLayerData,
  ImageLayerData,
  ShapeLayerData,
  LogoLayerData,
} from '../types';
import { AD_TEMPLATES, getDefaultLayers } from '../data/ad-templates';

const FONT_FAMILIES = {
  inter: 'var(--font-inter), -apple-system, system-ui, sans-serif',
  system: 'system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", Courier, monospace',
  display: 'var(--font-inter), -apple-system, sans-serif',
} as const;

const SNAP_THRESHOLD = 0.02;
const SAFE_MARGIN = 0.05;

interface Props {
  imageUrl: string;
  variant: Variant;
  locale: 'en' | 'es';
  onBack?: () => void;
}

export function AdEditor({ imageUrl, variant, locale, onBack }: Props) {
  const es = locale === 'es';
  const aspect = useMemo(() => {
    return variant.aspectRatio === '1:1'
      ? '1 / 1'
      : variant.aspectRatio === '4:5'
      ? '4 / 5'
      : '9 / 16';
  }, [variant.aspectRatio]);

  const [layers, setLayers] = useState<EditorLayer[]>(() =>
    getDefaultLayers(variant),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeGuides, setActiveGuides] = useState({
    cx: false,
    cy: false,
    leftMargin: false,
    rightMargin: false,
    topMargin: false,
    bottomMargin: false,
  });

  const dragRef = useRef<{
    layerId: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const originalOverflow = useRef<string>('');

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId) || null,
    [layers, selectedId],
  );
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );

  const updateLayer = useCallback(
    (id: string, patch: Partial<EditorLayer>) => {
      setLayers((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...patch } as EditorLayer) : l)),
      );
    },
    [],
  );

  const addLayer = useCallback((layer: EditorLayer) => {
    setLayers((prev) => {
      const maxZ = Math.max(0, ...prev.map((l) => l.zIndex));
      return [...prev, { ...layer, zIndex: maxZ + 1 }];
    });
    setSelectedId(layer.id);
  }, []);

  const deleteLayer = useCallback(
    (id: string) => {
      setLayers((prev) => prev.filter((l) => l.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [selectedId],
  );

  const duplicateLayer = useCallback((id: string) => {
    setLayers((prev) => {
      const src = prev.find((l) => l.id === id);
      if (!src) return prev;
      const maxZ = Math.max(0, ...prev.map((l) => l.zIndex));
      const copy: EditorLayer = {
        ...src,
        id: `${src.type}_${Date.now().toString(36)}`,
        x: Math.min(0.95, src.x + 0.04),
        y: Math.min(0.95, src.y + 0.04),
        zIndex: maxZ + 1,
        name: src.name ? `${src.name} copy` : undefined,
      };
      setSelectedId(copy.id);
      return [...prev, copy];
    });
  }, []);

  const moveLayerZ = useCallback((id: string, direction: 'up' | 'down') => {
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      return prev.map((l) => {
        if (l.id === a.id) return { ...l, zIndex: b.zIndex };
        if (l.id === b.id) return { ...l, zIndex: a.zIndex };
        return l;
      });
    });
  }, []);

  const addText = useCallback(() => {
    const newLayer: TextLayerData = {
      id: `text_${Date.now().toString(36)}`,
      type: 'text',
      text: es ? 'Nuevo texto' : 'New text',
      color: '#ffffff',
      fontSizePercent: 5,
      fontFamily: 'inter',
      fontWeight: 700,
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      shadowEnabled: true,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.5)',
      x: 0.5,
      y: 0.5,
      width: 0.8,
      height: 0.1,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      visible: true,
      name: 'Text',
    };
    addLayer(newLayer);
  }, [es, addLayer]);

  const addShape = useCallback(
    (shape: 'rect' | 'circle') => {
      const newLayer: ShapeLayerData = {
        id: `shape_${Date.now().toString(36)}`,
        type: 'shape',
        shape,
        fill: '#ffffff',
        strokeWidth: 0,
        strokeColor: '#000000',
        borderRadius: shape === 'circle' ? 999 : 0,
        x: 0.5,
        y: 0.5,
        width: 0.2,
        height: 0.2,
        rotation: 0,
        opacity: 0.9,
        zIndex: 0,
        visible: true,
        name: shape === 'rect' ? 'Rectangle' : 'Circle',
      };
      addLayer(newLayer);
    },
    [addLayer],
  );

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, kind: 'image' | 'logo') => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert(es ? 'Archivo no válido' : 'Invalid file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (kind === 'logo') {
          addLayer({
            id: `logo_${Date.now().toString(36)}`,
            type: 'logo',
            src: dataUrl,
            x: 0.1,
            y: 0.08,
            width: 0.15,
            height: 0.08,
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            visible: true,
            name: 'Logo',
          });
        } else {
          addLayer({
            id: `img_${Date.now().toString(36)}`,
            type: 'image',
            src: dataUrl,
            fit: 'contain',
            x: 0.5,
            y: 0.5,
            width: 0.4,
            height: 0.4,
            rotation: 0,
            opacity: 1,
            zIndex: 0,
            visible: true,
            name: 'Image',
          });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [es, addLayer],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = AD_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;
      setLayers(tpl.build(variant));
      setCurrentTemplateId(templateId);
      setSelectedId(null);
    },
    [variant],
  );

  const handleLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const layer = layers.find((l) => l.id === layerId);
      if (!layer || layer.locked) return;
      setSelectedId(layerId);

      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const pointerX = (e.clientX - rect.left) / rect.width;
      const pointerY = (e.clientY - rect.top) / rect.height;

      dragRef.current = {
        layerId,
        pointerId: e.pointerId,
        offsetX: pointerX - layer.x,
        offsetY: pointerY - layer.y,
      };

      originalOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [layers],
  );

  const handleStagePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();
      e.stopPropagation();

      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const pointerX = (e.clientX - rect.left) / rect.width;
      const pointerY = (e.clientY - rect.top) / rect.height;

      let newX = Math.max(0, Math.min(1, pointerX - drag.offsetX));
      let newY = Math.max(0, Math.min(1, pointerY - drag.offsetY));

      const guides = {
        cx: false,
        cy: false,
        leftMargin: false,
        rightMargin: false,
        topMargin: false,
        bottomMargin: false,
      };

      if (Math.abs(newX - 0.5) < SNAP_THRESHOLD) {
        newX = 0.5;
        guides.cx = true;
      }
      if (Math.abs(newY - 0.5) < SNAP_THRESHOLD) {
        newY = 0.5;
        guides.cy = true;
      }
      if (Math.abs(newX - SAFE_MARGIN) < SNAP_THRESHOLD) {
        newX = SAFE_MARGIN;
        guides.leftMargin = true;
      }
      if (Math.abs(newX - (1 - SAFE_MARGIN)) < SNAP_THRESHOLD) {
        newX = 1 - SAFE_MARGIN;
        guides.rightMargin = true;
      }
      if (Math.abs(newY - SAFE_MARGIN) < SNAP_THRESHOLD) {
        newY = SAFE_MARGIN;
        guides.topMargin = true;
      }
      if (Math.abs(newY - (1 - SAFE_MARGIN)) < SNAP_THRESHOLD) {
        newY = 1 - SAFE_MARGIN;
        guides.bottomMargin = true;
      }

      setActiveGuides(guides);
      updateLayer(drag.layerId, { x: newX, y: newY });
    },
    [updateLayer],
  );

  const handleStagePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag) {
      e.preventDefault();
      e.stopPropagation();
      document.body.style.overflow = originalOverflow.current;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(drag.pointerId);
      } catch {
        // ignore
      }
      dragRef.current = null;
      setActiveGuides({
        cx: false,
        cy: false,
        leftMargin: false,
        rightMargin: false,
        topMargin: false,
        bottomMargin: false,
      });
    }
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const proxied = proxiedImageUrl(imageUrl) || imageUrl;
      const canvas = await renderToCanvas(
        proxied,
        sortedLayers,
        variant.aspectRatio,
      );
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error('toBlob null'))),
          'image/png',
          0.95,
        ),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${variant.layout}-final.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[ad-editor] export failed:', err);
      alert(es ? 'Error al exportar' : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [imageUrl, sortedLayers, variant, es]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = originalOverflow.current;
    };
  }, []);

  return (
    <div className="w-full h-full overflow-hidden overscroll-contain bg-surface-2">
      <div className="flex flex-col lg:grid lg:grid-cols-[260px_1fr_300px] h-full gap-3 p-3">
        {/* LEFT SIDEBAR */}
        <div className="hidden lg:flex flex-col gap-3 overflow-y-auto pr-1">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] text-fg-muted hover:text-fg"
            >
              <ArrowLeft className="h-3 w-3" />
              {es ? 'Volver' : 'Back'}
            </button>
          )}

          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
              {es ? 'Añadir' : 'Add'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ToolButton icon={<Type className="h-3.5 w-3.5" />} onClick={addText}>
                {es ? 'Texto' : 'Text'}
              </ToolButton>
              <ToolButton
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {es ? 'Imagen' : 'Image'}
              </ToolButton>
              <ToolButton
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => logoInputRef.current?.click()}
              >
                Logo
              </ToolButton>
              <ToolButton
                icon={<Square className="h-3.5 w-3.5" />}
                onClick={() => addShape('rect')}
              >
                {es ? 'Caja' : 'Rect'}
              </ToolButton>
              <ToolButton
                icon={<CircleIcon className="h-3.5 w-3.5" />}
                onClick={() => addShape('circle')}
              >
                {es ? 'Círculo' : 'Circle'}
              </ToolButton>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium flex items-center gap-1.5">
              <LayoutGrid className="h-3 w-3" />
              {es ? 'Plantillas' : 'Templates'}
            </div>
            <div className="space-y-1 max-h-[240px] overflow-y-auto">
              {AD_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl.id)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-md text-[10px] border',
                    currentTemplateId === tpl.id
                      ? 'bg-gold/15 border-gold/30 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted hover:text-fg hover:border-gold/20',
                  )}
                >
                  <div className="font-medium">{tpl.name}</div>
                  <div className="text-[9px] opacity-70 mt-0.5 line-clamp-1">
                    {tpl.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium flex items-center gap-1.5">
              <Layers className="h-3 w-3" />
              {es ? 'Capas' : 'Layers'}
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {[...layers]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] border',
                      selectedId === l.id
                        ? 'bg-gold/15 border-gold/30 text-gold'
                        : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                    )}
                  >
                    <button
                      onClick={() => setSelectedId(l.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <LayerTypeIcon type={l.type} />
                      <span className="flex-1 truncate">
                        {l.name || describeLayer(l)}
                      </span>
                    </button>
                    <button
                      onClick={() =>
                        updateLayer(l.id, { visible: !l.visible } as any)
                      }
                      className="opacity-60 hover:opacity-100"
                    >
                      {l.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* CENTER STAGE */}
        <div className="flex flex-col items-center justify-start overflow-hidden flex-1">
          <div className="lg:hidden flex items-center justify-between w-full mb-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-[11px] text-fg-muted"
              >
                <ArrowLeft className="h-3 w-3" />
                {es ? 'Volver' : 'Back'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-center w-full flex-1 overflow-hidden">
            <div
              ref={stageRef}
              className="relative bg-black rounded-xl overflow-hidden border border-border shadow-2xl select-none"
              style={{
                aspectRatio: aspect,
                width: '100%',
                maxWidth: 520,
                touchAction: 'none',
              }}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerLeave={handleStagePointerUp}
              onClick={(e) => {
                if (e.target === stageRef.current) setSelectedId(null);
              }}
            >
              <img
                src={proxiedImageUrl(imageUrl) || imageUrl}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {sortedLayers.map((l) =>
                l.visible
                  ? renderLayer(l, {
                      selected: selectedId === l.id,
                      onPointerDown: (e) => handleLayerPointerDown(e, l.id),
                    })
                  : null,
              )}

              <GuideOverlay guides={activeGuides} />
            </div>
          </div>

          {/* Mobile toolbar */}
          <div className="lg:hidden flex items-center justify-center gap-2 mt-3 w-full overflow-x-auto pb-1">
            <MobileToolButton icon={<Type className="h-4 w-4" />} onClick={addText} />
            <MobileToolButton
              icon={<ImageIcon className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            />
            <MobileToolButton
              icon={<Upload className="h-4 w-4" />}
              onClick={() => logoInputRef.current?.click()}
            />
            <MobileToolButton
              icon={<Square className="h-4 w-4" />}
              onClick={() => addShape('rect')}
            />
            <MobileToolButton
              icon={<CircleIcon className="h-4 w-4" />}
              onClick={() => addShape('circle')}
            />
          </div>
        </div>

        {/* RIGHT PROPERTIES */}
        <div className="overflow-y-auto overscroll-contain space-y-3">
          {selectedLayer ? (
            <LayerProperties
              layer={selectedLayer}
              onChange={(patch) => updateLayer(selectedLayer.id, patch)}
              onDuplicate={() => duplicateLayer(selectedLayer.id)}
              onDelete={() => deleteLayer(selectedLayer.id)}
              onBringForward={() => moveLayerZ(selectedLayer.id, 'up')}
              onSendBackward={() => moveLayerZ(selectedLayer.id, 'down')}
              locale={locale}
            />
          ) : (
            <div className="rounded-xl border border-border bg-surface p-4 text-center">
              <div className="text-[11px] text-fg-subtle">
                {es ? 'Selecciona una capa' : 'Select a layer'}
              </div>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full h-11 rounded-xl bg-gold text-black text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exporting
              ? es
                ? 'Exportando...'
                : 'Exporting...'
              : es
              ? 'Descargar PNG'
              : 'Download PNG'}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileUpload(e, 'logo')}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════

function ToolButton({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="h-10 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-fg-muted hover:text-fg text-[10px] font-medium flex flex-col items-center justify-center gap-0.5"
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function MobileToolButton({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-10 w-10 shrink-0 rounded-md bg-surface border border-border text-fg flex items-center justify-center"
    >
      {icon}
    </button>
  );
}

function LayerTypeIcon({ type }: { type: EditorLayer['type'] }) {
  if (type === 'text') return <Type className="h-3 w-3" />;
  if (type === 'image' || type === 'logo') return <ImageIcon className="h-3 w-3" />;
  return <Square className="h-3 w-3" />;
}

function describeLayer(l: EditorLayer): string {
  if (l.type === 'text') return (l as TextLayerData).text.slice(0, 24);
  if (l.type === 'image') return 'Image';
  if (l.type === 'logo') return 'Logo';
  return (l as ShapeLayerData).shape === 'circle' ? 'Circle' : 'Rectangle';
}

function GuideOverlay({
  guides,
}: {
  guides: {
    cx: boolean;
    cy: boolean;
    leftMargin: boolean;
    rightMargin: boolean;
    topMargin: boolean;
    bottomMargin: boolean;
  };
}) {
  return (
    <>
      {guides.cx && (
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-pink-400 pointer-events-none z-50" />
      )}
      {guides.cy && (
        <div className="absolute left-0 right-0 top-1/2 h-px bg-pink-400 pointer-events-none z-50" />
      )}
      {guides.leftMargin && (
        <div className="absolute top-0 bottom-0 left-[5%] w-px bg-cyan-400/60 pointer-events-none z-50" />
      )}
      {guides.rightMargin && (
        <div className="absolute top-0 bottom-0 right-[5%] w-px bg-cyan-400/60 pointer-events-none z-50" />
      )}
      {guides.topMargin && (
        <div className="absolute left-0 right-0 top-[5%] h-px bg-cyan-400/60 pointer-events-none z-50" />
      )}
      {guides.bottomMargin && (
        <div className="absolute left-0 right-0 bottom-[5%] h-px bg-cyan-400/60 pointer-events-none z-50" />
      )}
    </>
  );
}

function renderLayer(
  l: EditorLayer,
  opts: {
    selected: boolean;
    onPointerDown: (e: React.PointerEvent) => void;
  },
) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${l.x * 100}%`,
    top: `${l.y * 100}%`,
    width: `${l.width * 100}%`,
    opacity: l.opacity,
    transform: `translate(-50%, -50%) rotate(${l.rotation}deg)`,
    zIndex: l.zIndex,
    touchAction: 'none',
  };

  const outlineClass = opts.selected
    ? 'outline outline-1 outline-gold'
    : 'hover:outline hover:outline-1 hover:outline-white/40';

  if (l.type === 'text') {
    const t = l;
    return (
      <div
        key={l.id}
        onPointerDown={opts.onPointerDown}
        className={cn('cursor-move select-none', outlineClass)}
        style={{
          ...baseStyle,
          fontFamily: FONT_FAMILIES[t.fontFamily],
          fontSize: `${t.fontSizePercent}cqh`,
          fontWeight: t.fontWeight,
          color: t.color,
          textAlign: t.align,
          letterSpacing: `${t.letterSpacing}em`,
          lineHeight: t.lineHeight,
          textShadow: t.shadowEnabled
            ? `0 2px ${t.shadowBlur}px ${t.shadowColor}`
            : 'none',
          containerType: 'size',
        }}
      >
        {t.isButton ? (
          <span
            style={{
              display: 'inline-block',
              background: t.buttonBg || '#ffffff',
              color: t.buttonTextColor || '#000',
              padding: `${(t.buttonPadding || 1) * 0.4}em ${(t.buttonPadding || 1) * 1.2}em`,
              borderRadius: `${t.buttonRadius}px`,
              fontWeight: t.fontWeight,
            }}
          >
            {t.text}
          </span>
        ) : (
          t.text
        )}
      </div>
    );
  }

  if (l.type === 'image' || l.type === 'logo') {
    const i = l as ImageLayerData | LogoLayerData;
    return (
      <div
        key={l.id}
        onPointerDown={opts.onPointerDown}
        className={cn('cursor-move', outlineClass)}
        style={{
          ...baseStyle,
          height: `${l.height * 100}%`,
        }}
      >
        <img
          src={i.src}
          alt=""
          draggable={false}
          crossOrigin="anonymous"
          className="block w-full h-full"
          style={{
            objectFit: l.type === 'image' ? (i as ImageLayerData).fit : 'contain',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  if (l.type === 'shape') {
    const s = l;
    return (
      <div
        key={l.id}
        onPointerDown={opts.onPointerDown}
        className={cn('cursor-move', outlineClass)}
        style={{
          ...baseStyle,
          height: `${l.height * 100}%`,
          background: s.fill,
          borderRadius: s.shape === 'circle' ? '50%' : `${s.borderRadius}px`,
          border:
            s.strokeWidth > 0
              ? `${s.strokeWidth}px solid ${s.strokeColor}`
              : 'none',
        }}
      />
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════════

function LayerProperties({
  layer,
  onChange,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  locale,
}: {
  layer: EditorLayer;
  onChange: (patch: Partial<EditorLayer>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
          {layer.name || (es ? 'Capa' : 'Layer')}
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
            {es ? 'Ancho' : 'Width'}: {Math.round(layer.width * 100)}%
          </label>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={layer.width}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
            {es ? 'Opacidad' : 'Opacity'}: {Math.round(layer.opacity * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={layer.opacity}
            onChange={(e) => onChange({ opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle uppercase tracking-wide block mb-1">
            {es ? 'Rotación' : 'Rotation'}: {layer.rotation}°
          </label>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={layer.rotation}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      {layer.type === 'text' && (
        <TextProperties
          layer={layer}
          onChange={onChange as any}
          locale={locale}
        />
      )}
      {layer.type === 'shape' && (
        <ShapeProperties
          layer={layer}
          onChange={onChange as any}
          locale={locale}
        />
      )}
      {layer.type === 'image' && (
        <ImageProperties
          layer={layer}
          onChange={onChange as any}
          locale={locale}
        />
      )}

      <div className="rounded-xl border border-border bg-surface p-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBringForward}
            className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 flex items-center justify-center gap-1"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button
            onClick={onSendBackward}
            className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 flex items-center justify-center gap-1"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          <button
            onClick={onDuplicate}
            className="h-8 rounded-md bg-surface-2 border border-border text-fg-muted hover:border-gold/40 flex items-center justify-center gap-1"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="h-8 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:border-red-500/60 flex items-center justify-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TextProperties({
  layer,
  onChange,
  locale,
}: {
  layer: TextLayerData;
  onChange: (patch: Partial<TextLayerData>) => void;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';
  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
          {es ? 'Contenido' : 'Content'}
        </div>
        <textarea
          value={layer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 rounded-md border border-border bg-surface-2 text-[11px] focus:outline-none focus:border-gold/40 resize-none"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
          {es ? 'Tipografía' : 'Typography'}
        </div>

        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(FONT_FAMILIES) as Array<keyof typeof FONT_FAMILIES>).map(
            (f) => (
              <button
                key={f}
                onClick={() => onChange({ fontFamily: f })}
                className={cn(
                  'h-7 rounded-md text-[10px] border capitalize',
                  layer.fontFamily === f
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : 'bg-surface-2 text-fg-muted border-border',
                )}
              >
                {f}
              </button>
            ),
          )}
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Tamaño' : 'Size'}: {layer.fontSizePercent.toFixed(1)}
          </label>
          <input
            type="range"
            min={1}
            max={18}
            step={0.5}
            value={layer.fontSizePercent}
            onChange={(e) =>
              onChange({ fontSizePercent: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Grosor' : 'Weight'}: {layer.fontWeight}
          </label>
          <input
            type="range"
            min={300}
            max={900}
            step={100}
            value={layer.fontWeight}
            onChange={(e) => onChange({ fontWeight: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Espacio' : 'Letter spacing'}:{' '}
            {(layer.letterSpacing * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min={-0.05}
            max={0.3}
            step={0.01}
            value={layer.letterSpacing}
            onChange={(e) =>
              onChange({ letterSpacing: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Altura línea' : 'Line height'}: {layer.lineHeight.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.8}
            max={2.5}
            step={0.05}
            value={layer.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Alineación' : 'Align'}
          </label>
          <div className="flex gap-1">
            {(
              [
                ['left', AlignLeft],
                ['center', AlignCenter],
                ['right', AlignRight],
              ] as const
            ).map(([val, Icon]) => (
              <button
                key={val}
                onClick={() => onChange({ align: val })}
                className={cn(
                  'flex-1 h-7 rounded-md border flex items-center justify-center',
                  layer.align === val
                    ? 'bg-gold/15 border-gold/30 text-gold'
                    : 'bg-surface-2 border-border text-fg-muted',
                )}
              >
                <Icon className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
          Color
        </div>
        <div className="flex gap-1">
          {['#ffffff', '#000000', '#c9a863', '#ff3b30', '#34c759'].map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className={cn(
                'h-6 w-6 rounded-md border-2',
                layer.color === c ? 'border-gold' : 'border-border',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <input
          type="color"
          value={layer.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-full h-8 rounded-md border border-border"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <label className="flex items-center gap-2 text-[10px] text-fg">
          <input
            type="checkbox"
            checked={!!layer.isButton}
            onChange={(e) => onChange({ isButton: e.target.checked })}
            className="w-3 h-3"
          />
          {es ? 'Botón CTA' : 'CTA Button'}
        </label>
        {layer.isButton && (
          <>
            <input
              type="color"
              value={layer.buttonBg || '#ffffff'}
              onChange={(e) => onChange({ buttonBg: e.target.value })}
              className="w-full h-7 rounded-md border border-border"
            />
            <div>
              <label className="text-[9px] text-fg-subtle block mb-1">
                {es ? 'Radio' : 'Radius'}: {layer.buttonRadius}
              </label>
              <input
                type="range"
                min={0}
                max={999}
                step={1}
                value={layer.buttonRadius || 0}
                onChange={(e) =>
                  onChange({ buttonRadius: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <label className="flex items-center gap-2 text-[10px] text-fg">
          <input
            type="checkbox"
            checked={layer.shadowEnabled}
            onChange={(e) => onChange({ shadowEnabled: e.target.checked })}
            className="w-3 h-3"
          />
          {es ? 'Sombra' : 'Shadow'}
        </label>
        {layer.shadowEnabled && (
          <div>
            <label className="text-[9px] text-fg-subtle block mb-1">
              {es ? 'Desenfoque' : 'Blur'}: {layer.shadowBlur}
            </label>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={layer.shadowBlur}
              onChange={(e) =>
                onChange({ shadowBlur: Number(e.target.value) })
              }
              className="w-full"
            />
          </div>
        )}
      </div>
    </>
  );
}

function ShapeProperties({
  layer,
  onChange,
  locale,
}: {
  layer: ShapeLayerData;
  onChange: (patch: Partial<ShapeLayerData>) => void;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';
  return (
    <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
        {es ? 'Forma' : 'Shape'}
      </div>

      <div>
        <label className="text-[9px] text-fg-subtle block mb-1">
          {es ? 'Alto' : 'Height'}: {Math.round(layer.height * 100)}%
        </label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={layer.height}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="text-[9px] text-fg-subtle block mb-1">
          {es ? 'Relleno' : 'Fill'}
        </label>
        <input
          type="color"
          value={layer.fill}
          onChange={(e) => onChange({ fill: e.target.value })}
          className="w-full h-8 rounded-md border border-border"
        />
      </div>

      {layer.shape === 'rect' && (
        <div>
          <label className="text-[9px] text-fg-subtle block mb-1">
            {es ? 'Radio' : 'Radius'}: {layer.borderRadius}
          </label>
          <input
            type="range"
            min={0}
            max={200}
            step={1}
            value={layer.borderRadius}
            onChange={(e) =>
              onChange({ borderRadius: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>
      )}

      <div>
        <label className="text-[9px] text-fg-subtle block mb-1">
          {es ? 'Borde' : 'Stroke'}: {layer.strokeWidth}px
        </label>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={layer.strokeWidth}
          onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
          className="w-full"
        />
        {layer.strokeWidth > 0 && (
          <input
            type="color"
            value={layer.strokeColor}
            onChange={(e) => onChange({ strokeColor: e.target.value })}
            className="w-full h-7 rounded-md border border-border mt-1"
          />
        )}
      </div>
    </div>
  );
}

function ImageProperties({
  layer,
  onChange,
  locale,
}: {
  layer: ImageLayerData;
  onChange: (patch: Partial<ImageLayerData>) => void;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';
  return (
    <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
        {es ? 'Imagen' : 'Image'}
      </div>
      <div>
        <label className="text-[9px] text-fg-subtle block mb-1">
          {es ? 'Alto' : 'Height'}: {Math.round(layer.height * 100)}%
        </label>
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={layer.height}
          onChange={(e) => onChange({ height: Number(e.target.value) })}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-[9px] text-fg-subtle block mb-1">
          {es ? 'Ajuste' : 'Fit'}
        </label>
        <div className="flex gap-1">
          {(['contain', 'cover'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onChange({ fit: f })}
              className={cn(
                'flex-1 h-7 rounded-md text-[10px] border capitalize',
                layer.fit === f
                  ? 'bg-gold/15 text-gold border-gold/30'
                  : 'bg-surface-2 text-fg-muted border-border',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CANVAS EXPORT
// ═══════════════════════════════════════════════════════════════════

async function renderToCanvas(
  imageUrl: string,
  layers: EditorLayer[],
  aspectRatio: Variant['aspectRatio'],
): Promise<HTMLCanvasElement> {
  const [W, H] =
    aspectRatio === '1:1'
      ? [1080, 1080]
      : aspectRatio === '4:5'
      ? [1080, 1350]
      : [1080, 1920];

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const bgImg = await loadImg(imageUrl);
  const s = Math.max(W / bgImg.width, H / bgImg.height);
  const iw = bgImg.width * s;
  const ih = bgImg.height * s;
  ctx.drawImage(bgImg, (W - iw) / 2, (H - ih) / 2, iw, ih);

  for (const l of layers) {
    if (!l.visible) continue;
    ctx.save();
    ctx.globalAlpha = l.opacity;

    if (l.rotation !== 0) {
      const cx = l.x * W;
      const cy = l.y * H;
      ctx.translate(cx, cy);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (l.type === 'text') {
      drawTextLayer(ctx, l, W, H);
    } else if (l.type === 'image' || l.type === 'logo') {
      await drawImageLayer(ctx, l, W, H);
    } else if (l.type === 'shape') {
      drawShapeLayer(ctx, l, W, H);
    }

    ctx.restore();
  }

  return canvas;
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  l: TextLayerData,
  W: number,
  H: number,
) {
  const fontPx = (l.fontSizePercent / 100) * H;
  const fontFamily =
    l.fontFamily === 'serif'
      ? 'Georgia, serif'
      : l.fontFamily === 'mono'
      ? 'Courier, monospace'
      : '"Inter", -apple-system, system-ui, sans-serif';

  ctx.font = `${l.fontWeight} ${fontPx}px ${fontFamily}`;
  ctx.textAlign = l.align;
  ctx.textBaseline = 'middle';

  const cx = l.x * W;
  const cy = l.y * H;
  const maxW = l.width * W;

  if (l.isButton) {
    const metrics = ctx.measureText(l.text);
    const padY = fontPx * (l.buttonPadding || 1) * 0.4;
    const padX = fontPx * (l.buttonPadding || 1) * 1.2;
    const bw = metrics.width + padX * 2;
    const bh = fontPx + padY * 2;

    ctx.fillStyle = l.buttonBg || '#ffffff';
    roundRect(ctx, cx - bw / 2, cy - bh / 2, bw, bh, l.buttonRadius || 0);
    ctx.fill();

    ctx.fillStyle = l.buttonTextColor || '#000000';
    ctx.fillText(l.text, cx, cy);
  } else {
    if (l.shadowEnabled) {
      ctx.shadowColor = l.shadowColor;
      ctx.shadowBlur = l.shadowBlur;
    }
    ctx.fillStyle = l.color;
    wrapText(ctx, l.text, cx, cy, maxW, fontPx * l.lineHeight);
    ctx.shadowBlur = 0;
  }
}

async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  l: ImageLayerData | LogoLayerData,
  W: number,
  H: number,
) {
  try {
    const img = await loadImg(l.src);
    const boxW = l.width * W;
    const boxH = l.height * H;
    const cx = l.x * W;
    const cy = l.y * H;

    const fit = l.type === 'image' ? (l as ImageLayerData).fit : 'contain';
    const imgRatio = img.width / img.height;
    const boxRatio = boxW / boxH;

    let drawW = boxW;
    let drawH = boxH;

    if (fit === 'contain') {
      if (imgRatio > boxRatio) {
        drawH = boxW / imgRatio;
      } else {
        drawW = boxH * imgRatio;
      }
    } else {
      if (imgRatio > boxRatio) {
        drawW = boxH * imgRatio;
      } else {
        drawH = boxW / imgRatio;
      }
    }

    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  } catch (err) {
    console.error('[ad-editor] drawImageLayer failed:', err);
  }
}

function drawShapeLayer(
  ctx: CanvasRenderingContext2D,
  l: ShapeLayerData,
  W: number,
  H: number,
) {
  const boxW = l.width * W;
  const boxH = l.height * H;
  const cx = l.x * W;
  const cy = l.y * H;

  ctx.fillStyle = l.fill;
  if (l.strokeWidth > 0) {
    ctx.strokeStyle = l.strokeColor;
    ctx.lineWidth = l.strokeWidth;
  }

  if (l.shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(cx, cy, boxW / 2, boxH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (l.strokeWidth > 0) ctx.stroke();
  } else {
    roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, l.borderRadius);
    ctx.fill();
    if (l.strokeWidth > 0) ctx.stroke();
  }
}

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('image load failed'));
    img.src = url;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line + w + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line.trim());
      line = w + ' ';
    } else {
      line = test;
    }
  }
  lines.push(line.trim());
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
