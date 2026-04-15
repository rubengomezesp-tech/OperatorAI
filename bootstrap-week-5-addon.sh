#!/usr/bin/env bash
set -euo pipefail

echo ">>> Operator AI - Week 5 addon"
echo ">>> Upgrade to Flux 2 Pro + reference images"
echo ""

cd "$(dirname "$0")"

if [ ! -f package.json ]; then
  echo "ERROR: run from /Users/macbook/operator-ai"
  exit 1
fi

echo ">>> Creating directories..."
mkdir -p src/app/api/images/upload-reference

echo ">>> Upgrading Flux client to Flux 2 Pro with reference images..."

cat > src/features/image-studio/server/flux-client.ts << 'EOFFLUX'
import 'server-only';
import Replicate from 'replicate';
import { serverEnv } from '@/lib/env';

export interface GenerateInput {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:5' | '3:2';
  seed?: number;
  referenceImageUrls?: string[];
}

export interface GenerateOutput {
  urls: string[];
  seed: number;
  latencyMs: number;
}

const ASPECT_TO_SIZE: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 1024, h: 1024 },
  '16:9': { w: 1344, h: 768 },
  '9:16': { w: 768,  h: 1344 },
  '4:5':  { w: 896,  h: 1120 },
  '3:2':  { w: 1216, h: 832 },
};

export async function generateWithFlux(input: GenerateInput): Promise<GenerateOutput> {
  if (!serverEnv.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN not set');

  const client = new Replicate({ auth: serverEnv.REPLICATE_API_TOKEN });
  const seed = input.seed ?? Math.floor(Math.random() * 2147483647);
  const started = Date.now();
  const size = ASPECT_TO_SIZE[input.aspectRatio] ?? ASPECT_TO_SIZE['1:1'];

  const hasReferences = input.referenceImageUrls && input.referenceImageUrls.length > 0;

  // Build input payload for FLUX.2 Pro
  const payload: Record<string, unknown> = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    width: size.w,
    height: size.h,
    output_format: 'png',
    seed,
  };

  // FLUX.2 Pro accepts up to 8 reference images
  if (hasReferences) {
    payload.input_images = input.referenceImageUrls!.slice(0, 8);
  }

  const output = await client.run(
    'black-forest-labs/flux-2-pro',
    { input: payload },
  );

  const urls = normalizeReplicateOutput(output);
  if (urls.length === 0) throw new Error('Flux returned no images');

  return {
    urls,
    seed,
    latencyMs: Date.now() - started,
  };
}

function normalizeReplicateOutput(output: unknown): string[] {
  const urls: string[] = [];
  if (typeof output === 'string') {
    urls.push(output);
  } else if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === 'string') urls.push(item);
      else if (item && typeof item === 'object' && 'url' in item) {
        const maybeUrl = (item as { url: unknown }).url;
        if (typeof maybeUrl === 'function') {
          const resolved = (maybeUrl as () => URL | string)();
          urls.push(typeof resolved === 'string' ? resolved : resolved.toString());
        } else if (typeof maybeUrl === 'string') {
          urls.push(maybeUrl);
        }
      }
    }
  } else if (output && typeof output === 'object') {
    const maybeUrl = (output as { url?: unknown }).url;
    if (typeof maybeUrl === 'function') {
      const resolved = (maybeUrl as () => URL | string)();
      urls.push(typeof resolved === 'string' ? resolved : resolved.toString());
    } else if (typeof maybeUrl === 'string') {
      urls.push(maybeUrl);
    }
  }
  return urls;
}

/**
 * Rewrites user brief into a rich image prompt. If reference images are provided,
 * the prompt style also asks the model to describe how references should be used.
 */
export async function enhancePrompt(
  userPrompt: string,
  presetHint: string,
  hasReferences: boolean,
): Promise<string> {
  if (!serverEnv.OPENAI_API_KEY) return userPrompt;

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });

  const refHint = hasReferences
    ? ' The user has attached reference images - their style, subject, lighting, or composition should guide the output. When appropriate, reference them with phrases like "in the style of the reference" or "matching the mood of the reference".'
    : '';

  const system =
    'You are an expert visual art director. Rewrite the user\'s brief into a rich, descriptive image prompt for Flux 2 Pro. Be specific about subject details, lighting, color palette, texture, camera angle, composition, and mood. Keep it under 100 words. No preamble, only the prompt itself. Preset vibe: ' +
    presetHint + '.' + refHint;

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  const text = res.choices[0]?.message?.content?.trim();
  return text || userPrompt;
}
EOFFLUX
echo "OK flux-client.ts"

