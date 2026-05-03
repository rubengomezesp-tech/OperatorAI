import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { DEFAULT_HOME_CONTENT, type HomeContent } from '@/lib/home-content/defaults';

export const runtime = 'nodejs';
export const revalidate = 60;

/**
 * GET /api/home-content
 * Devuelve el contenido del home: defaults + overrides desde app_settings.extra.home
 */
export async function GET() {
  try {
    const svc = createSupabaseServiceClient();
    const { data } = await (svc as any).from('app_settings').select('extra').eq('id', 'global').maybeSingle();

    const extra = (data as { extra?: { home?: Partial<HomeContent> } } | null)?.extra ?? {};
    const overrides = extra.home ?? {};

    // Merge superficial: cualquier campo top-level que el admin haya editado sobrescribe el default
    const merged: HomeContent = { ...DEFAULT_HOME_CONTENT, ...overrides } as HomeContent;

    return NextResponse.json({ content: merged });
  } catch {
    return NextResponse.json({ content: DEFAULT_HOME_CONTENT });
  }
}
