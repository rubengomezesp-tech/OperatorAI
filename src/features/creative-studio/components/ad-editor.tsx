'use client';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
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
  Bug,
  Palette,
  Plus,
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
  BrandAssets,
} from '../types';
import { AD_TEMPLATES, getDefaultLayers } from '../data/ad-templates';

// ═══════════════════════════════════════════════════════════════════
// PIXEL-PERFECT SYSTEM
// ═══════════════════════════════════════════════════════════════════
//
// Canvas has FIXED dimensions in pixels. Preview is the SAME DOM node
// scaled via CSS transform. All layer coordinates stored in REAL
// canvas pixels.
//
// Pointer → canvas coord conversion:
//   rect = stageRef.getBoundingClientRect()
//   scaleX = CANVAS_WIDTH / rect.width
//   realX = (event.clientX - rect.left) * scaleX
//
// Export:
//   Temporarily disables CSS scale.
//   html-to-image captures at real canvas size.
//   Restores scale after.
//
// ═══════════════════════════════════════════════════════════════════

type CanvasSize = { w: number; h: number };

const CANVAS_SIZES: Record<Variant['aspectRatio'], CanvasSize> = {
  '1:1': { w: 1080, h: 1080 },
  '4:5': { w: 1080, h: 1350 },
  '9:16': { w: 1080, h: 1920 },
};

const SNAP_PX = 14;
const SAFE_MARGIN_PX = 54;

const FONT_FAMILIES = {
  inter: '"Inter", -apple-system, system-ui, sans-serif',
  system: 'system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", Courier, monospace',
  display: '"Inter", -apple-system, sans-serif',
} as const;

const COLOR_PRESETS = [
  '#ffffff', '#000000', '#c9a863', '#1a1a1a', '#f5f5f5',
  '#ff3b30', '#34c759', '#007aff', '#ff9500', '#af52de',
];

interface Props {
  imageUrl: string;
  variant: Variant;
  locale: 'en' | 'es';
  onBack?: () => void;
  brandAssets?: BrandAssets;
}

// ═══════════════════════════════════════════════════════════════════
// NORMALIZATION — templates give 0-1, editor works in px
// ═══════════════════════════════════════════════════════════════════

