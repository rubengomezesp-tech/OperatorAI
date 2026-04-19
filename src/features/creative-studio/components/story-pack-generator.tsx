'use client';
import { useState } from 'react';
import { BookOpen, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function StoryPackGenerator() {
  const { locale } = useI18n();
  const [topic, setTopic] = useState('');
  const [brand, setBrand] = useState('');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const es = locale === 'es';

  async function generate() {
    if (!topic) { toast.error(es ? 'Escribe el tema' : 'Enter the topic'); return; }
    setLoading(true); setResult('');

    const prompt = es
      ? 'Genera un pack de ' + count + ' Instagram Stories para ' + (brand || 'una marca') + ' sobre: "' + topic + '". Para cada story: SLIDE (numero), VISUAL (descripcion detallada del fondo/imagen), TEXTO OVERLAY (texto que aparece), ELEMENTO INTERACTIVO (encuesta/quiz/slider si aplica). Story 1 = hook fuerte. Ultima story = CTA claro. Narrativa coherente entre todas.'
      : 'Generate a pack of ' + count + ' Instagram Stories for ' + (brand || 'a brand') + ' about: "' + topic + '". For each story: SLIDE (number), VISUAL (detailed background/image description), TEXT OVERLAY (text that appears), INTERACTIVE ELEMENT (poll/quiz/slider if applicable). Story 1 = strong hook. Last story = clear CTA. Coherent narrative across all.';

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
        <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><BookOpen className="h-5 w-5 text-purple-400" /></div>
        <div><h2 className="font-display text-[22px]">{es ? 'Story Pack Generator' : 'Story Pack Generator'}</h2><p className="text-[12px] text-fg-muted">{es ? 'Secuencias de stories con narrativa completa' : 'Story sequences with complete narrative'}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Tema / Idea' : 'Topic / Idea'} *</label><input value={topic} onChange={e => setTopic(e.target.value)} placeholder={es ? 'Ej: lanzamiento de producto...' : 'e.g. product launch...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Marca' : 'Brand'}</label><input value={brand} onChange={e => setBrand(e.target.value)} placeholder={es ? 'Opcional' : 'Optional'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
      </div>
      <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Numero de stories' : 'Number of stories'}</label><div className="flex gap-2">{[3,4,5].map(n => (<button key={n} onClick={() => setCount(n)} className={cn('h-9 w-12 rounded-md text-[13px] font-medium border transition', count === n ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border')}>{n}</button>))}</div></div>
      <button onClick={generate} disabled={loading} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{es ? 'Generando...' : 'Generating...'}</span></> : <><BookOpen className="h-4 w-4" /><span>{es ? 'Generar Story Pack' : 'Generate Story Pack'}</span></>}</button>
      {result && (<div className="relative rounded-xl border border-border bg-surface p-6"><button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 h-8 w-8 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg">{copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}</button><div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-[13px] leading-relaxed">{result}</div></div>)}
    </div>
  );
}
