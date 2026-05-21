'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  FileCode2,
  FileSearch,
  GitBranch,
  GitCompare,
  KeyRound,
  Loader2,
  LockKeyhole,
  Monitor,
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
  activeModel?: string;
  latestModel?: string;
  versionsDir?: string | null;
  models?: OperatorModelOption[];
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
  model?: string | null;
  mode: string;
  summary: string;
  analysis: string | null;
  mockupHtml?: string | null;
  mockupTitle?: string | null;
  text: string;
  requestedMode: Mode;
  completedAt: string;
}

interface OperatorModelOption {
  id: string;
  label?: string;
  version?: string;
  available?: boolean;
  trained?: boolean;
  fused?: boolean;
  active?: boolean;
  status?: string;
  counts?: {
    train?: number;
    valid?: number;
    extracts?: number;
    audios?: number;
    texts?: number;
  };
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
  'Revisa el repo y dime las 5 mejoras mas importantes.',
  'Crea un mockup HTML para visualizar una nueva pantalla.',
  'Disena una pantalla nueva siguiendo el estilo actual.',
  'Crea el plan tecnico para una feature con UI y API.',
  'Busca riesgos de seguridad o deuda tecnica.',
  'Mira el ultimo diff y dime si puedo desplegar.',
];

const FEATURE_BRIEF_TEMPLATE = [
  'Quiero crear una feature:',
  '',
  'Objetivo:',
  'Usuario principal:',
  'Pantalla o ruta:',
  'Datos que necesita:',
  'Acciones/botones:',
  'Estados: vacio, carga, error, exito:',
  'Estilo o referencia:',
  'Que no debe tocar:',
  'Como sabremos que esta terminado:',
].join('\n');

const HTML_MOCKUP_TEMPLATE = [
  'Quiero un mockup HTML para visualizar esta pantalla:',
  '',
  'Nombre de la pantalla:',
  'Objetivo:',
  'Usuario principal:',
  'Secciones que debe tener:',
  'Datos reales o ejemplos:',
  'Acciones/botones:',
  'Estados: vacio, carga, error, exito:',
  'Estilo o referencia:',
  'Que sensacion debe dar:',
].join('\n');

const BRIEF_TIPS = [
  'Objetivo',
  'Usuario',
  'Ruta',
  'Datos',
  'Acciones',
  'Estados',
  'Permisos',
  'Referencia visual',
  'No tocar',
  'Criterio final',
];

const TOOLS = [
  { key: 'readRepo', label: 'Leer repo', icon: FileSearch, enabled: true, locked: false },
  { key: 'searchCode', label: 'Buscar codigo', icon: Search, enabled: true, locked: false },
  { key: 'gitStatus', label: 'Git status', icon: GitBranch, enabled: true, locked: false },
  { key: 'gitDiff', label: 'Diff', icon: GitCompare, enabled: true, locked: false },
  { key: 'terminal', label: 'Terminal', icon: Terminal, enabled: false, locked: true },
  { key: 'writeFiles', label: 'Escribir archivos', icon: Code2, enabled: false, locked: true },
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
  const headings = [
    'Task',
    'Git status',
    'Git diff stat',
    'Project summary',
    'Files sampled',
    'Relevant search results',
    'Safety',
  ];
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

function connectionState(status: StatusResponse | null, loading: boolean) {
  if (loading) {
    return {
      tone: 'loading' as const,
      title: 'Comprobando runtime',
      detail: 'Estoy mirando si el puente del Mac y Qwen responden.',
    };
  }

  if (!status) {
    return {
      tone: 'error' as const,
      title: 'Sin estado',
      detail: 'No he recibido respuesta del panel de estado.',
    };
  }

  if (!status.bridgeAvailable) {
    return {
      tone: 'error' as const,
      title: 'Puente local apagado',
      detail:
        status.diagnostic?.bridge ??
        'Vercel no puede alcanzar el puente fijo del Mac en qwen.operatoraiapp.com.',
    };
  }

  if (!status.modelAvailable) {
    return {
      tone: 'warning' as const,
      title: 'Qwen no responde',
      detail:
        status.diagnostic?.modelMessage ??
        'El puente esta vivo, pero el modelo local no completo el healthcheck.',
    };
  }

  return {
    tone: 'ready' as const,
    title: 'Listo',
    detail: 'Qwen esta conectado por el puente fijo y puede inspeccionar el repo en modo lectura segura.',
  };
}

function StatusIcon({ tone }: { tone: ReturnType<typeof connectionState>['tone'] }) {
  if (tone === 'loading') return <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />;
  if (tone === 'ready') return <CheckCircle2 className="h-3.5 w-3.5 text-success" />;
  return (
    <AlertTriangle
      className={cn('h-3.5 w-3.5', tone === 'warning' ? 'text-gold' : 'text-danger')}
    />
  );
}

function StatusPill({ label, ok, loading }: { label: string; ok?: boolean; loading: boolean }) {
  const tone = loading ? 'loading' : ok ? 'ready' : 'error';
  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px]',
        tone === 'ready' && 'border-success/20 bg-success/10 text-success',
        tone === 'loading' && 'border-gold/20 bg-gold/10 text-gold',
        tone === 'error' && 'border-danger/25 bg-danger/10 text-danger',
      )}
    >
      <StatusIcon tone={tone} />
      {label}
    </span>
  );
}

