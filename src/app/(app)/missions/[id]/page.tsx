import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ChevronLeft, Rocket, CheckCircle2, Clock, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  const { data: mission } = await (svc.from as any)('missions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!mission) notFound();
  const m = mission as {
    id: string; title: string; objective: string; status: string; progress: number;
    category: string | null; created_at: string; due_at: string | null;
  };

  const { data: stepsData } = await (svc.from as any)('mission_steps')
    .select('*')
    .eq('mission_id', id)
    .order('step_order', { ascending: true });
  const steps = (stepsData as Array<{
    id: string; step_order: number; title: string; description: string | null;
    status: string; agent_type: string | null;
  }>) ?? [];

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[820px] w-full mx-auto">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted hover:text-gold transition mb-6"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to Missions</span>
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <Rocket className="h-4 w-4 text-gold" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-gold">{m.status}</span>
      </div>
      <h1 className="font-display text-[34px] leading-tight mb-3">{m.title}</h1>
      <p className="text-[14px] text-fg-muted mb-8 max-w-[620px] leading-relaxed">{m.objective}</p>

      {m.status === 'running' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Progress</span>
            <span className="text-[13px] font-medium text-gold">{m.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full gold-grad transition-all" style={{ width: `${m.progress}%` }} />
          </div>
        </div>
      )}

      <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-4">Steps</div>
      {steps.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center">
          <Clock className="h-6 w-6 text-fg-subtle mx-auto mb-2" />
          <p className="text-[13px] text-fg-muted">
            Steps will appear here as Operator orchestrates the mission.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, i) => {
            const StatusIcon = step.status === 'completed' ? CheckCircle2
              : step.status === 'running' ? Play
              : Clock;
            const color = step.status === 'completed' ? 'text-green-400'
              : step.status === 'running' ? 'text-gold'
              : 'text-fg-muted';
            return (
              <div key={step.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
                <div className="h-7 w-7 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0 text-[11px] font-mono text-fg-muted">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusIcon className={`h-3.5 w-3.5 ${color}`} />
                    <span className="text-[13.5px] font-medium">{step.title}</span>
                  </div>
                  {step.description && (
                    <p className="text-[12px] text-fg-muted leading-relaxed">{step.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
