import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  error_message: z.string().min(1).max(5000),
  conversation_id: z.string().nullable().optional(),
  consecutive_failures: z.number().int().min(1).max(99).optional(),
  context: z.record(z.unknown()).optional(),
  user_agent: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();

    const insert = {
      user_id: user.id,
      conversation_id: body.data.conversation_id ?? null,
      error_message: body.data.error_message,
      error_context: body.data.context ?? {},
      consecutive_failures: body.data.consecutive_failures ?? 1,
      user_agent: body.data.user_agent ?? req.headers.get('user-agent') ?? '',
      url: body.data.url ?? '',
    };

    // Cast to bypass strict types until db types regenerated post-migration
    const { data, error } = await (svc as unknown as {
      from: (table: string) => {
        insert: (rows: unknown) => {
          select: (cols: string) => {
            single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
          };
        };
      };
    })
      .from('error_reports')
      .insert(insert)
      .select('id')
      .single();

    if (error) {
      console.error('[error-report] Insert failed:', error.message);
      return NextResponse.json({ error: 'Could not save error report' }, { status: 500 });
    }

    // TODO: trigger email/push to admin if consecutive_failures >= 3
    // (deferred to next iteration to keep this step focused)

    return NextResponse.json({
      ok: true,
      report_id: (data as { id: string }).id,
    });
  } catch (e) {
    console.error('[error-report] Exception:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