function templateToPixels(
  layers: EditorLayer[],
  canvas: CanvasSize,
): EditorLayer[] {
  return layers.map((l) => {
    const base = {
      ...l,
      x: l.x * canvas.w,
      y: l.y * canvas.h,
      width: l.width * canvas.w,
      height: l.height * canvas.h,
    };
    if (l.type === 'text') {
      const t = l as TextLayerData;
      return {
        ...base,
        fontSizePercent: (t.fontSizePercent / 100) * canvas.h,
      } as EditorLayer;
    }
    return base as EditorLayer;
  });
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function AdEditor({
  imageUrl,
  variant,
  locale,
  onBack,
  brandAssets,
}: Props) {
  const es = locale === 'es';
  const canvas = CANVAS_SIZES[variant.aspectRatio];

  const [layers, setLayers] = useState<EditorLayer[]>(() =>
    templateToPixels(getDefaultLayers(variant), canvas),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [activeTab, setActiveTab] = useState<'templates' | 'layers'>('templates');
  const [pointerDebug, setPointerDebug] = useState<{ x: number; y: number } | null>(null);
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
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const originalOverflow = useRef<string>('');
  const brandLogoInserted = useRef(false);

  // ─── AUTO-INSERT BRAND LOGO ON MOUNT ────────────────────────
  useEffect(() => {
    if (brandLogoInserted.current) return;
    if (!brandAssets?.logoUrl) return;

    brandLogoInserted.current = true;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const logoRatio = img.naturalWidth / img.naturalHeight;
      const targetW = canvas.w * 0.18;
      const targetH = targetW / logoRatio;

      const margin = SAFE_MARGIN_PX;
      const pos = brandAssets.defaultLogoPosition ?? 'top-right';
      let x = margin;
      let y = margin;
      if (pos === 'top-right') x = canvas.w - margin - targetW;
      if (pos === 'top-center') x = (canvas.w - targetW) / 2;
      if (pos === 'bottom-center') {
        x = (canvas.w - targetW) / 2;
        y = canvas.h - margin - targetH;
      }

      const logoLayer: LogoLayerData = {
        id: 'brand-logo-auto',
        type: 'logo',
        src: brandAssets.logoUrl,
        x,
        y,
        width: targetW,
        height: targetH,
        rotation: 0,
        opacity: 1,
        zIndex: 9999,
        visible: true,
        name: 'Brand Logo',
        locked: false,
      };

      setLayers((prev) => [...prev, logoLayer]);
    };
    img.onerror = () => {
      console.warn('[ad-editor] brand logo failed to load:', brandAssets.logoUrl);
    };
    img.src = proxiedImageUrl(brandAssets.logoUrl) || brandAssets.logoUrl;
  }, [brandAssets?.logoUrl, brandAssets?.defaultLogoPosition, canvas.w, canvas.h]);

  // ─── COMPUTE SCALE ──────────────────────────────────────────
  useLayoutEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const padding = 24;
      const availableW = rect.width - padding;
      const availableH = rect.height - padding;
      if (availableW <= 0 || availableH <= 0) return;
      const newScale = Math.min(availableW / canvas.w, availableH / canvas.h, 1);
      setScale(Math.max(newScale, 0.1));
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [canvas.w, canvas.h]);

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedId) || null,
    [layers, selectedId],
  );
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );

  // ─── LAYER OPS ──────────────────────────────────────────────
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

  const duplicateLayer = useCallback(
    (id: string) => {
      setLayers((prev) => {
        const src = prev.find((l) => l.id === id);
        if (!src) return prev;
        const maxZ = Math.max(0, ...prev.map((l) => l.zIndex));
        const copy: EditorLayer = {
          ...src,
          id: `${src.type}_${Date.now().toString(36)}`,
          x: Math.min(canvas.w - 50, src.x + 40),
          y: Math.min(canvas.h - 50, src.y + 40),
          zIndex: maxZ + 1,
          name: src.name ? `${src.name} copy` : undefined,
        };
        setSelectedId(copy.id);
        return [...prev, copy];
      });
    },
    [canvas.w, canvas.h],
  );

  const moveLayerZ = useCallback((id: string, dir: 'up' | 'down') => {
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const swapIdx = dir === 'up' ? idx + 1 : idx - 1;
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

  // ─── ADD LAYERS ─────────────────────────────────────────────
  const addText = useCallback(() => {
    const w = canvas.w * 0.8;
    const fontSize = canvas.h * 0.05;
    const layer: TextLayerData = {
      id: `text_${Date.now().toString(36)}`,
      type: 'text',
      text: es ? 'Nuevo texto' : 'New text',
      color: '#ffffff',
      fontSizePercent: fontSize,
      fontFamily: 'inter',
      fontWeight: 700,
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      shadowEnabled: true,
      shadowBlur: 8,
      shadowColor: 'rgba(0,0,0,0.5)',
      x: (canvas.w - w) / 2,
      y: canvas.h / 2 - fontSize,
      width: w,
      height: fontSize * 1.5,
      rotation: 0,
      opacity: 1,
      zIndex: 0,
      visible: true,
      name: 'Text',
    };
    addLayer(layer);
  }, [es, canvas.w, canvas.h, addLayer]);

  const addShape = useCallback(
    (shape: 'rect' | 'circle') => {
      const size = canvas.w * 0.2;
      const layer: ShapeLayerData = {
        id: `shape_${Date.now().toString(36)}`,
        type: 'shape',
        shape,
        fill: '#ffffff',
        strokeWidth: 0,
        strokeColor: '#000000',
        borderRadius: shape === 'circle' ? 999 : 0,
        x: (canvas.w - size) / 2,
        y: (canvas.h - size) / 2,
        width: size,
        height: size,
        rotation: 0,
        opacity: 0.9,
        zIndex: 0,
        visible: true,
        name: shape === 'rect' ? 'Rectangle' : 'Circle',
      };
      addLayer(layer);
    },
    [canvas.w, canvas.h, addLayer],
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
        const img = new window.Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (kind === 'logo') {
            const lw = canvas.w * 0.15;
            const lh = lw / ratio;
            addLayer({
              id: `logo_${Date.now().toString(36)}`,
              type: 'logo',
              src: dataUrl,
              x: canvas.w * 0.08,
              y: canvas.h * 0.06,
              width: lw,
              height: lh,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              visible: true,
              name: 'Logo',
            });
          } else {
            const iw = canvas.w * 0.4;
            const ih = iw / ratio;
            addLayer({
              id: `img_${Date.now().toString(36)}`,
              type: 'image',
              src: dataUrl,
              fit: 'contain',
              x: (canvas.w - iw) / 2,
              y: (canvas.h - ih) / 2,
              width: iw,
              height: ih,
              rotation: 0,
              opacity: 1,
              zIndex: 0,
              visible: true,
              name: 'Image',
            });
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [canvas, es, addLayer],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const tpl = AD_TEMPLATES.find((t) => t.id === templateId);
      if (!tpl) return;
      setLayers(templateToPixels(tpl.build(variant), canvas));
      setCurrentTemplateId(templateId);
      setSelectedId(null);
      // Reset brand logo guard so it re-inserts on next mount
      brandLogoInserted.current = false;
    },
    [variant, canvas],
  );

  // ─── DRAG ───────────────────────────────────────────────────
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
      const scaleX = canvas.w / rect.width;
      const scaleY = canvas.h / rect.height;

      const realX = (e.clientX - rect.left) * scaleX;
      const realY = (e.clientY - rect.top) * scaleY;

      dragRef.current = {
        layerId,
        pointerId: e.pointerId,
        offsetX: realX - layer.x,
        offsetY: realY - layer.y,
      };

      originalOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [layers, canvas.w, canvas.h],
  );

  const handleStagePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (debugMode) {
        const rect = stage.getBoundingClientRect();
        const scaleX = canvas.w / rect.width;
        const scaleY = canvas.h / rect.height;
        setPointerDebug({
          x: Math.round((e.clientX - rect.left) * scaleX),
          y: Math.round((e.clientY - rect.top) * scaleY),
        });
      }

      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = stage.getBoundingClientRect();
      const scaleX = canvas.w / rect.width;
      const scaleY = canvas.h / rect.height;

      const realX = (e.clientX - rect.left) * scaleX;
      const realY = (e.clientY - rect.top) * scaleY;

      const layer = layers.find((l) => l.id === drag.layerId);
      if (!layer) return;

      let newX = realX - drag.offsetX;
      let newY = realY - drag.offsetY;

      newX = Math.max(0, Math.min(canvas.w - layer.width, newX));
      newY = Math.max(0, Math.min(canvas.h - layer.height, newY));

      const guides = {
        cx: false,
        cy: false,
        leftMargin: false,
        rightMargin: false,
        topMargin: false,
        bottomMargin: false,
      };
      const centerX = (canvas.w - layer.width) / 2;
      const centerY = (canvas.h - layer.height) / 2;
      const rightX = canvas.w - SAFE_MARGIN_PX - layer.width;
      const bottomY = canvas.h - SAFE_MARGIN_PX - layer.height;

      if (Math.abs(newX - centerX) < SNAP_PX) {
        newX = centerX;
        guides.cx = true;
      }
      if (Math.abs(newY - centerY) < SNAP_PX) {
        newY = centerY;
        guides.cy = true;
      }
      if (Math.abs(newX - SAFE_MARGIN_PX) < SNAP_PX) {
        newX = SAFE_MARGIN_PX;
        guides.leftMargin = true;
      }
      if (Math.abs(newX - rightX) < SNAP_PX) {
        newX = rightX;
        guides.rightMargin = true;
      }
      if (Math.abs(newY - SAFE_MARGIN_PX) < SNAP_PX) {
        newY = SAFE_MARGIN_PX;
        guides.topMargin = true;
      }
      if (Math.abs(newY - bottomY) < SNAP_PX) {
        newY = bottomY;
        guides.bottomMargin = true;
      }

      setActiveGuides(guides);
      updateLayer(drag.layerId, { x: newX, y: newY });
    },
    [layers, canvas.w, canvas.h, updateLayer, debugMode],
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

  // ─── EXPORT — pixel-perfect ────────────────────────────────
  const handleExport = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;
    setExporting(true);

    try {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        await document.fonts.ready;
      }

      const allImgs = Array.from(stage.querySelectorAll('img'));
      await Promise.all(
        allImgs.map((im) =>
          im.complete && im.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((res) => {
                const done = () => res();
                im.addEventListener('load', done, { once: true });
                im.addEventListener('error', done, { once: true });
                setTimeout(done, 8000);
              }),
        ),
      );

      const origTransform = stage.style.transform;
      const origTransformOrigin = stage.style.transformOrigin;
      stage.style.transform = 'none';
      stage.style.transformOrigin = 'initial';

      try {
        const { toPng } = await import('html-to-image');
        const dataUrl = await toPng(stage, {
          width: canvas.w,
          height: canvas.h,
          pixelRatio: 2,
          cacheBust: true,
          skipAutoScale: true,
          backgroundColor: '#000000',
          style: {
            transform: 'none',
            transformOrigin: 'initial',
            width: `${canvas.w}px`,
            height: `${canvas.h}px`,
          },
        });

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${variant.layout}-final.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } finally {
        stage.style.transform = origTransform;
        stage.style.transformOrigin = origTransformOrigin;
      }
    } catch (err) {
      console.error('[ad-editor] export failed:', err);
      alert(es ? 'Error al exportar' : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [canvas.w, canvas.h, variant.layout, es]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = originalOverflow.current;
    };
  }, []);

  // ═════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════

  return (
    <div className="w-full h-full overflow-hidden overscroll-contain bg-surface-2">
      <div className="flex flex-col lg:grid lg:grid-cols-[280px_1fr_320px] h-full gap-3 p-3">
        {/* LEFT: Templates + Layers */}
        <aside className="hidden lg:flex flex-col gap-3 overflow-hidden">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[11px] text-fg-muted hover:text-fg transition-colors self-start"
            >
              <ArrowLeft className="h-3 w-3" />
              {es ? 'Volver' : 'Back'}
            </button>
          )}

          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface border border-border">
            <button
              onClick={() => setActiveTab('templates')}
              className={cn(
                'py-2 rounded-lg text-[11px] font-medium transition-all',
                activeTab === 'templates'
                  ? 'bg-gold/15 text-gold'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 inline mr-1.5" />
              {es ? 'Plantillas' : 'Templates'}
            </button>
            <button
              onClick={() => setActiveTab('layers')}
              className={cn(
                'py-2 rounded-lg text-[11px] font-medium transition-all',
                activeTab === 'layers'
                  ? 'bg-gold/15 text-gold'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <Layers className="h-3.5 w-3.5 inline mr-1.5" />
              {es ? 'Capas' : 'Layers'} ({layers.length})
            </button>
          </div>

          <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
              {es ? 'Añadir' : 'Add'}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              <ToolButton icon={<Type className="h-4 w-4" />} onClick={addText} label={es ? 'Texto' : 'Text'} />
              <ToolButton
                icon={<ImageIcon className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                label={es ? 'Imagen' : 'Image'}
              />
              <ToolButton
                icon={<Upload className="h-4 w-4" />}
                onClick={() => logoInputRef.current?.click()}
                label="Logo"
              />
              <ToolButton
                icon={<Square className="h-4 w-4" />}
                onClick={() => addShape('rect')}
                label="Rect"
              />
              <ToolButton
                icon={<CircleIcon className="h-4 w-4" />}
                onClick={() => addShape('circle')}
                label={es ? 'Círc.' : 'Circ.'}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
            {activeTab === 'templates' ? (
              <div className="overflow-y-auto p-2 space-y-1">
                {AD_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-all border',
                      currentTemplateId === tpl.id
                        ? 'bg-gold/10 border-gold/40'
                        : 'bg-surface-2 border-transparent hover:border-border',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-1 h-8 rounded-full shrink-0',
                          currentTemplateId === tpl.id ? 'bg-gold' : 'bg-border',
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            'text-[11px] font-medium truncate',
                            currentTemplateId === tpl.id ? 'text-gold' : 'text-fg',
                          )}
                        >
                          {tpl.name}
                        </div>
                        <div className="text-[9px] text-fg-subtle truncate mt-0.5">
                          {tpl.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-y-auto p-2 space-y-1">
                {[...layers]
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((l) => (
                    <div
                      key={l.id}
                      className={cn(
                        'group flex items-center gap-2 px-2 py-2 rounded-lg transition-all border',
                        selectedId === l.id
                          ? 'bg-gold/10 border-gold/40'
                          : 'bg-surface-2 border-transparent hover:border-border',
                      )}
                    >
                      <button
                        onClick={() => setSelectedId(l.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <LayerTypeIcon type={l.type} selected={selectedId === l.id} />
                        <span
                          className={cn(
                            'flex-1 truncate text-[11px]',
                            selectedId === l.id ? 'text-gold font-medium' : 'text-fg-muted',
                          )}
                        >
                          {l.name || describeLayer(l)}
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          updateLayer(l.id, { visible: !l.visible } as any)
                        }
                        className="opacity-60 hover:opacity-100 transition-opacity p-1"
                      >
                        {l.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  ))}
                {layers.length === 0 && (
                  <div className="text-center py-8 text-[10px] text-fg-subtle">
                    {es ? 'Sin capas' : 'No layers'}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Canvas */}
        <main className="flex flex-col overflow-hidden">
          <div className="lg:hidden flex items-center justify-between mb-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-[11px] text-fg-muted"
              >
                <ArrowLeft className="h-3 w-3" />
                {es ? 'Volver' : 'Back'}
              </button>
            )}
            <div className="text-[10px] text-fg-subtle">
              {layers.length} {es ? 'capas' : 'layers'}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2 text-[10px] text-fg-subtle">
              <span>{canvas.w} × {canvas.h}px</span>
              <span className="text-border">•</span>
              <span>{variant.aspectRatio}</span>
              <span className="text-border">•</span>
              <span>{Math.round(scale * 100)}%</span>
            </div>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-colors',
                debugMode
                  ? 'bg-gold/15 text-gold'
                  : 'text-fg-subtle hover:text-fg',
              )}
              title="Debug"
            >
              <Bug className="h-3 w-3" />
              Debug
            </button>
          </div>

          <div
            ref={containerRef}
            className="flex items-center justify-center flex-1 overflow-hidden relative"
          >
            <div
              style={{
                width: canvas.w * scale,
                height: canvas.h * scale,
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              <div
                ref={stageRef}
                className="bg-black relative overflow-hidden select-none"
                style={{
                  width: canvas.w,
                  height: canvas.h,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
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
                  data-role="background"
                  src={proxiedImageUrl(imageUrl) || imageUrl}
                  alt=""
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                  }}
                />

                {sortedLayers.map((l) =>
                  l.visible
                    ? renderLayer(l, {
                        selected: selectedId === l.id,
                        onPointerDown: (e) => handleLayerPointerDown(e, l.id),
                      })
                    : null,
                )}

                <GuideOverlay guides={activeGuides} canvas={canvas} />

                {selectedLayer && selectedLayer.visible && (
                  <SelectionBox layer={selectedLayer} />
                )}
              </div>

              {debugMode && (
                <DebugOverlay
                  canvas={canvas}
                  scale={scale}
                  layer={selectedLayer}
                  pointer={pointerDebug}
                />
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center justify-center gap-2 mt-3 overflow-x-auto pb-1">
            <MobileTool icon={<Type className="h-4 w-4" />} onClick={addText} />
            <MobileTool
              icon={<ImageIcon className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
            />
            <MobileTool
              icon={<Upload className="h-4 w-4" />}
              onClick={() => logoInputRef.current?.click()}
            />
            <MobileTool
              icon={<Square className="h-4 w-4" />}
              onClick={() => addShape('rect')}
            />
            <MobileTool
              icon={<CircleIcon className="h-4 w-4" />}
              onClick={() => addShape('circle')}
            />
          </div>
        </main>

        {/* RIGHT: Properties */}
        <aside className="overflow-y-auto overscroll-contain space-y-3">
          {selectedLayer ? (
            <LayerProperties
              layer={selectedLayer}
              canvas={canvas}
              onChange={(patch) => updateLayer(selectedLayer.id, patch as any)}
              onDuplicate={() => duplicateLayer(selectedLayer.id)}
              onDelete={() => deleteLayer(selectedLayer.id)}
              onBringForward={() => moveLayerZ(selectedLayer.id, 'up')}
              onSendBackward={() => moveLayerZ(selectedLayer.id, 'down')}
              locale={locale}
            />
          ) : (
            <EmptyProperties locale={locale} />
          )}

          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full h-12 rounded-xl bg-gold text-black text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-60 transition-all shadow-lg shadow-gold/20"
          >
            <Download className="h-4 w-4" />
            {exporting
              ? es
                ? 'Exportando…'
                : 'Exporting…'
              : es
              ? 'Descargar PNG'
              : 'Download PNG'}
          </button>
        </aside>
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
// SMALL UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function ToolButton({
  icon,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-lg bg-surface-2 border border-border hover:border-gold/40 hover:bg-gold/5 text-fg-muted hover:text-fg flex flex-col items-center justify-center gap-0.5 transition-all"
      title={label}
    >
      {icon}
      <span className="text-[8px] leading-none">{label}</span>
    </button>
  );
}

function MobileTool({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-11 w-11 shrink-0 rounded-lg bg-surface border border-border text-fg flex items-center justify-center active:scale-95 transition-transform"
    >
      {icon}
    </button>
  );
}

function LayerTypeIcon({
  type,
  selected,
}: {
  type: EditorLayer['type'];
  selected: boolean;
}) {
  const cls = cn('h-3 w-3', selected ? 'text-gold' : 'text-fg-subtle');
  if (type === 'text') return <Type className={cls} />;
  if (type === 'image' || type === 'logo') return <ImageIcon className={cls} />;
  return <Square className={cls} />;
}

function describeLayer(l: EditorLayer): string {
  if (l.type === 'text') return (l as TextLayerData).text.slice(0, 24);
  if (l.type === 'image') return 'Image';
  if (l.type === 'logo') return 'Logo';
  return (l as ShapeLayerData).shape === 'circle' ? 'Circle' : 'Rectangle';
}

function GuideOverlay({
  guides,
  canvas,
}: {
  guides: {
    cx: boolean;
    cy: boolean;
    leftMargin: boolean;
    rightMargin: boolean;
    topMargin: boolean;
    bottomMargin: boolean;
  };
  canvas: CanvasSize;
}) {
  return (
    <>
      {guides.cx && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: canvas.w / 2 - 1,
            width: 2,
            background: '#ff2d92',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {guides.cy && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: canvas.h / 2 - 1,
            height: 2,
            background: '#ff2d92',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {guides.leftMargin && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: SAFE_MARGIN_PX - 1,
            width: 2,
            background: '#00d4ff',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {guides.rightMargin && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: SAFE_MARGIN_PX - 1,
            width: 2,
            background: '#00d4ff',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {guides.topMargin && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: SAFE_MARGIN_PX - 1,
            height: 2,
            background: '#00d4ff',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
      {guides.bottomMargin && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: SAFE_MARGIN_PX - 1,
            height: 2,
            background: '#00d4ff',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
}

function SelectionBox({ layer }: { layer: EditorLayer }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: layer.x,
        top: layer.y,
        width: layer.width,
        height: layer.height,
        border: '2px solid #c9a863',
        pointerEvents: 'none',
        zIndex: 9998,
        transform: `rotate(${layer.rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
        <div
          key={pos}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            background: '#c9a863',
            border: '2px solid #000',
            ...(pos.includes('top') ? { top: -6 } : { bottom: -6 }),
            ...(pos.includes('left') ? { left: -6 } : { right: -6 }),
          }}
        />
      ))}
    </div>
  );
}

function DebugOverlay({
  canvas,
  scale,
  layer,
  pointer,
}: {
  canvas: CanvasSize;
  scale: number;
  layer: EditorLayer | null;
  pointer: { x: number; y: number } | null;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(0,0,0,0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 11,
        fontFamily: 'monospace',
        lineHeight: 1.5,
        pointerEvents: 'none',
        zIndex: 10000,
        border: '1px solid rgba(201,168,99,0.4)',
      }}
    >
      <div>canvas: {canvas.w} × {canvas.h}</div>
      <div>scale: {scale.toFixed(3)}</div>
      {pointer && <div>ptr: {pointer.x}, {pointer.y}</div>}
      {layer && (
        <>
          <div style={{ marginTop: 4, color: '#c9a863' }}>
            {layer.name || layer.type}
          </div>
          <div>x: {Math.round(layer.x)} y: {Math.round(layer.y)}</div>
          <div>w: {Math.round(layer.width)} h: {Math.round(layer.height)}</div>
          {layer.type === 'text' && (
            <div>font: {Math.round((layer as TextLayerData).fontSizePercent)}px</div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyProperties({ locale }: { locale: 'en' | 'es' }) {
  const es = locale === 'es';
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
        <Plus className="h-4 w-4 text-fg-subtle" />
      </div>
      <div className="text-[11px] text-fg-muted font-medium mb-1">
        {es ? 'Selecciona una capa' : 'Select a layer'}
      </div>
      <div className="text-[9px] text-fg-subtle leading-relaxed">
        {es
          ? 'Toca una capa en el lienzo o agrega una nueva'
          : 'Tap a layer on canvas or add a new one'}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LAYER RENDERER — no translate(-50%,-50%), no cqh
// ═══════════════════════════════════════════════════════════════════

function renderLayer(
  l: EditorLayer,
  opts: {
    selected: boolean;
    onPointerDown: (e: React.PointerEvent) => void;
  },
) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: l.x,
    top: l.y,
    width: l.width,
    height: l.type === 'text' ? 'auto' : l.height,
    opacity: l.opacity,
    transform: l.rotation !== 0 ? `rotate(${l.rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: l.zIndex,
    touchAction: 'none',
    cursor: 'move',
  };

  if (l.type === 'text') {
    const t = l;
    const padY = t.isButton ? (t.buttonPadding || 1) * t.fontSizePercent * 0.4 : 0;
    const padX = t.isButton ? (t.buttonPadding || 1) * t.fontSizePercent * 1.2 : 0;

    return (
      <div
        key={l.id}
        onPointerDown={opts.onPointerDown}
        style={{
          ...baseStyle,
          fontFamily: FONT_FAMILIES[t.fontFamily],
          fontSize: `${t.fontSizePercent}px`,
          fontWeight: t.fontWeight,
          color: t.isButton ? (t.buttonTextColor || '#000') : t.color,
          textAlign: t.align,
          letterSpacing: `${t.letterSpacing}em`,
          lineHeight: t.lineHeight,
          textShadow:
            t.shadowEnabled && !t.isButton
              ? `0 2px ${t.shadowBlur}px ${t.shadowColor}`
              : 'none',
          background: t.isButton ? (t.buttonBg || '#fff') : 'transparent',
          padding: t.isButton ? `${padY}px ${padX}px` : 0,
          borderRadius: t.isButton ? `${t.buttonRadius || 0}px` : 0,
          display: 'inline-block',
          boxSizing: 'border-box',
          wordWrap: 'break-word',
          whiteSpace: t.isButton ? 'nowrap' : 'pre-wrap',
        }}
      >
        {t.text}
      </div>
    );
  }

  if (l.type === 'image' || l.type === 'logo') {
    const i = l as ImageLayerData | LogoLayerData;
    return (
      <div key={l.id} onPointerDown={opts.onPointerDown} style={baseStyle}>
        <img
          src={proxiedImageUrl(i.src) || i.src}
          alt=""
          draggable={false}
          crossOrigin="anonymous"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit:
              l.type === 'image' ? (i as ImageLayerData).fit : 'contain',
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
        style={{
          ...baseStyle,
          background: s.fill,
          borderRadius: s.shape === 'circle' ? '50%' : `${s.borderRadius}px`,
          border:
            s.strokeWidth > 0
              ? `${s.strokeWidth}px solid ${s.strokeColor}`
              : 'none',
          boxSizing: 'border-box',
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
  canvas,
  onChange,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  locale,
}: {
  layer: EditorLayer;
  canvas: CanvasSize;
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
      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
            {layer.name || (es ? 'Capa' : 'Layer')}
          </div>
          <div className="flex items-center gap-1">
            <IconButton icon={<ChevronUp className="h-3 w-3" />} onClick={onBringForward} />
            <IconButton icon={<ChevronDown className="h-3 w-3" />} onClick={onSendBackward} />
            <IconButton icon={<Copy className="h-3 w-3" />} onClick={onDuplicate} />
            <IconButton
              icon={<Trash2 className="h-3 w-3" />}
              onClick={onDelete}
              danger
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumberInput
            label="X"
            value={Math.round(layer.x)}
            onChange={(v) =>
              onChange({
                x: Math.max(0, Math.min(canvas.w - layer.width, v)),
              })
            }
          />
          <NumberInput
            label="Y"
            value={Math.round(layer.y)}
            onChange={(v) =>
              onChange({
                y: Math.max(0, Math.min(canvas.h - layer.height, v)),
              })
            }
          />
          <NumberInput
            label="W"
            value={Math.round(layer.width)}
            onChange={(v) => onChange({ width: Math.max(10, v) })}
          />
          <NumberInput
            label="H"
            value={Math.round(layer.height)}
            onChange={(v) => onChange({ height: Math.max(10, v) })}
          />
        </div>

        <SliderRow
          label={es ? 'Opacidad' : 'Opacity'}
          value={Math.round(layer.opacity * 100)}
          suffix="%"
          min={0}
          max={100}
          onChange={(v) => onChange({ opacity: v / 100 })}
        />
        <SliderRow
          label={es ? 'Rotación' : 'Rotation'}
          value={layer.rotation}
          suffix="°"
          min={-180}
          max={180}
          onChange={(v) => onChange({ rotation: v })}
        />
      </div>

      {layer.type === 'text' && (
        <TextProperties
          layer={layer}
          canvas={canvas}
          onChange={onChange as any}
          locale={locale}
        />
      )}
      {layer.type === 'shape' && (
        <ShapeProperties layer={layer} onChange={onChange as any} locale={locale} />
      )}
      {layer.type === 'image' && (
        <ImageProperties layer={layer} onChange={onChange as any} locale={locale} />
      )}

      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium mb-2">
          {es ? 'Alinear' : 'Align'}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => onChange({ x: SAFE_MARGIN_PX })}
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Izq' : 'Left'}
          </button>
          <button
            onClick={() => onChange({ x: (canvas.w - layer.width) / 2 })}
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Centro' : 'Center'}
          </button>
          <button
            onClick={() =>
              onChange({ x: canvas.w - SAFE_MARGIN_PX - layer.width })
            }
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Der' : 'Right'}
          </button>
          <button
            onClick={() => onChange({ y: SAFE_MARGIN_PX })}
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Arr' : 'Top'}
          </button>
          <button
            onClick={() => onChange({ y: (canvas.h - layer.height) / 2 })}
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Medio' : 'Middle'}
          </button>
          <button
            onClick={() =>
              onChange({ y: canvas.h - SAFE_MARGIN_PX - layer.height })
            }
            className="h-8 rounded-md bg-surface-2 border border-border hover:border-gold/40 text-[10px] text-fg-muted hover:text-fg transition-colors"
          >
            {es ? 'Aba' : 'Btm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function TextProperties({
  layer,
  canvas,
  onChange,
  locale,
}: {
  layer: TextLayerData;
  canvas: CanvasSize;
  onChange: (patch: Partial<TextLayerData>) => void;
  locale: 'en' | 'es';
}) {
  const es = locale === 'es';
  return (
    <>
      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-3">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
          {es ? 'Texto' : 'Text'}
        </div>
        <textarea
          value={layer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 rounded-md border border-border bg-surface-2 text-[11px] focus:outline-none focus:border-gold/40 resize-none"
        />

        <div>
          <Label>{es ? 'Tipografía' : 'Font'}</Label>
          <div className="grid grid-cols-5 gap-1 mt-1">
            {(Object.keys(FONT_FAMILIES) as Array<keyof typeof FONT_FAMILIES>).map((f) => (
              <button
                key={f}
                onClick={() => onChange({ fontFamily: f })}
                className={cn(
                  'h-7 rounded-md text-[9px] border capitalize transition-colors',
                  layer.fontFamily === f
                    ? 'bg-gold/15 text-gold border-gold/30'
                    : 'bg-surface-2 text-fg-muted border-border hover:border-gold/20',
                )}
                style={{ fontFamily: FONT_FAMILIES[f] }}
              >
                {f === 'inter' ? 'In' : f.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>

        <SliderRow
          label={es ? 'Tamaño' : 'Size'}
          value={Math.round(layer.fontSizePercent)}
          suffix="px"
          min={12}
          max={Math.round(canvas.h * 0.25)}
          onChange={(v) => onChange({ fontSizePercent: v })}
        />
        <SliderRow
          label={es ? 'Grosor' : 'Weight'}
          value={layer.fontWeight}
          min={300}
          max={900}
          step={100}
          onChange={(v) => onChange({ fontWeight: v })}
        />
        <SliderRow
          label={es ? 'Espacio' : 'Tracking'}
          value={Math.round(layer.letterSpacing * 100)}
          suffix="%"
          min={-5}
          max={30}
          onChange={(v) => onChange({ letterSpacing: v / 100 })}
        />
        <SliderRow
          label={es ? 'Altura' : 'Line'}
          value={Math.round(layer.lineHeight * 100)}
          suffix="%"
          min={80}
          max={250}
          onChange={(v) => onChange({ lineHeight: v / 100 })}
        />

        <div>
          <Label>{es ? 'Alineación' : 'Align'}</Label>
          <div className="flex gap-1 mt-1">
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
                  'flex-1 h-8 rounded-md border flex items-center justify-center transition-colors',
                  layer.align === val
                    ? 'bg-gold/15 border-gold/30 text-gold'
                    : 'bg-surface-2 border-border text-fg-muted hover:border-gold/20',
                )}
              >
                <Icon className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-2">
        <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium flex items-center gap-1.5">
          <Palette className="h-3 w-3" />
          {es ? 'Color' : 'Color'}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onChange({ color: c })}
              className={cn(
                'aspect-square rounded-md border-2 transition-all',
                layer.color === c
                  ? 'border-gold scale-105'
                  : 'border-border hover:border-fg-subtle',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <input
          type="color"
          value={layer.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-full h-8 rounded-md border border-border cursor-pointer"
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-2">
        <ToggleRow
          label={es ? 'Botón CTA' : 'CTA Button'}
          checked={!!layer.isButton}
          onChange={(c) => onChange({ isButton: c })}
        />
        {layer.isButton && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{es ? 'Fondo' : 'BG'}</Label>
                <input
                  type="color"
                  value={layer.buttonBg || '#ffffff'}
                  onChange={(e) => onChange({ buttonBg: e.target.value })}
                  className="w-full h-7 rounded-md border border-border mt-1 cursor-pointer"
                />
              </div>
              <div>
                <Label>{es ? 'Texto' : 'Text'}</Label>
                <input
                  type="color"
                  value={layer.buttonTextColor || '#000000'}
                  onChange={(e) => onChange({ buttonTextColor: e.target.value })}
                  className="w-full h-7 rounded-md border border-border mt-1 cursor-pointer"
                />
              </div>
            </div>
            <SliderRow
              label={es ? 'Radio' : 'Radius'}
              value={layer.buttonRadius || 0}
              min={0}
              max={999}
              onChange={(v) => onChange({ buttonRadius: v })}
            />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-2">
        <ToggleRow
          label={es ? 'Sombra' : 'Shadow'}
          checked={layer.shadowEnabled}
          onChange={(c) => onChange({ shadowEnabled: c })}
        />
        {layer.shadowEnabled && (
          <SliderRow
            label={es ? 'Desenfoque' : 'Blur'}
            value={layer.shadowBlur}
            min={0}
            max={40}
            onChange={(v) => onChange({ shadowBlur: v })}
          />
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
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
        {es ? 'Forma' : 'Shape'}
      </div>

      <div>
        <Label>{es ? 'Relleno' : 'Fill'}</Label>
        <div className="grid grid-cols-5 gap-1.5 mt-1 mb-2">
          {COLOR_PRESETS.slice(0, 5).map((c) => (
            <button
              key={c}
              onClick={() => onChange({ fill: c })}
              className={cn(
                'aspect-square rounded-md border-2 transition-all',
                layer.fill === c ? 'border-gold scale-105' : 'border-border',
              )}
              style={{ background: c }}
            />
          ))}
        </div>
        <input
          type="color"
          value={layer.fill}
          onChange={(e) => onChange({ fill: e.target.value })}
          className="w-full h-8 rounded-md border border-border cursor-pointer"
        />
      </div>

      {layer.shape === 'rect' && (
        <SliderRow
          label={es ? 'Radio' : 'Radius'}
          value={layer.borderRadius}
          min={0}
          max={200}
          onChange={(v) => onChange({ borderRadius: v })}
        />
      )}

      <SliderRow
        label={es ? 'Borde' : 'Stroke'}
        value={layer.strokeWidth}
        suffix="px"
        min={0}
        max={20}
        onChange={(v) => onChange({ strokeWidth: v })}
      />
      {layer.strokeWidth > 0 && (
        <div>
          <Label>{es ? 'Color borde' : 'Stroke color'}</Label>
          <input
            type="color"
            value={layer.strokeColor}
            onChange={(e) => onChange({ strokeColor: e.target.value })}
            className="w-full h-7 rounded-md border border-border mt-1 cursor-pointer"
          />
        </div>
      )}
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
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm space-y-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle font-medium">
        {es ? 'Imagen' : 'Image'}
      </div>
      <div>
        <Label>{es ? 'Ajuste' : 'Fit'}</Label>
        <div className="flex gap-1 mt-1">
          {(['contain', 'cover'] as const).map((f) => (
            <button
              key={f}
              onClick={() => onChange({ fit: f })}
              className={cn(
                'flex-1 h-8 rounded-md text-[10px] border capitalize transition-colors',
                layer.fit === f
                  ? 'bg-gold/15 text-gold border-gold/30'
                  : 'bg-surface-2 text-fg-muted border-border hover:border-gold/20',
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
// MICRO UI
// ═══════════════════════════════════════════════════════════════════

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] text-fg-subtle uppercase tracking-wide font-medium">
      {children}
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label>{label}</Label>
        <span className="text-[10px] text-fg font-mono tabular-nums">
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-gold"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full mt-1 px-2 py-1 rounded-md border border-border bg-surface-2 text-[11px] font-mono focus:outline-none focus:border-gold/40"
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-[11px] text-fg">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors',
          checked ? 'bg-gold' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </button>
    </label>
  );
}

function IconButton({
  icon,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-6 w-6 rounded-md border flex items-center justify-center transition-colors',
        danger
          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:border-red-500/60'
          : 'bg-surface-2 border-border text-fg-muted hover:border-gold/40 hover:text-fg',
      )}
    >
      {icon}
    </button>
  );
}
