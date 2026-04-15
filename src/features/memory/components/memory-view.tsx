'use client';
import { useState } from 'react';
import { Plus, Wand2, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Memory {
  id: string;
  content: string;
  category: string;
  importance: number;
  source: string;
  created_at: string;
  updated_at: string;
}

interface Fingerprint {
  tone_summary: string | null;
  sentence_length: string | null;
  vocabulary_style: string | null;
  preferred_phrases: string[] | null;
  avoided_phrases: string[] | null;
  structural_preferences: string | null;
  sample_count: number | null;
  last_analyzed_at: string | null;
}

const CATEGORY_OPTIONS: Array<{ id: Memory['category']; label: string }> = [
  { id: 'preference', label: 'Preference' },
  { id: 'fact',       label: 'Fact' },
  { id: 'goal',       label: 'Goal' },
  { id: 'context',    label: 'Context' },
  { id: 'general',    label: 'General' },
];

export function MemoryView({
  initialMemories,
  initialFingerprint,
}: {
  initialMemories: Memory[];
  initialFingerprint: Fingerprint | null;
}) {
  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [fp, setFp] = useState<Fingerprint | null>(initialFingerprint);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Memory['category']>('general');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [learningStyle, setLearningStyle] = useState(false);

  async function addMemory() {
    if (!newContent.trim()) return;
    try {
      const res = await fetch('/api/memory/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent.trim(), category: newCategory }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');

      const now = new Date().toISOString();
      setMemories((prev) => [{
        id: body.id,
        content: newContent.trim(),
        category: newCategory,
        importance: 3,
        source: 'manual',
        created_at: now,
        updated_at: now,
      }, ...prev]);
      setNewContent('');
      setAdding(false);
      toast.success('Memory saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return;
    try {
      const res = await fetch('/api/memory/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      setMemories((prev) => prev.map((m) => m.id === id ? { ...m, content: editContent.trim(), updated_at: new Date().toISOString() } : m));
      setEditingId(null);
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  }

  async function deleteMemory(id: string) {
    if (!confirm('Delete this memory?')) return;
    try {
      await fetch('/api/memory/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setMemories((prev) => prev.filter((m) => m.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  }

  async function learnStyle() {
    setLearningStyle(true);
    try {
      const res = await fetch('/api/memory/learn-style', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      if (!body.ok) {
        toast.error('Need ' + (body.needed ?? 10) + '+ conversations first. You have ' + (body.sampleCount ?? 0) + '.');
        return;
      }
      setFp({
        tone_summary: body.fingerprint.tone_summary,
        sentence_length: body.fingerprint.sentence_length,
        vocabulary_style: body.fingerprint.vocabulary_style,
        preferred_phrases: body.fingerprint.preferred_phrases,
        avoided_phrases: body.fingerprint.avoided_phrases,
        structural_preferences: body.fingerprint.structural_preferences,
        sample_count: body.sampleCount,
        last_analyzed_at: new Date().toISOString(),
      });
      toast.success('Voice learned');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLearningStyle(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Your Operator</div>
        <h1 className="font-display text-[32px]">Memory &amp; voice</h1>
        <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
          What your assistant remembers about you, and how it has learned to write like you.
        </p>
      </div>

      {/* Voice fingerprint */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-gold" />
                <h2 className="font-display text-[20px]">Your voice</h2>
              </div>
              <p className="text-[13px] text-fg-muted">
                {fp?.last_analyzed_at
                  ? 'Last analyzed from ' + (fp.sample_count ?? 0) + ' messages.'
                  : 'Not analyzed yet. Send a few messages first, then click Learn my voice.'}
              </p>
            </div>
            <Button size="md" onClick={learnStyle} loading={learningStyle}>
              <Wand2 className="h-4 w-4" />
              <span>{fp?.last_analyzed_at ? 'Re-learn voice' : 'Learn my voice'}</span>
            </Button>
          </div>

          {fp?.last_analyzed_at && (
            <div className="space-y-3 pt-2 border-t border-border">
              {fp.tone_summary && (
                <VoiceLine label="Tone" value={fp.tone_summary} />
              )}
              {fp.vocabulary_style && (
                <VoiceLine label="Vocabulary" value={fp.vocabulary_style} />
              )}
              {fp.sentence_length && (
                <VoiceLine label="Sentence length" value={fp.sentence_length} />
              )}
              {fp.structural_preferences && (
                <VoiceLine label="Structure" value={fp.structural_preferences} />
              )}
              {fp.preferred_phrases && fp.preferred_phrases.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">Preferred phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.preferred_phrases.map((p) => (
                      <span key={p} className="h-6 px-2 rounded bg-gold/10 border border-gold/30 text-[11.5px] text-gold flex items-center">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {fp.avoided_phrases && fp.avoided_phrases.length > 0 && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-1.5">Avoided phrases</div>
                  <div className="flex flex-wrap gap-1.5">
                    {fp.avoided_phrases.map((p) => (
                      <span key={p} className="h-6 px-2 rounded bg-surface-3 border border-border text-[11.5px] text-fg-muted flex items-center line-through">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Memories */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-[20px] mb-1">Memories</h2>
              <p className="text-[13px] text-fg-muted">
                {memories.length} active · Saved automatically when meaningful or when you ask.
              </p>
            </div>
            <Button size="md" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" />
              <span>Add memory</span>
            </Button>
          </div>

          {adding && (
            <div className="rounded-md border border-gold/40 bg-gold/5 p-3 space-y-2">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="I prefer concise bullet summaries over paragraphs..."
                rows={2}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13.5px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id)}
                      className={cn(
                        'h-6 px-2 rounded text-[10.5px] uppercase tracking-[0.1em] border',
                        newCategory === c.id
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'bg-surface-2 border-border text-fg-muted hover:text-fg',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewContent(''); }}>Cancel</Button>
                  <Button size="sm" onClick={addMemory}>Save</Button>
                </div>
              </div>
            </div>
          )}

          {memories.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-surface-2/30 py-10 text-center">
              <p className="text-[13px] text-fg-muted">
                No memories yet. Chat a bit and say &quot;remember that...&quot; or add manually.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {memories.map((m) => (
                <div key={m.id} className="group flex items-start gap-3 rounded-md border border-border bg-surface px-3.5 py-2.5">
                  <div className={cn(
                    'mt-1 h-1.5 w-1.5 rounded-full shrink-0',
                    m.importance >= 4 ? 'bg-gold' : m.importance >= 3 ? 'bg-fg-soft' : 'bg-fg-subtle',
                  )} />
                  <div className="flex-1 min-w-0">
                    {editingId === m.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="flex-1 rounded border border-border bg-surface-2 px-2 py-1 text-[13px] text-fg"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(m.id); if (e.key === 'Escape') setEditingId(null); }}
                        />
                        <button type="button" onClick={() => saveEdit(m.id)} className="h-7 w-7 rounded-md text-gold hover:bg-gold/10 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className="h-7 w-7 rounded-md text-fg-muted hover:bg-surface-2 flex items-center justify-center">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-[13.5px] text-fg leading-snug">{m.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10.5px] uppercase tracking-[0.1em] text-fg-subtle">{m.category}</span>
                          <span className="text-[10.5px] text-fg-subtle">·</span>
                          <span className="text-[10.5px] text-fg-subtle">{m.source}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {editingId !== m.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => { setEditingId(m.id); setEditContent(m.content); }} className="h-7 w-7 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => deleteMemory(m.id)} className="h-7 w-7 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function VoiceLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mb-0.5">{label}</div>
      <p className="text-[13px] text-fg-soft leading-relaxed">{value}</p>
    </div>
  );
}
