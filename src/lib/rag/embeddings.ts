import 'server-only';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';

const EMBED_MODEL = 'text-embedding-3-small';

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

export async function embedOne(text: string): Promise<number[]> {
  const openai = getClient();
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

/**
 * Batch embed. OpenAI supports up to ~2048 inputs per request.
 * We batch at 100 to stay well under limits and keep latency low.
 */
export async function embedMany(texts: string[]): Promise<number[][]> {
  const openai = getClient();
  const BATCH = 96;
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH).map((t) => t.slice(0, 8000));
    const res = await openai.embeddings.create({ model: EMBED_MODEL, input: slice });
    out.push(...res.data.map((d) => d.embedding));
  }
  return out;
}
