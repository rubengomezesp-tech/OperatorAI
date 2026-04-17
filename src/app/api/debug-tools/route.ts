import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // 1. Check ANTHROPIC_API_KEY
  const key = process.env.ANTHROPIC_API_KEY;
  diagnostics.anthropic_key_present = !!key;
  diagnostics.anthropic_key_starts_with = key ? key.slice(0, 10) : 'MISSING';

  // 2. Check @anthropic-ai/sdk is installed
  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    diagnostics.anthropic_sdk_installed = true;

    // 3. Try a minimal tool-use call
    if (key) {
      try {
        const client = new Anthropic({ apiKey: key });
        const res = await client.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 200,
          tools: [
            {
              name: 'test_tool',
              description: 'A test tool that does nothing',
              input_schema: {
                type: 'object',
                properties: { arg: { type: 'string' } },
                required: ['arg'],
              },
            },
          ],
          messages: [
            { role: 'user', content: 'Please call the test_tool with arg="hello" to confirm tool use works.' },
          ],
        });
        diagnostics.anthropic_test_call_ok = true;
        diagnostics.anthropic_stop_reason = res.stop_reason;
        diagnostics.anthropic_content_types = res.content.map((c) => c.type);
        diagnostics.anthropic_model_returned = res.model;
      } catch (e) {
        diagnostics.anthropic_test_call_ok = false;
        diagnostics.anthropic_test_error = e instanceof Error ? e.message : String(e);
      }
    }
  } catch (e) {
    diagnostics.anthropic_sdk_installed = false;
    diagnostics.sdk_import_error = e instanceof Error ? e.message : String(e);
  }

  // 4. Check TOOL_SPECS loads
  try {
    const { TOOL_SPECS } = await import('@/lib/chat/tools');
    diagnostics.tool_specs_count = TOOL_SPECS.length;
    diagnostics.tool_specs_names = TOOL_SPECS.map((t) => t.name);
  } catch (e) {
    diagnostics.tool_specs_error = e instanceof Error ? e.message : String(e);
  }

  // 5. Check orchestrator loads
  try {
    const mod = await import('@/lib/orchestrator/run-chat-with-tools');
    diagnostics.orchestrator_loaded = typeof mod.runChatWithTools === 'function';
  } catch (e) {
    diagnostics.orchestrator_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
