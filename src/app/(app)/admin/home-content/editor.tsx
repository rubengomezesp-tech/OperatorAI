'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save, RotateCcw, ExternalLink, Eye, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { HomeContent } from '@/lib/home-content/defaults';

type Lang = 'es' | 'en';

export function HomeContentEditor() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [original, setOriginal] = useState<HomeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState<Lang>('es');
  const [hasOverrides, setHasOverrides] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['hero']));

  useEffect(() => {
    loadContent();
  }, []);

  async function loadContent() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/home-content');
      const data = await res.json();
      setContent(data.content);
      setOriginal(data.content);
      setHasOverrides(data.hasOverrides);
    } catch {
      toast.error('Error loading home content');
    } finally {
      setLoading(false);
    }
  }

  function isDirty() {
    return JSON.stringify(content) !== JSON.stringify(original);
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/home-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Home content saved — live on production');
        setOriginal(content);
        setHasOverrides(true);
      } else {
        toast.error(data.error ?? 'Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset to defaults? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/admin/home-content', { method: 'DELETE' });
      if (res.ok) {
        toast.success('Reset to defaults');
        await loadContent();
      } else {
        toast.error('Reset failed');
      }
    } catch {
      toast.error('Reset failed');
    }
  }

  function toggleSection(id: string) {
    const next = new Set(openSections);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenSections(next);
  }

  // Helper: update a bilingual field
  const updateBilingual = useCallback((path: string[], value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev)) as HomeContent;
      let cursor: Record<string, unknown> = copy as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) {
        cursor = cursor[path[i]] as Record<string, unknown>;
      }
      const last = path[path.length - 1];
      const node = cursor[last] as { es: string; en: string };
      cursor[last] = { ...node, [lang]: value };
      return copy;
    });
  }, [lang]);

  if (loading || !content) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>;
  }

  const dirty = isDirty();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-[24px] tracking-tight mb-1">Home Content</h2>
          <p className="text-[13px] text-fg-muted">Edit every text on your landing page in real time. ES/EN supported.</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="h-9 px-3 rounded-md border border-border bg-surface-2 hover:bg-surface-3 text-[12.5px] flex items-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </a>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border border-border bg-surface-2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded bg-surface-3">
            {(['es', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'h-7 px-3 rounded text-[11.5px] uppercase tracking-wider transition-colors',
                  lang === l ? 'bg-gold text-bg font-medium' : 'text-fg-muted hover:text-fg'
                )}
              >
                {l === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
          {hasOverrides && (
            <span className="text-[11px] uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Custom
            </span>
          )}
          {dirty && (
            <span className="text-[11px] uppercase tracking-wider text-rose-400">
              Unsaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasOverrides && (
            <button
              onClick={handleReset}
              className="h-8 px-3 rounded-md border border-border hover:border-rose-500/30 text-[12px] text-fg-muted hover:text-rose-400 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to defaults
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={cn(
              'h-9 px-5 rounded-md flex items-center gap-2 text-[13px] font-medium transition-all',
              dirty
                ? 'gold-grad text-bg hover:scale-[1.02]'
                : 'bg-surface-3 text-fg-subtle cursor-not-allowed'
            )}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Hero */}
      <Section id="hero" title="Hero" desc="Top of the page" open={openSections.has('hero')} onToggle={toggleSection}>
        <Field label="Badge" value={content.badge[lang]} onChange={(v) => updateBilingual(['badge'], v)} />
        <Field label="Title" value={content.hero_title[lang]} onChange={(v) => updateBilingual(['hero_title'], v)} />
        <Field label="Title (gold accent)" value={content.hero_title_accent[lang]} onChange={(v) => updateBilingual(['hero_title_accent'], v)} />
        <Field label="Subtitle" value={content.hero_subtitle[lang]} onChange={(v) => updateBilingual(['hero_subtitle'], v)} multiline />
        <Field label="Primary CTA" value={content.cta_primary[lang]} onChange={(v) => updateBilingual(['cta_primary'], v)} />
        <Field label="Trial badge" value={content.trial_badge[lang]} onChange={(v) => updateBilingual(['trial_badge'], v)} />
      </Section>

      {/* How it works */}
      <Section id="how" title="How it works" desc="3-step section" open={openSections.has('how')} onToggle={toggleSection}>
        <Field label="Kicker" value={content.how_kicker[lang]} onChange={(v) => updateBilingual(['how_kicker'], v)} />
        <Field label="Title" value={content.how_title[lang]} onChange={(v) => updateBilingual(['how_title'], v)} />
        <Field label="Subtitle" value={content.how_subtitle[lang]} onChange={(v) => updateBilingual(['how_subtitle'], v)} multiline />
        <div className="space-y-3 pt-2 border-t border-border">
          {content.steps.map((s, i) => (
            <div key={i} className="p-3 rounded-md bg-surface-3/40 border border-border space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-gold-soft">Step {s.number}</div>
              <Field label="Title" value={s.title[lang]} onChange={(v) => updateBilingual(['steps', String(i), 'title'], v)} />
              <Field label="Description" value={s.desc[lang]} onChange={(v) => updateBilingual(['steps', String(i), 'desc'], v)} multiline />
              <Field label="Timing" value={s.timing[lang]} onChange={(v) => updateBilingual(['steps', String(i), 'timing'], v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Verticals */}
      <Section id="verticals" title="Verticals" desc="9 industries" open={openSections.has('verticals')} onToggle={toggleSection}>
        <Field label="Kicker" value={content.verticals_kicker[lang]} onChange={(v) => updateBilingual(['verticals_kicker'], v)} />
        <Field label="Title" value={content.verticals_title[lang]} onChange={(v) => updateBilingual(['verticals_title'], v)} />
        <Field label="Subtitle" value={content.verticals_subtitle[lang]} onChange={(v) => updateBilingual(['verticals_subtitle'], v)} multiline />
        <div className="space-y-3 pt-2 border-t border-border">
          {content.verticals.map((v, i) => (
            <div key={v.key} className="p-3 rounded-md bg-surface-3/40 border border-border space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-gold-soft">{v.key}</div>
              <Field label="Label" value={v.label[lang]} onChange={(val) => updateBilingual(['verticals', String(i), 'label'], val)} />
              <Field label="Pitch" value={v.pitch[lang]} onChange={(val) => updateBilingual(['verticals', String(i), 'pitch'], val)} />
              <div className="text-[11px] text-fg-subtle uppercase tracking-wider mt-2">Demo dialogue</div>
              <Field label="User msg" value={v.demo.user[lang]} onChange={(val) => updateBilingual(['verticals', String(i), 'demo', 'user'], val)} multiline />
              <Field label="Operator intro" value={v.demo.operatorIntro[lang]} onChange={(val) => updateBilingual(['verticals', String(i), 'demo', 'operatorIntro'], val)} />
              {v.demo.items.map((it, ii) => (
                <Field key={ii} label={`Item ${ii + 1}`} value={it[lang]} onChange={(val) => updateBilingual(['verticals', String(i), 'demo', 'items', String(ii)], val)} />
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* Capabilities */}
      <Section id="capabilities" title="Capabilities" desc="6 features grid" open={openSections.has('capabilities')} onToggle={toggleSection}>
        <Field label="Kicker" value={content.capabilities_kicker[lang]} onChange={(v) => updateBilingual(['capabilities_kicker'], v)} />
        <Field label="Title" value={content.capabilities_title[lang]} onChange={(v) => updateBilingual(['capabilities_title'], v)} />
        <Field label="Subtitle" value={content.capabilities_subtitle[lang]} onChange={(v) => updateBilingual(['capabilities_subtitle'], v)} multiline />
        <div className="space-y-3 pt-2 border-t border-border">
          {content.capabilities.map((c, i) => (
            <div key={i} className="p-3 rounded-md bg-surface-3/40 border border-border space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-gold-soft">Icon: {c.icon}</div>
              <Field label="Title" value={c.title[lang]} onChange={(v) => updateBilingual(['capabilities', String(i), 'title'], v)} />
              <Field label="Description" value={c.desc[lang]} onChange={(v) => updateBilingual(['capabilities', String(i), 'desc'], v)} multiline />
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section id="final" title="Final CTA" desc="Bottom of page" open={openSections.has('final')} onToggle={toggleSection}>
        <Field label="Kicker" value={content.final_kicker[lang]} onChange={(v) => updateBilingual(['final_kicker'], v)} />
        <Field label="Title" value={content.final_title[lang]} onChange={(v) => updateBilingual(['final_title'], v)} />
        <Field label="Subtitle" value={content.final_subtitle[lang]} onChange={(v) => updateBilingual(['final_subtitle'], v)} multiline />
        <Field label="CTA button" value={content.final_cta[lang]} onChange={(v) => updateBilingual(['final_cta'], v)} />
        <Field label="Note below CTA" value={content.final_note[lang]} onChange={(v) => updateBilingual(['final_note'], v)} />
      </Section>

      {/* Manifesto */}
      <Section id="manifesto" title="Manifesto" desc="Tagline tras hero" open={openSections.has('manifesto')} onToggle={toggleSection}>
        <Field label="Manifesto" value={content.manifesto[lang]} onChange={(v) => updateBilingual(['manifesto'], v)} />
      </Section>

      {/* Sticky save */}
      {dirty && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 px-6 rounded-full gold-grad text-bg font-medium text-[13.5px] flex items-center gap-2 shadow-[0_8px_30px_rgb(201_168_99_/_0.5)] hover:scale-[1.02] transition-transform"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ id, title, desc, open, onToggle, children }: {
  id: string;
  title: string;
  desc: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 overflow-hidden">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-3/30 transition-colors text-left"
      >
        <div>
          <div className="font-display text-[16px] tracking-tight">{title}</div>
          <div className="text-[11.5px] text-fg-subtle">{desc}</div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-fg-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="p-4 pt-0 space-y-3 border-t border-border">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, multiline }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10.5px] uppercase tracking-wider text-fg-subtle mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-bg/40 border border-border rounded-md px-3 py-2 text-[13.5px] text-fg focus:outline-none focus:border-gold/40 resize-y min-h-[60px]"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 bg-bg/40 border border-border rounded-md px-3 text-[13.5px] text-fg focus:outline-none focus:border-gold/40"
        />
      )}
    </div>
  );
}
