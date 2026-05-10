'use client';

import { useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Loader2, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  KNOWLEDGE_CATEGORIES,
  type DocumentCategory,
} from '@/lib/knowledge/categories';
import { cn } from '@/lib/utils';
import type { OnboardingData } from './wizard';

const ACCEPT = '.pdf,.docx,.txt,.md,.markdown,.csv,.json,.png,.jpg,.jpeg,.svg';
const MAX_SIZE = 25 * 1024 * 1024;

interface UploadedDoc {
  id: string;
  name: string;
  category: DocumentCategory;
}

export function StepKnowledgeBootstrap({
  data,
  onNext,
  onBack,
}: {
  data: OnboardingData;
  onNext: (d: Partial<OnboardingData>) => void;
  onBack: () => void;
}) {
  const [uploaded, setUploaded] = useState<UploadedDoc[]>([]);
  const [activeDrop, setActiveDrop] = useState<DocumentCategory | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Skip the 'other' category for cleaner UX in onboarding
  const onboardingCategories = KNOWLEDGE_CATEGORIES.filter((c) => c.id !== 'other');

  const handleFiles = useCallback(
    async (files: File[], category: DocumentCategory) => {
      const valid = files.filter((f) => {
        if (f.size > MAX_SIZE) {
          toast.error(`${f.name}: too large (max 25 MB)`);
          return false;
        }
        return true;
      });
      if (valid.length === 0) return;

      setUploadingCount((n) => n + valid.length);

      for (const file of valid) {
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('userCategory', category);

          const res = await fetch('/api/knowledge/upload', {
            method: 'POST',
            body: fd,
          });
          const body = await res.json().catch(() => ({}));

          if (!res.ok) {
            toast.error(`${file.name}: ${body?.error ?? 'upload failed'}`);
            continue;
          }

          // Force category (since user picked the bucket explicitly)
          if (body.id) {
            await fetch('/api/knowledge/update-category', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: body.id, category }),
            }).catch(() => {});

            // Fire processing
            fetch('/api/knowledge/process', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ documentId: body.id }),
            }).catch(() => {});

            setUploaded((prev) => [
              ...prev,
              { id: body.id, name: file.name, category },
            ]);
            toast.success(`${file.name} uploaded`);
          }
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : 'failed'}`);
        } finally {
          setUploadingCount((n) => n - 1);
        }
      }
    },
    [],
  );

  function onDrop(e: DragEvent, category: DocumentCategory) {
    e.preventDefault();
    setActiveDrop(null);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files, category);
  }

  function onFilePick(e: ChangeEvent<HTMLInputElement>, category: DocumentCategory) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files, category);
    e.target.value = '';
  }

  function removeUploaded(id: string) {
    setUploaded((prev) => prev.filter((u) => u.id !== id));
    fetch('/api/knowledge/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <div className="w-full max-w-[920px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">
          Step 4 — Knowledge Bootstrap
        </div>
        <h1 className="font-display text-[32px] mb-2">
          Dale a Operator el contexto que necesita
        </h1>
        <p className="text-[13.5px] text-fg-muted max-w-[560px]">
          Sube documentos clave por categoría. Operator los usará para entender
          tu marca, tu negocio, y tus clientes. Puedes hacerlo después también.
        </p>
      </div>

      {/* 4 category drop zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {onboardingCategories.map((cat) => {
          const Icon = cat.icon;
          const filesInCat = uploaded.filter((u) => u.category === cat.id);
          const isActive = activeDrop === cat.id;
          return (
            <div
              key={cat.id}
              onDragOver={(e) => {
                e.preventDefault();
                setActiveDrop(cat.id);
              }}
              onDragLeave={() => setActiveDrop(null)}
              onDrop={(e) => onDrop(e, cat.id)}
              className={cn(
                'relative rounded-lg border-2 border-dashed transition-colors p-5',
                isActive
                  ? 'border-gold bg-gold/5'
                  : 'border-border bg-surface-2/30 hover:border-border-strong',
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${cat.color}15`, border: `1px solid ${cat.color}40` }}
                >
                  <Icon className="h-5 w-5" style={{ color: cat.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[15px] mb-0.5">{cat.nameEs}</h3>
                  <p className="text-[12px] text-fg-muted leading-snug">{cat.hintEs}</p>
                </div>
              </div>

              {/* Upload button */}
              <label className="block cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept={ACCEPT}
                  onChange={(e) => onFilePick(e, cat.id)}
                  className="sr-only"
                />
                <div className="text-center py-3 rounded-md bg-surface border border-border text-[12px] text-fg-soft hover:bg-surface-2 transition-colors">
                  Arrastra o haz click para subir
                </div>
              </label>

              {/* Uploaded list */}
              {filesInCat.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {filesInCat.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-surface-2 border border-border"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        <span className="text-[12px] text-fg-soft truncate">{u.name}</span>
                      </div>
                      <button
                        onClick={() => removeUploaded(u.id)}
                        className="text-fg-muted hover:text-danger transition-colors shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-2 text-[12.5px] text-gold mb-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Subiendo {uploadingCount} archivo(s)...
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={onBack}>
          ← Atrás
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onNext({ knowledge_uploaded_count: 0 })}
            className="text-fg-muted"
          >
            Saltar por ahora
          </Button>
          <Button
            onClick={() => onNext({ knowledge_uploaded_count: uploaded.length })}
            disabled={uploadingCount > 0}
          >
            {uploaded.length > 0
              ? `Continuar con ${uploaded.length} archivo(s)`
              : 'Continuar'}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
