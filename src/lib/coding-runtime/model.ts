import 'server-only';

import {
  getOperatorCoachConfig,
  getOperatorCoachHeaders,
  probeOperatorCoach,
} from '@/lib/operator/coach-endpoint';
import type { CodingMessage } from './types';

export class CodingModelUnavailableError extends Error {
  constructor(message = 'Local coding model is not available.') {
    super(message);
    this.name = 'CodingModelUnavailableError';
  }
}

export interface CodingModelCallOptions {
  messages: CodingMessage[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface CodingModelCallResult {
  content: string;
  model: string;
  usage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export async function isCodingModelAvailable(): Promise<boolean> {
  const probe = await probeOperatorCoach();
  return probe.ok;
}

export async function callCodingModel({
  messages,
  temperature = 0.2,
  maxTokens = 1800,
  signal,
}: CodingModelCallOptions): Promise<CodingModelCallResult> {
  const config = getOperatorCoachConfig();
  const response = await fetch(`${config.url}/v1/chat/completions`, {
    method: 'POST',
    headers: getOperatorCoachHeaders(config),
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new CodingModelUnavailableError(`Local model HTTP ${response.status}: ${text.slice(0, 240)}`);
  }

  const data = await response.json();
  const content = String(data.choices?.[0]?.message?.content ?? '');

  return {
    content,
    model: String(data.model ?? config.model),
    usage: {
      prompt: Number(data.usage?.prompt_tokens ?? 0),
      completion: Number(data.usage?.completion_tokens ?? 0),
      total: Number(data.usage?.total_tokens ?? 0),
    },
  };
}
