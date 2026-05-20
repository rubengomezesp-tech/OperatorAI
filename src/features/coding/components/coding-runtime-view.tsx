'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Code2,
  FileSearch,
  GitBranch,
  GitCompare,
  KeyRound,
  ListChecks,
  Loader2,
  LockKeyhole,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'plan' | 'dry-run' | 'run';

interface StatusResponse {
  ok: boolean;
  bridgeAvailable?: boolean;
  modelAvailable?: boolean;
  model?: string;
  endpoint?: string;
  hasApiKey?: boolean;
  diagnostic?: {
    bridge?: string | null;
    modelStage?: string | null;
    modelMessage?: string | null;
  };
}

interface MissionData {
  runtime: string;
  workspace: string | null;
  mode: string;
  summary: string;
  analysis: string | null;
  text: string;
  requestedMode: Mode;
  completedAt: string;
}

interface MissionResponse {
  ok: boolean;
  data?: MissionData;
  error?: string;
  message?: string;
}

interface SectionMap {
  task: string;
  gitStatus: string;
  gitDiff: string;
  project: string;
  files: string;
  searches: string;
  safety: string;
}

const DEFAULT_TASK = 'Revisa el repo OperatorAI y dame las 5 mejoras técnicas más importantes para hacer ahora.';

const PERMISSIONS = [
  { key: 'readRepo', label: 'Read repo', icon: FileSearch, enabled: true, locked: false },
  { key: 'searchCode', label: 'Search code', icon: Search, enabled: true, locked: false },
  { key: 'gitStatus', label: 'Git status', icon: GitBranch, enabled: true, locked: false },
  { key: 'gitDiff', label: 'Diff scan', icon: GitCompare, enabled: true, locked: false },
  { key: 'terminal', label: 'Terminal', icon: Terminal, enabled: false, locked: true },
  { key: 'writeFiles', label: 'Write files', icon: Code2, enabled: false, locked: true },
  { key: 'commit', label: 'Commit', icon: KeyRound, enabled: false, locked: true },
] as const;

function sectionAfter(text: string, heading: string, nextHeadings: string[]): string {
  const start = text.indexOf(`${heading}:`);
  if (start < 0) return '';
  const bodyStart = start + heading.length + 1;
  const end = nextHeadings
    .map((next) => text.indexOf(`\n${next}:`, bodyStart))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  return text.slice(bodyStart, end ?? undefined).trim();
}

function parseSections(text: string): SectionMap {
  const headings = ['Task', 'Git status', 'Git diff stat', 'Project summary', 'Files sampled', 'Relevant search results', 'Safety'];
  return {
    task: sectionAfter(text, 'Task', headings),
    gitStatus: sectionAfter(text, 'Git status', headings),
    gitDiff: sectionAfter(text, 'Git diff stat', headings),
    project: sectionAfter(text, 'Project summary', headings),
    files: sectionAfter(text, 'Files sampled', headings),
    searches: sectionAfter(text, 'Relevant search results', headings),
    safety: sectionAfter(text, 'Safety', headings),
  };
}

