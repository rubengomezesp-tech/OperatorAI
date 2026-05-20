'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock3,
  Code2,
  Copy,
  FileSearch,
  FolderGit2,
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
  SlidersHorizontal,
  Terminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'plan' | 'dry-run' | 'run';
type OutputTab = 'review' | 'git' | 'files' | 'raw';

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
  safety?: {
    writesDefault?: boolean;
    terminalDefault?: boolean;
    runMode?: string;
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

const DEFAULT_TASK = 'Revisa el repo OperatorAI y dame las 5 mejoras tecnicas mas importantes para hacer ahora.';

const QUICK_TASKS = [
  'Revisa el repo y dame las 5 mejoras tecnicas mas importantes.',
  'Busca riesgos de produccion, seguridad y deuda tecnica priorizada.',
  'Inspecciona el ultimo diff y dime si lo puedo desplegar.',
  'Encuentra el siguiente cambio pequeno con mas impacto para OperatorAI.',
];

const PERMISSIONS = [
  { key: 'readRepo', label: 'Read repo', icon: FileSearch, enabled: true, locked: false },
  { key: 'searchCode', label: 'Search code', icon: Search, enabled: true, locked: false },
  { key: 'gitStatus', label: 'Git status', icon: GitBranch, enabled: true, locked: false },
  { key: 'gitDiff', label: 'Diff scan', icon: GitCompare, enabled: true, locked: false },
  { key: 'terminal', label: 'Terminal', icon: Terminal, enabled: false, locked: true },
  { key: 'writeFiles', label: 'Write files', icon: Code2, enabled: false, locked: true },
  { key: 'commit', label: 'Commit', icon: KeyRound, enabled: false, locked: true },
] as const;

type PermissionKey = (typeof PERMISSIONS)[number]['key'];
type PermissionState = Record<PermissionKey, boolean>;

const DEFAULT_PERMISSIONS = PERMISSIONS.reduce((acc, item) => {
  acc[item.key] = item.enabled;
  return acc;
}, {} as PermissionState);

const OUTPUT_TABS: Array<{ id: OutputTab; label: string; icon: LucideIcon }> = [
  { id: 'review', label: 'Review', icon: ListChecks },
  { id: 'git', label: 'Git', icon: GitCompare },
  { id: 'files', label: 'Context', icon: FolderGit2 },
  { id: 'raw', label: 'Raw', icon: Terminal },
];

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

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitAnalysis(analysis: string | null): string[] {
  if (!analysis) return [];
  return splitLines(analysis);
}

function shortStatus(sections: SectionMap): string {
  const status = sections.gitStatus.trim();
  const diff = sections.gitDiff.trim();
  const dirty = status.split('\n').some((line) => /^[ MARCUD?!]{1,2}\s/.test(line));
  if (dirty) return 'Changes detected';
  if (diff && diff !== '(no diff)') return 'Diff available';
  return 'Clean';
}

function countSearchMatches(searches: string): number {
  return searches.split('\n').filter((line) => line.trim().startsWith('./')).length;
}

function compactPath(path: string | null | undefined): string {
  if (!path) return 'Waiting';
  const parts = path.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || path;
}

function formatTime(value?: string): string {
  if (!value) return 'No run yet';
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusTone(ok: boolean | undefined): 'ready' | 'down' | 'checking' {
  if (ok === undefined) return 'checking';
  return ok ? 'ready' : 'down';
}

function ConnectionPill({ label, ok, loading }: { label: string; ok?: boolean; loading?: boolean }) {
  const tone = loading ? 'checking' : statusTone(ok);
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-md border px-3 text-[12px]',
        tone === 'ready' && 'border-success/30 bg-success/10 text-success',
        tone === 'down' && 'border-danger/30 bg-danger/10 text-danger',
        tone === 'checking' && 'border-border bg-surface-2 text-fg-muted',
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : ok ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <AlertTriangle className="h-3.5 w-3.5" />
      )}
      {label}
    </span>
  );
}

function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-surface/70 px-3 py-3">
      <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
        <Icon className="h-3.5 w-3.5 text-gold" />
        {label}
      </div>
      <div className="mt-2 truncate text-[13px] text-fg">{value}</div>
    </div>
  );
}

