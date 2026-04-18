'use client';
import { useState, useEffect } from 'react';
import { Save, Palette, Type, Target, Eye, Shield, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface BrandProfile {
  brand_name: string;
  description: string;
  vibe: string;
  colors: string[];
  fonts: string[];
  target_audience: string;
  tone_keywords: string[];
  visual_style: string;
  industry: string;
  content_pillars: string[];
  avoid_keywords: string[];
  instagram_handle: string;
  brand_values: string[];
  competitors?: string[];
}

const DEFAULT: BrandProfile = {
  brand_name: '', description: '', vibe: '', colors: [], fonts: [],
  target_audience: '', tone_keywords: [], visual_style: '', industry: '',
  content_pillars: [], avoid_keywords: [], instagram_handle: '', brand_values: [],
};

const PRESET_COLORS = ['#C9A863', '#1A1A1B', '#FFFFFF', '#0A0A0B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function BrandOSPage() {
  const { locale } = useI18n();
  const [bp, setBp] = useState<BrandProfile>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newColor, setNewColor] = useState('#C9A863');
  const [newTag, setNewTag] = useState('');
  const [tagField, setTagField] = useState<keyof BrandProfile | null>(null);

  useEffect(() => {
    fetch('/api/brand/get').then(r => r.json()).then(data => {
      if (data.profile) setBp({ ...DEFAULT, ...data.profile });
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/brand/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bp),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(locale === 'es' ? 'Perfil de marca guardado' : 'Brand profile saved');
    } catch {
      toast.error(locale === 'es' ? 'Error al guardar' : 'Failed to save');
    } finally { setSaving(false); }
  }

  function addToArray(field: keyof BrandProfile, value: string) {
    if (!value.trim()) return;
    setBp(prev => ({ ...prev, [field]: [...(prev[field] as string[]), value.trim()] }));
  }

  function removeFromArray(field: keyof BrandProfile, index: number) {
    setBp(prev => ({ ...prev, [field]: (prev[field] as string[]).filter((_, i) => i !== index) }));
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>;

  const t = (en: string, es: string) => locale === 'es' ? es : en;

  return (
    <div className="px-6 lg:px-10 py-8 max-w-[860px] w-full mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
          <h1 className="font-display text-[32px]">Brand OS</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5">{t('Your brand DNA. Every AI output respects these rules.', 'El ADN de tu marca. Cada salida de IA respeta estas reglas.')}</p>
        </div>
        <Button onClick={save} loading={saving}><Save className="h-4 w-4" /><span>{t('Save', 'Guardar')}</span></Button>
      </div>

      {/* Identity */}
      <Card><CardBody className="space-y-4">
        <div className="flex items-center gap-2 text-gold"><Shield className="h-4 w-4" /><span className="text-[10.5px] uppercase tracking-[0.18em]">{t('Identity', 'Identidad')}</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t('Brand name', 'Nombre de marca')} value={bp.brand_name} onChange={v => setBp(p => ({ ...p, brand_name: v }))} placeholder="Operator AI" />
          <Field label={t('Industry', 'Industria')} value={bp.industry} onChange={v => setBp(p => ({ ...p, industry: v }))} placeholder={t('Technology / SaaS', 'Tecnología / SaaS')} />
        </div>
        <Field label={t('Description', 'Descripción')} value={bp.description} onChange={v => setBp(p => ({ ...p, description: v }))} placeholder={t('What does your brand do?', 'Qué hace tu marca?')} multiline />
        <Field label={t('Vibe / Personality', 'Vibra / Personalidad')} value={bp.vibe} onChange={v => setBp(p => ({ ...p, vibe: v }))} placeholder={t('Premium, minimal, confident, modern', 'Premium, minimal, seguro, moderno')} />
        <Field label="Instagram" value={bp.instagram_handle} onChange={v => setBp(p => ({ ...p, instagram_handle: v }))} placeholder="@yourbrand" />
      </CardBody></Card>

      {/* Visual System */}
      <Card><CardBody className="space-y-4">
        <div className="flex items-center gap-2 text-gold"><Palette className="h-4 w-4" /><span className="text-[10.5px] uppercase tracking-[0.18em]">{t('Visual System', 'Sistema Visual')}</span></div>
        <div>
          <label className="text-[12px] uppercase tracking-[0.12em] text-fg-muted mb-2 block">{t('Brand Colors', 'Colores de marca')}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {bp.colors.map((c, i) => (
              <button key={i} onClick={() => removeFromArray('colors', i)} className="group relative h-10 w-10 rounded-lg border-2 border-border hover:border-red-400 transition-colors" style={{ background: c }}>
                <X className="h-3 w-3 text-white absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 drop-shadow" />
              </button>
            ))}
            <div className="flex items-center gap-1">
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 w-10 rounded-lg cursor-pointer border border-border" />
              <button onClick={() => { addToArray('colors', newColor); }} className="h-10 w-10 rounded-lg border border-dashed border-border flex items-center justify-center text-fg-muted hover:text-gold hover:border-gold/40 transition-colors"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map(c => (
              <button key={c} onClick={() => addToArray('colors', c)} className="h-6 w-6 rounded border border-border hover:scale-110 transition-transform" style={{ background: c }} />
            ))}
          </div>
        </div>
        <Field label={t('Visual Style', 'Estilo Visual')} value={bp.visual_style} onChange={v => setBp(p => ({ ...p, visual_style: v }))} placeholder={t('Dark, cinematic, editorial, warm tones', 'Oscuro, cinematográfico, editorial, tonos cálidos')} />
        <TagField label={t('Fonts', 'Tipografías')} items={bp.fonts} onAdd={v => addToArray('fonts', v)} onRemove={i => removeFromArray('fonts', i)} placeholder="Inter, Instrument Serif..." />
      </CardBody></Card>

      {/* Voice & Audience */}
      <Card><CardBody className="space-y-4">
        <div className="flex items-center gap-2 text-gold"><Target className="h-4 w-4" /><span className="text-[10.5px] uppercase tracking-[0.18em]">{t('Voice & Audience', 'Voz y Audiencia')}</span></div>
        <Field label={t('Target Audience', 'Audiencia objetivo')} value={bp.target_audience} onChange={v => setBp(p => ({ ...p, target_audience: v }))} placeholder={t('CEOs, founders, marketing directors, 25-45', 'CEOs, fundadores, directores de marketing, 25-45')} multiline />
        <TagField label={t('Tone Keywords', 'Palabras clave de tono')} items={bp.tone_keywords} onAdd={v => addToArray('tone_keywords', v)} onRemove={i => removeFromArray('tone_keywords', i)} placeholder={t('confident, elegant, direct', 'seguro, elegante, directo')} />
        <TagField label={t('Brand Values', 'Valores de marca')} items={bp.brand_values} onAdd={v => addToArray('brand_values', v)} onRemove={i => removeFromArray('brand_values', i)} placeholder={t('innovation, simplicity, trust', 'innovación, simplicidad, confianza')} />
        <TagField label={t('Content Pillars', 'Pilares de contenido')} items={bp.content_pillars} onAdd={v => addToArray('content_pillars', v)} onRemove={i => removeFromArray('content_pillars', i)} placeholder={t('AI tutorials, brand tips, behind the scenes', 'Tutoriales IA, tips de marca, detrás de cámaras')} />
      </CardBody></Card>

      {/* Guardrails */}
      <Card><CardBody className="space-y-4">
        <div className="flex items-center gap-2 text-gold"><Eye className="h-4 w-4" /><span className="text-[10.5px] uppercase tracking-[0.18em]">{t('Guardrails', 'Restricciones')}</span></div>
        <TagField label={t('Avoid these words/styles', 'Evitar estas palabras/estilos')} items={bp.avoid_keywords} onAdd={v => addToArray('avoid_keywords', v)} onRemove={i => removeFromArray('avoid_keywords', i)} placeholder={t('cheap, discount, basic, clipart', 'barato, descuento, básico, clipart')} />
        <TagField label={t('Competitors (for differentiation)', 'Competidores (para diferenciación)')} items={bp.competitors ?? []} onAdd={v => { setBp(p => ({ ...p, competitors: [...(p.competitors ?? []), v.trim()] })); }} onRemove={i => { setBp(p => ({ ...p, competitors: (p.competitors ?? []).filter((_, idx) => idx !== i) })); }} placeholder="Canva, Jasper, Copy.ai..." />
      </CardBody></Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} size="md"><Save className="h-4 w-4" /><span>{t('Save Brand Profile', 'Guardar Perfil de Marca')}</span></Button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const cls = "w-full rounded-md border border-border bg-surface-2 px-3.5 py-2.5 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15";
  return (
    <div>
      <label className="text-[12px] uppercase tracking-[0.12em] text-fg-muted mb-1.5 block">{label}</label>
      {multiline ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} className={cls + " resize-none"} /> : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />}
    </div>
  );
}

function TagField({ label, items, onAdd, onRemove, placeholder }: { label: string; items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void; placeholder?: string }) {
  const [val, setVal] = useState('');
  return (
    <div>
      <label className="text-[12px] uppercase tracking-[0.12em] text-fg-muted mb-1.5 block">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-gold/10 border border-gold/20 text-[12px] text-gold">
            {item}
            <button onClick={() => onRemove(i)} className="hover:text-red-400 transition-colors"><X className="h-2.5 w-2.5" /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(val); setVal(''); } }} placeholder={placeholder} className="flex-1 h-8 rounded-md border border-border bg-surface-2 px-3 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60" />
        <button onClick={() => { onAdd(val); setVal(''); }} className="h-8 px-3 rounded-md border border-border bg-surface-2 text-[12px] text-fg-muted hover:text-gold hover:border-gold/40 transition-colors"><Plus className="h-3 w-3" /></button>
      </div>
    </div>
  );
}
