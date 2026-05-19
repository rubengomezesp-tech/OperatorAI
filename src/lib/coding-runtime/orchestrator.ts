import 'server-only';

import { CODING_AGENTS, getAgent } from './agents';
import { canUseCodingTool } from './permissions';
import { parseAgentJson } from './json';
import { callCodingModel, isCodingModelAvailable, CodingModelUnavailableError } from './model';
import { CODING_TOOL_DESCRIPTIONS, executeCodingTool } from './tools';
import type {
  CodingAgentResponse,
  CodingAgentRole,
  CodingMessage,
  CodingMissionResult,
  CodingMissionStep,
  CodingRuntimeEvent,
  CodingRuntimeOptions,
  CodingToolCall,
} from './types';

const DEFAULT_PLAN: CodingMissionStep[] = [
  { agent: 'repo', task: 'Inspect the repository structure and identify relevant files.' },
  { agent: 'coder', task: 'Prepare the smallest code change needed for the mission.' },
  { agent: 'debugger', task: 'Run allowed checks and fix any errors.' },
  { agent: 'reviewer', task: 'Review the final diff and summarize risks.' },
];
const MAX_FINAL_CONTEXT_CHARS = 18_000;
const MAX_EVENT_SNIPPET_CHARS = 1_800;

function normalizeMode(mode: CodingRuntimeOptions['mode']): 'plan' | 'dry-run' | 'run' {
  return mode ?? 'dry-run';
}

function safeRole(value: unknown): CodingAgentRole {
  return typeof value === 'string' && value in CODING_AGENTS
    ? (value as CodingAgentRole)
    : 'repo';
}

function safePlan(plan: unknown, maxSteps: number): CodingMissionStep[] {
  if (!Array.isArray(plan)) return DEFAULT_PLAN.slice(0, maxSteps);
  const normalized = plan
    .map((step): CodingMissionStep | null => {
      if (!step || typeof step !== 'object') return null;
      const item = step as { agent?: unknown; task?: unknown; reason?: unknown };
      if (typeof item.task !== 'string' || !item.task.trim()) return null;
      return {
        agent: safeRole(item.agent),
        task: item.task.trim().slice(0, 1200),
        reason: typeof item.reason === 'string' ? item.reason.slice(0, 600) : undefined,
      };
    })
    .filter((step): step is CodingMissionStep => Boolean(step))
    .slice(0, maxSteps);

  return normalized.length > 0 ? normalized : DEFAULT_PLAN.slice(0, maxSteps);
}

function compactObservation(result: unknown): string {
  const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
  return text.length > 10_000 ? `${text.slice(0, 10_000)}\n[observation truncated]` : text;
}

function compactSnippet(value: unknown, max = MAX_EVENT_SNIPPET_CHARS): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return text.length > max ? `${text.slice(0, max)}\n[truncated]` : text;
}

async function callAgent(
  role: CodingAgentRole,
  task: string,
  context: string,
  opts: Required<Pick<CodingRuntimeOptions, 'temperature' | 'maxTokens'>>,
  signal?: AbortSignal,
): Promise<CodingAgentResponse> {
  const agent = getAgent(role);
  const messages: CodingMessage[] = [
    {
      role: 'system',
      content: [
        agent.prompt,
        '',
        `Current role: ${agent.label}`,
        `Allowed role tools: ${agent.tools.join(', ') || '(none)'}`,
        CODING_TOOL_DESCRIPTIONS,
        'Never claim you executed a tool unless a tool result is present in context.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        `Mission step:\n${task}`,
        '',
        context ? `Context and observations:\n${context}` : 'Context and observations: none yet.',
      ].join('\n'),
    },
  ];

  const response = await callCodingModel({
    messages,
    temperature: opts.temperature,
    maxTokens: opts.maxTokens,
    signal,
  });

  return parseAgentJson(response.content);
}

async function createPlan(
  task: string,
  maxSteps: number,
  opts: Required<Pick<CodingRuntimeOptions, 'temperature' | 'maxTokens'>>,
  runtime: { mode: 'plan' | 'dry-run' | 'run'; allowWrites: boolean; allowTerminal: boolean },
  signal?: AbortSignal,
): Promise<{ response: CodingAgentResponse; plan: CodingMissionStep[] }> {
  const response = await callAgent(
    'boss',
    `Plan this mission for OperatorAI:\n${task}`,
    [
      'Create a conservative multi-agent plan. Use repo before coder and reviewer last.',
      `Runtime mode: ${runtime.mode}`,
      `Writes allowed in this mission: ${runtime.allowWrites ? 'yes' : 'no'}`,
      `Terminal allowed in this mission: ${runtime.allowTerminal ? 'yes' : 'no'}`,
      'Only plan steps that can be completed with the tools available in this mode.',
      'For recommendation requests, gather targeted repo evidence and end with reviewer synthesis.',
    ].join('\n'),
    opts,
    signal,
  );

  return { response, plan: safePlan(response.plan, maxSteps) };
}

