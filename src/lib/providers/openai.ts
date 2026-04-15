import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';
import type { ChatProvider, ProviderRequest, StreamDelta } from './types';
import { costForUsage } from './types';

export class OpenAIProvider implements ChatProvider {
  readonly name = 'openai' as const;
  private client: OpenAI;

  constructor() {
    if (!serverEnv.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }
    this.client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }

  async *stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta> {
    const messages = req.system
      ? [{ role: 'system' as const, content: req.system }, ...req.messages]
      : req.messages;

    try {
      const stream = await this.client.chat.completions.create(
        {
          model: req.model,
          messages: messages.map((m) => ({
            role: m.role === 'tool' ? 'user' : m.role,
            content: m.content,
          })),
          temperature: req.temperature ?? 0.7,
          max_tokens: req.maxTokens,
          stream: true,
          stream_options: { include_usage: true },
        },
        { signal },
      );

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) yield { type: 'text', value: delta };
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens ?? 0;
          outputTokens = chunk.usage.completion_tokens ?? 0;
        }
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        costUsd: costForUsage(req.model, inputTokens, outputTokens),
      };
    } catch (err) {
      yield { type: 'error', message: err instanceof Error ? err.message : 'OpenAI error' };
    }
  }
}
