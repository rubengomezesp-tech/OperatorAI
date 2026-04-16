'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Palette, Type, X as XIcon, Plus } from 'lucide-react';

const tones = [
  { id: 'minimal', label: 'Minimal', sample: 'Less is more.' },
  { id: 'editorial', label: 'Editorial', sample: 'A quiet kind of luxury.' },
  { id: 'bold', label: 'Bold', sample: "We don't whisper. We move." },
  { id: 'playful', label: 'Playful', sample: 'Serious work. Fun people.' },
  { id: 'professional', label: 'Professional', sample: 'Precision. Trust. Delivery.' },
] as const;

interface Props {
  initial: Record<string, unknown>;
}

export function BrandOsForm({ initial }: Props) {
  const [colors, setColors] = useState<string[]>(
    Array.isArray(initial.brand_colors) ? (initial.brand_colors as string[]) : []
  );
  const [newColor, setNewColor] = useState('#c9a863');
  const [tone, setTone] = useState((initial.tone as string) ?? 'editorial');
  const [alwaysWords, setAlwaysWords] = useState<string[]>(
    Array.isArray(initial.always_use_words) ? (initial.always_use_words as string[]) : []
  );
  const [neverWords, setNeverWords] = useState<string[]>(
    Array.isArray(initial.never_use_words) ? (initial.never_use_words as string[]) : []
  );
  const [newAlwaysWord, setNewAlwaysWord] = useState('');
  const [newNeverWord, setNewNeverWord] = useState('');
  const [strictness, setStrictness] = useState((initial.validator_strictness as string) ?? 'medium');
  const [autoCorrect, setAutoCorrect] = useState(initial.auto_correct !== false);
  const [saving, setSaving] = useState(false);

  function addColor() {
    if (!newColor.match(/^#[0-9a-fA-F]{6}$/)) {
      toast.error('Enter a valid hex color (e.g., #c9a863)');
      return;
    }
    if (colors.length >= 6) {
      toast.error('Maximum 6 colors');
      return;
    }
    setColors([...colors, newColor]);
  }

  function removeColor(i: number) {
    setColors(colors.filter((_, idx) => idx !== i));
  }

  function addWord(kind: 'always' | 'never') {
    const w = (kind === 'always' ? newAlwaysWord : newNeverWord).trim().toLowerCase();
    if (w.length < 2) return;
    if (kind === 'always') {
      if (alwaysWords.includes(w) || alwaysWords.length >= 15) return;
      setAlwaysWords([...alwaysWords, w]);
      setNewAlwaysWord('');
    } else {
      if (neverWords.includes(w) || neverWords.length >= 15) return;
      setNeverWords([...neverWords, w]);
      setNewNeverWord('');
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/brand-os/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_colors: colors,
          tone,
          always_use_words: alwaysWords,
          never_use_words: neverWords,
          validator_strictness: strictness,
          auto_correct: autoCorrect,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Brand OS updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Colors */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Brand colors</h2>
          </div>
          <p className="text-[12px] text-fg-muted">Up to 6 colors. Imagery and video will favor these.</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-surface-2 pl-2 pr-1 py-1">
                <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: c }} />
                <span className="text-[12px] font-mono uppercase">{c}</span>
                <button
                  type="button"
                  onClick={() => removeColor(i)}
                  className="h-5 w-5 rounded hover:bg-surface-3 flex items-center justify-center"
                  aria-label="Remove color"
                >
                  <XIcon className="h-3 w-3 text-fg-muted" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-14 rounded border border-border bg-surface-2 cursor-pointer"
            />
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              placeholder="#c9a863"
              className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-gold/60"
            />
            <Button type="button" onClick={addColor} size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tone */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Brand tone</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tones.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTone(t.id)}
                className={`text-left rounded-md border p-3 transition ${
                  tone === t.id ? 'bg-gold/10 border-gold/50' : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{t.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5 italic">&quot;{t.sample}&quot;</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Words */}
      <Card>
        <CardBody className="space-y-5">
          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Always use</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {alwaysWords.map((w) => (
                <span key={w} className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 text-[11.5px] text-green-400">
                  {w}
                  <button type="button" onClick={() => setAlwaysWords(alwaysWords.filter((x) => x !== w))}>
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAlwaysWord}
                onChange={(e) => setNewAlwaysWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord('always'))}
                placeholder="e.g., curated, timeless, considered"
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] focus:outline-none focus:border-gold/60"
              />
              <Button type="button" onClick={() => addWord('always')} size="sm" variant="outline">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Never use</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {neverWords.map((w) => (
                <span key={w} className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 border border-danger/30 px-2.5 py-0.5 text-[11.5px] text-danger">
                  {w}
                  <button type="button" onClick={() => setNeverWords(neverWords.filter((x) => x !== w))}>
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNeverWord}
                onChange={(e) => setNewNeverWord(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord('never'))}
                placeholder="e.g., cheap, basic, generic"
                className="flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] focus:outline-none focus:border-gold/60"
              />
              <Button type="button" onClick={() => addWord('never')} size="sm" variant="outline">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Validator settings */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gold" />
            <h2 className="font-display text-[18px]">Validator</h2>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[13px] font-medium">Auto-correct violations</div>
              <div className="text-[11.5px] text-fg-muted">When an output breaks a rule, Operator regenerates it.</div>
            </div>
            <button
              type="button"
              onClick={() => setAutoCorrect(!autoCorrect)}
              className={`relative h-6 w-11 rounded-full transition-colors ${autoCorrect ? 'bg-gold' : 'bg-surface-3'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoCorrect ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-2">Strictness</div>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'strict'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrictness(s)}
                  className={`rounded-md border py-2 text-[12px] transition capitalize ${
                    strictness === s
                      ? 'bg-gold/10 border-gold/50 text-gold'
                      : 'bg-surface-2 border-border text-fg-muted hover:border-border/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} size="lg">
          Save Brand OS
        </Button>
      </div>
    </div>
  );
}
