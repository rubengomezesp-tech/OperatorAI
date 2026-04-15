import type { ChatProvider } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { serverEnv } from '@/lib/env';

let openai: OpenAIProvider | null = null;
let anthropic: AnthropicProvider | null = null;

export function getProvider(name: 'openai' | 'anthropic'): ChatProvider {
  if (name === 'openai') {
    if (!openai) openai = new OpenAIProvider();
    return openai;
  }
  if (!anthropic) anthropic = new AnthropicProvider();
  return anthropic;
}

export function getDefaultProvider(): ChatProvider {
  return getProvider(serverEnv.DEFAULT_TEXT_PROVIDER);
}

export function resolveModelForProvider(name: 'openai' | 'anthropic'): string {
  if (name === 'openai') return 'gpt-4o';
  return 'claude-sonnet-4-5-20250929';
}

export * from './types';