function modelShortName(modelId: string | null | undefined): string {
  if (!modelId) return 'Qwen';
  return modelId.replace(/^operator-qwen14b-?/, 'Qwen ');
}

function ModelSelector({
  status,
  selectedModel,
  running,
  onSelect,
}: {
  status: StatusResponse | null;
  selectedModel: string;
  running: boolean;
  onSelect: (model: string) => void;
}) {
  const models = status?.models ?? [];
  const current = models.find((model) => model.id === selectedModel);
  const readyCount = models.filter((model) => model.available).length;
  const hasModels = models.length > 0;

  return (
    <div className="hidden min-w-[210px] max-w-[320px] items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1.5 sm:flex">
      <Bot className="h-3.5 w-3.5 shrink-0 text-gold" />
      <select
        value={selectedModel}
        disabled={running || !hasModels}
        onChange={(event) => onSelect(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[12px] text-fg outline-none disabled:opacity-60"
        title="Selecciona que Qwen entrenado usara esta mision"
      >
        {hasModels ? (
          models.map((model) => (
            <option key={model.id} value={model.id} disabled={!model.available}>
              {(model.label ?? model.id) + (model.available ? '' : ' (no cargado)')}
            </option>
          ))
        ) : (
          <option value={selectedModel || status?.model || ''}>
            {status?.model ?? 'Cargando modelos'}
          </option>
        )}
      </select>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10.5px]',
          current?.available ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
        )}
        title={
          current?.counts?.train
            ? `${current.counts.train} train / ${current.counts.valid ?? 0} valid`
            : `${readyCount} modelos listos`
        }
      >
        {current?.version?.toUpperCase() ?? modelShortName(selectedModel)}
      </span>
    </div>
  );
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
        active
          ? 'border-gold/35 bg-gold/10 text-fg'
          : 'border-border bg-surface-2/70 text-fg-muted',
        !locked && 'hover:border-gold/40 hover:text-fg',
        locked && 'cursor-not-allowed opacity-45',
      )}
      title={locked ? 'Bloqueado en produccion por seguridad' : undefined}
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
    <details className="mt-4 rounded-xl border border-border bg-bg/35">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-[12.5px] text-gold">
        Ver detalle tecnico
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
            <div key={label} className="rounded-md border border-border bg-surface/45 p-2">
              <div className="text-[10.5px] uppercase tracking-[0.12em] text-fg-subtle">
                {label}
              </div>
              <div className="mt-1 truncate text-[12.5px] text-fg">{value}</div>
            </div>
          ))}
        </div>

        <TextBlock
          label="Git"
          text={[sections.gitStatus, sections.gitDiff].filter(Boolean).join('\n\n')}
          empty="No hay salida de git."
        />
        <TextBlock
          label="Contexto encontrado"
          text={[sections.project, sections.files, sections.searches].filter(Boolean).join('\n\n')}
          empty="No hay contexto tecnico."
        />
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
        {lines.length > 0 ? (
          lines.map((line, index) => <p key={`${line}-${index}`}>{line}</p>)
        ) : (
          <p>{result.summary}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-fg-subtle">
        {result.model ? (
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-1 text-gold">
            {modelShortName(result.model)}
          </span>
        ) : null}
        <span className="rounded-full border border-border bg-bg/40 px-2 py-1">
          {result.requestedMode}
        </span>
        {result.mockupHtml ? (
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-1 text-gold">
            mockup HTML
          </span>
        ) : null}
        <span>{formatTime(result.completedAt)}</span>
      </div>
      {result.mockupHtml ? (
        <MockupPreview title={result.mockupTitle ?? 'Mockup HTML'} html={result.mockupHtml} />
      ) : null}
      <RuntimeDetails result={result} />
    </div>
  );
}

