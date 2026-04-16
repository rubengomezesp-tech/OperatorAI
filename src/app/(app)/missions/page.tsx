import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { resolveOrgContext } from '@/features/chat/server/resolve-org-context';
import { Rocket, Plus, CheckCircle2, Clock, AlertCircle, Play } from 'lucide-react';
import { MissionsDeployCta } from '@/features/missions/components/deploy-cta';

export const dynamic = 'force-dynamic';

interface Mission {
  id: string;
  title: string;
  objective: string;
  category: string | null;
  status: string;
  progress: number;
  created_at: string;
  due_at: string | null;
}

const templates = [
  {
    id: 'ig-growth',
    title: 'Grow my Instagram',
    description: '30-day plan with weekly content generation and engagement tracking.',
    category: 'growth',
    icon: '📈',
  },
  {
    id: 'launch-campaign',
    title: 'Launch a campaign',
    description: 'Full campaign: research, copy, visuals, and scheduling in one mission.',
    category: 'campaign',
    icon: '🚀',
  },
  {
    id: 'content-week',
    title: '7 days of content',
    description: 'A week of on-brand posts across channels, pre-scheduled.',
    category: 'content',
    icon: '✍️',
  },
  {
    id: 'competitor-watch',
    title: 'Watch my competitors',
    description: 'Weekly digest of what competitors are doing, with opportunities flagged.',
    category: 'research',
    icon: '🔍',
  },
  {
    id: 'sales-outreach',
    title: 'Cold outreach campaign',
    description: 'Research prospects, draft personalized emails, track responses.',
    category: 'operations',
    icon: '📬',
  },
];

export default async function MissionsPage() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) redirect('/login');

  const svc = createSupabaseServiceClient();
  let missions: Mission[] = [];

  try {
    const { orgId } = await resolveOrgContext(svc, user.id);
    const { data } = await (svc.from as any)('missions')
      .select('id, title, objective, category, status, progress, created_at, due_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20);
    missions = (data as Mission[]) ?? [];
  } catch {
    // User has no org yet
  }

  const active = missions.filter((m) => m.status === 'running');
  const completed = missions.filter((m) => m.status === 'completed');

  return (
    <div className="px-6 lg:px-10 py-10 max-w-[960px] w-full mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-10">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5">Operator AI</div>
          <h1 className="font-display text-[40px] leading-tight mb-2">Missions</h1>
          <p className="text-[14px] text-fg-muted max-w-[540px]">
            Objectives that run on their own. Deploy one &mdash; Operator handles the rest.
          </p>
        </div>
        <MissionsDeployCta />
      </div>

      {/* Active missions */}
      {active.length > 0 && (
        <section className="mb-10">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            <span>Running ({active.length})</span>
          </div>
          <div className="space-y-2">
            {active.map((m) => <MissionRow key={m.id} mission={m} />)}
          </div>
        </section>
      )}

      {/* Templates — show if no missions or as always-available */}
      <section className="mb-10">
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Mission templates</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <Link
              key={t.id}
              href={`/missions/new?template=${t.id}`}
              className="group rounded-lg border border-border bg-surface p-4 hover:border-gold/40 hover:bg-surface-2 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-[22px] shrink-0">{t.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium mb-1 group-hover:text-gold transition-colors">{t.title}</div>
                  <p className="text-[12px] text-fg-muted leading-relaxed">{t.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Completed missions */}
      {completed.length > 0 && (
        <section>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-fg-subtle mb-3">Completed ({completed.length})</div>
          <div className="space-y-2">
            {completed.slice(0, 5).map((m) => <MissionRow key={m.id} mission={m} />)}
          </div>
        </section>
      )}

      {/* Empty state when no missions */}
      {missions.length === 0 && (
        <section className="mt-8 rounded-xl border border-dashed border-border bg-surface/40 py-12 px-6 text-center">
          <Rocket className="h-8 w-8 text-gold mx-auto mb-3" />
          <h3 className="font-display text-[20px] mb-1.5">No missions yet</h3>
          <p className="text-[13px] text-fg-muted max-w-[380px] mx-auto mb-5">
            Pick a template above to deploy your first mission, or write your own objective from scratch.
          </p>
          <Link
            href="/missions/new"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md gold-grad text-bg text-[13px] font-medium hover:brightness-110 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Create custom mission
          </Link>
        </section>
      )}
    </div>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const statusColors: Record<string, string> = {
    running: 'text-gold',
    completed: 'text-green-400',
    failed: 'text-danger',
    paused: 'text-fg-muted',
    draft: 'text-fg-subtle',
  };
  const StatusIcon = mission.status === 'completed' ? CheckCircle2
    : mission.status === 'failed' ? AlertCircle
    : mission.status === 'running' ? Play
    : Clock;

  return (
    <Link
      href={`/missions/${mission.id}`}
      className="group block rounded-lg border border-border bg-surface p-4 hover:border-gold/40 hover:bg-surface-2 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`h-3.5 w-3.5 ${statusColors[mission.status] ?? 'text-fg-muted'}`} />
            <span className="text-[13.5px] font-medium group-hover:text-gold transition-colors truncate">{mission.title}</span>
          </div>
          <p className="text-[12px] text-fg-muted line-clamp-1">{mission.objective}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-[0.12em] text-fg-subtle">{mission.status}</div>
          {mission.status === 'running' && (
            <div className="mt-1.5 w-24 h-1 rounded-full bg-surface-3 overflow-hidden">
              <div className="h-full gold-grad transition-all" style={{ width: `${mission.progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
