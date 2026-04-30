'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Pencil, Send, Download, FileText, BookOpen, Image as ImageIcon, Video, Loader2, AlertCircle, X, Undo2, Brush, Eraser, Sparkles, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolKind = 'image' | 'video' | 'file_analysis' | 'knowledge_search';
export type ToolStatus = 'running' | 'done' | 'failed';

export interface ToolPart {
  id: string;
  kind: ToolKind;
  status: ToolStatus;
  input: Record<string, unknown>;
  result?: {
    urls?: string[];
    videoUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    sources?: Array<{ title: string; id: string }>;
  };
  error?: string;
  attachmentUrls?: string[];
  createdAt: string;
}

export function ToolResult({ part }: { part: ToolPart }) {
  if (part.status === 'running') {
    if (part.kind === 'image') {
      return <ImageGeneratingSkeleton aspectRatio={(part.input.aspect_ratio as string) || '1:1'} />;
    }
    return <ToolRunningCard kind={part.kind} input={part.input} />;
  }
  if (part.status === 'failed') return <ToolFailedCard kind={part.kind} error={part.error} />;

  if (part.kind === 'image') {
    const urls = part.result?.urls ?? [];
    return (
      <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {urls.map((url, i) => (
          <ImageTile key={url + i} url={url} />
        ))}
      </div>
    );
  }

  if (part.kind === 'video' && part.result?.videoUrl) {
    const v = part.result.videoUrl;
    return (
      <div className="my-3 rounded-lg overflow-hidden border border-border bg-surface-2">
        <video src={v} controls className="w-full h-auto block" preload="metadata" />
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[11.5px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><Video className="h-3 w-3 text-gold" />Generated video</span>
          <a href={v} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 hover:text-gold transition-colors">
            <Download className="h-3 w-3" />Download
          </a>
        </div>
      </div>
    );
  }

  if (part.kind === 'file_analysis' && part.result?.text) {
    return (
      <div className="my-3 rounded-lg border border-border/60 bg-surface-2/50 p-3.5">
        <div className="flex items-center gap-2 text-[11.5px] text-fg-muted mb-2">
          <FileText className="h-3 w-3 text-gold" />
          Analysis result
        </div>
        <div className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{part.result.text}</div>
      </div>
    );
  }

  if (part.kind === 'knowledge_search' && part.result?.text) {
    return (
      <div className="my-3 rounded-lg border border-border/60 bg-surface-2/50 p-3.5">
        <div className="flex items-center gap-2 text-[11.5px] text-fg-muted mb-2">
          <BookOpen className="h-3 w-3 text-gold" />
          From knowledge base
        </div>
        <div className="text-[13.5px] text-fg whitespace-pre-wrap leading-relaxed">{part.result.text}</div>
      </div>
    );
  }

  return null;
}

function ToolRunningCard({ kind, input }: { kind: ToolKind; input: Record<string, unknown> }) {
  const Icon = kind === 'image' ? ImageIcon : kind === 'video' ? Video : kind === 'file_analysis' ? FileText : BookOpen;
  const label =
    kind === 'image' ? 'Composing visual' :
    kind === 'video' ? 'Rendering video' :
    kind === 'file_analysis' ? 'Analyzing file' : 'Searching knowledge';
  const subtitle =
    kind === 'image' ? (input.prompt as string)?.slice(0, 80) :
    kind === 'video' ? (input.prompt as string)?.slice(0, 80) :
    kind === 'file_analysis' ? 'Reading content' : (input.query as string)?.slice(0, 80);

  return (
    <div className="my-3 inline-flex items-start gap-2.5 rounded-lg border border-gold/20 bg-gold/5 px-3.5 py-2.5">
      <div className="relative shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-gold" />
        <span className="absolute inset-0 rounded-full animate-ping bg-gold/20" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12.5px] text-fg">{label}</span>
          <span className="flex gap-0.5">
            <span className="inline-block h-1 w-1 rounded-full bg-gold animate-pulse-dot" />
            <span className="inline-block h-1 w-1 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.18s' }} />
            <span className="inline-block h-1 w-1 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.36s' }} />
          </span>
        </div>
        {subtitle && <div className="text-[11.5px] text-fg-muted mt-0.5 truncate">{subtitle}</div>}
      </div>
    </div>
  );
}

function ToolFailedCard({ kind, error }: { kind: ToolKind; error?: string }) {
  const label = kind === 'image' ? 'Image failed' : kind === 'video' ? 'Video failed' : kind === 'file_analysis' ? 'Analysis failed' : 'Search failed';
  return (
    <div className="my-3 inline-flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3.5 py-2.5">
      <AlertCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
      <div><div className="text-[12.5px] text-fg">{label}</div>{error && <div className="text-[11.5px] text-fg-muted mt-0.5">{error}</div>}</div>
    </div>
  );
}