echo ">>> Writing reference image upload API..."

cat > src/app/api/images/upload-reference/route.ts << 'EOFREF'
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(req: NextRequest) {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });

  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, WebP, GIF allowed' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = (file.name.match(/\.[^.]+$/)?.[0] ?? '.png').toLowerCase();
  const path = orgId + '/ref-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;

  const { error: upErr } = await svc.storage
    .from('image-references')
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Return a 24h signed URL so Replicate can fetch it during generation
  const { data: signed, error: sErr } = await svc.storage
    .from('image-references')
    .createSignedUrl(path, 60 * 60 * 24);

  if (sErr || !signed) {
    await svc.storage.from('image-references').remove([path]).catch(() => {});
    return NextResponse.json({ error: sErr?.message ?? 'Signed URL failed' }, { status: 500 });
  }

  return NextResponse.json({
    path,
    url: signed.signedUrl,
  });
}
EOFREF
echo "OK upload-reference route"

echo ">>> Upgrading image generation API to accept references..."

cat > src/app/api/images/generate/route.ts << 'EOFGEN'
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { generateWithFlux, enhancePrompt } from '@/features/image-studio/server/flux-client';
import { IMAGE_PRESETS } from '@/features/image-studio/data/presets';

export const runtime = 'nodejs';
export const maxDuration = 120;

