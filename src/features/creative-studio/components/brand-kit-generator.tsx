'use client';
import { useState } from 'react';
import { Palette, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

export function BrandKitGenerator() {
  const { locale } = useI18n();
  const [brand, setBrand] = useState('');
  const [industry, setIndustry] = useState('');
  const [values, setValues] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const es = locale === 'es';

  async function generate() {
    if (!brand) { toast.error(es ? 'Escribe la marca' : 'Enter brand name'); return; }
    setLoading(true); setResult('');

    const prompt = es
      ? 'Actua como estratega de marca senior. Genera un Brand Kit completo para "' + brand + '" (industria: ' + (industry || 'general') + ', valores: ' + (values || 'no especificados') + '). Incluye: 1) TONO DE COMUNICACION (formal/informal, adjetivos, ejemplos de frases), 2) IDENTIDAD DE MARCA (mision, vision, propuesta de valor, personalidad), 3) ESTILO VISUAL CONCEPTUAL (paleta de colores sugerida con hex, tipografia sugerida, estilo fotografico, moodboard verbal), 4) PILARES DE CONTENIDO (5 temas recurrentes con descripcion), 5) EJEMPLOS DE POSTS (3 posts completos con caption + hashtags + descripcion visual). Todo en formato profesional.'
      : 'Act as a senior brand strategist. Generate a complete Brand Kit for "' + brand + '" (industry: ' + (industry || 'general') + ', values: ' + (values || 'not specified') + '). Include: 1) COMMUNICATION TONE (formal/informal, adjectives, phrase examples), 2) BRAND IDENTITY (mission, vision, value proposition, personality), 3) VISUAL STYLE CONCEPT (suggested color palette with hex, typography, photo style, verbal moodboard), 4) CONTENT PILLARS (5 recurring themes with description), 5) POST EXAMPLES (3 complete posts with caption + hashtags + visual description). All in professional format.';

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
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Palette className="h-5 w-5 text-amber-400" /></div>
        <div><h2 className="font-display text-[22px]">{es ? 'Brand Kit Generator' : 'Brand Kit Generator'}</h2><p className="text-[12px] text-fg-muted">{es ? 'Identidad de marca completa desde cero' : 'Complete brand identity from scratch'}</p></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Marca' : 'Brand'} *</label><input value={brand} onChange={e => setBrand(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Industria' : 'Industry'}</label><input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
        <div><label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Valores' : 'Values'}</label><input value={values} onChange={e => setValues(e.target.value)} placeholder={es ? 'Ej: innovacion, calidad...' : 'e.g. innovation, quality...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" /></div>
      </div>
      <button onClick={generate} disabled={loading} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">{loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{es ? 'Generando...' : 'Generating...'}</span></> : <><Palette className="h-4 w-4" /><span>{es ? 'Generar Brand Kit' : 'Generate Brand Kit'}</span></>}</button>
      {result && (<div className="relative rounded-xl border border-border bg-surface p-6"><button onClick={() => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="absolute top-3 right-3 h-8 w-8 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg">{copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}</button><div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-[13px] leading-relaxed">{result}</div></div>)}
    </div>
  );
}
