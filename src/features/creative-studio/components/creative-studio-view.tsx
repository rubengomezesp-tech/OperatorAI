'use client';
import { useState, useRef } from 'react';
import { Upload, Loader2, Play, Download, RotateCcw, X, Sparkles, Video, Type, Zap, Copy, Check, Pencil, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { ReferenceComposer } from './reference-composer';
import { AdEditor } from './ad-editor';

type Step = 'upload' | 'composing' | 'compose_preview' | 'generating' | 'result';
type Priority = 'fast' | 'balanced' | 'exact';
type OutputMode = 'image' | 'image_copy' | 'full';
type CompositionMode = 'structured' | 'creative';
type AspectRatio = '9:16' | '1:1' | '4:5';

interface Img { url: string; preview: string; }
interface Cls { index: number; type: string; description: string; }
interface AdCopy { hook: string; message: string; cta: string; headline: string; }
interface Result { copy: AdCopy; video?: { id: string; url: string; duration: number }; composedImage: string | null; model?: string; }

export function CreativeStudioView() {
  const { locale } = useI18n();
  const es = locale === 'es';

  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<Img[]>([]);
  const [objective, setObjective] = useState('');
  const [priority, setPriority] = useState<Priority>('balanced');
  const [duration, setDuration] = useState(15);
  const [aspect, setAspect] = useState<AspectRatio>('9:16');
  const [outputMode, setOutputMode] = useState<OutputMode>('full');
  const [compositionMode, setCompositionMode] = useState<CompositionMode>('structured');
  const [creativePrompt, setCreativePrompt] = useState<string>('');
  const [cls, setCls] = useState<Cls[]>([]);
  const [composedUrl, setComposedUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCopy, setEditingCopy] = useState(false);
  const [editCopy, setEditCopy] = useState<AdCopy>({ hook:'', message:'', cta:'', headline:'' });
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    for (const file of Array.from(e.target.files).slice(0, 10-images.length)) {
      if (file.size > 10*1024*1024) continue;
      const fd = new FormData(); fd.append('file', file);
      try {
        const res = await fetch('/api/images/upload-reference', { method:'POST', body:fd });
        const data = await res.json();
        if (res.ok && data.url) setImages(prev => [...prev, { url: data.url, preview: URL.createObjectURL(file) }]);
      } catch {}
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function rmImg(i: number) { setImages(prev => { const n=[...prev]; URL.revokeObjectURL(n[i].preview); n.splice(i,1); return n; }); }

  async function classify() {
    if (!images.length) return;
    setStep('composing');
    try {
      if (compositionMode === 'creative') {
        // Creative mode: generate cinematic image with Flux
        const res = await fetch('/api/create/creative', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ imageUrls: images.map(i=>i.url), objective, aspectRatio: aspect }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setComposedUrl(data.imageUrl);
        setCreativePrompt(data.prompt || '');
        setCls([]);
        setStep('compose_preview');
      } else {
        // Structured mode: canvas layout
        const res = await fetch('/api/create/compose', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ imageUrls: images.map(i=>i.url) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setCls(data.classification?.images || []);
        setStep('compose_preview');
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); setStep('upload'); }
  }

  async function uploadComposed(): Promise<string|undefined> {
    if (!composedUrl) return;
    try {
      const blob = await (await fetch(composedUrl)).blob();
      const fd = new FormData(); fd.append('file', new File([blob], 'composed.png', { type:'image/png' }));
      const res = await fetch('/api/images/upload-reference', { method:'POST', body:fd });
      const data = await res.json();
      return res.ok ? data.url : undefined;
    } catch { return undefined; }
  }

  async function generate() {
    setStep('generating'); setGenerating(true); setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(p=>p+1), 1000);
    try {
      const composedSupaUrl = await uploadComposed();

      if (outputMode === 'image') {
        // Static only — no API call needed, just use composed image
        setResult({ copy: { hook:'', message:'', cta:'', headline:'' }, composedImage: composedUrl });
        setStep('result');
        toast.success(es ? 'Imagen lista' : 'Image ready');
        return;
      }

      const res = await fetch('/api/create/campaign', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          imageUrls: images.map(i=>i.url),
          composedImageUrl: composedSupaUrl,
          objective, priority, duration, format: aspect,
          skipVideo: outputMode === 'image_copy',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ ...data.campaign, composedImage: composedUrl });
      setEditCopy(data.campaign.copy);
      setStep('result');
      toast.success(es ? 'Campana lista' : 'Campaign ready');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed'); setStep(images.length>1?'compose_preview':'upload'); }
    finally { setGenerating(false); if (timerRef.current) clearInterval(timerRef.current); }
  }

  function reset() { setStep('upload'); setResult(null); setComposedUrl(null); setPlaying(false); setImages([]); setCls([]); }
  const fmt = (s:number) => { const m=Math.floor(s/60); return m>0?m+'m '+s%60+'s':s+'s'; };
  const est = outputMode==='image_copy'?15:priority==='fast'?60:priority==='exact'?180:120;
  async function cp(t:string,f:string) { await navigator.clipboard.writeText(t); setCopied(f); setTimeout(()=>setCopied(null),2000); }

  // ═══════ STEP 1: UPLOAD ═══════
  if (step === 'upload') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-5">
      <div className="text-center py-3">
        <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold px-3 py-1 rounded-full bg-gold/10 border border-gold/20 mb-3"><Sparkles className="h-3 w-3"/>{es?'Crea campanas':'Create Campaigns'}</div>
        <h1 className="font-display text-[26px] lg:text-[34px]">{es?<>Sube. Compone. <span className="text-gold">Publica.</span></>:<>Upload. Compose. <span className="text-gold">Publish.</span></>}</h1>
        <p className="text-[13px] text-fg-muted mt-1.5 max-w-[400px] mx-auto">{es?'Todo empieza con tus imagenes. El sistema hace el resto.':'Everything starts with your images. The system does the rest.'}</p>
      </div>
      {/* Images */}
      <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
        <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">{es?'Imagenes':'Images'} {images.length>0&&<span className="text-gold">({images.length}/10)</span>}</div>
        <div className="flex flex-wrap gap-2">
          {images.map((img,i)=>(<div key={i} className="relative group h-[72px] w-[72px] rounded-lg overflow-hidden border border-border"><img src={img.preview} alt="" className="w-full h-full object-cover"/><button onClick={()=>rmImg(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-2.5 w-2.5 text-white"/></button></div>))}
          {images.length<10&&(<button onClick={()=>fileRef.current?.click()} className={cn('rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',images.length===0?'w-full h-24 border-gold/30 bg-gold/5 hover:bg-gold/10':'h-[72px] w-[72px] border-border hover:border-gold/40 bg-surface-2')}><Upload className={cn('text-gold',images.length===0?'h-5 w-5':'h-3.5 w-3.5')}/>{images.length===0&&<span className="text-[11px] text-gold">{es?'Logo, producto, screenshots...':'Logo, product, screenshots...'}</span>}</button>)}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden"/>
      </div>
      {/* Objective */}
      <input value={objective} onChange={e=>setObjective(e.target.value)} placeholder={es?'Objetivo: lanzamiento, 7 dias gratis, branding...':'Objective: launch, 7-day trial, branding...'} className="w-full h-11 px-4 rounded-xl border border-border bg-surface text-[13px] placeholder:text-fg-subtle focus:outline-none focus:border-gold/40"/>
      {/* Composition Mode — Structured vs Creative */}
      <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
        <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">{es?'Tipo de composicion':'Composition type'}</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={()=>setCompositionMode('structured')} className={cn('flex flex-col items-start p-2.5 rounded-lg border text-left transition-all',compositionMode==='structured'?'bg-gold/10 border-gold/30':'bg-surface-2 border-border hover:border-gold/20')}>
            <span className={cn('text-[11px] font-medium',compositionMode==='structured'?'text-gold':'text-fg')}>Structured</span>
            <span className="text-[9px] text-fg-subtle">{es?'Layout exacto con tus imagenes':'Exact layout with your images'}</span>
          </button>
          <button onClick={()=>setCompositionMode('creative')} className={cn('flex flex-col items-start p-2.5 rounded-lg border text-left transition-all',compositionMode==='creative'?'bg-gold/10 border-gold/30':'bg-surface-2 border-border hover:border-gold/20')}>
            <span className={cn('text-[11px] font-medium',compositionMode==='creative'?'text-gold':'text-fg')}>Creative</span>
            <span className="text-[9px] text-fg-subtle">{es?'Visual cinematico premium':'Premium cinematic visual'}</span>
          </button>
        </div>
      </div>

      {/* Aspect + Mode + Output */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">{es?'Formato':'Format'}</div>
          <div className="flex gap-1">{(['9:16','1:1','4:5'] as const).map(r=>(<button key={r} onClick={()=>setAspect(r)} className={cn('flex-1 h-7 rounded-md text-[10px] font-medium border transition-all',aspect===r?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{r}</button>))}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">{es?'Modo':'Mode'}</div>
          <div className="flex gap-1">{(['fast','balanced','exact'] as const).map(m=>(<button key={m} onClick={()=>setPriority(m)} className={cn('flex-1 h-7 rounded-md text-[9px] font-medium border transition-all',priority===m?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{m[0].toUpperCase()+m.slice(1)}</button>))}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 space-y-1.5">
          <div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle">Output</div>
          <div className="flex gap-1">{([['image','Img'],['image_copy','+ Copy'],['full','+ Video']] as const).map(([id,l])=>(<button key={id} onClick={()=>setOutputMode(id as OutputMode)} className={cn('flex-1 h-7 rounded-md text-[9px] font-medium border transition-all',outputMode===id?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{l}</button>))}</div>
        </div>
      </div>
      {outputMode==='full'&&(<div className="flex gap-1.5 justify-center">{([5,10,15] as const).map(d=>(<button key={d} onClick={()=>setDuration(d)} className={cn('h-8 w-14 rounded-lg text-[11px] font-medium border transition-all',duration===d?'bg-gold/15 text-gold border-gold/30':'bg-surface-2 text-fg-muted border-border')}>{d}s</button>))}</div>)}
      <button onClick={images.length>1?classify:generate} disabled={!images.length} className="w-full h-12 rounded-xl gold-grad text-bg text-[14px] font-semibold hover:brightness-110 transition disabled:opacity-40 flex items-center justify-center gap-2"><Zap className="h-4 w-4"/>{images.length>1?(es?'Analizar y componer':'Analyze & compose'):(es?'Crear':'Create')}</button>
    </div>
  );

  // ═══════ COMPOSING ═══════
  if (step==='composing') return (<div className="flex flex-col items-center py-20 space-y-4"><Loader2 className="h-8 w-8 text-gold animate-spin"/><p className="font-display text-[18px]">{es?'Analizando imagenes...':'Analyzing images...'}</p></div>);

  // ═══════ COMPOSE PREVIEW ═══════
  if (step==='compose_preview') return (
    <div className="px-4 lg:px-10 py-6 max-w-[720px] mx-auto space-y-5">
      <h2 className="font-display text-[20px] text-center">{compositionMode==='creative'?(es?'Visual cinematico':'Cinematic visual'):(es?'Composicion':'Composition')}</h2>
      {compositionMode==='structured' && cls.length>0&&(<div className="flex flex-wrap gap-1.5 justify-center">{cls.map((c,i)=>(<div key={i} className="px-2 py-0.5 rounded-full bg-surface-2 border border-border text-[9px]"><span className="text-gold font-medium uppercase">{c.type}</span> <span className="text-fg-muted">{c.description?.slice(0,20)}</span></div>))}</div>)}

      {compositionMode==='structured' ? (
        <ReferenceComposer imageUrls={images.map(i=>i.url)} classifications={cls} aspectRatio={aspect} onComposed={setComposedUrl}/>
      ) : composedUrl ? (
        <div className="space-y-2">
          <img src={composedUrl} alt="Creative composition" className="w-full max-h-[420px] object-contain rounded-xl border border-border"/>
          {creativePrompt && <p className="text-[10px] text-fg-subtle italic line-clamp-2">{creativePrompt}</p>}
        </div>
      ) : (
        <div className="aspect-[9/16] max-h-[380px] rounded-xl border border-border bg-surface-2 flex items-center justify-center"><Loader2 className="h-6 w-6 text-gold animate-spin"/></div>
      )}

      <div className="flex gap-3">
        <button onClick={()=>setStep('upload')} className="h-10 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted">{es?'Volver':'Back'}</button>
        <button onClick={classify} className="h-10 px-4 rounded-lg border border-border bg-surface-2 text-[12px] text-fg-muted flex items-center gap-1.5"><RotateCcw className="h-3 w-3"/>{es?'Recomponer':'Redo'}</button>
        <button onClick={generate} className="flex-1 h-10 rounded-lg gold-grad text-bg text-[13px] font-medium flex items-center justify-center gap-2"><Zap className="h-3.5 w-3.5"/>{es?'Generar':'Generate'}</button>
      </div>
    </div>
  );

  // ═══════ GENERATING ═══════
  if (step==='generating') return (
    <div className="flex flex-col items-center py-20 space-y-6">
      <Loader2 className="h-10 w-10 text-gold animate-spin"/>
      <div className="text-center"><h2 className="font-display text-[22px] mb-1">{es?'Creando...':'Creating...'}</h2><p className="text-[12px] text-fg-muted">{fmt(elapsed)} / ~{fmt(est)}</p></div>
      <div className="w-64 h-1.5 rounded-full bg-surface-3 overflow-hidden"><div className="h-full rounded-full gold-grad transition-all duration-1000" style={{width:Math.min(95,(elapsed/est)*100)+'%'}}/></div>
    </div>
  );

  // ═══════ RESULT ═══════
  if (!result) return null;
  const hasCopy = result.copy.hook || result.copy.cta;
  const hasVideo = result.video?.url;
  const vSrc = hasVideo ? (result.video!.url.includes('supabase') ? result.video!.url : '/api/videos/stream?url='+encodeURIComponent(result.video!.url)) : '';

  return (
    <div className="px-4 lg:px-10 py-6 max-w-[820px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[20px]">{es?'Resultado':'Result'}</h2>
        <button onClick={reset} className="h-8 px-3 rounded-lg border border-border bg-surface-2 text-[10px] text-fg-muted flex items-center gap-1.5"><RotateCcw className="h-3 w-3"/>{es?'Nueva':'New'}</button>
      </div>
      <div className={cn('grid gap-5', hasCopy ? 'grid-cols-1 lg:grid-cols-[1fr_280px]' : 'grid-cols-1 max-w-[480px] mx-auto')}>
        {/* Left: Visual */}
        <div className="space-y-3">
          {hasVideo ? (
            <div className="rounded-xl border border-border overflow-hidden bg-black">
              <div className="relative" style={{aspectRatio: aspect==='1:1'?'1/1':aspect==='4:5'?'4/5':'9/16', maxHeight:420}}>
                {playing ? <video src={vSrc} controls autoPlay playsInline className="w-full h-full object-contain" onEnded={()=>setPlaying(false)}/> : <button onClick={()=>setPlaying(true)} className="w-full h-full flex items-center justify-center bg-surface-2"><div className="h-12 w-12 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center hover:scale-110 transition-transform"><Play className="h-5 w-5 text-gold ml-0.5"/></div></button>}
              </div>
            </div>
          ) : result.composedImage ? (
            <div className="rounded-xl border border-border overflow-hidden">
              <img src={result.composedImage} alt="" className="w-full" style={{maxHeight:420, objectFit:'contain'}}/>
            </div>
          ) : null}
          {/* Open Ad Editor */}
          {result.composedImage && hasCopy && !showEditor && (
            <button onClick={()=>setShowEditor(true)} className="w-full h-10 rounded-lg border border-gold/30 bg-gold/10 text-gold text-[12px] font-medium flex items-center justify-center gap-2 hover:bg-gold/15 transition-colors">
              <Type className="h-3.5 w-3.5"/>{es?'Anadir texto + templates':'Add text + templates'}
            </button>
          )}

          {showEditor && result.composedImage && (
            <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-[14px]">{es?'Editor de anuncio':'Ad Editor'}</h3>
                <button onClick={()=>setShowEditor(false)} className="text-[10px] text-fg-muted hover:text-fg">{es?'Cerrar':'Close'}</button>
              </div>
              <AdEditor
                imageUrl={result.composedImage}
                copy={result.copy}
                aspectRatio={aspect}
                onExport={(url) => {
                  const link = document.createElement('a');
                  link.download = 'ad-final.png';
                  link.href = url;
                  link.click();
                }}
              />
            </div>
          )}

          {/* Downloads */}
          <div className="flex gap-2">
            {result.composedImage && (<a href={result.composedImage} download="campaign-image.png" className="flex-1 h-10 rounded-lg border border-border bg-surface-2 text-[11px] text-fg-muted flex items-center justify-center gap-1.5 hover:text-fg transition-colors"><ImageIcon className="h-3.5 w-3.5"/>{es?'Imagen':'Image'}</a>)}
            {hasVideo && (<a href={result.video!.url} download className="flex-1 h-10 rounded-lg gold-grad text-bg text-[11px] font-medium flex items-center justify-center gap-1.5"><Download className="h-3.5 w-3.5"/>{es?'Video':'Video'}</a>)}
          </div>
        </div>
        {/* Right: Ad Copy Panel */}
        {hasCopy && (<div className="space-y-3">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle flex items-center gap-1.5"><Type className="h-3 w-3 text-gold"/>Ad Copy</span><button onClick={()=>setEditingCopy(!editingCopy)} className="text-[9px] text-fg-muted hover:text-gold flex items-center gap-1"><Pencil className="h-2.5 w-2.5"/>{editingCopy?'Done':'Edit'}</button></div>
            <CF l="Hook" v={editingCopy?editCopy.hook:result.copy.hook} e={editingCopy} ch={v=>setEditCopy(c=>({...c,hook:v}))} cp={()=>cp(editCopy.hook||result.copy.hook,'h')} cd={copied==='h'} big/>
            <CF l="Primary Text" v={editingCopy?editCopy.message:result.copy.message} e={editingCopy} ch={v=>setEditCopy(c=>({...c,message:v}))} cp={()=>cp(editCopy.message||result.copy.message,'m')} cd={copied==='m'}/>
            <div><div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">CTA</div>{editingCopy?<input value={editCopy.cta} onChange={e=>setEditCopy(c=>({...c,cta:e.target.value}))} className="w-full h-8 px-3 rounded-lg border border-border bg-surface-2 text-[11px] focus:outline-none focus:border-gold/40"/>:<div className="flex items-center justify-between"><span className="inline-block px-4 py-1.5 rounded-full bg-gold text-black text-[11px] font-semibold">{result.copy.cta}</span><button onClick={()=>cp(result.copy.cta,'c')} className="h-6 w-6 rounded border border-border bg-surface-2 flex items-center justify-center text-fg-muted">{copied==='c'?<Check className="h-2.5 w-2.5 text-gold"/>:<Copy className="h-2.5 w-2.5"/>}</button></div>}</div>
            <CF l="Headline" v={editingCopy?editCopy.headline:result.copy.headline} e={editingCopy} ch={v=>setEditCopy(c=>({...c,headline:v}))} cp={()=>cp(editCopy.headline||result.copy.headline,'hl')} cd={copied==='hl'}/>
          </div>
          <button onClick={()=>{cp([editCopy.hook||result.copy.hook,editCopy.message||result.copy.message,editCopy.cta].join('\n\n'),'all');}} className="w-full h-9 rounded-lg border border-border bg-surface-2 text-[11px] text-fg-muted flex items-center justify-center gap-1.5">{copied==='all'?<><Check className="h-3 w-3 text-gold"/>{es?'Copiado':'Copied'}</>:<><Copy className="h-3 w-3"/>{es?'Copiar todo':'Copy all'}</>}</button>
        </div>)}
      </div>
    </div>
  );
}

function CF({l,v,e,ch,cp,cd,big}:{l:string;v:string;e:boolean;ch:(v:string)=>void;cp:()=>void;cd:boolean;big?:boolean}) {
  return (<div><div className="text-[9px] uppercase tracking-[0.12em] text-fg-subtle mb-1">{l}</div>{e?<input value={v} onChange={ev=>ch(ev.target.value)} className="w-full h-8 px-3 rounded-lg border border-border bg-surface-2 text-[11px] focus:outline-none focus:border-gold/40"/>:<div className="flex items-start justify-between gap-2"><p className={cn('flex-1',big?'text-[14px] font-display':'text-[11px] text-fg-muted')}>{v||'—'}</p><button onClick={cp} className="h-6 w-6 rounded border border-border bg-surface-2 flex items-center justify-center text-fg-muted shrink-0">{cd?<Check className="h-2.5 w-2.5 text-gold"/>:<Copy className="h-2.5 w-2.5"/>}</button></div>}</div>);
}
