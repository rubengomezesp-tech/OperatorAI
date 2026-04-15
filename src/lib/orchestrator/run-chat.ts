import type { ChatMessage, StreamDelta } from '@/lib/providers';
import { getProvider, resolveModelForProvider } from '@/lib/providers';
import { buildSystemPrompt } from './build-system-prompt';

interface RunChatInput {
  messages: ChatMessage[];
  assistant?: Parameters<typeof buildSystemPrompt>[0];
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

export async function* runChat(input: RunChatInput): AsyncIterable<StreamDelta> {
  const providerName = input.provider ?? 'openai';
  const model = input.model ?? resolveModelForProvider(providerName);
  const system = buildSystemPrompt(input.assistant);
  const provider = getProvider(providerName);

  yield* provider.stream(
    {
      model,
      messages: input.messages,
      system,
      temperature: input.temperature ?? 0.7,
    },
    input.signal,
  );
}
