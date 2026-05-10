import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { executeIntegrationToolDirect } from '@/lib/chat/integration-tools';

export const runtime = 'nodejs';

/**
 * POST /api/integrations/execute-pending
 *
 * Endpoint llamado por las ActionCards inline (Email, Calendar, Slack)
 * cuando el user click [Confirm/Send].
 *
 * Bypass del flow de chat — ejecuta directo el tool de integración.
 *
 * Auth: required.
 * Validation: tool name must be in approved list.
 */

const ALLOWED_TOOLS = new Set([
  'gmail_send_email',
  'gcal_create_event',
  'slack_send_message',
]);

const BodySchema = z.object({
  tool_name: z.string().min(1),
  tool_input: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  if (!ALLOWED_TOOLS.has(parsed.data.tool_name)) {
    return NextResponse.json({ error: 'Tool not allowed via this endpoint' }, { status: 403 });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const result = await executeIntegrationToolDirect(parsed.data.tool_name, parsed.data.tool_input, {
      userId: user.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Tool execution failed';
    console.error('[execute-pending]', parsed.data.tool_name, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
