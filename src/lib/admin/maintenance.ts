import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

interface SettingsRow {
  maintenance_mode: boolean | null;
  extra: { chat_disabled?: boolean; ads_disabled?: boolean } | null;
}

let cached: SettingsRow | null = null;
let cachedAt = 0;
const TTL_MS = 30_000; // 30s cache para no hacer query en cada request

async function getSettings(): Promise<SettingsRow> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached;

  const svc = createSupabaseServiceClient();
  const { data } = await (svc as unknown as { from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { maybeSingle: () => Promise<{ data: SettingsRow | null }> } } } })
    .from('app_settings')
    .select('maintenance_mode, extra')
    .eq('id', 'global')
    .maybeSingle();

  cached = data ?? { maintenance_mode: false, extra: {} };
  cachedAt = now;
  return cached;
}

export async function isMaintenanceMode(): Promise<boolean> {
  const s = await getSettings();
  return s.maintenance_mode === true;
}

export async function isChatDisabled(): Promise<boolean> {
  const s = await getSettings();
  return s.extra?.chat_disabled === true;
}

export async function isAdsDisabled(): Promise<boolean> {
  const s = await getSettings();
  return s.extra?.ads_disabled === true;
}

// Para invalidar el cache cuando admin cambia el setting
export function invalidateMaintenanceCache(): void {
  cached = null;
  cachedAt = 0;
}
