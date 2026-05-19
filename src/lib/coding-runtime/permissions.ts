import { CODING_AGENTS } from './agents';
import type { CodingAgentRole, CodingToolName } from './types';

export interface CodingPermissionContext {
  allowWrites: boolean;
  allowTerminal: boolean;
}

const WRITE_TOOLS: ReadonlySet<CodingToolName> = new Set(['write_file', 'edit_file']);
const TERMINAL_TOOLS: ReadonlySet<CodingToolName> = new Set(['terminal_exec']);

export function canUseCodingTool(
  role: CodingAgentRole,
  tool: CodingToolName,
  ctx: CodingPermissionContext,
): { ok: true } | { ok: false; reason: string } {
  const allowedForRole = CODING_AGENTS[role]?.tools.includes(tool);
  if (!allowedForRole) {
    return { ok: false, reason: `${role} cannot use ${tool}` };
  }

  if (WRITE_TOOLS.has(tool) && !ctx.allowWrites) {
    return { ok: false, reason: `${tool} blocked because allowWrites=false` };
  }

  if (TERMINAL_TOOLS.has(tool) && !ctx.allowTerminal) {
    return { ok: false, reason: `${tool} blocked because allowTerminal=false` };
  }

  return { ok: true };
}

