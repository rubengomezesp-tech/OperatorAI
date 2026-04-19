import type { ChatProvider } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { serverEnv } from '@/lib/env';

let openai: OpenAIProvider | null = null;
let anthropic: AnthropicProvider | null = null;
let google: GoogleProvider | null = null;

export type ProviderName = 'openai' | 'anthropic' | 'google';

export function getProvider(name: ProviderName): ChatProvider {
  if (name === 'openai') {
    if (!openai) openai = new OpenAIProvider();
    return openai;
  }
  if (name === 'anthropic') {
    if (!anthropic) anthropic = new AnthropicProvider();
    return anthropic;
  }
  if (!google) google = new GoogleProvider();
  return google;
}

export function getDefaultProvider(): ChatProvider {
  return getProvider(serverEnv.DEFAULT_TEXT_PROVIDER);
}

export function resolveModelForProvider(name: ProviderName): string {
  if (name === 'openai') return 'gpt-4o';
  if (name === 'anthropic') return 'claude-sonnet-4-5-20250929';
  return 'gemini-2.0-flash';
}

export * from './types';
