export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ProviderRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  system?: string;
}

export type StreamDelta =
  | { type: 'text'; value: string }
  | { type: 'done'; inputTokens?: number; outputTokens?: number; costUsd?: number }
  | { type: 'error'; message: string };

export interface ChatProvider {
  readonly name: 'openai' | 'anthropic' | 'google';
  stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta>;
}

// Pricing in USD per 1M tokens (April 2026).
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-sonnet-4-5-20250929': { input: 3, output: 15 },
  'claude-opus-4-5-20251101': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
  'gemini-3.1-pro-preview': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.15, output: 0.6 },
};

export function costForUsage(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
