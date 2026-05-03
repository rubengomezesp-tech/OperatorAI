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
  logoHomeUrl: string | null;
  logoLoginUrl: string | null;
  logoTopbarUrl: string | null;
  faviconUrl: string | null;
  pwaIconUrl: string | null;
  ogImageUrl: string | null;
  bgHomeUrl: string | null;
  bgOnboardingUrl: string | null;
}

const EMPTY: BrandAssetUrls = {
  logoUrl: null, iconUrl: null, avatarUrl: null, bgUrl: null,
  navChatUrl: null, navCampaignsUrl: null, navBrandUrl: null, navSettingsUrl: null,
  logoHomeUrl: null, logoLoginUrl: null, logoTopbarUrl: null,
  faviconUrl: null, pwaIconUrl: null, ogImageUrl: null,
  bgHomeUrl: null, bgOnboardingUrl: null,
};

export async function getBrandAssets(): Promise<BrandAssetUrls> {
  try {
    const svc = createSupabaseServiceClient();

    const { data: files, error } = await svc.storage
      .from('brand-assets')
      .list('', { limit: 200 });

    if (error || !files) return EMPTY;

    const fileNames = new Set(files.map((f) => f.name));

    function urlFor(key: string): string | null {
      const fileName = `${key}.png`;
      if (!fileNames.has(fileName)) return null;
      const { data } = svc.storage.from('brand-assets').getPublicUrl(fileName);
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
      logoHomeUrl: urlFor('logo-home'),
      logoLoginUrl: urlFor('logo-login'),
      logoTopbarUrl: urlFor('logo-topbar'),
      faviconUrl: urlFor('favicon'),
      pwaIconUrl: urlFor('pwa-icon'),
      ogImageUrl: urlFor('og-image'),
      bgHomeUrl: urlFor('bg-home'),
      bgOnboardingUrl: urlFor('bg-onboarding'),
    };
  } catch {
    return EMPTY;
  }
}
