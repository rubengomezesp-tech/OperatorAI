'use client';
import { useState } from 'react';
import { Flame, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function ViralContentGenerator() {
  const { locale } = useI18n();
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok' | 'both'>('instagram');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const es = locale === 'es';

  async function generate() {
    if (!niche) { toast.error(es ? 'Escribe el nicho' : 'Enter the niche'); return; }
    setLoading(true); setResult('');

    const prompt = es
      ? 'Actua como experto en contenido viral y growth hacker de redes sociales. Para el nicho "' + niche + '" en ' + (platform === 'both' ? 'Instagram y TikTok' : platform) + ', genera: 1) 5 IDEAS VIRALES (concepto + por que funcionaria + formato sugerido), 2) 10 HOOKS OPTIMIZADOS (primeras 3 palabras que captan atencion), 3) 3 SCRIPTS CORTOS PARA REELS (estructura: hook + desarrollo + CTA, max 30 segundos cada uno), 4) 5 FORMATOS TRENDING ACTUALES (que funcionan ahora en 2026, con adaptacion al nicho), 5) CALENDARIO SEMANAL (que publicar cada dia de la semana). Todo practico y listo para ejecutar.'
      : 'Act as a viral content expert and social media growth hacker. For niche "' + niche + '" on ' + (platform === 'both' ? 'Instagram and TikTok' : platform) + ', generate: 1) 5 VIRAL IDEAS (concept + why it would work + suggested format), 2) 10 OPTIMIZED HOOKS (first 3 words that grab attention), 3) 3 SHORT REEL SCRIPTS (structure: hook + development + CTA, max 30 seconds each), 4) 5 CURRENT TRENDING FORMATS (working now in 2026, adapted to niche), 5) WEEKLY CALENDAR (what to post each day). All practical and ready to execute.';

    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: prompt, provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }) });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (line.startsWith('data: ')) { try { const d = JSON.parse(line.slice(6)); if (d.t) setResult(p => p + d.t); } catch {} }
        }
      }
    } catch { toast.error(es ? 'Error' : 'Failed'); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Flame className="h-5 w-5 text-orange-400" /></div>
        <div><h2 className="font-display text-[22px]">{es ? 'Motor de Contenido Viral' : 'Viral Content Engine'}</h2><p className="text-[12px] text-fg-muted">{es ? 'Ideas, hooks, scripts y formatos trending' : 'Ideas, hooks, scripts and trending formats'}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Nicho / Tema' : 'Niche / Topic'} *</label><input value={niche} onChange={e => setNiche(e.target.value)} placeholder={es ? 'Ej: fitness, tecnologia, moda...' : 'e.g. fitness, tech, fashion...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Plataforma' : 'Platform'}</label><div className="flex gap-1.5">{(['instagram', 'tiktok', 'both'] as const).map(p => (<button key={p} onClick={() => setPlatform(p)} className={cn('flex-1 h-9 rounded-md text-[11px] font-medium border transition', platform === p ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>{p === 'both' ? (es ? 'Ambos' : 'Both') : p.charAt(0).toUpperCase() + p.slice(1)}</button>))}</div></div>
      </div>
      <button onClick={generate} disabled={loading} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{es ? 'Generando...' : 'Generating...'}</span></> : <><Flame className="h-4 w-4" /><span>{es ? 'Generar contenido viral' : 'Generate viral content'}</span></>}</button>
      {result && (<div className="relative rounded-xl border border-border bg-surface p-6"><button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 h-8 w-8 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg">{copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}</button><div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-[13px] leading-relaxed">{result}</div></div>)}
    </div>
  );
}
