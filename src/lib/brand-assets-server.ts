import 'server-only';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

/**
 * BrandAssets — server-side helper to fetch current brand asset URLs
 * from Supabase Storage bucket 'brand-assets'.
 *
 * Returns null for assets that haven't been uploaded.
 */

export interface BrandAssetUrls {
  logoUrl: string | null;
  iconUrl: string | null;
  avatarUrl: string | null;
  bgUrl: string | null;
  navChatUrl: string | null;
  navCampaignsUrl: string | null;
  navBrandUrl: string | null;
  navSettingsUrl: string | null;
}

const ASSET_KEYS = [
  'logo-operator',
  'logo-icon',
  'operator-avatar',
  'operator-bg',
  'nav-chat',
  'nav-campaigns',
  'nav-brand',
  'nav-settings',
] as const;

export async function getBrandAssets(): Promise<BrandAssetUrls> {
  try {
    const svc = createSupabaseServiceClient();
    
    // List all files in the bucket once (cheaper than 4 separate queries)
    const { data: files, error } = await svc.storage
      .from('brand-assets')
      .list('', { limit: 100 });

    if (error || !files) {
      return { logoUrl: null, iconUrl: null, avatarUrl: null, bgUrl: null, navChatUrl: null, navCampaignsUrl: null, navBrandUrl: null, navSettingsUrl: null };
    }

    const fileNames = new Set(files.map((f) => f.name));

    function urlFor(key: string): string | null {
      const fileName = `${key}.png`;
      if (!fileNames.has(fileName)) return null;
      const { data } = svc.storage.from('brand-assets').getPublicUrl(fileName);
      // Cache-bust on every request so UI sees latest upload
      return `${data.publicUrl}?t=${Date.now()}`;
    }

    return {
      logoUrl: urlFor('logo-operator'),
      iconUrl: urlFor('logo-icon'),
      avatarUrl: urlFor('operator-avatar'),
      bgUrl: urlFor('operator-bg'),
      navChatUrl: urlFor('nav-chat'),
      navCampaignsUrl: urlFor('nav-campaigns'),
      navBrandUrl: urlFor('nav-brand'),
      navSettingsUrl: urlFor('nav-settings'),
    };
  } catch {
    return {
      logoUrl: null, iconUrl: null, avatarUrl: null, bgUrl: null,
      navChatUrl: null, navCampaignsUrl: null, navBrandUrl: null, navSettingsUrl: null,
    };
  }
}
