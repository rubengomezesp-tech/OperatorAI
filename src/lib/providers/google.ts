import { GoogleGenerativeAI } from '@google/generative-ai';
import { serverEnv } from '@/lib/env';
import type { ChatProvider, ProviderRequest, StreamDelta } from './types';
import { costForUsage } from './types';

export class GoogleProvider implements ChatProvider {
  readonly name = 'google' as const;
  private client: GoogleGenerativeAI;

  constructor() {
    if (!serverEnv.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not set');
    }
    this.client = new GoogleGenerativeAI(serverEnv.GOOGLE_API_KEY);
  }

  async *stream(req: ProviderRequest, signal?: AbortSignal): AsyncIterable<StreamDelta> {
    try {
      const model = this.client.getGenerativeModel({
        model: req.model,
        systemInstruction: req.system,
      });

      // Convert to Gemini format
      const history = req.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' as const : 'user' as const,
          parts: [{ text: m.content }],
        }));

      const lastMessage = req.messages[req.messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        yield { type: 'error', message: 'Last message must be from user' };
        return;
      }

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature: req.temperature ?? 0.7,
          maxOutputTokens: req.maxTokens ?? 8192,
        },
      });

      const result = await chat.sendMessageStream(lastMessage.content);

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of result.stream) {
        if (signal?.aborted) break;
        const text = chunk.text();
        if (text) yield { type: 'text', value: text };
      }

      const response = await result.response;
      const usage = response.usageMetadata;
      if (usage) {
        inputTokens = usage.promptTokenCount ?? 0;
        outputTokens = usage.candidatesTokenCount ?? 0;
      }

      yield {
        type: 'done',
        inputTokens,
        outputTokens,
        costUsd: costForUsage(req.model, inputTokens, outputTokens),
      };
    } catch (err) {
      yield { type: 'error', message: err instanceof Error ? err.message : 'Google error' };
    }
  }
}