function pushEvent(events: CodingRuntimeEvent[], event: CodingRuntimeEvent) {
  events.push(event);
}

function inferFallbackToolCall(step: CodingMissionStep, missionTask: string): CodingToolCall | null {
  if (step.agent === 'reviewer' || step.agent === 'memory') return null;

  const text = `${missionTask}\n${step.task}`.toLowerCase();

  if (text.includes('git status') || text.includes('changed') || text.includes('changes')) {
    return { name: 'git_status', arguments: {} };
  }

  if (text.includes('diff')) {
    return { name: 'git_diff', arguments: {} };
  }

  if (text.includes('todo') || text.includes('fixme')) {
    return { name: 'search_code', arguments: { query: 'TODO|FIXME', maxResults: 50 } };
  }

  if (text.includes('package') || text.includes('script') || text.includes('dependency')) {
    return { name: 'read_file', arguments: { path: 'package.json' } };
  }

  if (text.includes('route') || text.includes('api')) {
    return { name: 'list_files', arguments: { path: 'src/app/api', maxEntries: 200 } };
  }

  if (step.agent === 'repo' || text.includes('repo') || text.includes('file') || text.includes('structure')) {
    return { name: 'list_files', arguments: { maxEntries: 200 } };
  }

  return null;
}

async function runStep(
  step: CodingMissionStep,
  missionTask: string,
  sharedContext: string,
  events: CodingRuntimeEvent[],
  options: {
    allowWrites: boolean;
    allowTerminal: boolean;
    maxToolRounds: number;
    temperature: number;
    maxTokens: number;
    signal?: AbortSignal;
  },
): Promise<string> {
  let context = sharedContext;
  let lastMessage = '';

  pushEvent(events, { type: 'agent_start', agent: step.agent, step });

  for (let round = 0; round < options.maxToolRounds; round++) {
    const response = await callAgent(
      step.agent,
      [
        `Overall mission: ${missionTask}`,
        `Current step: ${step.task}`,
        round > 0 ? `Tool round: ${round + 1}` : '',
      ].filter(Boolean).join('\n'),
      context,
      { temperature: options.temperature, maxTokens: options.maxTokens },
      options.signal,
    );

    lastMessage = response.message || lastMessage;
    pushEvent(events, { type: 'agent_message', agent: step.agent, step, message: response.message });

    let calls = (response.tool_calls ?? []).slice(0, 4) as CodingToolCall[];
    if (calls.length === 0 && round === 0) {
      const fallback = inferFallbackToolCall(step, missionTask);
      if (fallback) {
        calls = [fallback];
        pushEvent(events, {
          type: 'agent_message',
          agent: step.agent,
          step,
          message: `No tool call was returned, so ${fallback.name} was selected as a minimal evidence check.`,
        });
      }
    }
    if (calls.length === 0) break;

    const observations: string[] = [];
    for (const call of calls) {
      const allowed = canUseCodingTool(step.agent, call.name, {
        allowWrites: options.allowWrites,
        allowTerminal: options.allowTerminal,
      });

      pushEvent(events, { type: 'tool_start', agent: step.agent, step, toolCall: call });

      if (!allowed.ok) {
        const blocked = {
          ok: false,
          tool: call.name,
          error: allowed.reason,
        };
        pushEvent(events, { type: 'tool_result', agent: step.agent, step, toolResult: blocked });
        observations.push(`${call.name}: ${allowed.reason}`);
        continue;
      }

      const result = await executeCodingTool(call);
      pushEvent(events, { type: 'tool_result', agent: step.agent, step, toolResult: result });
      observations.push(`${call.name} -> ${result.ok ? 'ok' : 'failed'}\n${result.output ?? result.error ?? ''}`);
    }

    context = [
      context,
      '',
      `Latest tool observations for ${step.agent}:`,
      compactObservation(observations.join('\n\n')),
    ].join('\n');
  }

  pushEvent(events, { type: 'step_done', agent: step.agent, step, message: lastMessage });
  return [`[${step.agent}] ${step.task}`, lastMessage].filter(Boolean).join('\n');
}

