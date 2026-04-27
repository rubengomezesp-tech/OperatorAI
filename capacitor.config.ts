import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Operator AI — Capacitor configuration
 *
 * Strategy: Native Shell with remote URL
 *
 *   - The app loads https://www.operatoraiapp.com
 *   - But ADDS native value: IAP via RevenueCat, push notifications,
 *     deep links, native splash, native status bar
 *   - This is App Store-compliant when the native value is real
 *     (not a pure web wrapper)
 *
 * Why no webDir:
 *   - We don't bundle the web app locally — we use Vercel as the source of truth
 *   - This avoids:
 *     * Duplicating the web bundle in the .ipa
 *     * Server Actions / API routes breaking offline
 *     * Webhook callbacks / OAuth redirects breaking on bundled web
 *   - Tradeoff: app requires network. That's fine for an AI tool.
 *
 * Why iosScheme: 'https':
 *   - Required for cookies / sessions to work correctly
 *   - WKWebView treats capacitor:// as separate origin from https://
 *   - With iosScheme: 'https', cookies/sessions match the web
 */

const config: CapacitorConfig = {
  appId: 'com.operatorai.app',
  appName: 'Operator AI',

  // Server config — the app loads from production web
  server: {
    url: 'https://www.operatoraiapp.com',
    cleartext: false,
    iosScheme: 'https',
    androidScheme: 'https',
  },

  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0A0A0B',
    // Allow swipe-back gesture
    allowsLinkPreview: false,
    // Don't ZoomOnDoubleTap (better UX)
    scrollEnabled: true,
    // Don't override the user agent (keeps OAuth providers happy)
    overrideUserAgent: undefined,
  },

  android: {
    backgroundColor: '#0A0A0B',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0A0A0B',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0A0A0B',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'native',
      style: 'DARK',
      resizeOnFullScreen: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