function StepRow({ label, done, active }: { label: string; done: boolean; active?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px]',
        done && 'border-success/20 bg-success/10 text-success',
        active && !done && 'border-gold/25 bg-gold/10 text-gold',
        !active && !done && 'border-border bg-surface-2/45 text-fg-muted',
      )}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : active ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
      ) : (
        <CircleDashed className="h-4 w-4 shrink-0" />
      )}
      <span className="truncate">{label}</span>
    </div>
  );
}

function TextBlock({ text, empty, className }: { text: string; empty: string; className?: string }) {
  return (
    <pre
      className={cn(
        'overflow-auto rounded-lg border border-border bg-bg/60 p-4 text-[12.5px] leading-relaxed text-fg-soft',
        className,
      )}
    >
      {text || empty}
    </pre>
  );
}

function EmptyWorkbench({ running, connected }: { running: boolean; connected: boolean }) {
  return (
    <div className="flex min-h-[440px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface/35 p-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gold/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10">
          {running ? <Loader2 className="h-7 w-7 animate-spin text-gold" /> : <Terminal className="h-7 w-7 text-gold" />}
        </div>
      </div>
      <h2 className="mt-5 font-display text-3xl text-fg">
        {running ? 'Runtime is inspecting' : connected ? 'Ready for a mission' : 'Bridge offline'}
      </h2>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-fg-muted">
        {running
          ? 'Operator is reading repo context, git signals and targeted matches. The review will appear here.'
          : connected
            ? 'Describe a mission on the left and run it in read-only safe mode.'
            : 'Start the local bridge on your Mac, then refresh this panel.'}
      </p>
    </div>
  );
}