function MockupPreview({ title, html }: { title: string; html: string }) {
  const [mode, setMode] = useState<'preview' | 'code'>('preview');

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      toast.success('HTML copiado');
    } catch {
      toast.error('No se pudo copiar el HTML');
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gold/20 bg-bg/65">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/70 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
            <Monitor className="h-4 w-4 text-gold" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium text-fg">{title}</div>
            <div className="text-[11.5px] text-fg-subtle">Vista segura sin scripts</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors',
              mode === 'preview'
                ? 'border-gold/35 bg-gold/10 text-gold'
                : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors',
              mode === 'code'
                ? 'border-gold/35 bg-gold/10 text-gold'
                : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            <FileCode2 className="h-3.5 w-3.5" />
            HTML
          </button>
          <button
            type="button"
            onClick={() => void copyHtml()}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-muted transition-colors hover:text-fg"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <iframe
          title={title}
          sandbox=""
          srcDoc={html}
          className="h-[520px] w-full bg-white"
        />
      ) : (
        <pre className="max-h-[520px] overflow-auto p-4 text-[12px] leading-relaxed text-fg-soft">
          {html}
        </pre>
      )}
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
          'max-w-[820px] rounded-2xl border px-4 py-3 shadow-sm',
          isUser
            ? 'rounded-br-md border-gold/25 bg-gold/10 text-fg'
            : 'rounded-bl-md border-border bg-surface/70 text-fg',
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

