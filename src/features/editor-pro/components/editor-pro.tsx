'use client';

/**
 * Editor Pro — Main orchestrator
 *
 * Replaces the old VariantEditor modal with a full agency-grade
 * canvas editor. Layout:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  TOPBAR  Save | Export | Undo | Redo | Aspect ratio  │
 *   ├──────────────────────────────────────────────────────┤
 *   │          │                          │                │
 *   │ LEFT     │       CANVAS             │  RIGHT         │
 *   │ Add Text │       (Konva Stage)      │  Properties    │
 *   │ Add Logo │                          │  AI Chat       │
 *   │ Layers   │                          │                │
 *   │          │                          │                │
 *   └──────────────────────────────────────────────────────┘
 */

import { useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  X,
  Type,
  Save,
  Download,
  Loader2,
  Sparkles,
  Send,
  Undo2,
  Redo2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import type Konva from 'konva';
import { EditorCanvas } from './editor-canvas';
import { AiRewriteModal } from './ai-rewrite-modal';
import { ColorPicker } from './color-picker';
import { buildAutoLayout } from '../lib/auto-layout';
import { useKeyboardShortcuts } from '../lib/use-keyboard-shortcuts';
import type {
  Layer,
  TextLayer,
  ShapeLayer,
  EditorProject,
  AspectRatio,
  AutoLayoutInput,
} from '../types';
import { ASPECT_DIMENSIONS } from '../types';
import type { VerticalSlug } from '@/features/campaign-brain/types';
import { Square, Wand2 } from 'lucide-react';

interface EditorProProps {
  draftId: string;
  variantId: string;
  initialImageUrl: string;
  vertical: VerticalSlug;
  /** Hook copy from brain (becomes auto-loaded headline) */
  briefHeadline?: string;
  /** First CTA from brain */
  briefCta?: string;
  /** Brand kit logo */
  logoUrl?: string;
  brandPrimary?: string;
  /** Initial aspect ratio (from variant brief) */
  initialAspectRatio?: AspectRatio;
  onClose: () => void;
  onSave: (newImageUrl: string) => void;
}

const PREMIUM_FONTS = [
  'Inter',
  'Playfair Display',
  'Cormorant Garamond',
  'Bebas Neue',
  'Anton',
  'Bodoni Moda',
  'DM Sans',
  'Manrope',
  'Outfit',
  'Plus Jakarta Sans',
  'Space Grotesk',
  'Archivo Black',
  'Oswald',
  'Fjalla One',
];

export function EditorPro({
  draftId,
  variantId,
  initialImageUrl,
  vertical,
  briefHeadline,
  briefCta,
  logoUrl,
  brandPrimary,
  initialAspectRatio = '4:5',
  onClose,
  onSave,
}: EditorProProps) {
  const [project, setProject] = useState<EditorProject>(() => {
    const layoutInput: AutoLayoutInput = {
      variantId,
      draftId,
      imageUrl: initialImageUrl,
      vertical,
      aspectRatio: initialAspectRatio,
      headline: briefHeadline,
      cta: briefCta,
      logoUrl,
      brandPrimary,
    };
    const initialLayers = buildAutoLayout(layoutInput);
    return {
      variantId,
      draftId,
      vertical,
      aspectRatio: initialAspectRatio,
      layers: initialLayers,
      history: [initialLayers],
      historyIndex: 0,
    };
  });

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);

  // Compute display scale so canvas fits its container
  const dimensions = ASPECT_DIMENSIONS[project.aspectRatio];
  const [displayScale, setDisplayScale] = useState(0.4);

  useEffect(() => {
    function updateScale() {
      if (!stageContainerRef.current) return;
      const containerWidth = stageContainerRef.current.clientWidth - 40;
      const containerHeight = stageContainerRef.current.clientHeight - 40;
      const scaleX = containerWidth / dimensions.width;
      const scaleY = containerHeight / dimensions.height;
      setDisplayScale(Math.min(scaleX, scaleY, 1));
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dimensions.width, dimensions.height]);

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  // ──────────────────────────────────────────────────────────────
  // History (undo/redo)
  // ──────────────────────────────────────────────────────────────

  function commitHistory(newLayers: Layer[]) {
    setProject((prev) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newLayers);
      return {
        ...prev,
        layers: newLayers,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }

  function handleUndo() {
    setProject((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        layers: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }

  function handleRedo() {
    setProject((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        layers: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Layer ops
  // ──────────────────────────────────────────────────────────────

  function handleUpdateLayer(id: string, patch: Partial<Layer>) {
    const newLayers = project.layers.map((l) =>
      l.id === id ? ({ ...l, ...patch } as Layer) : l,
    );
    commitHistory(newLayers);
  }

  function handleAddText() {
    const newText: TextLayer = {
      id: nanoid(),
      kind: 'text',
      text: 'Edit me',
      fontFamily: 'Inter',
      fontSize: 48,
      fontWeight: 600,
      fill: '#FFFFFF',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0,
      shadow: { color: 'rgba(0,0,0,0.6)', blur: 8, offsetX: 0, offsetY: 2 },
      x: dimensions.width / 2 - 150,
      y: dimensions.height / 2 - 30,
      width: 300,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
    };
    commitHistory([...project.layers, newText]);
    setSelectedLayerId(newText.id);
  }

  function handleAddShape() {
    const newShape: ShapeLayer = {
      id: nanoid(),
      kind: 'shape',
      shapeType: 'rect',
      fill: brandPrimary || '#D4AF37',
      cornerRadius: 8,
      x: dimensions.width / 2 - 100,
      y: dimensions.height / 2 - 30,
      width: 200,
      height: 60,
      rotation: 0,
      opacity: 0.95,
      visible: true,
      locked: false,
    };
    commitHistory([...project.layers, newShape]);
    setSelectedLayerId(newShape.id);
  }

  function handleDuplicate() {
    if (!selectedLayer || selectedLayer.kind === 'image') return;
    const dup: Layer = {
      ...selectedLayer,
      id: nanoid(),
      x: selectedLayer.x + 30,
      y: selectedLayer.y + 30,
    } as Layer;
    commitHistory([...project.layers, dup]);
    setSelectedLayerId(dup.id);
  }

  function handleApplyRewrite(newText: string) {
    if (!selectedLayer || selectedLayer.kind !== 'text') return;
    handleUpdateLayer(selectedLayer.id, { text: newText });
    setRewriteOpen(false);
  }

  function handleDeleteLayer(id: string) {
    const layer = project.layers.find((l) => l.id === id);
    if (!layer || layer.locked) return;
    const newLayers = project.layers.filter((l) => l.id !== id);
    commitHistory(newLayers);
    setSelectedLayerId(null);
  }

  function handleToggleVisible(id: string) {
    const layer = project.layers.find((l) => l.id === id);
    if (!layer) return;
    handleUpdateLayer(id, { visible: !layer.visible });
  }

  function handleToggleLock(id: string) {
    const layer = project.layers.find((l) => l.id === id);
    if (!layer) return;
    handleUpdateLayer(id, { locked: !layer.locked });
  }

  // ──────────────────────────────────────────────────────────────
  // AI Background swap
  // ──────────────────────────────────────────────────────────────

  async function handleAiEdit() {
    if (!aiInstruction.trim() || aiBusy) return;
    setAiBusy(true);
    setError(null);
    try {
      const bgLayer = project.layers.find(
        (l) => l.kind === 'image' && (l as any).isBackground,
      );
      if (!bgLayer || bgLayer.kind !== 'image') {
        throw new Error('Background not found');
      }

      const res = await fetch('/api/campaign/edit-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          draftId,
          variantId,
          currentImageUrl: bgLayer.src,
          instruction: aiInstruction.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Edit failed: ${res.status}`);
      }

      const body = await res.json();
      // Swap only the background, keep all other layers
      const newLayers = project.layers.map((l) =>
        l.id === bgLayer.id && l.kind === 'image'
          ? ({ ...l, src: body.imageUrl } as Layer)
          : l,
      );
      commitHistory(newLayers);
      setAiInstruction('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAiBusy(false);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Export — flatten canvas to PNG
  // ──────────────────────────────────────────────────────────────

  async function handleExportAndSave() {
    setExporting(true);
    setError(null);
    try {
      // Use stage ref to export
      const stage = (window as any).Konva?.stages?.[0] as Konva.Stage | undefined;
      if (!stage) {
        // Fallback: just save the current background URL
        const bg = project.layers.find(
          (l) => l.kind === 'image' && (l as any).isBackground,
        );
        if (bg && bg.kind === 'image') {
          onSave(bg.src);
          onClose();
        }
        return;
      }

      // Render at full resolution (undo display scale)
      const dataUrl = stage.toDataURL({
        pixelRatio: 1 / displayScale,
        mimeType: 'image/png',
      });

      // For now, save the data URL directly — backend can persist if needed
      onSave(dataUrl);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col">
      {/* TOPBAR */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-surface-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-surface-3 text-fg-muted hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="text-[13px] text-fg-muted">Editor Pro</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={project.historyIndex <= 0}
            className="p-2 rounded hover:bg-surface-3 text-fg-muted hover:text-fg disabled:opacity-30"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={project.historyIndex >= project.history.length - 1}
            className="p-2 rounded hover:bg-surface-3 text-fg-muted hover:text-fg disabled:opacity-30"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <select
            value={project.aspectRatio}
            onChange={(e) =>
              setProject((p) => ({ ...p, aspectRatio: e.target.value as AspectRatio }))
            }
            className="ml-2 px-2 py-1.5 rounded bg-surface-3 text-fg text-[12px] border border-border"
          >
            <option value="1:1">1:1 Square</option>
            <option value="4:5">4:5 Portrait</option>
            <option value="9:16">9:16 Story</option>
            <option value="16:9">16:9 Landscape</option>
          </select>
        </div>

        <button
          onClick={handleExportAndSave}
          disabled={exporting}
          className="px-3 py-1.5 rounded bg-gold text-black text-[13px] font-medium hover:bg-gold/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </button>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-56 border-r border-border bg-surface-2 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-2">
              Add
            </div>
            <button
              onClick={handleAddText}
              className="w-full px-3 py-2 rounded bg-surface-3 hover:bg-surface-3/70 text-[13px] text-fg flex items-center gap-2 mb-1"
              title="Add text (T)"
            >
              <Type className="h-3.5 w-3.5" />
              Text
              <span className="ml-auto text-[10px] text-fg-subtle">T</span>
            </button>
            <button
              onClick={handleAddShape}
              className="w-full px-3 py-2 rounded bg-surface-3 hover:bg-surface-3/70 text-[13px] text-fg flex items-center gap-2"
              title="Add shape (S)"
            >
              <Square className="h-3.5 w-3.5" />
              Shape
              <span className="ml-auto text-[10px] text-fg-subtle">S</span>
            </button>
          </div>

          {/* Layer panel */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-2">
              Layers
            </div>
            <div className="space-y-1">
              {[...project.layers].reverse().map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`px-2 py-1.5 rounded cursor-pointer flex items-center gap-2 text-[12px] ${
                    selectedLayerId === layer.id
                      ? 'bg-gold/15 text-gold border border-gold/40'
                      : 'bg-surface-3 hover:bg-surface-3/70 text-fg-muted'
                  }`}
                >
                  {layer.kind === 'text' ? (
                    <Type className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <ImageIcon className="h-3 w-3 flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">
                    {layer.kind === 'text'
                      ? (layer as TextLayer).text.slice(0, 16)
                      : layer.kind === 'image'
                      ? 'Background'
                      : layer.kind}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisible(layer.id);
                    }}
                    className="p-0.5 hover:text-fg"
                  >
                    {layer.visible ? (
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

        {/* CANVAS */}
        <div
          ref={stageContainerRef}
          className="flex-1 flex items-center justify-center bg-bg overflow-auto"
        >
          <div style={{ padding: 20 }}>
            <EditorCanvas
              layers={project.layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onUpdateLayer={handleUpdateLayer}
              canvasWidth={dimensions.width}
              canvasHeight={dimensions.height}
              displayScale={displayScale}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 border-l border-border bg-surface-2 flex flex-col">
          {/* Properties (when layer selected) */}
          {selectedLayer && selectedLayer.kind === 'text' && (
            <div className="p-3 border-b border-border">
              <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-2">
                Text
              </div>
              <textarea
                value={(selectedLayer as TextLayer).text}
                onChange={(e) =>
                  handleUpdateLayer(selectedLayer.id, { text: e.target.value })
                }
                className="w-full px-2 py-1.5 rounded bg-surface-3 border border-border text-[13px] text-fg resize-none"
                rows={3}
              />

              <div className="text-[10px] uppercase tracking-wider text-fg-subtle mt-3 mb-2">
                Font
              </div>
              <select
                value={(selectedLayer as TextLayer).fontFamily}
                onChange={(e) =>
                  handleUpdateLayer(selectedLayer.id, { fontFamily: e.target.value })
                }
                className="w-full px-2 py-1.5 rounded bg-surface-3 border border-border text-[12px] text-fg"
              >
                {PREMIUM_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              <div className="text-[10px] uppercase tracking-wider text-fg-subtle mt-3 mb-2">
                Size
              </div>
              <input
                type="range"
                min={16}
                max={200}
                value={(selectedLayer as TextLayer).fontSize}
                onChange={(e) =>
                  handleUpdateLayer(selectedLayer.id, {
                    fontSize: parseInt(e.target.value, 10),
                  })
                }
                className="w-full"
              />
              <div className="text-[11px] text-fg-muted">
                {(selectedLayer as TextLayer).fontSize}px
              </div>

              <div className="text-[10px] uppercase tracking-wider text-fg-subtle mt-3 mb-2">
                Color
              </div>
              <ColorPicker
                value={(selectedLayer as TextLayer).fill}
                onChange={(c) => handleUpdateLayer(selectedLayer.id, { fill: c })}
                brandColors={brandPrimary ? [brandPrimary] : undefined}
              />

              <button
                onClick={() => setRewriteOpen(true)}
                className="mt-3 w-full px-3 py-2 rounded bg-gold/10 text-gold hover:bg-gold/20 text-[12px] flex items-center justify-center gap-1.5 border border-gold/30"
              >
                <Wand2 className="h-3 w-3" />
                Rewrite with AI
              </button>

              {!selectedLayer.locked && (
                <button
                  onClick={() => handleDeleteLayer(selectedLayer.id)}
                  className="mt-3 w-full px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[12px] flex items-center justify-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete layer
                </button>
              )}
            </div>
          )}

          {/* AI Chat */}
          <div className="flex-1 flex flex-col p-3">
            <div className="text-[10px] uppercase tracking-wider text-fg-subtle mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-gold" />
              AI Assistant
            </div>
            <p className="text-[11px] text-fg-muted leading-relaxed mb-3">
              Change the background image. Text layers are preserved.
            </p>

            {error && (
              <div className="mb-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <textarea
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              placeholder="Change background to sunset beach…"
              className="w-full px-2 py-2 rounded bg-surface-3 border border-border text-[12px] text-fg resize-none"
              rows={3}
              disabled={aiBusy}
            />
            <button
              onClick={handleAiEdit}
              disabled={aiBusy || !aiInstruction.trim()}
              className="mt-2 w-full px-3 py-2 rounded bg-gold text-black text-[12px] font-medium hover:bg-gold/90 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {aiBusy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Editing…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
