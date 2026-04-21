'use client';
import { useState, useRef } from 'react';
import { Upload, Loader2, Play, Download, RotateCcw, X, Sparkles, Video, Type, Zap, Copy, Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { ReferenceComposer } from './reference-composer';

type Step = 'upload' | 'composing' | 'preview' | 'generating' | 'result';
type Priority = 'fast' | 'balanced' | 'exact';

interface UploadedImage { url: string; preview: string; }
interface Classification { index: number; type: string; description: string; }
interface AdCopy { hook: string; message: string; cta: string; headline: string; }
interface Result { copy: AdCopy; video: { id: string; url: string; duration: number }; composedImage: string | null; model: string; }

export function CreateView() {
  const { locale } = useI18n();
  const es = locale === 'es';

  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [objective, setObjective] = useState('');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [duration, setDuration] = useState(15);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [composedDataUrl, setComposedDataUrl] = useState<string | null>(null);
  const [composedSupabaseUrl, setComposedSupabaseUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [playing, setPlaying] = useState(false);
  const [editingCopy, setEditingCopy] = useState(false);
  const [editCopy, setEditCopy] = useState<AdCopy>({ hook: '', message: '', cta: '', headline: '' });
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    for (const file of Array.from(e.target.files).slice(0, 10 - images.length)) {
      if (file.size > 10 * 1024 * 1024) continue;
      const fd = new FormData(); fd.append('file', file);
      try {
        const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
        const data = await res.json();
        if (res.ok && data.url) setImages(prev => [...prev, { url: data.url, preview: URL.createObjectURL(file) }]);
      } catch {}
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(i: number) { setImages(prev => { const n=[...prev]; URL.revokeObjectURL(n[i].preview); n.splice(i,1); return n; }); }

  async function classify() {
    if (images.length === 0) return;
    setStep('composing');
    try {
      const res = await fetch('/api/create/compose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls: images.map(i => i.url) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClassifications(data.classification?.images || []);
      setStep('preview');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); setStep('upload'); }
  }

  async function uploadComposed(): Promise<string | undefined> {
    if (!composedDataUrl) return undefined;
    try {
      const blob = await (await fetch(composedDataUrl)).blob();
      const fd = new FormData(); fd.append('file', new File([blob], 'composed.png', { type: 'image/png' }));
      const res = await fetch('/api/images/upload-reference', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) { setComposedSupabaseUrl(data.url); return data.url; }
    } catch {} return undefined;
  }

  async function generate() {
    setStep('generating'); setGenerating(true); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p => p+1), 1000);
    try {
      const composedUrl = await uploadComposed();
      const res = await fetch('/api/create/campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls: images.map(i => i.url),
          composedImageUrl: composedUrl,
          objective, priority, duration, format: '9:16',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ ...data.campaign, composedImage: composedDataUrl });
      setEditCopy(data.campaign.copy);
      setStep('result');
      toast.success(es ? 'Campana lista' : 'Campaign ready');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); setStep(images.length > 1 ? 'preview' : 'upload'); }
    finally { setGenerating(false); if (timerRef.current) clearInterval(timerRef.current); }
  }

  function reset() { setStep('upload'); setResult(null); setComposedDataUrl(null); setPlaying(false); setImages([]); setClassifications([]); }
  const fmt = (s: number) => { const m=Math.floor(s/60); return m>0?m+'m '+s%60+'s':s+'s'; };
  const est = priority==='fast'?60:priority==='exact'?180:120;
  async function copyText(t: string, f: string) { await navigator.clipboard.writeText(t); setCopied(f); setTimeout(()=>setCopied(null),2000); }

  // ═══════ UPLOAD ═══════
  if (step === 'upload') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-6">
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3"><Sparkles className="h-3 w-3" />{es?'Crea campanas':'Create Campaigns'}</div>
        <h1 className="font-display text-[28px] lg:text-[36px]">{es?<>Sube. Crea. <span className="text-gold">Publica.</span></>:<>Upload. Create. <span className="text-gold">Publish.</span></>}</h1>
        <p className="text-[13px] text-fg-muted mt-2 max-w-[420px] mx-auto">{es?'Sube logo, producto, screenshots y referencias. El sistema los analiza, compone y crea tu anuncio.':'Upload logo, product, screenshots and references. The system analyzes, composes and creates your ad.'}</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">{es?'Imagenes':'Images'} {images.length>0&&<span className="text-gold">({images.length}/10)</span>}</div>
        <div className="flex flex-wrap gap-2">
          {images.map((img,i) => (<div key={i} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-border"><img src={img.preview} alt="" className="w-full h-full object-cover"/><button onClick={()=>removeImage(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-2.5 w-2.5 text-white"/></button></div>))}
          {images.length<10&&(<button onClick={()=>fileRef.current?.click()} className={cn('rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',images.length===0?'w-full h-28 border-gold/30 bg-gold/5 hover:bg-gold/10':'h-20 w-20 border-border hover:border-gold/40 bg-surface-2')}><Upload className={cn('text-gold',images.length===0?'h-6 w-6':'h-4 w-4')}/>{images.length===0&&<span className="text-[12px] text-gold font-medium">{es?'Logo, producto, screenshots...':'Logo, product, screenshots...'}</span>}</button>)}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden"/>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">{es?'Objetivo':'Objective'}</div>
        <input value={objective} onChange={e=>setObjective(e.target.value)} placeholder={es?'Ej: Lanzamiento, 7 dias gratis, branding...':'e.g. Launch, 7-day trial, branding...'} className="w-full h-11 px-3 rounded-lg border border-border bg-surface-2 text-[13px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{es?'Modo':'Mode'}</div>
          <div className="flex gap-1.5">{(['fast','balanced','exact'] as const).map(id=>(<button key={id} onClick={()=>setPriority(id)} className={cn('flex-1 h-8 rounded-md text-[10px] font-medium border transition-all',priority===id?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{id==='fast'?'Fast':id==='balanced'?'Balanced':'Exact'}</button>))}</div>
          <div className="text-[9px] text-fg-subtle">{priority==='exact'?(es?'Kling Omni — multi-referencia':'Kling Omni — multi-reference'):priority==='fast'?(es?'Kling V3 — rapido':'Kling V3 — fast'):(es?'Kling V3 — equilibrado':'Kling V3 — balanced')}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle">{es?'Duracion':'Duration'}</div>
          <div className="flex gap-1.5">{([5,10,15] as const).map(d=>(<button key={d} onClick={()=>setDuration(d)} className={cn('flex-1 h-8 rounded-md text-[11px] font-medium border transition-all',duration===d?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{d}s</button>))}</div>
        </div>
      </div>
      <button onClick={images.length>1?classify:generate} disabled={images.length===0} className="w-full h-13 rounded-xl gold-grad text-bg text-[15px] font-semibold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-3"><Zap className="h-5 w-5"/>{images.length>1?(es?'Analizar y componer':'Analyze & compose'):(es?'Crear campana':'Create campaign')}</button>
    </div>
  );

  // ═══════ COMPOSING ═══════
  if (step === 'composing') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto flex flex-col items-center py-16 space-y-6">
      <Loader2 className="h-10 w-10 text-gold animate-spin"/>
      <h2 className="font-display text-[22px]">{es?'Analizando imagenes...':'Analyzing images...'}</h2>
      <p className="text-[13px] text-fg-muted">{es?'Claude Vision clasifica cada imagen':'Claude Vision classifies each image'}</p>
    </div>
  );

  // ═══════ PREVIEW COMPOSE ═══════
  if (step === 'preview') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-6">
      <h2 className="font-display text-[22px] text-center">{es?'Composicion':'Composition'}</h2>
      {classifications.length>0&&(<div className="flex flex-wrap gap-2 justify-center">{classifications.map((c,i)=>(<div key={i} className="px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[10px] flex items-center gap-1.5"><span className="text-gold font-medium uppercase">{c.type}</span><span className="text-fg-muted">{c.description?.slice(0,25)}</span></div>))}</div>)}
      <ReferenceComposer imageUrls={images.map(i=>i.url)} classifications={classifications} onComposed={setComposedDataUrl}/>
      <div className="flex gap-3">
        <button onClick={()=>setStep('upload')} className="h-11 px-5 rounded-lg border border-border bg-surface-2 text-[13px] text-fg-muted">{es?'Volver':'Back'}</button>
        <button onClick={classify} className="h-11 px-5 rounded-lg border border-border bg-surface-2 text-[13px] text-fg-muted flex items-center gap-2"><RotateCcw className="h-3.5 w-3.5"/>{es?'Recomponer':'Recompose'}</button>
        <button onClick={generate} className="flex-1 h-11 rounded-lg gold-grad text-bg text-[14px] font-medium flex items-center justify-center gap-2"><Video className="h-4 w-4"/>{es?'Generar video + campana':'Generate video + campaign'}</button>
      </div>
    </div>
  );

  // ═══════ GENERATING ═══════
  if (step === 'generating') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto flex flex-col items-center py-16 space-y-8">
      <Loader2 className="h-10 w-10 text-gold animate-spin"/>
      <div className="text-center"><h2 className="font-display text-[24px] mb-2">{es?'Creando campana...':'Creating campaign...'}</h2><p className="text-[13px] text-fg-muted">{fmt(elapsed)} / ~{fmt(est)}</p></div>
      <div className="w-full max-w-[400px] h-2 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full gold-grad transition-all duration-1000" style={{width:Math.min(95,(elapsed/est)*100)+'%'}}/></div>
      <div className="flex gap-6 text-[11px]">{[{l:'Copy',d:elapsed>5},{l:'Video',d:elapsed>est*0.7},{l:'Save',d:elapsed>est*0.9}].map(s=>(<div key={s.l} className={cn('flex items-center gap-2',s.d?'text-gold':'text-fg-subtle')}><div className={cn('h-2 w-2 rounded-full',s.d?'bg-gold':'bg-fg-subtle/30')}/>{s.l}</div>))}</div>
    </div>
  );

  // ═══════ RESULT ═══════
  if (!result) return null;
  const videoSrc = result.video.url.includes('supabase') ? result.video.url : '/api/videos/stream?url='+encodeURIComponent(result.video.url);

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[820px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[22px]">{es?'Tu campana':'Your campaign'}</h2>
        <button onClick={reset} className="h-8 px-3 rounded-lg border border-border bg-surface-2 text-[11px] text-fg-muted flex items-center gap-2"><RotateCcw className="h-3 w-3"/>{es?'Nueva':'New'}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden bg-black"><div className="relative" style={{aspectRatio:'9/16',maxHeight:440}}>
            {playing?(<video src={videoSrc} controls autoPlay playsInline className="w-full h-full object-contain" onEnded={()=>setPlaying(false)}/>):(<button onClick={()=>setPlaying(true)} className="w-full h-full flex items-center justify-center bg-surface-2"><div className="h-14 w-14 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:scale-110 transition-transform"><Play className="h-6 w-6 text-gold ml-1"/></div></button>)}
          </div></div>
          <a href={result.video.url} download className="w-full h-11 rounded-lg gold-grad text-bg text-[13px] font-medium flex items-center justify-center gap-2"><Download className="h-4 w-4"/>{es?'Descargar video':'Download video'}</a>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-4">
            <div className="flex items-center justify-between"><div className="text-[10px] uppercase tracking-[0.14em] text-fg-subtle flex items-center gap-2"><Type className="h-3 w-3 text-gold"/>Ad Copy</div><button onClick={()=>setEditingCopy(!editingCopy)} className="text-[10px] text-fg-muted hover:text-gold flex items-center gap-1"><Pencil className="h-2.5 w-2.5"/>{editingCopy?'Done':'Edit'}</button></div>
            <CF label="Hook" value={editingCopy?editCopy.hook:result.copy.hook} editing={editingCopy} onChange={v=>setEditCopy(c=>({...c,hook:v}))} onCopy={()=>copyText(editCopy.hook||result.copy.hook,'hook')} copied={copied==='hook'} large/>
            <CF label="Primary Text" value={editingCopy?editCopy.message:result.copy.message} editing={editingCopy} onChange={v=>setEditCopy(c=>({...c,message:v}))} onCopy={()=>copyText(editCopy.message||result.copy.message,'msg')} copied={copied==='msg'}/>
            <div><div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">CTA</div>{editingCopy?(<input value={editCopy.cta} onChange={e=>setEditCopy(c=>({...c,cta:e.target.value}))} className="w-full h-9 px-3 rounded-lg border border-border bg-surface-2 text-[12px] focus:outline-none focus:border-gold/40"/>):(<div className="flex items-center justify-between"><span className="inline-block px-4 py-1.5 rounded-full bg-gold text-black text-[12px] font-semibold">{result.copy.cta}</span><button onClick={()=>copyText(result.copy.cta,'cta')} className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg">{copied==='cta'?<Check className="h-3 w-3 text-gold"/>:<Copy className="h-3 w-3"/>}</button></div>)}</div>
            <CF label="Headline" value={editingCopy?editCopy.headline:result.copy.headline} editing={editingCopy} onChange={v=>setEditCopy(c=>({...c,headline:v}))} onCopy={()=>copyText(editCopy.headline||result.copy.headline,'hl')} copied={copied==='hl'}/>
          </div>
          <button onClick={()=>{const all=[editCopy.hook||result.copy.hook,editCopy.message||result.copy.message,editCopy.cta].join('\n\n');copyText(all,'all');}} className="w-full h-10 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-fg flex items-center justify-center gap-2">{copied==='all'?<Check className="h-3.5 w-3.5 text-gold"/>:<Copy className="h-3.5 w-3.5"/>}{copied==='all'?(es?'Copiado':'Copied'):(es?'Copiar todo':'Copy all')}</button>
          <div className="rounded-lg bg-surface-2 border border-border p-3 text-[10px] text-fg-subtle space-y-1">
            <div className="flex justify-between"><span>Model</span><span className="text-fg-muted">{result.model==='kling-omni'?'Kling 3.0 Omni':'Kling 3.0'}</span></div>
            <div className="flex justify-between"><span>Duration</span><span className="text-fg-muted">{result.video.duration}s</span></div>
            <div className="flex justify-between"><span>Mode</span><span className="text-fg-muted capitalize">{priority}</span></div>
            <div className="flex justify-between"><span>References</span><span className="text-fg-muted">{images.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CF({label,value,editing,onChange,onCopy,copied,large,placeholder}:{label:string;value:string;editing:boolean;onChange:(v:string)=>void;onCopy:()=>void;copied:boolean;large?:boolean;placeholder?:string}) {
  return (<div><div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">{label}</div>{editing?(<input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full h-9 px-3 rounded-lg border border-border bg-surface-2 text-[12px] focus:outline-none focus:border-gold/40"/>):(<div className="flex items-start justify-between gap-2"><p className={cn('flex-1',large?'text-[15px] font-display leading-tight':'text-[12px] text-fg-muted leading-relaxed')}>{value||<span className="text-fg-subtle italic">—</span>}</p><button onClick={onCopy} className="h-7 w-7 rounded-md border border-border bg-surface-2 flex items-center justify-center text-fg-muted hover:text-fg shrink-0">{copied?<Check className="h-3 w-3 text-gold"/>:<Copy className="h-3 w-3"/>}</button></div>)}</div>);
}
