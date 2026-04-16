'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';

const categories = [
  { id: 'content', label: 'Content', desc: 'Posts, emails, copy' },
  { id: 'campaign', label: 'Campaign', desc: 'Full launches, multi-channel' },
  { id: 'research', label: 'Research', desc: 'Market, competitors, leads' },
  { id: 'operations', label: 'Operations', desc: 'Outreach, follow-ups, tasks' },
  { id: 'growth', label: 'Growth', desc: 'Funnel, retention, acquisition' },
];

const autonomyLevels = [
  { id: 'review', label: 'Review each step', desc: 'Maximum control. You approve everything.' },
  { id: 'auto', label: 'Auto-execute within bounds', desc: 'Operator proceeds unless it hits a guardrail.' },
  { id: 'scheduled', label: 'Scheduled', desc: 'Runs on a schedule. You get a summary.' },
];

export function MissionNewForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [category, setCategory] = useState('content');
  const [autonomy, setAutonomy] = useState('review');
  const [loading, setLoading] = useState(false);

  async function deploy() {
    if (!title.trim() || objective.trim().length < 10) {
      toast.error('Give your mission a title and clear objective');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/missions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, objective, category, autonomyLevel: autonomy }),
      });
      if (!res.ok) throw new Error('Failed to deploy');
      const body = await res.json();
      toast.success('Mission deployed');
      router.push(`/missions/${body.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Deploy failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Mission title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Grow my Instagram to 10k followers"
              className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[15px] focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
            />
          </div>
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle block mb-2">Objective (what success looks like)</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="In 90 days: double followers, 5% engagement rate, 3 posts per week. All on-brand, using my existing style."
              rows={4}
              className="w-full rounded-md border border-border bg-surface-2 px-4 py-3 text-[14px] focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/15 resize-none"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Category</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`text-left rounded-md border p-3 transition ${
                  category === c.id
                    ? 'bg-gold/10 border-gold/50'
                    : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{c.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5">{c.desc}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Autonomy level</div>
          <div className="space-y-2">
            {autonomyLevels.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAutonomy(a.id)}
                className={`w-full text-left rounded-md border p-3 transition ${
                  autonomy === a.id
                    ? 'bg-gold/10 border-gold/50'
                    : 'bg-surface-2 border-border hover:border-border/60'
                }`}
              >
                <div className="text-[13px] font-medium">{a.label}</div>
                <div className="text-[11.5px] text-fg-muted mt-0.5">{a.desc}</div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => window.history.back()}>Cancel</Button>
        <Button onClick={deploy} loading={loading} size="lg">
          Deploy mission
        </Button>
      </div>
    </div>
  );
}
