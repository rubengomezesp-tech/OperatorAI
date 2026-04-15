import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { webSearch } from '@/features/web-browse/server/web-search';

export const runtime = 'nodejs';

const BodySchema = z.object({
  query: z.string().min(1).max(500),
  count: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const results = await webSearch(parsed.data.query, parsed.data.count ?? 5);
  return NextResponse.json({ results });
}
