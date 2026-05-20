'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Code2,
  Copy,
  FileSearch,
  GitBranch,
  GitCompare,
  KeyRound,
  Loader2,
  LockKeyhole,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'plan' | 'dry-run' | 'run';
type ChatRole = 'assistant' | 'user';

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

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  result?: MissionData;
  loading?: boolean;
}

const QUICK_TASKS = [
  'Revisa el repo y dame las 5 mejoras tecnicas mas importantes.',
  'Busca bugs o riesgos antes de desplegar.',
  'Revisa el ultimo diff y dime si esta seguro.',
  'Dime el siguiente cambio pequeno con mas impacto.',
];

const TOOLS = [
  { key: 'readRepo', label: 'Leer repo', icon: FileSearch, enabled: true, locked: false },
  { key: 'searchCode', label: 'Buscar codigo', icon: Search, enabled: true, locked: false },
  { key: 'gitStatus', label: 'Git status', icon: GitBranch, enabled: true, locked: false },
  { key: 'gitDiff', label: 'Diff', icon: GitCompare, enabled: true, locked: false },
  { key: 'terminal', label: 'Terminal', icon: Terminal, enabled: false, locked: true },
  { key: 'writeFiles', label: 'Escribir', icon: Code2, enabled: false, locked: true },
  { key: 'commit', label: 'Commit', icon: KeyRound, enabled: false, locked: true },
] as const;

type ToolKey = (typeof TOOLS)[number]['key'];
type ToolState = Record<ToolKey, boolean>;

const DEFAULT_TOOLS = TOOLS.reduce((acc, tool) => {
  acc[tool.key] = tool.enabled;
  return acc;
}, {} as ToolState);

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

function splitLines(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function countSearchMatches(searches: string): number {
  return searches.split('\n').filter((line) => line.trim().startsWith('./')).length;
}

function shortStatus(sections: SectionMap): string {
  const status = sections.gitStatus.trim();
  const diff = sections.gitDiff.trim();
  const dirty = status.split('\n').some((line) => /^[ MARCUD?!]{1,2}\s/.test(line));
  if (dirty) return 'Cambios detectados';
  if (diff && diff !== '(no diff)') return 'Diff disponible';
  return 'Limpio';
}

function compactPath(path: string | null | undefined): string {
  if (!path) return 'Esperando';
  const parts = path.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || path;
}

function formatTime(value?: string): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function StatusDot({ ok, loading }: { ok?: boolean; loading?: boolean }) {
  if (loading) return <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />;
  if (ok) return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-danger" />;
}

function ToolChip({
  label,
  icon: Icon,
  active,
  locked,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  locked: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked || disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors',
        active ? 'border-gold/35 bg-gold/10 text-fg' : 'border-border bg-surface-2/70 text-fg-muted',
        !locked && 'hover:border-gold/40 hover:text-fg',
        locked && 'cursor-not-allowed opacity-45',
      )}
    >
      <Icon className="h-3.5 w-3.5 text-gold" />
      {label}
      {locked ? <LockKeyhole className="h-3 w-3 text-fg-subtle" /> : null}
    </button>
  );
}

function TextBlock({ label, text, empty }: { label: string; text: string; empty: string }) {
  return (
    <details className="rounded-lg border border-border bg-bg/45">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[12.5px] text-fg">
        {label}
        <ChevronDown className="h-4 w-4 text-fg-subtle" />
      </summary>
      <pre className="max-h-[360px] overflow-auto border-t border-border p-3 text-[12px] leading-relaxed text-fg-soft">
        {text || empty}
      </pre>
    </details>
  );
}

