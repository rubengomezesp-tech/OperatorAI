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
    contentInset: 'always',
    backgroundColor: '#0A0A0B',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
};

export default config;
