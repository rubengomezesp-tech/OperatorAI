'use client';

import { createContext, useContext } from 'react';

export interface BrandAssets {
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
  logoFooterUrl: string | null;
}

const DEFAULT_ASSETS: BrandAssets = {
  logoUrl: null,
  iconUrl: null,
  avatarUrl: null,
  bgUrl: null,
  navChatUrl: null,
  navCampaignsUrl: null,
  navBrandUrl: null,
  navSettingsUrl: null,
  logoHomeUrl: null,
  logoLoginUrl: null,
  logoTopbarUrl: null,
  faviconUrl: null,
  pwaIconUrl: null,
  ogImageUrl: null,
  bgHomeUrl: null,
  bgOnboardingUrl: null,
  logoFooterUrl: null,
};

const BrandAssetsContext = createContext<BrandAssets>(DEFAULT_ASSETS);

export function BrandAssetsProvider({
  children,
  ...assets
}: Partial<BrandAssets> & { children: React.ReactNode }) {
  const value: BrandAssets = { ...DEFAULT_ASSETS, ...assets };
  return (
    <BrandAssetsContext.Provider value={value}>
      {children}
    </BrandAssetsContext.Provider>
  );
}

export function useBrandAssets() {
  return useContext(BrandAssetsContext);
}
