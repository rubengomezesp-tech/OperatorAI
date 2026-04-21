'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Loader2, Video, Trash2, Download, Play, Film, Clapperboard, Megaphone, Flame, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface VideoRow {
  id: string; prompt: string; model: string; aspect_ratio: string;
  duration_seconds: number; status: string; video_url: string | null;
  error_message: string | null; created_at: string;
}

interface RefImage { preview: string; base64: string; mimeType: string; file: File; }

const PRESETS = [
  { id: 'product', label: 'Product Ad', labelEs: 'Anuncio producto', icon: Megaphone, prompt: 'Cinematic product showcase, smooth camera orbit, professional studio lighting, luxury feel, 4K quality' },
  { id: 'reel', label: 'Viral Reel', labelEs: 'Reel Viral', icon: Flame, prompt: 'Dynamic fast-paced social media reel, energetic transitions, bold colors, trending style, vertical format' },
  { id: 'brand', label: 'Brand Cinematic', labelEs: 'Cinematico', icon: Film, prompt: 'Premium cinematic brand video, slow motion, atmospheric lighting, elegant movement, film grain' },
  { id: 'explainer', label: 'Explainer', labelEs: 'Explicativo', icon: Clapperboard, prompt: 'Clean modern explainer video, smooth animations, clear visual hierarchy, professional motion graphics' },
];

const MODELS = [
  { id: 'veo-3.1-lite-generate-preview', label: 'Veo Lite', desc: 'Fast, affordable', engine: 'veo' },
  { id: 'veo-3.1-fast-generate-preview', label: 'Veo Fast', desc: 'Best balance', engine: 'veo' },
  { id: 'veo-3.1-generate-preview', label: 'Veo Pro', desc: 'Highest quality', engine: 'veo' },
  { id: 'minimax-video-01', label: 'Minimax 15s', desc: 'Long videos up to 15s', engine: 'replicate' },
];

