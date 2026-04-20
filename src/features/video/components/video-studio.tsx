'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, Video, Trash2, Download, Play, Film, Clapperboard, Megaphone, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface VideoRow {
  id: string;
  prompt: string;
  model: string;
  aspect_ratio: string;
  duration_seconds: number;
  status: string;
  video_url: string | null;
  error_message: string | null;
  created_at: string;
}

const PRESETS = [
  { id: 'product', label: 'Product Ad', labelEs: 'Anuncio producto', icon: Megaphone, prompt: 'Cinematic product showcase, smooth camera orbit, professional studio lighting, luxury feel' },
  { id: 'reel', label: 'Viral Reel', labelEs: 'Reel Viral', icon: Flame, prompt: 'Dynamic fast-paced social media reel, energetic transitions, bold colors, trending style' },
  { id: 'brand', label: 'Brand Cinematic', labelEs: 'Cinematico', icon: Film, prompt: 'Premium cinematic brand video, slow motion, atmospheric lighting, elegant movement' },
  { id: 'explainer', label: 'Explainer', labelEs: 'Explicativo', icon: Clapperboard, prompt: 'Clean modern explainer video, smooth animations, clear visual hierarchy' },
];

export function VideoStudio() {
  const { locale } = useI18n();
  const es = locale === 'es';
  const [prompt, setPrompt] = useState('');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/videos/list');
      if (res.ok) { const d = await res.json(); setVideos(d.videos ?? []); }
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function generate(customPrompt?: string) {
    const p = customPrompt || prompt;
    if (!p.trim()) { toast.error(es ? 'Escribe un prompt' : 'Enter a prompt'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, aspectRatio: aspect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(es ? 'Video generado' : 'Video generated');
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally { setGenerating(false); }
  }

  async function deleteVideo(id: string) {
    await fetch('/api/videos/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setVideos(prev => prev.filter(v => v.id !== id));
    toast.success(es ? 'Eliminado' : 'Deleted');
  }

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[960px] mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center py-6 space-y-3">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
          <Video className="h-3 w-3" />
          <span>Video Studio</span>
        </div>
        <h1 className="font-display text-[32px] lg:text-[40px] leading-tight">
          {es ? (
            <>Crea video <span className="text-gold">cinematografico</span> con IA</>
          ) : (
            <>Create <span className="text-gold">cinematic</span> AI video</>
          )}
        </h1>
        <p className="text-[14px] text-fg-muted max-w-[440px] mx-auto">
          {es ? 'Un prompt. Un video profesional. Listo para publicar.' : 'One prompt. One professional video. Ready to publish.'}
        </p>
      </div>

      {/* Quick Presets */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle mb-3">{es ? 'Presets rapidos' : 'Quick presets'}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => { setPrompt(p.prompt); }}
              className="group text-left p-3 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-2 transition-all"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <p.icon className="h-3.5 w-3.5 text-gold" />
                <span className="text-[12px] font-medium group-hover:text-gold transition-colors">{es ? p.labelEs : p.label}</span>
              </div>
              <p className="text-[10px] text-fg-subtle line-clamp-2">{p.prompt.slice(0, 60)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Panel */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={es ? 'Describe el video que quieres crear...' : 'Describe the video you want to create...'}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-[14px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none"
        />

        <div className="flex flex-wrap gap-4">
          {/* Aspect Ratio — visual cards */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{es ? 'Formato' : 'Format'}</div>
            <div className="flex gap-2">
              {([['16:9', 'Landscape'], ['9:16', 'Portrait']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setAspect(id)}
                  className={cn(
                    'flex items-center gap-2 px-3 h-10 rounded-lg border transition-all',
                    aspect === id ? 'bg-gold/15 border-gold/30 text-gold' : 'bg-surface-2 border-border text-fg-muted hover:text-fg'
                  )}
                >
                  <div className={cn('rounded border', aspect === id ? 'border-gold/50' : 'border-fg-subtle/30',
                    id === '16:9' ? 'w-5 h-3' : 'w-3 h-5'
                  )} />
                  <span className="text-[11px] font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => generate()}
          disabled={generating}
          className="w-full h-12 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /><span>{es ? 'Generando video...' : 'Generating video...'}</span></>
          ) : (
            <><Video className="h-4 w-4" /><span>{es ? 'Generar video' : 'Generate video'}</span></>
          )}
        </button>

        <div className="flex items-center justify-center text-[10px] text-fg-subtle gap-2">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>Minimax Video &middot; ~30s {es ? 'de generacion' : 'generation time'}</span>
        </div>
      </div>

      {/* Gallery */}
      {videos.length > 0 && (
        <div>
          <h2 className="font-display text-[18px] mb-4">{es ? 'Tus videos' : 'Your videos'} <span className="text-[11px] text-fg-subtle">({videos.length})</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map(v => (
              <div key={v.id} className="rounded-xl border border-border bg-surface overflow-hidden group">
                {v.video_url ? (
                  <div className="relative aspect-video bg-black">
                    {playingId === v.id ? (
                      <video src={v.video_url} controls autoPlay className="w-full h-full object-contain" onEnded={() => setPlayingId(null)} />
                    ) : (
                      <button onClick={() => setPlayingId(v.id)} className="w-full h-full flex items-center justify-center bg-surface-2 hover:bg-surface-3 transition-colors">
                        <div className="h-14 w-14 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-gold ml-1" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-surface-2 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-gold animate-spin" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-[12px] text-fg-muted line-clamp-2 mb-2">{v.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-subtle">{new Date(v.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {v.video_url && (
                        <a href={v.video_url} download className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg">
                          <Download className="h-3 w-3" />
                        </a>
                      )}
                      <button onClick={() => deleteVideo(v.id)} className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {videos.length === 0 && !generating && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <Video className="h-8 w-8 text-fg-subtle mx-auto mb-3" />
          <p className="text-[14px] text-fg-muted">{es ? 'Tus videos apareceran aqui' : 'Your videos will appear here'}</p>
        </div>
      )}
    </div>
  );
}