function RuntimeDetails({ result }: { result: MissionData }) {
  const sections = parseSections(result.text);
  const workspace = result.workspace ?? lineValue(result.text, 'Workspace');
  const branch = lineValue(result.text, 'Branch');
  const matches = countSearchMatches(sections.searches);

  return (
    <details className="mt-4 rounded-lg border border-border bg-surface-2/45">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[12.5px] text-gold">
        Herramientas y detalle tecnico
        <ChevronDown className="h-4 w-4" />
      </summary>

      <div className="space-y-3 border-t border-border p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            ['Workspace', compactPath(workspace)],
            ['Branch', branch || 'Esperando'],
            ['Estado', shortStatus(sections)],
            ['Matches', String(matches)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-border bg-bg/45 p-2">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle">{label}</div>
              <div className="mt-1 truncate text-[12.5px] text-fg">{value}</div>
            </div>
          ))}
        </div>

        <TextBlock label="Git" text={[sections.gitStatus, sections.gitDiff].filter(Boolean).join('\n\n')} empty="No hay salida de git." />
        <TextBlock label="Contexto encontrado" text={[sections.project, sections.files, sections.searches].filter(Boolean).join('\n\n')} empty="No hay contexto tecnico." />
        <TextBlock label="Salida completa" text={result.text} empty="No hay salida completa." />
      </div>
    </details>
  );
}

function AssistantResult({ result }: { result: MissionData }) {
  const lines = splitLines(result.analysis ?? result.summary);

  return (
    <div>
      <div className="space-y-2 text-[14.5px] leading-relaxed text-fg-soft">
        {lines.length > 0 ? lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p>{result.summary}</p>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-fg-subtle">
        <span className="rounded-full border border-border bg-bg/40 px-2 py-1">{result.requestedMode}</span>
        <span>{formatTime(result.completedAt)}</span>
      </div>
      <RuntimeDetails result={result} />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'justify-end')}>
      {!isUser ? (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
          <Bot className="h-4 w-4 text-gold" />
        </div>
      ) : null}

      <div
        className={cn(
          'max-w-[860px] rounded-2xl border px-4 py-3',
          isUser
            ? 'rounded-br-md border-gold/25 bg-gold/10 text-fg'
            : 'rounded-bl-md border-border bg-surface/75 text-fg',
        )}
      >
        {message.loading ? (
          <div className="flex items-center gap-2 text-[14px] text-fg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-gold" />
            {message.content}
          </div>
        ) : message.result ? (
          <AssistantResult result={message.result} />
        ) : (
          <div className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{message.content}</div>
        )}
      </div>
    </div>
  );
}