const BodySchema = z.object({
  prompt: z.string().min(2).max(2000),
  preset: z.string().optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).default('1:1'),
  seed: z.number().int().optional(),
  enhance: z.boolean().default(true),
  referenceUrls: z.array(z.string().url()).max(8).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  let orgId: string;
  try {
    orgId = (await resolveOrgContext(svc, user.id)).orgId;
  } catch {
    return NextResponse.json({ error: 'No active workspace' }, { status: 403 });
  }

  const preset = IMAGE_PRESETS.find((p) => p.id === body.preset);
  const hasReferences = Array.isArray(body.referenceUrls) && body.referenceUrls.length > 0;

  let enhanced = body.prompt;
  if (body.enhance) {
    try {
      enhanced = await enhancePrompt(body.prompt, preset?.hint ?? 'editorial', hasReferences);
    } catch {
      enhanced = body.prompt;
    }
  }

  const fullPrompt = preset
    ? preset.promptPrefix + enhanced + preset.promptSuffix
    : enhanced;

  const pendingRow = {
    org_id: orgId,
    user_id: user.id,
    prompt: body.prompt,
    enhanced_prompt: enhanced,
    negative_prompt: preset?.negativePrompt ?? null,
    preset: body.preset ?? null,
    aspect_ratio: body.aspectRatio,
    seed: body.seed ?? null,
    reference_storage_path: hasReferences ? body.referenceUrls!.join(',') : null,
    provider: 'replicate',
    model: 'flux-2-pro',
    status: 'processing',
  } as never;

  const { data: created, error: insErr } = await svc
    .from('image_generations')
    .insert(pendingRow)
    .select('id')
    .single();

  if (insErr || !created) {
    return NextResponse.json({ error: insErr?.message ?? 'Failed to create record' }, { status: 500 });
  }
  const imageId = (created as { id: string }).id;

  try {
    const result = await generateWithFlux({
      prompt: fullPrompt,
      aspectRatio: body.aspectRatio,
      seed: body.seed,
      referenceImageUrls: body.referenceUrls,
    });

    // Persist output images to Supabase storage
    const storagePaths: string[] = [];
    for (let i = 0; i < result.urls.length; i++) {
      const url = result.urls[i];
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        const path = orgId + '/' + imageId + '-' + i + '.png';
        const { error: upErr } = await svc.storage
          .from('image-outputs')
          .upload(path, buffer, { contentType: 'image/png', cacheControl: '3600', upsert: true });
        if (!upErr) storagePaths.push(path);
      } catch {
        // continue with remote URL only
      }
    }

    // Flux 2 Pro: ~$0.03-0.06 per image depending on megapixels
    const baseCost = hasReferences ? 0.06 : 0.03;
    const costUsd = baseCost * result.urls.length;

    await svc
      .from('image_generations')
      .update({
        status: 'complete',
        output_urls: result.urls,
        output_storage_paths: storagePaths,
        seed: result.seed,
        latency_ms: result.latencyMs,
        cost_usd: costUsd,
      } as never)
      .eq('id', imageId);

    await svc.rpc('increment_usage', {
      p_org_id: orgId,
      p_kind: 'image_generation',
      p_quantity: 1,
      p_cost: costUsd,
    });

    return NextResponse.json({
      id: imageId,
      urls: result.urls,
      storagePaths,
      seed: result.seed,
      enhancedPrompt: enhanced,
      latencyMs: result.latencyMs,
      costUsd,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    await svc
      .from('image_generations')
      .update({ status: 'failed', error_message: message } as never)
      .eq('id', imageId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOFGEN
echo "OK generate route"

echo ">>> Writing reference image uploader component..."

cat > src/features/image-studio/components/reference-uploader.tsx << 'EOFUPLOAD'
'use client';
import { useState, useCallback, type ChangeEvent, type DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ReferenceImage {
  url: string;
  path: string;
}

interface Props {
  value: ReferenceImage[];
  onChange: (next: ReferenceImage[]) => void;
  maxImages?: number;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE = 10 * 1024 * 1024;

export function ReferenceUploader({ value, onChange, maxImages = 4 }: Props) {
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (files: File[]) => {
    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      toast.error('Max ' + maxImages + ' reference images');
      return;
    }
    const toUpload = files.slice(0, remaining).filter((f) => {
      if (f.size > MAX_SIZE) {
        toast.error(f.name + ': too large (max 10 MB)');
        return false;
      }
      return true;
    });
    if (toUpload.length === 0) return;

    setUploading((n) => n + toUpload.length);

    for (const file of toUpload) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(body?.error ?? 'Upload failed');
        } else {
          onChange([...value, { url: body.url, path: body.path }]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }, [maxImages, value, onChange]);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  }

  function removeAt(i: number) {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  }

  const canAddMore = value.length < maxImages;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {value.map((img, i) => (
          <div key={i} className="relative group aspect-square rounded-md overflow-hidden border border-border bg-surface-2">
            <Image
              src={img.url}
              alt={'Reference ' + (i + 1)}
              fill
              sizes="120px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-1 right-1 h-6 w-6 rounded-md bg-bg/80 backdrop-blur-md border border-border text-fg-muted hover:text-danger hover:border-danger/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 left-1 h-5 px-1.5 rounded bg-bg/80 backdrop-blur-md border border-border text-[9.5px] uppercase tracking-[0.12em] text-fg-muted flex items-center">
              Ref {i + 1}
            </div>
          </div>
        ))}

        {canAddMore && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'relative aspect-square rounded-md border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5',
              dragOver
                ? 'border-gold bg-gold/5'
                : 'border-border bg-surface-2 hover:border-border-strong hover:bg-surface-3',
            )}
          >
            <input
              type="file"
              multiple
              accept={ACCEPT}
              onChange={onInputChange}
              className="sr-only"
            />
            {uploading > 0 ? (
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-gold" />
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-fg-muted">
                  Add
                </span>
              </>
            )}
          </label>
        )}

        {/* Pad empty slots up to maxImages for visual balance */}
        {Array.from({ length: Math.max(0, maxImages - value.length - (canAddMore ? 1 : 0)) }).map((_, i) => (
          <div key={'pad-' + i} className="aspect-square rounded-md border border-dashed border-border/40 bg-surface-2/30" />
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-fg-subtle">
        <span>
          {value.length}/{maxImages} references · Flux 2 Pro uses them for style, subject, and composition.
        </span>
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-fg-muted hover:text-fg"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
EOFUPLOAD
echo "OK reference-uploader.tsx"

echo ">>> Rewriting Image Studio view with reference support..."

cat > src/features/image-studio/components/image-studio-view.tsx << 'EOFVIEW'
'use client';
import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/input';
import { PresetPicker } from './preset-picker';
import { AspectPicker } from './aspect-picker';
import { ImageCard, type ImageItem } from './image-card';
import { ReferenceUploader, type ReferenceImage } from './reference-uploader';
import type { AspectRatioId } from '../data/presets';

export function ImageStudioView() {
  const [prompt, setPrompt] = useState('');
  const [preset, setPreset] = useState<string | null>('editorial');
  const [aspect, setAspect] = useState<AspectRatioId>('1:1');
  const [enhance, setEnhance] = useState(true);
  const [references, setReferences] = useState<ReferenceImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/images/list');
    const data = await res.json();
    setImages(data.images ?? []);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function generate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);

    const tempId = 'temp-' + Date.now();
    const placeholder: ImageItem = {
      id: tempId,
      prompt,
      enhanced_prompt: null,
      preset,
      aspect_ratio: aspect,
      is_starred: false,
      status: 'processing',
      display_urls: [],
      created_at: new Date().toISOString(),
      error_message: null,
    };
    setImages((prev) => [placeholder, ...prev]);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          preset: preset ?? undefined,
          aspectRatio: aspect,
          enhance,
          referenceUrls: references.length > 0 ? references.map((r) => r.url) : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Generation failed');

      toast.success('Image ready');
      setPrompt('');
      setReferences([]);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
      setImages((prev) => prev.filter((i) => i.id !== tempId));
    } finally {
      setGenerating(false);
    }
  }

  async function onStar(id: string, starred: boolean) {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: starred } : i)));
    await fetch('/api/images/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, starred }),
    }).catch(() => {
      setImages((prev) => prev.map((i) => (i.id === id ? { ...i, is_starred: !starred } : i)));
    });
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this image?')) return;
    setImages((prev) => prev.filter((i) => i.id !== id));
    await fetch('/api/images/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }

  const visible = filter === 'starred' ? images.filter((i) => i.is_starred) : images;

  return (
    <div className="space-y-8">
      <div className="surface-raised p-6 space-y-5">
        <div>
          <Label htmlFor="prompt">What to generate</Label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A minimalist still life of a crystal perfume bottle on warm marble, soft morning light..."
            rows={3}
            className="w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:bg-surface-3 focus:ring-2 focus:ring-gold/15 resize-none"
          />
          <div className="mt-2 flex items-center gap-2 text-[11.5px] text-fg-subtle">
            <Wand2 className="h-3 w-3 text-gold" />
            <span>
              {enhance
                ? 'Prompt enhancer is on — your brief gets rewritten with expert detail.'
                : 'Prompt enhancer is off — your text is used raw.'}
            </span>
            <button
              type="button"
              onClick={() => setEnhance((v) => !v)}
              className="text-gold hover:underline"
            >
              {enhance ? 'Turn off' : 'Turn on'}
            </button>
          </div>
        </div>

        <div>
          <Label>
            Reference images <span className="text-fg-subtle normal-case tracking-normal">(optional)</span>
          </Label>
          <ReferenceUploader
            value={references}
            onChange={setReferences}
            maxImages={4}
          />
        </div>

        <div>
          <Label>Preset</Label>
          <PresetPicker value={preset} onChange={setPreset} />
        </div>

        <div>
          <Label>Aspect ratio</Label>
          <AspectPicker value={aspect} onChange={setAspect} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
            <ImageIcon className="h-3 w-3 text-gold" />
            <span>Flux 2 Pro · {references.length > 0 ? '~9 sec with references' : '~6 sec'}</span>
          </div>
          <Button
            size="md"
            onClick={generate}
            disabled={!prompt.trim() || generating}
            loading={generating}
          >
            {!generating && <Sparkles className="h-4 w-4" />}
            <span>{generating ? 'Generating...' : 'Generate'}</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">Library</h2>
        <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface-2">
          {(['all', 'starred'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                'h-7 px-3 rounded text-[12px] transition-colors ' +
                (filter === f ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg')
              }
            >
              {f === 'all' ? 'All' : 'Starred'}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <Loader2 className="h-8 w-8 text-gold/40 mx-auto mb-3" />
          <p className="text-[13.5px] text-fg-muted">
            {filter === 'starred' ? 'No starred images yet.' : 'No images yet. Your first generation takes ~6 seconds.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((img) => (
            <ImageCard key={img.id} img={img} onStar={onStar} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
EOFVIEW
echo "OK image-studio-view.tsx"

echo ""
echo ">>> Running typecheck..."
pnpm typecheck 2>&1 | tail -15

echo ""
echo "========================================"
echo "  Week 5 addon complete."
echo "========================================"
echo ""
echo "What's new:"
echo "  * Upgraded to FLUX 2 Pro (6 sec generation, 9 sec with references)"
echo "  * Upload up to 4 reference images per generation"
echo "  * Image-to-image: references guide style, subject, composition"
echo "  * Prompt enhancer adapts when references are attached"
echo "  * Lower cost per image with Flux 2"
echo ""
echo "Try it at http://localhost:3000/studio/image"
echo ""
