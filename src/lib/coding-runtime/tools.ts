import 'server-only';

import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import type { CodingToolCall, CodingToolName, CodingToolResult } from './types';

const execFileAsync = promisify(execFile);
const MAX_OUTPUT_CHARS = 24_000;
const MAX_READ_LINES = 500;

const SENSITIVE_PATHS = [
  /^\.env(?:$|\.(?!example$))/,
  /^\.git(?:\/|$)/,
  /^node_modules(?:\/|$)/,
  /^\.next(?:\/|$)/,
  /^dist(?:\/|$)/,
  /^out(?:\/|$)/,
  /(^|\/)(?:id_rsa|id_ed25519|\.pem|\.key|secrets?)(?:\/|$)/i,
];

function truncate(text: string, max = MAX_OUTPUT_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[truncated ${text.length - max} chars]`;
}

function workspaceRoot(): string {
  return process.env.CODING_RUNTIME_WORKSPACE_ROOT
    ? path.resolve(process.env.CODING_RUNTIME_WORKSPACE_ROOT)
    : path.resolve(/* turbopackIgnore: true */ process.cwd());
}

function isBlockedRelPath(rel: string): boolean {
  return SENSITIVE_PATHS.some((rx) => rx.test(rel));
}

function normalizeWorkspacePath(input: unknown): { ok: true; abs: string; rel: string } | { ok: false; error: string } {
  const root = workspaceRoot();
  const raw = typeof input === 'string' && input.trim() ? input.trim() : '.';
  const abs = path.isAbsolute(raw) ? path.normalize(raw) : path.resolve(root, raw);
  const rel = path.relative(root, abs).replaceAll(path.sep, '/');

  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return { ok: false, error: 'Path escapes workspace.' };
  }

  const cleanRel = rel === '' ? '.' : rel;
  if (isBlockedRelPath(cleanRel)) {
    return { ok: false, error: `Path is blocked: ${cleanRel}` };
  }

  return { ok: true, abs, rel: cleanRel };
}

async function runCommand(
  file: string,
  args: string[],
  timeoutMs = 15_000,
): Promise<{ ok: boolean; stdout: string; stderr: string; code?: number }> {
  try {
    const { stdout, stderr } = await execFileAsync(file, args, {
      cwd: workspaceRoot(),
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 8,
    });
    return { ok: true, stdout, stderr };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; code?: number; message?: string };
    return {
      ok: false,
      stdout: String(err.stdout ?? ''),
      stderr: String(err.stderr ?? err.message ?? ''),
      code: typeof err.code === 'number' ? err.code : undefined,
    };
  }
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function listFiles(args: Record<string, unknown>): Promise<CodingToolResult> {
  const root = normalizeWorkspacePath(args.path);
  if (!root.ok) return { ok: false, tool: 'list_files', error: root.error };

  const maxEntries = Math.min(Math.max(asNumber(args.maxEntries, 200), 1), 1000);
  const rg = await runCommand('rg', ['--files', root.rel === '.' ? '.' : root.rel], 10_000);

  if (rg.ok) {
    const files = rg.stdout
      .split('\n')
      .filter(Boolean)
      .slice(0, maxEntries)
      .join('\n');
    return { ok: true, tool: 'list_files', output: files || '(no files)' };
  }

  const entries = await fs.readdir(root.abs, { withFileTypes: true }).catch((error: unknown) => {
    throw new Error(error instanceof Error ? error.message : 'Failed to list files');
  });
  const output = entries
    .filter((entry) => {
      const childRel = root.rel === '.' ? entry.name : `${root.rel}/${entry.name}`;
      return !isBlockedRelPath(childRel.replaceAll(path.sep, '/'));
    })
    .slice(0, maxEntries)
    .map((entry) => `${entry.isDirectory() ? 'dir ' : 'file'} ${entry.name}`)
    .join('\n');
  return { ok: true, tool: 'list_files', output };
}

async function readFile(args: Record<string, unknown>): Promise<CodingToolResult> {
  const file = normalizeWorkspacePath(args.path);
  if (!file.ok) return { ok: false, tool: 'read_file', error: file.error };

  const text = await fs.readFile(file.abs, 'utf8').catch((error: unknown) => {
    throw new Error(error instanceof Error ? error.message : 'Failed to read file');
  });

  const lines = text.split('\n');
  const startLine = Math.max(asNumber(args.startLine, 1), 1);
  const requestedEnd = asNumber(args.endLine, Math.min(lines.length, startLine + MAX_READ_LINES - 1));
  const endLine = Math.min(Math.max(requestedEnd, startLine), startLine + MAX_READ_LINES - 1, lines.length);
  const selected = lines
    .slice(startLine - 1, endLine)
    .map((line, index) => `${String(startLine + index).padStart(5, ' ')} ${line}`)
    .join('\n');

  return {
    ok: true,
    tool: 'read_file',
    output: selected,
    metadata: { path: file.rel, startLine, endLine, totalLines: lines.length },
  };
}

async function searchCode(args: Record<string, unknown>): Promise<CodingToolResult> {
  const query = String(args.query ?? '').trim();
  if (!query) return { ok: false, tool: 'search_code', error: 'Missing query.' };

  const maxResults = Math.min(Math.max(asNumber(args.maxResults, 80), 1), 200);
  const rgArgs = ['-n', '--hidden', '--glob', '!node_modules', '--glob', '!.git', '--glob', '!.next'];
  if (typeof args.glob === 'string' && args.glob.trim()) {
    rgArgs.push('--glob', args.glob.trim());
  }
  rgArgs.push(query);

  const result = await runCommand('rg', rgArgs, 15_000);
  const lines = (result.stdout || result.stderr)
    .split('\n')
    .filter(Boolean)
    .slice(0, maxResults)
    .join('\n');

  return {
    ok: result.ok || Boolean(lines),
    tool: 'search_code',
    output: lines || '(no matches)',
    error: result.ok || lines ? undefined : result.stderr,
  };
}

async function gitStatus(): Promise<CodingToolResult> {
  const result = await runCommand('git', ['status', '--short', '--branch'], 10_000);
  return {
    ok: result.ok,
    tool: 'git_status',
    output: truncate(result.stdout || result.stderr),
    error: result.ok ? undefined : result.stderr,
  };
}

async function gitDiff(args: Record<string, unknown>): Promise<CodingToolResult> {
  const gitArgs = ['diff', '--'];
  if (typeof args.path === 'string' && args.path.trim()) {
    const file = normalizeWorkspacePath(args.path);
    if (!file.ok) return { ok: false, tool: 'git_diff', error: file.error };
    gitArgs.push(file.rel);
  }

  const result = await runCommand('git', gitArgs, 10_000);
  return {
    ok: result.ok,
    tool: 'git_diff',
    output: truncate(result.stdout || '(no diff)'),
    error: result.ok ? undefined : result.stderr,
  };
}

async function writeFile(args: Record<string, unknown>): Promise<CodingToolResult> {
  const file = normalizeWorkspacePath(args.path);
  if (!file.ok) return { ok: false, tool: 'write_file', error: file.error };

  if (typeof args.content !== 'string') {
    return { ok: false, tool: 'write_file', error: 'content must be a string.' };
  }

  await fs.mkdir(path.dirname(file.abs), { recursive: true });
  await fs.writeFile(file.abs, args.content, 'utf8');
  return { ok: true, tool: 'write_file', output: `Wrote ${file.rel}` };
}

async function editFile(args: Record<string, unknown>): Promise<CodingToolResult> {
  const file = normalizeWorkspacePath(args.path);
  if (!file.ok) return { ok: false, tool: 'edit_file', error: file.error };

  const search = args.search;
  const replace = args.replace;
  if (typeof search !== 'string' || typeof replace !== 'string') {
    return { ok: false, tool: 'edit_file', error: 'search and replace must be strings.' };
  }

  const original = await fs.readFile(file.abs, 'utf8');
  if (!original.includes(search)) {
    return { ok: false, tool: 'edit_file', error: 'Search text not found.' };
  }

  const next = args.replaceAll === true
    ? original.split(search).join(replace)
    : original.replace(search, replace);

  await fs.writeFile(file.abs, next, 'utf8');
  return {
    ok: true,
    tool: 'edit_file',
    output: `Edited ${file.rel}`,
    metadata: { replacements: args.replaceAll === true ? original.split(search).length - 1 : 1 },
  };
}

const SAFE_COMMAND_PREFIXES = [
  'pnpm run typecheck',
  'pnpm run lint',
  'pnpm run build',
  'pnpm test:e2e',
  'pnpm exec tsc',
  'pnpm exec eslint',
  'git status',
  'git diff',
  'git log',
  'rg ',
];

function isSafeTerminalCommand(command: string): boolean {
  const trimmed = command.trim();
  if (!trimmed) return false;
  if (/[;&|`<>]|\$\(|\n|\r/.test(trimmed)) return false;
  return SAFE_COMMAND_PREFIXES.some((prefix) => trimmed === prefix || trimmed.startsWith(prefix + ' '));
}

