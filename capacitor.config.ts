import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.operatorai.app',
  appName: 'Operator AI',
  webDir: 'out',
  server: {
    url: 'https://www.operatoraiapp.com',
    cleartext: false,
  },
  ios: {
    scheme: 'Operator AI',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0A0A0B',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0A0A0B',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0A0A0B',
    },
  },
};

export default config;
