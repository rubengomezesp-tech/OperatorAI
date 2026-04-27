'use client';

/**
 * useCapacitorPlatform — React hook that exposes:
 *   - platform: 'ios' | 'android' | 'web'
 *   - isNative: boolean
 *   - isOnline: live-updated network status
 *
 * Use this for conditional rendering of native-only UI
 * (e.g., camera button on iOS, fallback file input on web).
 */

import { useEffect, useState } from 'react';
import {
  isNativeApp,
  getPlatform,
  getNetworkStatus,
} from '@/lib/capacitor/native-bridge';

interface PlatformState {
  platform: 'ios' | 'android' | 'web';
  isNative: boolean;
  isOnline: boolean;
}

export function useCapacitorPlatform(): PlatformState {
  const [state, setState] = useState<PlatformState>({
    platform: 'web',
    isNative: false,
    isOnline: true,
  });

  useEffect(() => {
    let cancelled = false;
    let cleanupListener: (() => void) | null = null;

    (async () => {
      const platform = getPlatform();
      const isNative = isNativeApp();
      const status = await getNetworkStatus();

      if (cancelled) return;
      setState({
        platform,
        isNative,
        isOnline: status.connected,
      });

      // Subscribe to network changes if native
      if (isNative) {
        try {
          const { Network } = await import('@capacitor/network');
          const handle = await Network.addListener(
            'networkStatusChange',
            (next) => {
              setState((prev) => ({ ...prev, isOnline: next.connected }));
            },
          );
          cleanupListener = () => {
            handle.remove();
          };
        } catch {
          // no-op
        }
      } else if (typeof window !== 'undefined') {
        const onOnline = () =>
          setState((prev) => ({ ...prev, isOnline: true }));
        const onOffline = () =>
          setState((prev) => ({ ...prev, isOnline: false }));
        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);
        cleanupListener = () => {
          window.removeEventListener('online', onOnline);
          window.removeEventListener('offline', onOffline);
        };
      }
    })();

    return () => {
      cancelled = true;
      cleanupListener?.();
    };
  }, []);

  return state;
}