function ConnectionNotice({
  status,
  loading,
  onRefresh,
}: {
  status: StatusResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const state = connectionState(status, loading);
  const ready = state.tone === 'ready';

  if (ready) return null;

  return (
    <div
      className={cn(
        'mx-auto mb-5 max-w-[820px] rounded-2xl border px-4 py-3',
        state.tone === 'warning'
          ? 'border-gold/25 bg-gold/10 text-fg'
          : 'border-danger/25 bg-danger/10 text-fg',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="mt-0.5">
            <StatusIcon tone={state.tone} />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-medium">{state.title}</div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-fg-muted">{state.detail}</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      <details className="mt-3 text-[12.5px] text-fg-muted">
        <summary className="cursor-pointer text-fg-soft">Como ponerlo funcional</summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>1. En el Mac, arranca o reinicia los servicios del puente fijo:</p>
          <code className="block rounded-md border border-border bg-bg/65 px-3 py-2 text-[12px] text-fg">
            cd ~/OperatorBrain &amp;&amp; bash scripts/restart_coach_services.sh
          </code>
          <p>
            2. Vercel debe tener <code>OPERATOR_COACH_URL</code> apuntando siempre a{' '}
            <code>https://qwen.operatoraiapp.com</code>.
          </p>
          {status?.endpoint ? (
            <p className="break-all">
              Endpoint que esta usando produccion ahora:{' '}
              <span className="text-fg">{status.endpoint}</span>
            </p>
          ) : null}
          <p>3. Pulsa Refresh aqui y vuelve a mandar la mision.</p>
        </div>
      </details>
    </div>
  );
}

function RuntimeControls({
  mode,
  running,
  tools,
  permissions,
  setMode,
  toggleTool,
}: {
  mode: Mode;
  running: boolean;
  tools: ToolState;
  permissions: ToolState;
  setMode: (mode: Mode) => void;
  toggleTool: (key: ToolKey) => void;
}) {
  return (
    <details className="mt-2 text-[12.5px] text-fg-muted">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 transition-colors hover:border-gold/35 hover:text-fg">
        <Wrench className="h-3.5 w-3.5 text-gold" />
        Herramientas y permisos
        <ChevronDown className="h-3.5 w-3.5" />
      </summary>

      <div className="mt-2 space-y-3 rounded-xl border border-border bg-surface/70 p-3">
        <div>
          <div className="mb-2 text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">Modo</div>
          <div className="flex flex-wrap gap-2">
            {(['plan', 'dry-run'] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                disabled={running}
                onClick={() => setMode(item)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] capitalize transition-colors',
                  mode === item
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-border bg-surface-2 text-fg-muted hover:text-fg',
                )}
              >
                {item}
              </button>
            ))}
            <span
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-subtle opacity-70"
              title="Run real queda bloqueado en produccion para evitar escribir o ejecutar comandos peligrosos desde la web."
            >
              <LockKeyhole className="h-3 w-3" />
              run real bloqueado
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] uppercase tracking-[0.14em] text-fg-subtle">
              Herramientas
            </span>
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-success/10 px-2 text-[11px] text-success">
              <ShieldCheck className="h-3 w-3" />
              lectura segura
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((tool) => (
              <ToolChip
                key={tool.key}
                label={tool.label}
                icon={tool.icon}
                active={permissions[tool.key] || tools[tool.key]}
                locked={tool.locked}
                disabled={running}
                onClick={() => toggleTool(tool.key)}
              />
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}

function BriefGuide({
  onUseTemplate,
  onUseMockupTemplate,
}: {
  onUseTemplate: () => void;
  onUseMockupTemplate: () => void;
}) {
  return (
    <details className="mt-2 text-[12.5px] text-fg-muted">
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 transition-colors hover:border-gold/35 hover:text-fg">
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        Brief para disenar o crear
        <ChevronDown className="h-3.5 w-3.5" />
      </summary>

      <div className="mt-2 rounded-xl border border-border bg-surface/70 p-3">
        <div className="flex flex-wrap gap-2">
          {BRIEF_TIPS.map((tip) => (
            <span
              key={tip}
              className="inline-flex rounded-full border border-border bg-bg/45 px-2.5 py-1 text-[11.5px] text-fg-soft"
            >
              {tip}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-[620px] text-[12px] leading-relaxed text-fg-muted">
            Cuanto mas claro sea el objetivo, la pantalla, los datos y los estados, mejor podra
            proponer UI, archivos y pasos de implementacion.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onUseTemplate}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[12px] text-gold transition-colors hover:bg-gold/15"
            >
              <Code2 className="h-3.5 w-3.5" />
              Feature
            </button>
            <button
              type="button"
              onClick={onUseMockupTemplate}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 text-[12px] text-gold transition-colors hover:bg-gold/15"
            >
              <Monitor className="h-3.5 w-3.5" />
              Mockup HTML
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}

export function CodingRuntimeView({ isAdmin }: { isAdmin: boolean }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('dry-run');
  const [selectedModel, setSelectedModel] = useState('');
  const [tools, setTools] = useState<ToolState>(DEFAULT_TOOLS);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'hello',
      role: 'assistant',
      content: [
        'Soy Operator Codex. Mandame una mision normal, como si hablaras conmigo.',
        'Yo preparo el contexto del repo, reviso git, busco codigo y puedo proponerte diseno, archivos y plan de implementacion. Por ahora no escribo archivos ni ejecuto terminal desde produccion.',
      ].join('\n\n'),
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const permissions = useMemo<ToolState>(
    () => ({
      ...tools,
      terminal: false,
      writeFiles: false,
      commit: false,
    }),
    [tools],
  );

  const state = connectionState(status, statusLoading);
  const bridgeConnected = Boolean(status?.bridgeAvailable);
  const effectiveModel = selectedModel || status?.latestModel || status?.model || 'operator-qwen14b-v6';
  const selectedModelInfo = status?.models?.find((model) => model.id === effectiveModel);
  const canSend =
    input.trim().length > 2
    && bridgeConnected
    && !running
    && Boolean(effectiveModel)
    && selectedModelInfo?.available !== false;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, running, status]);

  async function loadStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch('/api/operator/coding-mission', { credentials: 'include' });
      const body = (await response.json()) as StatusResponse;
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

  useEffect(() => {
    if (!status) return;

    setSelectedModel((current) => {
      const stored =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('operator-codex-model') ?? ''
          : '';
      const models = status.models ?? [];
      const currentValid = current && models.some((model) => model.id === current && model.available);
      if (currentValid) return current;
      const storedValid = stored && models.some((model) => model.id === stored && model.available);
      if (storedValid) return stored;
      const next =
        status.latestModel
        || status.activeModel
        || status.model
        || models.find((model) => model.available)?.id
        || 'operator-qwen14b-v6';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('operator-codex-model', next);
      }
      return next;
    });
  }, [status]);

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

    if (!bridgeConnected) {
      toast.error('Puente local apagado');
      return;
    }

    const loadingId = makeId();
    setInput('');
    setRunning(true);
    setMessages((current) => [
      ...current,
      { id: makeId(), role: 'user', content: trimmed },
      {
        id: loadingId,
        role: 'assistant',
        content: 'Estoy leyendo el repo y preparando respuesta...',
        loading: true,
      },
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
          model: effectiveModel,
        }),
      });

      const body = (await response.json()) as MissionResponse;
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.message ?? body.error ?? 'Mission failed');
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: body.data?.summary ?? 'Listo.',
                result: body.data,
              }
            : message,
        ),
      );
      toast.success('Operator Codex listo');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coding runtime failed';
      setMessages((current) =>
        current.map((item) =>
          item.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: `No he podido ejecutar la mision: ${message}`,
              }
            : item,
        ),
      );
      toast.error(message);
      void loadStatus();
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
    <main className="mx-auto flex h-[calc(100dvh-82px)] w-full max-w-[1040px] flex-col px-3 sm:px-5">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/70">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-gold/10">
            <Terminal className="h-4 w-4 text-gold" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-fg">Operator Codex</div>
            <div className="truncate text-[12px] text-fg-muted">
              {state.title} · {modelShortName(effectiveModel)}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ModelSelector
            status={status}
            selectedModel={effectiveModel}
            running={running}
            onSelect={(model) => {
              setSelectedModel(model);
              window.localStorage.setItem('operator-codex-model', model);
              toast.success(`Qwen seleccionado: ${modelShortName(model)}`);
            }}
          />
          <StatusPill label="Bridge" ok={status?.bridgeAvailable} loading={statusLoading} />
          <StatusPill label="Qwen" ok={status?.modelAvailable} loading={statusLoading} />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => void loadStatus()}
            disabled={statusLoading}
            aria-label="Refresh runtime status"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', statusLoading && 'animate-spin')} />
          </Button>
        </div>
      </header>

      <section ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-1 py-6">
        <ConnectionNotice
          status={status}
          loading={statusLoading}
          onRefresh={() => void loadStatus()}
        />

        <div className="mx-auto flex max-w-[860px] flex-col gap-5">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </section>

      <footer className="shrink-0 border-t border-border/70 bg-bg/95 pb-4 pt-3">
        <div className="mx-auto max-w-[860px]">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-surface/90 p-2 shadow-2xl focus-within:border-gold/45 focus-within:ring-2 focus-within:ring-gold/10">
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
              placeholder={
                bridgeConnected
                  ? 'Dime que hacemos con el repo...'
                  : 'Enciende el puente del Mac para poder ejecutar misiones...'
              }
              className="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-relaxed text-fg outline-none placeholder:text-fg-subtle"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => void runMission(input)}
              disabled={!canSend}
              loading={running}
              aria-label="Enviar mision"
            >
              {!running ? <Play className="h-4 w-4" /> : null}
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <RuntimeControls
              mode={mode}
              running={running}
              tools={tools}
              permissions={permissions}
              setMode={setMode}
              toggleTool={toggleTool}
            />

            <button
              type="button"
              onClick={() => void copyLastOutput()}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 text-[12px] text-fg-muted transition-colors hover:text-fg"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar detalle
            </button>
          </div>

          <BriefGuide
            onUseTemplate={() => {
              setInput(FEATURE_BRIEF_TEMPLATE);
              window.setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            onUseMockupTemplate={() => {
              setInput(HTML_MOCKUP_TEMPLATE);
              window.setTimeout(() => textareaRef.current?.focus(), 0);
            }}
          />

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