export function VideoStudio() {
  const { t, locale } = useI18n();
  const es = locale === 'es';
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('veo-3.1-fast-generate-preview');
  const [aspect, setAspect] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [references, setReferences] = useState<RefImage[]>([]);
  const [generating, setGenerating] = useState(false);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/videos/list');
      if (res.ok) { const d = await res.json(); setVideos(d.videos ?? []); }
    } catch {}
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleRefFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const remaining = 10 - references.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      if (file.size > 10 * 1024 * 1024) continue;
      const base64 = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = () => res((r.result as string).split(',')[1]);
        r.readAsDataURL(file);
      });
      const preview = URL.createObjectURL(file);
      setReferences(prev => [...prev, { preview, base64, mimeType: file.type, file }]);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeRef(i: number) {
    setReferences(prev => { const n = [...prev]; URL.revokeObjectURL(n[i].preview); n.splice(i, 1); return n; });
  }

  async function generate(customPrompt?: string) {
    const p = customPrompt || prompt;
    if (!p.trim()) { toast.error(t('vid.describe')); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p,
          model,
          aspectRatio: aspect,
          duration,
          referenceBase64: references.length > 0 ? references[0].base64 : undefined,
          referenceMimeType: references.length > 0 ? references[0].mimeType : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(t('vid.generated'));
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally { setGenerating(false); }
  }

  async function deleteVideo(id: string) {
    await fetch('/api/videos/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setVideos(prev => prev.filter(v => v.id !== id));
    toast.success(t('vid.deleted'));
  }

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[960px] mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center py-4 space-y-3">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20">
          <Video className="h-3 w-3" />
          <span>Video Studio</span>
        </div>
        <h1 className="font-display text-[32px] lg:text-[40px] leading-tight">
          {es ? (<>Video <span className="text-gold">cinematografico</span> con IA</>) : (<><span className="text-gold">Cinematic</span> AI video</>)}
        </h1>
        <p className="text-[14px] text-fg-muted max-w-[440px] mx-auto">
          {es ? 'Powered by Google Veo 3.1 — el modelo de video mas avanzado.' : 'Powered by Google Veo 3.1 — the most advanced video model.'}
        </p>
      </div>

      {/* Quick Presets */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-fg-subtle mb-3">{t('vid.presets')}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPrompt(p.prompt)} className="group text-left p-3 rounded-xl border border-border bg-surface hover:border-gold/30 hover:bg-surface-2 transition-all">
              <div className="flex items-center gap-2 mb-1.5">
                <p.icon className="h-3.5 w-3.5 text-gold" />
                <span className="text-[12px] font-medium group-hover:text-gold transition-colors">{es ? p.labelEs : p.label}</span>
              </div>
              <p className="text-[10px] text-fg-subtle line-clamp-2">{p.prompt.slice(0, 50)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Panel */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('vid.describe')} rows={3} className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-[14px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40 resize-none" />

        {/* Reference Images */}
        <div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">
            {t('vid.refs')}
            {references.length > 0 && <span className="text-gold ml-1">({references.length}/10)</span>}
          </div>
          <div className="flex flex-wrap gap-2">
            {references.map((ref, i) => (
              <div key={i} className="relative group h-16 w-16 rounded-lg overflow-hidden border border-border">
                <img src={ref.preview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeRef(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              </div>
            ))}
            {references.length < 10 && (
              <button onClick={() => fileRef.current?.click()} className="h-16 w-16 rounded-lg border-2 border-dashed border-border hover:border-gold/40 bg-surface-2 flex flex-col items-center justify-center gap-1 transition-colors">
                <ImagePlus className="h-4 w-4 text-gold" />
                <span className="text-[8px] text-fg-subtle uppercase">Add</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleRefFiles} className="hidden" />
          {references.length > 0 && (
            <button onClick={() => { references.forEach(r => URL.revokeObjectURL(r.preview)); setReferences([]); }} className="mt-1 text-[10px] text-fg-subtle hover:text-red-400 transition-colors">
              {t('vid.clear_all')}
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Model */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{t('vid.model')}</div>
            <div className="space-y-1">
              {MODELS.map(m => (
                <button key={m.id} onClick={() => setModel(m.id)} className={cn('w-full text-left px-3 py-2 rounded-lg border transition-all', model === m.id ? 'bg-gold/10 border-gold/30' : 'bg-surface-2 border-border hover:border-gold/20')}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[12px] font-medium', model === m.id ? 'text-gold' : 'text-fg')}>{m.label}</span>
                    {model === m.id && <div className="h-2 w-2 rounded-full bg-gold" />}
                  </div>
                  <span className="text-[10px] text-fg-subtle">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2">{t('vid.format')}</div>
            <div className="space-y-1.5">
              {([['16:9', 'Landscape'], ['9:16', 'Portrait']] as const).map(([id, label]) => (
                <button key={id} onClick={() => setAspect(id)} className={cn('w-full flex items-center gap-3 px-3 h-10 rounded-lg border transition-all', aspect === id ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-surface-2 border-border text-fg-muted hover:text-fg')}>
                  <div className={cn('rounded border', aspect === id ? 'border-gold/50' : 'border-fg-subtle/30', id === '16:9' ? 'w-6 h-4' : 'w-4 h-6')} />
                  <span className="text-[12px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle mb-2 mt-4">{t('vid.duration')}</div>
            <div className="flex gap-2">
              {([4, 6, 8] as const).map(d => (
                <button key={d} onClick={() => setDuration(d)} className={cn('flex-1 h-9 rounded-lg text-[12px] font-medium border transition-all', duration === d ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col justify-end">
            <div className="rounded-lg bg-surface-2 border border-border p-3 text-[10px] text-fg-subtle space-y-1">
              <div className="flex justify-between"><span>Model</span><span className="text-fg-muted">{MODELS.find(m => m.id === model)?.label}</span></div>
              <div className="flex justify-between"><span>Format</span><span className="text-fg-muted">{aspect}</span></div>
              <div className="flex justify-between"><span>Duration</span><span className="text-fg-muted">{duration}s</span></div>
              <div className="flex justify-between"><span>References</span><span className="text-fg-muted">{references.length}</span></div>
            </div>
          </div>
        </div>

        {/* Generate */}
        <button onClick={() => generate()} disabled={generating} className="w-full h-12 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /><span>{t('vid.generating')}</span></>) : (<><Video className="h-4 w-4" /><span>{t('vid.generate')}</span></>)}
        </button>

        <div className="flex items-center justify-center text-[10px] text-fg-subtle gap-2">
          <Sparkles className="h-3 w-3 text-gold" />
          <span>Google Veo 3.1 &middot; {es ? 'Video cinematografico de ultima generacion' : 'Next-gen cinematic AI video'}</span>
        </div>
      </div>

      {/* Gallery */}
      {videos.length > 0 && (
        <div>
          <h2 className="font-display text-[18px] mb-4">{t('vid.your_videos')} <span className="text-[11px] text-fg-subtle">({videos.length})</span></h2>
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
                      {v.video_url && (<a href={v.video_url} download className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg"><Download className="h-3 w-3" /></a>)}
                      <button onClick={() => deleteVideo(v.id)} className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
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
          <p className="text-[14px] text-fg-muted">{t('vid.empty')}</p>
        </div>
      )}
    </div>
  );
}
