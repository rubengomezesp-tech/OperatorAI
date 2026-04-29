'use client';

import { useState, useEffect, useCallback } from 'react';
import { Upload, Check, X, ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BrandAsset {
  key: string;
  label: string;
  description: string;
  recommendedSize: string;
}

const ASSETS: BrandAsset[] = [
  {
    key: 'logo-operator',
    label: 'Logo Operator (completo)',
    description: 'Logo completo con texto. Se usa en sidebar, topbar y footer.',
    recommendedSize: 'PNG transparente, mín 600x200px',
  },
  {
    key: 'logo-icon',
    label: 'Logo Icon (cuadrado)',
    description: 'Solo símbolo, sin texto. Para favicon, iOS app icon, sidebar collapsed.',
    recommendedSize: 'PNG cuadrado, 512x512px',
  },
  {
    key: 'operator-avatar',
    label: 'Avatar Operator (chat)',
    description: 'Imagen de perfil del agente en cada mensaje del chat.',
    recommendedSize: 'PNG transparente, 256x256px',
  },
  {
    key: 'operator-bg',
    label: 'Avatar Background (premium)',
    description: 'Imagen grande para fondo de landing y chat. Se aplica con blur.',
    recommendedSize: 'PNG, mín 2000x2000px',
  },
];

export function BrandAssetsManager() {
  const [urls, setUrls] = useState<Record<string, string | null>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [loadingUrls, setLoadingUrls] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/brand-assets', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls || {});
      }
    } catch {
      // silent
    }
    setLoadingUrls(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUpload(key: string, file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo imágenes (PNG, JPG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Máximo 10 MB');
      return;
    }

    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('key', key);
      fd.append('file', file);

      const res = await fetch('/api/admin/brand-assets', {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setUrls((prev) => ({ ...prev, [key]: data.url }));
      toast.success('Subido correctamente');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error subiendo';
      toast.error(msg);
    } finally {
      setUploading(null);
    }
  }

  async function handleDelete(key: string) {
    if (!confirm('¿Eliminar este asset? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/admin/brand-assets?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUrls((prev) => ({ ...prev, [key]: null }));
        toast.success('Eliminado');
      }
    } catch {
      toast.error('Error eliminando');
    }
  }

  return (
    <div className="space-y-6">
      {ASSETS.map((asset) => (
        <AssetCard
          key={asset.key}
          asset={asset}
          currentUrl={urls[asset.key] ?? null}
          uploading={uploading === asset.key}
          onUpload={(file) => handleUpload(asset.key, file)}
          onDelete={() => handleDelete(asset.key)}
          loading={loadingUrls}
        />
      ))}

      <div className="mt-8 p-4 rounded-xl glass-subtle border border-gold/15">
        <div className="text-[12px] text-fg-muted leading-relaxed">
          <span className="font-medium text-fg">Cómo se usan:</span> Cuando subes un asset,
          la URL queda guardada en <code className="text-gold text-[11px]">brand_assets</code> table.
          Componentes como sidebar, topbar y chat avatar leen estas URLs.
          Si no hay asset subido, usan fallbacks por defecto (sparkle icon).
        </div>
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  currentUrl,
  uploading,
  onUpload,
  onDelete,
  loading,
}: {
  asset: BrandAsset;
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  }

  return (
    <div className="rounded-2xl glass-strong p-5 flex flex-col sm:flex-row gap-5 items-start">
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-[18px] tracking-tight text-fg mb-1">
          {asset.label}
        </h3>
        <p className="text-[13px] text-fg-muted leading-relaxed mb-2">{asset.description}</p>
        <p className="text-[11.5px] text-fg-subtle">
          <span className="text-gold">Recomendado:</span> {asset.recommendedSize}
        </p>
      </div>

      <div className="w-full sm:w-[260px] shrink-0">
        {loading ? (
          <div className="h-[160px] rounded-xl glass-subtle flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-fg-subtle animate-spin" />
          </div>
        ) : currentUrl ? (
          <div className="space-y-2">
            <div className="relative h-[140px] rounded-xl glass-subtle overflow-hidden flex items-center justify-center bg-bg/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt={asset.label}
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute top-1.5 right-1.5">
                <button
                  type="button"
                  onClick={onDelete}
                  className="h-7 w-7 rounded-full bg-bg/80 hover:bg-red-500/20 border border-border hover:border-red-500/40 flex items-center justify-center text-fg-muted hover:text-red-400 transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            <label
              className={cn(
                'block w-full h-9 rounded-lg border border-border hover:border-gold/40 text-center text-[12px] text-fg-muted hover:text-fg leading-9 cursor-pointer transition-colors',
                uploading && 'opacity-50 pointer-events-none'
              )}
            >
              {uploading ? 'Subiendo...' : 'Reemplazar'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              'block h-[160px] rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center text-center px-4',
              dragOver
                ? 'border-gold/60 bg-gold/5'
                : 'border-border hover:border-gold/40',
              uploading && 'opacity-50 pointer-events-none'
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = '';
              }}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-fg-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[12px]">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-fg-muted">
                <Upload className="h-5 w-5" />
                <span className="text-[12px]">Arrastra o click</span>
              </div>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
