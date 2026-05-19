export type CodingAgentRole =
  | 'boss'
  | 'repo'
  | 'coder'
  | 'debugger'
  | 'reviewer'
  | 'terminal'
  | 'memory';

export type CodingToolName =
  | 'list_files'
  | 'read_file'
  | 'search_code'
  | 'git_status'
  | 'git_diff'
  | 'write_file'
  | 'edit_file'
  | 'terminal_exec';

export interface CodingMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CodingToolCall {
  id?: string;
  name: CodingToolName;
  arguments?: Record<string, unknown>;
}

export interface CodingToolResult {
  ok: boolean;
  tool: CodingToolName;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface CodingAgentResponse {
  message: string;
  done?: boolean;
  tool_calls?: CodingToolCall[];
  plan?: CodingMissionStep[];
  risk?: 'low' | 'medium' | 'high';
}

export interface CodingMissionStep {
  agent: CodingAgentRole;
  task: string;
  reason?: string;
}

export interface CodingRuntimeOptions {
  task: string;
  mode?: 'plan' | 'dry-run' | 'run';
  allowWrites?: boolean;
  allowTerminal?: boolean;
  maxSteps?: number;
  maxToolRounds?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface CodingRuntimeEvent {
  type:
    | 'mission_start'
    | 'agent_start'
    | 'agent_message'
    | 'tool_start'
    | 'tool_result'
    | 'step_done'
    | 'mission_done';
  agent?: CodingAgentRole;
  step?: CodingMissionStep;
  message?: string;
  toolCall?: CodingToolCall;
  toolResult?: CodingToolResult;
}

export interface CodingMissionResult {
  ok: boolean;
  task: string;
  mode: 'plan' | 'dry-run' | 'run';
  plan: CodingMissionStep[];
  events: CodingRuntimeEvent[];
  summary: string;
  error?: string;
}

