import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';
export const revalidate = 60; // cache 60s

const VALID_KEYS = new Set([
  'logo-operator', 'logo-icon', 'operator-avatar', 'operator-bg',
  'nav-chat', 'nav-campaigns', 'nav-brand', 'nav-settings',
  'logo-home', 'logo-login', 'logo-topbar',
  'favicon', 'pwa-icon', 'og-image',
  'bg-home', 'bg-onboarding', 'logo-footer',
  'demo-fitness-1', 'demo-fitness-2', 'demo-fitness-3', 'demo-beauty-1', 'demo-beauty-2', 'demo-beauty-3', 'demo-real-estate-1', 'demo-real-estate-2', 'demo-real-estate-3', 'demo-restaurants-1', 'demo-restaurants-2', 'demo-restaurants-3', 'demo-ecommerce-1', 'demo-ecommerce-2', 'demo-ecommerce-3', 'demo-jewelry-1', 'demo-jewelry-2', 'demo-jewelry-3', 'demo-saas-1', 'demo-saas-2', 'demo-saas-3', 'demo-health-1', 'demo-health-2', 'demo-health-3', 'demo-travel-1', 'demo-travel-2', 'demo-travel-3',
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
