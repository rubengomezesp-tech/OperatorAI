import type { CodingAgentResponse } from './types';

function sliceBalancedObject(input: string, start: number): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i++) {
    const ch = input[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return input.slice(start, i + 1);
    }
  }

  return null;
}

export function parseAgentJson(text: string): CodingAgentResponse {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const firstBrace = candidate.indexOf('{');
  const jsonText = firstBrace >= 0 ? sliceBalancedObject(candidate, firstBrace) : null;

  if (!jsonText) {
    return {
      message: trimmed || 'Agent returned an empty response.',
      done: true,
      tool_calls: [],
    };
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<CodingAgentResponse>;
    return {
      message: typeof parsed.message === 'string' ? parsed.message : '',
      done: parsed.done === true,
      tool_calls: Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [],
      plan: Array.isArray(parsed.plan) ? parsed.plan : undefined,
      risk: parsed.risk,
    };
  } catch {
    return {
      message: trimmed,
      done: true,
      tool_calls: [],
    };
  }
}

