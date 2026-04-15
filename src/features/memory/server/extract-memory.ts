import 'server-only';
import OpenAI from 'openai';
import { serverEnv } from '@/lib/env';

const EXPLICIT_TRIGGERS = [
  /\brecuerda\b/i,
  /\bguárdalo\b/i,
  /\bguardalo\b/i,
  /\bmemoriza\b/i,
  /\bno olvides\b/i,
  /\btoma nota\b/i,
  /\banota\b/i,
  /\bremember\b/i,
  /\bsave this\b/i,
  /\bmemorize\b/i,
  /\bnote that\b/i,
  /\bkeep in mind\b/i,
];

export function isExplicitMemoryRequest(text: string): boolean {
  return EXPLICIT_TRIGGERS.some((r) => r.test(text));
}

export interface ExtractedMemory {
  content: string;
  category: 'preference' | 'fact' | 'goal' | 'context' | 'general';
  importance: 1 | 2 | 3 | 4 | 5;
}

let client: OpenAI | null = null;
function getClient() {
  if (!client) {
    if (!serverEnv.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');
    client = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Extracts a clean, durable memory from a user message.
 * Used for both explicit ("remember X") and auto mode.
 */
export async function extractMemoryFromTurn(params: {
  userMessage: string;
  assistantReply?: string;
  mode: 'explicit' | 'auto';
}): Promise<ExtractedMemory[]> {
  const openai = getClient();

  const systemExplicit = [
    'The user has explicitly asked the assistant to remember something.',
    'Extract 1-3 durable, atomic facts/preferences/goals that would be useful to recall in future conversations.',
    'Each memory must be:',
    '- Self-contained (understandable without context)',
    '- First-person from the user perspective (e.g., "I prefer X", "My company is Y")',
    '- NOT ephemeral (not "today I feel tired" — only lasting facts)',
    '- Concise (max 200 chars each)',
    'Return strict JSON: {"memories": [{"content": "...", "category": "preference|fact|goal|context|general", "importance": 1-5}]}',
    'If nothing is worth remembering, return {"memories": []}',
  ].join('\n');

  const systemAuto = [
    'Analyze this conversation turn and extract ONLY genuinely durable facts the assistant should remember for future conversations.',
    'Be VERY conservative: extract nothing unless the user revealed a lasting preference, goal, personal fact, or brand detail.',
    'IGNORE: pleasantries, temporary questions, one-off requests, small talk.',
    'ONLY extract if content is useful months from now.',
    'Each memory must be:',
    '- Self-contained',
    '- First-person from the user perspective',
    '- Concise (max 200 chars)',
    '- Truly durable',
    'Return strict JSON: {"memories": [{"content": "...", "category": "preference|fact|goal|context|general", "importance": 1-5}]}',
    'Return {"memories": []} if nothing qualifies.',
  ].join('\n');

  const system = params.mode === 'explicit' ? systemExplicit : systemAuto;

  const userContent = params.assistantReply
    ? 'User: ' + params.userMessage + '\n\nAssistant reply: ' + params.assistantReply
    : 'User: ' + params.userMessage;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 400,
    });

    const raw = res.choices[0]?.message?.content ?? '{"memories": []}';
    const parsed = JSON.parse(raw) as { memories?: Array<{ content?: string; category?: string; importance?: number }> };
    const items = parsed.memories ?? [];

    return items
      .filter((m) => m.content && m.content.trim().length > 5 && m.content.length < 220)
      .map((m) => ({
        content: m.content!.trim(),
        category: (['preference','fact','goal','context','general'].includes(m.category ?? '')
          ? m.category
          : 'general') as ExtractedMemory['category'],
        importance: Math.max(1, Math.min(5, Math.round(m.importance ?? 3))) as ExtractedMemory['importance'],
      }));
  } catch (e) {
    console.error('[memory.extract] failed:', e);
    return [];
  }
}
