import Anthropic from '@anthropic-ai/sdk';
import { serverEnv } from '@/lib/env';
import type { ChatProvider, ProviderRequest, StreamDelta } from './types';
import { costForUsage } from './types';

export class AnthropicProvider implements ChatProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    if (!serverEnv.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    this.client = new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY });
  }

  async *stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta> {
    const msgs = req.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const stream = this.client.messages.stream(
        {
          model: req.model,
          system: req.system,
          messages: msgs,
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens ?? 4096,
        },
        { signal },
      );

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'text', value: event.delta.text };
        }
        if (event.type === 'message_delta' && event.usage) {
          outputTokens = event.usage.output_tokens ?? outputTokens;
        }
        if (event.type === 'message_start' && event.message.usage) {
          inputTokens = event.message.usage.input_tokens ?? 0;
        }
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        costUsd: costForUsage(req.model, inputTokens, outputTokens),
      };
    } catch (err) {
      yield { type: 'error', message: err instanceof Error ? err.message : 'Anthropic error' };
    }
  }
}
