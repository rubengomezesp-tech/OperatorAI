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
}

const BrandAssetsContext = createContext<BrandAssets>({
  logoUrl: null,
  iconUrl: null,
  avatarUrl: null,
  bgUrl: null,
  navChatUrl: null,
  navCampaignsUrl: null,
  navBrandUrl: null,
  navSettingsUrl: null,
});

export function BrandAssetsProvider({
  children,
  ...assets
}: BrandAssets & { children: React.ReactNode }) {
  return (
    <BrandAssetsContext.Provider value={assets}>
      {children}
    </BrandAssetsContext.Provider>
  );
}

export function useBrandAssets() {
  return useContext(BrandAssetsContext);
}
