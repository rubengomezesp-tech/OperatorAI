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
  readonly name: 'openai' | 'anthropic';
  stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta>;
}

// Rough unit prices in USD per 1M tokens (update as providers change pricing).
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'claude-3-5-sonnet-latest': { input: 3, output: 15 },
  'claude-3-5-haiku-latest': { input: 0.8, output: 4 },
};

export function costForUsage(model: string, inputTokens: number, outputTokens: number): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000;
}
