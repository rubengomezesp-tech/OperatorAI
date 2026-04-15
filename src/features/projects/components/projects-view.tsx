'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen, Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const PRESET_COLORS = ['#C9A863', '#A78BFA', '#60A5FA', '#34D399', '#F472B6', '#FB923C', '#F87171', '#94A3B8'];

export function ProjectsView({ initialProjects, totalConversations }: { initialProjects: Project[]; totalConversations: number }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  async function create() {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined, color }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Failed');
      setProjects(prev => [body.project, ...prev]);
      setName('');
      setDescription('');
      setColor(PRESET_COLORS[0]);
      setCreating(false);
      toast.success('Project created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function save(id: string) {
    if (!editName.trim()) return;
    try {
      await fetch('/api/projects/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim(), updated_at: new Date().toISOString() } : p));
      setEditingId(null);
      toast.success('Updated');
    } catch {
      toast.error('Failed');
    }
  }

  async function remove(id: string) {
    if (!confirm('Archive this project? Conversations and documents stay.')) return;
    try {
      await fetch('/api/projects/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success('Archived');
    } catch {
      toast.error('Failed');
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1">Operator</div>
          <h1 className="font-display text-[32px]">Projects</h1>
          <p className="text-[13.5px] text-fg-muted mt-1.5 max-w-[560px]">
            Workspaces per brand or client. Each project gets its own chat history, documents, and context.
          </p>
        </div>
        <Button size="md" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          <span>New project</span>
        </Button>
      </div>

      {creating && (
        <Card>
          <CardBody className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name (e.g. Aurora Studio)"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[14px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
              autoFocus
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One-line description (optional)"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-[13px] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle mr-1">Color</span>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 transition',
                    color === c ? 'border-fg scale-110' : 'border-border'
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setName(''); setDescription(''); }}>Cancel</Button>
              <Button size="sm" onClick={create}>Create</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-2/30 py-16 text-center">
          <FolderOpen className="h-9 w-9 text-fg-subtle mx-auto mb-3" />
          <p className="text-[14px] text-fg-muted mb-1">No projects yet</p>
          <p className="text-[12.5px] text-fg-subtle">Create one for each brand or client you operate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={'/chat?project=' + p.id} className="flex items-start gap-3 min-w-0 flex-1 group">
                    <div
                      className="h-9 w-9 rounded-lg shrink-0"
                      style={{ background: p.color, opacity: 0.85 }}
                    />
                    <div className="min-w-0 flex-1">
                      {editingId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') save(p.id); if (e.key === 'Escape') setEditingId(null); }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 rounded border border-gold/40 bg-surface-2 px-2 py-1 text-[13.5px] text-fg"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); save(p.id); }}
                            className="h-6 w-6 rounded text-gold hover:bg-gold/10 flex items-center justify-center"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-display text-[17px] group-hover:text-gold transition truncate">{p.name}</h3>
                          {p.description && (
                            <p className="text-[12px] text-fg-muted mt-0.5 truncate">{p.description}</p>
                          )}
                        </>
                      )}
                    </div>
                  </Link>
                  {editingId !== p.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                        className="h-7 w-7 rounded-md text-fg-muted hover:text-fg hover:bg-surface-2 flex items-center justify-center"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="h-7 w-7 rounded-md text-fg-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
