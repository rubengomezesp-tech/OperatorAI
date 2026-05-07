import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { name } = await req.json().catch(() => ({ name: '' }));
  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const ssr = await createSupabaseServerClient();
  const { data: { user }, error: userErr } = await ssr.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const svc = createSupabaseServiceClient();
  const slug = slugify(name) + '-' + Math.random().toString(36).slice(2, 7);

  // Insert org. The trigger `on_organization_created` will auto-create the owner membership.
  const { data: org, error: orgErr } = await svc
    .from('organizations')
    .insert({ name, slug, owner_user_id: user.id } as never)
    .select()
    .single();

  if (orgErr || !org) {
    return NextResponse.json(
      { error: orgErr?.message ?? 'Failed to create organization' },
      { status: 500 },
    );
  }

  const orgRow = org as { id: string };
  return NextResponse.json({ id: orgRow.id });
}