export function CodingRuntimeView({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('dry-run');
  const [tools, setTools] = useState<ToolState>(DEFAULT_TOOLS);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'hello',
      role: 'assistant',
      content: [
        'Soy Operator Codex. Escribeme una mision normal, como si hablaras conmigo.',
        'Puedo leer el repo, buscar codigo, revisar git status y mirar el diff. Terminal, escritura y commits siguen bloqueados en produccion.',
      ].join('\n\n'),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const permissions = useMemo<ToolState>(() => ({
    ...tools,
    terminal: false,
    writeFiles: false,
    commit: false,
  }), [tools]);

  const bridgeConnected = Boolean(status?.bridgeAvailable);
  const diagnosticText = status?.diagnostic?.bridge ?? status?.diagnostic?.modelMessage ?? null;
  const canSend = input.trim().length > 2 && bridgeConnected && !running;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, running]);

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
    void loadStatus();
  }, []);

  function toggleTool(key: ToolKey) {
    const tool = TOOLS.find((item) => item.key === key);
    if (!tool || tool.locked || running) return;
    setTools((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function runMission(task: string) {
    const trimmed = task.trim();
    if (!trimmed || running) return;

    const loadingId = makeId();
    setInput('');
    setRunning(true);
    setMessages((current) => [
      ...current,
      { id: makeId(), role: 'user', content: trimmed },
      { id: loadingId, role: 'assistant', content: 'Revisando repo y preparando respuesta...', loading: true },
    ]);

    try {
      const response = await fetch('/api/operator/coding-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task: trimmed,
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

      setMessages((current) => current.map((message) => (
        message.id === loadingId
          ? { id: loadingId, role: 'assistant', content: body.data?.summary ?? 'Listo.', result: body.data }
          : message
      )));
      toast.success('Operator Codex completed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coding runtime failed';
      setMessages((current) => current.map((item) => (
        item.id === loadingId
          ? { id: loadingId, role: 'assistant', content: `No he podido ejecutar la mision: ${message}` }
          : item
      )));
      toast.error(message);
    } finally {
      setRunning(false);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  async function copyLastOutput() {
    const lastResult = [...messages].reverse().find((message) => message.result)?.result;
    if (!lastResult?.text) return;
    try {
      await navigator.clipboard.writeText(lastResult.text);
      toast.success('Salida copiada');
    } catch {
      toast.error('No se pudo copiar');
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
    <main className="mx-auto flex h-[calc(100dvh-82px)] w-full max-w-[1180px] flex-col px-3 py-4 sm:px-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface/75 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-gold">
            <Terminal className="h-3.5 w-3.5" />
            Operator Codex
          </div>
          <h1 className="mt-1 font-display text-2xl leading-none text-fg sm:text-3xl">Repo chat</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-muted">
            <StatusDot ok={status?.bridgeAvailable} loading={statusLoading} />
            Bridge
          </span>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-muted">
            <StatusDot ok={status?.modelAvailable} loading={statusLoading} />
            Qwen
          </span>
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadStatus()} disabled={statusLoading}>
            <RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </header>

      {diagnosticText ? (
        <div className="mb-3 rounded-lg border border-danger/25 bg-danger/5 px-4 py-2 text-[12.5px] text-danger">
          {diagnosticText}
        </div>
      ) : null}

      <section
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-bg/35 px-3 py-4 sm:px-5"
      >
        <div className="mx-auto flex max-w-[920px] flex-col gap-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </section>

      <footer className="mt-3 rounded-lg border border-border bg-surface/90 p-3 shadow-2xl">
        <div className="mx-auto max-w-[920px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
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
                      'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] capitalize transition-colors',
                      active ? 'border-gold/40 bg-gold/10 text-gold' : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                      locked && 'cursor-not-allowed opacity-45',
                    )}
                  >
                    {locked ? <LockKeyhole className="h-3 w-3" /> : null}
                    {item}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void copyLastOutput()}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-muted transition-colors hover:text-fg"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar ultimo detalle
            </button>
          </div>

          <details className="mb-2 rounded-lg border border-border bg-bg/30 px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[12.5px] text-fg-muted">
              <span className="inline-flex items-center gap-2">
                <Wrench className="h-3.5 w-3.5 text-gold" />
                Herramientas
              </span>
              <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {TOOLS.map((tool) => (
                <ToolChip
                  key={tool.key}
                  label={tool.label}
                  icon={tool.icon}
                  active={permissions[tool.key]}
                  locked={tool.locked}
                  disabled={running}
                  onClick={() => toggleTool(tool.key)}
                />
              ))}
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success/10 px-3 text-[12px] text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                Lectura segura
              </span>
            </div>
          </details>

          <div className="flex items-end gap-2 rounded-xl border border-border bg-bg/70 p-2 focus-within:border-gold/45 focus-within:ring-2 focus-within:ring-gold/10">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) void runMission(input);
                }
              }}
              rows={1}
              placeholder="Escribe una mision para el repo..."
              className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-fg outline-none placeholder:text-fg-subtle"
            />
            <Button type="button" size="icon" onClick={() => void runMission(input)} disabled={!canSend} loading={running} aria-label="Run mission">
              {!running ? <Play className="h-4 w-4" /> : null}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_TASKS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => {
                  setInput(quick);
                  textareaRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[12px] text-fg-muted transition-colors hover:border-gold/35 hover:text-fg"
              >
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                {quick}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
