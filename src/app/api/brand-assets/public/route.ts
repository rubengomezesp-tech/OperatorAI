import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const revalidate = 60; // cache 60s

const VALID_KEYS = new Set([
  'logo-operator', 'logo-icon', 'operator-avatar', 'operator-bg',
  'nav-chat', 'nav-campaigns', 'nav-brand', 'nav-settings',
  'logo-home', 'logo-login', 'logo-topbar',
  'favicon', 'pwa-icon', 'og-image',
  'bg-home', 'bg-onboarding',
]);

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key || !VALID_KEYS.has(key)) {
    return NextResponse.json({ url: null }, { status: 200 });
  }

  try {
    const svc = createSupabaseServiceClient();
    const fileName = `${key}.png`;
    const { data: files } = await svc.storage.from('brand-assets').list('', { limit: 200 });
    const exists = files?.some((f) => f.name === fileName);
    if (!exists) return NextResponse.json({ url: null });

    const { data } = svc.storage.from('brand-assets').getPublicUrl(fileName);
    return NextResponse.json({ url: data.publicUrl });
  } catch {
    return NextResponse.json({ url: null });
  }
}
