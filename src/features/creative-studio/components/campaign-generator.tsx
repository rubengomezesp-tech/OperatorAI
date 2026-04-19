'use client';
import { useState } from 'react';
import { Megaphone, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function CampaignGenerator() {
  const { locale } = useI18n();
  const [brand, setBrand] = useState('');
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState<'sales' | 'awareness' | 'engagement' | 'leads'>('sales');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const es = locale === 'es';

  async function generate() {
    if (!brand || !product) { toast.error(es ? 'Rellena marca y producto' : 'Fill brand and product'); return; }
    setLoading(true);
    setResult('');

    const prompt = es
      ? 'Actua como director creativo de una agencia top. Genera una campana publicitaria completa para Instagram Ads para la marca "' + brand + '", producto/servicio: "' + product + '", audiencia: "' + (audience || 'general') + '", objetivo: ' + goal + '. Incluye: 1) CONCEPTO CREATIVO (nombre de campana, insight, big idea), 2) ANGULO DE VENTA (propuesta de valor, diferenciador), 3) STORYTELLING (narrativa de 3 actos), 4) STORYBOARD (3 anuncios con descripcion visual), 5) COPIES PUBLICITARIOS (3 variaciones: corto, medio, largo), 6) HOOKS VIRALES (5 ganchos), 7) CTAs (3 opciones), 8) VARIACIONES A/B (2 versiones del anuncio principal). Todo en formato profesional listo para ejecutar.'
      : 'Act as a top creative agency director. Generate a complete Instagram Ads campaign for brand "' + brand + '", product/service: "' + product + '", audience: "' + (audience || 'general') + '", goal: ' + goal + '. Include: 1) CREATIVE CONCEPT (campaign name, insight, big idea), 2) SELLING ANGLE (value proposition, differentiator), 3) STORYTELLING (3-act narrative), 4) STORYBOARD (3 ads with visual description), 5) AD COPIES (3 variations: short, medium, long), 6) VIRAL HOOKS (5 hooks), 7) CTAs (3 options), 8) A/B VARIATIONS (2 versions of main ad). All in professional format ready to execute.';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No stream');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.t) setResult(prev => prev + data.t);
            } catch {}
          }
        }
      }
    } catch (e) {
      toast.error(es ? 'Error al generar' : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function copyAll() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(es ? 'Copiado' : 'Copied');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-pink-400" />
        </div>
        <div>
          <h2 className="font-display text-[22px]">{es ? 'Campana Instagram Ads' : 'Instagram Ads Campaign'}</h2>
          <p className="text-[12px] text-fg-muted">{es ? 'Genera una campana completa lista para publicar' : 'Generate a complete campaign ready to publish'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Marca' : 'Brand'} *</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder={es ? 'Ej: Nike, tu marca...' : 'e.g. Nike, your brand...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Producto / Servicio' : 'Product / Service'} *</label>
          <input value={product} onChange={e => setProduct(e.target.value)} placeholder={es ? 'Ej: zapatillas running...' : 'e.g. running shoes...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Audiencia' : 'Audience'}</label>
          <input value={audience} onChange={e => setAudience(e.target.value)} placeholder={es ? 'Ej: millennials, 25-35...' : 'e.g. millennials, 25-35...'} className="w-full h-10 px-3 rounded-md border border-border bg-surface-2 text-[13px] focus:outline-none focus:border-gold/40" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5 block">{es ? 'Objetivo' : 'Goal'}</label>
          <div className="flex gap-1.5 flex-wrap">
            {(['sales', 'awareness', 'engagement', 'leads'] as const).map(g => (
              <button key={g} onClick={() => setGoal(g)} className={cn('h-8 px-3 rounded-md text-[11px] font-medium transition-colors border', goal === g ? 'bg-gold/15 text-gold border-gold/30' : 'bg-surface-2 text-fg-muted border-border hover:text-fg')}>
                {g === 'sales' ? (es ? 'Ventas' : 'Sales') : g === 'awareness' ? (es ? 'Alcance' : 'Awareness') : g === 'engagement' ? 'Engagement' : 'Leads'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={generate} disabled={loading} className="w-full h-11 rounded-lg gold-grad text-bg text-[14px] font-medium hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>{es ? 'Generando campana...' : 'Generating campaign...'}</span></> : <><Megaphone className="h-4 w-4" /><span>{es ? 'Generar campana' : 'Generate campaign'}</span></>}
      </button>

      {/* Result */}
      {result && (
        <div className="relative rounded-xl border border-border bg-surface p-6">
          <button onClick={copyAll} className="absolute top-3 right-3 h-8 w-8 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg transition-colors">
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-[13px] leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
}
