'use client';

import { createContext, useContext } from 'react';

export interface BrandAssets {
  logoUrl: string | null;
  iconUrl: string | null;
  avatarUrl: string | null;
  bgUrl: string | null;
}

const BrandAssetsContext = createContext<BrandAssets>({
  logoUrl: null,
  iconUrl: null,
  avatarUrl: null,
  bgUrl: null,
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