function ImageGeneratingSkeleton({ aspectRatio }: { aspectRatio: string }) {
  const ratioMap: Record<string, string> = {
    '1:1': '100%',
    '16:9': '56.25%',
    '9:16': '177.78%',
    '4:5': '125%',
    '3:2': '66.67%',
  };
  const padBottom = ratioMap[aspectRatio] ?? '100%';

  return (
    <div className="my-3 max-w-[420px]">
      <div
        className="relative w-full rounded-2xl overflow-hidden glass-strong floating border border-gold/15"
        style={{ paddingBottom: padBottom }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-surface-3 to-surface-2" />
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-gold/15 to-transparent bg-[length:200%_200%] animate-shimmer"
          style={{ backgroundPosition: '0% 0%' }}
        />
        <div className="absolute inset-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white/40 animate-pulse-dot"
              style={{
                left: `${(i * 13 + 7) % 90 + 5}%`,
                top: `${(i * 19 + 11) % 80 + 10}%`,
                animationDelay: `${(i * 0.18) % 2}s`,
                animationDuration: `${1.2 + (i % 3) * 0.4}s`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-gold/10 blur-2xl animate-pulse-dot" />
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
          </div>
          <div className="text-[11.5px] text-fg-muted/80 font-medium tracking-wide uppercase">
            Componiendo visual
          </div>
        </div>
      </div>
    </div>
  );
}

export function ImageTile({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="relative rounded-2xl overflow-hidden glass-subtle group">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-2">
          <Loader2 className="h-4 w-4 text-fg-muted animate-spin" />
        </div>
      )}
      <img
        src={url}
        alt=""
        onLoad={() => setLoaded(true)}
        className="w-full h-auto block cursor-pointer"
        onClick={() => setEditOpen(true)}
      />

      {loaded && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[12px] font-medium hover:bg-white/20 transition-colors"
          >
            <Pencil className="h-3 w-3" strokeWidth={2.5} />
            Editar
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Descargar"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <ImageEditModal open={editOpen} onClose={() => setEditOpen(false)} imageUrl={url} />
    </div>
  );
}

function ImageEditModal({ open, onClose, imageUrl }: { open: boolean; onClose: () => void; imageUrl: string }) {
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const [prompt, setPrompt] = useState('');
  const [showEditInput, setShowEditInput] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [showAspectMenu, setShowAspectMenu] = useState(false);

  const currentImage = history[history.length - 1];
  const canUndo = history.length > 1;

  useEffect(() => {
    setHistory([imageUrl]);
    setPrompt('');
    setShowEditInput(false);
    setMaskDataUrl(null);
    setSelectMode(false);

    // Fetch persistent history from DB
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/images/history?url=${encodeURIComponent(imageUrl)}`);
        if (!res.ok) return;
        const data = await res.json() as { versions?: string[] };
        if (!cancelled && data.versions && data.versions.length > 1) {
          setHistory(data.versions);
        }
      } catch { /* graceful */ }
    })();
    return () => { cancelled = true; };
  }, [imageUrl]);

  useEffect(() => {
    if (!selectMode || !imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const setupCanvas = () => {
      canvas.width = img.naturalWidth || 1024;
      canvas.height = img.naturalHeight || 1024;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    if (img.complete) setupCanvas();
    else img.onload = setupCanvas;
  }, [selectMode, currentImage]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const isTouch = 'touches' in e;
    const clientX = isTouch ? (e.touches[0]?.clientX ?? 0) : (e as React.MouseEvent).clientX;
    const clientY = isTouch ? (e.touches[0]?.clientY ?? 0) : (e as React.MouseEvent).clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const drawAt = useCallback((p: { x: number; y: number }) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const last = lastPointRef.current;
    ctx.fillStyle = 'rgba(99, 102, 241, 0.55)';
    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
    ctx.shadowBlur = brushSize * 0.4;

    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / (brushSize * 0.3)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = last.x + (p.x - last.x) * t;
        const y = last.y + (p.y - last.y) * t;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    lastPointRef.current = p;
  }, [brushSize]);

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (!selectMode) return;
    e.preventDefault();
    const p = getCanvasPoint(e);
    if (!p) return;
    isDrawingRef.current = true;
    lastPointRef.current = null;
    drawAt(p);
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!selectMode || !isDrawingRef.current) return;
    e.preventDefault();
    const p = getCanvasPoint(e);
    if (!p) return;
    drawAt(p);
  }

  function handleEnd() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearMask() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function applyMask() {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    const maskImageData = maskCtx.createImageData(canvas.width, canvas.height);
    const maskData = maskImageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 30) {
        maskData[i] = 255;
        maskData[i + 1] = 255;
        maskData[i + 2] = 255;
        maskData[i + 3] = 255;
      } else {
        maskData[i + 3] = 0;
      }
    }

    maskCtx.putImageData(maskImageData, 0, 0);
    const dataUrl = maskCanvas.toDataURL('image/png');
    setMaskDataUrl(dataUrl);
    setSelectMode(false);
    setShowEditInput(true);
  }

  function cancelSelect() {
    clearMask();
    setSelectMode(false);
    setMaskDataUrl(null);
  }

  async function handleEdit(customPrompt?: string, aspectRatio?: '1:1' | '9:16' | '4:5' | '16:9') {
    const text = (customPrompt || prompt).trim();
    if (!text || generating) return;

    setGenerating(true);
    try {
      const body: Record<string, unknown> = {
        prompt: text,
        aspectRatio: aspectRatio || '1:1',
        model: 'gpt-image-1',
        enhance: false,
        referenceUrls: [currentImage],
      };

      if (maskDataUrl) {
        body.mask = maskDataUrl.split(',')[1];
      }

      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Edit failed');
      }

      const data = await res.json() as { url?: string; urls?: string[] };
      const newUrl = data.url || data.urls?.[0];
      if (!newUrl) throw new Error('No image returned');

      setHistory((h) => [...h, newUrl]);
      setPrompt('');
      setShowEditInput(false);
      setMaskDataUrl(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Edit failed';
      alert(msg);
    } finally {
      setGenerating(false);
    }
  }

  function handleUndo() {
    if (!canUndo) return;
    setHistory((h) => h.slice(0, -1));
    setMaskDataUrl(null);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    }
    if (e.key === 'Escape') {
      setShowEditInput(false);
      setPrompt('');
    }
  }

  const QUICK_ACTIONS = [
    { label: 'Limpiar fondo', prompt: 'Remove the background completely, leaving only the main subject on a clean white background' },
    { label: 'Quitar texto', prompt: 'Remove all text, watermarks and labels from the image while preserving the rest naturally' },
    { label: 'Más minimalista', prompt: 'Make the image more minimalist, cleaner composition, less visual noise, premium aesthetic' },
    { label: 'Mejorar calidad', prompt: 'Enhance the image quality, sharpen details, improve lighting and colors, professional grade' },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-bg/95 backdrop-blur-xl z-40" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col">
          <Dialog.Title className="sr-only">Editar imagen</Dialog.Title>

          <div className="absolute top-0 inset-x-0 z-20 px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[12px] text-fg-muted">
              <span className="text-gold">⏵</span>
              <span>Operator · Editor</span>
              {history.length > 1 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10.5px] tracking-wide">
                  v{history.length}
                </span>
              )}
              {maskDataUrl && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10.5px]">
                  Área seleccionada
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { setSelectMode(true); setShowEditInput(false); setShowAspectMenu(false); }}
                disabled={generating || selectMode}
                className={cn(
                  'h-9 px-3 rounded-full glass-subtle border flex items-center gap-1.5 text-[12px] transition-all',
                  selectMode ? 'border-indigo-500/50 text-indigo-300' : 'border-border/40 text-fg hover:border-gold/40 hover:text-gold',
                  generating && 'opacity-30 cursor-not-allowed',
                )}
              >
                <Brush className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Select Area</span>
              </button>

              <button
                type="button"
                onClick={() => { setShowAspectMenu(!showAspectMenu); setShowEditInput(false); setSelectMode(false); }}
                disabled={generating}
                className="h-9 px-3 rounded-full glass-subtle border border-border/40 flex items-center gap-1.5 text-[12px] text-fg hover:border-gold/40 hover:text-gold transition-all disabled:opacity-30"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Aspect</span>
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo || generating}
                className={cn(
                  'h-9 w-9 rounded-full glass-subtle border border-border/40 flex items-center justify-center text-fg transition-all',
                  canUndo && !generating ? 'hover:border-gold/40 hover:text-gold' : 'opacity-30 cursor-not-allowed',
                )}
                aria-label="Deshacer"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>

              <a
                href={currentImage}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="h-9 w-9 rounded-full glass-subtle border border-border/40 flex items-center justify-center text-fg hover:border-gold/40 hover:text-gold transition-all"
                aria-label="Guardar"
              >
                <Download className="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-full glass-subtle border border-border/40 flex items-center justify-center text-fg hover:border-red-500/40 hover:text-red-400 transition-all"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showAspectMenu && (
            <div className="absolute top-16 right-4 sm:right-6 z-30 rounded-2xl glass-strong border border-border/40 p-2 shadow-2xl">
              <div className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle px-2 py-1.5">Cambiar formato</div>
              {[
                { ratio: '1:1' as const, label: 'Cuadrado · Post' },
                { ratio: '9:16' as const, label: 'Vertical · Story' },
                { ratio: '4:5' as const, label: 'Vertical · IG' },
                { ratio: '16:9' as const, label: 'Horizontal · Web' },
              ].map((opt) => (
                <button
                  key={opt.ratio}
                  type="button"
                  onClick={() => {
                    setShowAspectMenu(false);
                    handleEdit(`Reframe and expand the image to ${opt.ratio} aspect ratio, keeping the main subject centered, extending the background naturally with AI outpainting`, opt.ratio);
                  }}
                  disabled={generating}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 text-left transition-colors disabled:opacity-50"
                >
                  <span className="text-[12px] font-mono text-gold">{opt.ratio}</span>
                  <span className="text-[12px] text-fg">{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center p-6 sm:p-12 min-h-0 relative">
            <div className="relative max-w-full max-h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={currentImage}
                alt=""
                className={cn(
                  'max-w-full max-h-full rounded-2xl shadow-2xl transition-opacity block',
                  generating && 'opacity-40',
                )}
                style={{ maxHeight: 'calc(100vh - 240px)' }}
                crossOrigin="anonymous"
              />

              {selectMode && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full rounded-2xl cursor-crosshair touch-none"
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                />
              )}

              {generating && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass-strong">
                    <Loader2 className="h-4 w-4 text-gold animate-spin" />
                    <span className="text-[12px] text-fg uppercase tracking-wide">
                      {maskDataUrl ? 'Editando zona' : 'Aplicando edición'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 z-20 px-4 sm:px-8 pb-6">
            <div className="max-w-2xl mx-auto">
              {selectMode && (
                <div className="rounded-2xl glass-strong border border-indigo-500/30 p-3 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <Brush className="h-3.5 w-3.5 text-indigo-300 shrink-0" />
                      <span className="text-[11px] text-fg-muted shrink-0">Pincel</span>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="flex-1 accent-indigo-400"
                      />
                      <span className="text-[11px] text-fg w-8 text-right">{brushSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={clearMask}
                      className="h-9 px-3 rounded-full hover:bg-surface-2 flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-fg transition-colors"
                    >
                      <Eraser className="h-3.5 w-3.5" />
                      Limpiar
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelSelect}
                        className="h-9 px-4 rounded-full text-[12px] text-fg-muted hover:text-fg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={applyMask}
                        className="h-9 px-4 rounded-full gold-grad text-bg text-[12.5px] font-medium hover:brightness-110 transition-all"
                      >
                        Aplicar selección
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!selectMode && showEditInput && (
                <div className="rounded-2xl glass-strong border border-gold/20 p-3 shadow-2xl space-y-2">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder={maskDataUrl ? 'Describe el cambio para la zona seleccionada...' : 'Quita el fondo · Hazlo más minimalista · Cambia el color a negro...'}
                      rows={2}
                      className="flex-1 bg-transparent resize-none outline-none text-[14.5px] text-fg placeholder:text-fg-subtle max-h-32 px-2"
                      autoFocus
                      disabled={generating}
                    />
                    <button
                      type="button"
                      onClick={() => handleEdit()}
                      disabled={!prompt.trim() || generating}
                      className="h-10 px-4 rounded-full gold-grad flex items-center gap-2 text-bg text-[13px] font-medium hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      Aplicar
                    </button>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <button
                      type="button"
                      onClick={() => { setShowEditInput(false); setPrompt(''); setMaskDataUrl(null); }}
                      className="text-[11px] text-fg-subtle hover:text-fg transition-colors"
                      disabled={generating}
                    >
                      Cancelar
                    </button>
                    <span className="text-[10.5px] text-fg-subtle">Enter para aplicar · Esc para cerrar</span>
                  </div>
                </div>
              )}

              {!selectMode && !showEditInput && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => handleEdit(action.prompt)}
                        disabled={generating}
                        className="h-8 px-3 rounded-full glass-subtle border border-border/40 text-[11.5px] text-fg-soft hover:border-gold/40 hover:text-gold transition-all disabled:opacity-30"
                      >
                        <Sparkles className="h-2.5 w-2.5 inline-block mr-1 -mt-0.5" />
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setShowEditInput(true)}
                      disabled={generating}
                      className="h-11 px-5 rounded-full gold-grad flex items-center gap-2 text-bg text-[13.5px] font-medium hover:brightness-110 transition-all shadow-2xl disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2.5} />
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