function lineValue(text: string, label: string): string {
  const match = text.match(new RegExp(`^${label}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

function shortStatus(sections: SectionMap): string {
  const status = sections.gitStatus.trim();
  const diff = sections.gitDiff.trim();
  const dirty = status.split('\n').some((line) => /^[ MARCUD?!]{1,2}\s/.test(line));
  if (dirty) return 'Working tree has changes';
  if (diff && diff !== '(no diff)') return 'Diff available';
  return 'Working tree clean';
}

function countSearchMatches(searches: string): number {
  return searches.split('\n').filter((line) => line.trim().startsWith('./')).length;
}

function splitAnalysis(analysis: string | null): string[] {
  if (!analysis) return [];
  return analysis
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px]',
        ok
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-danger/30 bg-danger/10 text-danger',
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Terminal }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/55 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-fg-subtle">
        <Icon className="h-3.5 w-3.5 text-gold" />
        {label}
      </div>
      <div className="mt-2 truncate text-[13px] text-fg">{value || 'n/a'}</div>
    </div>
  );
}

export function CodingRuntimeView({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [mode, setMode] = useState<Mode>('dry-run');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MissionData | null>(null);

  const permissions = useMemo(() => {
    return Object.fromEntries(PERMISSIONS.map((item) => [item.key, item.enabled]));
  }, []);

  const sections = useMemo(() => parseSections(result?.text ?? ''), [result?.text]);
  const analysisLines = useMemo(() => splitAnalysis(result?.analysis ?? null), [result?.analysis]);
  const workspace = result?.workspace ?? lineValue(result?.text ?? '', 'Workspace');
  const branch = lineValue(result?.text ?? '', 'Branch');
  const searchMatches = countSearchMatches(sections.searches);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/operator/coding-mission', { credentials: 'include' });
      const body = await response.json() as StatusResponse;
      setStatus(body);
    } catch (error) {
      setStatus({
        ok: false,
        bridgeAvailable: false,
        modelAvailable: false,
        diagnostic: { bridge: error instanceof Error ? error.message : 'Status failed' },
      });
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function runMission() {
    if (!task.trim()) return;
    setRunning(true);
    try {
      const response = await fetch('/api/operator/coding-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: task.trim(),
          mode,
          maxFiles: 120,
          maxMatches: 48,
          permissions,
        }),
      });
      const body = await response.json() as MissionResponse;
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.message ?? body.error ?? 'Mission failed');
      }
      setResult(body.data);
      toast.success('Coding runtime completed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Coding runtime failed');
    } finally {
      setRunning(false);
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-3xl items-center justify-center px-6">
        <div className="rounded-lg border border-border bg-surface-2/70 p-6 text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-4 font-display text-3xl text-fg">Operator Codex</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">
            Admin access required.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gold">
            <Terminal className="h-3.5 w-3.5" />
            Operator Codex
          </div>
          <h1 className="font-display text-4xl text-fg md:text-5xl">Coding runtime</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {statusLoading ? (
            <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 text-[12px] text-fg-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking
            </span>
          ) : (
            <>
              <StatusPill ok={Boolean(status?.bridgeAvailable)} label="Bridge" />
              <StatusPill ok={Boolean(status?.modelAvailable)} label="Qwen" />
            </>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadStatus()} disabled={statusLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-lg border border-border bg-surface/70 p-4">
          <label className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Mission</label>
          <textarea
            value={task}
            onChange={(event) => setTask(event.target.value)}
            className="mt-3 min-h-[164px] w-full resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-[14px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
          />

          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['plan', 'dry-run', 'run'] as Mode[]).map((item) => {
              const locked = item === 'run';
              const active = mode === item;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={locked}
                  onClick={() => setMode(item)}
                  className={cn(
                    'h-10 rounded-md border text-[12px] capitalize transition-colors',
                    active
                      ? 'border-gold/45 bg-gold/15 text-gold'
                      : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                    locked && 'cursor-not-allowed opacity-45',
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {locked && <LockKeyhole className="h-3 w-3" />}
                    {item}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Permissions</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] text-success">
                <ShieldCheck className="h-3 w-3" />
                Safe mode
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSIONS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={cn(
                      'flex h-10 items-center justify-between rounded-md border px-3 text-[12px]',
                      item.enabled
                        ? 'border-gold/25 bg-gold/10 text-fg'
                        : 'border-border bg-surface-2/70 text-fg-muted',
                    )}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      <Icon className="h-3.5 w-3.5 text-gold" />
                      {item.label}
                    </span>
                    {item.locked ? <LockKeyhole className="h-3.5 w-3.5 text-fg-subtle" /> : <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                  </div>
                );
              })}
            </div>
          </div>

          <Button type="button" className="mt-5 w-full" onClick={() => void runMission()} loading={running} disabled={!status?.bridgeAvailable || running}>
            <Play className="h-4 w-4" />
            Run mission
          </Button>

          {status?.diagnostic?.bridge || status?.diagnostic?.modelMessage ? (
            <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-[12px] leading-relaxed text-danger">
              {status.diagnostic.bridge ?? status.diagnostic.modelMessage}
            </div>
          ) : null}
        </section>

        <section className="min-w-0 space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="Workspace" value={workspace || 'Waiting'} icon={Code2} />
            <Metric label="Branch" value={branch || 'Waiting'} icon={GitBranch} />
            <Metric label="Status" value={result ? shortStatus(sections) : 'Idle'} icon={ListChecks} />
            <Metric label="Matches" value={result ? String(searchMatches) : '0'} icon={Search} />
          </div>

          <div className="rounded-lg border border-border bg-surface/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.14em] text-fg-subtle">Run summary</div>
                <div className="mt-1 text-[15px] text-fg">
                  {running ? 'Inspecting repository...' : result?.summary ?? 'No mission has run yet.'}
                </div>
              </div>
              {running ? <Loader2 className="h-5 w-5 animate-spin text-gold" /> : <CircleDashed className="h-5 w-5 text-fg-subtle" />}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {[
                ['Mission received', Boolean(task.trim())],
                ['Bridge connected', Boolean(status?.bridgeAvailable)],
                ['Repo scanned', Boolean(result)],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-[13px] text-fg-muted">
                  {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <CircleDashed className="h-4 w-4 text-fg-subtle" />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {result ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              {result.analysis ? (
                <div className="rounded-lg border border-gold/25 bg-gold/5 p-4 lg:col-span-2">
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-gold">
                    <ListChecks className="h-3.5 w-3.5" />
                    Operator review
                  </div>
                  <div className="space-y-2 text-[13.5px] leading-relaxed text-fg-soft">
                    {analysisLines.map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-lg border border-border bg-surface/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                  <GitCompare className="h-3.5 w-3.5 text-gold" />
                  Git signal
                </div>
                <pre className="max-h-[260px] overflow-auto rounded-md bg-bg/60 p-3 text-[12px] leading-relaxed text-fg-soft">
                  {(sections.gitStatus || 'No status output') + '\n\n' + (sections.gitDiff || 'No diff output')}
                </pre>
              </div>

              <div className="rounded-lg border border-border bg-surface/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                  <FileSearch className="h-3.5 w-3.5 text-gold" />
                  Project
                </div>
                <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-fg-soft">
                  {sections.project || 'No project summary'}
                </pre>
              </div>

              <div className="rounded-lg border border-border bg-surface/70 p-4 lg:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                  <Search className="h-3.5 w-3.5 text-gold" />
                  Relevant matches
                </div>
                <pre className="max-h-[320px] overflow-auto rounded-md bg-bg/60 p-3 text-[12px] leading-relaxed text-fg-soft">
                  {sections.searches || 'No targeted matches found.'}
                </pre>
              </div>

              <details className="rounded-lg border border-border bg-surface/70 p-4 lg:col-span-2">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] text-fg">
                  Technical output
                  <ChevronDown className="h-4 w-4 text-fg-muted" />
                </summary>
                <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-bg/70 p-4 text-[12px] leading-relaxed text-fg-soft">
                  {result.text}
                </pre>
              </details>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-surface/40 p-8 text-center">
              <Terminal className="mx-auto h-8 w-8 text-gold/70" />
              <div className="mt-3 text-[14px] text-fg-muted">Ready for a mission.</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
