import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const d: Record<string, unknown> = {};
  const key = process.env.ANTHROPIC_API_KEY;
  d.key = key ? key.slice(0, 12) + '...' : 'MISSING';

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      tools: [{
        name: 'test_tool',
        description: 'Test',
        input_schema: { type: 'object' as const, properties: { x: { type: 'string' } }, required: ['x'] },
      }],
      messages: [{ role: 'user', content: 'Call test_tool with x="hello"' }],
    });
    d.ok = true;
    d.stop = res.stop_reason;
    d.types = res.content.map((c) => c.type);
    d.model = res.model;
  } catch (e) {
    d.ok = false;
    d.err = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(d);
}
