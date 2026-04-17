import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const ssr = await createSupabaseServerClient();
    const { data: { user } } = await ssr.auth.getUser();
    if (!user) return NextResponse.json({ feedback: [] });

    const svc = createSupabaseServiceClient();
    const { data } = await (svc as any)
      .from('feedback')
      .select('id, feedback_type, message_preview, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    return NextResponse.json({ feedback: data ?? [] });
  } catch {
    return NextResponse.json({ feedback: [] });
  }
}
