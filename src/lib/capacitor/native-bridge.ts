'use client';

/**
 * Capacitor native bridge.
 *
 * Why this file: we need a single place that detects whether the
 * app is running inside the iOS native shell or a regular browser,
 * and exposes typed wrappers around Capacitor APIs that fall back
 * gracefully on web.
 *
 * Usage:
 *   import { isNativeApp, takePhoto, shareContent, getNetworkStatus } from '@/lib/capacitor/native-bridge';
 *
 *   if (isNativeApp()) { ... }
 */

let cachedNative: boolean | null = null;

export function isNativeApp(): boolean {
  if (cachedNative !== null) return cachedNative;
  if (typeof window === 'undefined') return false;
  // Capacitor sets `window.Capacitor` only inside the native shell
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  cachedNative = !!cap?.isNativePlatform?.();
  return cachedNative;
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } })
    .Capacitor;
  const p = cap?.getPlatform?.();
  if (p === 'ios') return 'ios';
  if (p === 'android') return 'android';
  return 'web';
}

// ────────────────────────────────────────────────────────────────
// CAMERA
// ────────────────────────────────────────────────────────────────

export interface PhotoResult {
  /** base64 data URL ready to display */
  dataUrl: string;
  /** mime */
  format: 'jpeg' | 'png' | 'webp';
}

/**
 * Take a photo (camera) or pick from library.
 * On web, falls back to a hidden <input type="file">.
 */
export async function takePhoto(
  source: 'camera' | 'library' = 'camera',
): Promise<PhotoResult | null> {
  if (isNativeApp()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
      });
      if (!photo.dataUrl) return null;
      return {
        dataUrl: photo.dataUrl,
        format: (photo.format as 'jpeg' | 'png' | 'webp') ?? 'jpeg',
      };
    } catch (err) {
      console.warn('[native-bridge] camera failed', err);
      return null;
    }
  }

  // Web fallback: open file picker
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          dataUrl: reader.result as string,
          format:
            file.type.includes('png')
              ? 'png'
              : file.type.includes('webp')
              ? 'webp'
              : 'jpeg',
        });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

// ────────────────────────────────────────────────────────────────
// SHARE
// ────────────────────────────────────────────────────────────────

export interface ShareInput {
  title?: string;
  text?: string;
  url?: string;
  /** native: array of file URIs; web: ignored */
  files?: string[];
}

/**
 * Share content via native share sheet (iOS/Android) or Web Share API.
 * Falls back to copying URL to clipboard on web if Web Share unavailable.
 */
export async function shareContent(input: ShareInput): Promise<boolean> {
  if (isNativeApp()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: input.title,
        text: input.text,
        url: input.url,
        files: input.files,
      });
      return true;
    } catch (err) {
      console.warn('[native-bridge] share failed', err);
      return false;
    }
  }

  // Web Share API (mobile browsers + Safari)
  type WebShareData = { title?: string; text?: string; url?: string };
  const navAny = navigator as Navigator & {
    share?: (data: WebShareData) => Promise<void>;
  };
  if (typeof navAny.share === 'function') {
    try {
      await navAny.share({
        title: input.title,
        text: input.text,
        url: input.url,
      });
      return true;
    } catch {
      return false;
    }
  }

  // Last resort: copy to clipboard
  if (input.url) {
    try {
      await navigator.clipboard.writeText(input.url);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

// ────────────────────────────────────────────────────────────────
// NETWORK
// ────────────────────────────────────────────────────────────────

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (isNativeApp()) {
    try {
      const { Network } = await import('@capacitor/network');
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    } catch {
      return { connected: true, connectionType: 'unknown' };
    }
  }

  // Web fallback
  return {
    connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  };
}

// ────────────────────────────────────────────────────────────────
// HAPTICS
// ────────────────────────────────────────────────────────────────

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export async function hapticImpact(
  intensity: HapticIntensity = 'medium',
): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const style =
      intensity === 'light'
        ? ImpactStyle.Light
        : intensity === 'heavy'
        ? ImpactStyle.Heavy
        : ImpactStyle.Medium;
    await Haptics.impact({ style });
  } catch {
    // no-op
  }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // no-op
  }
}

export async function hapticError(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import('@capacitor/haptics');
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // no-op
  }
}
