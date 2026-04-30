import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { isAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED_KEYS = ['logo-operator', 'logo-icon', 'operator-avatar', 'operator-bg', 'nav-chat', 'nav-campaigns', 'nav-brand', 'nav-settings'];

async function checkAdmin() {
  const ssr = await createSupabaseServerClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return null;
  if (!isAdmin(user.email)) return null;
  return user;
}

// GET — list current asset URLs
export async function GET() {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const svc = createSupabaseServiceClient();
  const urls: Record<string, string | null> = {};

  for (const key of ALLOWED_KEYS) {
    const fileName = `${key}.png`;
    const { data } = svc.storage.from('brand-assets').getPublicUrl(fileName);
    // Check existence
    const { data: list } = await svc.storage
      .from('brand-assets')
      .list('', { search: fileName });
    urls[key] = list && list.some((f) => f.name === fileName) ? `${data.publicUrl}?t=${Date.now()}` : null;
  }

  return NextResponse.json({ urls });
}

// POST — upload an asset
export async function POST(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const key = String(formData.get('key') ?? '');
    const file = formData.get('file') as File | null;

    if (!ALLOWED_KEYS.includes(key)) {
      return NextResponse.json({ error: 'Invalid asset key' }, { status: 400 });
    }
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const svc = createSupabaseServiceClient();
    const fileName = `${key}.png`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await svc.storage
      .from('brand-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '0',
      });

    if (error) {
      // If bucket doesn't exist, create it
      if (error.message.includes('not found') || error.message.includes('Bucket not found')) {
        return NextResponse.json({
          error: 'Bucket brand-assets not found. Create it in Supabase Dashboard → Storage (public).',
        }, { status: 500 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = svc.storage.from('brand-assets').getPublicUrl(fileName);
    return NextResponse.json({
      ok: true,
      url: `${data.publicUrl}?t=${Date.now()}`,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE — remove asset
export async function DELETE(req: NextRequest) {
  const user = await checkAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  if (!key || !ALLOWED_KEYS.includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  const svc = createSupabaseServiceClient();
  const { error } = await svc.storage.from('brand-assets').remove([`${key}.png`]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