async function terminalExec(args: Record<string, unknown>): Promise<CodingToolResult> {
  const command = String(args.command ?? '').trim();
  if (!isSafeTerminalCommand(command)) {
    return {
      ok: false,
      tool: 'terminal_exec',
      error: 'Command blocked. Allowed: pnpm checks, git status/diff/log, rg. No shell operators.',
    };
  }

  const result = await runCommand('zsh', ['-lc', command], Math.min(Math.max(asNumber(args.timeoutMs, 30_000), 1_000), 120_000));
  const output = truncate([result.stdout, result.stderr].filter(Boolean).join('\n'));
  return {
    ok: result.ok,
    tool: 'terminal_exec',
    output,
    error: result.ok ? undefined : `Command exited ${result.code ?? 'non-zero'}`,
  };
}

export async function executeCodingTool(call: CodingToolCall): Promise<CodingToolResult> {
  const args = call.arguments ?? {};

  try {
    switch (call.name) {
      case 'list_files':
        return await listFiles(args);
      case 'read_file':
        return await readFile(args);
      case 'search_code':
        return await searchCode(args);
      case 'git_status':
        return await gitStatus();
      case 'git_diff':
        return await gitDiff(args);
      case 'write_file':
        return await writeFile(args);
      case 'edit_file':
        return await editFile(args);
      case 'terminal_exec':
        return await terminalExec(args);
      default:
        return { ok: false, tool: call.name as CodingToolName, error: `Unknown tool ${String(call.name)}` };
    }
  } catch (error) {
    return {
      ok: false,
      tool: call.name,
      error: error instanceof Error ? error.message : 'Tool failed.',
    };
  }
}

export const CODING_TOOL_DESCRIPTIONS = `
Available tools:
- list_files({path?, maxEntries?}) -> list repo files below path.
- read_file({path, startLine?, endLine?}) -> read a file with line numbers. Max 500 lines.
- search_code({query, glob?, maxResults?}) -> ripgrep search.
- git_status({}) -> git status --short --branch.
- git_diff({path?}) -> current working tree diff.
- write_file({path, content}) -> write a full file. Requires allowWrites.
- edit_file({path, search, replace, replaceAll?}) -> exact string replacement. Requires allowWrites.
- terminal_exec({command, timeoutMs?}) -> safe command allowlist only. Requires allowTerminal.
`;
