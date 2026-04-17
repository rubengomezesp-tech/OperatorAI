'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, Video, Trash2, Download, Play, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { VIDEO_MODELS, VIDEO_PRESETS, ASPECT_RATIOS } from '../data/presets';

interface VideoRow {
  id: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  duration_seconds: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  error_message: string | null;
  cost_usd: number | null;
  created_at: string;
  completed_at: string | null;
}

export function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const { t } = useI18n();
  const [model, setModel] = useState(VIDEO_MODELS[1].id);
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [refImage, setRefImage] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [polling, setPolling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/video/list');
      if (!res.ok) return;
      const body = await res.json();
      setVideos(body.videos ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Poll while there are processing videos
  useEffect(() => {
    const hasProcessing = videos.some((v) => v.status === 'processing' || v.status === 'pending');
    if (!hasProcessing) return;

    setPolling(true);
    const interval = setInterval(fetchVideos, 8000);
    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [videos, fetchVideos]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large (max 5 MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setRefImage({ base64, mime: file.type, preview: result });
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          aspectRatio: aspect,
          durationSeconds: duration,
          ...(refImage ? { imageBase64: refImage.base64, imageMimeType: refImage.mime } : {}),
        }),
      });
      const body = await res.json();
      if (res.status === 402) {
        toast.error(body.error ?? 'Limit reached');
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? 'Generation failed');
      toast.success('Video generation started — typically 30-60s');
      setPrompt('');
      setRefImage(null);
      if (fileRef.current) fileRef.current.value = '';
      fetchVideos();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('video.delete_confirm'))) return;
    try {
      await fetch('/api/video/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed');
    }
  }

  const selectedModel = VIDEO_MODELS.find((m) => m.id === model)!;
  const estimatedCost = (selectedModel.costPerSecond * duration).toFixed(2);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Studio</div>
        <h1 className="font-display text-[32px]">Video</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[640px]">
          Cinematic-grade AI video powered by Veo 3.1. Text-to-video or animate a reference image.
          Native audio. 16:9 or vertical 9:16. Up to 8 seconds per generation.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-5">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the video you want. Be specific: subject, action, camera, lighting, mood..."
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
          />

          <div className="space-y-2">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Quick presets</div>
            <div className="flex flex-wrap gap-1.5">
              {VIDEO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPrompt(p.promptHint)}
                  className="h-7 px-2.5 rounded-md text-[11.5px] border border-border bg-surface-2 text-fg-muted hover:text-gold hover:border-gold/40 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">{t('video.model')}</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as typeof model)}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-gold/60"
              >
                {VIDEO_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ${m.costPerSecond.toFixed(3)}/sec
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-fg-muted">{selectedModel.tagline}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">{t('video.aspect')}</label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as '16:9' | '9:16')}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg focus:outline-none focus:border-gold/60"
              >
                {ASPECT_RATIOS.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">{t('video.duration')}</label>
              <div className="flex gap-1.5">
                {[4, 6, 8].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d as 4 | 6 | 8)}
                    className={cn(
                      'flex-1 h-9 rounded-md text-[12.5px] border transition',
                      duration === d
                        ? 'bg-gold/15 border-gold/50 text-gold'
                        : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                    )}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Reference image (optional)</label>
              {refImage ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2 p-2">
                  <img src={refImage.preview} alt="ref" className="h-9 w-9 rounded object-cover" />
                  <span className="flex-1 text-[12px] text-fg-muted truncate">Image attached</span>
                  <button
                    type="button"
                    onClick={() => { setRefImage(null); if (fileRef.current) fileRef.current.value = ''; }}
                    className="h-7 w-7 rounded text-fg-muted hover:text-danger flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-9 rounded-md border border-dashed border-border bg-surface-2/50 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Animate from image</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={handleImageUpload} className="hidden" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
            <div className="text-[11px] text-fg-muted">
              Estimated cost: <span className="text-gold font-medium">${estimatedCost}</span>
              <span className="text-fg-subtle"> · Generation usually takes 30–60 seconds</span>
            </div>
            <Button onClick={handleGenerate} loading={generating} disabled={!prompt.trim()}>
              <Sparkles className="h-4 w-4" />
              <span>{t('video.generate')}</span>
            </Button>
          </div>
        </CardBody>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[20px]">{t('video.your_videos')}</h2>
          {polling && (
            <div className="flex items-center gap-1.5 text-[11px] text-fg-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Polling for updates...</span>
            </div>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
            <Video className="h-8 w-8 text-fg-subtle mx-auto mb-3" />
            <p className="text-[13.5px] text-fg-muted">{t('video.none')}. Generate your first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <Card key={v.id}>
                <CardBody className="space-y-2.5">
                  <div className={cn(
                    'relative rounded-md overflow-hidden bg-surface-3 flex items-center justify-center',
                    v.aspect_ratio === '9:16' ? 'aspect-[9/16]' : 'aspect-video',
                  )}>
                    {v.status === 'completed' && v.video_url ? (
                      <video
                        src={v.video_url}
                        controls
                        className="absolute inset-0 w-full h-full object-cover"
                        preload="metadata"
                      />
                    ) : v.status === 'failed' ? (
                      <div className="text-center px-4">
                        <X className="h-6 w-6 text-danger mx-auto mb-1" />
                        <div className="text-[11px] text-fg-muted">{v.error_message ?? 'Failed'}</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Loader2 className="h-6 w-6 text-gold animate-spin mx-auto mb-1" />
                        <div className="text-[11px] uppercase tracking-[0.12em] text-fg-muted">
                          Generating...
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[12.5px] text-fg-soft line-clamp-2 leading-snug">{v.prompt}</p>

                  <div className="flex items-center justify-between text-[10.5px] text-fg-subtle">
                    <span>{v.duration_seconds}s · {v.aspect_ratio}</span>
                    <span>${(v.cost_usd ?? 0).toFixed(2)}</span>
                  </div>

                  <div className="flex gap-1 pt-1">
                    {v.video_url && (
                      <a
                        href={v.video_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 h-7 rounded-md border border-border bg-surface-2 text-[11.5px] text-fg-muted hover:text-fg flex items-center justify-center gap-1.5"
                      >
                        <Download className="h-3 w-3" />
                        <span>{t('video.download')}</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(v.id)}
                      className="h-7 w-7 rounded-md border border-border bg-surface-2 text-fg-muted hover:text-danger hover:border-danger/40 flex items-center justify-center"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
