import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const d: Record<string, unknown> = { timestamp: new Date().toISOString() };

  // 1. Anthropic key
  const key = process.env.ANTHROPIC_API_KEY;
  d.step1_key_present = !!key;
  d.step1_key_preview = key ? key.slice(0, 10) + '...' : 'MISSING';

  // 2. SDK installed
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    d.step2_sdk_ok = true;

    // 3. Real tool-use test
    if (key) {
      try {
        const client = new Anthropic({ apiKey: key });
        const res = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 200,
          tools: [{
            name: 'test_tool',
            description: 'Test tool',
            input_schema: { type: 'object' as const, properties: { x: { type: 'string' } }, required: ['x'] },
          }],
          messages: [{ role: 'user', content: 'Call test_tool with x="hello"' }],
        });
        d.step3_tool_call_ok = true;
        d.step3_stop_reason = res.stop_reason;
        d.step3_content_types = res.content.map((c) => c.type);
        d.step3_model = res.model;
      } catch (e) {
        d.step3_tool_call_ok = false;
        d.step3_error = e instanceof Error ? e.message : String(e);
      }
    }
  } catch (e) {
    d.step2_sdk_ok = false;
    d.step2_error = e instanceof Error ? e.message : String(e);
  }

  // 4. My tool specs
  try {
    const { TOOL_SPECS } = await import('@/lib/chat/tools');
    d.step4_tools_count = TOOL_SPECS.length;
    d.step4_tools_names = TOOL_SPECS.map((t) => t.name);
  } catch (e) {
    d.step4_error = e instanceof Error ? e.message : String(e);
  }

  // 5. Orchestrator
  try {
    const mod = await import('@/lib/orchestrator/run-chat-with-tools');
    d.step5_orchestrator_ok = typeof mod.runChatWithTools === 'function';
  } catch (e) {
    d.step5_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(d, { status: 200 });
}