export function CodingRuntimeView({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [task, setTask] = useState(DEFAULT_TASK);
  const [mode, setMode] = useState<Mode>('dry-run');
  const [permissionState, setPermissionState] = useState<PermissionState>(DEFAULT_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<OutputTab>('review');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MissionData | null>(null);

  const permissions = useMemo<PermissionState>(() => ({
    ...permissionState,
    terminal: false,
    writeFiles: false,
    commit: false,
  }), [permissionState]);

  const sections = useMemo(() => parseSections(result?.text ?? ''), [result?.text]);
  const analysisLines = useMemo(() => splitAnalysis(result?.analysis ?? null), [result?.analysis]);
  const workspace = result?.workspace ?? lineValue(result?.text ?? '', 'Workspace');
  const branch = lineValue(result?.text ?? '', 'Branch');
  const searchMatches = countSearchMatches(sections.searches);
  const files = splitLines(sections.files);
  const searches = splitLines(sections.searches);
  const diagnosticText = status?.diagnostic?.bridge ?? status?.diagnostic?.modelMessage ?? null;
  const bridgeConnected = Boolean(status?.bridgeAvailable);
  const modelConnected = Boolean(status?.modelAvailable);
  const canRun = bridgeConnected && !running && task.trim().length > 2;

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

  function togglePermission(key: PermissionKey) {
    const item = PERMISSIONS.find((permission) => permission.key === key);
    if (!item || item.locked || running) return;
    setPermissionState((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function runMission() {
    if (!task.trim()) return;
    setRunning(true);
    setActiveTab('review');
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

  async function copyOutput() {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      toast.success('Runtime output copied');
    } catch {
      toast.error('Could not copy output');
    }
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-96px)] max-w-3xl items-center justify-center px-6">
        <div className="rounded-lg border border-border bg-surface-2/70 p-6 text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-4 font-display text-3xl text-fg">Operator Codex</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-fg-muted">Admin access required.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full px-3 pb-10 pt-4 sm:px-5 lg:px-6">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <header className="rounded-lg border border-border bg-surface/75 px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold">
                <Terminal className="h-3.5 w-3.5" />
                Operator Codex
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <h1 className="font-display text-3xl leading-none text-fg sm:text-4xl">Coding runtime</h1>
                <span className="pb-1 text-[12.5px] text-fg-muted">
                  Local Qwen bridge · read-only production cockpit
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ConnectionPill label="Bridge" ok={status?.bridgeAvailable} loading={statusLoading} />
              <ConnectionPill label="Qwen" ok={status?.modelAvailable} loading={statusLoading} />
              <Button type="button" variant="secondary" size="sm" onClick={() => void loadStatus()} disabled={statusLoading}>
                <RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 2xl:grid-cols-[360px_minmax(0,1fr)_330px] xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <section className="rounded-lg border border-border bg-surface/75 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">Mission</div>
                  <div className="mt-1 text-[13px] text-fg-muted">Tell Operator what to inspect.</div>
                </div>
                <SlidersHorizontal className="h-4 w-4 text-gold" />
              </div>

              <textarea
                value={task}
                onChange={(event) => setTask(event.target.value)}
                className="mt-4 min-h-[178px] w-full resize-none rounded-lg border border-border bg-bg/60 px-4 py-3 text-[14px] leading-relaxed text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-gold/60 focus:ring-2 focus:ring-gold/15"
                placeholder="Describe the repo mission..."
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_TASKS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setTask(quick)}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-left text-[11.5px] leading-snug text-fg-muted transition-colors hover:border-gold/35 hover:text-fg"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(['plan', 'dry-run', 'run'] as Mode[]).map((item) => {
                  const locked = item === 'run';
                  const active = mode === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={locked || running}
                      onClick={() => setMode(item)}
                      className={cn(
                        'h-10 rounded-md border text-[12px] capitalize transition-colors',
                        active ? 'border-gold/45 bg-gold/15 text-gold' : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
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

              <Button type="button" className="mt-4 w-full" onClick={() => void runMission()} loading={running} disabled={!canRun}>
                <Play className="h-4 w-4" />
                Run mission
              </Button>

              {diagnosticText ? (
                <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 p-3 text-[12px] leading-relaxed text-danger">
                  {diagnosticText}
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-border bg-surface/75 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">Access</div>
                  <div className="mt-1 text-[13px] text-fg-muted">Safe mode controls.</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] text-success">
                  <ShieldCheck className="h-3 w-3" />
                  Read-only
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-1">
                {PERMISSIONS.map((item) => {
                  const Icon = item.icon;
                  const enabled = permissions[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      disabled={item.locked || running}
                      onClick={() => togglePermission(item.key)}
                      className={cn(
                        'flex h-11 items-center justify-between rounded-md border px-3 text-left text-[12.5px] transition-colors',
                        enabled ? 'border-gold/25 bg-gold/10 text-fg' : 'border-border bg-surface-2/60 text-fg-muted',
                        !item.locked && 'hover:border-gold/40 hover:text-fg',
                        item.locked && 'cursor-not-allowed opacity-55',
                      )}
                    >
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-gold" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.locked ? (
                        <LockKeyhole className="h-3.5 w-3.5 text-fg-subtle" />
                      ) : enabled ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5 text-fg-subtle" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <InfoTile label="Workspace" value={compactPath(workspace)} icon={Code2} />
              <InfoTile label="Branch" value={branch || 'Waiting'} icon={GitBranch} />
              <InfoTile label="Status" value={result ? shortStatus(sections) : running ? 'Running' : 'Idle'} icon={Activity} />
              <InfoTile label="Matches" value={result ? String(searchMatches) : '0'} icon={Search} />
            </div>

            <section className="rounded-lg border border-border bg-surface/75">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-fg-subtle">
                    <Bot className="h-3.5 w-3.5 text-gold" />
                    Session
                  </div>
                  <div className="mt-1 truncate text-[14px] text-fg">
                    {running ? 'Inspecting repository...' : result?.summary ?? 'No mission has run yet.'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {OUTPUT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        disabled={!result && tab.id !== 'review'}
                        className={cn(
                          'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12px] transition-colors',
                          active ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                          !result && tab.id !== 'review' && 'cursor-not-allowed opacity-45',
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4">
                {!result ? (
                  <EmptyWorkbench running={running} connected={bridgeConnected} />
                ) : activeTab === 'review' ? (
                  <div className="space-y-4">
                    {analysisLines.length > 0 ? (
                      <div className="rounded-lg border border-gold/25 bg-gold/5 p-4">
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
                    ) : (
                      <div className="rounded-lg border border-border bg-surface-2/50 p-4 text-[13.5px] leading-relaxed text-fg-muted">
                        The bridge returned repo context, but Qwen did not produce a review summary. Check the raw tab for details.
                      </div>
                    )}

                    <div className="grid gap-3 lg:grid-cols-5">
                      <StepRow label="Mission received" done={Boolean(task.trim())} />
                      <StepRow label="Bridge connected" done={bridgeConnected} />
                      <StepRow label="Qwen available" done={modelConnected} />
                      <StepRow label="Repo scanned" done={Boolean(result)} />
                      <StepRow label="Review generated" done={analysisLines.length > 0} />
                    </div>
                  </div>
                ) : activeTab === 'git' ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                        <GitBranch className="h-3.5 w-3.5 text-gold" />
                        Git status
                      </div>
                      <TextBlock text={sections.gitStatus} empty="No status output." className="max-h-[420px]" />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                        <GitCompare className="h-3.5 w-3.5 text-gold" />
                        Diff stat
                      </div>
                      <TextBlock text={sections.gitDiff} empty="No diff output." className="max-h-[420px]" />
                    </div>
                  </div>
                ) : activeTab === 'files' ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                        <FolderGit2 className="h-3.5 w-3.5 text-gold" />
                        Project summary
                      </div>
                      <TextBlock text={sections.project} empty="No project summary." className="max-h-[520px] whitespace-pre-wrap" />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                          <FileSearch className="h-3.5 w-3.5 text-gold" />
                          Files sampled
                        </div>
                        <div className="max-h-[220px] overflow-auto rounded-lg border border-border bg-bg/60 p-3">
                          {(files.length ? files : ['No files sampled.']).map((line, index) => (
                            <div key={`${line}-${index}`} className="truncate py-1 font-mono text-[12px] text-fg-soft">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                          <Search className="h-3.5 w-3.5 text-gold" />
                          Relevant matches
                        </div>
                        <div className="max-h-[260px] overflow-auto rounded-lg border border-border bg-bg/60 p-3">
                          {(searches.length ? searches : ['No targeted matches found.']).map((line, index) => (
                            <div key={`${line}-${index}`} className="py-1 font-mono text-[12px] leading-relaxed text-fg-soft">
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                        <Terminal className="h-3.5 w-3.5 text-gold" />
                        Technical output
                      </div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => void copyOutput()} disabled={!result.text}>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                    </div>
                    <TextBlock text={result.text} empty="No raw output." className="max-h-[620px]" />
                  </div>
                )}
              </div>
            </section>
          </section>

          <aside className="space-y-4 xl:col-span-2 2xl:col-span-1 2xl:sticky 2xl:top-20 2xl:self-start">
            <section className="rounded-lg border border-border bg-surface/75 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-fg-subtle">Runtime inspector</div>
                  <div className="mt-1 text-[13px] text-fg-muted">What Operator can see right now.</div>
                </div>
                <Wrench className="h-4 w-4 text-gold" />
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-bg/45 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                    <Activity className="h-3.5 w-3.5 text-gold" />
                    Connection
                  </div>
                  <div className="space-y-2 text-[12.5px] text-fg-muted">
                    <div className="flex items-center justify-between gap-3">
                      <span>Endpoint</span>
                      <span className="truncate text-fg">{status?.endpoint ?? 'unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Model</span>
                      <span className="truncate text-fg">{status?.model ?? 'unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>Auth key</span>
                      <span className={status?.hasApiKey ? 'text-success' : 'text-fg-subtle'}>
                        {status?.hasApiKey ? 'configured' : 'not required'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-bg/45 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                    <Clock3 className="h-3.5 w-3.5 text-gold" />
                    Last run
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <div className="rounded-md bg-surface-2/70 p-2">
                      <div className="text-fg-subtle">Mode</div>
                      <div className="mt-1 text-fg">{result?.requestedMode ?? mode}</div>
                    </div>
                    <div className="rounded-md bg-surface-2/70 p-2">
                      <div className="text-fg-subtle">Finished</div>
                      <div className="mt-1 text-fg">{formatTime(result?.completedAt)}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-bg/45 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-fg-subtle">
                    <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                    Safety
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-fg-muted">
                    Production chat stays read-only. Terminal, file writes and commits remain locked until a separate approval flow exists.
                  </p>
                </div>
              </div>
            </section>

            <details className="rounded-lg border border-border bg-surface/75 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] text-fg">
                Raw safety note
                <ChevronDown className="h-4 w-4 text-fg-muted" />
              </summary>
              <p className="mt-3 text-[12.5px] leading-relaxed text-fg-muted">
                {sections.safety || 'This bridge can inspect and plan, but it will not write files or run arbitrary terminal commands from production chat.'}
              </p>
            </details>
          </aside>
        </div>
      </div>
    </main>
  );
}