function buildFinalContext(
  task: string,
  mode: 'dry-run' | 'run',
  plan: CodingMissionStep[],
  events: CodingRuntimeEvent[],
  stepSummaries: string[],
): string {
  const evidence = events
    .filter((event) => event.type === 'tool_result' && event.toolResult)
    .map((event) => {
      const tool = event.toolResult!;
      const step = event.step ? `${event.step.agent}: ${event.step.task}` : event.agent ?? 'unknown step';
      const output = tool.output ?? tool.error ?? '';
      return [
        `Step: ${step}`,
        `Tool: ${tool.tool}`,
        `Result: ${tool.ok ? 'ok' : 'failed'}`,
        compactSnippet(output),
      ].join('\n');
    });

  const context = [
    `Original mission: ${task}`,
    `Mode: ${mode}`,
    '',
    'Plan:',
    ...plan.map((step, index) => `${index + 1}. ${step.agent}: ${step.task}`),
    '',
    'Step summaries:',
    ...stepSummaries,
    '',
    'Tool evidence:',
    ...evidence,
  ].join('\n');

  return context.length > MAX_FINAL_CONTEXT_CHARS
    ? `${context.slice(0, MAX_FINAL_CONTEXT_CHARS)}\n[final context truncated]`
    : context;
}

async function synthesizeFinalAnswer(
  task: string,
  mode: 'dry-run' | 'run',
  plan: CodingMissionStep[],
  events: CodingRuntimeEvent[],
  stepSummaries: string[],
  opts: Required<Pick<CodingRuntimeOptions, 'temperature' | 'maxTokens'>>,
  signal?: AbortSignal,
): Promise<string> {
  const response = await callAgent(
    'reviewer',
    [
      'Synthesize the final answer for the original user request.',
      `Original request: ${task}`,
      'Do not call tools. Set done=true.',
      'If the user asked for a numbered list or top N, return that exact shape.',
      'Ground every point in the available evidence. Mention evidence gaps briefly.',
    ].join('\n'),
    buildFinalContext(task, mode, plan, events, stepSummaries),
    { temperature: Math.min(opts.temperature, 0.2), maxTokens: opts.maxTokens },
    signal,
  );

  return response.message?.trim() || stepSummaries.join('\n\n') || 'Mission completed without step output.';
}

export async function runCodingMission(
  input: CodingRuntimeOptions,
  signal?: AbortSignal,
): Promise<CodingMissionResult> {
  const mode = normalizeMode(input.mode);
  const maxSteps = Math.min(Math.max(input.maxSteps ?? 6, 1), 10);
  const maxToolRounds = Math.min(Math.max(input.maxToolRounds ?? 3, 1), 8);
  const temperature = input.temperature ?? 0.15;
  const maxTokens = input.maxTokens ?? 1800;
  const events: CodingRuntimeEvent[] = [];
  const allowWrites = mode === 'run' && input.allowWrites === true;
  const allowTerminal = input.allowTerminal === true;

  pushEvent(events, { type: 'mission_start', message: input.task });

  if (!(await isCodingModelAvailable())) {
    throw new CodingModelUnavailableError(
      'Qwen local is not reachable. Start LM Studio, Ollama, vLLM, or another OpenAI-compatible server.',
    );
  }

  const { response: plannerResponse, plan } = await createPlan(
    input.task,
    maxSteps,
    { temperature, maxTokens },
    { mode, allowWrites, allowTerminal },
    signal,
  );

  pushEvent(events, {
    type: 'agent_message',
    agent: 'boss',
    message: plannerResponse.message || 'Plan ready.',
  });

  if (mode === 'plan') {
    const summary = plan.map((step, index) => `${index + 1}. ${step.agent}: ${step.task}`).join('\n');
    pushEvent(events, { type: 'mission_done', message: summary });
    return { ok: true, task: input.task, mode, plan, events, summary };
  }

  let sharedContext = [
    `Mission: ${input.task}`,
    `Mode: ${mode}`,
    `Writes enabled: ${allowWrites ? 'yes' : 'no'}`,
    `Terminal enabled: ${allowTerminal ? 'yes' : 'no'}`,
  ].join('\n');
  const stepSummaries: string[] = [];

  for (const step of plan) {
    const stepSummary = await runStep(step, input.task, sharedContext, events, {
      allowWrites,
      allowTerminal,
      maxToolRounds,
      temperature,
      maxTokens,
      signal,
    });
    stepSummaries.push(stepSummary);
    sharedContext = [sharedContext, '', 'Completed step summaries:', ...stepSummaries].join('\n');
  }

  const summary = await synthesizeFinalAnswer(
    input.task,
    mode,
    plan,
    events,
    stepSummaries,
    { temperature, maxTokens },
    signal,
  );
  pushEvent(events, { type: 'agent_message', agent: 'reviewer', message: summary });
  pushEvent(events, { type: 'mission_done', message: summary });

  return {
    ok: true,
    task: input.task,
    mode,
    plan,
    events,
    summary,
  };
}
