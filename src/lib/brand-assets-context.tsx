'use client';

import { createContext, useContext } from 'react';

interface BrandAssets {
  logoUrl: string | null;
  avatarUrl: string | null;
}

const BrandAssetsContext = createContext<BrandAssets>({ logoUrl: null, avatarUrl: null });

export function BrandAssetsProvider({
  children,
  logoUrl,
  avatarUrl,
}: BrandAssets & { children: React.ReactNode }) {
  return (
    <BrandAssetsContext.Provider value={{ logoUrl, avatarUrl }}>
      {children}
    </BrandAssetsContext.Provider>
  );
}

export function useBrandAssets() {
  return useContext(BrandAssetsContext);
}
